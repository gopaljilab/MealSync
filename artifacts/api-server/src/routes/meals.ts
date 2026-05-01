import { Router } from "express";
import { db } from "@workspace/db";
import { mealsTable, ngoRequestsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { CreateMealBody, ReportLeftoverBody } from "@workspace/api-zod";

const router = Router();

function requireOwner(req: any, res: any, next: any) {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

router.get("/meals", requireOwner, async (req, res) => {
  const meals = await db
    .select()
    .from(mealsTable)
    .where(eq(mealsTable.ownerId, req.session.userId!))
    .orderBy(mealsTable.date);
  return res.json(meals.map(formatMeal));
});

router.post("/meals", requireOwner, async (req, res) => {
  const parse = CreateMealBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { menu, expectedPeople } = parse.data;

  const [meal] = await db
    .insert(mealsTable)
    .values({ ownerId: req.session.userId!, menu, expectedPeople })
    .returning();

  return res.status(201).json(formatMeal(meal));
});

router.post("/meals/:id/predict", requireOwner, async (req, res) => {
  const id = parseInt(req.params.id);
  const [meal] = await db.select().from(mealsTable).where(eq(mealsTable.id, id)).limit(1);
  if (!meal) return res.status(404).json({ error: "Meal not found" });

  const predictedMeals = Math.round(meal.expectedPeople * 0.9);
  await db.update(mealsTable).set({ predictedMeals }).where(eq(mealsTable.id, id));

  return res.json({
    predictedMeals,
    confidence: 0.9,
    message: `Predicted ${predictedMeals} meals for ${meal.menu}`,
  });
});

router.post("/meals/:id/leftover", requireOwner, async (req, res) => {
  const id = parseInt(req.params.id);
  const parse = ReportLeftoverBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const { leftoverMeals, actualServed } = parse.data;
  const [meal] = await db
    .update(mealsTable)
    .set({ leftoverMeals, actualServed, status: "served" })
    .where(eq(mealsTable.id, id))
    .returning();

  return res.json(formatMeal(meal));
});

router.post("/meals/:id/notify-ngo", requireOwner, async (req, res) => {
  const id = parseInt(req.params.id);
  const [meal] = await db.select().from(mealsTable).where(eq(mealsTable.id, id)).limit(1);
  if (!meal) return res.status(404).json({ error: "Meal not found" });

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);

  const pickupTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const [ngoReq] = await db
    .insert(ngoRequestsTable)
    .values({
      mealId: id,
      pgName: owner.pgName ?? owner.name,
      pgLocation: "Koramangala, Bangalore",
      availableMeals: meal.leftoverMeals ?? 0,
      pickupTime,
      mealMenu: meal.menu,
      status: "pending",
    })
    .returning();

  await db.update(mealsTable).set({ ngoNotified: true }).where(eq(mealsTable.id, id));

  return res.json(formatNgoRequest(ngoReq));
});

function formatMeal(meal: any) {
  return {
    id: meal.id,
    menu: meal.menu,
    expectedPeople: meal.expectedPeople,
    predictedMeals: meal.predictedMeals ?? undefined,
    actualServed: meal.actualServed ?? undefined,
    leftoverMeals: meal.leftoverMeals ?? undefined,
    date: meal.date instanceof Date ? meal.date.toISOString() : meal.date,
    ngoNotified: meal.ngoNotified,
    status: meal.status,
  };
}

function formatNgoRequest(req: any) {
  return {
    id: req.id,
    pgName: req.pgName,
    pgLocation: req.pgLocation,
    availableMeals: req.availableMeals,
    pickupTime: req.pickupTime,
    status: req.status,
    createdAt: req.createdAt instanceof Date ? req.createdAt.toISOString() : req.createdAt,
    mealMenu: req.mealMenu ?? undefined,
  };
}

export default router;
