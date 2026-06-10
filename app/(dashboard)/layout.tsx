// ============================================================
// VISION ERP - Protected dashboard layout
// app/(dashboard)/layout.tsx
// ------------------------------------------------------------
// Server-side session guard (defence in depth alongside middleware),
// then renders the client app shell.
// ============================================================

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}