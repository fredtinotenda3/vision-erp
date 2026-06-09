// ============================================================
// VISION ERP - Clinical Records API
// app/api/clinical/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { clinicalService } from "@/modules/clinical/clinical.service";
import { CreateClinicalRecordSchema } from "@/modules/clinical/clinical.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "clinical:read", async (_ctx) => {
    try {
      const patientId = req.nextUrl.searchParams.get("patientId");
      if (!patientId) return apiError("patientId required", 400);
      const records = await clinicalService.listRecords(patientId);
      return apiSuccess(records);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "clinical:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.examinedById) body.examinedById = ctx.userId;

      const parsed = CreateClinicalRecordSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const record = await clinicalService.createRecord(parsed.data);
      await createAuditLog(ctx, "CREATE", "ClinicalRecord", record.id);
      return apiSuccess(record, "Clinical record created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}