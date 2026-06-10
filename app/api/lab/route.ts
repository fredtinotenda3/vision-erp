// ============================================================
// VISION ERP - Lab Orders API
// app/api/lab/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { labService } from "@/modules/lab/lab.service";
import { CreateLabOrderSchema, LabOrderQuerySchema } from "@/modules/lab/lab.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "lab:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = LabOrderQuerySchema.safeParse({
        status: sp.get("status"),
        supplierId: sp.get("supplierId"),
        urgency: sp.get("urgency"),
        from: sp.get("from"),
        to: sp.get("to"),
        search: sp.get("search"),
        page: sp.get("page"),
        pageSize: sp.get("pageSize"),
      });
      if (!parsed.success) return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const result = await labService.list(parsed.data, practiceId);
      return apiSuccess(result.labOrders, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "lab:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = CreateLabOrderSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const order = await labService.create(parsed.data, ctx.userId);
      await createAuditLog(ctx, "CREATE", "LabOrder", order.id);
      return apiSuccess(order, "Lab order created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}