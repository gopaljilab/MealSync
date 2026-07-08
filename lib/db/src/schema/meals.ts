import { pgTable, serial, text, integer, boolean, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const mealStatusEnum = pgEnum("meal_status", ["pending", "served", "completed", "draft", "published"]);

export const mealsTable = pgTable("meals", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").references(() => usersTable.id).notNull(),
  menu: text("menu"), // Made optional to support new structure
  breakfastMenu: text("breakfast_menu"),
  breakfastTime: text("breakfast_time"),
  lunchMenu: text("lunch_menu"),
  dinnerMenu: text("dinner_menu"),
  lunchTime: text("lunch_time"),
  dinnerTime: text("dinner_time"),
  notes: text("notes"),
  expectedPeople: integer("expected_people").notNull(),
  predictedMeals: integer("predicted_meals"),
  actualServed: integer("actual_served"),
  leftoverMeals: integer("leftover_meals"),
  ngoNotified: boolean("ngo_notified").default(false).notNull(),
  status: mealStatusEnum("status").default("draft").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  unqOwnerDate: unique("unq_owner_date").on(t.ownerId, t.date),
}));

export const insertMealSchema = createInsertSchema(mealsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMeal = z.infer<typeof insertMealSchema>;
export type Meal = typeof mealsTable.$inferSelect;
