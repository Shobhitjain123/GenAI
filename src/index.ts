const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();
console.log();

const openai = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
})

type Context = {
    role: 'user' | 'system' | 'assistant',
    content: string
}[]

const context: Context = [
    {role: "system", content: "You are a good helpful assistant"},
    {role: "user", content: "Hello, How are you"}
]

const chatCompletions = async() => {
    const response = await openai.chat.completions.create({
            messages: context,
            model: "gemini-2.0-flash"
    })

    const responseMessage = response.choices[0].message.content
    context.push({
        role: "assistant",
        content: responseMessage
    })

    console.log("Answer by Chat Assistance is", responseMessage);
    console.log("Updated Context", context);
    
        
}

async function main() {
    const input = require("prompt-sync")({ sigint: true })
    while (true) {
        const userInput = input("Enter your question") as string
        if(userInput.toLowerCase() === "exit"){
            console.log("Exiting chat")
            break;
        }

        context.push({
            role: "user",
            content: userInput
        })
        await chatCompletions()
    }
}

main()