// ============================================================
// VISION ERP - Appointment by ID
// app/api/appointments/[id]/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { appointmentService } from "@/modules/appointments/appointment.service";
import { UpdateAppointmentSchema } from "@/modules/appointments/appointment.types";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/utils";

interface RouteParams { params: { id: string } }

export async function GET(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "appointments:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      const appt = await appointmentService.getById(params.id, practiceId);
      return apiSuccess(appt);
    } catch (err) {
      if (err instanceof Error && err.message === "APPOINTMENT_NOT_FOUND") return apiNotFound("Appointment");
      return apiServerError();
    }
  });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "appointments:update", async (ctx) => {
    try {
      const body = await req.json();
      const practiceId = ctx.practiceId ?? body.practiceId ?? "";
      const parsed = UpdateAppointmentSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const appt = await appointmentService.update(params.id, parsed.data, practiceId);
      await createAuditLog(ctx, "UPDATE", "Appointment", params.id);
      return apiSuccess(appt, "Appointment updated");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "APPOINTMENT_NOT_FOUND") return apiNotFound("Appointment");
        if (err.message === "BOOKING_CONFLICT") return apiError("Booking conflict", 409);
      }
      return apiServerError();
    }
  });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withPermission(req, "appointments:delete", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? "";
      const body = await req.json().catch(() => ({}));
      await appointmentService.cancel(params.id, body.reason ?? "Cancelled", practiceId);
      await createAuditLog(ctx, "UPDATE", "Appointment", params.id, undefined, undefined, "Cancelled");
      return apiSuccess(null, "Appointment cancelled");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "APPOINTMENT_NOT_FOUND") return apiNotFound("Appointment");
        if (err.message === "CANNOT_CANCEL_COMPLETED") return apiError("Cannot cancel a completed appointment", 400);
      }
      return apiServerError();
    }
  });
}