import { sendData } from "../lib/http.js";
import {
  acceptRideRequest,
  cancelRide,
  createRideOffer,
  createRideRequest,
  getLatestRideLocation,
  getRide,
  listMyRides,
  saveRideLocation,
  searchRides,
  updateDestination,
  updateRideStatus,
} from "../services/ride.service.js";

const ioFor = (req) => req.app.get("io");

export async function create(req, res) {
  return sendData(res, await createRideOffer(req.user.id, req.validated.body), { status: 201 });
}

export async function createRequest(req, res) {
  return sendData(res, await createRideRequest(req.user.id, req.validated.body), { status: 201 });
}

export async function search(req, res) {
  const result = await searchRides(req.validated.query, req.user?.id);
  return sendData(res, result.data, { meta: result.meta });
}

export async function mine(req, res) {
  return sendData(res, await listMyRides(req.user.id));
}

export async function detail(req, res) {
  return sendData(res, await getRide(req.validated.params.rideId, req.user?.id));
}

export async function accept(req, res) {
  return sendData(
    res,
    await acceptRideRequest(
      req.validated.params.rideId,
      req.user.id,
      req.validated.body,
      ioFor(req),
    ),
  );
}

export async function setStatus(req, res) {
  return sendData(
    res,
    await updateRideStatus(
      req.validated.params.rideId,
      req.user.id,
      req.validated.body.status,
      ioFor(req),
    ),
  );
}

export async function cancel(req, res) {
  return sendData(
    res,
    await cancelRide(
      req.validated.params.rideId,
      req.user.id,
      req.validated.body.reason,
      ioFor(req),
    ),
  );
}

export async function setDestination(req, res) {
  return sendData(
    res,
    await updateDestination(
      req.validated.params.rideId,
      req.user.id,
      req.validated.body.destination,
      ioFor(req),
    ),
  );
}

export async function updateLocation(req, res) {
  return sendData(
    res,
    await saveRideLocation(
      req.validated.params.rideId,
      req.user.id,
      req.validated.body,
      ioFor(req),
    ),
    { status: 201 },
  );
}

export async function latestLocation(req, res) {
  return sendData(
    res,
    await getLatestRideLocation(req.validated.params.rideId, req.user.id),
  );
}

