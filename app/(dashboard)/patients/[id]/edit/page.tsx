// ============================================================
// VISION ERP - Edit patient page
// app/(dashboard)/patients/[id]/edit/page.tsx
// ============================================================

"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FullPageSpinner } from "@/components/ui/spinner";
import { PatientForm } from "@/modules/patients/patient-form";
import {
  toCreatePayload,
  type PatientFormValues,
} from "@/modules/patients/patient.schema";
import { usePatient, useUpdatePatient } from "@/hooks/use-patients";
import { usePermissions } from "@/hooks/use-permissions";
import type { Patient } from "@/types/patient";

function toFormDefaults(p: Patient): Partial<PatientFormValues> {
  const dateOnly = (v: string | null) => (v ? v.split("T")[0] : "");
  return {
    title: p.title,
    forename: p.forename,
    initial: p.initial ?? "",
    surname: p.surname,
    dob: dateOnly(p.dob),
    sex: p.sex,
    address1: p.address1,
    address2: p.address2 ?? "",
    town: p.town,
    county: p.county ?? "",
    postcode: p.postcode,
    homePhone: p.homePhone ?? "",
    workPhone: p.workPhone ?? "",
    mobile: p.mobile ?? "",
    email: p.email ?? "",
    occupation: p.occupation ?? "",
    nhsNumber: p.nhsNumber ?? "",
    gpName: p.gpName ?? "",
    gpAddress: p.gpAddress ?? "",
    isKeyPatient: p.isKeyPatient,
    isStaffRelative: p.isStaffRelative,
    isMemberOfStaff: p.isMemberOfStaff,
    marketingOptIn: p.marketingOptIn,
    contactPref: p.contactPref ?? [],
    notes: p.notes ?? "",
    previousEyeTest: dateOnly(p.previousEyeTest),
  };
}

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { can } = usePermissions();
  const { data: patient, isLoading, isError } = usePatient(id);
  const update = useUpdatePatient(id);

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
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <FullPageSpinner label="Loading patient…" />;

  if (isError || !patient) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-base font-semibold text-gray-900">Patient not found</p>
          <Button variant="outline" className="mt-3" onClick={() => router.push("/patients")}>
            Back to Patients
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: PatientFormValues) {
    await update.mutateAsync(toCreatePayload(values));
    router.push(`/patients/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/patients/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`Edit — ${patient.forename} ${patient.surname}`}
          description={patient.refNo}
        />
      </div>

      <PatientForm
        defaultValues={toFormDefaults(patient)}
        onSubmit={onSubmit}
        onCancel={() => router.push(`/patients/${id}`)}
        submitLabel="Save Changes"
        isSubmitting={update.isPending}
      />
    </div>
  );
}