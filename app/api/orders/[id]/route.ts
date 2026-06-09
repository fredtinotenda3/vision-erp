// ============================================================
// VISION ERP - Order by ID
// app/api/orders/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { orderService } from "@/modules/orders/order.service";
import { UpdateOrderSchema } from "@/modules/orders/order.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams { params: { id: string } }

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "orders:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      const order = await orderService.getById(params.id, practiceId);
      return apiSuccess(order);
    } catch (err) {
      if (err instanceof Error && err.message === "ORDER_NOT_FOUND") return apiNotFound("Order");
      return apiServerError();
    }
  });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "orders:update", async (ctx) => {
    try {
      const body = await req.json();
      const practiceId = ctx.practiceId ?? body.practiceId ?? "";
      const parsed = UpdateOrderSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const order = await orderService.update(params.id, parsed.data, practiceId);
      await createAuditLog(ctx, "UPDATE", "Order", params.id);
      return apiSuccess(order, "Order updated");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "ORDER_NOT_FOUND") return apiNotFound("Order");
        if (err.message === "ORDER_ALREADY_DISPENSED") return apiError("Cannot modify a dispensed order", 400);
      }
      return apiServerError();
    }
  });
}