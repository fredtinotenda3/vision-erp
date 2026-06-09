// ============================================================
// VISION ERP - Database Client (Singleton Pattern)
// lib/db.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

declare global {
  // Prevents multiple instances of Prisma Client in development
  var __prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

const db = globalThis.__prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

export { db };
export default db;