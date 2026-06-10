// ============================================================
// VISION ERP - Patient detail page
// app/(dashboard)/patients/[id]/page.tsx
// ============================================================

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Archive,
  Mail,
  Phone,
  MapPin,
  CalendarClock,
  Stethoscope,
  BellRing,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Can } from "@/components/rbac/can";
import { usePatient, useDeletePatient } from "@/hooks/use-patients";
import { formatDate, calculateAge } from "@/lib/format";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm text-gray-800">{value && value.length ? value : "—"}</p>
    </div>
  );
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: patient, isLoading, isError } = usePatient(id);
  const del = useDeletePatient();
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const age = calculateAge(patient.dob);

  async function onArchive() {
    await del.mutateAsync(id);
    setConfirmOpen(false);
    router.push("/patients");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/patients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PageHeader
            title={`${patient.title} ${patient.forename} ${patient.surname}`}
            description={`Ref ${patient.refNo}`}
          />
          {patient.isKeyPatient ? (
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Can permission="patients:update">
            <Button variant="outline" onClick={() => router.push(`/patients/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Can>
          <Can permission="patients:delete">
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          </Can>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        {patient.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="neutral">Archived</Badge>
        )}
        {patient.isDeceased ? <Badge variant="neutral">Deceased</Badge> : null}
        {patient.isMemberOfStaff ? <Badge variant="info">Staff</Badge> : null}
        {patient.isStaffRelative ? <Badge variant="info">Staff Relative</Badge> : null}
        {patient.marketingOptIn ? <Badge variant="default">Marketing opt-in</Badge> : null}
        {patient.contactPref?.map((c) => (
          <Badge key={c} variant="neutral">
            {c}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Demographics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Demographics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Date of Birth" value={formatDate(patient.dob)} />
            <Field label="Age" value={age !== null ? `${age} years` : "—"} />
            <Field label="Sex" value={patient.sex} />
            <Field label="Occupation" value={patient.occupation} />
            <Field label="NHS Number" value={patient.nhsNumber} />
            <Field label="Previous Eye Test" value={formatDate(patient.previousEyeTest)} />
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" />
              {patient.mobile || patient.homePhone || patient.workPhone || "—"}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="truncate">{patient.email || "—"}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span>
                {[patient.address1, patient.address2, patient.town, patient.county, patient.postcode]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GP + notes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>GP Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="GP Name" value={patient.gpName} />
            <Field label="GP Address" value={patient.gpAddress} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {patient.notes && patient.notes.length ? patient.notes : "No notes recorded."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Related (optional relations from findById) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-gray-400" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.appointments && patient.appointments.length ? (
              <ul className="space-y-2">
                {patient.appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{a.type}</span>
                    <span className="text-gray-500">{formatDate(a.startTime)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="None scheduled" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gray-400" />
              Latest Prescription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.prescriptions && patient.prescriptions.length ? (
              <div className="space-y-1 text-sm text-gray-700">
                <p className="text-xs text-gray-500">
                  {formatDate(patient.prescriptions[0].examinedAt)}
                </p>
                <p>
                  R: {patient.prescriptions[0].rSphere ?? "—"} /{" "}
                  {patient.prescriptions[0].rCylinder ?? "—"} x{" "}
                  {patient.prescriptions[0].rAxis ?? "—"}
                </p>
                <p>
                  L: {patient.prescriptions[0].lSphere ?? "—"} /{" "}
                  {patient.prescriptions[0].lCylinder ?? "—"} x{" "}
                  {patient.prescriptions[0].lAxis ?? "—"}
                </p>
              </div>
            ) : (
              <EmptyState title="No prescriptions" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-gray-400" />
              Pending Recalls
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient.recalls && patient.recalls.length ? (
              <ul className="space-y-2">
                {patient.recalls.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{r.type}</span>
                    <span className="text-gray-500">{formatDate(r.dueDate)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No pending recalls" />
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Archive patient?"
        description="This soft-deletes the record (sets it inactive). It can be restored by an administrator."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={del.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onArchive} isLoading={del.isPending}>
              Archive Patient
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          You are about to archive{" "}
          <span className="font-medium text-gray-900">
            {patient.forename} {patient.surname}
          </span>{" "}
          ({patient.refNo}).
        </p>
      </Modal>
    </div>
  );
}