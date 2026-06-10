// ============================================================
// VISION ERP - Recall Send API Route
// app/api/recall/send/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { recallService } from "@/modules/recall/recall.service";
import { SendRecallSchema } from "@/modules/recall/recall.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  return withPermission(req, "recalls:send", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = SendRecallSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const result = await recallService.sendRecalls(parsed.data, practiceId);
      await createAuditLog(
        ctx,
        "UPDATE",
        "Recall",
        undefined,
        undefined,
        undefined,
        `Sent ${result.sent} recall(s)`
      );
      return apiSuccess(result, `${result.sent} recall(s) marked as sent`);
    } catch (err) {
      if (err instanceof Error && err.message === "NO_VALID_RECALLS")
        return apiError("No valid recalls found for this practice", 404);
      return apiServerError();
    }
  });
}