// ============================================================
// VISION ERP - <Can> permission guard
// components/rbac/can.tsx
// ------------------------------------------------------------
// Conditionally renders children based on the signed-in user's
// permissions. Pure UI gating — the server still enforces via
// withPermission(), this just hides controls the user can't use.
// ============================================================

"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/types";

interface CanProps {
  /** Single permission OR list (any-of by default). */
  permission?: Permission;
  anyOf?: Permission[];
  allOf?: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ permission, anyOf, allOf, children, fallback = null }: CanProps) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = true;
  if (permission) allowed = allowed && can(permission);
  if (anyOf && anyOf.length) allowed = allowed && canAny(anyOf);
  if (allOf && allOf.length) allowed = allowed && canAll(allOf);

  return <>{allowed ? children : fallback}</>;
}