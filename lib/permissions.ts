// ============================================================
// VISION ERP - Client-safe RBAC mirror
// lib/permissions.ts
// ------------------------------------------------------------
// MUST stay in sync with ROLE_PERMISSIONS in lib/auth.ts.
// lib/auth.ts is server-only (imports db + bcrypt), so the
// client needs its own copy of the permission map.
// ============================================================

import type { Permission } from "@/types";

export type RoleName =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "OPTOMETRIST"
  | "RECEPTIONIST"
  | "DISPENSER"
  | "FINANCE"
  | "LAB_TECHNICIAN"
  | "READONLY";

export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  SUPER_ADMIN: [
    "patients:read", "patients:create", "patients:update", "patients:delete",
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "clinical:read", "clinical:create", "clinical:update",
    "orders:read", "orders:create", "orders:update", "orders:delete",
    "sales:read", "sales:create", "sales:void",
    "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
    "finance:read", "finance:create", "finance:update",
    "lab:read", "lab:create", "lab:update",
    "recalls:read", "recalls:create", "recalls:send",
    "reports:read", "reports:export",
    "staff:read", "staff:create", "staff:update", "staff:delete",
    "system:admin", "audit:read",
  ],
  ADMIN: [
    "patients:read", "patients:create", "patients:update", "patients:delete",
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "clinical:read", "clinical:create", "clinical:update",
    "orders:read", "orders:create", "orders:update", "orders:delete",
    "sales:read", "sales:create", "sales:void",
    "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
    "finance:read", "finance:create", "finance:update",
    "lab:read", "lab:create", "lab:update",
    "recalls:read", "recalls:create", "recalls:send",
    "reports:read", "reports:export",
    "staff:read", "staff:create", "staff:update",
    "audit:read",
  ],
  OPTOMETRIST: [
    "patients:read", "patients:create", "patients:update",
    "appointments:read", "appointments:create", "appointments:update",
    "clinical:read", "clinical:create", "clinical:update",
    "orders:read", "orders:create",
    "sales:read",
    "recalls:read", "recalls:create",
    "reports:read",
  ],
  RECEPTIONIST: [
    "patients:read", "patients:create", "patients:update",
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "orders:read",
    "sales:read", "sales:create",
    "recalls:read",
    "reports:read",
  ],
  DISPENSER: [
    "patients:read",
    "appointments:read",
    "orders:read", "orders:create", "orders:update",
    "sales:read", "sales:create",
    "inventory:read",
    "lab:read", "lab:create", "lab:update",
    "reports:read",
  ],
  FINANCE: [
    "patients:read",
    "orders:read",
    "sales:read",
    "finance:read", "finance:create", "finance:update",
    "inventory:read",
    "reports:read", "reports:export",
  ],
  LAB_TECHNICIAN: [
    "orders:read",
    "lab:read", "lab:create", "lab:update",
  ],
  READONLY: [
    "patients:read",
    "appointments:read",
    "orders:read",
    "sales:read",
    "reports:read",
  ],
};

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as RoleName];
  return perms ? perms.includes(permission) : false;
}

export function hasAnyPermission(role: string | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: string | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Practice Manager",
  OPTOMETRIST: "Optometrist",
  RECEPTIONIST: "Receptionist",
  DISPENSER: "Dispenser",
  FINANCE: "Finance",
  LAB_TECHNICIAN: "Lab Technician",
  READONLY: "Read Only",
};

export function roleLabel(role: string | null | undefined): string {
  if (!role) return "—";
  return ROLE_LABELS[role as RoleName] ?? role;
}