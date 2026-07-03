import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

client.embeddings
  .create({
    model: "gemini-embedding-2",
    input: "Hello, how are you?",
  })
  .then((res) => {
    console.log(res.data);
  });
