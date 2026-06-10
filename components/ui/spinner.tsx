// ============================================================
// VISION ERP - Spinner primitive
// components/ui/spinner.tsx
// ============================================================

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-[#1E3A8A]", className)} />;
}

export function FullPageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Spinner className="h-7 w-7" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}