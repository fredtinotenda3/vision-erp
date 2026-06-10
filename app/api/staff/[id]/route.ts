// ============================================================
// VISION ERP - Staff [id] API Route
// app/api/staff/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { staffService } from "@/modules/staff/staff.service";
import {
  UpdateStaffSchema,
  ChangePasswordSchema,
  ResetPasswordSchema,
} from "@/modules/staff/staff.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "staff:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const user = await staffService.getById(params.id, practiceId);
      return apiSuccess(user);
    } catch (err) {
      if (err instanceof Error && err.message === "STAFF_NOT_FOUND")
        return apiNotFound("Staff member");
      return apiServerError();
    }
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "staff:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();

      // Route to change-password or profile update based on body shape
      if (body.currentPassword !== undefined) {
        // Own password change — only the user themselves can do this
        if (params.id !== ctx.userId) return apiError("Forbidden", 403);

        const parsed = ChangePasswordSchema.safeParse(body);
        if (!parsed.success)
          return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

        const user = await staffService.changePassword(params.id, parsed.data, practiceId);
        await createAuditLog(ctx, "UPDATE", "User", params.id, undefined, undefined, "Password changed");
        return apiSuccess(user, "Password updated");
      }

      // Admin profile update
      const parsed = UpdateStaffSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const user = await staffService.update(params.id, parsed.data, practiceId);
      await createAuditLog(ctx, "UPDATE", "User", params.id);
      return apiSuccess(user, "Staff member updated");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "STAFF_NOT_FOUND") return apiNotFound("Staff member");
        if (err.message === "EMAIL_IN_USE")
          return apiError("A user with this email address already exists", 409);
        if (err.message === "INVALID_CURRENT_PASSWORD")
          return apiError("Current password is incorrect", 400);
      }
      return apiServerError();
    }
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "staff:delete", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      // Prevent self-deactivation
      if (params.id === ctx.userId)
        return apiError("You cannot deactivate your own account", 400);

      await staffService.deactivate(params.id, practiceId);
      await createAuditLog(ctx, "UPDATE", "User", params.id, undefined, undefined, "Staff member deactivated");
      return apiSuccess(null, "Staff member deactivated");
    } catch (err) {
      if (err instanceof Error && err.message === "STAFF_NOT_FOUND")
        return apiNotFound("Staff member");
      return apiServerError();
    }
  });
}