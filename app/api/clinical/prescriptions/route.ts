// ============================================================
// VISION ERP - Prescriptions API
// app/api/clinical/prescriptions/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { clinicalService } from "@/modules/clinical/clinical.service";
import { CreatePrescriptionSchema } from "@/modules/clinical/clinical.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "clinical:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const patientId = sp.get("patientId");
      if (!patientId) return apiError("patientId required", 400);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const rxList = await clinicalService.listPrescriptions(patientId, practiceId);
      return apiSuccess(rxList);
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
      const parsed = CreatePrescriptionSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? body.practiceId ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const rx = await clinicalService.createPrescription(parsed.data, practiceId);
      await createAuditLog(ctx, "CREATE", "Prescription", rx.id);
      return apiSuccess(rx, "Prescription saved", undefined, 201);
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND") return apiNotFound("Patient");
      return apiServerError();
    }
  });
}