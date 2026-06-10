// ============================================================
// VISION ERP - Patient API service
// services/patient.service.ts
// ============================================================

import { apiClient, type ApiResult } from "@/lib/api-client";
import type {
  Patient,
  PatientListItem,
  PatientSearchParams,
  CreatePatientInput,
  UpdatePatientInput,
  QuickRegisterInput,
} from "@/types/patient";

const BASE = "/api/patients";

export const patientService = {
  async list(params: PatientSearchParams): Promise<ApiResult<PatientListItem[]>> {
    return apiClient.get<PatientListItem[]>(BASE, {
      search: params.search,
      surname: params.surname,
      forename: params.forename,
      dob: params.dob,
      postcode: params.postcode,
      refNo: params.refNo,
      phone: params.phone,
      page: params.page,
      pageSize: params.pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
  },

  async getById(id: string): Promise<Patient> {
    const { data } = await apiClient.get<Patient>(`${BASE}/${id}`);
    return data;
  },

  async create(input: CreatePatientInput): Promise<Patient> {
    const { data } = await apiClient.post<Patient>(BASE, input);
    return data;
  },

  async quickRegister(input: QuickRegisterInput): Promise<Patient> {
    const { data } = await apiClient.post<Patient>(`${BASE}/quick-register`, input);
    return data;
  },

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const { data } = await apiClient.patch<Patient>(`${BASE}/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },
};