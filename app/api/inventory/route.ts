// ============================================================
// VISION ERP - Inventory API
// app/api/inventory/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import {
  inventoryService,
  CreateStockItemSchema,
  InventoryQuerySchema,
} from "@/modules/inventory/inventory.service";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "inventory:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = InventoryQuerySchema.safeParse({
        search: sp.get("search"), categoryId: sp.get("categoryId"),
        lowStock: sp.get("lowStock"), page: sp.get("page"), pageSize: sp.get("pageSize"),
      });
      if (!parsed.success) return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      const result = await inventoryService.list(parsed.data, practiceId);
      return apiSuccess(result.items, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "inventory:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = CreateStockItemSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const item = await inventoryService.create(parsed.data);
      await createAuditLog(ctx, "CREATE", "StockItem", item.id);
      return apiSuccess(item, "Stock item created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}