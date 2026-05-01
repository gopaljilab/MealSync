import { Router } from "express";
import { db } from "@workspace/db";
import {
  mealsTable,
  mealConfirmationsTable,
  ngoRequestsTable,
  feedbackTable,
} from "@workspace/db";
import { eq, and, gte, desc, count, sum } from "drizzle-orm";

const router = Router();

function getTodayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

const INGREDIENTS: Record<string, Record<string, number>> = {
  default: { rice: 0.1, dal: 0.05, oil: 0.01, vegetables: 0.08, roti: 0.06 },
  paneer: { paneer: 0.05, rice: 0.1, oil: 0.01, cream: 0.02 },
  biryani: { rice: 0.15, meat: 0.1, spices: 0.005, oil: 0.02 },
  rajma: { rajma: 0.06, rice: 0.12, oil: 0.01, tomatoes: 0.05 },
  chole: { chole: 0.06, rice: 0.1, oil: 0.01, onions: 0.04 },
};

function inferIngredients(menu: string): Record<string, number> {
  const lower = menu.toLowerCase();
  if (lower.includes("paneer") || lower.includes("butter masala"))
    return { ...INGREDIENTS.default, ...INGREDIENTS.paneer };
  if (lower.includes("biryani")) return { ...INGREDIENTS.default, ...INGREDIENTS.biryani };
  if (lower.includes("rajma")) return { ...INGREDIENTS.default, ...INGREDIENTS.rajma };
  if (lower.includes("chole") || lower.includes("chhole"))
    return { ...INGREDIENTS.default, ...INGREDIENTS.chole };
  return INGREDIENTS.default;
}

router.get("/intelligence/raw-materials", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  const todayStart = getTodayStart();
  const meals = await db
    .select()
    .from(mealsTable)
    .where(
      and(eq(mealsTable.ownerId, req.session.userId), gte(mealsTable.date, todayStart)),
    );

  const totals: Record<string, number> = {};
  for (const meal of meals) {
    const count = meal.predictedMeals ?? meal.expectedPeople;
    const ratios = inferIngredients(meal.menu);
    for (const [ingredient, kgPerPerson] of Object.entries(ratios)) {
      totals[ingredient] = (totals[ingredient] ?? 0) + kgPerPerson * count;
    }
  }

  const items = Object.entries(totals).map(([ingredient, kg]) => ({
    ingredient: ingredient.charAt(0).toUpperCase() + ingredient.slice(1),
    quantity: parseFloat(kg.toFixed(2)),
    unit: "kg",
  }));

  return res.json({ items, basedOnMeals: meals.length });
});

router.get("/intelligence/waste-cost", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  const costPerMeal = 45;
  const weekStart = getWeekStart();
  const meals = await db
    .select()
    .from(mealsTable)
    .where(
      and(eq(mealsTable.ownerId, req.session.userId), gte(mealsTable.date, weekStart)),
    );

  const totalLeftover = meals.reduce((s, m) => s + (m.leftoverMeals ?? 0), 0);
  const totalCostLost = totalLeftover * costPerMeal;
  const totalMealsServed = meals.reduce((s, m) => s + (m.actualServed ?? 0), 0);
  const wastePercent =
    totalMealsServed > 0
      ? parseFloat(((totalLeftover / (totalMealsServed + totalLeftover)) * 100).toFixed(1))
      : 0;

  const dailyBreakdown = meals.map((m) => ({
    date: m.date instanceof Date ? m.date.toISOString().split("T")[0] : m.date,
    menu: m.menu,
    leftover: m.leftoverMeals ?? 0,
    costLost: (m.leftoverMeals ?? 0) * costPerMeal,
  }));

  return res.json({
    costPerMeal,
    totalLeftover,
    totalCostLost,
    wastePercent,
    weeklyBreakdown: dailyBreakdown,
    currency: "INR",
  });
});

router.get("/intelligence/suggestions", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  const ownerId = req.session.userId;
  const weekStart = getWeekStart();
  const meals = await db
    .select()
    .from(mealsTable)
    .where(and(eq(mealsTable.ownerId, ownerId), gte(mealsTable.date, weekStart)));

  const suggestions: { type: "warning" | "tip" | "info"; message: string }[] = [];

  const mockRainy = false;
  const weekend = isWeekend();

  if (weekend) {
    suggestions.push({
      type: "info",
      message: "Weekends typically see 15–20% lower attendance. Consider reducing portions.",
    });
  }
  if (mockRainy) {
    suggestions.push({
      type: "info",
      message: "Rainy weather usually increases indoor dining. Plan for 10% more servings.",
    });
  }

  const avgLeftover =
    meals.length > 0
      ? meals.reduce((s, m) => s + (m.leftoverMeals ?? 0), 0) / meals.length
      : 0;

  if (avgLeftover > 10) {
    suggestions.push({
      type: "warning",
      message: `Average leftover is ${avgLeftover.toFixed(0)} meals/day. Reduce cooking by 10% tomorrow.`,
    });
  } else if (avgLeftover > 5) {
    suggestions.push({
      type: "tip",
      message: "Moderate leftovers detected. Consider adjusting portion sizes slightly.",
    });
  }

  const todayStart = getTodayStart();
  const confirmations = await db
    .select()
    .from(mealConfirmationsTable)
    .where(gte(mealConfirmationsTable.mealDate, todayStart.toISOString().split("T")[0]));

  const willEatCount = confirmations.filter((c) => c.willEat).length;
  const wonEatCount = confirmations.filter((c) => !c.willEat).length;
  if (confirmations.length > 0) {
    suggestions.push({
      type: "info",
      message: `${willEatCount} residents confirmed for today, ${wonEatCount} opted out.`,
    });
  }

  const feedbacks = await db
    .select()
    .from(feedbackTable)
    .where(gte(feedbackTable.mealDate, weekStart.toISOString().split("T")[0]))
    .orderBy(desc(feedbackTable.id))
    .limit(10);

  if (feedbacks.length > 0) {
    const avgRating =
      feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length;
    if (avgRating < 3) {
      suggestions.push({
        type: "warning",
        message: `Recent meal ratings are low (avg ${avgRating.toFixed(1)}/5). Review menu quality.`,
      });
    } else if (avgRating >= 4) {
      suggestions.push({
        type: "tip",
        message: `Great feedback this week! Average rating: ${avgRating.toFixed(1)}/5. Keep it up.`,
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: "tip",
      message: "All looking good! Keep tracking meals daily to unlock more insights.",
    });
  }

  const weatherNote = weekend
    ? "Prediction adjusted: weekend attendance expected lower."
    : "Prediction based on historical attendance trends.";

  return res.json({ suggestions, weatherNote, weekend, rainy: mockRainy });
});

router.get("/intelligence/resident-impact", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });

  const userId = req.session.userId;
  const weekStart = getWeekStart();

  const confirmations = await db
    .select()
    .from(mealConfirmationsTable)
    .where(eq(mealConfirmationsTable.residentId, userId));

  const weekConfirmations = confirmations.filter(
    (c) => new Date(c.mealDate) >= weekStart,
  );

  const willEatThisWeek = weekConfirmations.filter((c) => c.willEat).length;
  const totalConfirmed = confirmations.filter((c) => c.willEat).length;

  const mealsContributed = totalConfirmed;
  const foodSavedKg = parseFloat((mealsContributed * 0.35).toFixed(1));
  const co2SavedKg = parseFloat((mealsContributed * 0.6).toFixed(1));

  return res.json({
    mealsContributed,
    foodSavedKg,
    co2SavedKg,
    thisWeekConfirmed: willEatThisWeek,
    totalResponses: confirmations.length,
  });
});

router.get("/intelligence/ngo-impact", async (req, res) => {
  const weekStart = getWeekStart();

  const allRequests = await db.select().from(ngoRequestsTable);
  const weekRequests = allRequests.filter(
    (r) => new Date(r.createdAt) >= weekStart,
  );

  const totalMealsCollected = allRequests
    .filter((r) => r.status === "accepted" || r.status === "completed")
    .reduce((s, r) => s + r.availableMeals, 0);

  const totalPickups = allRequests.filter(
    (r) => r.status === "accepted" || r.status === "completed",
  ).length;

  const weekMeals = weekRequests
    .filter((r) => r.status === "accepted" || r.status === "completed")
    .reduce((s, r) => s + r.availableMeals, 0);

  const weekPickups = weekRequests.filter(
    (r) => r.status === "accepted" || r.status === "completed",
  ).length;

  const pendingRequests = allRequests.filter((r) => r.status === "pending").length;

  return res.json({
    totalMealsCollected,
    totalPickups,
    weekMeals,
    weekPickups,
    pendingRequests,
    co2Prevented: parseFloat((totalMealsCollected * 0.6).toFixed(1)),
  });
});

router.post("/ngo/requests/:id/complete", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const id = parseInt(req.params.id);

  const [updated] = await db
    .update(ngoRequestsTable)
    .set({ status: "completed" })
    .where(eq(ngoRequestsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Request not found" });

  return res.json({
    id: updated.id,
    pgName: updated.pgName,
    pgLocation: updated.pgLocation,
    availableMeals: updated.availableMeals,
    pickupTime: updated.pickupTime,
    status: updated.status,
    createdAt:
      updated.createdAt instanceof Date
        ? updated.createdAt.toISOString()
        : updated.createdAt,
    mealMenu: updated.mealMenu ?? undefined,
  });
});

router.get("/intelligence/global-impact", async (_req, res) => {
  const allMeals = await db.select().from(mealsTable);
  const allNgoReqs = await db.select().from(ngoRequestsTable);
  const allConfirmations = await db.select().from(mealConfirmationsTable);

  const totalMealsSaved = allMeals.reduce(
    (s, m) =>
      s + Math.max(0, (m.predictedMeals ?? 0) - (m.leftoverMeals ?? 0)),
    0,
  );

  const totalWasteKg = parseFloat(
    (
      allMeals.reduce((s, m) => s + (m.leftoverMeals ?? 0), 0) * 0.35
    ).toFixed(1),
  );

  const totalNgoPickups = allNgoReqs.filter(
    (r) => r.status === "accepted" || r.status === "completed",
  ).length;

  const totalMealsRedistributed = allNgoReqs
    .filter((r) => r.status === "accepted" || r.status === "completed")
    .reduce((s, r) => s + r.availableMeals, 0);

  const totalResidentResponses = allConfirmations.filter((c) => c.willEat).length;
  const co2Prevented = parseFloat((totalMealsSaved * 0.6).toFixed(1));

  return res.json({
    totalMealsSaved,
    totalWasteKg,
    totalNgoPickups,
    totalMealsRedistributed,
    totalResidentResponses,
    co2Prevented,
  });
});

export default router;
