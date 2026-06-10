// ============================================================
// VISION ERP - Next.js Root Middleware
// middleware.ts  (project root)
// ============================================================

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ─── Super Admin only routes ────────────────────────────
    if (pathname.startsWith("/admin/system") && token?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
    }

    // ─── Finance only routes ─────────────────────────────────
    const financeRoutes = ["/finance/reports", "/finance/vat"];
    if (
      financeRoutes.some((r) => pathname.startsWith(r)) &&
      !["SUPER_ADMIN", "ADMIN", "FINANCE"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
    }

    // ─── Clinical routes ─────────────────────────────────────
    if (
      pathname.startsWith("/clinical") &&
      !["SUPER_ADMIN", "ADMIN", "OPTOMETRIST"].includes(token?.role as string)
    ) {
      return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patients/:path*",
    "/appointments/:path*",
    "/clinical/:path*",
    "/orders/:path*",
    "/sales/:path*",
    "/inventory/:path*",
    "/finance/:path*",
    "/lab/:path*",
    "/recalls/:path*",
    "/reports/:path*",
    "/staff/:path*",
    "/admin/:path*",
    "/api/patients/:path*",
    "/api/appointments/:path*",
    "/api/clinical/:path*",
    "/api/orders/:path*",
    "/api/sales/:path*",
    "/api/inventory/:path*",
    "/api/finance/:path*",
    "/api/lab/:path*",
    "/api/recalls/:path*",
    "/api/reports/:path*",
    "/api/staff/:path*",
    "/api/admin/:path*",
  ],
};