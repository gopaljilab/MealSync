import { pgTable, serial, integer, text, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id").references(() => usersTable.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  mealDate: date("meal_date").notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
