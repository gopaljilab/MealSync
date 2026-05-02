import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

router.get("/pgs", async (_req, res) => {
  const owners = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      pgName: usersTable.pgName,
    })
    .from(usersTable)
    .where(eq(usersTable.role, "owner"));

  return res.json(
    owners
      .filter((owner) => owner.pgName)
      .map((owner) => ({
        id: owner.id,
        name: owner.name,
        pgName: owner.pgName,
      })),
  );
});

router.post("/auth/register", async (req, res) => {
  const parse = RegisterBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { email, password, name, role } = parse.data;
  const pgName = parse.data.pgName?.trim();

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    return res.status(400).json({ error: "Email already registered" });
  }

  if (role === "owner") {
    if (!pgName) {
      return res.status(400).json({ error: "PG name is required" });
    }

    const existingPg = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.role, "owner"), eq(usersTable.pgName, pgName)))
      .limit(1);

    if (existingPg.length > 0) {
      return res.status(400).json({ error: "PG is already registered" });
    }
  }

  if (role === "resident") {
    if (!pgName) {
      return res.status(400).json({ error: "Please select your PG" });
    }

    const [pgOwner] = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.role, "owner"), eq(usersTable.pgName, pgName)))
      .limit(1);

    if (!pgOwner) {
      return res.status(400).json({ error: "Selected PG is not registered" });
    }
  }

  const [user] = await db
    .insert(usersTable)
    .values({ email, password, name, role, pgName: pgName ?? null })
    .returning();

  req.session.userId = user.id;

  return res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, pgName: user.pgName },
    message: "Registered successfully",
  });
});

router.post("/auth/login", async (req, res) => {
  const parse = LoginBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const { email, password } = parse.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  req.session.userId = user.id;

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, pgName: user.pgName },
    message: "Logged in successfully",
  });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {});
  return res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, pgName: user.pgName });
});

export default router;
