// path: app/api/appointments/rota/route.ts
// ============================================================
// VISION ERP - Staff Rota (read-only, appointments view)
// app/api/appointments/rota/route.ts
// ------------------------------------------------------------
// Appointments CONSUME rota for scheduling context. Rota CREATION
// and management are owned by the staff module
// (POST /api/staff/rota). Do not reintroduce a write path here.
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { appointmentService } from "@/modules/appointments/appointment.service";
import { apiSuccess, apiServerError } from "@/lib/utils";

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