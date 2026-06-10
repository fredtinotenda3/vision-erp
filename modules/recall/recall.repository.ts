// ============================================================
// VISION ERP - Recall Repository
// modules/recall/recall.repository.ts
// ============================================================

import db from "@/lib/db";
import { Prisma, RecallStatus } from "@prisma/client";
import { RecallQueryInput } from "./recall.types";

const recallSelect = {
  id: true,
  patientId: true,
  practiceId: true,
  type: true,
  status: true,
  method: true,
  dueDate: true,
  sentAt: true,
  respondedAt: true,
  response: true,
  message: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: {
      id: true,
      refNo: true,
      forename: true,
      surname: true,
      mobile: true,
      email: true,
      dob: true,
    },
  },
} satisfies Prisma.RecallSelect;

export const recallRepository = {
  // ─── Find many ──────────────────────────────────────────────────────────────

  async findMany(params: RecallQueryInput, practiceId: string) {
    const { page, pageSize, patientId, type, status, method, from, to, overdue } = params;

    const where: Prisma.RecallWhereInput = {
      practiceId,
      ...(patientId && { patientId }),
      ...(type && { type }),
      ...(status && { status }),
      ...(method && { method }),
      ...(overdue && {
        dueDate: { lt: new Date() },
        status: RecallStatus.PENDING,
      }),
      ...(!overdue && from && to && {
        dueDate: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      }),
    };

    const [total, recalls] = await db.$transaction([
      db.recall.count({ where }),
      db.recall.findMany({
        where,
        select: recallSelect,
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { recalls, total };
  },

  // ─── Find by ID ─────────────────────────────────────────────────────────────

  async findById(id: string, practiceId: string) {
    return db.recall.findFirst({
      where: { id, practiceId },
      select: recallSelect,
    });
  },

  // ─── Find by patient ────────────────────────────────────────────────────────

  async findByPatient(patientId: string) {
    return db.recall.findMany({
      where: { patientId },
      select: recallSelect,
      orderBy: { dueDate: "desc" },
    });
  },

  // ─── Create ─────────────────────────────────────────────────────────────────

  async create(data: Prisma.RecallCreateInput) {
    return db.recall.create({ data, select: recallSelect });
  },

  // ─── Update ─────────────────────────────────────────────────────────────────

  async update(id: string, data: Prisma.RecallUpdateInput) {
    return db.recall.update({ where: { id }, data, select: recallSelect });
  },

  // ─── Delete ─────────────────────────────────────────────────────────────────

  async delete(id: string) {
    return db.recall.delete({ where: { id } });
  },

  // ─── Bulk mark as sent ──────────────────────────────────────────────────────

  async markAsSent(ids: string[]) {
    return db.recall.updateMany({
      where: { id: { in: ids }, status: RecallStatus.PENDING },
      data: { status: RecallStatus.SENT, sentAt: new Date() },
    });
  },

  // ─── Count by status ────────────────────────────────────────────────────────

  async countByStatus(practiceId: string) {
    const statuses = Object.values(RecallStatus);
    const counts = await Promise.all(
      statuses.map((status) =>
        db.recall
          .count({ where: { practiceId, status } })
          .then((count) => ({ status, count }))
      )
    );
    return Object.fromEntries(counts.map((c) => [c.status, c.count]));
  },

  // ─── Find overdue ───────────────────────────────────────────────────────────

  async findOverdue(practiceId: string) {
    return db.recall.findMany({
      where: {
        practiceId,
        status: RecallStatus.PENDING,
        dueDate: { lt: new Date() },
      },
      select: recallSelect,
      orderBy: { dueDate: "asc" },
    });
  },

  // ─── Bulk create ────────────────────────────────────────────────────────────

  async bulkCreate(data: Prisma.RecallCreateManyInput[]) {
    return db.recall.createMany({ data, skipDuplicates: true });
  },

  // ─── Find patients due for recall ───────────────────────────────────────────

  async findPatientsDueForRecall(practiceId: string, intervalMonths: number) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - intervalMonths);

    return db.patient.findMany({
      where: {
        practiceId,
        isActive: true,
        isDeceased: false,
        OR: [
          { previousEyeTest: { lte: cutoff } },
          { previousEyeTest: null },
        ],
        // Exclude patients who already have a pending recall
        recalls: {
          none: {
            status: { in: [RecallStatus.PENDING, RecallStatus.SENT] },
          },
        },
      },
      select: {
        id: true,
        refNo: true,
        forename: true,
        surname: true,
        mobile: true,
        email: true,
        previousEyeTest: true,
        contactPref: true,
      },
    });
  },

  // ─── Recall configs ─────────────────────────────────────────────────────────

  async findConfigs(practiceId?: string) {
    return db.recallConfig.findMany({
      where: {
        isActive: true,
        OR: [{ practiceId }, { practiceId: null }],
      },
      orderBy: { type: "asc" },
    });
  },

  async upsertConfig(data: Prisma.RecallConfigCreateInput) {
    return db.recallConfig.create({ data });
  },
};