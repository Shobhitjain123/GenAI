import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3001;

// Trust the first proxy hop (Railway/Vercel etc.) so req.ip reflects the real client IP.
app.set("trust proxy", 1);

const MAX_REQUESTS_PER_DAY = Number(process.env.MAX_REQUESTS_PER_DAY ?? 15);
const MAX_HISTORY_MESSAGES = Number(process.env.MAX_HISTORY_MESSAGES ?? 15);
const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_TOKENS = Number(process.env.MAX_TOKENS ?? 600);
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// In-memory per-IP daily usage tracker. Good enough for a small cohort deployment;
// counts reset when the process restarts and are not shared across instances.
const usageByIp = new Map();

function getUsageEntry(ip) {
  const now = Date.now();
  const entry = usageByIp.get(ip);

  if (!entry || now >= entry.resetAt) {
    const fresh = { count: 0, resetAt: now + DAY_IN_MS };
    usageByIp.set(ip, fresh);
    return fresh;
  }

  return entry;
}

function toUsagePayload(entry) {
  return {
    limit: MAX_REQUESTS_PER_DAY,
    remaining: Math.max(0, MAX_REQUESTS_PER_DAY - entry.count),
    resetAt: new Date(entry.resetAt).toISOString(),
  };
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/usage", (req, res) => {
  const usage = getUsageEntry(req.ip);
  res.json({ usage: toUsagePayload(usage) });
});

app.post("/api/chat", async (req, res) => {
  const { systemPrompt, messages } = req.body;

  if (!systemPrompt || typeof systemPrompt !== "string") {
    return res.status(400).json({ error: "systemPrompt is required" });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const usage = getUsageEntry(req.ip);

  if (usage.count >= MAX_REQUESTS_PER_DAY) {
    return res.status(429).json({
      error: `Daily chat limit reached (${MAX_REQUESTS_PER_DAY} messages/day). Please try again after ${new Date(
        usage.resetAt,
      ).toLocaleString()}.`,
      usage: toUsagePayload(usage),
    });
  }

  const client = getOpenAIClient();

  if (!client) {
    return res
      .status(500)
      .json({ error: "OPENAI_API_KEY is not configured on the server" });
  }

  // Count the attempt before calling OpenAI so the credit is protected even if the
  // request fails partway through (retries, timeouts, etc. still consume the slot).
  usage.count += 1;

  try {
    const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);

    const response = await client.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "system", content: systemPrompt }, ...recentMessages],
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "No reply received from OpenAI",
        usage: toUsagePayload(usage),
      });
    }

    return res.json({ reply, usage: toUsagePayload(usage) });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get response from OpenAI";
    return res
      .status(500)
      .json({ error: message, usage: toUsagePayload(usage) });
  }
});

app.listen(port, () => {
  console.log(`Persona API server running on http://localhost:${port}`);
  console.log(
    process.env.OPENAI_API_KEY
      ? "OpenAI API key loaded."
      : "Warning: OPENAI_API_KEY is missing.",
  );
  console.log(
    `Model: ${CHAT_MODEL} | max_tokens: ${MAX_TOKENS} | history window: ${MAX_HISTORY_MESSAGES} | limit: ${MAX_REQUESTS_PER_DAY} msgs/day/IP`,
  );
  if (process.env.FRONTEND_URL) {
    console.log(`CORS allowed for: ${process.env.FRONTEND_URL}`);
  }
});
