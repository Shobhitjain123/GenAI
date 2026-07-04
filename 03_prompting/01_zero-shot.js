import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: "Tell me the story about Harry potter" },
    ],
  });
  console.log(response.choices[0].message.content);
}

main();
