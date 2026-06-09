// ============================================================
// VISION ERP - Patient Repository (DB Access Layer)
// modules/patients/patient.repository.ts
// ============================================================

import db from "@/lib/db";
import { Prisma, AppointmentStatus } from "@prisma/client";
import { PatientSearchInput } from "./patient.types";

// ─── Default patient select (safe, no sensitive) ─────────────
const patientSelect = {
  id: true,
  refNo: true,
  title: true,
  forename: true,
  initial: true,
  surname: true,
  dob: true,
  sex: true,
  address1: true,
  address2: true,
  town: true,
  county: true,
  postcode: true,
  homePhone: true,
  workPhone: true,
  mobile: true,
  email: true,
  occupation: true,
  nhsNumber: true,
  gpName: true,
  gpAddress: true,
  isKeyPatient: true,
  isStaffRelative: true,
  isMemberOfStaff: true,
  isActive: true,
  isDeceased: true,
  marketingOptIn: true,
  contactPref: true,
  notes: true,
  practiceId: true,
  createdById: true,
  previousEyeTest: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PatientSelect;

// ─── Patient with relations ──────────────────────────────────
const patientWithRelations = {
  ...patientSelect,
  prescriptions: {
    where: { isActive: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
  recalls: {
    where: { status: "PENDING" as const },
    orderBy: { dueDate: "asc" as const },
    take: 3,
  },
  appointments: {
    where: {
      startTime: { gte: new Date() },
      status: { 
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.MISSED] 
      },
    },
    orderBy: { startTime: "asc" as const },
    take: 3,
  },
};

// ============================================================
// REPOSITORY CLASS
// ============================================================

export const patientRepository = {
  // ─── Find many with search + pagination ──────────────────
  async findMany(params: PatientSearchInput, practiceId: string) {
    const {
      page,
      pageSize,
      search,
      surname,
      forename,
      dob,
      postcode,
      refNo,
      phone,
      sortBy,
      sortOrder,
    } = params;

    const skip = (page - 1) * pageSize;

    const where: Prisma.PatientWhereInput = {
      practiceId,
      isActive: true,
      ...(refNo && { refNo: { equals: refNo, mode: "insensitive" } }),
      ...(dob && { dob: new Date(dob) }),
      ...(postcode && { postcode: { contains: postcode, mode: "insensitive" } }),
      ...(surname && { surname: { startsWith: surname, mode: "insensitive" } }),
      ...(forename && { forename: { startsWith: forename, mode: "insensitive" } }),
      ...(phone && {
        OR: [
          { homePhone: { contains: phone } },
          { workPhone: { contains: phone } },
          { mobile: { contains: phone } },
        ],
      }),
      ...(search && {
        OR: [
          { surname: { contains: search, mode: "insensitive" } },
          { forename: { contains: search, mode: "insensitive" } },
          { refNo: { contains: search, mode: "insensitive" } },
          { mobile: { contains: search } },
          { nhsNumber: { contains: search } },
          { postcode: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, patients] = await db.$transaction([
      db.patient.count({ where }),
      db.patient.findMany({
        where,
        select: patientSelect,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
    ]);

    return { patients, total };
  },

  // ─── Find by ID ───────────────────────────────────────────
  async findById(id: string, practiceId: string) {
    return db.patient.findFirst({
      where: { id, practiceId, isActive: true },
      select: patientWithRelations,
    });
  },

  // ─── Find by Ref No ───────────────────────────────────────
  async findByRefNo(refNo: string, practiceId: string) {
    return db.patient.findFirst({
      where: { refNo, practiceId },
      select: patientSelect,
    });
  },

  // ─── Create ───────────────────────────────────────────────
  async create(data: Prisma.PatientCreateInput) {
    return db.patient.create({
      data,
      select: patientSelect,
    });
  },

  // ─── Update ───────────────────────────────────────────────
  async update(id: string, data: Prisma.PatientUpdateInput) {
    return db.patient.update({
      where: { id },
      data,
      select: patientSelect,
    });
  },

  // ─── Soft delete ──────────────────────────────────────────
  async softDelete(id: string) {
    return db.patient.update({
      where: { id },
      data: { isActive: false },
    });
  },

  // ─── Count for ref number generation ─────────────────────
  async countByPractice(practiceId: string) {
    return db.patient.count({ where: { practiceId } });
  },

  // ─── Duplicate check ─────────────────────────────────────
  async checkDuplicate(
    forename: string,
    surname: string,
    dob: Date,
    practiceId: string,
    excludeId?: string
  ) {
    return db.patient.findFirst({
      where: {
        forename: { equals: forename, mode: "insensitive" },
        surname: { equals: surname, mode: "insensitive" },
        dob,
        practiceId,
        isActive: true,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
      select: { id: true, refNo: true, forename: true, surname: true, dob: true },
    });
  },

  // ─── Get clinical history ─────────────────────────────────
  async getClinicalHistory(patientId: string) {
    return db.clinicalRecord.findMany({
      where: { patientId },
      orderBy: { examinedAt: "desc" },
    });
  },

  // ─── Get prescription history ─────────────────────────────
  async getPrescriptions(patientId: string) {
    return db.prescription.findMany({
      where: { patientId, isActive: true },
      orderBy: { examinedAt: "desc" },
    });
  },

  // ─── Get orders ───────────────────────────────────────────
  async getOrders(patientId: string) {
    return db.order.findMany({
      where: { patientId },
      orderBy: { orderDate: "desc" },
    });
  },
};