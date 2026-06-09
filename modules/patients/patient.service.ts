// ============================================================
// VISION ERP - Patient Service (Business Logic Layer)
// modules/patients/patient.service.ts
// ============================================================

import { patientRepository } from "./patient.repository";
import {
  CreatePatientInput,
  UpdatePatientInput,
  QuickRegisterInput,
  PatientSearchInput,
} from "./patient.types";
import { buildPaginationMeta, generateRefNo } from "@/lib/utils";

// ============================================================
// PATIENT SERVICE
// ============================================================

export const patientService = {
  // ─── Search patients ──────────────────────────────────────
  async search(params: PatientSearchInput, practiceId: string) {
    const { patients, total } = await patientRepository.findMany(
      params,
      practiceId
    );

    const meta = buildPaginationMeta(params.page, params.pageSize, total);

    return { patients, meta };
  },

  // ─── Get patient by ID ────────────────────────────────────
  async getById(id: string, practiceId: string) {
    const patient = await patientRepository.findById(id, practiceId);
    if (!patient) {
      throw new Error("PATIENT_NOT_FOUND");
    }
    return patient;
  },

  // ─── Create full patient ─────────────────────────────────
  async create(input: CreatePatientInput, createdById: string) {
    // Check for duplicates
    const duplicate = await patientRepository.checkDuplicate(
      input.forename,
      input.surname,
      new Date(input.dob),
      input.practiceId
    );

    if (duplicate) {
      return {
        patient: null,
        duplicate,
        isDuplicate: true,
      };
    }

    // Generate reference number
    const count = await patientRepository.countByPractice(input.practiceId);
    const refNo = generateRefNo("P", count);

    const patient = await patientRepository.create({
      refNo,
      title: input.title,
      forename: input.forename,
      initial: input.initial,
      surname: input.surname,
      dob: new Date(input.dob),
      sex: input.sex,
      address1: input.address1,
      address2: input.address2,
      town: input.town,
      county: input.county,
      postcode: input.postcode.toUpperCase().trim(),
      homePhone: input.homePhone,
      workPhone: input.workPhone,
      mobile: input.mobile,
      email: input.email?.toLowerCase().trim() || null,
      occupation: input.occupation,
      nhsNumber: input.nhsNumber,
      gpName: input.gpName,
      gpAddress: input.gpAddress,
      isKeyPatient: input.isKeyPatient,
      isStaffRelative: input.isStaffRelative,
      isMemberOfStaff: input.isMemberOfStaff,
      marketingOptIn: input.marketingOptIn,
      contactPref: input.contactPref,
      notes: input.notes,
      previousEyeTest: input.previousEyeTest
        ? new Date(input.previousEyeTest)
        : null,
      practice: { connect: { id: input.practiceId } },
      createdBy: { connect: { id: createdById } },
    });

    return { patient, duplicate: null, isDuplicate: false };
  },

  // ─── Quick register ───────────────────────────────────────
  async quickRegister(input: QuickRegisterInput, createdById: string) {
    // Check for duplicates
    const duplicate = await patientRepository.checkDuplicate(
      input.forename,
      input.surname,
      new Date(input.dob),
      input.practiceId
    );

    if (duplicate) {
      return { patient: null, duplicate, isDuplicate: true };
    }

    const count = await patientRepository.countByPractice(input.practiceId);
    const refNo = generateRefNo("P", count);

    const patient = await patientRepository.create({
      refNo,
      title: "MR",
      forename: input.forename,
      surname: input.surname,
      dob: new Date(input.dob),
      sex: input.sex,
      address1: "TBC",
      town: "TBC",
      postcode: input.postcode.toUpperCase().trim(),
      mobile: input.mobile,
      email: input.email?.toLowerCase().trim() || null,
      practice: { connect: { id: input.practiceId } },
      createdBy: { connect: { id: createdById } },
    });

    return { patient, duplicate: null, isDuplicate: false };
  },

  // ─── Update patient ───────────────────────────────────────
  async update(id: string, input: UpdatePatientInput, practiceId: string) {
    const existing = await patientRepository.findById(id, practiceId);
    if (!existing) {
      throw new Error("PATIENT_NOT_FOUND");
    }

    // Duplicate check on update
    if (input.forename || input.surname || input.dob) {
      const duplicate = await patientRepository.checkDuplicate(
        input.forename ?? existing.forename,
        input.surname ?? existing.surname,
        input.dob ? new Date(input.dob) : existing.dob,
        practiceId,
        id
      );

      if (duplicate) {
        return { patient: null, duplicate, isDuplicate: true };
      }
    }

    const patient = await patientRepository.update(id, {
      ...input,
      dob: input.dob ? new Date(input.dob) : undefined,
      previousEyeTest: input.previousEyeTest
        ? new Date(input.previousEyeTest)
        : undefined,
      postcode: input.postcode?.toUpperCase().trim(),
      email: input.email?.toLowerCase().trim() || undefined,
    });

    return { patient, duplicate: null, isDuplicate: false };
  },

  // ─── Soft delete ─────────────────────────────────────────
  async delete(id: string, practiceId: string) {
    const existing = await patientRepository.findById(id, practiceId);
    if (!existing) {
      throw new Error("PATIENT_NOT_FOUND");
    }
    await patientRepository.softDelete(id);
  },

  // ─── Get full patient profile ─────────────────────────────
  async getProfile(id: string, practiceId: string) {
    const [patient, prescriptions, clinicalHistory, orders] = await Promise.all([
      patientRepository.findById(id, practiceId),
      patientRepository.getPrescriptions(id),
      patientRepository.getClinicalHistory(id),
      patientRepository.getOrders(id),
    ]);

    if (!patient) {
      throw new Error("PATIENT_NOT_FOUND");
    }

    return { patient, prescriptions, clinicalHistory, orders };
  },
};