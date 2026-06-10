// ============================================================
// VISION ERP - Recall Service
// modules/recall/recall.service.ts
// ============================================================

import { recallRepository } from "./recall.repository";
import {
  CreateRecallInput,
  UpdateRecallInput,
  RecallQueryInput,
  SendRecallInput,
  BulkCreateRecallInput,
  RecallConfigInput,
} from "./recall.types";
import { buildPaginationMeta, addMonths } from "@/lib/utils";
import { RecallStatus, RecallType } from "@prisma/client";

export const recallService = {
  // ─── List recalls ────────────────────────────────────────────────────────────

  async list(params: RecallQueryInput, practiceId: string) {
    const { recalls, total } = await recallRepository.findMany(params, practiceId);
    return {
      recalls,
      meta: buildPaginationMeta(params.page, params.pageSize, total),
      statusCounts: await recallRepository.countByStatus(practiceId),
    };
  },

  // ─── Get by ID ───────────────────────────────────────────────────────────────

  async getById(id: string, practiceId: string) {
    const recall = await recallRepository.findById(id, practiceId);
    if (!recall) throw new Error("RECALL_NOT_FOUND");
    return recall;
  },

  // ─── Get by patient ──────────────────────────────────────────────────────────

  async getByPatient(patientId: string) {
    return recallRepository.findByPatient(patientId);
  },

  // ─── Create single recall ────────────────────────────────────────────────────

  async create(input: CreateRecallInput) {
    return recallRepository.create({
      type: input.type,
      method: input.method,
      status: RecallStatus.PENDING,
      dueDate: new Date(input.dueDate),
      message: input.message,
      notes: input.notes,
      patient: { connect: { id: input.patientId } },
      practice: { connect: { id: input.practiceId } },
    });
  },

  // ─── Update recall ───────────────────────────────────────────────────────────

  async update(id: string, input: UpdateRecallInput, practiceId: string) {
    const existing = await recallRepository.findById(id, practiceId);
    if (!existing) throw new Error("RECALL_NOT_FOUND");

    const respondedAt =
      input.status === RecallStatus.RESPONDED && !existing.respondedAt
        ? new Date()
        : undefined;

    return recallRepository.update(id, {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      ...(respondedAt && { respondedAt }),
    });
  },

  // ─── Delete recall ───────────────────────────────────────────────────────────

  async delete(id: string, practiceId: string) {
    const existing = await recallRepository.findById(id, practiceId);
    if (!existing) throw new Error("RECALL_NOT_FOUND");
    if (existing.status === RecallStatus.SENT)
      throw new Error("CANNOT_DELETE_SENT_RECALL");
    return recallRepository.delete(id);
  },

  // ─── Send recalls (mark as sent) ─────────────────────────────────────────────
  // In a real deployment this would integrate with SMS/email provider.
  // For now it marks records as SENT and records the timestamp.

  async sendRecalls(input: SendRecallInput, practiceId: string) {
    // Verify all recall IDs belong to this practice
    const verified = await Promise.all(
      input.recallIds.map((id) => recallRepository.findById(id, practiceId))
    );
    const valid = verified.filter(Boolean);
    if (valid.length === 0) throw new Error("NO_VALID_RECALLS");

    const validIds = valid.map((r) => r!.id);
    const result = await recallRepository.markAsSent(validIds);
    return { sent: result.count, ids: validIds };
  },

  // ─── Bulk create recalls for overdue patients ─────────────────────────────────

  async bulkGenerate(input: BulkCreateRecallInput) {
    const patients = await recallRepository.findPatientsDueForRecall(
      input.practiceId,
      input.intervalMonths
    );

    if (patients.length === 0) return { created: 0, patients: [] };

    const dueDate = new Date();
    const recallsData = patients.map((patient) => ({
      patientId: patient.id,
      practiceId: input.practiceId,
      type: input.type,
      method: input.method,
      status: RecallStatus.PENDING,
      dueDate,
      message: input.message ?? null,
    }));

    const result = await recallRepository.bulkCreate(recallsData);
    return { created: result.count, patients };
  },

  // ─── Get overdue recalls ─────────────────────────────────────────────────────

  async getOverdue(practiceId: string) {
    return recallRepository.findOverdue(practiceId);
  },

  // ─── Recall config CRUD ──────────────────────────────────────────────────────

  async listConfigs(practiceId: string) {
    return recallRepository.findConfigs(practiceId);
  },

  async createConfig(input: RecallConfigInput) {
    return recallRepository.upsertConfig({
      type: input.type,
      intervalMonths: input.intervalMonths,
      methods: input.methods,
      template: input.template,
      isActive: input.isActive,
      ...(input.practiceId && { practiceId: input.practiceId }),
    });
  },

  // ─── Status counts ───────────────────────────────────────────────────────────

  async getStatusCounts(practiceId: string) {
    return recallRepository.countByStatus(practiceId);
  },
};