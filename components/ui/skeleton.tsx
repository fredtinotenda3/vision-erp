// ============================================================
// VISION ERP - Skeleton primitive
// components/ui/skeleton.tsx
// ============================================================

import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}