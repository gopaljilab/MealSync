import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { mealsTable } from "./meals";
import { usersTable } from "./users";

export const ngoRequestStatusEnum = pgEnum("ngo_request_status", ["pending", "accepted", "rejected", "completed"]);

export const ngoRequestsTable = pgTable("ngo_requests", {
  id: serial("id").primaryKey(),
  mealId: integer("meal_id").references(() => mealsTable.id).notNull(),
  ngoId: integer("ngo_id").references(() => usersTable.id),
  pgName: text("pg_name").notNull(),
  pgLocation: text("pg_location").notNull(),
  availableMeals: integer("available_meals").notNull(),
  pickupTime: text("pickup_time").notNull(),
  mealMenu: text("meal_menu"),
  status: ngoRequestStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNgoRequestSchema = createInsertSchema(ngoRequestsTable).omit({ id: true, createdAt: true });
export type InsertNgoRequest = z.infer<typeof insertNgoRequestSchema>;
export type NgoRequest = typeof ngoRequestsTable.$inferSelect;
