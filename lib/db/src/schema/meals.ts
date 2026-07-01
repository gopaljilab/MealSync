import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const mealStatusEnum = pgEnum("meal_status", ["pending", "served", "completed"]);

export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => usersTable.id).notNull(),
  menu: text("menu").notNull(),
  expectedPeople: integer("expected_people").notNull(),
  predictedMeals: integer("predicted_meals"),
  actualServed: integer("actual_served"),
  leftoverMeals: integer("leftover_meals"),
  ngoNotified: boolean("ngo_notified").default(false).notNull(),
  status: mealStatusEnum("status").default("pending").notNull(),
  date: timestamp("date").defaultNow().notNull(),
});

export const insertMealSchema = createInsertSchema(mealsTable).omit({ id: true });
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof mealsTable.$inferSelect;
