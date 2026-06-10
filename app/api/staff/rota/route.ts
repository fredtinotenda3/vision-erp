// ============================================================
// VISION ERP - Staff Rota API Route
// app/api/staff/rota/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { staffService } from "@/modules/staff/staff.service";
import { StaffRotaSchema, StaffRotaQuerySchema } from "@/modules/staff/staff.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "staff:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = StaffRotaQuerySchema.safeParse({
        from: sp.get("from"),
        to: sp.get("to"),
        userId: sp.get("userId"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const rota = await staffService.listRota(parsed.data, practiceId);
      return apiSuccess(rota);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "staff:create", async (ctx) => {
    try {
      const body = await req.json();
      const parsed = StaffRotaSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const entry = await staffService.createRotaEntry(parsed.data);
      await createAuditLog(ctx, "CREATE", "StaffRota", entry.id);
      return apiSuccess(entry, "Rota entry created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}