"use client";

import { startTransition, useActionState, useState } from "react";
import { joinWaitlist, type JoinState } from "@/app/actions";
import { flag } from "@/lib/countries";
import { CityCombobox } from "./city-combobox";
import { APP_NAME, ARC_NAME } from "@/lib/config";
import type { WaitlistEntry } from "@/lib/waitlist";

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-base text-fg placeholder:text-muted outline-none transition focus:border-ice focus:ring-2 focus:ring-ice/30 aria-[invalid=true]:border-flame";

export function WaitlistForm({
  referredBy,
  defaultCountry,
  countries,
}: {
  referredBy: string | null;
  defaultCountry: string | null;
  // Built on the server: browser and Node can name some countries differently.
  countries: { code: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinWaitlist, {
    status: "idle",
  });
  const [country, setCountry] = useState(defaultCountry ?? "");

  if (state.status === "joined") return <Joined entry={state.entry} />;

  const fieldErrors = state.status === "error" ? state.fields : undefined;
  // Without JS, the form posts and React resets it; refill it with what was typed.
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form
      action={action}
      // With JS, submit manually so a failed submit doesn't clear the fields.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="flex flex-col gap-3"
      noValidate
    >
      <input type="hidden" name="ref" value={referredBy ?? ""} />
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <label className="sr-only" htmlFor="name">Name</label>
      <input
        id="name"
        name="name"
        autoComplete="name"
        defaultValue={values?.name}
        placeholder="Your name"
        required
        aria-invalid={!!fieldErrors?.name}
        className={inputClass}
      />
      {fieldErrors?.name && <p className="-mt-1 text-sm text-flame">{fieldErrors.name}</p>}

      <label className="sr-only" htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={values?.email}
        placeholder="you@email.com"
        required
        aria-invalid={!!fieldErrors?.email}
        className={inputClass}
      />
      {fieldErrors?.email && <p className="-mt-1 text-sm text-flame">{fieldErrors.email}</p>}

      <label className="sr-only" htmlFor="country">Country</label>
      <select
        id="country"
        name="country"
        required
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        aria-invalid={!!fieldErrors?.country}
        className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22><path d=%22M2 4l4 4 4-4%22 fill=%22none%22 stroke=%22%238b95a5%22 stroke-width=%221.6%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat ${country ? "" : "text-muted"}`}
      >
        <option value="" disabled>Your country</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>
      {fieldErrors?.country && <p className="-mt-1 text-sm text-flame">{fieldErrors.country}</p>}

      <label className="sr-only" htmlFor="city">City</label>
      <CityCombobox
        country={country}
        defaultValue={values?.city}
        invalid={!!fieldErrors?.city}
        className={inputClass}
      />
      {fieldErrors?.city && <p className="-mt-1 text-sm text-flame">{fieldErrors.city}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-xl bg-ice px-5 py-4 text-base font-semibold text-bg transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Locking you in…" : "Join the waitlist"}
      </button>

      {state.status === "error" && !fieldErrors && (
        <p className="text-sm text-flame" role="alert">{state.message}</p>
      )}
      <p className="text-center text-xs text-muted">
        No spam. One email when {ARC_NAME} opens.
      </p>
    </form>
  );
}

function Joined({ entry }: { entry: WaitlistEntry }) {
  const [copied, setCopied] = useState(false);

  const link = () => `${window.location.origin}/?ref=${entry.ref_code}`;
  const message = () =>
    `I'm locking in for ${ARC_NAME} on ${APP_NAME}. 90 days, daily check-ins, leaderboards for your city and friends. Join my squad: ${link()}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: APP_NAME, text: message() });
        return;
      } catch {
        // User cancelled; fall through to copy.
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your invite link", link());
    }
  }

  return (
    <div className="flex flex-col gap-4" role="status">
      <div className="rounded-2xl border border-ice/40 bg-ice/5 p-5 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-ice">You&apos;re locked in</p>
        <p className="mt-2 font-display text-6xl leading-none text-fg">#{entry.position}</p>
        <p className="mt-2 text-sm text-muted">
          on the list · {entry.city_count} from {entry.city} {flag(entry.country)}
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="font-semibold text-fg">Bring your squad</p>
        <p className="mt-1 text-sm text-muted">
          Arcs are easier with people watching. Squads that join together start together.
        </p>
        {entry.referrals > 0 && (
          <p className="mt-2 text-sm text-ice">
            {entry.referrals} {entry.referrals === 1 ? "friend has" : "friends have"} joined with your link.
          </p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={share}
            className="rounded-xl bg-ice px-4 py-3 font-semibold text-bg transition hover:brightness-110"
          >
            Share
          </button>
          <button
            onClick={copy}
            className="rounded-xl border border-line px-4 py-3 font-semibold text-fg transition hover:border-ice"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            typeof window === "undefined" ? "" : message(),
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block rounded-xl border border-line px-4 py-3 text-center font-semibold text-fg transition hover:border-[#25D366]"
        >
          Send on WhatsApp
        </a>
      </div>
    </div>
  );
}
