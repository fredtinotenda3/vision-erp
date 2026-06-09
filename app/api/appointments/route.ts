// ============================================================
// VISION ERP - Appointments API Route
// app/api/appointments/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { appointmentService } from "@/modules/appointments/appointment.service";
import { CreateAppointmentSchema, AppointmentQuerySchema } from "@/modules/appointments/appointment.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "appointments:read", async (ctx) => {
    try {
      const sp = req.nextUrl.searchParams;
      const parsed = AppointmentQuerySchema.safeParse({
        date: sp.get("date"),
        from: sp.get("from"),
        to: sp.get("to"),
        optometristId: sp.get("optometristId"),
        roomId: sp.get("roomId"),
        patientId: sp.get("patientId"),
        status: sp.get("status"),
        type: sp.get("type"),
        page: sp.get("page"),
        pageSize: sp.get("pageSize"),
      });
      if (!parsed.success) return apiError("Invalid query", 400, parsed.error.flatten().fieldErrors);

      const practiceId = ctx.practiceId ?? sp.get("practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const result = await appointmentService.list(parsed.data, practiceId);
      return apiSuccess(result.appointments, undefined, result.meta);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "appointments:create", async (ctx) => {
    try {
      const body = await req.json();
      if (!body.practiceId && ctx.practiceId) body.practiceId = ctx.practiceId;

      const parsed = CreateAppointmentSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const appt = await appointmentService.create(parsed.data);

      await createAuditLog(ctx, "CREATE", "Appointment", appt.id);
      return apiSuccess(appt, "Appointment booked", undefined, 201);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "BOOKING_CONFLICT") return apiError("Booking conflict: slot already taken", 409);
        if (err.message === "END_BEFORE_START") return apiError("End time must be after start time", 400);
      }
      return apiServerError();
    }
  });
}