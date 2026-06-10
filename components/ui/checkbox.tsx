// ============================================================
// VISION ERP - Checkbox primitive
// components/ui/checkbox.tsx
// ============================================================

"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700"
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]",
            className
          )}
          {...props}
        />
        {label ? <span>{label}</span> : null}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";