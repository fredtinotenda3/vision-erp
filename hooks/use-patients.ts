// ============================================================
// VISION ERP - Patients Query Hooks
// hooks/use-patients.ts
// ============================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/store/ui.store";
import type { Patient, PatientSearchParams, QuickRegisterInput } from "@/types/patient";
import type { ApiResult } from "@/lib/api-client";
import type { PaginationMeta } from "@/types";

// ── Types ─────────────────────────────────────────────────

interface PatientListResponse {
  data: Patient[];
  meta: PaginationMeta;
}

// ── Query keys ────────────────────────────────────────────

export const patientKeys = {
  all: ["patients"] as const,
  lists: () => [...patientKeys.all, "list"] as const,
  list: (params: PatientSearchParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, "detail"] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
};

// ── List / search ─────────────────────────────────────────

export function usePatients(params: PatientSearchParams) {
  return useQuery<PatientListResponse>({
    queryKey: patientKeys.list(params),
    queryFn: async () => {
      const res = await apiClient.get<Patient[]>("/api/patients", {
        search: params.search,
        page: params.page,
        pageSize: params.pageSize,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        surname: params.surname,
        forename: params.forename,
        dob: params.dob,
        postcode: params.postcode,
        refNo: params.refNo,
        phone: params.phone,
      });
      return { data: res.data, meta: res.meta! };
    },
    placeholderData: (prev) => prev,
  });
}

// ── Single patient ────────────────────────────────────────

export function usePatient(id: string) {
  return useQuery<Patient>({
    queryKey: patientKeys.detail(id),
    queryFn: async () => {
      const res = await apiClient.get<Patient>(`/api/patients/${id}`);
      return res.data;
    },
    enabled: !!id,
    retry: false,
  });
}

// ── Create ────────────────────────────────────────────────

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, Record<string, unknown>>({
    mutationFn: async (data) => {
      const res = await apiClient.post<Patient>("/api/patients", data);
      return res.data;
    },
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success("Patient created", `${patient.forename} ${patient.surname} (${patient.refNo})`);
    },
    onError: (err) => {
      toast.error("Failed to create patient", err.message);
    },
  });
}

// ── Update ────────────────────────────────────────────────

export function useUpdatePatient(id: string) {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, Record<string, unknown>>({
    mutationFn: async (data) => {
      const res = await apiClient.patch<Patient>(`/api/patients/${id}`, data);
      return res.data;
    },
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.setQueryData(patientKeys.detail(id), patient);
      toast.success("Patient updated", `${patient.forename} ${patient.surname} saved.`);
    },
    onError: (err) => {
      toast.error("Failed to update patient", err.message);
    },
  });
}

// ── Quick register ────────────────────────────────────────

export function useQuickRegister() {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, Record<string, unknown>>({
    mutationFn: async (data) => {
      const res = await apiClient.post<Patient>("/api/patients/quick-register", data);
      return res.data;
    },
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      toast.success("Patient registered", `${patient.forename} ${patient.surname} (${patient.refNo})`);
    },
    onError: (err) => {
      toast.error("Registration failed", err.message);
    },
  });
}

// ── Archive (soft-delete) ─────────────────────────────────

export function useArchivePatient(id: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: async () => {
      await apiClient.delete(`/api/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() });
      queryClient.removeQueries({ queryKey: patientKeys.detail(id) });
      toast.success("Patient archived");
    },
    onError: (err) => {
      toast.error("Failed to archive patient", err.message);
    },
  });
}