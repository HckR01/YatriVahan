# YatriVahan

React + Express + Supabase application combining carpool seats, full-car reservations,
on-demand ride requests, travel groups, and Socket.IO map tracking.

## Run locally

Use Node.js 22. Run `npm ci` and `npm --prefix backend ci`.

Create a Supabase project. Apply both SQL migrations under `supabase/migrations` in
timestamp order, or run `supabase link --project-ref YOUR_REF` then `supabase db push`.
See [Supabase setup](supabase/README.md).

Copy root `.env.example` to `.env` and populate its Supabase URL and anon/publishable
key. Copy `backend/.env.example` to `backend/.env` and configure its Supabase URL,
anon key, and server-only service-role key. Never commit credentials.

In separate terminals, run `npm --prefix backend run dev` and `npm run dev`.
Frontend: http://localhost:5173. Backend: http://localhost:4000.

Without Supabase environment values the frontend uses labelled browser demo data.
Configured sessions never save failed API mutations as demo records.

## Included

- Supabase email/password auth and protected routes.
- Carpool search/offers, seat booking, private/on-demand ride requests.
- Driver dashboard at `/driver` to accept requests and manage trips.
- Leaflet/OpenStreetMap location selection, maps, and driver GPS tracking.
- Authenticated Socket.IO rooms, destination/status updates, and group chat.
- Profiles, vehicles, bookings, notifications, capacity enforcement, and database RLS.

## Administrator panel

Open `/admine` (`/admin` redirects there). Set `ADMIN_USERNAME` and
`ADMIN_PASSWORD_HASH` only on the backend, never in `VITE_*`, source code, or GitHub.
Generate a salted password hash with `npm --prefix backend run admin:password` and
copy the printed hash into your backend environment. With either setting missing,
admin login is disabled. Render's blueprint prompts for both values.
Quote the `ADMIN_USERNAME` value in `.env` if it contains `#`.

The panel lists registered users and vehicle registrations, allows approval/revocation,
and promotes approved rider-only accounts to `both` so they can offer rides or drive cabs.
No additional SQL migration is required: it uses the existing `profiles.is_verified` field.
Check identity and documents offline before approval; this is not automated KYC.
API routes are `/api/v1/admin/login`, `/session`, `/logout`, `/users?page=1`, and
`PATCH /users/:userId/verification` with `{ "verified": true }` or `false`.
Authentication is rate-limited and server-side. Admin tokens expire after one hour,
are kept only in browser memory, and are revoked on logout or API restart.
Use HTTPS and one backend instance; multiple instances need a shared session store.
Changing the credentials requires restarting the backend to revoke existing sessions.

## Verify

```sh
npm run lint
npm run build
npm --prefix backend test
npm --prefix backend run check
```

GitHub Actions runs these checks on pushes and pull requests.

## Deploy

Deploy the frontend to Vercel using `vercel.json`. Set `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (ending in `/api/v1`), and `VITE_SOCKET_URL`
before building. Deploy `backend/` as a persistent Node service with WebSocket support:
install `npm ci`, start `npm start`, health path `/api/v1/health`.

Set backend Supabase variables, `NODE_ENV=production`, and `CLIENT_ORIGINS` to the
frontend URL. Configure Supabase Auth Site URL and redirect URLs accordingly.
Production driver approval requires profile role `driver`/`both` and `is_verified=true`;
self-profile edits cannot set these fields. See `backend/.env.example`.

## Remaining deployment requirements

This is a full-stack MVP. Online payments, SMS/phone OTP, automated KYC, production
dispatch/pricing, and operational emergency support need configured providers.
Public map/geocoding services require a production provider for larger traffic.
Socket.IO uses an in-memory adapter: run one API instance or configure a shared adapter.
GPS requires user permission and HTTPS when deployed. Applying migrations and testing
multi-user trips on your actual Supabase project remain necessary before launch.

See [API and realtime contracts](backend/README.md).
