import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const orderConfirmationTable = pgTable("burst_order_confirmation", {
  reference: text("reference").primaryKey(),
  status: text("status").notNull(),
  attemptId: text("attempt_id").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const insertOrderConfirmationSchema = createInsertSchema(orderConfirmationTable).omit({ attemptedAt: true, sentAt: true });
export type InsertOrderConfirmation = z.infer<typeof insertOrderConfirmationSchema>;
export type OrderConfirmation = typeof orderConfirmationTable.$inferSelect;