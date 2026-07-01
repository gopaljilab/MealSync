import { pgTable, serial, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const weekdayEnum = pgEnum("weekday", [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const weeklySchedulesTable = pgTable("weekly_schedules", {
  id: serial("id").primaryKey(),
  residentId: integer("resident_id")
    .references(() => usersTable.id)
    .notNull(),
  weekday: weekdayEnum("weekday").notNull(),
  lunch: boolean("lunch").default(false).notNull(),
  dinner: boolean("dinner").default(true).notNull(),
});

export type WeeklySchedule = typeof weeklySchedulesTable.$inferSelect;
