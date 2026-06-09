// ============================================================
// VISION ERP - Database Seed Script
// prisma/seed.ts
// ============================================================

import { PrismaClient, Role, RecallType, RecallMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ─── 1. Create default practice ──────────────────────────
  const practice = await prisma.practice.upsert({
    where: { code: "VISION01" },
    update: {},
    create: {
      name: "Vision ERP Demo Practice",
      code: "VISION01",
      address: "123 High Street",
      town: "London",
      county: "Greater London",
      postcode: "SW1A 1AA",
      phone: "020 7123 4567",
      email: "admin@visionerp.demo",
      vatNumber: "GB123456789",
    },
  });
  console.log("✅ Practice created:", practice.name);

  // ─── 2. Create users ─────────────────────────────────────
  const users: Array<{
    email: string;
    name: string;
    role: Role;
    password: string;
  }> = [
    {
      email: "superadmin@visionerp.demo",
      name: "Super Admin",
      role: Role.SUPER_ADMIN,
      password: "Admin@1234!",
    },
    {
      email: "admin@visionerp.demo",
      name: "Practice Manager",
      role: Role.ADMIN,
      password: "Admin@1234!",
    },
    {
      email: "optometrist@visionerp.demo",
      name: "Dr. Jane Smith",
      role: Role.OPTOMETRIST,
      password: "Admin@1234!",
    },
    {
      email: "receptionist@visionerp.demo",
      name: "Sarah Johnson",
      role: Role.RECEPTIONIST,
      password: "Admin@1234!",
    },
    {
      email: "dispenser@visionerp.demo",
      name: "Mark Williams",
      role: Role.DISPENSER,
      password: "Admin@1234!",
    },
    {
      email: "finance@visionerp.demo",
      name: "Finance User",
      role: Role.FINANCE,
      password: "Admin@1234!",
    },
  ];

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        password: hashed,
        practiceId: practice.id,
        mustChangePassword: u.role !== Role.SUPER_ADMIN,
      },
    });
    console.log(`✅ User created: ${user.name} (${user.role})`);
  }

  // ─── 3. Create exam rooms ─────────────────────────────────
  const rooms = [
    { name: "Room 1", color: "#3B82F6" },
    { name: "Room 2", color: "#0F766E" },
    { name: "Room 3", color: "#F59E0B" },
    { name: "Contact Lens Room", color: "#8B5CF6" },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { id: room.name.toLowerCase().replace(/ /g, "-") },
      update: {},
      create: room,
    }).catch(() => prisma.room.create({ data: room }));
    console.log(`✅ Room created: ${room.name}`);
  }

  // ─── 4. Create stock categories ──────────────────────────
  const categories = [
    "Frames",
    "Lenses",
    "Contact Lenses",
    "Solutions",
    "Accessories",
    "Sunglasses",
    "Services",
    "Vouchers",
  ];

  for (const name of categories) {
    await prisma.stockCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`✅ Category created: ${name}`);
  }

  // ─── 5. Create document templates ────────────────────────
  const templates = [
    {
      name: "Routine Recall SMS",
      type: "RECALL",
      subject: null,
      body: "Dear {{patient_name}}, your routine eye examination is due. Please call {{practice_phone}} to book an appointment. {{practice_name}}",
    },
    {
      name: "Routine Recall Email",
      type: "RECALL",
      subject: "Time for your Eye Examination - {{practice_name}}",
      body: `Dear {{patient_name}},\n\nIt has been {{interval}} since your last eye examination at {{practice_name}}.\n\nRegular eye examinations are important for maintaining good eye health. We recommend a routine check every 24 months.\n\nPlease call us on {{practice_phone}} or email {{practice_email}} to book your appointment.\n\nKind regards,\n{{practice_name}}`,
    },
    {
      name: "Contact Lens Recall",
      type: "RECALL",
      subject: "Contact Lens Aftercare Due - {{practice_name}}",
      body: `Dear {{patient_name}},\n\nYour contact lens aftercare is now due. Please contact us to arrange a review.\n\nKind regards,\n{{practice_name}}`,
    },
    {
      name: "Order Ready Letter",
      type: "LETTER",
      subject: "Your Order is Ready for Collection",
      body: `Dear {{patient_name}},\n\nWe are pleased to inform you that your order ({{order_no}}) is now ready for collection.\n\nPlease bring this letter when collecting your order.\n\nKind regards,\n{{practice_name}}`,
    },
  ];

  for (const template of templates) {
    await prisma.documentTemplate.upsert({
      where: { id: template.name.toLowerCase().replace(/ /g, "-") },
      update: {},
      create: template,
    }).catch(() => prisma.documentTemplate.create({ data: template }));
    console.log(`✅ Template created: ${template.name}`);
  }

  // ─── 6. Create recall configs ─────────────────────────────
  const recallConfigs: Array<{
    type: RecallType;
    intervalMonths: number;
    methods: RecallMethod[];
  }> = [
    { type: RecallType.ROUTINE, intervalMonths: 24, methods: [RecallMethod.SMS, RecallMethod.EMAIL] },
    { type: RecallType.CONTACT_LENS, intervalMonths: 12, methods: [RecallMethod.SMS, RecallMethod.EMAIL] },
    { type: RecallType.GLAUCOMA, intervalMonths: 6, methods: [RecallMethod.EMAIL, RecallMethod.POST] },
    { type: RecallType.DIABETIC, intervalMonths: 12, methods: [RecallMethod.EMAIL, RecallMethod.POST] },
  ];

  for (const config of recallConfigs) {
    await prisma.recallConfig.upsert({
      where: { id: config.type.toLowerCase() },
      update: {},
      create: config,
    }).catch(() => prisma.recallConfig.create({ data: config }));
    console.log(`✅ Recall config: ${config.type}`);
  }

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Demo credentials:");
  console.log("  Super Admin:   superadmin@visionerp.demo / Admin@1234!");
  console.log("  Admin:         admin@visionerp.demo / Admin@1234!");
  console.log("  Optometrist:   optometrist@visionerp.demo / Admin@1234!");
  console.log("  Receptionist:  receptionist@visionerp.demo / Admin@1234!");
  console.log("  Dispenser:     dispenser@visionerp.demo / Admin@1234!");
  console.log("  Finance:       finance@visionerp.demo / Admin@1234!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });