// ============================================================
// VISION ERP - Patient Detail Page
// app/(dashboard)/patients/[id]/page.tsx
// ------------------------------------------------------------
// Full patient profile: demographics, prescriptions, clinical
// history, appointments, recalls, orders.
// ============================================================

"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Archive,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  ShoppingBag,
  Bell,
  FileText,
  User,
  Stethoscope,
  AlertTriangle,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Can } from "@/components/rbac/can";
import { formatDate, formatDateTime, calculateAge } from "@/lib/format";
import type { Patient } from "@/types/patient";

// ─── Prescription card ─────────────────────────────────────

function RxTable({ rx }: { rx: NonNullable<Patient["prescriptions"]>[0] }) {
  const val = (v: number | null | undefined, suffix = "") =>
    v != null ? `${v > 0 ? "+" : ""}${v.toFixed(2)}${suffix}` : "—";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-gray-700">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-500">
            <th className="pb-2 pr-4 font-medium">Eye</th>
            <th className="pb-2 pr-4 font-medium">Sph</th>
            <th className="pb-2 pr-4 font-medium">Cyl</th>
            <th className="pb-2 pr-4 font-medium">Axis</th>
            <th className="pb-2 pr-4 font-medium">Add</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          <tr>
            <td className="py-1.5 pr-4 font-medium text-gray-900">R</td>
            <td className="py-1.5 pr-4 font-mono">{val(rx.rSphere)}</td>
            <td className="py-1.5 pr-4 font-mono">{val(rx.rCylinder)}</td>
            <td className="py-1.5 pr-4 font-mono">{rx.rAxis ?? "—"}</td>
            <td className="py-1.5 pr-4 font-mono">{val(rx.rAdd)}</td>
          </tr>
          <tr>
            <td className="py-1.5 pr-4 font-medium text-gray-900">L</td>
            <td className="py-1.5 pr-4 font-mono">{val(rx.lSphere)}</td>
            <td className="py-1.5 pr-4 font-mono">{val(rx.lCylinder)}</td>
            <td className="py-1.5 pr-4 font-mono">{rx.lAxis ?? "—"}</td>
            <td className="py-1.5 pr-4 font-mono">{val(rx.lAdd)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Info row ──────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-40">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value || "—"}</span>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-[#EFF6FF]">
          <Icon className="h-4 w-4 text-[#1E3A8A]" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ─── Status badge helpers ──────────────────────────────────

function apptStatusVariant(status: string) {
  const map: Record<string, "success" | "warning" | "danger" | "neutral"> = {
    SCHEDULED: "warning",
    CONFIRMED: "success",
    COMPLETED: "success",
    CANCELLED: "danger",
    MISSED: "neutral",
    NO_SHOW: "neutral",
    IN_PROGRESS: "warning",
  };
  return map[status] ?? "neutral";
}

function recallStatusVariant(status: string) {
  const map: Record<string, "success" | "warning" | "danger" | "neutral"> = {
    PENDING: "warning",
    SENT: "neutral",
    RESPONDED: "success",
    EXPIRED: "danger",
  };
  return map[status] ?? "neutral";
}

// ─── Main page ─────────────────────────────────────────────

export default function PatientDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [archiveOpen, setArchiveOpen] = useState(false);

  // ── Fetch patient ──────────────────────────────────────
  const { data: patient, isLoading, isError } = useQuery<Patient>({
    queryKey: ["patient", id],
    queryFn: async () => {
      const res = await apiClient.get<Patient>(`/api/patients/${id}`);
      return res.data;
    },
    enabled: !!id,
    retry: false,
  });

  // ── Archive mutation ───────────────────────────────────
  const archive = useMutation({
    mutationFn: () => apiClient.delete(`/api/patients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      router.push("/patients");
    },
  });

  // ─── Loading skeleton ────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────
  if (isError || !patient) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="font-semibold text-gray-900">Patient not found</p>
          <p className="text-sm text-gray-500">
            This patient may have been archived or the ID is invalid.
          </p>
          <Button variant="outline" onClick={() => router.push("/patients")}>
            Back to Patients
          </Button>
        </CardContent>
      </Card>
    );
  }

  const age = calculateAge(patient.dob);
  const fullName = `${patient.title} ${patient.forename} ${patient.surname}`;
  const latestRx = patient.prescriptions?.[0];
  const upcomingAppts = patient.appointments ?? [];
  const pendingRecalls = patient.recalls ?? [];

  return (
    <>
      <div className="space-y-6">
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/patients")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">{fullName}</h1>
                {patient.isKeyPatient && (
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                )}
                {patient.isDeceased ? (
                  <Badge variant="neutral">Deceased</Badge>
                ) : !patient.isActive ? (
                  <Badge variant="neutral">Archived</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Ref: <span className="font-mono font-medium">{patient.refNo}</span>
                {age != null && (
                  <span className="ml-3">
                    {age} years · {formatDate(patient.dob)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Can permission="patients:update">
              <Button
                variant="outline"
                onClick={() => router.push(`/patients/${id}/edit`)}
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Can>
            <Can permission="patients:delete">
              {patient.isActive && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setArchiveOpen(true)}
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )}
            </Can>
          </div>
        </div>

        {/* ── Body: 3-column grid ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Col 1: Demographics + Contact ──────────────── */}
          <div className="space-y-6">
            {/* Demographics */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader icon={User} title="Demographics" />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <InfoRow label="Date of Birth" value={formatDate(patient.dob)} />
                <InfoRow label="Age" value={age != null ? `${age} years` : undefined} />
                <InfoRow label="Sex" value={patient.sex} />
                <InfoRow label="Occupation" value={patient.occupation} />
                <InfoRow label="NHS Number" value={patient.nhsNumber} />
                <InfoRow
                  label="Previous Eye Test"
                  value={formatDate(patient.previousEyeTest)}
                />
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader icon={Phone} title="Contact" />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0 space-y-2.5">
                {patient.mobile && (
                  <a
                    href={`tel:${patient.mobile}`}
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#1E3A8A] transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {patient.mobile}
                    <span className="text-xs text-gray-400">Mobile</span>
                  </a>
                )}
                {patient.homePhone && (
                  <a
                    href={`tel:${patient.homePhone}`}
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#1E3A8A] transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {patient.homePhone}
                    <span className="text-xs text-gray-400">Home</span>
                  </a>
                )}
                {patient.workPhone && (
                  <a
                    href={`tel:${patient.workPhone}`}
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#1E3A8A] transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {patient.workPhone}
                    <span className="text-xs text-gray-400">Work</span>
                  </a>
                )}
                {patient.email && (
                  <a
                    href={`mailto:${patient.email}`}
                    className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#1E3A8A] transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {patient.email}
                  </a>
                )}
                {!patient.mobile && !patient.homePhone && !patient.workPhone && !patient.email && (
                  <p className="text-sm text-gray-400">No contact details</p>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p>{patient.address1}</p>
                      {patient.address2 && <p>{patient.address2}</p>}
                      <p>{patient.town}{patient.county ? `, ${patient.county}` : ""}</p>
                      <p className="font-medium">{patient.postcode}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* GP Details */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader icon={Stethoscope} title="GP Details" />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <InfoRow label="GP Name" value={patient.gpName} />
                <InfoRow label="GP Address" value={patient.gpAddress} />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader icon={FileText} title="Notes" />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {patient.notes ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {patient.notes}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">No notes recorded.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Col 2: Prescriptions + Appointments ────────── */}
          <div className="space-y-6">
            {/* Latest Prescription */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader
                  icon={Eye}
                  title="Latest Prescription"
                  action={
                    <Can permission="clinical:create">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#1E3A8A] hover:bg-[#EFF6FF]"
                        onClick={() => router.push(`/clinical/new?patientId=${id}`)}
                      >
                        <Plus className="h-3 w-3" />
                        New Exam
                      </Button>
                    </Can>
                  }
                />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {latestRx ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatDate(latestRx.examinedAt)}
                      </span>
                      {latestRx.isFinal && (
                        <Badge variant="success" className="text-xs">Final</Badge>
                      )}
                    </div>
                    <RxTable rx={latestRx} />
                    {patient.prescriptions && patient.prescriptions.length > 1 && (
                      <button
                        className="flex items-center gap-1 text-xs text-[#1E3A8A] hover:underline mt-2"
                        onClick={() => router.push(`/patients/${id}/prescriptions`)}
                      >
                        View all {patient.prescriptions.length} prescriptions
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Eye className="h-8 w-8 text-gray-200" />
                    <p className="text-sm text-gray-400">No prescriptions</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader
                  icon={Calendar}
                  title="Upcoming Appointments"
                  action={
                    <Can permission="appointments:create">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#1E3A8A] hover:bg-[#EFF6FF]"
                        onClick={() => router.push(`/appointments/new?patientId=${id}`)}
                      >
                        <Plus className="h-3 w-3" />
                        Book
                      </Button>
                    </Can>
                  }
                />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {upcomingAppts.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingAppts.map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 hover:bg-blue-50 hover:border-blue-100 transition-colors cursor-pointer"
                        onClick={() => router.push(`/appointments/${appt.id}`)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {appt.type.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDateTime(appt.startTime)}
                          </p>
                        </div>
                        <Badge variant={apptStatusVariant(appt.status)} className="text-xs">
                          {appt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Calendar className="h-8 w-8 text-gray-200" />
                    <p className="text-sm text-gray-400">None scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Recalls */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader
                  icon={Bell}
                  title="Pending Recalls"
                  action={
                    <Can permission="recalls:create">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-[#1E3A8A] hover:bg-[#EFF6FF]"
                        onClick={() => router.push(`/recalls/new?patientId=${id}`)}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </Can>
                  }
                />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                {pendingRecalls.length > 0 ? (
                  <div className="space-y-2">
                    {pendingRecalls.map((recall) => (
                      <div
                        key={recall.id}
                        className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {recall.type} Recall
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Due: {formatDate(recall.dueDate)}
                          </p>
                        </div>
                        <Badge variant={recallStatusVariant(recall.status)} className="text-xs">
                          {recall.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Bell className="h-8 w-8 text-gray-200" />
                    <p className="text-sm text-gray-400">No pending recalls</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Col 3: Orders + Flags ───────────────────────── */}
          <div className="space-y-6">
            {/* Patient flags */}
            {(patient.isKeyPatient ||
              patient.isStaffRelative ||
              patient.isMemberOfStaff ||
              !patient.marketingOptIn) && (
              <Card>
                <CardHeader className="pb-0 pt-5 px-5">
                  <SectionHeader icon={AlertTriangle} title="Flags" />
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {patient.isKeyPatient && (
                      <Badge variant="warning">Key Patient</Badge>
                    )}
                    {patient.isStaffRelative && (
                      <Badge variant="neutral">Staff Relative</Badge>
                    )}
                    {patient.isMemberOfStaff && (
                      <Badge variant="neutral">Staff Member</Badge>
                    )}
                    {!patient.marketingOptIn && (
                      <Badge variant="danger">Marketing Opt-Out</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick actions */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <h2 className="text-sm font-semibold text-gray-900">Quick Actions</h2>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <Can permission="appointments:create">
                    <button
                      onClick={() => router.push(`/appointments/new?patientId=${id}`)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1E3A8A] transition-colors"
                    >
                      <Calendar className="h-5 w-5" />
                      Book Appt
                    </button>
                  </Can>
                  <Can permission="clinical:create">
                    <button
                      onClick={() => router.push(`/clinical/new?patientId=${id}`)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1E3A8A] transition-colors"
                    >
                      <Eye className="h-5 w-5" />
                      Eye Exam
                    </button>
                  </Can>
                  <Can permission="orders:create">
                    <button
                      onClick={() => router.push(`/orders/new?patientId=${id}`)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1E3A8A] transition-colors"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      New Order
                    </button>
                  </Can>
                  <Can permission="recalls:create">
                    <button
                      onClick={() => router.push(`/recalls/new?patientId=${id}`)}
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-[#1E3A8A] transition-colors"
                    >
                      <Bell className="h-5 w-5" />
                      Add Recall
                    </button>
                  </Can>
                </div>
              </CardContent>
            </Card>

            {/* Audit trail */}
            <Card>
              <CardHeader className="pb-0 pt-5 px-5">
                <SectionHeader icon={FileText} title="Record Info" />
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <InfoRow label="Patient Ref" value={patient.refNo} />
                <InfoRow label="Registered" value={formatDate(patient.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(patient.updatedAt)} />
                <InfoRow
                  label="Contact Pref"
                  value={patient.contactPref?.join(", ") || undefined}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Archive confirmation modal ──────────────────────── */}
      <Modal
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive Patient"
        description={`Are you sure you want to archive ${fullName}? They will no longer appear in active patient searches.`}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(false)}
              disabled={archive.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => archive.mutate()}
              isLoading={archive.isPending}
            >
              Archive Patient
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          This action can be reversed by an administrator. The patient record will be preserved but hidden from active views.
        </p>
      </Modal>
    </>
  );
}