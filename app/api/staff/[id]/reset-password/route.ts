// ============================================================
// VISION ERP - Staff Password Reset API Route
// app/api/staff/[id]/reset-password/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { staffService } from "@/modules/staff/staff.service";
import { ResetPasswordSchema } from "@/modules/staff/staff.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "staff:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = ResetPasswordSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      await staffService.resetPassword(params.id, parsed.data, practiceId);
      await createAuditLog(
        ctx,
        "UPDATE",
        "User",
        params.id,
        undefined,
        undefined,
        "Password reset by admin"
      );
      return apiSuccess(null, "Password reset successfully");
    } catch (err) {
      if (err instanceof Error && err.message === "STAFF_NOT_FOUND")
        return apiNotFound("Staff member");
      return apiServerError();
    }
  });
}