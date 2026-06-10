// ============================================================
// VISION ERP - Lab Repository
// modules/lab/lab.repository.ts
// ============================================================

import db from "@/lib/db";
import { Prisma, LabOrderStatus } from "@prisma/client";
import { LabOrderQueryInput } from "./lab.types";

const labOrderSelect = {
  id: true,
  labOrderNo: true,
  practiceId: true,
  supplierId: true,
  status: true,
  rxRight: true,
  rxLeft: true,
  lensType: true,
  lensMaterial: true,
  lensCoating: true,
  lensTint: true,
  frameRef: true,
  frameSize: true,
  urgency: true,
  specialInstructions: true,
  sentToLabAt: true,
  estimatedReturn: true,
  receivedAt: true,
  cost: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  supplier: {
    select: { id: true, name: true, code: true, email: true, phone: true },
  },
  tracking: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    select: { id: true, status: true, notes: true, updatedById: true, createdAt: true },
  },
} satisfies Prisma.LabOrderSelect;

export const labRepository = {
  async findMany(params: LabOrderQueryInput, practiceId: string) {
    const { page, pageSize, status, supplierId, urgency, from, to, search } = params;

    const where: Prisma.LabOrderWhereInput = {
      practiceId,
      ...(status && { status }),
      ...(supplierId && { supplierId }),
      ...(urgency && { urgency }),
      ...(from && to && {
        createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      }),
      ...(search && {
        OR: [
          { labOrderNo: { contains: search, mode: "insensitive" } },
          { supplier: { name: { contains: search, mode: "insensitive" } } },
          { lensType: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, labOrders] = await db.$transaction([
      db.labOrder.count({ where }),
      db.labOrder.findMany({
        where,
        select: labOrderSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { labOrders, total };
  },

  async findById(id: string, practiceId: string) {
    return db.labOrder.findFirst({
      where: { id, practiceId },
      select: labOrderSelect,
    });
  },

  async create(data: Prisma.LabOrderCreateInput) {
    return db.labOrder.create({ data, select: labOrderSelect });
  },

  async update(id: string, data: Prisma.LabOrderUpdateInput) {
    return db.labOrder.update({ where: { id }, data, select: labOrderSelect });
  },

  async addTracking(data: Prisma.LabTrackingCreateInput) {
    return db.labTracking.create({ data });
  },

  async countByStatus(practiceId: string) {
    const statuses: LabOrderStatus[] = [
      "RECEIVED", "IN_PROGRESS", "QUALITY_CHECK", "DISPATCHED", "DELIVERED", "REJECTED", "ON_HOLD",
    ];
    const counts = await Promise.all(
      statuses.map((status) =>
        db.labOrder.count({ where: { practiceId, status } }).then((count) => ({ status, count }))
      )
    );
    return Object.fromEntries(counts.map((c) => [c.status, c.count]));
  },

  async findOverdue(practiceId: string) {
    return db.labOrder.findMany({
      where: {
        practiceId,
        status: { in: ["RECEIVED", "IN_PROGRESS", "QUALITY_CHECK"] },
        estimatedReturn: { lt: new Date() },
      },
      select: labOrderSelect,
      orderBy: { estimatedReturn: "asc" },
    });
  },

  // Suppliers
  async findAllSuppliers() {
    return db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async createSupplier(data: Prisma.SupplierCreateInput) {
    return db.supplier.create({ data });
  },

  async updateSupplier(id: string, data: Prisma.SupplierUpdateInput) {
    return db.supplier.update({ where: { id }, data });
  },
};
