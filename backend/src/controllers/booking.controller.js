import { sendData } from "../lib/http.js";
import {
  cancelBooking,
  createBooking,
  getBooking,
  joinRide,
  listBookings,
  updateBookingStatus,
} from "../services/booking.service.js";

const ioFor = (req) => req.app.get("io");

export async function create(req, res) {
  return sendData(
    res,
    await createBooking(
      req.validated.params.rideId,
      req.user.id,
      req.validated.body,
      ioFor(req),
    ),
    { status: 201 },
  );
}

export async function join(req, res) {
  return sendData(
    res,
    await joinRide(
      req.validated.params.rideId,
      req.user.id,
      req.validated.body,
      ioFor(req),
    ),
    { status: 201 },
  );
}

export async function list(req, res) {
  const result = await listBookings(req.user.id, req.validated.query);
  return sendData(res, result.data, { meta: result.meta });
}

export async function detail(req, res) {
  return sendData(res, await getBooking(req.validated.params.bookingId, req.user.id));
}

export async function setStatus(req, res) {
  return sendData(
    res,
    await updateBookingStatus(
      req.validated.params.bookingId,
      req.user.id,
      req.validated.body.status,
      ioFor(req),
    ),
  );
}

export async function cancel(req, res) {
  return sendData(
    res,
    await cancelBooking(
      req.validated.params.bookingId,
      req.user.id,
      req.validated.body.reason,
      ioFor(req),
    ),
  );
}

