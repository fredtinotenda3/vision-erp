// path: modules/appointments/appointment.repository.ts
// ============================================================
// VISION ERP - Appointment Repository
// modules/appointments/appointment.repository.ts
// ============================================================

import db from "@/lib/db";
import { Prisma, PrismaClient } from "@prisma/client";
import { AppointmentQueryInput, AppointmentCalendarQueryInput } from "./appointment.types";

// Accepts either the singleton client or an interactive transaction client.
type DbClient = PrismaClient | Prisma.TransactionClient;

export const appointmentSelect = {
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
  reminderSentAt: true,
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
      // FIX (A3): include the whole `to` day instead of truncating at UTC midnight.
      ...(!date && from && to && {
        startTime: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
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

  // Dedicated calendar retrieval - date-range bounded, no pagination,
  // hard-capped to protect the server as appointment volume grows.
  async findCalendar(params: AppointmentCalendarQueryInput, practiceId: string) {
    const { from, to, optometristId, roomId, status, type } = params;

    const where: Prisma.AppointmentWhereInput = {
      practiceId,
      startTime: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      ...(optometristId && { optometristId }),
      ...(roomId && { roomId }),
      ...(status && { status }),
      ...(type && { type }),
    };

    return db.appointment.findMany({
      where,
      select: appointmentSelect,
      orderBy: { startTime: "asc" },
      take: 1000, // safety ceiling; a single practice should never exceed this in one window
    });
  },

  async findById(id: string, practiceId: string) {
    return db.appointment.findFirst({
      where: { id, practiceId },
      select: appointmentSelect,
    });
  },

  async create(data: Prisma.AppointmentCreateInput, client: DbClient = db) {
    return client.appointment.create({ data, select: appointmentSelect });
  },

  async update(id: string, data: Prisma.AppointmentUpdateInput, client: DbClient = db) {
    return client.appointment.update({ where: { id }, data, select: appointmentSelect });
  },

  async delete(id: string) {
    return db.appointment.delete({ where: { id } });
  },

  // Conflict detection. Accepts a transaction client so the caller can
  // re-check inside the same transaction as the write (closes the TOCTOU race).
  async checkConflict(
    practiceId: string,
    startTime: Date,
    endTime: Date,
    optometristId?: string | null,
    roomId?: string | null,
    excludeId?: string,
    client: DbClient = db
  ) {
    // Only meaningful when a shared resource (optometrist or room) is involved.
    if (!optometristId && !roomId) return null;

    const where: Prisma.AppointmentWhereInput = {
      practiceId,
      status: { notIn: ["CANCELLED", "MISSED", "NO_SHOW"] },
      AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      ...(excludeId && { NOT: { id: excludeId } }),
      OR: [
        ...(optometristId ? [{ optometristId }] : []),
        ...(roomId ? [{ roomId }] : []),
      ],
    };

    return client.appointment.findFirst({
      where,
      select: { id: true, startTime: true, optometristId: true, roomId: true },
    });
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

  // Appointments CONSUME rota only. Rota writes are owned by the staff module.
  async getStaffRota(practiceId: string, from: string, to: string) {
    return db.staffRota.findMany({
      where: {
        date: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
        user: { practiceId },
      },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },
};