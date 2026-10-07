import { camelizeKeys } from "./case.js";

export function sendData(res, data, options = {}) {
  const body = { success: true, data: camelizeKeys(data) };
  if (options.meta) body.meta = camelizeKeys(options.meta);
  return res.status(options.status ?? 200).json(body);
}

export function getPagination(page, limit) {
  const offset = (page - 1) * limit;
  return { from: offset, to: offset + limit - 1 };
}

export function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil((total ?? 0) / limit),
  };
}

