// ============================================================
// VISION ERP - Auth Configuration (NextAuth)
// lib/auth.ts
// ============================================================

import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import db from "./db";
import { Permission } from "@/types";

// ============================================================
// ROLE → PERMISSION MAP (RBAC)
// ============================================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "patients:read", "patients:create", "patients:update", "patients:delete",
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "clinical:read", "clinical:create", "clinical:update",
    "orders:read", "orders:create", "orders:update", "orders:delete",
    "sales:read", "sales:create", "sales:void",
    "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
    "finance:read", "finance:create", "finance:update",
    "lab:read", "lab:create", "lab:update",
    "recalls:read", "recalls:create", "recalls:send",
    "reports:read", "reports:export",
    "staff:read", "staff:create", "staff:update", "staff:delete",
    "system:admin", "audit:read",
  ],
  ADMIN: [
    "patients:read", "patients:create", "patients:update", "patients:delete",
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "clinical:read", "clinical:create", "clinical:update",
    "orders:read", "orders:create", "orders:update", "orders:delete",
    "sales:read", "sales:create", "sales:void",
    "inventory:read", "inventory:create", "inventory:update", "inventory:delete",
    "finance:read", "finance:create", "finance:update",
    "lab:read", "lab:create", "lab:update",
    "recalls:read", "recalls:create", "recalls:send",
    "reports:read", "reports:export",
    "staff:read", "staff:create", "staff:update",
    "audit:read",
  ],
  OPTOMETRIST: [
    "patients:read", "patients:create", "patients:update",
    "appointments:read", "appointments:create", "appointments:update",
    "clinical:read", "clinical:create", "clinical:update",
    "orders:read", "orders:create",
    "sales:read",
    "recalls:read", "recalls:create",
    "reports:read",
  ],
  RECEPTIONIST: [
    "patients:read", "patients:create", "patients:update",
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "orders:read",
    "sales:read", "sales:create",
    "recalls:read",
    "reports:read",
  ],
  DISPENSER: [
    "patients:read",
    "appointments:read",
    "orders:read", "orders:create", "orders:update",
    "sales:read", "sales:create",
    "inventory:read",
    "lab:read", "lab:create", "lab:update",
    "reports:read",
  ],
  FINANCE: [
    "patients:read",
    "orders:read",
    "sales:read",
    "finance:read", "finance:create", "finance:update",
    "inventory:read",
    "reports:read", "reports:export",
  ],
  LAB_TECHNICIAN: [
    "orders:read",
    "lab:read", "lab:create", "lab:update",
  ],
  READONLY: [
    "patients:read",
    "appointments:read",
    "orders:read",
    "sales:read",
    "reports:read",
  ],
};

// ============================================================
// PERMISSION CHECKER
// ============================================================

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// ============================================================
// NEXTAUTH OPTIONS
// ============================================================

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            practiceId: true,
            isActive: true,
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Please contact your administrator.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Update last login
        await db.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Create audit log
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            message: `User ${user.email} logged in`,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          practiceId: user.practiceId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.practiceId = user.practiceId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.practiceId = token.practiceId as string | null;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        await db.auditLog.create({
          data: {
            userId: token.id as string,
            action: "LOGOUT",
            entity: "User",
            entityId: token.id as string,
            message: `User logged out`,
          },
        }).catch(() => {});
      }
    },
  },
};

// ============================================================
// SERVER-SIDE AUTH HELPERS
// ============================================================

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  if (!hasPermission(session.user.role as Role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}