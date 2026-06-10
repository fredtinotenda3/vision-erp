// ============================================================
// VISION ERP - Pagination control (driven by PaginationMeta)
// components/data-table/pagination.tsx
// ============================================================

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/types";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({ meta, onPageChange, isLoading }: PaginationProps) {
  if (!meta || meta.total === 0) return null;

  const start = (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 sm:flex-row">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{start}</span>–
        <span className="font-medium text-gray-700">{end}</span> of{" "}
        <span className="font-medium text-gray-700">{meta.total}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPreviousPage || isLoading}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-gray-500">
          Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage || isLoading}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}