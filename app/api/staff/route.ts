// ============================================================
// VISION ERP - Staff API Route
// app/api/staff/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { staffService } from "@/modules/staff/staff.service";
import { CreateStaffSchema, StaffQuerySchema } from "@/modules/staff/staff.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "staff:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = StaffQuerySchema.safeParse({
        search: sp.get("search"),
        role: sp.get("role"),
        isActive: sp.get("isActive"),
        page: sp.get("page"),
        pageSize: sp.get("pageSize"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const result = await staffService.list(parsed.data, practiceId);
      return apiSuccess(result.staff, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "staff:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = CreateStaffSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const user = await staffService.create(parsed.data);
      await createAuditLog(ctx, "CREATE", "User", user.id, undefined, undefined, `Created staff member ${user.name}`);
      return apiSuccess(user, "Staff member created", undefined, 201);
    } catch (err) {
      if (err instanceof Error && err.message === "EMAIL_IN_USE")
        return apiError("A user with this email address already exists", 409);
      return apiServerError();
    }
  });
}