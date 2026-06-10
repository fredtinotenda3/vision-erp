// ============================================================
// VISION ERP - Lab Order Tracking API
// app/api/lab/[id]/tracking/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { labService } from "@/modules/lab/lab.service";
import { LabTrackingSchema } from "@/modules/lab/lab.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "lab:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      body.labOrderId = params.id;

      const parsed = LabTrackingSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const entry = await labService.addTracking(parsed.data, ctx.userId, practiceId);
      await createAuditLog(ctx, "UPDATE", "LabOrder", params.id, undefined, undefined, `Tracking: ${parsed.data.status}`);
      return apiSuccess(entry, "Tracking entry added", undefined, 201);
    } catch (err) {
      if (err instanceof Error && err.message === "LAB_ORDER_NOT_FOUND") return apiNotFound("Lab order");
      return apiServerError();
    }
  });
}