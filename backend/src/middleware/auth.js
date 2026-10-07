import { supabaseAuth } from "../config/supabase.js";
import { unauthorized } from "../lib/errors.js";

export function readBearerToken(header) {
  if (!header || typeof header !== "string") return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function authenticate(req, _res, next) {
  try {
    const token = readBearerToken(req.headers.authorization);
    if (!token) throw unauthorized("A valid Bearer token is required");

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) throw unauthorized("The access token is invalid or expired");

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticate(req, res, next) {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
}

