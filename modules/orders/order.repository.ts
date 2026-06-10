// ============================================================
// FILE: modules/orders/order.repository.ts
// VISION ERP - Orders Repository (DB Access Only)
// ============================================================

import db from "@/lib/db";
import { Prisma, OrderStatus } from "@prisma/client";
import { OrderQueryInput } from "./order.types";

// ─── Select shapes ───────────────────────────────────────────

const orderSelect = {
  id: true,
  orderNo: true,
  patientId: true,
  practiceId: true,
  prescriptionId: true,
  type: true,
  status: true,
  frameBrand: true,
  frameModel: true,
  frameColor: true,
  frameSize: true,
  frameCost: true,
  frameRetail: true,
  lensType: true,
  lensMaterial: true,
  lensCoating: true,
  lensTint: true,
  lensCost: true,
  lensRetail: true,
  subtotal: true,
  discount: true,
  vatAmount: true,
  totalAmount: true,
  depositPaid: true,
  balanceDue: true,
  paymentMethod: true,
  paymentStatus: true,
  labOrderId: true,
  orderDate: true,
  promisedDate: true,
  completedDate: true,
  dispensedDate: true,
  notes: true,
  internalNotes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: { id: true, refNo: true, forename: true, surname: true, mobile: true },
  },
} satisfies Prisma.OrderSelect;

const orderWithPaymentsSelect = {
  ...orderSelect,
  payments: {
    select: {
      id: true, amount: true, method: true, reference: true,
      notes: true, receivedAt: true, createdAt: true,
    },
  },
  prescription: {
    select: {
      id: true, rSphere: true, rCylinder: true, rAxis: true, rAdd: true,
      lSphere: true, lCylinder: true, lAxis: true, lAdd: true,
      ipd: true, ipdNear: true, examinedAt: true,
    },
  },
} satisfies Prisma.OrderSelect;

// ============================================================
// ORDER REPOSITORY
// ============================================================

export const orderRepository = {

  // ─── Find many ───────────────────────────────────────────

  async findMany(params: OrderQueryInput, practiceId: string) {
    const { page, pageSize, patientId, status, type, from, to, search } = params;

    const where: Prisma.OrderWhereInput = {
      practiceId,
      ...(patientId && { patientId }),
      ...(status && { status }),
      ...(type && { type }),
      ...(from && to && {
        orderDate: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      }),
      ...(search && {
        OR: [
          { orderNo: { contains: search, mode: "insensitive" } },
          { patient: { surname: { contains: search, mode: "insensitive" } } },
          { patient: { forename: { contains: search, mode: "insensitive" } } },
          { patient: { refNo: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [total, orders] = await db.$transaction([
      db.order.count({ where }),
      db.order.findMany({
        where,
        select: orderSelect,
        orderBy: { orderDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { orders, total };
  },

  // ─── Find by ID ──────────────────────────────────────────

  async findById(id: string, practiceId: string) {
    return db.order.findFirst({
      where: { id, practiceId },
      select: orderWithPaymentsSelect,
    });
  },

  async findByOrderNo(orderNo: string, practiceId: string) {
    return db.order.findFirst({
      where: { orderNo, practiceId },
      select: orderSelect,
    });
  },

  // ─── Find by patient ─────────────────────────────────────

  async findByPatient(patientId: string) {
    return db.order.findMany({
      where: { patientId },
      select: orderSelect,
      orderBy: { orderDate: "desc" },
    });
  },

  // ─── Create ──────────────────────────────────────────────

  async create(data: Prisma.OrderCreateInput) {
    return db.order.create({
      data,
      select: orderSelect,
    });
  },

  // ─── Update ──────────────────────────────────────────────

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return db.order.update({
      where: { id },
      data,
      select: orderSelect,
    });
  },

  // ─── Status transitions ──────────────────────────────────

  async updateStatus(id: string, status: OrderStatus, extra?: Prisma.OrderUpdateInput) {
    return db.order.update({
      where: { id },
      data: { status, ...extra },
      select: orderSelect,
    });
  },

  // ─── Pending / overdue orders ────────────────────────────

  async findPendingByPractice(practiceId: string) {
    return db.order.findMany({
      where: {
        practiceId,
        status: { in: ["PENDING", "IN_LAB"] },
      },
      select: orderSelect,
      orderBy: { promisedDate: "asc" },
    });
  },

  async findOverdue(practiceId: string) {
    return db.order.findMany({
      where: {
        practiceId,
        status: { in: ["PENDING", "IN_LAB"] },
        promisedDate: { lt: new Date() },
      },
      select: orderSelect,
      orderBy: { promisedDate: "asc" },
    });
  },

  async findReadyForCollection(practiceId: string) {
    return db.order.findMany({
      where: { practiceId, status: "READY" },
      select: orderSelect,
      orderBy: { completedDate: "asc" },
    });
  },

  // ─── Payments ────────────────────────────────────────────

  async addPayment(data: Prisma.PaymentCreateInput) {
    return db.payment.create({ data });
  },

  async getPayments(orderId: string) {
    return db.payment.findMany({
      where: { orderId },
      orderBy: { receivedAt: "desc" },
    });
  },

  // ─── Counts ──────────────────────────────────────────────

  async countByStatus(practiceId: string) {
    const statuses: OrderStatus[] = [
      "PENDING", "IN_LAB", "READY", "DISPENSED", "CANCELLED", "ON_HOLD",
    ];
    const counts = await Promise.all(
      statuses.map((status) =>
        db.order.count({ where: { practiceId, status } }).then((count) => ({ status, count }))
      )
    );
    return Object.fromEntries(counts.map((c) => [c.status, c.count]));
  },
};