# Sunset Coral UI and Join a Ride

This branch implements the selected coral/salmon/sand/navy visual direction with the generated coastal-road, friends and temple/beach artwork. Desktop and mobile share one account and navigation. The Find Ride follow-up adds batched stop hydration and Socket.IO search invalidation to the backend. Supabase schema and migrations are unchanged.

## Routes

| Page | URL | Integration |
| --- | --- | --- |
| Home | `/` | Find, join, offer and full-car actions |
| Find a Ride | `/find-ride` | Exact-first search followed by ordered intermediate stops |
| Sign Up | `/signup` | Existing Supabase signup, single account with rider/driver capability |
| Verify Email | `/verify-email` | Supabase email code or existing confirmation link |
| Sign In | `/login` | Existing authentication |
| Forgot Password | `/forgot-password` | Supabase recovery email |
| Reset Password | `/reset-password` | Recovery code/session and password update |
| Dashboard | `/dashboard` | Owned requests/offers and confirmed passenger bookings, start/end/cancel |
| Join a Ride | `/join-ride` | Persisted request, ranked matching rides, pending seat booking |
| Offer a Ride | `/offer-ride` | Existing vehicle and ride APIs; shared or whole-car offer |
| Book Full Car | `/book-car` | Whole-car availability; verified driver directory |
| Requests | `/requests` | Driver inbox, sent bookings, accept/decline/cancel |
| Ride Details | `/rides/:rideId` | Route map/stops, participants, vehicle and booking state |
| Ride Chat | `/chat/ride/:rideId` | Explicit unavailable state; no invented chat transport |
| Profile | `/profile` | Profile edits, vehicle create/edit, verification/rating display, two-stage deletion |

Legacy URLs redirect to their new equivalents. `/find-ride` is restored as a separate search page. Groups are not exposed. Existing Leaflet maps are restored on Join a Ride, Offer a Ride and Ride Details at the user’s request. The dashboard Payments section has been removed. Admin routing remains intact.

## Matching behavior

- Posts to the existing `/rides/requests` endpoint using `on_demand`, the backend's passenger-request type. These remain separate records from driver offers.
- Uses India local day boundaries even when the browser runs in another timezone; queries every result page.
- Requires matching origin/destination town names (case/whitespace normalized), same India day, departure within two hours, sufficient seats, scheduled carpool status and a future departure.
- Excludes the user's own offers and women-only offers when eligibility is unknown.
- Ranks exact routes first, then closest preferred time, then lowest seat price, then stable ID.
- Authenticated search pages subscribe to `search:changed` over the existing Socket.IO connection. Ride creation, destination/status changes and booking writes invalidate searches. Clients debounce events, reload on reconnect/focus and poll every 30 seconds as fallback. Anonymous search uses polling. Events contain only a refresh flag; no private ride or booking payload. This does not implement timed offer waves.
- Search responses now hydrate persisted ride stops in one batched query. Both Find Ride and Join a Ride match pickup before drop-off in that stored order. Exact endpoint matches rank first. Endpoint names alone never imply a road variant.
- Rechecks ride availability and existing bookings before POSTing a pending booking. Double clicks are locked in the Join a Ride flow. Backend errors remain errors and do not silently create demo bookings.
- The driver still approves the seat booking through the existing Requests API. A matching ride is labelled “Matching ride”, never falsely described as a personal driver offer. “Hide” only hides a suggestion for this page session.
- The separate passenger travel request remains open after a seat request. Users are explicitly told to cancel it when no longer needed. Atomic conversion/linking requires backend work.

## Backend-dependent gaps

The repository does not implement persistent matching offers, accept/decline of driver offers, longest-trip-first distribution, 30-minute offer waves, cross-device decline history, friends-priority rules, paired return rides, ride chat, UPI/QR edits or a ratings-write endpoint. These are not simulated. Return rides can be posted separately. Driver directory results do not represent availability or service-area matches, and targeted hiring is not enabled.

Email templates currently determine whether Supabase sends a link or code (code length may differ from the six-box mockup). Configure the site URL and allow `/reset-password` in Supabase redirect URLs before testing recovery on a deployment. No Supabase settings were changed.

The backend requires coordinates. Town text is resolved using the existing location helper. Route preview and map pins use the existing Leaflet/OpenStreetMap/OSRM integration; selected coordinates are preserved in submissions. Town names remain required for matching. External map, routing and geocoding services must be reachable.

## Existing capacity issue — review before production merge

`backend/src/services/booking.service.js` updates `seats_available` after confirming/cancelling a booking. The checked-in `bookings_sync_seats` trigger in `supabase/migrations/202610070001_initial_schema.sql` already recomputes available capacity for pending/confirmed bookings. With that migration installed, confirmation can double-decrement seats or report a conflict after the booking status has already changed. This was present before the UI change and is not modified here. Live database migration state has not been inspected.

Client duplicate checks are best-effort; concurrency/idempotency must remain server enforced. Cross-device booking/request conversion cannot be made atomic in the frontend.

## Verification

- `npm run lint` passes.
- `npm test`: nine matching tests including time boundaries, reverse routes, capacity, ownership, ranking and ordered stops.
- `npm run build` passes (existing large-bundle warning remains).
- Chromium smoke checks visited all fourteen routes, checked desktop and 390px mobile layout overflow on signed-in screens, and verified the legacy redirect.
- Mocked API browser flow tested request creation, a rejected booking (no fake success), and a successful pending booking. No browser exceptions.
- Browser tests used isolated mocked API data and a local test session. No live accounts, rides or bookings were created. Live two-account/API acceptance and configured Supabase recovery remain deployment checks.

## Saved routes and Find Ride follow-up

- Imports 28 route variants from the following sources: 20 routes from `Odisha_New_20_Routes_With_KM.xlsx`, Library ID `libfile_df65684aa81c8191b29ceffde1da3069`. `src/data/odishaRoutes.json` records sheet names and review notes. Eight earlier routes, including both Astarang–Bhubaneswar variants, come from `Odisha_Routes_With_KM_CSVs.zip`, Library ID `libfile_d1473158619c8191b9526598da8d2833`. These are the supplied planning sequences, not newly verified roads. No estimated workbook kilometres are used for fares.
- Offer a Ride lists compatible routes, including selected subsections and reverse direction. Drivers explicitly select and confirm a stop sequence. Without a selection, only endpoints are searchable. Existing rides keep their saved stops; no route is guessed or retroactively attached.
- Intermediate stop coordinates are resolved sequentially using the existing geocoder before publishing. Failures prevent publication; no fabricated coordinates. External geocoding must be reachable. Same-named nodes across districts are qualified. Explicit Nimapara/Nimapada, Kendupatana/Kendupatna, Salipur/Salepur and Paradip spellings are normalized.
- Find Ride filters by India travel day and available shared seats. Optional time uses the existing two-hour window against departure from the driver's origin, not an invented stop ETA. Exact matches rank first, then time difference and listed fare. With no preferred time, all departures on the day are eligible.
- Result links preserve passenger pickup/drop-off and seat count. Ride Details re-fetches and verifies stop order before submitting those stop coordinates. The existing whole-ride seat fare and capacity rules remain; segment-based fares/seat reuse are not added.
- Route-detail maps pass the saved intermediate coordinates to OSRM. Road rendering depends on external services; the stored stop order drives matching.
- Deployment requires updating/restarting the backend as well as the frontend to expose stops and search events. The stop validation limit increases from 20 to 50 so the 23-node Astarang route fits. No database migration is required. Previous capacity warning remains unresolved.

Follow-up verification: 17 frontend matching/catalog tests and 15 backend tests, including an actual Socket.IO subscribe/invalidation test with mocked authentication. Chromium mocked-API flow covers exact-first search, an intermediate-stop booking payload, driver route selection/persisted stop order, mobile overflow and browser exceptions. External geocoder/map accuracy and live two-account deployment acceptance remain unverified.
