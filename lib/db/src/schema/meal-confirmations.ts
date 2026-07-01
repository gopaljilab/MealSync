import { pgTable, serial, boolean, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const mealConfirmationsTable = pgTable("meal_confirmations", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").references(() => usersTable.id).notNull(),
  willEat: boolean("will_eat").notNull(),
  mealDate: date("meal_date").notNull(),
});

export const insertMealConfirmationSchema = createInsertSchema(mealConfirmationsTable).omit({ id: true });
export type InsertMealConfirmation = z.infer<typeof insertMealConfirmationSchema>;
export type MealConfirmation = typeof mealConfirmationsTable.$inferSelect;
