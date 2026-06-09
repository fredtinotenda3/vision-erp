// ============================================================
// VISION ERP - Clinical Record by ID
// app/api/clinical/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { clinicalService } from "@/modules/clinical/clinical.service";
import { CreateClinicalRecordSchema } from "@/modules/clinical/clinical.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams { params: { id: string } }

export async function GET(_req: NextRequest, { params }: RouteParams) {
  return withPermission(_req, "clinical:read", async (_ctx) => {
    try {
      const record = await clinicalService.getRecord(params.id);
      return apiSuccess(record);
    } catch (err) {
      if (err instanceof Error && err.message === "RECORD_NOT_FOUND") return apiNotFound("Clinical record");
      return apiServerError();
    }
  });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "clinical:update", async (ctx) => {
    try {
      const body = await req.json();
      const parsed = CreateClinicalRecordSchema.partial().safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const record = await clinicalService.updateRecord(params.id, parsed.data);
      await createAuditLog(ctx, "UPDATE", "ClinicalRecord", params.id);
      return apiSuccess(record, "Record updated");
    } catch (err) {
      if (err instanceof Error && err.message === "RECORD_NOT_FOUND") return apiNotFound("Clinical record");
      return apiServerError();
    }
  });
}