// ============================================================
// VISION ERP - Dashboard page
// app/(dashboard)/dashboard/page.tsx
// ============================================================

"use client";

import {
  CalendarDays,
  PoundSterling,
  TrendingUp,
  ShoppingBag,
  BellRing,
  CreditCard,
  PackageX,
  Users,
} from "lucide-react";
import { useDashboardKpis, useRevenueReport } from "@/hooks/use-dashboard";
import { usePermissions } from "@/hooks/use-permissions";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function DashboardPage() {
  const { can, roleLabel } = usePermissions();
  const canViewReports = can("reports:read");

  const kpis = useDashboardKpis();
  const revenue = useRevenueReport(30, "day");

  if (!canViewReports) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No dashboard access</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your role ({roleLabel}) does not include reporting permissions. Use the menu to access
            the areas available to you.
          </p>
        </CardContent>
      </Card>
    );
  }

  const k = kpis.data;
  const loading = kpis.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Practice activity at a glance</p>
      </div>

      {kpis.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load dashboard metrics. Please refresh the page.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Today's Appointments"
          value={formatNumber(k?.todayAppointments)}
          icon={CalendarDays}
          accent="blue"
          isLoading={loading}
        />
        <KpiCard
          label="Today's Revenue"
          value={formatCurrency(k?.todayRevenue)}
          icon={PoundSterling}
          accent="green"
          isLoading={loading}
        />
        <KpiCard
          label="Month Revenue"
          value={formatCurrency(k?.monthRevenue)}
          icon={TrendingUp}
          accent="sky"
          isLoading={loading}
        />
        <KpiCard
          label="Pending Orders"
          value={formatNumber(k?.pendingOrders)}
          icon={ShoppingBag}
          accent="amber"
          isLoading={loading}
        />
        <KpiCard
          label="Overdue Recalls"
          value={formatNumber(k?.overdueRecalls)}
          icon={BellRing}
          accent="red"
          isLoading={loading}
        />
        <KpiCard
          label="Outstanding Debt"
          value={formatCurrency(k?.totalDebt)}
          icon={CreditCard}
          accent="purple"
          isLoading={loading}
        />
        <KpiCard
          label="Low Stock Items"
          value={formatNumber(k?.lowStockItems)}
          icon={PackageX}
          accent="amber"
          isLoading={loading}
        />
        <KpiCard
          label="Active Patients"
          value={formatNumber(k?.activePatients)}
          icon={Users}
          accent="blue"
          isLoading={loading}
        />
      </div>

      <RevenueChart
        data={revenue.data?.breakdown}
        isLoading={revenue.isLoading}
        isError={revenue.isError}
      />
    </div>
  );
}