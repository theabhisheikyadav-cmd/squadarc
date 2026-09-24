"use server";

import { refresh } from "next/cache";
import { findCity } from "@/lib/city-search";
import { isCountryCode } from "@/lib/countries";
import { join, type WaitlistEntry } from "@/lib/waitlist";

export type JoinState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fields?: Partial<Record<Field, string>>;
      values?: Record<Field, string>;
    }
  | { status: "joined"; entry: WaitlistEntry };

type Field = "name" | "email" | "country" | "city";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Tidy a typed city so the same place groups together: "bokaro steel city" / "BOKARO STEEL CITY"
// -> "Bokaro Steel City". Words with their own capitals ("McAllen") are left as typed.
const LOWER_WORDS = new Set(["de", "da", "do", "di", "del", "la", "le", "of", "the", "and", "on", "upon", "am", "sur"]);

function tidyCity(city: string) {
  const collapsed = city.replace(/\s+/g, " ");
  const text = collapsed === collapsed.toUpperCase() ? collapsed.toLowerCase() : collapsed;
  return text
    .split(" ")
    .map((word, i) =>
      word !== word.toLowerCase() || (i > 0 && LOWER_WORDS.has(word))
        ? word
        : word.replace(/(^|-)\p{L}/gu, (m) => m.toUpperCase()),
    )
    .join(" ");
}

export async function joinWaitlist(_prev: JoinState, formData: FormData): Promise<JoinState> {
  // Honeypot: real people never fill this hidden field.
  if (clean(formData.get("website"), 100)) {
    return { status: "error", message: "Something went wrong. Try again." };
  }

  const name = clean(formData.get("name"), 80).replace(/\s+/g, " ");
  const email = clean(formData.get("email"), 254);
  const country = clean(formData.get("country"), 2).toUpperCase();
  const typedCity = clean(formData.get("city"), 80);
  const ref = clean(formData.get("ref"), 16).toLowerCase() || null;

  const values = { name, email, country, city: typedCity };
  const fields: Partial<Record<Field, string>> = {};
  if (!name) fields.name = "Enter your name.";
  if (!EMAIL_RE.test(email)) fields.email = "Enter a valid email.";
  if (!isCountryCode(country)) fields.country = "Pick your country.";
  if (typedCity.length < 2) fields.city = "Pick or type your city.";
  if (Object.keys(fields).length > 0) {
    return { status: "error", message: "Fix the highlighted fields.", fields, values };
  }

  try {
    // Use the dataset's spelling when the city is known; otherwise tidy what was typed.
    const city = (await findCity(country, typedCity)) ?? tidyCity(typedCity);
    const entry = await join({ name, email, country, city, referredBy: ref });
    refresh();
    return { status: "joined", entry };
  } catch (err) {
    console.error("joinWaitlist failed", err);
    return { status: "error", message: "Couldn't save that. Try again in a moment.", values };
  }
}
