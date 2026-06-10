// ============================================================
// FILE: modules/clinical/clinical.repository.ts
// VISION ERP - Clinical Repository (DB Access Only)
// ============================================================

import db from "@/lib/db";
import { Prisma } from "@prisma/client";

// ─── Select shapes ───────────────────────────────────────────

const clinicalRecordSelect = {
  id: true,
  patientId: true,
  examinedById: true,
  examinedAt: true,
  type: true,
  ocularHistory: true,
  medicalHistory: true,
  familyHistory: true,
  currentMedication: true,
  allergies: true,
  chiefComplaint: true,
  vaDistanceR: true,
  vaDistanceL: true,
  vaDistanceBino: true,
  vaNearR: true,
  vaNearL: true,
  vaNearBino: true,
  coverTest: true,
  motility: true,
  pupils: true,
  subjectiveRx: true,
  objectiveRx: true,
  finalRx: true,
  anteriorSegment: true,
  posteriorSegment: true,
  iopRight: true,
  iopLeft: true,
  iopMethod: true,
  visualFields: true,
  managementPlan: true,
  recallPeriod: true,
  recallReason: true,
  clinicalNotes: true,
  isComplete: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClinicalRecordSelect;

const prescriptionSelect = {
  id: true,
  patientId: true,
  examinedById: true,
  examinedAt: true,
  rSphere: true,
  rCylinder: true,
  rAxis: true,
  rAdd: true,
  rPrism: true,
  rBase: true,
  rVa: true,
  rBvd: true,
  lSphere: true,
  lCylinder: true,
  lAxis: true,
  lAdd: true,
  lPrism: true,
  lBase: true,
  lVa: true,
  lBvd: true,
  ipd: true,
  ipdNear: true,
  notes: true,
  isFinal: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PrescriptionSelect;

const clRxSelect = {
  id: true,
  patientId: true,
  examinedById: true,
  examinedAt: true,
  rBrand: true, rBaseCurve: true, rDiameter: true, rSphere: true,
  rCylinder: true, rAxis: true, rAddition: true, rColour: true, rQuantity: true,
  lBrand: true, lBaseCurve: true, lDiameter: true, lSphere: true,
  lCylinder: true, lAxis: true, lAddition: true, lColour: true, lQuantity: true,
  wearingSchedule: true,
  replacementSchedule: true,
  solution: true,
  notes: true,
  isFinal: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ContactLensRxSelect;

// ============================================================
// CLINICAL REPOSITORY
// ============================================================

export const clinicalRepository = {

  // ─── Clinical Records ────────────────────────────────────

  async findRecordsByPatient(patientId: string) {
    return db.clinicalRecord.findMany({
      where: { patientId },
      select: clinicalRecordSelect,
      orderBy: { examinedAt: "desc" },
    });
  },

  async findRecordById(id: string) {
    return db.clinicalRecord.findUnique({
      where: { id },
      select: clinicalRecordSelect,
    });
  },

  async findRecordByIdAndPatient(id: string, patientId: string) {
    return db.clinicalRecord.findFirst({
      where: { id, patientId },
      select: clinicalRecordSelect,
    });
  },

  async createRecord(data: Prisma.ClinicalRecordCreateInput) {
    return db.clinicalRecord.create({
      data,
      select: clinicalRecordSelect,
    });
  },

  async updateRecord(id: string, data: Prisma.ClinicalRecordUpdateInput) {
    return db.clinicalRecord.update({
      where: { id },
      data,
      select: clinicalRecordSelect,
    });
  },

  async getLatestRecord(patientId: string) {
    return db.clinicalRecord.findFirst({
      where: { patientId, isComplete: true },
      select: clinicalRecordSelect,
      orderBy: { examinedAt: "desc" },
    });
  },

  // ─── Prescriptions ───────────────────────────────────────

  async findPrescriptionsByPatient(patientId: string) {
    return db.prescription.findMany({
      where: { patientId, isActive: true },
      select: prescriptionSelect,
      orderBy: { examinedAt: "desc" },
    });
  },

  async findPrescriptionById(id: string) {
    return db.prescription.findUnique({
      where: { id },
      select: prescriptionSelect,
    });
  },

  async findActivePrescription(patientId: string) {
    return db.prescription.findFirst({
      where: { patientId, isFinal: true, isActive: true },
      select: prescriptionSelect,
      orderBy: { examinedAt: "desc" },
    });
  },

  async deactivatePreviousPrescriptions(patientId: string) {
    return db.prescription.updateMany({
      where: { patientId, isFinal: true, isActive: true },
      data: { isActive: false },
    });
  },

  async createPrescription(data: Prisma.PrescriptionCreateInput) {
    return db.prescription.create({
      data,
      select: prescriptionSelect,
    });
  },

  async updatePrescription(id: string, data: Prisma.PrescriptionUpdateInput) {
    return db.prescription.update({
      where: { id },
      data,
      select: prescriptionSelect,
    });
  },

  // ─── Contact Lens Rx ─────────────────────────────────────

  async findCLRxByPatient(patientId: string) {
    return db.contactLensRx.findMany({
      where: { patientId, isActive: true },
      select: clRxSelect,
      orderBy: { examinedAt: "desc" },
    });
  },

  async findActiveCLRx(patientId: string) {
    return db.contactLensRx.findFirst({
      where: { patientId, isFinal: true, isActive: true },
      select: clRxSelect,
      orderBy: { examinedAt: "desc" },
    });
  },

  async deactivatePreviousCLRx(patientId: string) {
    return db.contactLensRx.updateMany({
      where: { patientId, isFinal: true, isActive: true },
      data: { isActive: false },
    });
  },

  async createCLRx(data: Prisma.ContactLensRxCreateInput) {
    return db.contactLensRx.create({
      data,
      select: clRxSelect,
    });
  },
};