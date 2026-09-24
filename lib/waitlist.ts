import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

export type CityCount = { city: string; country: string; count: number };
export type WaitlistStats = { total: number; cities: CityCount[] };
export type WaitlistEntry = {
  position: number;
  ref_code: string;
  city: string;
  country: string;
  city_count: number;
  referrals: number;
};
export type JoinInput = {
  name: string;
  email: string;
  country: string;
  city: string;
  referredBy: string | null;
};

// ---------- Supabase ----------

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient | null {
  // Accept the REST endpoint too ("…supabase.co/rest/v1/"); the client wants the project URL.
  const url = process.env.SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

function newCode() {
  // 8 chars, no ambiguous characters.
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// ---------- In-memory fallback (local dev without Supabase) ----------

type Row = JoinInput & { ref_code: string; created_at: number };
const g = globalThis as unknown as { __waitlist?: Row[] };
const memory = (g.__waitlist ??= []);

function memoryStore() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return memory;
}

function memoryEntry(rows: Row[], code: string): WaitlistEntry | null {
  const idx = rows.findIndex((r) => r.ref_code === code);
  if (idx === -1) return null;
  const row = rows[idx];
  return {
    position: idx + 1,
    ref_code: row.ref_code,
    city: row.city,
    country: row.country,
    city_count: rows.filter((r) => r.city === row.city && r.country === row.country).length,
    referrals: rows.filter((r) => r.referredBy === code).length,
  };
}

// ---------- Public API ----------

export async function getStats(): Promise<WaitlistStats> {
  const db = supabase();
  if (!db) {
    const rows = memoryStore();
    const counts = new Map<string, CityCount>();
    for (const r of rows) {
      const key = `${r.country}|${r.city}`;
      const c = counts.get(key) ?? { city: r.city, country: r.country, count: 0 };
      c.count++;
      counts.set(key, c);
    }
    const cities = [...counts.values()]
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
      .slice(0, 5);
    return { total: rows.length, cities };
  }
  const { data, error } = await db.rpc("waitlist_stats", { city_limit: 5 });
  if (error) {
    console.error("waitlist_stats failed", error);
    return { total: 0, cities: [] };
  }
  return data as WaitlistStats;
}

export async function getEntry(code: string): Promise<WaitlistEntry | null> {
  const db = supabase();
  if (!db) return memoryEntry(memoryStore(), code);
  const { data, error } = await db.rpc("waitlist_entry", { code });
  if (error) throw error;
  return (data as WaitlistEntry | null) ?? null;
}

/** Adds someone to the waitlist. Re-joining with the same email returns the existing entry. */
export async function join(input: JoinInput): Promise<WaitlistEntry> {
  const email = input.email.toLowerCase();
  const db = supabase();

  if (!db) {
    const rows = memoryStore();
    const existing = rows.find((r) => r.email === email);
    if (existing) return memoryEntry(rows, existing.ref_code)!;
    const referredBy = rows.some((r) => r.ref_code === input.referredBy)
      ? input.referredBy
      : null;
    const row: Row = { ...input, email, referredBy, ref_code: newCode(), created_at: Date.now() };
    rows.push(row);
    return memoryEntry(rows, row.ref_code)!;
  }

  const { data: existing, error: findError } = await db
    .from("waitlist")
    .select("ref_code")
    .eq("email", email)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return (await getEntry(existing.ref_code))!;

  let referredBy: string | null = null;
  if (input.referredBy) {
    const { data } = await db
      .from("waitlist")
      .select("ref_code")
      .eq("ref_code", input.referredBy)
      .maybeSingle();
    referredBy = data?.ref_code ?? null;
  }

  const ref_code = newCode();
  const { error } = await db.from("waitlist").insert({
    name: input.name,
    email,
    country: input.country,
    city: input.city,
    ref_code,
    referred_by: referredBy,
  });
  if (error) {
    // Unique violation from a concurrent double-submit: return what's there.
    if (error.code === "23505") {
      const { data } = await db.from("waitlist").select("ref_code").eq("email", email).single();
      if (data) return (await getEntry(data.ref_code))!;
    }
    throw error;
  }
  return (await getEntry(ref_code))!;
}
