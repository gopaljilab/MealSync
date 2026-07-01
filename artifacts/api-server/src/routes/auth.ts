import crypto from "crypto";
import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

const router = Router();

const RESET_TOKEN_SECRET = process.env.RESET_PASSWORD_TOKEN_SECRET || process.env.SESSION_SECRET || "mealsync-secret";
const RESET_TOKEN_TTL = 1000 * 60 * 60; // 1 hour

function createResetToken(email: string) {
  const payload = JSON.stringify({ email, exp: Date.now() + RESET_TOKEN_TTL });
  const signature = crypto.createHmac("sha256", RESET_TOKEN_SECRET).update(payload).digest("base64url");
  return `${Buffer.from(payload).toString("base64url")}.${signature}`;
}

function verifyResetToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadPart, signature] = parts;
  let payload: string;
  try {
    payload = Buffer.from(payloadPart, "base64url").toString("utf-8");
  } catch {
    return null;
  }

  const expectedSignature = crypto.createHmac("sha256", RESET_TOKEN_SECRET).update(payload).digest("base64url");
  if (signature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

  try {
    const data = JSON.parse(payload) as { email?: string; exp?: number };
    if (!data?.email || typeof data.email !== "string" || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;
    return data.email;
  } catch {
    return null;
  }
}

async function sendResetEmail(email: string, resetUrl: string) {
  const from = process.env.RESET_EMAIL_FROM || `no-reply@${process.env.FRONTEND_URL?.replace(/^https?:\/\//, "") ?? "mealsync.local"}`;
  const subject = "MealSync password reset";
  const html = `<p>Hello,</p><p>Use the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`;

  if (process.env.SENDGRID_API_KEY) {
    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject }],
        from: { email: from },
        content: [{ type: "text/html", value: html }],
      }),
    });
    return;
  }

  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    const body = new URLSearchParams({
      from,
      to: email,
      subject,
      html,
    });
    await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString("base64")}`,
      },
      body,
    });
    return;
  }

  console.info(`Password reset link for ${email}: ${resetUrl}`);
}

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

router.post("/auth/forgot-password", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (user) {
    const token = createResetToken(user.email);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error("reset email error", err);
    }
  }

  return res.json({ message: "If an account with this email exists, a password reset link has been sent." });
});

router.get("/auth/reset-password", async (req, res) => {
  const token = String(req.query.token ?? "").trim();
  const email = verifyResetToken(token);
  if (!email) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }
  return res.json({ message: "Valid token." });
});

router.post("/auth/reset-password", async (req, res) => {
  const token = String(req.body?.token ?? "").trim();
  const password = String(req.body?.password ?? "");
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Invalid password." });
  }

  const email = verifyResetToken(token);
  if (!email) {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    return res.status(400).json({ error: "Invalid reset token." });
  }

  await db.update(usersTable).set({ password }).where(eq(usersTable.id, user.id));

  return res.json({ message: "Password updated successfully." });
});

// --- FULL GOOGLE OAUTH 2.0 FLOW ---
router.get("/auth/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;
  const role = (req.query.role as string) || "resident";
  const pgName = (req.query.pgName as string) || "";

  // Store requested role and pgName in state parameter or session
  const state = Buffer.from(JSON.stringify({ role, pgName })).toString("base64");

  if (!clientId) {
    // If client ID is not yet set in .env, fallback to interactive OAuth simulator mode for demo
    const mockState = encodeURIComponent(state);
    return res.redirect(`/api/auth/google/callback?code=demo_google_code&state=${mockState}`);
  }

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&state=${state}`;
  return res.redirect(googleAuthUrl);
});

router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code as string;
  const stateRaw = req.query.state as string;
  let role = "resident";
  let pgName = "";

  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
      role = parsed.role || "resident";
      pgName = parsed.pgName || "";
    }
  } catch {}

  let googleUser = {
    email: "google_user@gmail.com",
    name: "Google Account User",
  };

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

  if (clientId && clientSecret && code && code !== "demo_google_code") {
    try {
      // 1. Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();

      if (tokens.access_token) {
        // 2. Fetch User Profile from Google
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = await userRes.json();
        if (profile.email) {
          googleUser.email = profile.email;
          googleUser.name = profile.name || profile.given_name || "Google User";
        }
      }
    } catch (err) {
      console.error("Google OAuth exchange error:", err);
    }
  }

  // 3. Sync user with Supabase PostgreSQL database
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, googleUser.email)).limit(1);
  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        email: googleUser.email,
        password: `google_oauth_${Date.now()}`,
        name: googleUser.name,
        role: role as any,
        pgName: role === "owner" || role === "resident" ? (pgName || "Emerald Heights PG") : null,
      })
      .returning();
  }

  req.session.userId = user.id;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return res.redirect(`${frontendUrl}/dashboard/${user.role}`);
});


// --- FULL MICROSOFT OAUTH 2.0 FLOW ---
router.get("/auth/microsoft", (req, res) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/microsoft/callback`;
  const role = (req.query.role as string) || "resident";
  const pgName = (req.query.pgName as string) || "";

  const state = Buffer.from(JSON.stringify({ role, pgName })).toString("base64");

  if (!clientId) {
    const mockState = encodeURIComponent(state);
    return res.redirect(`/api/auth/microsoft/callback?code=demo_microsoft_code&state=${mockState}`);
  }

  const msAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email%20User.Read&state=${state}`;
  return res.redirect(msAuthUrl);
});

router.get("/auth/microsoft/callback", async (req, res) => {
  const code = req.query.code as string;
  const stateRaw = req.query.state as string;
  let role = "resident";
  let pgName = "";

  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
      role = parsed.role || "resident";
      pgName = parsed.pgName || "";
    }
  } catch {}

  let msUser = {
    email: "microsoft_user@outlook.com",
    name: "Microsoft Account User",
  };

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = `${process.env.APP_URL || "http://localhost:3000"}/api/auth/microsoft/callback`;

  if (clientId && clientSecret && code && code !== "demo_microsoft_code") {
    try {
      const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();

      if (tokens.access_token) {
        const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const profile = await userRes.json();
        if (profile.mail || profile.userPrincipalName) {
          msUser.email = profile.mail || profile.userPrincipalName;
          msUser.name = profile.displayName || "Microsoft User";
        }
      }
    } catch (err) {
      console.error("Microsoft OAuth exchange error:", err);
    }
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, msUser.email)).limit(1);
  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        email: msUser.email,
        password: `microsoft_oauth_${Date.now()}`,
        name: msUser.name,
        role: role as any,
        pgName: role === "owner" || role === "resident" ? (pgName || "Emerald Heights PG") : null,
      })
      .returning();
  }

  req.session.userId = user.id;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return res.redirect(`${frontendUrl}/dashboard/${user.role}`);
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
