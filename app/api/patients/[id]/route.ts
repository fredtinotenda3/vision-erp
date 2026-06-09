// ============================================================
// VISION ERP - Patient by ID API Route
// app/api/patients/[id]/route.ts
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
// GET /api/patients/[id] — Get patient by ID
// ============================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "patients:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";

      const profile = await patientService.getProfile(params.id, practiceId);

      return apiSuccess(profile);
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND") {
        return apiNotFound("Patient");
      }
      return apiServerError();
    }
  });
}

// ============================================================
// PUT /api/patients/[id] — Update patient
// ============================================================

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "patients:update", async (ctx) => {
    try {
      const body = await req.json();
      const practiceId = ctx.practiceId ?? body.practiceId ?? "";

      const parsed = UpdatePatientSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
      }

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
        `Updated patient ${params.id}`
      );

      return apiSuccess(result.patient, "Patient updated successfully");
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND") {
        return apiNotFound("Patient");
      }
      return apiServerError();
    }
  });
}

// ============================================================
// DELETE /api/patients/[id] — Soft delete patient
// ============================================================

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "patients:delete", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";

      await patientService.delete(params.id, practiceId);

      await createAuditLog(
        ctx,
        "DELETE",
        "Patient",
        params.id,
        undefined,
        undefined,
        `Deleted (deactivated) patient ${params.id}`
      );

      return apiSuccess(null, "Patient deactivated successfully");
    } catch (err) {
      if (err instanceof Error && err.message === "PATIENT_NOT_FOUND") {
        return apiNotFound("Patient");
      }
      return apiServerError();
    }
  });
}