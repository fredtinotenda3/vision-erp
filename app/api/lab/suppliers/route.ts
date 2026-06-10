// ============================================================
// VISION ERP - Lab Suppliers API
// app/api/lab/suppliers/route.ts
// ============================================================

import { NextRequest } from "next/server";
import { withPermission, createAuditLog } from "@/middleware/auth.middleware";
import { labService } from "@/modules/lab/lab.service";
import { SupplierSchema } from "@/modules/lab/lab.types";
import { apiSuccess, apiError, apiServerError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  return withPermission(req, "lab:read", async (_ctx) => {
    try {
      const suppliers = await labService.listSuppliers();
      return apiSuccess(suppliers);
    } catch {
      return apiServerError();
    }
  });
}

export async function POST(req: NextRequest) {
  return withPermission(req, "lab:create", async (ctx) => {
    try {
      const body = await req.json();
      const parsed = SupplierSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 422, parsed.error.flatten().fieldErrors);

      const supplier = await labService.createSupplier(parsed.data);
      await createAuditLog(ctx, "CREATE", "Supplier", supplier.id);
      return apiSuccess(supplier, "Supplier created", undefined, 201);
    } catch {
      return apiServerError();
    }
  });
}