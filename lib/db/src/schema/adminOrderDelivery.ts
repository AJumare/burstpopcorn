import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminOrderDeliveryTable = pgTable("burst_order_delivery", {
  reference: text("reference").primaryKey(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminOrderDeliverySchema = createInsertSchema(adminOrderDeliveryTable).omit({ deliveredAt: true });
export type InsertAdminOrderDelivery = z.infer<typeof insertAdminOrderDeliverySchema>;
export type AdminOrderDelivery = typeof adminOrderDeliveryTable.$inferSelect;