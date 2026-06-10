// ============================================================
// VISION ERP - Finance Service
// modules/finance/finance.service.ts
// ============================================================

import { financeRepository } from "./finance.repository";
import {
  PettyCashInput,
  PettyCashQueryInput,
  ReconciliationInput,
  StandingOrderInput,
  UpdateStandingOrderInput,
  DebtorInput,
  UpdateDebtorInput,
  DateRangeQueryInput,
  CashReportQueryInput,
  VatReportQueryInput,
  VatBreakdown,
} from "./finance.types";
import { buildPaginationMeta } from "@/lib/utils";
import { addMonths } from "@/lib/utils";

export const financeService = {
  // ─── Petty Cash ───────────────────────────────────────────────────────────

  async listPettyCash(practiceId: string, params: PettyCashQueryInput) {
    const { entries, total } = await financeRepository.findPettyCash(
      practiceId,
      params
    );
    return {
      entries,
      meta: buildPaginationMeta(params.page, params.pageSize, total),
      summary: await financeRepository.pettyCashSummary(
        practiceId,
        params.from,
        params.to
      ),
    };
  },

  async createPettyCash(input: PettyCashInput, userId: string) {
    return financeRepository.createPettyCash({
      description: input.description,
      amount: input.amount,
      isExpense: input.isExpense,
      category: input.category,
      reference: input.reference,
      date: input.date ? new Date(input.date) : new Date(),
      createdById: userId,
      practice: { connect: { id: input.practiceId } },
    });
  },

  async deletePettyCash(id: string, practiceId: string) {
    const entry = await financeRepository.findPettyCashById(id, practiceId);
    if (!entry) throw new Error("PETTY_CASH_NOT_FOUND");
    return financeRepository.deletePettyCash(id);
  },

  // ─── Cash Reconciliation ─────────────────────────────────────────────────

  async listReconciliations(practiceId: string) {
    return financeRepository.findReconciliations(practiceId);
  },

  async createReconciliation(input: ReconciliationInput, userId: string) {
    // Prevent duplicate for same day
    const existing = await financeRepository.findReconciliationByDate(
      input.practiceId,
      input.date
    );
    if (existing) throw new Error("RECONCILIATION_EXISTS");

    const totalSales = input.cashSales + input.cardSales + input.otherSales;
    const closingBalance =
      input.openingBalance + input.cashIn - input.cashOut + input.cashSales;
    const variance = closingBalance - (input.openingBalance + input.cashSales);

    return financeRepository.createReconciliation({
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
    });
  },

  // ─── Debtors ─────────────────────────────────────────────────────────────

  async listDebtors(practiceId: string, params: DateRangeQueryInput) {
    const { debtors, total } = await financeRepository.findDebtors(
      practiceId,
      params
    );
    return {
      debtors,
      meta: buildPaginationMeta(params.page, params.pageSize, total),
      summary: await financeRepository.debtorSummary(practiceId),
    };
  },

  async getDebtorsByPatient(patientId: string) {
    return financeRepository.findDebtorsByPatient(patientId);
  },

  async createDebtor(input: DebtorInput) {
    const balance = input.amount;
    return financeRepository.createDebtor({
      amount: input.amount,
      paid: 0,
      balance,
      status: "PENDING",
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes,
      patient: { connect: { id: input.patientId } },
      ...(input.orderId && { orderId: input.orderId }),
    });
  },

  async updateDebtor(id: string, input: UpdateDebtorInput) {
    const existing = await financeRepository.findDebtorById(id);
    if (!existing) throw new Error("DEBTOR_NOT_FOUND");

    const paid = input.paid !== undefined ? input.paid : existing.paid;
    const balance = existing.amount - paid;
    const status =
      input.status ?? (balance <= 0 ? "PAID" : existing.status);

    return financeRepository.updateDebtor(id, {
      ...input,
      paid,
      balance,
      status,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    });
  },

  // ─── Standing Orders ──────────────────────────────────────────────────────

  async listStandingOrders(practiceId: string) {
    return financeRepository.findStandingOrders(practiceId);
  },

  async createStandingOrder(input: StandingOrderInput) {
    // Check unique reference
    const existing = await financeRepository.findStandingOrderByRef(
      input.reference
    );
    if (existing) throw new Error("REFERENCE_EXISTS");

    const startDate = new Date(input.startDate);
    const nextDue = _calculateNextDue(startDate, input.frequency);

    return financeRepository.createStandingOrder({
      type: input.type,
      reference: input.reference,
      amount: input.amount,
      frequency: input.frequency,
      startDate,
      endDate: input.endDate ? new Date(input.endDate) : null,
      nextDue,
      notes: input.notes,
      status: "ACTIVE",
      practice: { connect: { id: input.practiceId } },
      ...(input.patientId && { patientId: input.patientId }),
    });
  },

  async updateStandingOrder(
    id: string,
    input: UpdateStandingOrderInput,
    practiceId: string
  ) {
    const existing = await financeRepository.findStandingOrderById(
      id,
      practiceId
    );
    if (!existing) throw new Error("STANDING_ORDER_NOT_FOUND");

    return financeRepository.updateStandingOrder(id, {
      ...input,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      nextDue: input.nextDue ? new Date(input.nextDue) : undefined,
    });
  },

  // ─── Reports ──────────────────────────────────────────────────────────────

  async getCashReport(params: CashReportQueryInput, practiceId: string) {
    return financeRepository.getCashReport(practiceId, params.from, params.to);
  },

  async getVatReport(params: VatReportQueryInput, practiceId: string) {
    const [items, salesCount] = await Promise.all([
      financeRepository.getVatItems(practiceId, params.from, params.to),
      financeRepository.getVatSalesCount(practiceId, params.from, params.to),
    ]);

    const vatBreakdown: VatBreakdown = {};

    for (const item of items) {
      const key = `${item.vatRate}%`;
      const net = item.total / (1 + item.vatRate / 100);
      const vat = item.total - net;
      if (!vatBreakdown[key]) vatBreakdown[key] = { net: 0, vat: 0, gross: 0 };
      vatBreakdown[key].net += net;
      vatBreakdown[key].vat += vat;
      vatBreakdown[key].gross += item.total;
    }

    // Round to 2dp
    for (const key of Object.keys(vatBreakdown)) {
      vatBreakdown[key].net = Math.round(vatBreakdown[key].net * 100) / 100;
      vatBreakdown[key].vat = Math.round(vatBreakdown[key].vat * 100) / 100;
      vatBreakdown[key].gross = Math.round(vatBreakdown[key].gross * 100) / 100;
    }

    return { vatBreakdown, salesCount };
  },
};

// ─── Private helpers ──────────────────────────────────────────────────────────

function _calculateNextDue(startDate: Date, frequency: string): Date {
  const map: Record<string, number> = {
    WEEKLY: 0,
    FORTNIGHTLY: 0,
    MONTHLY: 1,
    QUARTERLY: 3,
    ANNUALLY: 12,
  };

  if (frequency === "WEEKLY") {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    return d;
  }
  if (frequency === "FORTNIGHTLY") {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 14);
    return d;
  }

  return addMonths(startDate, map[frequency] ?? 1);
}