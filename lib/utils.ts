// ============================================================
// VISION ERP - Utility Functions
// lib/utils.ts
// ============================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ApiResponse, PaginationMeta } from "@/types";
import { NextResponse } from "next/server";

// ============================================================
// TAILWIND HELPER
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// API RESPONSE HELPERS
// ============================================================

export function apiSuccess<T>(
  data: T,
  message?: string,
  meta?: PaginationMeta,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data, message, meta },
    { status }
  );
}

export function apiError(
  error: string,
  status = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error, errors }, { status });
}

export function apiUnauthorized(message = "Unauthorized") {
  return apiError(message, 401);
}

export function apiForbidden(message = "Forbidden - insufficient permissions") {
  return apiError(message, 403);
}

export function apiNotFound(resource = "Resource") {
  return apiError(`${resource} not found`, 404);
}

export function apiServerError(message = "Internal server error") {
  return apiError(message, 500);
}

// ============================================================
// PAGINATION
// ============================================================

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20"))
  );
  const search = searchParams.get("search") || undefined;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

  return { page, pageSize, skip: (page - 1) * pageSize, search, sortBy, sortOrder };
}

/**
 * Build pagination metadata.
 *
 * IMPORTANT: Parameter order is (page, pageSize, total) to match every
 * call site across the service layer (patients, appointments, finance,
 * inventory, lab, orders, recall, sales, staff, reports). Changing this
 * order will silently scramble pagination output because all three
 * arguments are numbers.
 */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const safePageSize = pageSize > 0 ? pageSize : 1;
  const totalPages = Math.ceil(total / safePageSize);
  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// ============================================================
// ID GENERATORS
// ============================================================

export function generateRefNo(prefix: string, count: number): string {
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

export function generateOrderNo(prefix = "ORD"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function generateSaleNo(): string {
  return generateOrderNo("SALE");
}

export function generateLabOrderNo(): string {
  return generateOrderNo("LAB");
}

// ============================================================
// DATE UTILITIES
// ============================================================

export function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ============================================================
// SEARCH UTILS
// ============================================================

export function buildSearchFilter(search: string | undefined, fields: string[]) {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" as const },
    })),
  };
}

// ============================================================
// CURRENCY
// ============================================================

export function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

// ============================================================
// VALIDATION UTILS
// ============================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPostcode(postcode: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.test(postcode);
}

export function isValidPhone(phone: string): boolean {
  return /^[\d\s\+\-\(\)]{7,15}$/.test(phone);
}

// ============================================================
// HASH / SECURITY
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(password, hash);
}