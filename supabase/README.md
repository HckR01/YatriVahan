# Supabase setup

This folder is the source of truth for YatriVahan's database, authorization rules,
realtime subscriptions, and public image bucket.

## Apply the schema

1. Create a Supabase project.
2. Install and authenticate the Supabase CLI.
3. Link this repository: `supabase link --project-ref YOUR_PROJECT_REF`.
4. Apply migrations: `supabase db push`.
5. Optionally create two users in Authentication and run `supabase db reset` locally,
   or execute `seed.sql` in the SQL editor to add demo records.

For an entirely local stack, run `supabase start` from the repository root. The
committed `config.toml` uses Vite's `http://localhost:5173` URL and standard local
Supabase ports. Local Supabase requires a Docker-compatible runtime.

The first migration creates user profiles, vehicles, rides, stops, bookings, live
locations, carpool groups/chat, ratings, and notifications. It also enables row-level
security for every application table. A profile is created automatically whenever a
new Supabase Auth user is registered.

The second migration adds selected tables to Supabase Realtime and creates the
`public-media` Storage bucket. Upload files to `<auth-user-id>/filename.ext`; RLS prevents
users from modifying another user's files.

## Security model

- The browser receives only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never use the `VITE_` prefix.
- The backend validates the user's Supabase access token before protected requests.
- Application-table writes are API-only. Browser roles receive RLS-filtered reads for
  Realtime and a narrow self-profile update grant; the service role is used only by the
  API after its explicit ownership, membership, and state-transition checks.
- Public media is for avatars and vehicle photos only. Do not upload identity documents.
- Production should add abuse prevention, driver/KYC review, payment-provider webhooks,
  location retention jobs, and emergency-response processes before carrying real riders.

## Realtime channels

The web app and Socket.IO server use ride-scoped rooms (`ride:<ride-id>`). Supabase
Realtime is also enabled for rides, bookings, ride locations, notifications, and group
messages, which makes it possible to run multiple backend instances without losing
database-originated state changes.

