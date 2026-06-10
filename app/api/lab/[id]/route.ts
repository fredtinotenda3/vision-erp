// ============================================================
// VISION ERP - Lab Order by ID
// app/api/lab/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { labService } from "@/modules/lab/lab.service";
import { UpdateLabOrderSchema } from "@/modules/lab/lab.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "lab:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const order = await labService.getById(params.id, practiceId);
      return apiSuccess(order);
    } catch (err) {
      if (err instanceof Error && err.message === "LAB_ORDER_NOT_FOUND") return apiNotFound("Lab order");
      return apiServerError();
    }
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "lab:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = UpdateLabOrderSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const order = await labService.update(params.id, parsed.data, practiceId);
      await createAuditLog(ctx, "UPDATE", "LabOrder", params.id);
      return apiSuccess(order, "Lab order updated");
    } catch (err) {
      if (err instanceof Error && err.message === "LAB_ORDER_NOT_FOUND") return apiNotFound("Lab order");
      return apiServerError();
    }
  });
}