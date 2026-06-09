// ============================================================
// VISION ERP - Appointment Service
// modules/appointments/appointment.service.ts
// ============================================================

import { appointmentRepository } from "./appointment.repository";
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentQueryInput,
  StaffRotaInput,
} from "./appointment.types";
import { buildPaginationMeta } from "@/lib/utils";

export const appointmentService = {
  async list(params: AppointmentQueryInput, practiceId: string) {
    const { appointments, total } = await appointmentRepository.findMany(params, practiceId);
    return { appointments, meta: buildPaginationMeta(params.page, params.pageSize, total) };
  },

  async getById(id: string, practiceId: string) {
    const appt = await appointmentRepository.findById(id, practiceId);
    if (!appt) throw new Error("APPOINTMENT_NOT_FOUND");
    return appt;
  },

  async create(input: CreateAppointmentInput) {
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);

    if (endTime <= startTime) throw new Error("END_BEFORE_START");

    // Conflict check
    const conflict = await appointmentRepository.checkConflict(
      input.practiceId,
      startTime,
      endTime,
      input.optometristId,
      input.roomId
    );

    if (conflict) throw new Error("BOOKING_CONFLICT");

    return appointmentRepository.create({
      startTime,
      endTime,
      duration: input.duration,
      type: input.type,
      notes: input.notes,
      reason: input.reason,
      isNew: input.isNew,
      patient: { connect: { id: input.patientId } },
      practice: { connect: { id: input.practiceId } },
      ...(input.optometristId && { optometrist: { connect: { id: input.optometristId } } }),
      ...(input.roomId && { room: { connect: { id: input.roomId } } }),
    });
  },

  async update(id: string, input: UpdateAppointmentInput, practiceId: string) {
    const existing = await appointmentRepository.findById(id, practiceId);
    if (!existing) throw new Error("APPOINTMENT_NOT_FOUND");

    // Conflict check on reschedule
    if (input.startTime || input.endTime) {
      const startTime = input.startTime ? new Date(input.startTime) : existing.startTime;
      const endTime = input.endTime ? new Date(input.endTime) : existing.endTime;

      const conflict = await appointmentRepository.checkConflict(
        practiceId,
        startTime,
        endTime,
        input.optometristId ?? existing.optometristId,
        input.roomId ?? existing.roomId,
        id
      );
      if (conflict) throw new Error("BOOKING_CONFLICT");
    }

    const completedAt =
      input.status === "COMPLETED" && !existing.completedAt ? new Date() : undefined;

    return appointmentRepository.update(id, {
      ...input,
      ...(input.startTime && { startTime: new Date(input.startTime) }),
      ...(input.endTime && { endTime: new Date(input.endTime) }),
      ...(input.arrivalTime && { arrivalTime: new Date(input.arrivalTime) }),
      ...(completedAt && { completedAt }),
    });
  },

  async cancel(id: string, reason: string, practiceId: string) {
    const existing = await appointmentRepository.findById(id, practiceId);
    if (!existing) throw new Error("APPOINTMENT_NOT_FOUND");
    if (existing.status === "COMPLETED") throw new Error("CANNOT_CANCEL_COMPLETED");

    return appointmentRepository.update(id, {
      status: "CANCELLED",
      cancelReason: reason,
    });
  },

  async getMissed(practiceId: string, from: string, to: string) {
    return appointmentRepository.getMissedAppointments(practiceId, new Date(from), new Date(to));
  },

  async getStaffRota(practiceId: string, from: string, to: string) {
    return appointmentRepository.getStaffRota(practiceId, from, to);
  },

  async createStaffRota(input: StaffRotaInput) {
    return appointmentRepository.upsertStaffRota({
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      isAvailable: input.isAvailable,
      notes: input.notes,
      user: { connect: { id: input.userId } },
    });
  },
};