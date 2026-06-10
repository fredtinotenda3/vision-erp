// File: modules/inventory/inventory.types.ts
// ============================================================
// VISION ERP - Inventory Module Types & Validation
// modules/inventory/inventory.types.ts
// ============================================================

import { z } from "zod";

export const CreateStockItemSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(50),
  barcode: z.string().max(100).optional().nullable(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  practiceId: z.string().min(1, "Practice is required"),
  costPrice: z.number().min(0).default(0),
  retailPrice: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(20),
  currentStock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().optional().nullable(),
  reorderPoint: z.number().int().min(0).default(5),
  reorderQty: z.number().int().min(1).default(10),
  location: z.string().max(100).optional().nullable(),
  isService: z.boolean().default(false),
  trackStock: z.boolean().default(true),
});

export const UpdateStockItemSchema = CreateStockItemSchema.partial().omit({
  practiceId: true,
  sku: true,
});

export const StockAdjustmentSchema = z.object({
  stockItemId: z.string().min(1, "Stock item is required"),
  quantity: z.number().int().refine((v) => v !== 0, { message: "Quantity cannot be zero" }),
  type: z.enum(["PURCHASE", "ADJUSTMENT", "RETURN", "WRITE_OFF", "TRANSFER", "INITIAL"]),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  supplierId: z.string().optional().nullable(),
});

export const InventoryQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  isService: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const SupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(200),
  code: z.string().min(1, "Supplier code is required").max(50),
  contactName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  address: z.string().max(300).optional().nullable(),
  accountNo: z.string().max(100).optional().nullable(),
  vatNo: z.string().max(50).optional().nullable(),
});

export type CreateStockItemInput = z.infer<typeof CreateStockItemSchema>;
export type UpdateStockItemInput = z.infer<typeof UpdateStockItemSchema>;
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;
export type InventoryQueryInput = z.infer<typeof InventoryQuerySchema>;
export type SupplierInput = z.infer<typeof SupplierSchema>;