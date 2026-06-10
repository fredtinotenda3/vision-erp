// ============================================================
// VISION ERP - Query param normalisation helper
// lib/query-params.ts
// ------------------------------------------------------------
// URLSearchParams.get() returns `null` for absent keys, but our
// Zod query schemas use `.optional()` which only accepts
// `undefined` — so a missing param fails validation with a 400.
//
// This helper reads keys and converts `null` -> `undefined` so
// optional fields validate correctly. Use it in every route that
// builds a parse object from searchParams.
// ============================================================

/**
 * Pull the given keys out of a URLSearchParams, mapping any
 * missing value (null) to undefined so Zod `.optional()` passes.
 */
export function readParams<K extends string>(
  sp: URLSearchParams,
  keys: readonly K[]
): Record<K, string | undefined> {
  const out = {} as Record<K, string | undefined>;
  for (const key of keys) {
    const value = sp.get(key);
    out[key] = value === null ? undefined : value;
  }
  return out;
}

/** Single-key convenience: null -> undefined. */
export function param(sp: URLSearchParams, key: string): string | undefined {
  const value = sp.get(key);
  return value === null ? undefined : value;
}