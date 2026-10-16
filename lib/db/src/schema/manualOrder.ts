import { boolean, date, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const manualOrderTable = pgTable("burst_manual_order", {
  reference: text("reference").primaryKey(),
  creationFingerprint: text("creation_fingerprint").notNull(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  state: text("state").notNull(),
  lineItems: jsonb("line_items").$type<Array<{ flavor: string; quantity: number }>>().notNull(),
  totalNaira: integer("total_naira").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  deliveryDate: date("delivery_date", { mode: "string" }).notNull(),
  deliveryDateOverridden: boolean("delivery_date_overridden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
}, table => [index("burst_manual_order_created_idx").on(table.createdAt)]);

export const insertManualOrderSchema = createInsertSchema(manualOrderTable).omit({ createdAt: true });
export type InsertManualOrder = z.infer<typeof insertManualOrderSchema>;
export type ManualOrder = typeof manualOrderTable.$inferSelect;
