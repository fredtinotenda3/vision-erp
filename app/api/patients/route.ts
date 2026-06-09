// ============================================================
// VISION ERP - Patients API Route
// app/api/patients/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { patientService } from "@/modules/patients/patient.service";
import {
  CreatePatientSchema,
  PatientSearchSchema,
} from "@/modules/patients/patient.types";
import {
  apiSuccess,
  apiError,
  apiServerError,
} from "@/lib/utils";

// ============================================================
// GET /api/patients — Search & list patients
// ============================================================

export async function GET(req: NextRequest) {
  return withPermission(req, "patients:read", async (ctx) => {
    try {
      const { searchParams } = req.nextUrl;

      const parsed = PatientSearchSchema.safeParse({
        search: searchParams.get("search"),
        surname: searchParams.get("surname"),
        forename: searchParams.get("forename"),
        dob: searchParams.get("dob"),
        postcode: searchParams.get("postcode"),
        refNo: searchParams.get("refNo"),
        phone: searchParams.get("phone"),
        page: searchParams.get("page"),
        pageSize: searchParams.get("pageSize"),
        sortBy: searchParams.get("sortBy"),
        sortOrder: searchParams.get("sortOrder"),
      });

      if (!parsed.success) {
        return apiError("Invalid query parameters", 400, parsed.error.flatten().fieldErrors);
      }

      const practiceId = ctx.practiceId ?? searchParams.get("practiceId") ?? "";
      if (!practiceId) {
        return apiError("Practice ID is required", 400);
      }

      const { patients, meta } = await patientService.search(
        parsed.data,
        practiceId
      );

      return apiSuccess(patients, undefined, meta);
    } catch {
      return apiServerError();
    }
  });
}

// ============================================================
// POST /api/patients — Create new patient
// ============================================================

export async function POST(req: NextRequest) {
  return withPermission(req, "patients:create", async (ctx) => {
    try {
      const body = await req.json();

      // Inject practiceId from auth context if not provided
      if (!body.practiceId && ctx.practiceId) {
        body.practiceId = ctx.practiceId;
      }

      const parsed = CreatePatientSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
      }

      const result = await patientService.create(parsed.data, ctx.userId);

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
        `Created patient ${result.patient?.refNo}`
      );

      return apiSuccess(result.patient, "Patient created successfully", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}