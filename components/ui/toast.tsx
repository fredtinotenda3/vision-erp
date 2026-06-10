// ============================================================
// VISION ERP - Toast viewport
// components/ui/toast.tsx
// ============================================================

"use client";

import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useUIStore, type ToastVariant } from "@/store/ui.store";
import { cn } from "@/lib/cn";

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: <Info className="h-5 w-5 text-sky-500" />,
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
};

const BORDERS: Record<ToastVariant, string> = {
  default: "border-l-sky-500",
  success: "border-l-emerald-500",
  error: "border-l-red-500",
  warning: "border-l-amber-500",
};

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-lg",
            BORDERS[t.variant]
          )}
        >
          <div className="mt-0.5 shrink-0">{ICONS[t.variant]}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{t.title}</p>
            {t.description ? (
              <p className="mt-0.5 text-sm text-gray-500">{t.description}</p>
            ) : null}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}