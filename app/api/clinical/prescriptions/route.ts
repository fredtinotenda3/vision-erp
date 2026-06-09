// ============================================================
// VISION ERP - Prescriptions API
// app/api/clinical/prescriptions/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { clinicalService } from "@/modules/clinical/clinical.service";
import { CreatePrescriptionSchema } from "@/modules/clinical/clinical.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "clinical:read", async (_ctx) => {
    try {
      const patientId = req.nextUrl.searchParams.get("patientId");
      if (!patientId) return apiError("patientId required", 400);
      const rxList = await clinicalService.listPrescriptions(patientId);
      return apiSuccess(rxList);
    } catch {
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

      const rx = await clinicalService.createPrescription(parsed.data);
      await createAuditLog(ctx, "CREATE", "Prescription", rx.id);
      return apiSuccess(rx, "Prescription saved", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}