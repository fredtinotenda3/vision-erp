// ============================================================
// VISION ERP - Patient data hooks (TanStack Query)
// hooks/use-patients.ts
// ============================================================

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { patientService } from "@/services/patient.service";
import { ApiError } from "@/lib/api-client";
import { toast } from "@/store/ui.store";
import type {
  PatientSearchParams,
  CreatePatientInput,
  UpdatePatientInput,
  QuickRegisterInput,
} from "@/types/patient";

const KEYS = {
  all: ["patients"] as const,
  list: (params: PatientSearchParams) => ["patients", "list", params] as const,
  detail: (id: string) => ["patients", "detail", id] as const,
};

export function usePatients(params: PatientSearchParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => patientService.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEYS.detail(id) : ["patients", "detail", "none"],
    queryFn: () => patientService.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatientInput) => patientService.create(input),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Patient created", `${patient.forename} ${patient.surname} (${patient.refNo})`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.warning("Possible duplicate", err.message);
      } else {
        toast.error("Could not create patient", err instanceof Error ? err.message : undefined);
      }
    },
  });
}

export function useQuickRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: QuickRegisterInput) => patientService.quickRegister(input),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Patient registered", `${patient.forename} ${patient.surname} (${patient.refNo})`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.warning("Possible duplicate", err.message);
      } else {
        toast.error("Quick register failed", err instanceof Error ? err.message : undefined);
      }
    },
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdatePatientInput) => patientService.update(id, input),
    onSuccess: (patient) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success("Patient updated", `${patient.forename} ${patient.surname}`);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.warning("Possible duplicate", err.message);
      } else {
        toast.error("Could not update patient", err instanceof Error ? err.message : undefined);
      }
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Patient archived");
    },
    onError: (err) => {
      toast.error("Could not archive patient", err instanceof Error ? err.message : undefined);
    },
  });
}