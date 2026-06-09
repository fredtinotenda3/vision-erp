// ============================================================
// VISION ERP - Auth Middleware
// middleware/auth.middleware.ts
// ============================================================

import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@prisma/client";
import { Permission } from "@/types";
import { hasPermission, hasAnyPermission } from "@/lib/auth";
import { apiUnauthorized, apiForbidden } from "@/lib/utils";
import db from "@/lib/db";

export interface AuthContext {
  userId: string;
  email: string;
  role: Role;
  practiceId?: string | null;
  name: string;
}

// ============================================================
// GET AUTH CONTEXT FROM REQUEST
// ============================================================

export async function getAuthContext(
  req: NextRequest
): Promise<AuthContext | null> {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return null;
    }

    return {
      userId: token.id as string,
      email: token.email as string,
      role: token.role as Role,
      practiceId: token.practiceId as string | null,
      name: token.name as string,
    };
  } catch {
    return null;
  }
}

// ============================================================
// REQUIRE AUTH MIDDLEWARE (use in API routes)
// ============================================================

export async function withAuth(
  req: NextRequest,
  handler: (ctx: AuthContext) => Promise<Response>
): Promise<Response> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    return apiUnauthorized();
  }
  return handler(ctx);
}

// ============================================================
// REQUIRE PERMISSION MIDDLEWARE
// ============================================================

export async function withPermission(
  req: NextRequest,
  permission: Permission,
  handler: (ctx: AuthContext) => Promise<Response>
): Promise<Response> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    return apiUnauthorized();
  }
  if (!hasPermission(ctx.role, permission)) {
    return apiForbidden(`Permission required: ${permission}`);
  }
  return handler(ctx);
}

// ============================================================
// REQUIRE ANY OF PERMISSIONS MIDDLEWARE
// ============================================================

export async function withAnyPermission(
  req: NextRequest,
  permissions: Permission[],
  handler: (ctx: AuthContext) => Promise<Response>
): Promise<Response> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    return apiUnauthorized();
  }
  if (!hasAnyPermission(ctx.role, permissions)) {
    return apiForbidden(`One of these permissions required: ${permissions.join(", ")}`);
  }
  return handler(ctx);
}

// ============================================================
// AUDIT LOG HELPER
// ============================================================


export async function createAuditLog(
  ctx: AuthContext,
  action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "EXPORT" | "PRINT",
  entity: string,
  entityId?: string,
  oldData?: object,
  newData?: object,
  message?: string
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: ctx.userId,
        action,
        entity,
        entityId,
        // Use Prisma's JSON parsing to satisfy the type
        oldData: oldData ? (JSON.parse(JSON.stringify(oldData)) as any) : undefined,
        newData: newData ? (JSON.parse(JSON.stringify(newData)) as any) : undefined,
        message,
      },
    });
  } catch {
    // Non-blocking — audit failure should not break the request
    console.error(`Failed to write audit log for ${entity}:${entityId}`);
  }
}