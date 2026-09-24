# SquadArc — Winter Arc 2026 waitlist

Waitlist page for SquadArc. Next.js (App Router) + Supabase.

## Run locally

```bash
npm install
npm run dev
```

With no Supabase env vars, signups go to an in-memory list (it resets when the server restarts). This fallback only works in dev; production requires Supabase.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/0001_waitlist.sql` in the SQL editor (or `supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Config

Brand name, arc name, start date and length live in `lib/config.ts`.

## Export signups

```sql
select name, email, country, city, referred_by, created_at from waitlist order by created_at;
```
