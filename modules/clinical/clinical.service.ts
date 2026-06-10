// ============================================================
// VISION ERP - Clinical Service
// modules/clinical/clinical.service.ts
// ============================================================

import db from "@/lib/db";
import { CreateClinicalRecordInput, CreatePrescriptionInput } from "./clinical.types";

// ─── Multi-tenant guard ──────────────────────────────────────
// Every clinical read/write must be scoped to the caller's practice.
// Clinical data has no practiceId column of its own, so we enforce
// isolation through the owning Patient's practiceId.

async function assertPatientInPractice(patientId: string, practiceId: string) {
  const patient = await db.patient.findFirst({
    where: { id: patientId, practiceId },
    select: { id: true },
  });
  if (!patient) throw new Error("PATIENT_NOT_FOUND");
}

export const clinicalService = {
  // ─── Clinical Records ────────────────────────────────────
  async listRecords(patientId: string, practiceId: string) {
    await assertPatientInPractice(patientId, practiceId);
    return db.clinicalRecord.findMany({
      where: { patientId },
      orderBy: { examinedAt: "desc" },
    });
  },

  async getRecord(id: string, practiceId: string) {
    const record = await db.clinicalRecord.findFirst({
      where: { id, patient: { practiceId } },
    });
    if (!record) throw new Error("RECORD_NOT_FOUND");
    return record;
  },

  async createRecord(input: CreateClinicalRecordInput, practiceId: string) {
    await assertPatientInPractice(input.patientId, practiceId);

    return db.clinicalRecord.create({
      data: {
        ...input,
        examinedAt: input.examinedAt ? new Date(input.examinedAt) : new Date(),
        subjectiveRx: input.subjectiveRx as any,
        objectiveRx: input.objectiveRx as any,
        finalRx: input.finalRx as any,
        anteriorSegment: input.anteriorSegment as any,
        posteriorSegment: input.posteriorSegment as any,
        visualFields: input.visualFields as any,
      },
    });
  },

  async updateRecord(
    id: string,
    input: Partial<CreateClinicalRecordInput>,
    practiceId: string
  ) {
    const existing = await db.clinicalRecord.findFirst({
      where: { id, patient: { practiceId } },
      select: { id: true },
    });
    if (!existing) throw new Error("RECORD_NOT_FOUND");

    // Strip patientId (immutable) and JSON fields (handled explicitly)
    const {
      patientId,
      examinedAt,
      subjectiveRx,
      objectiveRx,
      finalRx,
      anteriorSegment,
      posteriorSegment,
      visualFields,
      ...rest
    } = input;

    return db.clinicalRecord.update({
      where: { id },
      data: {
        ...rest,
        examinedAt: examinedAt ? new Date(examinedAt) : undefined,
        ...(subjectiveRx !== undefined && { subjectiveRx: subjectiveRx as any }),
        ...(objectiveRx !== undefined && { objectiveRx: objectiveRx as any }),
        ...(finalRx !== undefined && { finalRx: finalRx as any }),
        ...(anteriorSegment !== undefined && { anteriorSegment: anteriorSegment as any }),
        ...(posteriorSegment !== undefined && { posteriorSegment: posteriorSegment as any }),
        ...(visualFields !== undefined && { visualFields: visualFields as any }),
      },
    });
  },

  // ─── Prescriptions ───────────────────────────────────────
  async listPrescriptions(patientId: string, practiceId: string) {
    await assertPatientInPractice(patientId, practiceId);
    return db.prescription.findMany({
      where: { patientId, isActive: true },
      orderBy: { examinedAt: "desc" },
    });
  },

  async createPrescription(input: CreatePrescriptionInput, practiceId: string) {
    await assertPatientInPractice(input.patientId, practiceId);

    if (input.isFinal) {
      await db.prescription.updateMany({
        where: { patientId: input.patientId, isFinal: true },
        data: { isActive: false },
      });
    }

    return db.prescription.create({
      data: {
        ...input,
        examinedAt: input.examinedAt ? new Date(input.examinedAt) : new Date(),
      },
    });
  },

  // ─── Contact Lens Rx ─────────────────────────────────────
  async listCLRx(patientId: string, practiceId: string) {
    await assertPatientInPractice(patientId, practiceId);
    return db.contactLensRx.findMany({
      where: { patientId, isActive: true },
      orderBy: { examinedAt: "desc" },
    });
  },

  async createCLRx(
    data: Parameters<typeof db.contactLensRx.create>[0]["data"],
    practiceId: string
  ) {
    const patientId =
      typeof data.patient === "object" && data.patient && "connect" in data.patient
        ? (data.patient.connect as { id: string }).id
        : null;

    if (patientId) {
      await assertPatientInPractice(patientId, practiceId);
      if (data.isFinal) {
        await db.contactLensRx.updateMany({
          where: { patientId, isFinal: true },
          data: { isActive: false },
        });
      }
    }

    return db.contactLensRx.create({ data });
  },
};