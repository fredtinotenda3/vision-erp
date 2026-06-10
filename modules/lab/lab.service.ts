// ============================================================
// VISION ERP - Lab Service
// modules/lab/lab.service.ts
// ============================================================

import { labRepository } from "./lab.repository";
import {
  CreateLabOrderInput,
  UpdateLabOrderInput,
  LabOrderQueryInput,
  LabTrackingInput,
  SupplierInput,
} from "./lab.types";
import { buildPaginationMeta, generateLabOrderNo } from "@/lib/utils";

export const labService = {
  async list(params: LabOrderQueryInput, practiceId: string) {
    const { labOrders, total } = await labRepository.findMany(params, practiceId);
    return { labOrders, meta: buildPaginationMeta(params.page, params.pageSize, total) };
  },

  async getById(id: string, practiceId: string) {
    const order = await labRepository.findById(id, practiceId);
    if (!order) throw new Error("LAB_ORDER_NOT_FOUND");
    return order;
  },

  async create(input: CreateLabOrderInput, createdById: string) {
    const labOrderNo = generateLabOrderNo();

    return labRepository.create({
      labOrderNo,
      urgency: input.urgency,
      lensType: input.lensType,
      lensMaterial: input.lensMaterial,
      lensCoating: input.lensCoating,
      lensTint: input.lensTint,
      frameRef: input.frameRef,
      frameSize: input.frameSize,
      specialInstructions: input.specialInstructions,
      estimatedReturn: input.estimatedReturn ? new Date(input.estimatedReturn) : null,
      cost: input.cost,
      notes: input.notes,
      rxRight: input.rxRight as any,
      rxLeft: input.rxLeft as any,
      createdById,
      practice: { connect: { id: input.practiceId } },
      ...(input.supplierId && { supplier: { connect: { id: input.supplierId } } }),
    });
  },

  async update(id: string, input: UpdateLabOrderInput, practiceId: string) {
    const existing = await labRepository.findById(id, practiceId);
    if (!existing) throw new Error("LAB_ORDER_NOT_FOUND");

    const updated = await labRepository.update(id, {
      ...input,
      estimatedReturn: input.estimatedReturn ? new Date(input.estimatedReturn) : undefined,
      receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
      sentToLabAt:
        input.status === "IN_PROGRESS" && !existing.sentToLabAt ? new Date() : undefined,
      ...(input.supplierId !== undefined && {
        supplier: input.supplierId
          ? { connect: { id: input.supplierId } }
          : { disconnect: true },
      }),
    });

    // Auto-add tracking entry on status change
    if (input.status && input.status !== existing.status) {
      await labRepository.addTracking({
        status: input.status,
        notes: input.notes ?? `Status changed to ${input.status}`,
        labOrder: { connect: { id } },
      });
    }

    return updated;
  },

  async addTracking(input: LabTrackingInput, updatedById: string, practiceId: string) {
    const order = await labRepository.findById(input.labOrderId, practiceId);
    if (!order) throw new Error("LAB_ORDER_NOT_FOUND");

    // Update main status
    await labRepository.update(input.labOrderId, { status: input.status });

    return labRepository.addTracking({
      status: input.status,
      notes: input.notes,
      updatedById,
      labOrder: { connect: { id: input.labOrderId } },
    });
  },

  async getStatusCounts(practiceId: string) {
    return labRepository.countByStatus(practiceId);
  },

  async getOverdue(practiceId: string) {
    return labRepository.findOverdue(practiceId);
  },

  // Suppliers
  async listSuppliers() {
    return labRepository.findAllSuppliers();
  },

  async createSupplier(input: SupplierInput) {
    return labRepository.createSupplier(input);
  },

  async updateSupplier(id: string, input: Partial<SupplierInput>) {
    return labRepository.updateSupplier(id, input);
  },
};