# YatriVahan backend

Production-minded MVP API for YatriVahan's carpool, full-car, and on-demand ride flows. It uses Express 5, Supabase Auth/Postgres, Zod validation, and Socket.IO live trip rooms.

## Run locally

Requirements: Node.js 20+, npm, and a Supabase project.

1. Apply [`../supabase/migrations/202610070001_initial_schema.sql`](../supabase/migrations/202610070001_initial_schema.sql) in the Supabase SQL editor or with the Supabase CLI.
2. Copy `.env.example` to `.env` and set the three Supabase values.
3. Install and start the service:

```bash
npm install
npm run dev
```

The default HTTP and Socket.IO origin is `http://localhost:4000`. The frontend is allowed from `http://localhost:5173` by default.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in the frontend, a `VITE_*` variable, logs, or source control. The server uses it only after doing its own actor/ownership checks.

Useful commands:

```bash
npm test
npm run check
npm start
```

## Authentication and response format

The frontend signs users in with Supabase Auth and sends the access token on protected requests:

```http
Authorization: Bearer <supabase-access-token>
```

Successful REST responses use camelCase:

```json
{ "success": true, "data": {}, "meta": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 } }
```

Errors are structured and include a request ID:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": [] },
  "requestId": "..."
}
```

All routes below are prefixed with `/api/v1`. `Public` routes do not require a token; an invalid supplied token is still rejected.

## REST API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Liveness check |
| GET | `/ready` | Public | Supabase readiness check |
| GET | `/profiles/me` | Auth | Private current profile |
| PATCH | `/profiles/me` | Auth | Update own non-privileged profile fields |
| GET | `/profiles/drivers` | Public | Safe driver cards and active vehicles |
| GET | `/profiles/:profileId` | Public | Safe public profile projection |
| GET | `/vehicles/mine` | Auth | Driver's vehicles |
| POST | `/vehicles` | Auth | Add a vehicle |
| PATCH | `/vehicles/:vehicleId` | Owner | Update a vehicle |
| DELETE | `/vehicles/:vehicleId` | Owner | Deactivate a vehicle |
| GET | `/rides/search` | Public for scheduled rides | Search available offers |
| GET | `/rides/search?status=searching` | Driver | Search open on-demand/private requests |
| GET | `/rides/mine` | Auth | Rides where user is requester/driver |
| POST | `/rides` | Auth | Offer a carpool or private ride |
| POST | `/rides/requests` | Auth | Request an on-demand/private ride |
| GET | `/rides/:rideId` | Public scheduled; otherwise participant/driver | Ride details and stops |
| POST | `/rides/:rideId/bookings` | Auth | Request seats (`pending`) |
| POST | `/rides/:rideId/join` | Auth | Join an offered ride immediately (`confirmed`) |
| POST | `/rides/:rideId/accept` | Driver | Atomically claim an open ride request |
| PATCH | `/rides/:rideId/status` | Assigned driver | Advance the trip lifecycle |
| POST | `/rides/:rideId/cancel` | Requester/driver | Cancel a ride and active bookings |
| PATCH | `/rides/:rideId/destination` | Requester/driver | Change destination and broadcast it |
| GET | `/rides/:rideId/location` | Participant | Latest driver location |
| POST | `/rides/:rideId/location` | Assigned driver | Save/broadcast location fallback |
| GET | `/bookings` | Auth | Passenger or driver booking list |
| GET | `/bookings/:bookingId` | Participant | Booking detail |
| PATCH | `/bookings/:bookingId/status` | Driver | Confirm/cancel/complete booking |
| POST | `/bookings/:bookingId/cancel` | Passenger/driver | Cancel booking |
| GET | `/groups` | Public | Search public travel groups |
| GET | `/groups?joined=true` | Auth | Current user's groups |
| POST | `/groups` | Auth | Create group; owner becomes admin |
| GET | `/groups/:groupId` | Public or member if private | Group and safe member profiles |
| POST | `/groups/:groupId/members/me` | Auth | Atomically join; body may contain `joinCode` |
| DELETE | `/groups/:groupId/members/me` | Member | Leave group (owner cannot leave) |
| GET | `/groups/:groupId/messages` | Member | Paginated messages |
| POST | `/groups/:groupId/messages` | Member | Send message |
| GET | `/notifications` | Auth | User notifications |
| PATCH | `/notifications/:notificationId/read` | Owner | Mark one read |
| PATCH | `/notifications/read-all` | Auth | Mark all read |

### Offer a ride

```json
{
  "rideType": "carpool",
  "origin": { "name": "Astarang Bus Stand", "lat": 19.973, "lng": 86.27 },
  "destination": { "name": "Bhubaneswar", "lat": 20.2961, "lng": 85.8245 },
  "departureTime": "2030-10-07T08:00:00+05:30",
  "seatsTotal": 3,
  "pricePerSeat": 300,
  "vehicleId": "optional-vehicle-uuid",
  "womenOnly": false,
  "allowLuggage": true,
  "notes": "Small bags are welcome",
  "stops": [
    { "stopOrder": 1, "name": "Nimapada", "lat": 20.057, "lng": 86.005 }
  ]
}
```

`rideType` is `carpool`, `private`, or `on_demand`. Use `/rides` for driver offers (`carpool`/`private`) and `/rides/requests` for passenger requests (`private`/`on_demand`). A return journey should be created as a second ride so it can have its own seats, status, bookings, and tracking.

### Search rides

`GET /rides/search` accepts `origin`, `destination`, `departureDate` (`YYYY-MM-DD`), `departureAfter`, `departureBefore`, `seats`, `rideType`, `status`, `womenOnly`, `maxPrice`, `page`, and `limit`. Scheduled offers are the safe public default. Exact pickup coordinates for searching requests are only exposed to authenticated driver profiles.

### Request an on-demand ride

The payload is the same nested location shape. `rideType` must be `private` or `on_demand`; `estimatedFare` is optional. The API creates the searching ride and its passenger booking together. A driver with role `driver` or `both` claims it with:

```json
{ "vehicleId": "optional-owned-active-vehicle-uuid" }
```

### Booking and ride state

Booking transitions are enforced:

- `pending -> confirmed | cancelled`
- `confirmed -> completed | cancelled`

Ride transitions are enforced:

- `draft -> scheduled | cancelled`
- `scheduled -> arriving | in_progress | cancelled`
- `searching -> accepted | cancelled`
- `accepted -> arriving | in_progress | cancelled`
- `arriving -> in_progress | cancelled`
- `in_progress -> completed | cancelled`

The database serializes booking-capacity checks and derives `seatsAvailable` from pending/confirmed bookings. Group joins use the migration's row-locking `join_group` function, so concurrent users cannot overfill a group.

## Socket.IO

Connect to the same server and pass the current Supabase access token. Every socket is authenticated; user IDs in event payloads are ignored.

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: { token: session.access_token },
});
```

All client events accept an optional acknowledgement callback. The acknowledgement is `{ ok: true, data }` or `{ ok: false, error }`.

| Client event | Payload | Authorization |
| --- | --- | --- |
| `ride:join` | `{ rideId }` | Ride participant |
| `ride:leave` | `{ rideId }` | Connected user |
| `location:update` | `{ rideId, lat, lng, heading?, speed?, accuracy? }` | Assigned driver; throttled |
| `destination:update` | `{ rideId, destination: { name, lat, lng } }` | Requester/driver |
| `trip:status` | `{ rideId, status }` | Assigned driver |
| `group:join` | `{ groupId }` | Active group member |
| `group:leave` | `{ groupId }` | Connected user |
| `group:message` | `{ groupId, message }` | Active group member |

Server pushes:

- `location:updated`
- `destination:updated`
- `trip:status_updated`
- `ride:booking_updated`
- `group:message_created`
- `notification:new`
- `presence:updated`
- `server:error` when no acknowledgement callback was supplied

Joining a room never grants access by itself: each join, location update, destination update, status change, and group message rechecks ownership or membership against Supabase.

## Deployment notes

- Set `CLIENT_ORIGINS` to an explicit comma-separated allowlist in production.
- Users cannot set `role` or `isVerified` through profile updates. Use `/admine` for manual driver/offerer approval after checking identity and documents. Approval is mandatory in every environment for new offers and cab acceptance.
- Terminate TLS at the platform/load balancer and set `TRUST_PROXY=true` only when a trusted proxy is present.
- The current Socket.IO adapter is in-memory. For more than one backend instance, configure the Redis/Postgres adapter before scaling horizontally.
- Add a scheduled retention job for `ride_locations`; the MVP stores each accepted sample for trip history.
- Supabase is the identity and database layer. Payments, SMS/OTP delivery, push-notification providers, route pricing, and a map/geocoding provider require project-specific credentials and are intentionally not faked here.
- Use Supabase Storage signed URLs for private documents. Never place identity-document secrets in profiles or logs.

