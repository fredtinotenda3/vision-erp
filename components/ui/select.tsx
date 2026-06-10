// ============================================================
// VISION ERP - Select primitive
// components/ui/select.tsx
// ============================================================

"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, hasError, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent",
          "disabled:cursor-not-allowed disabled:bg-gray-50",
          hasError ? "border-red-400 focus:ring-red-500" : "border-gray-300",
          className
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = "Select";