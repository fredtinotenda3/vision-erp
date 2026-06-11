// path: app/api/appointments/[id]/route.ts
// ============================================================
// VISION ERP - Single Appointment API
// app/api/appointments/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { appointmentService } from "@/modules/appointments/appointment.service";
import { UpdateAppointmentSchema } from "@/modules/appointments/appointment.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";
import { param } from "@/lib/query-params";

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return withPermission(req, "appointments:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? param(req.nextUrl.searchParams, "practiceId") ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const appt = await appointmentService.getById(params.id, practiceId);
      return apiSuccess(appt);
    } catch (err) {
      if (err instanceof Error && err.message === "APPOINTMENT_NOT_FOUND")
        return apiNotFound("Appointment");
      return apiServerError();
    }
  });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  return withPermission(req, "appointments:update", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const body = await req.json();
      const parsed = UpdateAppointmentSchema.safeParse(body);
      if (!parsed.success)
        return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const appt = await appointmentService.update(params.id, parsed.data, practiceId);
      await createAuditLog(ctx, "UPDATE", "Appointment", appt.id);
      return apiSuccess(appt, "Appointment updated");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "APPOINTMENT_NOT_FOUND") return apiNotFound("Appointment");
        if (err.message === "BOOKING_CONFLICT") return apiError("Booking conflict: slot already taken", 409);
        if (err.message === "OPTOMETRIST_NOT_FOUND") return apiNotFound("Optometrist");
        if (err.message === "ROOM_NOT_FOUND") return apiNotFound("Room");
      }
      return apiServerError();
    }
  });
}

// DELETE = soft cancel. Appointments are never hard-deleted (audit integrity).
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return withPermission(req, "appointments:delete", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? "";
      if (!practiceId) return apiError("Practice ID required", 400);

      const reason = param(req.nextUrl.searchParams, "reason") ?? "Cancelled";
      const appt = await appointmentService.cancel(params.id, reason, practiceId);
      await createAuditLog(ctx, "UPDATE", "Appointment", appt.id, undefined, undefined, "Appointment cancelled");
      return apiSuccess(appt, "Appointment cancelled");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "APPOINTMENT_NOT_FOUND") return apiNotFound("Appointment");
        if (err.message === "CANNOT_CANCEL_COMPLETED")
          return apiError("Completed appointments cannot be cancelled", 409);
      }
      return apiServerError();
    }
  });
}