import { sendData } from "../lib/http.js";
import {
  createGroup,
  createMessage,
  getGroup,
  joinGroup,
  leaveGroup,
  listGroups,
  listMessages,
} from "../services/group.service.js";

const ioFor = (req) => req.app.get("io");

export async function create(req, res) {
  return sendData(res, await createGroup(req.user.id, req.validated.body), { status: 201 });
}

export async function list(req, res) {
  const result = await listGroups(req.validated.query, req.user?.id);
  return sendData(res, result.data, { meta: result.meta });
}

export async function detail(req, res) {
  return sendData(res, await getGroup(req.validated.params.groupId, req.user?.id));
}

export async function join(req, res) {
  return sendData(
    res,
    await joinGroup(req.validated.params.groupId, req.user.id, req.validated.body),
  );
}

export async function leave(req, res) {
  return sendData(res, await leaveGroup(req.validated.params.groupId, req.user.id));
}

export async function messages(req, res) {
  const result = await listMessages(
    req.validated.params.groupId,
    req.user.id,
    req.validated.query,
  );
  return sendData(res, result.data, { meta: result.meta });
}

export async function postMessage(req, res) {
  return sendData(
    res,
    await createMessage(
      req.validated.params.groupId,
      req.user.id,
      req.validated.body.message,
      ioFor(req),
    ),
    { status: 201 },
  );
}

