// ============================================================
// VISION ERP - Patient domain types (client)
// types/patient.ts
// ------------------------------------------------------------
// Mirrors prisma Patient + the select shapes returned by
// patient.repository / patient.service.
// ============================================================

export type Title = "MR" | "MRS" | "MS" | "MISS" | "DR" | "PROF" | "REV" | "OTHER";
export type Sex = "MALE" | "FEMALE" | "OTHER";
export type ContactPref = "PHONE" | "POST" | "SMS" | "EMAIL";

export interface Patient {
  id: string;
  refNo: string;
  title: Title;
  forename: string;
  initial: string | null;
  surname: string;
  dob: string;
  sex: Sex;
  address1: string;
  address2: string | null;
  town: string;
  county: string | null;
  postcode: string;
  homePhone: string | null;
  workPhone: string | null;
  mobile: string | null;
  email: string | null;
  occupation: string | null;
  nhsNumber: string | null;
  gpName: string | null;
  gpAddress: string | null;
  isKeyPatient: boolean;
  isStaffRelative: boolean;
  isMemberOfStaff: boolean;
  isActive: boolean;
  isDeceased: boolean;
  marketingOptIn: boolean;
  contactPref: ContactPref[];
  notes: string | null;
  practiceId: string;
  createdById: string | null;
  previousEyeTest: string | null;
  createdAt: string;
  updatedAt: string;

  // Optional relations returned by findById (patientWithRelations).
  prescriptions?: PatientPrescription[];
  recalls?: PatientRecall[];
  appointments?: PatientAppointment[];
}

export interface PatientPrescription {
  id: string;
  examinedAt: string;
  rSphere: number | null;
  rCylinder: number | null;
  rAxis: number | null;
  lSphere: number | null;
  lCylinder: number | null;
  lAxis: number | null;
  isFinal: boolean;
}

export interface PatientRecall {
  id: string;
  type: string;
  status: string;
  dueDate: string;
}

export interface PatientAppointment {
  id: string;
  type: string;
  status: string;
  startTime: string;
}

export interface PatientListItem extends Patient {}

export interface PatientSearchParams {
  search?: string;
  surname?: string;
  forename?: string;
  dob?: string;
  postcode?: string;
  refNo?: string;
  phone?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreatePatientInput {
  title: Title;
  forename: string;
  initial?: string | null;
  surname: string;
  dob: string;
  sex: Sex;
  address1: string;
  address2?: string | null;
  town: string;
  county?: string | null;
  postcode: string;
  homePhone?: string | null;
  workPhone?: string | null;
  mobile?: string | null;
  email?: string | null;
  occupation?: string | null;
  nhsNumber?: string | null;
  gpName?: string | null;
  gpAddress?: string | null;
  isKeyPatient: boolean;
  isStaffRelative: boolean;
  isMemberOfStaff: boolean;
  marketingOptIn: boolean;
  contactPref: ContactPref[];
  notes?: string | null;
  previousEyeTest?: string | null;
}

export type UpdatePatientInput = Partial<CreatePatientInput>;

export interface QuickRegisterInput {
  forename: string;
  surname: string;
  dob: string;
  sex: Sex;
  mobile?: string | null;
  email?: string | null;
  postcode: string;
}