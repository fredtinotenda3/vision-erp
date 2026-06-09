// ============================================================
// VISION ERP - Appointment Repository
// modules/appointments/appointment.repository.ts
// ============================================================

import db from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AppointmentQueryInput } from "./appointment.types";

const appointmentSelect = {
  id: true,
  patientId: true,
  practiceId: true,
  optometristId: true,
  roomId: true,
  type: true,
  status: true,
  startTime: true,
  endTime: true,
  duration: true,
  notes: true,
  reason: true,
  isNew: true,
  reminderSent: true,
  arrivalTime: true,
  completedAt: true,
  cancelReason: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: { id: true, refNo: true, forename: true, surname: true, mobile: true, dob: true },
  },
  optometrist: {
    select: { id: true, name: true, email: true },
  },
  room: {
    select: { id: true, name: true, color: true },
  },
} satisfies Prisma.AppointmentSelect;

export const appointmentRepository = {
  async findMany(params: AppointmentQueryInput, practiceId: string) {
    const { page, pageSize, date, from, to, optometristId, roomId, patientId, status, type } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.AppointmentWhereInput = {
      practiceId,
      ...(patientId && { patientId }),
      ...(optometristId && { optometristId }),
      ...(roomId && { roomId }),
      ...(status && { status }),
      ...(type && { type }),
      ...(date && {
        startTime: {
          gte: new Date(date + "T00:00:00"),
          lte: new Date(date + "T23:59:59"),
        },
      }),
      ...(!date && from && to && {
        startTime: { gte: new Date(from), lte: new Date(to) },
      }),
    };

    const [total, appointments] = await db.$transaction([
      db.appointment.count({ where }),
      db.appointment.findMany({
        where,
        select: appointmentSelect,
        orderBy: { startTime: "asc" },
        skip,
        take: pageSize,
      }),
    ]);

    return { appointments, total };
  },

  async findById(id: string, practiceId: string) {
    return db.appointment.findFirst({
      where: { id, practiceId },
      select: appointmentSelect,
    });
  },

  async create(data: Prisma.AppointmentCreateInput) {
    return db.appointment.create({ data, select: appointmentSelect });
  },

  async update(id: string, data: Prisma.AppointmentUpdateInput) {
    return db.appointment.update({ where: { id }, data, select: appointmentSelect });
  },

  async delete(id: string) {
    return db.appointment.delete({ where: { id } });
  },

  // Check for booking conflicts
  async checkConflict(
    practiceId: string,
    startTime: Date,
    endTime: Date,
    optometristId?: string | null,
    roomId?: string | null,
    excludeId?: string
  ) {
    const where: Prisma.AppointmentWhereInput = {
      practiceId,
      status: { notIn: ["CANCELLED", "MISSED", "NO_SHOW"] },
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
      ...(excludeId && { NOT: { id: excludeId } }),
      OR: [
        ...(optometristId ? [{ optometristId }] : []),
        ...(roomId ? [{ roomId }] : []),
      ],
    };

    // Only check if at least one conflict dimension exists
    if (!optometristId && !roomId) return null;

    return db.appointment.findFirst({ where, select: { id: true, startTime: true, optometristId: true, roomId: true } });
  },

  async getMissedAppointments(practiceId: string, from: Date, to: Date) {
    return db.appointment.findMany({
      where: {
        practiceId,
        status: { in: ["MISSED", "NO_SHOW"] },
        startTime: { gte: from, lte: to },
      },
      select: appointmentSelect,
      orderBy: { startTime: "desc" },
    });
  },

  async getStaffRota(practiceId: string, from: string, to: string) {
    return db.staffRota.findMany({
      where: {
        date: { gte: new Date(from), lte: new Date(to) },
        user: { practiceId },
      },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },

  async upsertStaffRota(data: Prisma.StaffRotaCreateInput) {
    return db.staffRota.create({ data });
  },
};