// Brand + arc config. Change these in one place.
export const APP_NAME = "SquadArc";
export const ARC_NAME = "Winter Arc 2026";
export const ARC_DAYS = 90;

// Arc starts at local midnight on this date, wherever the user is. Update to the real start day.
export const ARC_START_DATE = "2026-10-01";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const TAGLINE = "Get locked in with your city.";
export const DESCRIPTION =
  "90 days. Daily check-ins. Streaks. Leaderboards for your city, college and squad, worldwide. Join the waitlist for Winter Arc 2026.";
