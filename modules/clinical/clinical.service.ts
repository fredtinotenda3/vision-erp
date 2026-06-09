// ============================================================
// VISION ERP - Clinical Service
// modules/clinical/clinical.service.ts
// ============================================================

import db from "@/lib/db";
import { CreateClinicalRecordInput, CreatePrescriptionInput } from "./clinical.types";

export const clinicalService = {
  // ─── Clinical Records ────────────────────────────────────
  async listRecords(patientId: string) {
    return db.clinicalRecord.findMany({
      where: { patientId },
      orderBy: { examinedAt: "desc" },
    });
  },

  async getRecord(id: string) {
    const record = await db.clinicalRecord.findUnique({ where: { id } });
    if (!record) throw new Error("RECORD_NOT_FOUND");
    return record;
  },

 async createRecord(input: CreateClinicalRecordInput) {
    return db.clinicalRecord.create({
      data: {
        ...input,
        examinedAt: input.examinedAt ? new Date(input.examinedAt) : new Date(),
        // Cast JSON fields to Prisma's InputJsonValue type
        subjectiveRx: input.subjectiveRx as any,
        objectiveRx: input.objectiveRx as any,
        finalRx: input.finalRx as any,
        anteriorSegment: input.anteriorSegment as any,
        posteriorSegment: input.posteriorSegment as any,
        visualFields: input.visualFields as any,
      },
    });
  },

 async updateRecord(id: string, input: Partial<CreateClinicalRecordInput>) {
  const existing = await db.clinicalRecord.findUnique({ where: { id } });
  if (!existing) throw new Error("RECORD_NOT_FOUND");
  
  // Destructure to remove patientId from the update data
  const { patientId, examinedAt, subjectiveRx, objectiveRx, finalRx, anteriorSegment, posteriorSegment, visualFields, ...rest } = input;
  
  return db.clinicalRecord.update({
    where: { id },
    data: {
      ...rest,
      examinedAt: examinedAt ? new Date(examinedAt) : undefined,
      // Only include JSON fields if they exist in the input
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
  async listPrescriptions(patientId: string) {
    return db.prescription.findMany({
      where: { patientId, isActive: true },
      orderBy: { examinedAt: "desc" },
    });
  },

  async createPrescription(input: CreatePrescriptionInput) {
    // Mark previous prescriptions as inactive when creating a final one
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
  async listCLRx(patientId: string) {
    return db.contactLensRx.findMany({
      where: { patientId, isActive: true },
      orderBy: { examinedAt: "desc" },
    });
  },

  async createCLRx(data: Parameters<typeof db.contactLensRx.create>[0]["data"]) {
    if (data.isFinal) {
      const patientId = typeof data.patient === "object" && "connect" in data.patient
        ? (data.patient.connect as { id: string }).id
        : null;
      if (patientId) {
        await db.contactLensRx.updateMany({
          where: { patientId, isFinal: true },
          data: { isActive: false },
        });
      }
    }
    return db.contactLensRx.create({ data });
  },
};