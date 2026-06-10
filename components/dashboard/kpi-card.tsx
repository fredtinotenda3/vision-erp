// ============================================================
// VISION ERP - KPI card
// components/dashboard/kpi-card.tsx
// ============================================================

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";

type Accent = "blue" | "green" | "amber" | "red" | "purple" | "sky";

const ACCENTS: Record<Accent, { bg: string; text: string }> = {
  blue: { bg: "bg-[#1E3A8A]/10", text: "text-[#1E3A8A]" },
  green: { bg: "bg-emerald-100", text: "text-emerald-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  red: { bg: "bg-red-100", text: "text-red-600" },
  purple: { bg: "bg-violet-100", text: "text-violet-600" },
  sky: { bg: "bg-sky-100", text: "text-sky-600" },
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: Accent;
  hint?: string;
  isLoading?: boolean;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
  hint,
  isLoading,
}: KpiCardProps) {
  const a = ACCENTS[accent];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-24" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          )}
          {hint ? <p className="mt-1 text-xs text-gray-400">{hint}</p> : null}
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", a.bg)}>
          <Icon className={cn("h-5 w-5", a.text)} />
        </span>
      </div>
    </div>
  );
}