// ============================================================
// VISION ERP - Sale by ID
// app/api/sales/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { saleService } from "@/modules/sales/sale.service";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams { params: { id: string } }

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "sales:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      const sale = await saleService.getById(params.id, practiceId);
      return apiSuccess(sale);
    } catch (err) {
      if (err instanceof Error && err.message === "SALE_NOT_FOUND") return apiNotFound("Sale");
      return apiServerError();
    }
  });
}

// PATCH /api/sales/[id] — void a sale
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "sales:void", async (ctx) => {
    try {
      const body = await req.json();
      const practiceId = ctx.practiceId ?? body.practiceId ?? "";
      if (!body.reason) return apiError("Void reason required", 400);

      const sale = await saleService.void(params.id, body.reason, practiceId);
      await createAuditLog(ctx, "UPDATE", "Sale", params.id, undefined, undefined, `Voided: ${body.reason}`);
      return apiSuccess(sale, "Sale voided");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "SALE_NOT_FOUND") return apiNotFound("Sale");
        if (err.message === "ALREADY_VOIDED") return apiError("Sale already voided", 400);
      }
      return apiServerError();
    }
  });
}