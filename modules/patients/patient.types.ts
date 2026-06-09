// ============================================================
// VISION ERP - Patient Module Types & Validation
// modules/patients/patient.types.ts
// ============================================================

import { z } from "zod";
import { Title, Sex, ContactPref } from "@prisma/client";

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const CreatePatientSchema = z.object({
  title: z.nativeEnum(Title).default(Title.MR),
  forename: z.string().min(1, "Forename is required").max(100),
  initial: z.string().max(5).optional().nullable(),
  surname: z.string().min(1, "Surname is required").max(100),
  dob: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date of birth",
  }),
  sex: z.nativeEnum(Sex),
  address1: z.string().min(1, "Address is required").max(200),
  address2: z.string().max(200).optional().nullable(),
  town: z.string().min(1, "Town/City is required").max(100),
  county: z.string().max(100).optional().nullable(),
  postcode: z.string().min(1, "Postcode is required").max(20),
  homePhone: z.string().max(20).optional().nullable(),
  workPhone: z.string().max(20).optional().nullable(),
  mobile: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  occupation: z.string().max(100).optional().nullable(),
  nhsNumber: z.string().max(20).optional().nullable(),
  gpName: z.string().max(100).optional().nullable(),
  gpAddress: z.string().max(300).optional().nullable(),
  isKeyPatient: z.boolean().default(false),
  isStaffRelative: z.boolean().default(false),
  isMemberOfStaff: z.boolean().default(false),
  marketingOptIn: z.boolean().default(true),
  contactPref: z.array(z.nativeEnum(ContactPref)).default([]),
  notes: z.string().max(2000).optional().nullable(),
  previousEyeTest: z.string().optional().nullable(),
  practiceId: z.string().min(1, "Practice is required"),
});

export const UpdatePatientSchema = CreatePatientSchema.partial().omit({
  practiceId: true,
});

export const QuickRegisterSchema = z.object({
  forename: z.string().min(1, "Forename is required").max(100),
  surname: z.string().min(1, "Surname is required").max(100),
  dob: z.string().refine((v) => !isNaN(Date.parse(v)), {
    message: "Invalid date of birth",
  }),
  sex: z.nativeEnum(Sex),
  mobile: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  postcode: z.string().min(1, "Postcode is required").max(20),
  practiceId: z.string().min(1, "Practice is required"),
});

export const PatientSearchSchema = z.object({
  search: z.string().optional(),
  surname: z.string().optional(),
  forename: z.string().optional(),
  dob: z.string().optional(),
  postcode: z.string().optional(),
  refNo: z.string().optional(),
  phone: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default("surname"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ============================================================
// INFERRED TYPES
// ============================================================

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;
export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;
export type QuickRegisterInput = z.infer<typeof QuickRegisterSchema>;
export type PatientSearchInput = z.infer<typeof PatientSearchSchema>;