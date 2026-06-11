// path: app/(dashboard)/appointments/[id]/page.tsx
// ============================================================
// VISION ERP - Appointment detail / management page
// app/(dashboard)/appointments/[id]/page.tsx
// ============================================================

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, User, MapPin, CalendarDays, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Can } from "@/components/rbac/can";
import {
  useAppointment,
  useUpdateAppointment,
  useCancelAppointment,
} from "@/hooks/use-appointments";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/api-client";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  SCHEDULED: "warning",
  CONFIRMED: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  MISSED: "neutral",
  NO_SHOW: "neutral",
  RESCHEDULED: "neutral",
};

const DURATIONS = [10, 15, 20, 30, 45, 60, 90];

function formatTypeName(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data, isLoading, isError } = useAppointment(id);
  const update = useUpdateAppointment(id);
  const cancel = useCancelAppointment(id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const appt = data?.data;

  async function setStatus(status: string) {
    setActionError(null);
    try {
      await update.mutateAsync({ status });
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Update failed.");
    }
  }

  async function doCancel() {
    setActionError(null);
    try {
      await cancel.mutateAsync(cancelReason.trim() || "Cancelled");
      setCancelOpen(false);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Cancellation failed.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError || !appt) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-base font-semibold text-gray-900">Appointment not found</p>
          <Button variant="outline" onClick={() => router.push("/appointments")}>
            Back to Appointments
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isCancelled = appt.status === "CANCELLED";
  const isCompleted = appt.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/appointments")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`${appt.patient.forename} ${appt.patient.surname}`}
          description={`${appt.patient.refNo} · ${formatTypeName(appt.type)}`}
          actions={
            <Badge variant={STATUS_VARIANTS[appt.status] ?? "neutral"}>
              {appt.status.replace(/_/g, " ")}
            </Badge>
          }
        />
      </div>

      {actionError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Detail icon={<CalendarDays className="h-4 w-4" />} label="Start">
            {formatDateTime(appt.startTime)}
          </Detail>
          <Detail icon={<Clock className="h-4 w-4" />} label="Duration">
            {appt.duration} minutes
          </Detail>
          <Detail icon={<User className="h-4 w-4" />} label="Optometrist">
            {appt.optometrist?.name ?? "Unassigned"}
          </Detail>
          <Detail icon={<MapPin className="h-4 w-4" />} label="Room">
            {appt.room?.name ?? "No room"}
          </Detail>
          {appt.reason ? (
            <Detail icon={<FileText className="h-4 w-4" />} label="Reason">
              {appt.reason}
            </Detail>
          ) : null}
          {appt.notes ? (
            <Detail icon={<FileText className="h-4 w-4" />} label="Notes">
              {appt.notes}
            </Detail>
          ) : null}
          {appt.cancelReason ? (
            <Detail icon={<FileText className="h-4 w-4" />} label="Cancellation reason">
              {appt.cancelReason}
            </Detail>
          ) : null}
        </CardContent>
      </Card>

      {!isCancelled && !isCompleted ? (
        <Can permission="appointments:update">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {appt.status === "SCHEDULED" ? (
                <Button onClick={() => setStatus("CONFIRMED")} isLoading={update.isPending}>
                  Confirm
                </Button>
              ) : null}
              {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") ? (
                <Button variant="secondary" onClick={() => setStatus("IN_PROGRESS")} isLoading={update.isPending}>
                  Start
                </Button>
              ) : null}
              {appt.status === "IN_PROGRESS" ? (
                <Button onClick={() => setStatus("COMPLETED")} isLoading={update.isPending}>
                  Complete
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => setStatus("NO_SHOW")} isLoading={update.isPending}>
                Mark No-show
              </Button>
              <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
                Reschedule
              </Button>
              <Can permission="appointments:delete">
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  Cancel
                </Button>
              </Can>
            </CardContent>
          </Card>
        </Can>
      ) : null}

      <RescheduleModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        defaultStart={appt.startTime}
        defaultDuration={appt.duration}
        isPending={update.isPending}
        onSubmit={async (startISO, endISO, duration) => {
          setActionError(null);
          try {
            await update.mutateAsync({ startTime: startISO, endTime: endISO, duration });
            setRescheduleOpen(false);
          } catch (err) {
            setActionError(err instanceof ApiError ? err.message : "Reschedule failed.");
          }
        }}
      />

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel appointment"
        description="This marks the appointment cancelled. It is not deleted."
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancel.isPending}>
              Keep
            </Button>
            <Button variant="danger" onClick={doCancel} isLoading={cancel.isPending}>
              Cancel appointment
            </Button>
          </>
        }
      >
        <Label htmlFor="cancel-reason">Reason</Label>
        <Textarea
          id="cancel-reason"
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="e.g. Patient requested cancellation"
        />
      </Modal>
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-gray-400">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{children}</p>
      </div>
    </div>
  );
}

function RescheduleModal({
  open,
  onClose,
  defaultStart,
  defaultDuration,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultStart: string;
  defaultDuration: number;
  isPending: boolean;
  onSubmit: (startISO: string, endISO: string, duration: number) => void;
}) {
  const start = new Date(defaultStart);
  const [date, setDate] = useState(start.toISOString().split("T")[0]);
  const [time, setTime] = useState(
    `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
  );
  const [duration, setDuration] = useState(defaultDuration);

  function submit() {
    const s = new Date(`${date}T${time}:00`);
    if (Number.isNaN(s.getTime())) return;
    const e = new Date(s.getTime() + duration * 60_000);
    onSubmit(s.toISOString(), e.toISOString(), duration);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule appointment"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="rs-date">Date</Label>
          <Input id="rs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="rs-time">Time</Label>
          <Input id="rs-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="rs-duration">Duration</Label>
          <Select
            id="rs-duration"
            value={String(duration)}
            onChange={(e) => setDuration(Number(e.target.value))}
            options={DURATIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
          />
        </div>
      </div>
    </Modal>
  );
}