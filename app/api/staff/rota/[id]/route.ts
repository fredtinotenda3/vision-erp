// ============================================================
// VISION ERP - Staff Rota [id] API Route
// app/api/staff/rota/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { staffService } from "@/modules/staff/staff.service";
import { StaffRotaSchema } from "@/modules/staff/staff.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "staff:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = StaffRotaSchema.partial().safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const entry = await staffService.updateRotaEntry(params.id, parsed.data, practiceId);
      await createAuditLog(ctx, "UPDATE", "StaffRota", params.id);
      return apiSuccess(entry, "Rota entry updated");
    } catch (err) {
      if (err instanceof Error && err.message === "ROTA_ENTRY_NOT_FOUND")
        return apiNotFound("Rota entry");
      return apiServerError();
    }
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "staff:delete", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      await staffService.deleteRotaEntry(params.id, practiceId);
      await createAuditLog(ctx, "DELETE", "StaffRota", params.id);
      return apiSuccess(null, "Rota entry deleted");
    } catch (err) {
      if (err instanceof Error && err.message === "ROTA_ENTRY_NOT_FOUND")
        return apiNotFound("Rota entry");
      return apiServerError();
    }
  });
}