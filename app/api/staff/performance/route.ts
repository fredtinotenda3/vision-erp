// ============================================================
// VISION ERP - Staff Performance API Route
// app/api/staff/performance/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { staffService } from "@/modules/staff/staff.service";
import { StaffPerformanceEntrySchema } from "@/modules/staff/staff.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "staff:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const from = sp.get("from") ?? new Date(new Date().setDate(1)).toISOString().split("T")[0];
      const to = sp.get("to") ?? new Date().toISOString().split("T")[0];
      const userId = sp.get("userId") ?? undefined;

      const performance = await staffService.listPerformance(practiceId, from, to, userId);
      return apiSuccess(performance);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "staff:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = StaffPerformanceEntrySchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const entry = await staffService.recordPerformance(parsed.data, practiceId);
      await createAuditLog(ctx, "CREATE", "StaffPerformance", entry.id);
      return apiSuccess(entry, "Performance recorded", undefined, 201);
    } catch (err) {
      if (err instanceof Error && err.message === "STAFF_NOT_FOUND")
        return apiError("Staff member not found in this practice", 404);
      return apiServerError();
    }
  });
}