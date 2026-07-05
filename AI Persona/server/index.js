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

app.post("/api/chat", async (req, res) => {
  const { systemPrompt, messages } = req.body;

  if (!systemPrompt || typeof systemPrompt !== "string") {
    return res.status(400).json({ error: "systemPrompt is required" });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const client = getOpenAIClient();

  if (!client) {
    return res
      .status(500)
      .json({ error: "OPENAI_API_KEY is not configured on the server" });
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No reply received from OpenAI" });
    }

    return res.json({ reply });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to get response from OpenAI";
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Persona API server running on http://localhost:${port}`);
  console.log(
    process.env.OPENAI_API_KEY
      ? "OpenAI API key loaded."
      : "Warning: OPENAI_API_KEY is missing.",
  );
  if (process.env.FRONTEND_URL) {
    console.log(`CORS allowed for: ${process.env.FRONTEND_URL}`);
  }
});
