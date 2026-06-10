// ============================================================
// VISION ERP - Global UI store (sidebar + toasts)
// store/ui.store.ts
// ============================================================

"use client";

import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
}

const TOAST_TTL = 5000;

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => get().dismissToast(id), TOAST_TTL);
    }
    return id;
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable outside React (e.g. in catch blocks). */
export const toast = {
  show: (title: string, opts?: { description?: string; variant?: ToastVariant }) =>
    useUIStore.getState().addToast({
      title,
      description: opts?.description,
      variant: opts?.variant ?? "default",
    }),
  success: (title: string, description?: string) =>
    useUIStore.getState().addToast({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useUIStore.getState().addToast({ title, description, variant: "error" }),
  warning: (title: string, description?: string) =>
    useUIStore.getState().addToast({ title, description, variant: "warning" }),
};