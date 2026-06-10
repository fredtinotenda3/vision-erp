// ============================================================
// VISION ERP - Patient table columns
// modules/patients/patient-columns.tsx
// ------------------------------------------------------------
// Column ids match backend sortBy field names (surname, refNo, dob).
// ============================================================

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { PatientListItem } from "@/types/patient";
import { Badge } from "@/components/ui/badge";
import { formatDate, calculateAge } from "@/lib/format";
import { Star } from "lucide-react";

export const patientColumns: ColumnDef<PatientListItem, unknown>[] = [
  {
    id: "refNo",
    header: "Ref",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-xs font-medium text-gray-600">
        {row.original.refNo}
      </span>
    ),
  },
  {
    id: "surname",
    header: "Name",
    enableSorting: true,
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium text-gray-900">
              {p.surname}, {p.forename}
            </p>
            <p className="text-xs text-gray-500">
              {p.title}
              {p.occupation ? ` · ${p.occupation}` : ""}
            </p>
          </div>
          {p.isKeyPatient ? (
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ) : null}
        </div>
      );
    },
  },
  {
    id: "dob",
    header: "DOB / Age",
    enableSorting: true,
    cell: ({ row }) => {
      const age = calculateAge(row.original.dob);
      return (
        <div>
          <p className="text-gray-700">{formatDate(row.original.dob)}</p>
          <p className="text-xs text-gray-500">{age !== null ? `${age} yrs` : "—"}</p>
        </div>
      );
    },
  },
  {
    id: "contact",
    header: "Contact",
    enableSorting: false,
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="text-sm">
          <p className="text-gray-700">{p.mobile || p.homePhone || "—"}</p>
          <p className="truncate text-xs text-gray-500">{p.email || "—"}</p>
        </div>
      );
    },
  },
  {
    id: "postcode",
    header: "Postcode",
    enableSorting: false,
    cell: ({ row }) => <span className="text-gray-700">{row.original.postcode}</span>,
  },
  {
    id: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => {
      const p = row.original;
      if (p.isDeceased) return <Badge variant="neutral">Deceased</Badge>;
      if (!p.isActive) return <Badge variant="neutral">Archived</Badge>;
      return <Badge variant="success">Active</Badge>;
    },
  },
];