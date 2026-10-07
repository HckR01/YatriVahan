import { sendData } from "../lib/http.js";
import {
  createVehicle,
  deactivateVehicle,
  listMyVehicles,
  updateVehicle,
} from "../services/vehicle.service.js";

export async function list(req, res) {
  return sendData(res, await listMyVehicles(req.user.id));
}

export async function create(req, res) {
  return sendData(res, await createVehicle(req.user.id, req.validated.body), { status: 201 });
}

export async function update(req, res) {
  return sendData(
    res,
    await updateVehicle(req.user.id, req.validated.params.vehicleId, req.validated.body),
  );
}

export async function remove(req, res) {
  return sendData(
    res,
    await deactivateVehicle(req.user.id, req.validated.params.vehicleId),
  );
}

