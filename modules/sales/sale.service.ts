// ============================================================
// VISION ERP - Sales Service
// modules/sales/sale.service.ts
// ============================================================

import db from "@/lib/db";
import { generateSaleNo, buildPaginationMeta } from "@/lib/utils";
import { CreateSaleInput, SaleQueryInput } from "./sale.types";
import { Prisma } from "@prisma/client";

const saleSelect = {
  id: true, saleNo: true, patientId: true, practiceId: true, type: true,
  subtotal: true, discount: true, vatAmount: true, totalAmount: true,
  paymentMethod: true, paymentStatus: true, notes: true, voidedAt: true,
  createdAt: true, updatedAt: true,
  patient: { select: { id: true, refNo: true, forename: true, surname: true } },
  items: true,
} satisfies Prisma.SaleSelect;

export const saleService = {
  async list(params: SaleQueryInput, practiceId: string) {
    const { page, pageSize, patientId, from, to, search } = params;
    const where: Prisma.SaleWhereInput = {
      practiceId,
      voidedAt: null,
      ...(patientId && { patientId }),
      ...(from && to && { createdAt: { gte: new Date(from), lte: new Date(to) } }),
      ...(search && {
        OR: [
          { saleNo: { contains: search, mode: "insensitive" } },
          { patient: { surname: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [total, sales] = await db.$transaction([
      db.sale.count({ where }),
      db.sale.findMany({
        where, select: saleSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize, take: pageSize,
      }),
    ]);

    return { sales, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async getById(id: string, practiceId: string) {
    const sale = await db.sale.findFirst({
      where: { id, practiceId },
      select: { ...saleSelect, payments: true },
    });
    if (!sale) throw new Error("SALE_NOT_FOUND");
    return sale;
  },

  async create(input: CreateSaleInput, createdById: string) {
    const saleNo = generateSaleNo();

    // Calculate totals from items
    let subtotal = 0;
    let vatAmount = 0;

    const itemsData = input.items.map((item) => {
      const lineTotal = item.unitPrice * item.quantity - item.discount;
      const lineVat = lineTotal * (item.vatRate / 100);
      subtotal += lineTotal;
      vatAmount += lineVat;
      return {
        stockItemId: item.stockItemId,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost,
        unitPrice: item.unitPrice,
        discount: item.discount,
        vatRate: item.vatRate,
        total: lineTotal + lineVat,
      };
    });

    const totalAmount = subtotal + vatAmount - (input.discount ?? 0);

    // Decrement stock for each item
    for (const item of input.items) {
      if (item.stockItemId) {
        await db.stockItem.update({
          where: { id: item.stockItemId },
          data: { currentStock: { decrement: item.quantity } },
        }).catch(() => null); // Non-blocking — stock may be untracked
      }
    }

    return db.sale.create({
      data: {
        saleNo,
        subtotal,
        discount: input.discount ?? 0,
        vatAmount,
        totalAmount,
        type: input.type,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod ? "PAID" : "PENDING",
        notes: input.notes,
        createdById,
        practice: { connect: { id: input.practiceId } },
        ...(input.patientId && { patient: { connect: { id: input.patientId } } }),
        items: { create: itemsData },
      },
      select: saleSelect,
    });
  },

  async void(id: string, reason: string, practiceId: string) {
    const sale = await db.sale.findFirst({ where: { id, practiceId } });
    if (!sale) throw new Error("SALE_NOT_FOUND");
    if (sale.voidedAt) throw new Error("ALREADY_VOIDED");

    return db.sale.update({
      where: { id },
      data: { voidedAt: new Date(), voidReason: reason },
      select: saleSelect,
    });
  },
};