// ============================================================
// VISION ERP - New patient page
// app/(dashboard)/patients/new/page.tsx
// ============================================================

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PatientForm } from "@/modules/patients/patient-form";
import { toCreatePayload, type PatientFormValues } from "@/modules/patients/patient.schema";
import { useCreatePatient } from "@/hooks/use-patients";
import { usePermissions } from "@/hooks/use-permissions";

export default function NewPatientPage() {
  const router = useRouter();
  const { can } = usePermissions();
  const create = useCreatePatient();

  if (!can("patients:create")) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
          <p className="text-base font-semibold text-gray-900">Access denied</p>
          <p className="text-sm text-gray-500">
            You don&apos;t have permission to create patients.
          </p>
          <Button variant="outline" onClick={() => router.push("/patients")}>
            Back to Patients
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(values: PatientFormValues) {
    const patient = await create.mutateAsync(toCreatePayload(values));
    router.push(`/patients/${patient.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader title="New Patient" description="Create a full patient record" />
      </div>

      <PatientForm
        onSubmit={onSubmit}
        onCancel={() => router.push("/patients")}
        submitLabel="Create Patient"
        isSubmitting={create.isPending}
      />
    </div>
  );
}