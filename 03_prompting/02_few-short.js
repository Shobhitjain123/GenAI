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
      {
        role: "user",
        content: `
        Tell me what is 2 + 1003?

        Instructions:
          - Do not add anything else in the output, it should be exactly like the Expected output in the given sample examples
        Examples:
          - Whats 2 + 4 equals?
            Expected Output: 4 (Four)
          - Whats 2 + 5 equals?
            Expected Output: 7 (Seven)
        `,
      },
    ],
  });
  console.log(response.choices[0].message.content);
}

main();
