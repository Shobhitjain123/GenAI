import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios";
import { exec } from "child_process";
dotenv.config();
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getWeatherData(cityName) {
  const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: { "User-Agent": "curl/7.68.0" },
    });
    return JSON.stringify({ cityName, weatherInfo: response.data });
  } catch (err) {
    return JSON.stringify({
      cityName,
      weatherInfo: `Unavailable (${err.code || err.message})`,
    });
  }
}

async function executeCommandOnCli(command) {
  return new Promise((res, rej) => {
    exec(command, (err, out) => {
      if (err) {
        res(`There was an error: ${err}`);
      } else {
        return res(out);
      }
    });
  });
}

const SYSTEM_PROMPT = `
  You are an expert AI engineer. Only and only answer questions related to coding and engineering.

  Persona: You are a senior software developer.
  Persona Traits:
  - You always sound technical and use jargon.
  - You never answer back on personal things and you don't have a personal life
  - All you know is how and what code is
  
  
  You have to analyse the user input carefully, and then you need to break down the problem into multiple sub-problems before coming to some final result. 
  Always break down the user's intentions and how to solve that problem and then step by step solve it.

  We are going to follow a pipeline of "INITIAL", "THINK", "TOOL_REQUEST", "ANALYZE" and "OUTPUT" pipeline.

  The Pipeline:
    - "INITIAL": When a user gives an input, we will have an initial thought process on what this user is trying to do.
    - "THINK": We are going to think about how to solve this and then start to breakdown the problem.
    - "ANALYZE": This is where we will analyse the solution and also verify if the output is correct.
    - "THINK": We can go back to think mode where we now see if any sub-problem remains and think again.
    - "ANALYZE": Again, analyse the problem and get onto a solution.
    - "TOOL_REQUEST": Use this for calling or requesting a tool, the format of output would be
      {"step": "TOOL_REQUEST", functionName: "getWeatherData", "input": "Goa"}
    - "OUTPUT": This is where we can end and give the final output to the user.

    Available Tools:
    - "getWeatherData": getWeatherData(cityName: string): Returns the realtime weather infotmation of city
    - "executeCommandOnCli": executeCommandOnCli(command: string): Executes the command on the CLI and returns the output from stdout.

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

     Example:
     - "USER": What is rather the goa?

     OUTPUT:
     - "INITIAL": The user wants me to fetch weather information of
     - "THINK": From the tools, I can see we have a tool named GetWeatherData which can be called.
     - "ANALYZE": We are going right. We can call getWeatherData with "GOA" as input.
     - "TOOL_REQUEST": Tool Call is happening {"functionName": "getWeatherData","text": "Calling getWeatherData for Goa", "input": "goa"}
     - "TOOL_OUTPUT": The weather of Goa is sunny with 30°C.
     - "THINK": We got the weather info.
     - "OUTPUT": The weather of Goa is sunny, with some 30°C. It's going to be hot.

     Output Format:
     {"step": "INITIAL" | "THINK" | "TOOL_REQUEST" | "ANALYZE" | "OUTPUT", "text": <The Actual Text>, "functionName": "<NAME OF FUNCTION>", "input": "INPUT PARAMS of function}
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

    if (parsedResult.step.toUpperCase() === "TOOL_REQUEST") {
      const { functionName, input } = parsedResult;
      switch (functionName) {
        case "executeCommandOnCli": {
          const toolResult = await executeCommandOnCli(input);
          MESSAGE_DB.push({
            role: "developer",
            content: JSON.stringify({
              step: "TOOL_OUTPUT",
              output: toolResult,
            }),
          });
          continue;
        }
        case "getWeatherData":
          {
            const toolResult = await getWeatherData(input);
            console.log(`(${functionName}): ${input}`, toolResult);
            MESSAGE_DB.push({
              role: "developer",
              content: JSON.stringify({
                step: "TOOL_OUTPUT",
                output: toolResult,
              }),
            });
            continue;
          }
          break;
      }
    }
  }
}

// main(
//   "What is current weather of DELHI, Meerut and Mumbai and then give the output in a beautifull webpage, create a folder weather and HTML and CSS and the run the webpage on my browser",
// );

main(
  "What is meaning of life?, I am asking this because I need to write this in an html file for my web dev project. ",
);
