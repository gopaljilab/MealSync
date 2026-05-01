import { Router } from "express";
import { db } from "@workspace/db";
import { mealsTable, ngoRequestsTable } from "@workspace/db";
import { eq, gte, and, desc } from "drizzle-orm";

const router = Router();

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/dashboard/owner-stats", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const ownerId = req.session.userId;
  const todayStart = getTodayStart();

  const todayMeals = await db
    .select()
    .from(mealsTable)
    .where(and(eq(mealsTable.ownerId, ownerId), gte(mealsTable.date, todayStart)));

  const totalMealsToday = todayMeals.reduce((s, m) => s + (m.expectedPeople ?? 0), 0);
  const predictedMeals = todayMeals.reduce((s, m) => s + (m.predictedMeals ?? 0), 0);
  const leftoverMeals = todayMeals.reduce((s, m) => s + (m.leftoverMeals ?? 0), 0);
  const mealsServed = todayMeals.reduce((s, m) => s + (m.actualServed ?? 0), 0);

  return res.json({ totalMealsToday, predictedMeals, leftoverMeals, mealsServed });
});

router.get("/dashboard/green-score", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const ownerId = req.session.userId;

  const allMeals = await db.select().from(mealsTable).where(eq(mealsTable.ownerId, ownerId));

  const totalMealsSaved = allMeals.reduce((s, m) => {
    if (m.leftoverMeals == null || m.predictedMeals == null) return s;
    return s + Math.max(0, m.predictedMeals - m.leftoverMeals);
  }, 0);

  const todayStart = getTodayStart();
  const mealsSavedToday = allMeals
    .filter((m) => new Date(m.date) >= todayStart)
    .reduce((s, m) => {
      if (m.leftoverMeals == null || m.predictedMeals == null) return s;
      return s + Math.max(0, m.predictedMeals - m.leftoverMeals);
    }, 0);

  const servedMeals = allMeals.filter((m) => m.actualServed != null);
  const wasteRatio =
    servedMeals.length === 0
      ? 0
      : servedMeals.reduce((s, m) => {
          const waste = (m.leftoverMeals ?? 0) / Math.max(1, m.actualServed ?? 1);
          return s + waste;
        }, 0) / servedMeals.length;

  const score = Math.max(0, Math.min(100, Math.round(100 - wasteRatio * 100)));

  return res.json({
    score,
    mealsSavedToday,
    totalMealsSaved,
    message:
      score >= 80
        ? "Excellent work reducing food waste!"
        : score >= 50
          ? "Good effort — keep cutting down leftovers."
          : "Let's work on reducing waste more.",
  });
});

router.get("/dashboard/daily-trends", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const ownerId = req.session.userId;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const meals = await db
    .select()
    .from(mealsTable)
    .where(and(eq(mealsTable.ownerId, ownerId), gte(mealsTable.date, sevenDaysAgo)))
    .orderBy(mealsTable.date);

  const byDate: Record<string, { predicted: number; actual: number; leftover: number }> = {};

  for (const meal of meals) {
    const d = new Date(meal.date).toISOString().split("T")[0];
    if (!byDate[d]) byDate[d] = { predicted: 0, actual: 0, leftover: 0 };
    byDate[d].predicted += meal.predictedMeals ?? 0;
    byDate[d].actual += meal.actualServed ?? 0;
    byDate[d].leftover += meal.leftoverMeals ?? 0;
  }

  const trends = Object.entries(byDate).map(([date, v]) => ({
    date,
    predicted: v.predicted,
    actual: v.actual,
    leftover: v.leftover,
    wasteReduction:
      v.actual > 0 ? parseFloat((((v.actual - v.leftover) / v.actual) * 100).toFixed(1)) : 0,
  }));

  return res.json(trends);
});

export default router;
