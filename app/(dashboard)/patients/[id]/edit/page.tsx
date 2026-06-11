// ============================================================
// VISION ERP - Patient Edit Page
// app/(dashboard)/patients/[id]/edit/page.tsx
// ============================================================

"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientForm } from "@/modules/patients/patient-form";
import {
  toCreatePayload,
  type PatientFormValues,
} from "@/modules/patients/patient.schema";
import { useUpdatePatient } from "@/hooks/use-patients";
import { usePermissions } from "@/hooks/use-permissions";
import type { Patient } from "@/types/patient";
import { formatDate } from "@/lib/format";

export default function EditPatientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { can } = usePermissions();
  const update = useUpdatePatient(id);

  // ── Permission guard ─────────────────────────────────────
  if (!can("patients:update")) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
          <p className="text-base font-semibold text-gray-900">Access denied</p>
          <p className="text-sm text-gray-500">
            You don&apos;t have permission to edit patients.
          </p>
          <Button variant="outline" onClick={() => router.push(`/patients/${id}`)}>
            Back to Patient
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Fetch existing patient data ──────────────────────────
  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: async () => {
      const res = await apiClient.get<Patient>(`/api/patients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // ── Loading skeleton ─────────────────────────────────────
  if (isLoading || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  // ── Map Patient → PatientFormValues ──────────────────────
  const defaultValues: Partial<PatientFormValues> = {
    title: patient.title as PatientFormValues["title"],
    forename: patient.forename ?? "",
    initial: patient.initial ?? "",
    surname: patient.surname ?? "",
    dob: patient.dob ? patient.dob.split("T")[0] : "",
    sex: patient.sex as PatientFormValues["sex"],
    address1: patient.address1 ?? "",
    address2: patient.address2 ?? "",
    town: patient.town ?? "",
    county: patient.county ?? "",
    postcode: patient.postcode ?? "",
    homePhone: patient.homePhone ?? "",
    workPhone: patient.workPhone ?? "",
    mobile: patient.mobile ?? "",
    email: patient.email ?? "",
    occupation: patient.occupation ?? "",
    nhsNumber: patient.nhsNumber ?? "",
    gpName: patient.gpName ?? "",
    gpAddress: patient.gpAddress ?? "",
    isKeyPatient: patient.isKeyPatient ?? false,
    isStaffRelative: patient.isStaffRelative ?? false,
    isMemberOfStaff: patient.isMemberOfStaff ?? false,
    marketingOptIn: patient.marketingOptIn ?? true,
    contactPref: (patient.contactPref ?? []) as PatientFormValues["contactPref"],
    notes: patient.notes ?? "",
    previousEyeTest: patient.previousEyeTest
      ? patient.previousEyeTest.split("T")[0]
      : "",
  };

  async function onSubmit(values: PatientFormValues) {
    await update.mutateAsync(toCreatePayload(values));
    router.push(`/patients/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/patients/${id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`Edit: ${patient.forename} ${patient.surname}`}
          description={`Ref: ${patient.refNo}`}
        />
      </div>

      <PatientForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onCancel={() => router.push(`/patients/${id}`)}
        submitLabel="Save Changes"
        isSubmitting={update.isPending}
      />
    </div>
  );
}