// ============================================================
// VISION ERP - Client-safe formatting helpers
// lib/format.ts
// ------------------------------------------------------------
// Pure, framework-free formatters usable in client components.
// (lib/utils.ts duplicates some of these but pulls in next/server.)
// ============================================================

export function formatCurrency(amount: number | null | undefined, currency = "GBP"): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("en-GB").format(v);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateAge(dob: Date | string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/** ISO yyyy-mm-dd (what the backend date-range schemas expect). */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}