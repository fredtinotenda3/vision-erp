// ============================================================
// VISION ERP - Staff Service
// modules/staff/staff.service.ts
// ============================================================

import { staffRepository } from "./staff.repository";
import {
  CreateStaffInput,
  UpdateStaffInput,
  ChangePasswordInput,
  ResetPasswordInput,
  StaffRotaInput,
  StaffRotaQueryInput,
  StaffQueryInput,
  StaffPerformanceEntryInput,
} from "./staff.types";
import { buildPaginationMeta, hashPassword, verifyPassword } from "@/lib/utils";

export const staffService = {
  // ─── List staff ──────────────────────────────────────────────────────────────

  async list(params: StaffQueryInput, practiceId: string) {
    const { staff, total } = await staffRepository.findMany(params, practiceId);
    return {
      staff,
      meta: buildPaginationMeta(params.page, params.pageSize, total),
      roleCounts: await staffRepository.countByRole(practiceId),
    };
  },

  // ─── Get by ID ───────────────────────────────────────────────────────────────

  async getById(id: string, practiceId: string) {
    const user = await staffRepository.findById(id, practiceId);
    if (!user) throw new Error("STAFF_NOT_FOUND");
    return user;
  },

  // ─── Create staff member ─────────────────────────────────────────────────────

  async create(input: CreateStaffInput) {
    // Check for duplicate email
    const existing = await staffRepository.findByEmail(input.email);
    if (existing) throw new Error("EMAIL_IN_USE");

    const hashedPassword = await hashPassword(input.password);

    return staffRepository.create({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      password: hashedPassword,
      role: input.role,
      mustChangePassword: input.mustChangePassword,
      practice: { connect: { id: input.practiceId } },
    });
  },

  // ─── Update staff member ─────────────────────────────────────────────────────

  async update(id: string, input: UpdateStaffInput, practiceId: string) {
    const existing = await staffRepository.findById(id, practiceId);
    if (!existing) throw new Error("STAFF_NOT_FOUND");

    // Email uniqueness check on change
    if (input.email && input.email !== existing.email) {
      const emailTaken = await staffRepository.findByEmail(input.email);
      if (emailTaken) throw new Error("EMAIL_IN_USE");
    }

    return staffRepository.update(id, {
      ...input,
      email: input.email?.toLowerCase().trim(),
    });
  },

  // ─── Deactivate (soft delete) ────────────────────────────────────────────────

  async deactivate(id: string, practiceId: string) {
    const existing = await staffRepository.findById(id, practiceId);
    if (!existing) throw new Error("STAFF_NOT_FOUND");
    return staffRepository.deactivate(id);
  },

  // ─── Change own password ─────────────────────────────────────────────────────

  async changePassword(id: string, input: ChangePasswordInput, practiceId: string) {
    const user = await staffRepository.findByEmailWithPassword(
      (await staffRepository.findById(id, practiceId))?.email ?? ""
    );
    if (!user) throw new Error("STAFF_NOT_FOUND");

    const valid = await verifyPassword(input.currentPassword, user.password);
    if (!valid) throw new Error("INVALID_CURRENT_PASSWORD");

    const hashed = await hashPassword(input.newPassword);
    return staffRepository.updatePassword(id, hashed, false);
  },

  // ─── Admin password reset ────────────────────────────────────────────────────

  async resetPassword(id: string, input: ResetPasswordInput, practiceId: string) {
    const existing = await staffRepository.findById(id, practiceId);
    if (!existing) throw new Error("STAFF_NOT_FOUND");

    const hashed = await hashPassword(input.newPassword);
    return staffRepository.updatePassword(id, hashed, input.mustChangePassword);
  },

  // ─── Staff Rota ──────────────────────────────────────────────────────────────

  async listRota(params: StaffRotaQueryInput, practiceId: string) {
    return staffRepository.findRota(practiceId, params.from, params.to, params.userId);
  },

  async createRotaEntry(input: StaffRotaInput) {
    return staffRepository.createRotaEntry({
      date: new Date(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      isAvailable: input.isAvailable,
      notes: input.notes,
      user: { connect: { id: input.userId } },
    });
  },

  async updateRotaEntry(id: string, input: Partial<StaffRotaInput>, practiceId: string) {
    const existing = await staffRepository.findRotaEntry(id);
    if (!existing) throw new Error("ROTA_ENTRY_NOT_FOUND");
    if (existing.user.practiceId !== practiceId) throw new Error("ROTA_ENTRY_NOT_FOUND");

    return staffRepository.updateRotaEntry(id, {
      ...(input.date && { date: new Date(input.date) }),
      ...(input.startTime && { startTime: input.startTime }),
      ...(input.endTime && { endTime: input.endTime }),
      ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
      ...(input.notes !== undefined && { notes: input.notes }),
    });
  },

  async deleteRotaEntry(id: string, practiceId: string) {
    const existing = await staffRepository.findRotaEntry(id);
    if (!existing) throw new Error("ROTA_ENTRY_NOT_FOUND");
    if (existing.user.practiceId !== practiceId) throw new Error("ROTA_ENTRY_NOT_FOUND");
    return staffRepository.deleteRotaEntry(id);
  },

  // ─── Staff Performance ───────────────────────────────────────────────────────

  async listPerformance(practiceId: string, from: string, to: string, userId?: string) {
    return staffRepository.findPerformance(practiceId, from, to, userId);
  },

  async recordPerformance(input: StaffPerformanceEntryInput, practiceId: string) {
    // Verify user belongs to practice
    const user = await staffRepository.findById(input.userId, practiceId);
    if (!user) throw new Error("STAFF_NOT_FOUND");

    return staffRepository.upsertPerformance({
      date: new Date(input.date),
      examsCount: input.examsCount,
      salesAmount: input.salesAmount,
      ordersCount: input.ordersCount,
      missedAppts: input.missedAppts,
      notes: input.notes,
      user: { connect: { id: input.userId } },
    });
  },

  // ─── Role counts ─────────────────────────────────────────────────────────────

  async getRoleCounts(practiceId: string) {
    return staffRepository.countByRole(practiceId);
  },
};