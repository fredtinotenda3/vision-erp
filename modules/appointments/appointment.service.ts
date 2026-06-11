// path: modules/appointments/appointment.service.ts
// ============================================================
// VISION ERP - Appointment Service
// modules/appointments/appointment.service.ts
// ============================================================

import db from "@/lib/db";
import { appointmentRepository } from "./appointment.repository";
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentQueryInput,
  AppointmentCalendarQueryInput,
} from "./appointment.types";
import { buildPaginationMeta } from "@/lib/utils";

// Tenant-boundary guard: verify every connected entity belongs to the caller's
// practice before writing. Rooms may be practice-scoped OR global (practiceId null),
// mirroring recallRepository.findConfigs.
async function assertEntitiesInPractice(
  practiceId: string,
  patientId: string,
  optometristId?: string | null,
  roomId?: string | null
) {
  const [patient, optometrist, room] = await Promise.all([
    db.patient.findFirst({ where: { id: patientId, practiceId }, select: { id: true } }),
    optometristId
      ? db.user.findFirst({ where: { id: optometristId, practiceId }, select: { id: true } })
      : Promise.resolve({ id: "" }),
    roomId
      ? db.room.findFirst({
          where: { id: roomId, OR: [{ practiceId }, { practiceId: null }] },
          select: { id: true },
        })
      : Promise.resolve({ id: "" }),
  ]);

  if (!patient) throw new Error("PATIENT_NOT_FOUND");
  if (optometristId && !optometrist) throw new Error("OPTOMETRIST_NOT_FOUND");
  if (roomId && !room) throw new Error("ROOM_NOT_FOUND");
}

// Same guard but only for the mutable resources on reschedule/update.
async function assertResourcesInPractice(
  practiceId: string,
  optometristId?: string | null,
  roomId?: string | null
) {
  const [optometrist, room] = await Promise.all([
    optometristId
      ? db.user.findFirst({ where: { id: optometristId, practiceId }, select: { id: true } })
      : Promise.resolve({ id: "" }),
    roomId
      ? db.room.findFirst({
          where: { id: roomId, OR: [{ practiceId }, { practiceId: null }] },
          select: { id: true },
        })
      : Promise.resolve({ id: "" }),
  ]);

  if (optometristId && !optometrist) throw new Error("OPTOMETRIST_NOT_FOUND");
  if (roomId && !room) throw new Error("ROOM_NOT_FOUND");
}

export const appointmentService = {
  async list(params: AppointmentQueryInput, practiceId: string) {
    const { appointments, total } = await appointmentRepository.findMany(params, practiceId);
    return { appointments, meta: buildPaginationMeta(params.page, params.pageSize, total) };
  },

  async listCalendar(params: AppointmentCalendarQueryInput, practiceId: string) {
    return appointmentRepository.findCalendar(params, practiceId);
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

    // A4: tenant boundary - reject foreign patient/optometrist/room.
    await assertEntitiesInPractice(
      input.practiceId,
      input.patientId,
      input.optometristId,
      input.roomId
    );

    // A5: re-check conflict and insert inside ONE transaction to remove the race.
    return db.$transaction(async (tx) => {
      const conflict = await appointmentRepository.checkConflict(
        input.practiceId,
        startTime,
        endTime,
        input.optometristId,
        input.roomId,
        undefined,
        tx
      );
      if (conflict) throw new Error("BOOKING_CONFLICT");

      return appointmentRepository.create(
        {
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
        },
        tx
      );
    });
  },

  async update(id: string, input: UpdateAppointmentInput, practiceId: string) {
    const existing = await appointmentRepository.findById(id, practiceId);
    if (!existing) throw new Error("APPOINTMENT_NOT_FOUND");

    // A4: validate any reassigned resources belong to this practice.
    await assertResourcesInPractice(practiceId, input.optometristId, input.roomId);

    const completedAt =
      input.status === "COMPLETED" && !existing.completedAt ? new Date() : undefined;

    const timeOrResourceChanged =
      Boolean(input.startTime) ||
      Boolean(input.endTime) ||
      input.optometristId !== undefined ||
      input.roomId !== undefined;

    return db.$transaction(async (tx) => {
      // A5: conflict re-check on reschedule/reassign, atomic with the write.
      if (timeOrResourceChanged) {
        const startTime = input.startTime ? new Date(input.startTime) : existing.startTime;
        const endTime = input.endTime ? new Date(input.endTime) : existing.endTime;

        const conflict = await appointmentRepository.checkConflict(
          practiceId,
          startTime,
          endTime,
          input.optometristId ?? existing.optometristId,
          input.roomId ?? existing.roomId,
          id,
          tx
        );
        if (conflict) throw new Error("BOOKING_CONFLICT");
      }

      return appointmentRepository.update(
        id,
        {
          ...input,
          ...(input.startTime && { startTime: new Date(input.startTime) }),
          ...(input.endTime && { endTime: new Date(input.endTime) }),
          ...(input.arrivalTime && { arrivalTime: new Date(input.arrivalTime) }),
          ...(completedAt && { completedAt }),
        },
        tx
      );
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

  // Appointments CONSUME rota only.
  async getStaffRota(practiceId: string, from: string, to: string) {
    return appointmentRepository.getStaffRota(practiceId, from, to);
  },
};