
// ============================================================
// VISION ERP - Top bar (mobile menu toggle + practice + user)
// components/layout/topbar.tsx
// ============================================================

"use client";

import { useSession } from "next-auth/react";
import { Menu, Building2 } from "lucide-react";
import { useUIStore } from "@/store/ui.store";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { data: session } = useSession();
  const practiceId = session?.user?.practiceId;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Multi-tenant indicator. The active practice is fixed by the
            session (server-enforced); this surfaces which tenant is active. */}
        <Badge variant="neutral" className="hidden items-center gap-1.5 sm:inline-flex">
          <Building2 className="h-3.5 w-3.5" />
          {practiceId ? `Practice ${practiceId.slice(0, 8)}` : "No practice"}
        </Badge>
      </div>

      <UserMenu />
    </header>
  );
}