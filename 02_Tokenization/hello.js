import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

client.client.chat.completions
  .create({
    model: "gemini-2.5-flash",
    messages: [{ role: "user", content: "Hello, how are you?" }],
  })
  .then((res) => {
    console.log(res.choices[0].message.content);
  });
