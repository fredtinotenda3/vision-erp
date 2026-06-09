// ============================================================
// VISION ERP - Orders Service
// modules/orders/order.service.ts
// ============================================================

import db from "@/lib/db";
import { generateOrderNo, buildPaginationMeta } from "@/lib/utils";
import { CreateOrderInput, UpdateOrderInput, OrderQueryInput } from "./order.types";
import { Prisma } from "@prisma/client";

const orderSelect = {
  id: true, orderNo: true, patientId: true, practiceId: true, prescriptionId: true,
  type: true, status: true, frameBrand: true, frameModel: true, frameColor: true,
  frameSize: true, frameCost: true, frameRetail: true, lensType: true, lensMaterial: true,
  lensCoating: true, lensTint: true, lensCost: true, lensRetail: true,
  subtotal: true, discount: true, vatAmount: true, totalAmount: true,
  depositPaid: true, balanceDue: true, paymentMethod: true, paymentStatus: true,
  orderDate: true, promisedDate: true, completedDate: true, dispensedDate: true,
  notes: true, internalNotes: true, createdAt: true, updatedAt: true,
  patient: { select: { id: true, refNo: true, forename: true, surname: true } },
} satisfies Prisma.OrderSelect;

export const orderService = {
  async list(params: OrderQueryInput, practiceId: string) {
    const { page, pageSize, patientId, status, type, from, to, search } = params;

    const where: Prisma.OrderWhereInput = {
      practiceId,
      ...(patientId && { patientId }),
      ...(status && { status }),
      ...(type && { type }),
      ...(from && to && { orderDate: { gte: new Date(from), lte: new Date(to) } }),
      ...(search && {
        OR: [
          { orderNo: { contains: search, mode: "insensitive" } },
          { patient: { surname: { contains: search, mode: "insensitive" } } },
          { patient: { forename: { contains: search, mode: "insensitive" } } },
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

    return { orders, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async getById(id: string, practiceId: string) {
    const order = await db.order.findFirst({
      where: { id, practiceId },
      select: { ...orderSelect, payments: true },
    });
    if (!order) throw new Error("ORDER_NOT_FOUND");
    return order;
  },

  async create(input: CreateOrderInput, createdById: string) {
    const orderNo = generateOrderNo("ORD");
    const subtotal = (input.frameRetail ?? 0) + (input.lensRetail ?? 0);
    const totalAmount = subtotal - (input.discount ?? 0) + (input.vatAmount ?? 0);
    const balanceDue = totalAmount - (input.depositPaid ?? 0);

    return db.order.create({
      data: {
        orderNo,
        subtotal,
        totalAmount,
        balanceDue,
        type: input.type,
        frameBrand: input.frameBrand,
        frameModel: input.frameModel,
        frameColor: input.frameColor,
        frameSize: input.frameSize,
        frameCost: input.frameCost,
        frameRetail: input.frameRetail,
        lensType: input.lensType,
        lensMaterial: input.lensMaterial,
        lensCoating: input.lensCoating,
        lensTint: input.lensTint,
        lensCost: input.lensCost,
        lensRetail: input.lensRetail,
        discount: input.discount,
        vatAmount: input.vatAmount,
        depositPaid: input.depositPaid,
        paymentMethod: input.paymentMethod,
        promisedDate: input.promisedDate ? new Date(input.promisedDate) : null,
        notes: input.notes,
        internalNotes: input.internalNotes,
        createdById,
        patient: { connect: { id: input.patientId } },
        practice: { connect: { id: input.practiceId } },
        ...(input.prescriptionId && { prescription: { connect: { id: input.prescriptionId } } }),
      },
      select: orderSelect,
    });
  },

  async update(id: string, input: UpdateOrderInput, practiceId: string) {
    const existing = await db.order.findFirst({ where: { id, practiceId } });
    if (!existing) throw new Error("ORDER_NOT_FOUND");
    if (existing.status === "DISPENSED") throw new Error("ORDER_ALREADY_DISPENSED");

    const frameRetail = input.frameRetail ?? existing.frameRetail ?? 0;
    const lensRetail = input.lensRetail ?? existing.lensRetail ?? 0;
    const discount = input.discount ?? existing.discount ?? 0;
    const vatAmount = input.vatAmount ?? existing.vatAmount ?? 0;
    const depositPaid = input.depositPaid ?? existing.depositPaid ?? 0;
    const subtotal = frameRetail + lensRetail;
    const totalAmount = subtotal - discount + vatAmount;
    const balanceDue = totalAmount - depositPaid;

    return db.order.update({
      where: { id },
      data: {
        ...input,
        subtotal,
        totalAmount,
        balanceDue,
        promisedDate: input.promisedDate ? new Date(input.promisedDate) : undefined,
        dispensedDate: input.dispensedDate ? new Date(input.dispensedDate) : undefined,
        ...(input.status === "DISPENSED" && { dispensedDate: new Date() }),
      },
      select: orderSelect,
    });
  },

  async cancel(id: string, practiceId: string) {
    const existing = await db.order.findFirst({ where: { id, practiceId } });
    if (!existing) throw new Error("ORDER_NOT_FOUND");
    if (existing.status === "DISPENSED") throw new Error("ORDER_ALREADY_DISPENSED");

    return db.order.update({ where: { id }, data: { status: "CANCELLED" }, select: orderSelect });
  },
};