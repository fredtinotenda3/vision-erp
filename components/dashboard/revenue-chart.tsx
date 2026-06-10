// ============================================================
// VISION ERP - Revenue trend chart
// components/dashboard/revenue-chart.tsx
// ============================================================

"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { RevenueBreakdownEntry } from "@/types/dashboard";

interface RevenueChartProps {
  data?: RevenueBreakdownEntry[];
  isLoading?: boolean;
  isError?: boolean;
}

export function RevenueChart({ data, isLoading, isError }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue (last 30 days)</CardTitle>
        <CardDescription>Daily gross sales for your practice</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">
            Unable to load revenue data
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-gray-400">
            No sales recorded in this period
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v) => formatCurrency(Number(v))}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                  labelStyle={{ color: "#111827", fontWeight: 600 }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1E3A8A"
                  strokeWidth={2}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}