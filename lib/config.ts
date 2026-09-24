// Brand + arc config. Change these in one place.
export const APP_NAME = "SquadArc";
export const ARC_NAME = "Winter Arc 2026";
export const ARC_DAYS = 90;

// Arc starts at local midnight on this date, wherever the user is. Update to the real start day.
export const ARC_START_DATE = "2026-10-01";

// NEXT_PUBLIC_SITE_URL wins; on Vercel, fall back to the project's production domain.
function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    "localhost:3000";
  const withProtocol = /^https?:\/\//.test(raw)
    ? raw
    : `${raw.startsWith("localhost") ? "http" : "https"}://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const SITE_URL = siteUrl();

export const TAGLINE = "Get locked in with your city.";
export const DESCRIPTION =
  "90 days. Daily check-ins. Streaks. Leaderboards for your city, college and squad, worldwide. Join the waitlist for Winter Arc 2026.";
