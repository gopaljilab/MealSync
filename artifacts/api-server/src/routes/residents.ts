import { Router } from "express";
import { db } from "@workspace/db";
import { mealConfirmationsTable, feedbackTable, mealsTable, usersTable } from "@workspace/db";
import { ConfirmMealBody, SubmitFeedbackBody } from "@workspace/api-zod";
import { desc, gte, and, eq } from "drizzle-orm";

const router = Router();

router.get("/residents/today-menu", async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [resident] = req.session.userId
    ? await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1)
    : [];

  const meals = await db
    .select()
    .from(mealsTable)
    .where(gte(mealsTable.date, todayStart))
    .orderBy(desc(mealsTable.date))
    .limit(5);

  const ownerIds =
    resident?.role === "resident" && resident.pgName
      ? (
          await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(and(eq(usersTable.role, "owner"), eq(usersTable.pgName, resident.pgName)))
        ).map((owner) => owner.id)
      : [];

  const visibleMeals = ownerIds.length > 0 ? meals.filter((meal) => ownerIds.includes(meal.ownerId)) : meals;

  return res.json(
    visibleMeals.map((m) => ({
      id: m.id,
      menu: m.menu,
      expectedPeople: m.expectedPeople,
      date: m.date instanceof Date ? m.date.toISOString() : m.date,
    })),
  );
});

router.post("/residents/confirm-meal", async (req, res) => {
  const parse = ConfirmMealBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { willEat, mealDate } = parse.data;

  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const residentId = req.session.userId;

  const [confirmation] = await db
    .insert(mealConfirmationsTable)
    .values({ residentId, willEat, mealDate })
    .returning();

  return res.json({
    id: confirmation.id,
    willEat: confirmation.willEat,
    mealDate: confirmation.mealDate,
    message: willEat ? "Great! Your meal has been confirmed." : "Got it, we'll plan accordingly.",
  });
});

router.post("/residents/feedback", async (req, res) => {
  const parse = SubmitFeedbackBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });
  const { rating, comment, mealDate } = parse.data;

  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const residentId = req.session.userId;

  const [fb] = await db
    .insert(feedbackTable)
    .values({ residentId, rating, comment: comment ?? null, mealDate })
    .returning();

  return res.json({
    id: fb.id,
    rating: fb.rating,
    comment: fb.comment ?? undefined,
    mealDate: fb.mealDate,
    message: "Thank you for your feedback!",
  });
});

export default router;
