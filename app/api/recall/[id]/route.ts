// ============================================================
// VISION ERP - Recall [id] API Route
// app/api/recall/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { recallService } from "@/modules/recall/recall.service";
import { UpdateRecallSchema } from "@/modules/recall/recall.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "recalls:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const recall = await recallService.getById(params.id, practiceId);
      return apiSuccess(recall);
    } catch (err) {
      if (err instanceof Error && err.message === "RECALL_NOT_FOUND")
        return apiNotFound("Recall");
      return apiServerError();
    }
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "recalls:create", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = UpdateRecallSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const recall = await recallService.update(params.id, parsed.data, practiceId);
      await createAuditLog(ctx, "UPDATE", "Recall", params.id);
      return apiSuccess(recall, "Recall updated");
    } catch (err) {
      if (err instanceof Error && err.message === "RECALL_NOT_FOUND")
        return apiNotFound("Recall");
      return apiServerError();
    }
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "recalls:create", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      await recallService.delete(params.id, practiceId);
      await createAuditLog(ctx, "DELETE", "Recall", params.id);
      return apiSuccess(null, "Recall deleted");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "RECALL_NOT_FOUND") return apiNotFound("Recall");
        if (err.message === "CANNOT_DELETE_SENT_RECALL")
          return apiError("Cannot delete a recall that has already been sent", 400);
      }
      return apiServerError();
    }
  });
}