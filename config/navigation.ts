// ============================================================
// VISION ERP - Navigation configuration (RBAC-aware)
// config/navigation.ts
// ------------------------------------------------------------
// Each item declares the permission required to see it. The
// sidebar filters this list against the signed-in user's role.
// ============================================================

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  Pill,
  ShoppingBag,
  Receipt,
  Boxes,
  FlaskConical,
  BellRing,
  BarChart3,
  UserCog,
} from "lucide-react";
import type { Permission } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required to render this item. */
  permission: Permission;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "reports:read" },
    ],
  },
  {
    title: "Clinical",
    items: [
      { label: "Patients", href: "/patients", icon: Users, permission: "patients:read" },
      { label: "Appointments", href: "/appointments", icon: CalendarDays, permission: "appointments:read" },
      { label: "Clinical Records", href: "/clinical", icon: Stethoscope, permission: "clinical:read" },
      { label: "Prescriptions", href: "/prescriptions", icon: Pill, permission: "clinical:read" },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingBag, permission: "orders:read" },
      { label: "Sales", href: "/sales", icon: Receipt, permission: "sales:read" },
      { label: "Inventory", href: "/inventory", icon: Boxes, permission: "inventory:read" },
      { label: "Lab Orders", href: "/lab", icon: FlaskConical, permission: "lab:read" },
      { label: "Recalls", href: "/recall", icon: BellRing, permission: "recalls:read" },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Finance", href: "/finance", icon: Receipt, permission: "finance:read" },
      { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports:read" },
      { label: "Staff", href: "/staff", icon: UserCog, permission: "staff:read" },
    ],
  },
];