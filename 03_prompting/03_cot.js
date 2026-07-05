import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
  You are an expert AI engineer. You have to analyse the user input carefully, and then you need to break down the problem into multiple sub-problems before coming to some final result. 
  Always break down the user's intentions and how to solve that problem and then step by step solve it.

  We are going to follow a pipeline of "INITIAL", "THINK", "ANALYZE" and "OUTPUT" pipeline.

  The Pipeline:
    - "INITIAL": When a user gives an input, we will have an initial thought process on what this user is trying to do.
    - "THINK": We are going to think about how to solve this and then start to breakdown the problem.
    - "ANALYZE": This is where we will analyse the solution and also verify if the output is correct.
    - "THINK": We can go back to think mode where we now see if any sub-problem remains and think again.
    - "ANALYZE": Again, analyse the problem and get onto a solution.
    - "OUTPUT": This is where we can end and give the final output to the user.

    Rules:
      - Alwaus output wait for one step at a time and wait for the other step before proceeding.
      - Always maintain the sequence of the pipeline as given in the example.
      - Follow the JSON output format strictly.

    Example: 
    - "USER": What is 2 + 2 -5 * 10 / 3?

    OUTPUT: 
     - "INITIAL": The user wants me to solve a math question.
     - "THINK": I will use the board mass formula, and based on that I should first multiply 5*10, which is 50.
     - "ANALYZE": Right, yes, the board mask is actually right, and now the equation is 2 + 2 - 50 / 3.
     - "THINK": Now, as per rule, I should perform divide, which is dividing 50/3, which is 16.6666
     - "ANALYZE": Now the new equation remains 2+2-16.6666
     - "THINK": Now it's simple. We can just do 2+2=4 and a new equation 4 - 16.6666
     - "ANALYZE": Great, now let's just do the final step as simple subtraction.
     - "THINK": After the final subtraction, the answer remains -12.6666
     - "OUTPUT": Final output is: -12.6666

     Output Format:
     {"step": "INITIAL" | "THINK" | "ANALYZE" | "OUTPUT", "text": <The Actual Text>}
`;

const MESSAGE_DB = [{ role: "system", content: SYSTEM_PROMPT }];

async function main(prompt = "") {
  MESSAGE_DB.push({ role: "user", content: prompt });

  while (true) {
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: MESSAGE_DB,
    });

    const rawResult = response.choices[0].message.content;
    const parsedResult = JSON.parse(rawResult);

    MESSAGE_DB.push({ role: "assistant", content: rawResult });

    console.log(`(${parsedResult.step}): ${parsedResult.text}`);

    if (parsedResult.step.toLowerCase() === "output") break;
  }
}

main("What is current weather of meerut");
