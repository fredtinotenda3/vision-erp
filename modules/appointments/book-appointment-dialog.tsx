// path: modules/appointments/book-appointment-dialog.tsx
// ============================================================
// VISION ERP - Book Appointment dialog
// modules/appointments/book-appointment-dialog.tsx
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { usePatients } from "@/hooks/use-patients";
import {
  useBookAppointment,
  useOptometrists,
  useRooms,
} from "@/hooks/use-appointments";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";

const APPOINTMENT_TYPES = [
  "EYE_EXAM",
  "CONTACT_LENS_EXAM",
  "FOLLOW_UP",
  "COLLECTION",
  "REPAIR",
  "EMERGENCY",
  "RECALL",
  "OTHER",
];

const DURATIONS = [10, 15, 20, 30, 45, 60, 90];

function formatTypeName(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface BookAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  defaultDate: string; // yyyy-mm-dd
  onBooked?: (id: string) => void;
}

export default function BookAppointmentDialog({
  open,
  onClose,
  defaultDate,
  onBooked,
}: BookAppointmentDialogProps) {
  const [patientId, setPatientId] = useState<string>("");
  const [patientLabel, setPatientLabel] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const debounced = useDebounce(searchInput, 350);

  const [type, setType] = useState("EYE_EXAM");
  const [optometristId, setOptometristId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const patients = usePatients({ search: debounced || undefined, page: 1, pageSize: 8 });
  const optometrists = useOptometrists();
  const rooms = useRooms();

  const book = useBookAppointment();

  const optometristOptions = useMemo(
    () => [
      { value: "", label: "Unassigned" },
      ...(optometrists.data?.data ?? []).map((o) => ({ value: o.id, label: o.name })),
    ],
    [optometrists.data]
  );

  const roomOptions = useMemo(
    () => [
      { value: "", label: "No room" },
      ...(rooms.data?.data ?? []).map((r) => ({ value: r.id, label: r.name })),
    ],
    [rooms.data]
  );

  function reset() {
    setPatientId("");
    setPatientLabel("");
    setSearchInput("");
    setType("EYE_EXAM");
    setOptometristId("");
    setRoomId("");
    setDate(defaultDate);
    setTime("09:00");
    setDuration(30);
    setReason("");
    setNotes("");
    setFormError(null);
    setFieldErrors({});
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    setFormError(null);
    setFieldErrors({});

    if (!patientId) {
      setFormError("Select a patient to book.");
      return;
    }

    const startTime = new Date(`${date}T${time}:00`);
    if (Number.isNaN(startTime.getTime())) {
      setFormError("Enter a valid date and time.");
      return;
    }
    const endTime = new Date(startTime.getTime() + duration * 60_000);

    try {
      const appt = await book.mutateAsync({
        patientId,
        optometristId: optometristId || null,
        roomId: roomId || null,
        type,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        reason: reason.trim() || null,
        notes: notes.trim() || null,
        isNew: false,
      });
      onBooked?.(appt.id);
      close();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.fieldErrors) setFieldErrors(err.fieldErrors);
        setFormError(err.message);
      } else {
        setFormError("Unable to book appointment. Please try again.");
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Book Appointment"
      description="Search a patient, pick a slot, and assign a clinician or room."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={book.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={book.isPending}>
            Book Appointment
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {formError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </div>
        ) : null}

        {/* Patient selector */}
        <div>
          <Label>Patient *</Label>
          {patientId ? (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-sm font-medium text-gray-900">{patientLabel}</span>
              <button
                type="button"
                className="text-xs font-medium text-[#1E3A8A] hover:underline"
                onClick={() => {
                  setPatientId("");
                  setPatientLabel("");
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, ref, mobile…"
                  className="pl-9"
                />
              </div>
              {debounced ? (
                <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-gray-200">
                  {patients.isLoading ? (
                    <p className="px-3 py-2 text-sm text-gray-400">Searching…</p>
                  ) : (patients.data?.data ?? []).length === 0 ? (
                    <p className="px-3 py-2 text-sm text-gray-400">No patients found</p>
                  ) : (
                    (patients.data?.data ?? []).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPatientId(p.id);
                          setPatientLabel(`${p.surname}, ${p.forename} (${p.refNo})`);
                        }}
                        className={cn(
                          "block w-full px-3 py-2 text-left text-sm hover:bg-gray-50",
                          "border-b border-gray-100 last:border-0"
                        )}
                      >
                        <span className="font-medium text-gray-900">
                          {p.surname}, {p.forename}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">{p.refNo}</span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </>
          )}
          <FieldError message={fieldErrors.patientId?.[0]} />
        </div>

        {/* Slot */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="ba-date">Date *</Label>
            <Input
              id="ba-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ba-time">Time *</Label>
            <Input
              id="ba-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="ba-duration">Duration</Label>
            <Select
              id="ba-duration"
              value={String(duration)}
              onChange={(e) => setDuration(Number(e.target.value))}
              options={DURATIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
            />
          </div>
        </div>

        {/* Type / clinician / room */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="ba-type">Type</Label>
            <Select
              id="ba-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={APPOINTMENT_TYPES.map((t) => ({ value: t, label: formatTypeName(t) }))}
            />
          </div>
          <div>
            <Label htmlFor="ba-optometrist">Optometrist</Label>
            <Select
              id="ba-optometrist"
              value={optometristId}
              onChange={(e) => setOptometristId(e.target.value)}
              options={optometristOptions}
            />
          </div>
          <div>
            <Label htmlFor="ba-room">Room</Label>
            <Select
              id="ba-room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              options={roomOptions}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="ba-reason">Reason</Label>
          <Input
            id="ba-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Blurred vision, routine check"
          />
        </div>

        <div>
          <Label htmlFor="ba-notes">Notes</Label>
          <Textarea
            id="ba-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}