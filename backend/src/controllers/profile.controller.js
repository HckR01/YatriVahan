import { sendData } from "../lib/http.js";
import {
  getMyProfile,
  getPublicProfile,
  searchDrivers,
  updateMyProfile,
} from "../services/profile.service.js";

export async function me(req, res) {
  return sendData(res, await getMyProfile(req.user));
}

export async function updateMe(req, res) {
  return sendData(res, await updateMyProfile(req.user, req.validated.body));
}

export async function publicProfile(req, res) {
  return sendData(res, await getPublicProfile(req.validated.params.profileId));
}

export async function drivers(req, res) {
  return sendData(res, await searchDrivers(req.validated.query));
}

