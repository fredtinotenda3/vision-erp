// ============================================================
// VISION ERP - Finance Service
// modules/finance/finance.service.ts
// ============================================================

import db from "@/lib/db";
import { z } from "zod";
import { buildPaginationMeta } from "@/lib/utils";

// ─── Schemas ─────────────────────────────────────────────────
export const PettyCashSchema = z.object({
  practiceId: z.string().min(1),
  description: z.string().min(1).max(300),
  amount: z.number().min(0.01),
  isExpense: z.boolean().default(true),
  category: z.string().max(100).optional().nullable(),
  reference: z.string().max(100).optional().nullable(),
  date: z.string().optional(),
});

export const ReconciliationSchema = z.object({
  practiceId: z.string().min(1),
  date: z.string(),
  openingBalance: z.number().default(0),
  cashSales: z.number().default(0),
  cardSales: z.number().default(0),
  otherSales: z.number().default(0),
  cashIn: z.number().default(0),
  cashOut: z.number().default(0),
  notes: z.string().max(500).optional().nullable(),
});

export const DateRangeSchema = z.object({
  practiceId: z.string().optional(),
  from: z.string(),
  to: z.string(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export type PettyCashInput = z.infer<typeof PettyCashSchema>;
export type ReconciliationInput = z.infer<typeof ReconciliationSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;

// ─── Service ─────────────────────────────────────────────────
export const financeService = {
  // ─── Cash Report (sales summary by date range) ───────────
  async getCashReport(practiceId: string, from: string, to: string) {
    const sales = await db.sale.findMany({
      where: {
        practiceId,
        voidedAt: null,
        createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      },
      select: {
        id: true, saleNo: true, totalAmount: true, paymentMethod: true,
        paymentStatus: true, createdAt: true,
        patient: { select: { forename: true, surname: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totals = sales.reduce(
      (acc, s) => {
        acc.total += s.totalAmount;
        if (s.paymentMethod === "CASH") acc.cash += s.totalAmount;
        else if (s.paymentMethod === "CARD") acc.card += s.totalAmount;
        else acc.other += s.totalAmount;
        return acc;
      },
      { total: 0, cash: 0, card: 0, other: 0 }
    );

    return { sales, totals };
  },

  // ─── Debtors ─────────────────────────────────────────────
  async getDebtors(practiceId: string, params: DateRangeInput) {
    const { page, pageSize } = params;
    const [total, debtors] = await db.$transaction([
      db.debtor.count({ where: { patient: { practiceId }, status: { not: "PAID" } } }),
      db.debtor.findMany({
        where: { patient: { practiceId }, status: { not: "PAID" } },
        include: { patient: { select: { id: true, refNo: true, forename: true, surname: true, mobile: true } } },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return { debtors, meta: buildPaginationMeta(page, pageSize, total) };
  },

  // ─── VAT Report ──────────────────────────────────────────
  async getVatReport(practiceId: string, from: string, to: string) {
    const sales = await db.sale.findMany({
      where: {
        practiceId, voidedAt: null,
        createdAt: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
      },
      include: { items: { select: { vatRate: true, total: true, quantity: true, unitPrice: true, discount: true } } },
    });

    const vatBreakdown: Record<string, { net: number; vat: number; gross: number }> = {};

    for (const sale of sales) {
      for (const item of sale.items) {
        const key = `${item.vatRate}%`;
        const net = item.total / (1 + item.vatRate / 100);
        const vat = item.total - net;
        if (!vatBreakdown[key]) vatBreakdown[key] = { net: 0, vat: 0, gross: 0 };
        vatBreakdown[key].net += net;
        vatBreakdown[key].vat += vat;
        vatBreakdown[key].gross += item.total;
      }
    }

    return { vatBreakdown, salesCount: sales.length };
  },

  // ─── Petty Cash ──────────────────────────────────────────
  async listPettyCash(practiceId: string, from: string, to: string) {
    return db.pettyCash.findMany({
      where: { practiceId, date: { gte: new Date(from), lte: new Date(to + "T23:59:59") } },
      orderBy: { date: "desc" },
    });
  },

  async createPettyCash(input: PettyCashInput, userId: string) {
    return db.pettyCash.create({
      data: {
        description: input.description,
        amount: input.amount,
        isExpense: input.isExpense,
        category: input.category,
        reference: input.reference,
        date: input.date ? new Date(input.date) : new Date(),
        createdById: userId,
        practice: { connect: { id: input.practiceId } },
      },
    });
  },

  // ─── Cash Reconciliation ─────────────────────────────────
  async createReconciliation(input: ReconciliationInput, userId: string) {
    const totalSales = input.cashSales + input.cardSales + input.otherSales;
    const closingBalance = input.openingBalance + input.cashIn - input.cashOut + input.cashSales;
    const variance = closingBalance - (input.openingBalance + input.cashSales);

    return db.cashReconciliation.create({
      data: {
        date: new Date(input.date),
        openingBalance: input.openingBalance,
        cashSales: input.cashSales,
        cardSales: input.cardSales,
        otherSales: input.otherSales,
        totalSales,
        cashIn: input.cashIn,
        cashOut: input.cashOut,
        closingBalance,
        variance,
        notes: input.notes,
        reconciledById: userId,
        practice: { connect: { id: input.practiceId } },
      },
    });
  },

  async listReconciliations(practiceId: string) {
    return db.cashReconciliation.findMany({
      where: { practiceId },
      orderBy: { date: "desc" },
      take: 90,
    });
  },
};