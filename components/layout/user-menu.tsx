// ============================================================
// VISION ERP - User menu (account + sign out)
// components/layout/user-menu.tsx
// ============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import { roleLabel } from "@/lib/permissions";
import { cn } from "@/lib/cn";

function initials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const user = session?.user;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A] text-xs font-semibold text-white">
          {initials(user?.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-gray-900">{user?.name ?? "User"}</span>
          <span className="block text-xs text-gray-500">{roleLabel(user?.role)}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      <div
        className={cn(
          "absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-gray-200 bg-white p-2 shadow-lg transition",
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"
        )}
      >
        <div className="border-b border-gray-100 px-3 py-2">
          <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}