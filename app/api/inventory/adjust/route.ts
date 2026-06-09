// ============================================================
// VISION ERP - Stock Adjustment API
// app/api/inventory/adjust/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { inventoryService, StockAdjustmentSchema } from "@/modules/inventory/inventory.service";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  return withPermission(req, "inventory:update", async (ctx) => {
    try {
      const body = await req.json();
      const parsed = StockAdjustmentSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const result = await inventoryService.adjust(parsed.data, ctx.userId);
      await createAuditLog(ctx, "UPDATE", "StockItem", parsed.data.stockItemId,
        undefined, undefined, `Stock ${parsed.data.type}: ${parsed.data.quantity}`);
      return apiSuccess(result, "Stock adjusted");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "ITEM_NOT_FOUND") return apiNotFound("Stock item");
        if (err.message === "INSUFFICIENT_STOCK") return apiError("Insufficient stock", 400);
      }
      return apiServerError();
    }
  });
}