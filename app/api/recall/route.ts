// ============================================================
// VISION ERP - Recall API Route
// app/api/recall/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { recallService } from "@/modules/recall/recall.service";
import { CreateRecallSchema, RecallQuerySchema } from "@/modules/recall/recall.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "recalls:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = RecallQuerySchema.safeParse({
        patientId: sp.get("patientId"),
        type: sp.get("type"),
        status: sp.get("status"),
        method: sp.get("method"),
        from: sp.get("from"),
        to: sp.get("to"),
        overdue: sp.get("overdue"),
        page: sp.get("page"),
        pageSize: sp.get("pageSize"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const result = await recallService.list(parsed.data, practiceId);
      return apiSuccess(result.recalls, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "recalls:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = CreateRecallSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const recall = await recallService.create(parsed.data);
      await createAuditLog(ctx, "CREATE", "Recall", recall.id);
      return apiSuccess(recall, "Recall created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}