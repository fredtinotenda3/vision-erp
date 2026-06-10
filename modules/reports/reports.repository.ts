// ============================================================
// VISION ERP - Reports Repository
// modules/reports/reports.repository.ts
// ============================================================

import db from "@/lib/db";
import {
  RevenueReportQuery,
  AppointmentsReportQuery,
  PatientDemographicsQuery,
  ClinicalReportQuery,
  OrdersReportQuery,
  InventoryReportQuery,
  StaffPerformanceQuery,
  RecallReportQuery,
  DebtorReportQuery,
} from "./reports.types";

export const reportsRepository = {
  // ─── Revenue / Sales ────────────────────────────────────────────────────────

  async getRevenueSummary(params: RevenueReportQuery, practiceId: string) {
    const from = new Date(params.from);
    const to = new Date(params.to + "T23:59:59");

    const [aggregates, byMethod, sales] = await db.$transaction([
      db.sale.aggregate({
        where: { practiceId, voidedAt: null, createdAt: { gte: from, lte: to } },
        _sum: { totalAmount: true, vatAmount: true, discount: true },
        _count: { id: true },
      }),
      db.sale.groupBy({
        by: ["paymentMethod"],
        where: { practiceId, voidedAt: null, createdAt: { gte: from, lte: to } },
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: [],
      }),
      db.sale.findMany({
        where: { practiceId, voidedAt: null, createdAt: { gte: from, lte: to } },
        select: { totalAmount: true, vatAmount: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return { aggregates, byMethod, sales };
  },

  // ─── Appointments ────────────────────────────────────────────────────────────

  async getAppointmentsSummary(params: AppointmentsReportQuery, practiceId: string) {
    const from = new Date(params.from);
    const to = new Date(params.to + "T23:59:59");

    const where = {
      practiceId,
      startTime: { gte: from, lte: to },
      ...(params.optometristId && { optometristId: params.optometristId }),
    };

    const [total, byStatus, byType, byOptometrist] = await db.$transaction([
      db.appointment.count({ where }),
      db.appointment.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
        orderBy: [],
      }),
      db.appointment.groupBy({
        by: ["type"],
        where,
        _count: { id: true },
        orderBy: [],
      }),
      db.appointment.groupBy({
        by: ["optometristId"],
        where,
        _count: { id: true },
        orderBy: [],
      }),
    ]);

    return { total, byStatus, byType, byOptometrist };
  },

  // ─── Patient demographics ────────────────────────────────────────────────────

  async getPatientDemographics(params: PatientDemographicsQuery, practiceId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [total, active, bySex, newThisMonth, newThisYear, keyPatients, patients] =
      await db.$transaction([
        db.patient.count({ where: { practiceId } }),
        db.patient.count({ where: { practiceId, isActive: true } }),
        db.patient.groupBy({
          by: ["sex"],
          where: { practiceId, isActive: true },
          _count: { id: true },
          orderBy: [],
        }),
        db.patient.count({
          where: { practiceId, createdAt: { gte: startOfMonth } },
        }),
        db.patient.count({
          where: { practiceId, createdAt: { gte: startOfYear } },
        }),
        db.patient.count({ where: { practiceId, isKeyPatient: true, isActive: true } }),
        db.patient.findMany({
          where: { practiceId, isActive: true },
          select: { dob: true },
        }),
      ]);

    return { total, active, bySex, newThisMonth, newThisYear, keyPatients, patients };
  },

  // ─── Clinical ────────────────────────────────────────────────────────────────

  async getClinicalSummary(params: ClinicalReportQuery, practiceId: string) {
    const from = new Date(params.from);
    const to = new Date(params.to + "T23:59:59");

    const where = {
      patient: { practiceId },
      examinedAt: { gte: from, lte: to },
      ...(params.optometristId && { examinedById: params.optometristId }),
    };

    const [total, byType, complete, prescriptionsCreated] = await db.$transaction([
      db.clinicalRecord.count({ where }),
      db.clinicalRecord.groupBy({
        by: ["type"],
        where,
        _count: { id: true },
        orderBy: [],
      }),
      db.clinicalRecord.count({ where: { ...where, isComplete: true } }),
      db.prescription.count({
        where: {
          patient: { practiceId },
          examinedAt: { gte: from, lte: to },
        },
      }),
    ]);

    return { total, byType, complete, prescriptionsCreated };
  },

  // ─── Orders ──────────────────────────────────────────────────────────────────

  async getOrdersSummary(params: OrdersReportQuery, practiceId: string) {
    const from = new Date(params.from);
    const to = new Date(params.to + "T23:59:59");

    const where = {
      practiceId,
      orderDate: { gte: from, lte: to },
      ...(params.status && { status: params.status as any }),
      ...(params.type && { type: params.type as any }),
    };

    const [byStatus, byType, aggregate, orders] = await db.$transaction([
      db.order.groupBy({
        by: ["status"],
        where: { practiceId, orderDate: { gte: from, lte: to } },
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: [],
      }),
      db.order.groupBy({
        by: ["type"],
        where: { practiceId, orderDate: { gte: from, lte: to } },
        _count: { id: true },
        orderBy: [],
      }),
      db.order.aggregate({
        where,
        _sum: { totalAmount: true, depositPaid: true, balanceDue: true },
        _count: { id: true },
      }),
      db.order.findMany({
        where,
        select: {
          id: true, orderNo: true, status: true, type: true,
          totalAmount: true, orderDate: true,
          patient: { select: { refNo: true, forename: true, surname: true } },
        },
        orderBy: { orderDate: "desc" },
        take: 100,
      }),
    ]);

    return { byStatus, byType, aggregate, orders };
  },

  // ─── Inventory ───────────────────────────────────────────────────────────────

  async getInventorySummary(params: InventoryReportQuery, practiceId: string) {
    const where = {
      practiceId,
      isActive: true,
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.lowStockOnly && {
        trackStock: true,
        // Prisma doesn't support field comparisons directly; handled in service
      }),
    };

    const items = await db.stockItem.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    const movements = await db.stockMovement.groupBy({
      by: ["stockItemId", "type"],
      where: {
        stockItem: { practiceId },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { quantity: true },
      orderBy: [],
    });

    return { items, movements };
  },

  // ─── Staff Performance ───────────────────────────────────────────────────────

  async getStaffPerformance(params: StaffPerformanceQuery, practiceId: string) {
    const from = new Date(params.from);
    const to = new Date(params.to + "T23:59:59");

    const userWhere = {
      practiceId,
      isActive: true,
      ...(params.userId && { id: params.userId }),
    };

    const [users, exams, sales, orders, missedAppts] = await db.$transaction([
      db.user.findMany({
        where: userWhere,
        select: { id: true, name: true, role: true, email: true },
      }),
      db.clinicalRecord.groupBy({
        by: ["examinedById"],
        where: {
          patient: { practiceId },
          examinedAt: { gte: from, lte: to },
        },
        _count: { id: true },
        orderBy: [],
      }),
      db.sale.groupBy({
        by: ["createdById"],
        where: { practiceId, voidedAt: null, createdAt: { gte: from, lte: to } },
        _sum: { totalAmount: true },
        _count: { id: true },
        orderBy: [],
      }),
      db.order.groupBy({
        by: ["createdById"],
        where: { practiceId, orderDate: { gte: from, lte: to } },
        _count: { id: true },
        orderBy: [],
      }),
      db.appointment.groupBy({
        by: ["optometristId"],
        where: {
          practiceId,
          status: { in: ["MISSED", "NO_SHOW"] },
          startTime: { gte: from, lte: to },
        },
        _count: { id: true },
        orderBy: [],
      }),
    ]);

    return { users, exams, sales, orders, missedAppts };
  },

  // ─── Recall report ───────────────────────────────────────────────────────────

  async getRecallSummary(params: RecallReportQuery, practiceId: string) {
    const from = new Date(params.from);
    const to = new Date(params.to + "T23:59:59");

    const where = {
      practiceId,
      createdAt: { gte: from, lte: to },
      ...(params.type && { type: params.type as any }),
      ...(params.status && { status: params.status as any }),
    };

    const [total, byStatus, byType, byMethod, overdue] = await db.$transaction([
      db.recall.count({ where }),
      db.recall.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
        orderBy: [],
      }),
      db.recall.groupBy({
        by: ["type"],
        where,
        _count: { id: true },
        orderBy: [],
      }),
      db.recall.groupBy({
        by: ["method"],
        where,
        _count: { id: true },
        orderBy: [],
      }),
      db.recall.count({
        where: { practiceId, status: "PENDING", dueDate: { lt: new Date() } },
      }),
    ]);

    return { total, byStatus, byType, byMethod, overdue };
  },

  // ─── Debtor report ───────────────────────────────────────────────────────────

  async getDebtorReport(params: DebtorReportQuery, practiceId: string) {
    const { page, pageSize } = params;

    const where = {
      patient: { practiceId },
      status: { not: "PAID" as const },
      ...(params.status && { status: params.status as any }),
    };

    const [total, debtors, aggregate] = await db.$transaction([
      db.debtor.count({ where }),
      db.debtor.findMany({
        where,
        include: {
          patient: {
            select: { id: true, refNo: true, forename: true, surname: true, mobile: true, email: true },
          },
        },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.debtor.aggregate({
        where,
        _sum: { amount: true, paid: true, balance: true },
        _count: { id: true },
      }),
    ]);

    return { total, debtors, aggregate };
  },

  // ─── Dashboard KPIs ──────────────────────────────────────────────────────────

  async getDashboardKpis(practiceId: string) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayAppointments,
      todayRevenue,
      monthRevenue,
      pendingOrders,
      overdueRecalls,
      totalDebt,
      lowStockItems,
      activePatients,
    ] = await db.$transaction([
      db.appointment.count({
        where: { practiceId, startTime: { gte: startOfDay, lte: endOfDay } },
      }),
      db.sale.aggregate({
        where: { practiceId, voidedAt: null, createdAt: { gte: startOfDay, lte: endOfDay } },
        _sum: { totalAmount: true },
      }),
      db.sale.aggregate({
        where: { practiceId, voidedAt: null, createdAt: { gte: startOfMonth, lte: endOfDay } },
        _sum: { totalAmount: true },
      }),
      db.order.count({
        where: { practiceId, status: { in: ["PENDING", "IN_LAB"] } },
      }),
      db.recall.count({
        where: { practiceId, status: "PENDING", dueDate: { lt: today } },
      }),
      db.debtor.aggregate({
        where: { patient: { practiceId }, status: { not: "PAID" } },
        _sum: { balance: true },
      }),
      db.stockItem.count({
        where: { practiceId, isActive: true, trackStock: true, currentStock: { lte: 5 } },
      }),
      db.patient.count({ where: { practiceId, isActive: true } }),
    ]);

    return {
      todayAppointments,
      todayRevenue: todayRevenue._sum.totalAmount ?? 0,
      monthRevenue: monthRevenue._sum.totalAmount ?? 0,
      pendingOrders,
      overdueRecalls,
      totalDebt: totalDebt._sum.balance ?? 0,
      lowStockItems,
      activePatients,
    };
  },
};