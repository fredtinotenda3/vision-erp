// ============================================================
// VISION ERP - Patient [id] API Route
// app/api/patients/[id]/route.ts
// ------------------------------------------------------------
// GET    /api/patients/:id  – fetch single patient with relations
// PATCH  /api/patients/:id  – update patient
// DELETE /api/patients/:id  – soft-delete patient
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { patientService } from "@/modules/patients/patient.service";
import { UpdatePatientSchema } from "@/modules/patients/patient.types";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiServerError,
} from "@/lib/utils";

interface RouteParams {
  params: { id: string };
}

// ============================================================
// GET /api/patients/:id
// ============================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "patients:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const patient = await patientService.getById(params.id, practiceId);
      return apiSuccess(patient);
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND")
        return apiNotFound("Patient");
      return apiServerError();
    }
  });
}

// ============================================================
// PATCH /api/patients/:id
// ============================================================

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "patients:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = UpdatePatientSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const result = await patientService.update(params.id, parsed.data, practiceId);

      if (result.isDuplicate) {
        return apiError(
          "A patient with the same name and date of birth already exists",
          409,
          { duplicate: [`Patient Ref: ${result.duplicate?.refNo}`] }
        );
      }

      await createAuditLog(
        ctx,
        "UPDATE",
        "Patient",
        params.id,
        undefined,
        result.patient as object,
        `Updated patient ${result.patient?.refNo}`
      );

      return apiSuccess(result.patient, "Patient updated successfully");
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND")
        return apiNotFound("Patient");
      return apiServerError();
    }
  });
}

// ============================================================
// DELETE /api/patients/:id  (soft delete)
// ============================================================

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "patients:delete", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      await patientService.delete(params.id, practiceId);

      await createAuditLog(
        ctx,
        "DELETE",
        "Patient",
        params.id,
        undefined,
        undefined,
        `Archived patient ${params.id}`
      );

      return apiSuccess(null, "Patient archived successfully");
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND")
        return apiNotFound("Patient");
      return apiServerError();
    }
  });
}