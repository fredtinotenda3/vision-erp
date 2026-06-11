// path: app/api/rooms/route.ts
// ============================================================
// VISION ERP - Rooms API (read-only)
// app/api/rooms/route.ts
// ------------------------------------------------------------
// Minimal read endpoint to source rooms for appointment booking.
// Returns rooms scoped to the caller's practice OR global rooms
// (practiceId = null), matching how recall configs are scoped.
// Full room management (CRUD) does not yet exist - see follow-ups.
// ============================================================

import { NextRequest } from "next/server";
import { withPermission } from "@/middleware/auth.middleware";
import db from "@/lib/db";
import { apiSuccess, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "appointments:read", async (ctx) => {
    try {
      const practiceId = ctx.practiceId ?? req.nextUrl.searchParams.get("practiceId") ?? null;

      const rooms = await db.room.findMany({
        where: {
          isActive: true,
          OR: [{ practiceId }, { practiceId: null }],
        },
        select: { id: true, name: true, color: true },
        orderBy: { name: "asc" },
      });

      return apiSuccess(rooms);
    } catch {
      return apiServerError();
    }
  });
}