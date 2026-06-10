// ============================================================
// VISION ERP - Clinical Records API
// app/api/clinical/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { clinicalService } from "@/modules/clinical/clinical.service";
import { CreateClinicalRecordSchema } from "@/modules/clinical/clinical.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "clinical:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const patientId = sp.get("patientId");
      if (!patientId) return apiError("patientId required", 400);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const records = await clinicalService.listRecords(patientId, practiceId);
      return apiSuccess(records);
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND") return apiNotFound("Patient");
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

      const practiceId = ctx.practiceId ?? body.practiceId ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const record = await clinicalService.createRecord(parsed.data, practiceId);
      await createAuditLog(ctx, "CREATE", "ClinicalRecord", record.id);
      return apiSuccess(record, "Clinical record created", undefined, 201);
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND") return apiNotFound("Patient");
      return apiServerError();
    }
  });
}