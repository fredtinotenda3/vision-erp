// ============================================================
// VISION ERP - Badge primitive
// components/ui/badge.tsx
// ============================================================

import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "neutral";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-[#1E3A8A]/10 text-[#1E3A8A]",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  neutral: "bg-gray-100 text-gray-600",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}