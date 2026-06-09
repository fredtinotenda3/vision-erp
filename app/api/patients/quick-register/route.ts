// ============================================================
// VISION ERP - Quick Register API Route
// app/api/patients/quick-register/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { patientService } from "@/modules/patients/patient.service";
import { QuickRegisterSchema } from "@/modules/patients/patient.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

// ============================================================
// POST /api/patients/quick-register
// ============================================================

export async function POST(req: NextRequest) {
  return withPermission(req, "patients:create", async (ctx) => {
    try {
      const body = await req.json();

      if (!body.practiceId && ctx.practiceId) {
        body.practiceId = ctx.practiceId;
      }

      const parsed = QuickRegisterSchema.safeParse(body);
      if (!parsed.success) {
        return apiError(
          "Validation failed",
          422,
          parsed.error.flatten().fieldErrors
        );
      }

      const result = await patientService.quickRegister(
        parsed.data,
        ctx.userId
      );

      if (result.isDuplicate) {
        return apiError(
          "A patient with the same name and date of birth already exists",
          409,
          { duplicate: [`Patient Ref: ${result.duplicate?.refNo}`] }
        );
      }

      await createAuditLog(
        ctx,
        "CREATE",
        "Patient",
        result.patient!.id,
        undefined,
        result.patient as object,
        `Quick registered patient ${result.patient?.refNo}`
      );

      return apiSuccess(
        result.patient,
        "Patient quick registered successfully",
        undefined,
        201
      );
    } catch {
      return apiServerError();
    }
  });
}