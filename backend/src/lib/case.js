const toCamelKey = (key) =>
  key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export function camelizeKeys(value) {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (!value || typeof value !== "object" || value instanceof Date) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [toCamelKey(key), camelizeKeys(child)]),
  );
}

