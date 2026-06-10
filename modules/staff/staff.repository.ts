// ============================================================
// VISION ERP - Staff Repository
// modules/staff/staff.repository.ts
// ============================================================

import db from "@/lib/db";
import { Prisma, Role } from "@prisma/client";
import { StaffQueryInput } from "./staff.types";

// ─── Select shapes ───────────────────────────────────────────────────────────
// Passwords are never returned from the repository layer.

const staffSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  practiceId: true,
  isActive: true,
  mustChangePassword: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const staffWithPracticeSelect = {
  ...staffSelect,
  practice: {
    select: { id: true, name: true, code: true },
  },
} satisfies Prisma.UserSelect;

export const staffRepository = {
  // ─── Find many ───────────────────────────────────────────────────────────────

  async findMany(params: StaffQueryInput, practiceId: string) {
    const { page, pageSize, search, role, isActive } = params;

    const where: Prisma.UserWhereInput = {
      practiceId,
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, staff] = await db.$transaction([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: staffWithPracticeSelect,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { staff, total };
  },

  // ─── Find by ID ──────────────────────────────────────────────────────────────

  async findById(id: string, practiceId: string) {
    return db.user.findFirst({
      where: { id, practiceId },
      select: staffWithPracticeSelect,
    });
  },

  // ─── Find by email (includes password for auth checks) ───────────────────────

  async findByEmailWithPassword(email: string) {
    return db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { ...staffSelect, password: true },
    });
  },

  // ─── Find by email (no password) ─────────────────────────────────────────────

  async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: staffSelect,
    });
  },

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(data: Prisma.UserCreateInput) {
    return db.user.create({ data, select: staffWithPracticeSelect });
  },

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, data: Prisma.UserUpdateInput) {
    return db.user.update({ where: { id }, data, select: staffWithPracticeSelect });
  },

  // ─── Update password only ────────────────────────────────────────────────────

  async updatePassword(id: string, hashedPassword: string, mustChangePassword = false) {
    return db.user.update({
      where: { id },
      data: { password: hashedPassword, mustChangePassword },
      select: staffSelect,
    });
  },

  // ─── Soft deactivate ─────────────────────────────────────────────────────────

  async deactivate(id: string) {
    return db.user.update({
      where: { id },
      data: { isActive: false },
      select: staffSelect,
    });
  },

  // ─── Count by role ───────────────────────────────────────────────────────────

  async countByRole(practiceId: string) {
    const roles = Object.values(Role);
    const counts = await Promise.all(
      roles.map((role) =>
        db.user
          .count({ where: { practiceId, role, isActive: true } })
          .then((count) => ({ role, count }))
      )
    );
    return Object.fromEntries(counts.map((c) => [c.role, c.count]));
  },

  // ─── Staff Rota ──────────────────────────────────────────────────────────────

  async findRota(practiceId: string, from?: string, to?: string, userId?: string) {
    return db.staffRota.findMany({
      where: {
        user: { practiceId },
        ...(userId && { userId }),
        ...(from && to && {
          date: { gte: new Date(from), lte: new Date(to) },
        }),
      },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });
  },

  async createRotaEntry(data: Prisma.StaffRotaCreateInput) {
    return db.staffRota.create({
      data,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  },

  async updateRotaEntry(id: string, data: Prisma.StaffRotaUpdateInput) {
    return db.staffRota.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  },

  async deleteRotaEntry(id: string) {
    return db.staffRota.delete({ where: { id } });
  },

  async findRotaEntry(id: string) {
    return db.staffRota.findUnique({
      where: { id },
      include: { user: { select: { id: true, practiceId: true } } },
    });
  },

  // ─── Staff Performance ───────────────────────────────────────────────────────

  async findPerformance(practiceId: string, from: string, to: string, userId?: string) {
    return db.staffPerformance.findMany({
      where: {
        user: { practiceId },
        ...(userId && { userId }),
        date: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: [{ date: "desc" }, { userId: "asc" }],
    });
  },

  async upsertPerformance(data: Prisma.StaffPerformanceCreateInput) {
    return db.staffPerformance.create({ data });
  },
};