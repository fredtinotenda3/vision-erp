// ============================================================
// VISION ERP - Staff Rota API
// app/api/appointments/rota/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { appointmentService } from "@/modules/appointments/appointment.service";
import { StaffRotaSchema } from "@/modules/appointments/appointment.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "appointments:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      const from = sp.get("from") ?? new Date().toISOString().split("T")[0];
      const to = sp.get("to") ?? from;
      const rota = await appointmentService.getStaffRota(practiceId, from, to);
      return apiSuccess(rota);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "staff:create", async (_ctx) => {
    try {
      const body = await req.json();
      const parsed = StaffRotaSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);
      const rota = await appointmentService.createStaffRota(parsed.data);
      return apiSuccess(rota, "Rota entry created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}