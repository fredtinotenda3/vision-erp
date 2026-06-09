// ============================================================
// VISION ERP - Sales API
// app/api/sales/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { saleService } from "@/modules/sales/sale.service";
import { CreateSaleSchema, SaleQuerySchema } from "@/modules/sales/sale.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "sales:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = SaleQuerySchema.safeParse({
        patientId: sp.get("patientId"), from: sp.get("from"), to: sp.get("to"),
        search: sp.get("search"), page: sp.get("page"), pageSize: sp.get("pageSize"),
      });
      if (!parsed.success) return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      const result = await saleService.list(parsed.data, practiceId);
      return apiSuccess(result.sales, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "sales:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = CreateSaleSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const sale = await saleService.create(parsed.data, ctx.userId);
      await createAuditLog(ctx, "CREATE", "Sale", sale.id);
      return apiSuccess(sale, "Sale recorded", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}