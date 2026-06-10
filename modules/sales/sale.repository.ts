// ============================================================
// FILE: modules/sales/sale.repository.ts
// VISION ERP - Sales Repository (DB Access Only)
// ============================================================

import db from "@/lib/db";
import { Prisma } from "@prisma/client";
import { SaleQueryInput } from "./sale.types";

// ─── Select shapes ───────────────────────────────────────────

const saleBaseSelect = {
  id: true,
  saleNo: true,
  patientId: true,
  practiceId: true,
  type: true,
  subtotal: true,
  discount: true,
  vatAmount: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  notes: true,
  createdById: true,
  voidedAt: true,
  voidReason: true,
  createdAt: true,
  updatedAt: true,
  patient: {
    select: { id: true, refNo: true, forename: true, surname: true, mobile: true },
  },
} satisfies Prisma.SaleSelect;

const saleWithItemsSelect = {
  ...saleBaseSelect,
  items: {
    select: {
      id: true,
      stockItemId: true,
      description: true,
      quantity: true,
      unitCost: true,
      unitPrice: true,
      discount: true,
      vatRate: true,
      total: true,
    },
  },
  payments: {
    select: {
      id: true, amount: true, method: true,
      reference: true, receivedAt: true,
    },
  },
} satisfies Prisma.SaleSelect;

// ============================================================
// SALE REPOSITORY
// ============================================================

export const saleRepository = {

  // ─── Find many ───────────────────────────────────────────

  async findMany(params: SaleQueryInput, practiceId: string) {
    const { page, pageSize, patientId, from, to, search } = params;

    const where: Prisma.SaleWhereInput = {
      practiceId,
      voidedAt: null,
      ...(patientId && { patientId }),
      ...(from && to && {
        createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      }),
      ...(search && {
        OR: [
          { saleNo: { contains: search, mode: "insensitive" } },
          { patient: { surname: { contains: search, mode: "insensitive" } } },
          { patient: { forename: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [total, sales] = await db.$transaction([
      db.sale.count({ where }),
      db.sale.findMany({
        where,
        select: saleBaseSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { sales, total };
  },

  // ─── Find by ID ──────────────────────────────────────────

  async findById(id: string, practiceId: string) {
    return db.sale.findFirst({
      where: { id, practiceId },
      select: saleWithItemsSelect,
    });
  },

  async findBySaleNo(saleNo: string, practiceId: string) {
    return db.sale.findFirst({
      where: { saleNo, practiceId },
      select: saleWithItemsSelect,
    });
  },

  // ─── Find by patient ─────────────────────────────────────

  async findByPatient(patientId: string) {
    return db.sale.findMany({
      where: { patientId, voidedAt: null },
      select: saleBaseSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  // ─── Create (sale + items in one transaction) ────────────

  async create(
    saleData: Omit<Prisma.SaleCreateInput, "items">,
    items: Prisma.SaleItemCreateManyInput[]
  ) {
    return db.sale.create({
      data: {
        ...saleData,
        items: { create: items },
      },
      select: saleWithItemsSelect,
    });
  },

  // ─── Void ────────────────────────────────────────────────

  async void(id: string, reason: string) {
    return db.sale.update({
      where: { id },
      data: { voidedAt: new Date(), voidReason: reason },
      select: saleBaseSelect,
    });
  },

  // ─── Add payment ─────────────────────────────────────────

  async addPayment(data: Prisma.PaymentCreateInput) {
    return db.payment.create({ data });
  },

  async getTotalPaid(saleId: string) {
    const result = await db.payment.aggregate({
      where: { saleId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },

  // ─── Daily/period revenue summary ────────────────────────

  async getRevenueSummary(practiceId: string, from: Date, to: Date) {
    return db.sale.aggregate({
      where: {
        practiceId,
        voidedAt: null,
        createdAt: { gte: from, lte: to },
      },
      _sum: { totalAmount: true, vatAmount: true, discount: true },
      _count: { id: true },
    });
  },

  // ─── Revenue by payment method (for cash report) ─────────

  async getRevenueByMethod(practiceId: string, from: Date, to: Date) {
    return db.sale.groupBy({
      by: ["paymentMethod"],
      where: {
        practiceId,
        voidedAt: null,
        createdAt: { gte: from, lte: to },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    });
  },

  // ─── VAT data for report ─────────────────────────────────

  async getVatData(practiceId: string, from: Date, to: Date) {
    return db.saleItem.findMany({
      where: {
        sale: {
          practiceId,
          voidedAt: null,
          createdAt: { gte: from, lte: to },
        },
      },
      select: { vatRate: true, total: true, quantity: true, unitPrice: true, discount: true },
    });
  },

  // ─── Stock decrement on sale ──────────────────────────────

  async decrementStock(stockItemId: string, quantity: number) {
    return db.stockItem.update({
      where: { id: stockItemId },
      data: { currentStock: { decrement: quantity } },
    });
  },

  async recordStockMovement(data: Prisma.StockMovementCreateInput) {
    return db.stockMovement.create({ data });
  },
};