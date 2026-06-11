// path: hooks/use-appointments.ts
// ============================================================
// VISION ERP - Appointment data hooks
// hooks/use-appointments.ts
// ============================================================

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

// ── Wire types (mirror appointmentSelect; dates serialise to strings) ──

export interface Appointment {
  id: string;
  patientId: string;
  practiceId: string;
  optometristId: string | null;
  roomId: string | null;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes: string | null;
  reason: string | null;
  isNew: boolean;
  reminderSent: boolean;
  reminderSentAt: string | null;
  arrivalTime: string | null;
  completedAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    refNo: string;
    forename: string;
    surname: string;
    mobile: string | null;
    dob: string;
  };
  optometrist: { id: string; name: string; email: string } | null;
  room: { id: string; name: string; color: string } | null;
}

export interface CalendarParams {
  from: string;
  to: string;
  status?: string;
  type?: string;
  optometristId?: string;
  roomId?: string;
}

export interface CreateAppointmentBody {
  patientId: string;
  optometristId?: string | null;
  roomId?: string | null;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  reason?: string | null;
  notes?: string | null;
  isNew?: boolean;
}

export type UpdateAppointmentBody = Partial<{
  optometristId: string | null;
  roomId: string | null;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  notes: string | null;
  reason: string | null;
  cancelReason: string | null;
  arrivalTime: string | null;
}>;

export interface OptometristOption {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface RoomOption {
  id: string;
  name: string;
  color: string;
}

const KEY = "appointments";

// ── Queries ──────────────────────────────────────────────

export function useCalendarAppointments(params: CalendarParams) {
  return useQuery({
    queryKey: [KEY, "calendar", params],
    queryFn: () =>
      apiClient.get<Appointment[]>("/api/appointments/calendar", {
        from: params.from,
        to: params.to,
        status: params.status,
        type: params.type,
        optometristId: params.optometristId,
        roomId: params.roomId,
      }),
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => apiClient.get<Appointment>(`/api/appointments/${id}`),
    enabled: !!id,
  });
}

export function useOptometrists() {
  return useQuery({
    queryKey: ["staff", "optometrists"],
    queryFn: () =>
      apiClient.get<OptometristOption[]>("/api/staff", {
        role: "OPTOMETRIST",
        isActive: true,
        pageSize: 100,
      }),
    staleTime: 5 * 60_000,
  });
}

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: () => apiClient.get<RoomOption[]>("/api/rooms"),
    staleTime: 5 * 60_000,
  });
}

// ── Mutations ────────────────────────────────────────────

function useInvalidateAppointments() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useBookAppointment() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (body: CreateAppointmentBody) =>
      apiClient.post<Appointment>("/api/appointments", body).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useUpdateAppointment(id: string) {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (body: UpdateAppointmentBody) =>
      apiClient.patch<Appointment>(`/api/appointments/${id}`, body).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useCancelAppointment(id: string) {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: (reason: string) =>
      apiClient
        .patch<Appointment>(`/api/appointments/${id}`, {
          status: "CANCELLED",
          cancelReason: reason,
        })
        .then((r) => r.data),
    onSuccess: invalidate,
  });
}