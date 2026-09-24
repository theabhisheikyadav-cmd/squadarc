import { Countdown } from "@/components/countdown";
import { WaitlistForm } from "@/components/waitlist-form";
import { headers } from "next/headers";
import { APP_NAME, ARC_DAYS, ARC_NAME, ARC_START_DATE, TAGLINE } from "@/lib/config";
import { COUNTRIES, countryName, flag, isCountryCode } from "@/lib/countries";
import { getStats } from "@/lib/waitlist";

const nf = new Intl.NumberFormat("en-US");

const STEPS = [
  { n: "01", title: "Pick 3–5 daily goals", body: "Study, gym, reading, no-scroll, sleep, or your own." },
  { n: "02", title: "Check in every day", body: "One tap per goal. Miss a day and your streak resets." },
  { n: "03", title: "Climb your city", body: "Weekly and overall ranks for your city, college, friends and squad." },
];

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref.slice(0, 16) : null;
  const stats = await getStats();
  // Hosting platforms pass the visitor's country; used only to pre-fill the form.
  const h = await headers();
  const geo = (h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? "").toUpperCase();
  const defaultCountry = isCountryCode(geo) ? geo : null;
  const topCount = stats.cities[0]?.count ?? 0;

  return (
    <main className="frost flex-1">
      <div className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 sm:max-w-lg">
        <header className="flex items-center justify-between py-5">
          <span className="font-display text-2xl tracking-wide text-fg">{APP_NAME}</span>
          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            {ARC_DAYS} days · starts {new Date(`${ARC_START_DATE}T12:00:00Z`).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" })}
          </span>
        </header>

        {/* Hero */}
        <section className="pt-8 text-center">
          <h1 className="font-display text-[3.5rem] uppercase leading-[0.95] text-fg sm:text-7xl">
            {ARC_NAME}.
          </h1>
          <p className="mt-3 text-xl text-ice sm:text-2xl">{TAGLINE}</p>
          <p className="mx-auto mt-4 max-w-sm text-base text-muted">
            {ARC_DAYS} days of daily check-ins, streaks and leaderboards against your city, college and friends, anywhere in the world.
          </p>

          <p className="mt-6 inline-flex items-center gap-2 text-sm text-fg">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-flame opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-flame" />
            </span>
            {stats.total > 0 ? (
              <span>
                <strong className="tabular-nums">{nf.format(stats.total)}</strong>{" "}
                {stats.total === 1 ? "person" : "people"} already on the list
              </span>
            ) : (
              <span>Be the first one on the list</span>
            )}
          </p>

          <div className="mt-6 flex justify-center">
            <Countdown date={ARC_START_DATE} />
          </div>
        </section>

        {/* Form */}
        <section id="join" className="mt-8 scroll-mt-6 rounded-3xl border border-line bg-bg/80 p-5 backdrop-blur">
          {ref && (
            <p className="mb-4 rounded-xl bg-ice/10 px-4 py-2 text-center text-sm text-ice">
              A friend invited you. Join and you&apos;ll start the arc together.
            </p>
          )}
          <WaitlistForm referredBy={ref} defaultCountry={defaultCountry} countries={COUNTRIES} />
        </section>

        {/* Product teaser */}
        <section className="mt-16">
          <h2 className="text-center text-sm uppercase tracking-[0.2em] text-muted">What your day looks like</h2>
          <div className="mx-auto mt-5 max-w-xs rounded-[2rem] border border-line bg-surface p-5 shadow-2xl shadow-ice/5">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-3xl text-fg">DAY 12</p>
              <p className="text-sm text-muted">of {ARC_DAYS}</p>
            </div>
            <ul className="mt-4 flex flex-col gap-2">
              {[
                ["Study 3 hours", true],
                ["Gym", true],
                ["Read 20 pages", true],
                ["No reels before 9pm", false],
              ].map(([label, done]) => (
                <li
                  key={label as string}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm ${
                    done ? "border-ice/40 bg-ice/10 text-fg" : "border-line text-muted"
                  }`}
                >
                  <span
                    className={`grid size-5 place-items-center rounded-md text-xs ${
                      done ? "bg-ice text-bg" : "border border-line"
                    }`}
                    aria-hidden
                  >
                    {done ? "✓" : ""}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat value="75" label="score" />
              <Stat value="🔥 12" label="streak" />
              <Stat value="#4" label="in your city" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-16">
          <h2 className="text-center text-sm uppercase tracking-[0.2em] text-muted">How it works</h2>
          <ol className="mt-5 flex flex-col gap-3">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
                <span className="font-mono text-sm text-ice">{s.n}</span>
                <div>
                  <p className="font-semibold text-fg">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* City race */}
        <section className="mt-16">
          <h2 className="text-center text-sm uppercase tracking-[0.2em] text-muted">City race</h2>
          <p className="mt-2 text-center text-lg text-fg">Which city in the world is most locked in?</p>
          {stats.cities.length > 0 ? (
            <ol className="mt-5 flex flex-col gap-2">
              {stats.cities.map((c, i) => (
                <li key={`${c.country}-${c.city}`} className="relative overflow-hidden rounded-xl border border-line bg-surface px-4 py-3">
                  <div
                    className="absolute inset-y-0 left-0 bg-ice/10"
                    style={{ width: `${Math.max(8, (c.count / topCount) * 100)}%` }}
                    aria-hidden
                  />
                  <div className="relative flex items-center justify-between text-sm">
                    <span className="text-fg">
                      <span className="mr-3 font-mono text-muted">#{i + 1}</span>
                      <span className="mr-2" title={countryName(c.country)}>{flag(c.country)}</span>
                      {c.city}
                    </span>
                    <span className="font-mono tabular-nums text-fg">{nf.format(c.count)}</span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
              No city has claimed #1 yet. Put yours on the board.
            </p>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 text-center">
          <p className="font-display text-4xl uppercase leading-none text-fg">No more &ldquo;from Monday&rdquo;.</p>
          <a
            href="#join"
            className="mt-6 inline-block rounded-xl bg-ice px-6 py-4 font-semibold text-bg transition hover:brightness-110"
          >
            Save my spot
          </a>
        </section>

        <footer className="mt-16 text-center text-xs text-muted">
          © {new Date().getFullYear()} {APP_NAME}
        </footer>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-bg py-2">
      <p className="font-semibold text-fg">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
