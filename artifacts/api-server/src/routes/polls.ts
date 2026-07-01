import { Router } from "express";
import { db } from "@workspace/db";
import { pollsTable, pollVotesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/polls", async (_req, res) => {
  const polls = await db.select().from(pollsTable).orderBy(pollsTable.createdAt);
  const result = [];
  for (const poll of polls) {
    const votes = await db
      .select()
      .from(pollVotesTable)
      .where(eq(pollVotesTable.pollId, poll.id));
    const options = JSON.parse(poll.options) as string[];
    const tally: Record<string, number> = {};
    for (const opt of options) tally[opt] = 0;
    for (const v of votes) {
      tally[v.option] = (tally[v.option] ?? 0) + 1;
    }
    result.push({
      id: poll.id,
      question: poll.question,
      options,
      tally,
      totalVotes: votes.length,
      createdAt: poll.createdAt.toISOString(),
      expiresAt: poll.expiresAt?.toISOString() ?? null,
    });
  }
  return res.json(result);
});

router.post("/polls", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const { question, options, expiresAt } = req.body as {
    question: string;
    options: string[];
    expiresAt?: string;
  };
  if (!question || !options?.length) {
    return res.status(400).json({ error: "question and options are required" });
  }
  const [poll] = await db
    .insert(pollsTable)
    .values({
      question,
      options: JSON.stringify(options),
      createdBy: req.session.userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  return res.status(201).json({
    id: poll.id,
    question: poll.question,
    options,
    tally: Object.fromEntries(options.map((o) => [o, 0])),
    totalVotes: 0,
    createdAt: poll.createdAt.toISOString(),
    expiresAt: poll.expiresAt?.toISOString() ?? null,
  });
});

router.post("/polls/:id/vote", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: "Not authenticated" });
  const pollId = parseInt(req.params.id);
  const { option } = req.body as { option: string };
  if (!option) return res.status(400).json({ error: "option required" });

  const [poll] = await db
    .select()
    .from(pollsTable)
    .where(eq(pollsTable.id, pollId))
    .limit(1);
  if (!poll) return res.status(404).json({ error: "Poll not found" });

  const options = JSON.parse(poll.options) as string[];
  if (!options.includes(option)) {
    return res.status(400).json({ error: "Invalid option" });
  }

  const existing = await db
    .select()
    .from(pollVotesTable)
    .where(
      and(eq(pollVotesTable.pollId, pollId), eq(pollVotesTable.userId, req.session.userId)),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(pollVotesTable)
      .set({ option })
      .where(eq(pollVotesTable.id, existing[0].id));
  } else {
    await db
      .insert(pollVotesTable)
      .values({ pollId, userId: req.session.userId, option });
  }

  return res.json({ message: "Vote recorded", option });
});

export default router;
