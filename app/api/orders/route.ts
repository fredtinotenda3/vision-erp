// ============================================================
// VISION ERP - Orders API
// app/api/orders/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { orderService } from "@/modules/orders/order.service";
import { CreateOrderSchema, OrderQuerySchema } from "@/modules/orders/order.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "orders:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = OrderQuerySchema.safeParse({
        patientId: sp.get("patientId"), status: sp.get("status"), type: sp.get("type"),
        from: sp.get("from"), to: sp.get("to"), search: sp.get("search"),
        page: sp.get("page"), pageSize: sp.get("pageSize"),
      });
      if (!parsed.success) return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      const result = await orderService.list(parsed.data, practiceId);
      return apiSuccess(result.orders, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "orders:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = CreateOrderSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const order = await orderService.create(parsed.data, ctx.userId);
      await createAuditLog(ctx, "CREATE", "Order", order.id);
      return apiSuccess(order, "Order created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}