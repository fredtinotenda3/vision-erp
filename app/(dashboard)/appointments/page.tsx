// path: app/(dashboard)/appointments/page.tsx
// ============================================================
// VISION ERP - Appointments Page
// app/(dashboard)/appointments/page.tsx
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  User,
  Filter,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Can } from "@/components/rbac/can";
import { useCalendarAppointments, type Appointment } from "@/hooks/use-appointments";
import { cn } from "@/lib/cn";
import BookAppointmentDialog from "@/modules/appointments/book-appointment-dialog";

// -- Constants ------------------------------------------------

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

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "neutral">= {
  SCHEDULED: "warning",
  CONFIRMED: "success",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  MISSED: "neutral",
  NO_SHOW: "neutral",
  RESCHEDULED: "neutral",
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-amber-100 border-amber-300 text-amber-900",
  CONFIRMED: "bg-green-100 border-green-300 text-green-900",
  IN_PROGRESS: "bg-blue-100 border-blue-300 text-blue-900",
  COMPLETED: "bg-emerald-100 border-emerald-300 text-emerald-900",
  CANCELLED: "bg-red-100 border-red-300 text-red-900",
  MISSED: "bg-gray-100 border-gray-300 text-gray-600",
  NO_SHOW: "bg-gray-100 border-gray-300 text-gray-600",
};

// -- Helpers --------------------------------------------------

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function formatTimeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTypeName(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// -- Appointment card -----------------------------------------

function AppointmentCard({
  appt,
  onClick,
}: {
  appt: Appointment;
  onClick: () => void;
}) {
  const colorClass = STATUS_COLORS[appt.status] ?? "bg-gray-100 border-gray-200 text-gray-800";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-xl border px-4 py-3 transition-all hover:shadow-md hover:-translate-y-0.5",
        colorClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {appt.patient.forename} {appt.patient.surname}
          </p>
          <p className="text-xs mt-0.5 opacity-70">{appt.patient.refNo}</p>
        </div>
        <Badge
          variant={STATUS_VARIANTS[appt.status] ?? "neutral"}
          className="text-xs shrink-0"
        >
          {appt.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs opacity-70">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTimeOnly(appt.startTime)} · {appt.duration}m
        </span>
        {appt.optometrist && (
          <span className="flex items-center gap-1 truncate">
            <User className="h-3 w-3" />
            {appt.optometrist.name.split(" ").pop()}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs opacity-60">{formatTypeName(appt.type)}</p>

      {appt.room && (
        <div
          className="absolute right-3 bottom-3 h-2 w-2 rounded-full"
          style={{ backgroundColor: appt.room.color }}
          title={appt.room.name}
        />
      )}
    </div>
  );
}

// -- Day column (week view) -----------------------------------

function DayColumn({
  date,
  appointments,
  isToday,
  onAppointmentClick,
}: {
  date: Date;
  appointments: Appointment[];
  isToday: boolean;
  onAppointmentClick: (id: string) => void;
}) {
  const dayLabel = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "py-3 text-center text-sm font-medium border-b border-gray-200",
          isToday ? "text-[#1E3A8A] bg-[#EFF6FF] rounded-t-lg" : "text-gray-600"
        )}
      >
        {dayLabel}
        {appointments.length > 0 && (
          <span
            className={cn(
              "ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold",
              isToday
                ? "bg-[#1E3A8A] text-white"
                : "bg-gray-200 text-gray-700"
            )}
          >
            {appointments.length}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-2 p-2 min-h-[200px]">
        {appointments
          .slice()
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          )
          .map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              onClick={() => onAppointmentClick(appt.id)}
            />
          ))}
        {appointments.length === 0 && (
          <p className="text-xs text-gray-400 text-center pt-8">No appointments</p>
        )}
      </div>
    </div>
  );
}

// -- Main page ------------------------------------------------

export default function AppointmentsPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [bookOpen, setBookOpen] = useState(false);

  // Week boundaries
  const weekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const todayStr = toDateStr(new Date());
  const from = viewMode === "week" ? toDateStr(weekStart) : toDateStr(currentDate);
  const to = viewMode === "week" ? toDateStr(weekEnd) : toDateStr(currentDate);

  // Fetch via the dedicated calendar endpoint (date-range, not paginated).
  const { data, isLoading, isError } = useCalendarAppointments({
    from,
    to,
    status: filterStatus || undefined,
    type: filterType || undefined,
  });

  const appointments = data?.data ?? [];

  // Group by date
  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const appt of appointments) {
      const key = toDateStr(new Date(appt.startTime));
      (map[key] ??= []).push(appt);
    }
    return map;
  }, [appointments]);

  function navigate(delta: number) {
    setCurrentDate((d) => addDays(d, viewMode === "week" ? delta * 7 : delta));
  }

  const navLabel =
    viewMode === "week"
      ? `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
      : currentDate.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });

  // Stats
  const stats = useMemo(() => ({
    total: appointments.length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    pending: appointments.filter(
      (a) => a.status === "SCHEDULED" || a.status === "CONFIRMED"
    ).length,
  }), [appointments]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Appointments"
          description="Schedule and manage patient appointments"
          actions={
            <Can permission="appointments:create">
              <Button onClick={() => setBookOpen(true)}>
                <Plus className="h-4 w-4" />
                Book Appointment
              </Button>
            </Can>
          }
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "This period", value: stats.total, color: "text-gray-900" },
            { label: "Pending", value: stats.pending, color: "text-amber-600" },
            { label: "Completed", value: stats.completed, color: "text-green-600" },
            { label: "Cancelled", value: stats.cancelled, color: "text-red-500" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4 px-5">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setViewMode("day")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors",
                viewMode === "day"
                  ? "bg-[#1E3A8A] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <LayoutList className="h-4 w-4" />
              Day
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200",
                viewMode === "week"
                  ? "bg-[#1E3A8A] text-white"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Week
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Today
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="px-3 py-2 text-sm font-semibold text-gray-800">
              {navLabel}
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All statuses</option>
              {[
                "SCHEDULED",
                "CONFIRMED",
                "IN_PROGRESS",
                "COMPLETED",
                "CANCELLED",
                "MISSED",
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="">All types</option>
              {APPOINTMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {formatTypeName(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar body */}
        {isLoading ? (
          <div
            className={cn(
              "grid gap-4",
              viewMode === "week" ? "grid-cols-7" : "grid-cols-1"
            )}
          >
            {Array.from({ length: viewMode === "week" ? 7 : 1 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-red-600">
              Failed to load appointments. Please refresh.
            </CardContent>
          </Card>
        ) : viewMode === "week" ? (
          <div className="grid grid-cols-7 gap-2 rounded-xl border border-gray-200 bg-white overflow-hidden">
            {weekDays.map((day) => {
              const key = toDateStr(day);
              return (
                <DayColumn
                  key={key}
                  date={day}
                  appointments={byDate[key] ?? []}
                  isToday={key === todayStr}
                  onAppointmentClick={(id) => router.push(`/appointments/${id}`)}
                />
              );
            })}
          </div>
        ) : (
          /* Day view - list */
          <Card>
            <CardContent className="p-5">
              {(byDate[toDateStr(currentDate)] ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(byDate[toDateStr(currentDate)] ?? [])
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    )
                    .map((appt) => (
                      <AppointmentCard
                        key={appt.id}
                        appt={appt}
                        onClick={() => router.push(`/appointments/${appt.id}`)}
                      />
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <Calendar className="h-10 w-10 text-gray-200" />
                  <p className="text-sm text-gray-500">No appointments for this day</p>
                  <Can permission="appointments:create">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBookOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Book Appointment
                    </Button>
                  </Can>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Book dialog */}
      <BookAppointmentDialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        defaultDate={toDateStr(currentDate)}
        onBooked={(id) => router.push(`/appointments/${id}`)}
      />
    </>
  );
}