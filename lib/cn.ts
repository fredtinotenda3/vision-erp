// ============================================================
// VISION ERP - Client-safe className combiner
// lib/cn.ts
// ------------------------------------------------------------
// NOTE: lib/utils.ts also exports `cn`, but that module imports
// `next/server` (NextResponse), which cannot be bundled into a
// client component. This is the client-safe equivalent.
// ============================================================

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}