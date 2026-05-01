import { Router } from "express";
import { db } from "@workspace/db";
import { ngoRequestsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const router = Router();

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

router.get("/ngo/requests", async (req, res) => {
  const requests = await db
    .select()
    .from(ngoRequestsTable)
    .where(eq(ngoRequestsTable.status, "pending"))
    .orderBy(ngoRequestsTable.createdAt);
  return res.json(requests.map(formatNgoRequest));
});

router.post("/ngo/requests/:id/accept", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db
    .update(ngoRequestsTable)
    .set({ status: "accepted", ngoId: req.session.userId ?? null })
    .where(eq(ngoRequestsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Request not found" });
  return res.json(formatNgoRequest(updated));
});

router.post("/ngo/requests/:id/reject", async (req, res) => {
  const id = parseInt(req.params.id);
  const [updated] = await db
    .update(ngoRequestsTable)
    .set({ status: "rejected" })
    .where(eq(ngoRequestsTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Request not found" });
  return res.json(formatNgoRequest(updated));
});

router.get("/ngo/history", async (req, res) => {
  const history = await db
    .select()
    .from(ngoRequestsTable)
    .where(
      or(
        eq(ngoRequestsTable.status, "accepted"),
        eq(ngoRequestsTable.status, "rejected"),
        eq(ngoRequestsTable.status, "completed"),
      )!,
    )
    .orderBy(ngoRequestsTable.createdAt);
  return res.json(history.map(formatNgoRequest));
});

export default router;
