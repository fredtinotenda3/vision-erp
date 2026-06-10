// ============================================================
// VISION ERP - Finance Repository
// modules/finance/finance.repository.ts
// ============================================================

import db from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  PettyCashQueryInput,
  DateRangeQueryInput,
} from "./finance.types";

// ============================================================
// FINANCE REPOSITORY
// ============================================================

export const financeRepository = {

  // ─── Petty Cash ───────────────────────────────────────────────────────────

  async findPettyCash(practiceId: string, params: PettyCashQueryInput) {
    const { page, pageSize, from, to, isExpense, category } = params;

    const where: Prisma.PettyCashWhereInput = {
      practiceId,
      date: {
        gte: new Date(from),
        lte: new Date(to + "T23:59:59"),
      },
      ...(isExpense !== undefined && { isExpense }),
      ...(category && { category: { equals: category, mode: "insensitive" } }),
    };

    const [total, entries] = await db.$transaction([
      db.pettyCash.count({ where }),
      db.pettyCash.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { entries, total };
  },

  async findPettyCashById(id: string, practiceId: string) {
    return db.pettyCash.findFirst({ where: { id, practiceId } });
  },

  async createPettyCash(data: Prisma.PettyCashCreateInput) {
    return db.pettyCash.create({ data });
  },

  async deletePettyCash(id: string) {
    return db.pettyCash.delete({ where: { id } });
  },

  async pettyCashSummary(practiceId: string, from: string, to: string) {
    const [income, expenses] = await db.$transaction([
      db.pettyCash.aggregate({
        where: {
          practiceId,
          isExpense: false,
          date: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
      db.pettyCash.aggregate({
        where: {
          practiceId,
          isExpense: true,
          date: { gte: new Date(from), lte: new Date(to + "T23:59:59") },
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalIncome: income._sum.amount ?? 0,
      incomeCount: income._count.id,
      totalExpenses: expenses._sum.amount ?? 0,
      expenseCount: expenses._count.id,
      net: (income._sum.amount ?? 0) - (expenses._sum.amount ?? 0),
    };
  },

  // ─── Cash Reconciliation ─────────────────────────────────────────────────

  async findReconciliations(practiceId: string) {
    return db.cashReconciliation.findMany({
      where: { practiceId },
      orderBy: { date: "desc" },
      take: 90,
    });
  },

  async findReconciliationByDate(practiceId: string, date: string) {
    return db.cashReconciliation.findFirst({
      where: {
        practiceId,
        date: {
          gte: new Date(date + "T00:00:00"),
          lte: new Date(date + "T23:59:59"),
        },
      },
    });
  },

  async findReconciliationById(id: string, practiceId: string) {
    return db.cashReconciliation.findFirst({ where: { id, practiceId } });
  },

  async createReconciliation(data: Prisma.CashReconciliationCreateInput) {
    return db.cashReconciliation.create({ data });
  },

  // ─── Debtors ─────────────────────────────────────────────────────────────

  async findDebtors(practiceId: string, params: DateRangeQueryInput) {
    const { page, pageSize } = params;

    const [total, debtors] = await db.$transaction([
      db.debtor.count({
        where: { patient: { practiceId }, status: { not: "PAID" } },
      }),
      db.debtor.findMany({
        where: { patient: { practiceId }, status: { not: "PAID" } },
        include: {
          patient: {
            select: {
              id: true,
              refNo: true,
              forename: true,
              surname: true,
              mobile: true,
              email: true,
            },
          },
        },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { debtors, total };
  },

  async findDebtorById(id: string) {
    return db.debtor.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            refNo: true,
            forename: true,
            surname: true,
            mobile: true,
          },
        },
      },
    });
  },

  async findDebtorsByPatient(patientId: string) {
    return db.debtor.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
    });
  },

  async createDebtor(data: Prisma.DebtorCreateInput) {
    return db.debtor.create({ data });
  },

  async updateDebtor(id: string, data: Prisma.DebtorUpdateInput) {
    return db.debtor.update({ where: { id }, data });
  },

  async debtorSummary(practiceId: string) {
    const result = await db.debtor.aggregate({
      where: {
        patient: { practiceId },
        status: { not: "PAID" },
      },
      _sum: { balance: true, amount: true, paid: true },
      _count: { id: true },
    });

    return {
      totalBalance: result._sum.balance ?? 0,
      totalOwed: result._sum.amount ?? 0,
      totalPaid: result._sum.paid ?? 0,
      count: result._count.id,
    };
  },

  // ─── Standing Orders / Direct Debits ──────────────────────────────────────

  async findStandingOrders(practiceId: string) {
    return db.standingOrder.findMany({
      where: { practiceId, status: "ACTIVE" },
      orderBy: { nextDue: "asc" },
    });
  },

  async findStandingOrderById(id: string, practiceId: string) {
    return db.standingOrder.findFirst({ where: { id, practiceId } });
  },

  async findStandingOrderByRef(reference: string) {
    return db.standingOrder.findUnique({ where: { reference } });
  },

  async createStandingOrder(data: Prisma.StandingOrderCreateInput) {
    return db.standingOrder.create({ data });
  },

  async updateStandingOrder(id: string, data: Prisma.StandingOrderUpdateInput) {
    return db.standingOrder.update({ where: { id }, data });
  },

  // ─── Cash Report ──────────────────────────────────────────────────────────

  async getCashReport(practiceId: string, from: string, to: string) {
    const sales = await db.sale.findMany({
      where: {
        practiceId,
        voidedAt: null,
        createdAt: {
          gte: new Date(from),
          lte: new Date(to + "T23:59:59"),
        },
      },
      select: {
        id: true,
        saleNo: true,
        totalAmount: true,
        vatAmount: true,
        discount: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
        patient: { select: { forename: true, surname: true, refNo: true } },
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

  // ─── VAT Report ───────────────────────────────────────────────────────────

  async getVatItems(practiceId: string, from: string, to: string) {
    return db.saleItem.findMany({
      where: {
        sale: {
          practiceId,
          voidedAt: null,
          createdAt: {
            gte: new Date(from),
            lte: new Date(to + "T23:59:59"),
          },
        },
      },
      select: {
        vatRate: true,
        total: true,
        quantity: true,
        unitPrice: true,
        discount: true,
      },
    });
  },

  async getVatSalesCount(practiceId: string, from: string, to: string) {
    return db.sale.count({
      where: {
        practiceId,
        voidedAt: null,
        createdAt: {
          gte: new Date(from),
          lte: new Date(to + "T23:59:59"),
        },
      },
    });
  },
};