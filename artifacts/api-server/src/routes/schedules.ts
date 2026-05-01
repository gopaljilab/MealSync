import { Router } from "express";
import { db } from "@workspace/db";
import { weeklySchedulesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

router.get("/schedules/mine", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const rows = await db
    .select()
    .from(weeklySchedulesTable)
    .where(eq(weeklySchedulesTable.residentId, req.session.userId));

  const schedule: Record<string, { lunch: boolean; dinner: boolean }> = {};
  for (const day of WEEKDAYS) {
    const row = rows.find((r) => r.weekday === day);
    schedule[day] = { lunch: row?.lunch ?? false, dinner: row?.dinner ?? true };
  }
  return res.json(schedule);
});

router.post("/schedules/mine", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const { schedule } = req.body as {
    schedule: Record<string, { lunch: boolean; dinner: boolean }>;
  };
  if (!schedule) return res.status(400).json({ error: "Missing schedule" });

  for (const day of WEEKDAYS) {
    if (!schedule[day]) continue;
    const { lunch, dinner } = schedule[day];
    const existing = await db
      .select()
      .from(weeklySchedulesTable)
      .where(
        and(
          eq(weeklySchedulesTable.residentId, req.session.userId),
          eq(weeklySchedulesTable.weekday, day),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(weeklySchedulesTable)
        .set({ lunch, dinner })
        .where(eq(weeklySchedulesTable.id, existing[0].id));
    } else {
      await db
        .insert(weeklySchedulesTable)
        .values({ residentId: req.session.userId, weekday: day, lunch, dinner });
    }
  }
  return res.json({ message: "Schedule saved" });
});

export default router;
