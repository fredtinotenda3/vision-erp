// ============================================================
// VISION ERP - Textarea primitive
// components/ui/textarea.tsx
// ============================================================

"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors",
          "placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-gray-50",
          hasError ? "border-red-400 focus:ring-red-500" : "border-gray-300",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";