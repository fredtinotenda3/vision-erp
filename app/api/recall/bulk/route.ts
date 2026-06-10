// ============================================================
// VISION ERP - Recall Bulk Generate API Route
// app/api/recall/bulk/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { recallService } from "@/modules/recall/recall.service";
import { BulkCreateRecallSchema } from "@/modules/recall/recall.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  return withPermission(req, "recalls:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = BulkCreateRecallSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const result = await recallService.bulkGenerate(parsed.data);
      await createAuditLog(
        ctx,
        "CREATE",
        "Recall",
        undefined,
        undefined,
        undefined,
        `Bulk generated ${result.created} recall(s)`
      );
      return apiSuccess(result, `${result.created} recall(s) generated`, undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}