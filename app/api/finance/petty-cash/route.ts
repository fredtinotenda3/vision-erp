// ============================================================
// VISION ERP - Finance Petty Cash API
// app/api/finance/petty-cash/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { financeService } from "@/modules/finance/finance.service";
import { PettyCashSchema, PettyCashQuerySchema } from "@/modules/finance/finance.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "finance:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = PettyCashQuerySchema.safeParse({
        from: sp.get("from"),
        to: sp.get("to"),
        isExpense: sp.get("isExpense"),
        category: sp.get("category"),
        page: sp.get("page"),
        pageSize: sp.get("pageSize"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const result = await financeService.listPettyCash(practiceId, parsed.data);
      return apiSuccess(result.entries, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "finance:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = PettyCashSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const entry = await financeService.createPettyCash(parsed.data, ctx.userId);
      await createAuditLog(ctx, "CREATE", "PettyCash", entry.id);
      return apiSuccess(entry, "Petty cash entry recorded", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}