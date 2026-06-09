// ============================================================
// VISION ERP - Global Types
// types/index.ts
// ============================================================

import { Role } from "@prisma/client";

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  practiceId?: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  practiceId?: string | null;
}

// ============================================================
// RBAC TYPES
// ============================================================

export type Permission =
  // Patients
  | "patients:read"
  | "patients:create"
  | "patients:update"
  | "patients:delete"
  // Appointments
  | "appointments:read"
  | "appointments:create"
  | "appointments:update"
  | "appointments:delete"
  // Clinical
  | "clinical:read"
  | "clinical:create"
  | "clinical:update"
  // Orders
  | "orders:read"
  | "orders:create"
  | "orders:update"
  | "orders:delete"
  // Sales
  | "sales:read"
  | "sales:create"
  | "sales:void"
  // Inventory
  | "inventory:read"
  | "inventory:create"
  | "inventory:update"
  | "inventory:delete"
  // Finance
  | "finance:read"
  | "finance:create"
  | "finance:update"
  // Lab
  | "lab:read"
  | "lab:create"
  | "lab:update"
  // Recalls
  | "recalls:read"
  | "recalls:create"
  | "recalls:send"
  // Reports
  | "reports:read"
  | "reports:export"
  // Staff
  | "staff:read"
  | "staff:create"
  | "staff:update"
  | "staff:delete"
  // System
  | "system:admin"
  | "audit:read";

// ============================================================
// UTILITY TYPES
// ============================================================

export type SortOrder = "asc" | "desc";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Extended NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      practiceId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    practiceId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    practiceId?: string | null;
  }
}