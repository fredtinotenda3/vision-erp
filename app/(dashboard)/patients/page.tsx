// ============================================================
// VISION ERP - Patients list page
// app/(dashboard)/patients/page.tsx
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SortingState } from "@tanstack/react-table";
import { Search, UserPlus, Zap, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { Pagination } from "@/components/data-table/pagination";
import { Can } from "@/components/rbac/can";
import { useDebounce } from "@/hooks/use-debounce";
import { usePatients } from "@/hooks/use-patients";
import { patientColumns } from "@/modules/patients/patient-columns";
import { QuickRegisterDialog } from "@/modules/patients/quick-register-dialog";
import type { PatientSearchParams } from "@/types/patient";

const PAGE_SIZE = 20;

export default function PatientsPage() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 350);

  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([{ id: "surname", desc: false }]);
  const [quickOpen, setQuickOpen] = useState(false);

  // Translate TanStack sorting -> backend sortBy/sortOrder.
  const params: PatientSearchParams = useMemo(() => {
    const sort = sorting[0];
    return {
      search: debouncedSearch || undefined,
      page,
      pageSize: PAGE_SIZE,
      sortBy: sort?.id ?? "surname",
      sortOrder: sort?.desc ? "desc" : "asc",
    };
  }, [debouncedSearch, page, sorting]);

  const { data, isLoading, isError, isFetching } = usePatients(params);

  // Reset to page 1 whenever the search term changes.
  function onSearchChange(value: string) {
    setSearchInput(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Search, register and manage patient records"
        actions={
          <>
            <Can permission="patients:create">
              <Button variant="outline" onClick={() => setQuickOpen(true)}>
                <Zap className="h-4 w-4" />
                Quick Register
              </Button>
            </Can>
            <Can permission="patients:create">
              <Button onClick={() => router.push("/patients/new")}>
                <UserPlus className="h-4 w-4" />
                New Patient
              </Button>
            </Can>
          </>
        }
      />

      <Card>
        <CardContent className="pt-5">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, ref, mobile, NHS number, postcode…"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={patientColumns}
        data={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        sorting={sorting}
        onSortingChange={setSorting}
        onRowClick={(p) => router.push(`/patients/${p.id}`)}
        emptyTitle="No patients found"
        emptyDescription={
          debouncedSearch
            ? "Try a different search term."
            : "Register your first patient to get started."
        }
      />

      <Pagination meta={data?.meta} onPageChange={setPage} isLoading={isFetching} />

      <QuickRegisterDialog
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onCreated={(id) => router.push(`/patients/${id}`)}
      />

      {/* Decorative anchor for the icon import in empty SSR snapshots */}
      <span className="hidden">
        <Users className="h-0 w-0" />
      </span>
    </div>
  );
}