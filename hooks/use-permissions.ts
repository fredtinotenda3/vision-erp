// ============================================================
// VISION ERP - Client RBAC hook
// hooks/use-permissions.ts
// ============================================================

"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { hasPermission, hasAnyPermission, hasAllPermissions, roleLabel } from "@/lib/permissions";
import type { Permission } from "@/types";

export function usePermissions() {
  const { data: session, status } = useSession();
  const role = session?.user?.role as string | undefined;

  return useMemo(
    () => ({
      role,
      roleLabel: roleLabel(role),
      isAuthenticated: status === "authenticated",
      isLoading: status === "loading",
      can: (permission: Permission) => hasPermission(role, permission),
      canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
      canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    }),
    [role, status]
  );
}