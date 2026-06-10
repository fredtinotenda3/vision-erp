// ============================================================
// VISION ERP - Patient client validation (Zod)
// modules/patients/patient.schema.ts
// ------------------------------------------------------------
// Mirrors CreatePatientSchema / QuickRegisterSchema from the
// backend, but OMITS practiceId — the API injects it from the
// auth context (ctx.practiceId). The client must never send it.
// ============================================================

import { z } from "zod";

const TITLES = ["MR", "MRS", "MS", "MISS", "DR", "PROF", "REV", "OTHER"] as const;
const SEXES = ["MALE", "FEMALE", "OTHER"] as const;
const CONTACT_PREFS = ["PHONE", "POST", "SMS", "EMAIL"] as const;

const emailField = z
  .string()
  .email("Invalid email")
  .optional()
  .or(z.literal(""));

export const PatientFormSchema = z.object({
  title: z.enum(TITLES).default("MR"),
  forename: z.string().min(1, "Forename is required").max(100),
  initial: z.string().max(5).optional().or(z.literal("")),
  surname: z.string().min(1, "Surname is required").max(100),
  dob: z.string().refine((v) => !!v && !isNaN(Date.parse(v)), {
    message: "Date of birth is required",
  }),
  sex: z.enum(SEXES, { message: "Sex is required" }),
  address1: z.string().min(1, "Address is required").max(200),
  address2: z.string().max(200).optional().or(z.literal("")),
  town: z.string().min(1, "Town/City is required").max(100),
  county: z.string().max(100).optional().or(z.literal("")),
  postcode: z.string().min(1, "Postcode is required").max(20),
  homePhone: z.string().max(20).optional().or(z.literal("")),
  workPhone: z.string().max(20).optional().or(z.literal("")),
  mobile: z.string().max(20).optional().or(z.literal("")),
  email: emailField,
  occupation: z.string().max(100).optional().or(z.literal("")),
  nhsNumber: z.string().max(20).optional().or(z.literal("")),
  gpName: z.string().max(100).optional().or(z.literal("")),
  gpAddress: z.string().max(300).optional().or(z.literal("")),
  isKeyPatient: z.boolean().default(false),
  isStaffRelative: z.boolean().default(false),
  isMemberOfStaff: z.boolean().default(false),
  marketingOptIn: z.boolean().default(true),
  contactPref: z.array(z.enum(CONTACT_PREFS)).default([]),
  notes: z.string().max(2000).optional().or(z.literal("")),
  previousEyeTest: z.string().optional().or(z.literal("")),
});

export const QuickRegisterFormSchema = z.object({
  forename: z.string().min(1, "Forename is required").max(100),
  surname: z.string().min(1, "Surname is required").max(100),
  dob: z.string().refine((v) => !!v && !isNaN(Date.parse(v)), {
    message: "Date of birth is required",
  }),
  sex: z.enum(SEXES, { message: "Sex is required" }),
  mobile: z.string().max(20).optional().or(z.literal("")),
  email: emailField,
  postcode: z.string().min(1, "Postcode is required").max(20),
});

export type PatientFormValues = z.infer<typeof PatientFormSchema>;
export type QuickRegisterFormValues = z.infer<typeof QuickRegisterFormSchema>;

export const TITLE_OPTIONS = TITLES.map((t) => ({ value: t, label: t }));
export const SEX_OPTIONS = SEXES.map((s) => ({
  value: s,
  label: s.charAt(0) + s.slice(1).toLowerCase(),
}));
export const CONTACT_PREF_OPTIONS = CONTACT_PREFS.map((c) => ({
  value: c,
  label: c.charAt(0) + c.slice(1).toLowerCase(),
}));

/**
 * Normalises form values into the API payload:
 * empty strings -> null/undefined where the backend expects optionals.
 */
export function toCreatePayload(values: PatientFormValues) {
  const clean = (v?: string | null) => {
    const t = (v ?? "").trim();
    return t.length ? t : null;
  };
  return {
    title: values.title,
    forename: values.forename.trim(),
    initial: clean(values.initial),
    surname: values.surname.trim(),
    dob: values.dob,
    sex: values.sex,
    address1: values.address1.trim(),
    address2: clean(values.address2),
    town: values.town.trim(),
    county: clean(values.county),
    postcode: values.postcode.trim().toUpperCase(),
    homePhone: clean(values.homePhone),
    workPhone: clean(values.workPhone),
    mobile: clean(values.mobile),
    email: clean(values.email),
    occupation: clean(values.occupation),
    nhsNumber: clean(values.nhsNumber),
    gpName: clean(values.gpName),
    gpAddress: clean(values.gpAddress),
    isKeyPatient: values.isKeyPatient,
    isStaffRelative: values.isStaffRelative,
    isMemberOfStaff: values.isMemberOfStaff,
    marketingOptIn: values.marketingOptIn,
    contactPref: values.contactPref,
    notes: clean(values.notes),
    previousEyeTest: clean(values.previousEyeTest),
  };
}

export function toQuickRegisterPayload(values: QuickRegisterFormValues) {
  const clean = (v?: string | null) => {
    const t = (v ?? "").trim();
    return t.length ? t : null;
  };
  return {
    forename: values.forename.trim(),
    surname: values.surname.trim(),
    dob: values.dob,
    sex: values.sex,
    mobile: clean(values.mobile),
    email: clean(values.email),
    postcode: values.postcode.trim().toUpperCase(),
  };
}