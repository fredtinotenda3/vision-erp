// ============================================================
// VISION ERP - Input + Label + FieldError primitives
// components/ui/input.tsx
// ============================================================

"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-10 w-full rounded-lg border bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors",
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
Input.displayName = "Input";

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-gray-700", className)} {...props}>
      {children}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}