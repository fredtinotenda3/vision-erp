// path: app/api/appointments/calendar/route.ts
// ============================================================
// VISION ERP - Appointments Calendar API
// app/api/appointments/calendar/route.ts
// ------------------------------------------------------------
// Date-range retrieval for calendar views. Distinct from the
// paginated GET /api/appointments (which stays strictly capped).
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import { appointmentService } from "@/modules/appointments/appointment.service";
import { AppointmentCalendarQuerySchema } from "@/modules/appointments/appointment.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";
import { param } from "@/lib/query-params";

export async function GET(req: NextRequest) {
  return withPermission(req, "appointments:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = AppointmentCalendarQuerySchema.safeParse({
        from: param(sp, "from"),
        to: param(sp, "to"),
        optometristId: param(sp, "optometristId"),
        roomId: param(sp, "roomId"),
        status: param(sp, "status"),
        type: param(sp, "type"),
      });
      if (!parsed.success)
        return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? param(sp, "practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const appointments = await appointmentService.listCalendar(parsed.data, practiceId);
      return apiSuccess(appointments);
    } catch {
      return apiServerError();
    }
  });
}