// ============================================================
// VISION ERP - Clinical Module Types
// modules/clinical/clinical.types.ts
// ============================================================

import { z } from "zod";

const RxSchema = z.object({
  sphere: z.number().optional().nullable(),
  cylinder: z.number().optional().nullable(),
  axis: z.number().int().optional().nullable(),
  add: z.number().optional().nullable(),
  prism: z.number().optional().nullable(),
  base: z.string().optional().nullable(),
  va: z.string().optional().nullable(),
  bvd: z.number().optional().nullable(),
}).optional().nullable();

export const CreateClinicalRecordSchema = z.object({
  patientId: z.string().min(1),
  examinedById: z.string().min(1),
  type: z.enum(["EYE_EXAM", "CL_EXAM", "FOLLOW_UP", "OTHER"]).default("EYE_EXAM"),
  examinedAt: z.string().optional(),
  ocularHistory: z.string().max(2000).optional().nullable(),
  medicalHistory: z.string().max(2000).optional().nullable(),
  familyHistory: z.string().max(1000).optional().nullable(),
  currentMedication: z.string().max(1000).optional().nullable(),
  allergies: z.string().max(500).optional().nullable(),
  chiefComplaint: z.string().max(1000).optional().nullable(),
  // VA
  vaDistanceR: z.string().max(20).optional().nullable(),
  vaDistanceL: z.string().max(20).optional().nullable(),
  vaDistanceBino: z.string().max(20).optional().nullable(),
  vaNearR: z.string().max(20).optional().nullable(),
  vaNearL: z.string().max(20).optional().nullable(),
  vaNearBino: z.string().max(20).optional().nullable(),
  coverTest: z.string().max(200).optional().nullable(),
  motility: z.string().max(200).optional().nullable(),
  pupils: z.string().max(200).optional().nullable(),
  // Refraction stored as JSON
  subjectiveRx: z.object({ right: RxSchema, left: RxSchema }).optional().nullable(),
  objectiveRx: z.object({ right: RxSchema, left: RxSchema }).optional().nullable(),
  finalRx: z.object({ right: RxSchema, left: RxSchema }).optional().nullable(),
  // Segments
  anteriorSegment: z.record(z.string(), z.unknown()).optional().nullable(),
  posteriorSegment: z.record(z.string(), z.unknown()).optional().nullable(),
  // IOP
  iopRight: z.number().optional().nullable(),
  iopLeft: z.number().optional().nullable(),
  iopMethod: z.string().max(50).optional().nullable(),
  // Fields
  visualFields: z.record(z.string(), z.unknown()).optional().nullable(),
  // Management
  managementPlan: z.string().max(2000).optional().nullable(),
  recallPeriod: z.number().int().optional().nullable(),
  recallReason: z.string().max(500).optional().nullable(),
  clinicalNotes: z.string().max(3000).optional().nullable(),
  isComplete: z.boolean().default(false),
});

export const CreatePrescriptionSchema = z.object({
  patientId: z.string().min(1),
  examinedById: z.string().optional().nullable(),
  examinedAt: z.string().optional(),
  rSphere: z.number().optional().nullable(),
  rCylinder: z.number().optional().nullable(),
  rAxis: z.number().int().optional().nullable(),
  rAdd: z.number().optional().nullable(),
  rPrism: z.number().optional().nullable(),
  rBase: z.string().optional().nullable(),
  rVa: z.string().optional().nullable(),
  rBvd: z.number().optional().nullable(),
  lSphere: z.number().optional().nullable(),
  lCylinder: z.number().optional().nullable(),
  lAxis: z.number().int().optional().nullable(),
  lAdd: z.number().optional().nullable(),
  lPrism: z.number().optional().nullable(),
  lBase: z.string().optional().nullable(),
  lVa: z.string().optional().nullable(),
  lBvd: z.number().optional().nullable(),
  ipd: z.number().optional().nullable(),
  ipdNear: z.number().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isFinal: z.boolean().default(false),
});

export type CreateClinicalRecordInput = z.infer<typeof CreateClinicalRecordSchema>;
export type CreatePrescriptionInput = z.infer<typeof CreatePrescriptionSchema>;