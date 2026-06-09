// ============================================================
// VISION ERP - Inventory Service
// modules/inventory/inventory.service.ts
// ============================================================

import db from "@/lib/db";
import { z } from "zod";
import { buildPaginationMeta } from "@/lib/utils";
import { Prisma } from "@prisma/client";

// ─── Schemas ─────────────────────────────────────────────────
export const CreateStockItemSchema = z.object({
  sku: z.string().min(1).max(50),
  barcode: z.string().max(100).optional().nullable(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  practiceId: z.string().min(1),
  costPrice: z.number().min(0).default(0),
  retailPrice: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(20),
  currentStock: z.number().int().default(0),
  minStock: z.number().int().default(0),
  maxStock: z.number().int().optional().nullable(),
  reorderPoint: z.number().int().default(5),
  reorderQty: z.number().int().default(10),
  location: z.string().max(100).optional().nullable(),
  isService: z.boolean().default(false),
  trackStock: z.boolean().default(true),
});

export const StockAdjustmentSchema = z.object({
  stockItemId: z.string().min(1),
  quantity: z.number().int(),
  type: z.enum(["PURCHASE", "ADJUSTMENT", "RETURN", "WRITE_OFF"]),
  reference: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  supplierId: z.string().optional().nullable(),
});

export const InventoryQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export type CreateStockItemInput = z.infer<typeof CreateStockItemSchema>;
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;
export type InventoryQueryInput = z.infer<typeof InventoryQuerySchema>;

// ─── Service ─────────────────────────────────────────────────
export const inventoryService = {
  async list(params: InventoryQueryInput, practiceId: string) {
    const { page, pageSize, search, categoryId, lowStock } = params;

    const where: Prisma.StockItemWhereInput = {
      practiceId,
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(lowStock && { currentStock: { lte: db.stockItem.fields.reorderPoint } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search } },
        ],
      }),
    };

    const [total, items] = await db.$transaction([
      db.stockItem.count({ where }),
      db.stockItem.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, meta: buildPaginationMeta(page, pageSize, total) };
  },

  async getLowStock(practiceId: string) {
    return db.stockItem.findMany({
      where: {
        practiceId,
        isActive: true,
        trackStock: true,
        currentStock: { lte: db.stockItem.fields.reorderPoint },
      },
      include: { supplier: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { currentStock: "asc" },
    });
  },

  async getById(id: string, practiceId: string) {
    const item = await db.stockItem.findFirst({
      where: { id, practiceId },
      include: {
        category: true,
        supplier: true,
        movements: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!item) throw new Error("ITEM_NOT_FOUND");
    return item;
  },

  async create(input: CreateStockItemInput) {
    return db.stockItem.create({
      data: {
        sku: input.sku,
        barcode: input.barcode,
        name: input.name,
        description: input.description,
        costPrice: input.costPrice,
        retailPrice: input.retailPrice,
        vatRate: input.vatRate,
        currentStock: input.currentStock,
        minStock: input.minStock,
        maxStock: input.maxStock,
        reorderPoint: input.reorderPoint,
        reorderQty: input.reorderQty,
        location: input.location,
        isService: input.isService,
        trackStock: input.trackStock,
        practice: { connect: { id: input.practiceId } },
        ...(input.categoryId && { category: { connect: { id: input.categoryId } } }),
        ...(input.supplierId && { supplier: { connect: { id: input.supplierId } } }),
      },
    });
  },

  async adjust(input: StockAdjustmentInput, userId: string) {
    const item = await db.stockItem.findUnique({ where: { id: input.stockItemId } });
    if (!item) throw new Error("ITEM_NOT_FOUND");

    const isAddition = ["PURCHASE", "RETURN"].includes(input.type);
    const newStock = isAddition
      ? item.currentStock + Math.abs(input.quantity)
      : item.currentStock - Math.abs(input.quantity);

    if (newStock < 0) throw new Error("INSUFFICIENT_STOCK");

    const [updatedItem, movement] = await db.$transaction([
      db.stockItem.update({
        where: { id: input.stockItemId },
        data: { currentStock: newStock },
      }),
      db.stockMovement.create({
  data: {
    stockItemId: input.stockItemId,
    type: input.type as "PURCHASE" | "ADJUSTMENT" | "RETURN" | "WRITE_OFF",
    quantity: isAddition ? Math.abs(input.quantity) : -Math.abs(input.quantity),
    costPrice: input.costPrice ?? null,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
    createdById: userId,
    supplierId: input.supplierId ?? null,  // 👈 Use scalar field instead of connect
  },
}),
    ]);

    return { item: updatedItem, movement };
  },
};