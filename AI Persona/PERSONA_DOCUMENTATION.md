# Persona Strategy, Prompting, and Context Management

This document explains how the AI persona data is collected, prepared, converted into system prompts, and used during chat. The goal of the project is not only to make the model answer questions, but to make it answer in a way that feels consistent with the selected persona's public communication style.

## Objective

The application creates AI personas from publicly observable communication patterns. Each persona is represented through a structured system prompt containing:

- Background and expertise
- Persona traits
- Speaking style and language patterns
- Reply examples
- Behavioral instructions
- Resource links
- Safety and topic boundaries

At runtime, the selected persona prompt is sent as the system message, followed by the current conversation history for that persona.

## Persona Data Collection Strategy

Persona quality depends heavily on the examples used during preparation. For this project, a broad collection of public examples was gathered for each persona so the final prompt could capture not just facts about the person, but also their tone, habits, and response patterns.

The collected sources included:

- YouTube videos
- Twitter/X replies
- YouTube comment replies
- Live stream transcripts

Each source type helps with a different part of the persona.

YouTube videos are useful for long-form explanations. They show how the persona introduces a topic, explains complex ideas, uses analogies, transitions between points, motivates learners, and balances technical depth with casual language.

Twitter/X replies are useful for short-form communication. They reveal how the persona responds quickly, handles direct questions, uses humor or sarcasm, shares opinions, and keeps replies concise.

YouTube replies are useful for student-facing support. They show how the persona responds to requests, doubts, course questions, project ideas, and common learner confusion.

Live stream transcripts are useful for natural conversational flow. They show filler words, repeated phrases, live Q&A behavior, spontaneous examples, and how the persona talks when interacting directly with an audience.

## Data Preparation Approach

After collecting raw examples, the data was not copied directly into the application as a dataset. Instead, it was analyzed and compressed into a system prompt. This keeps the runtime simple and makes the persona behavior easier to control.

The preparation process followed these steps.

1. Collect public examples from multiple formats.

The examples were gathered across long-form and short-form content so the prompt would not overfit to one platform. A YouTube explanation, a Twitter reply, and a live stream answer usually have different lengths and levels of detail, so all of them help build a more complete voice profile.

2. Separate facts from style.

Facts include work background, domains of expertise, courses, channels, communities, and public resources. Style includes tone, sentence patterns, preferred words, humor, analogies, language mix, and how the persona gives advice.

Keeping facts and style separate is important because the model needs both. Facts make the answer useful. Style makes the answer feel like the selected persona.

3. Extract persona traits.

Repeated behavior across examples was converted into persona traits. For example, if a persona repeatedly encourages students to build projects, focus on fundamentals, avoid hype, or stay consistent, those patterns become explicit traits in the prompt.

4. Extract language style.

Common phrases, tone, and structure were identified from examples. This includes whether the persona uses Hinglish, casual English, short replies, long explanations, analogies, direct advice, humor, or motivational framing.

5. Create example interactions.

Representative examples were converted into small student/persona exchanges. These examples act as style anchors. They show the model how the persona should reply when a user asks a practical question.

6. Add instructions and constraints.

Instructions tell the model how to behave across all replies. Constraints keep the persona consistent and prevent unwanted behavior, such as drifting into unrelated personal, political, or religious discussion when that does not match the persona's public communication style.

7. Add resources.

Useful public links are added to the prompt so the persona can provide relevant links when the user asks about courses, channels, cohorts, GitHub, Twitter/X, or other official resources.

## Prompt Structure

The persona prompt is written as a structured system prompt rather than a paragraph. This makes the intended behavior easier for the model to follow.

A good persona prompt in this project contains the following sections:

- Identity: who the persona is and what role they are playing.
- Background: professional experience, public work, teaching areas, and domains of expertise.
- Persona traits: consistent behavior patterns and values.
- Instructions: rules for how to answer.
- Language style: words, phrases, tone, and rhythm to use or avoid.
- Examples: sample user messages and ideal persona-style replies.
- Resources: links the persona can share when relevant.
- Boundaries: topics or behavior the persona should avoid.

The Hitesh persona in `src/personas.ts` follows this structure. It includes a background section, persona traits, instructions, language style, examples, and resources.

## Prompting Strategies Used

The project uses several prompting strategies together.

### Role Prompting

The system prompt explicitly assigns the model a role:

```text
You are Hitesh...
```

This gives the model a clear identity before it sees the user message. The rest of the prompt then explains how that role should behave.

### Trait-Based Prompting

Instead of relying only on examples, important behavioral traits are written directly. This makes the persona more stable across different user questions.

For example, traits can specify that the persona:

- Explains technical concepts in simple language.
- Encourages project-based learning.
- Avoids chasing every new technology trend.
- Uses analogies from familiar topics.
- Keeps a calm and student-friendly tone.

### Style Prompting

The prompt includes language rules such as tone, common words, and words to avoid. This is especially important for personas that use Hinglish or a very recognizable conversational pattern.

For example, the Hitesh prompt guides the model to use a casual Hinglish tone, occasionally use phrases like "Hanji", avoid group greetings when talking to one user, and prefer "ham" or "hamara" over "mai" or "mera".

### Few-Shot Prompting

Short example conversations are included in the prompt. These examples demonstrate the expected answer style better than abstract rules alone.

Few-shot examples help the model understand:

- How long a reply should be.
- How direct or motivational the response should feel.
- How to answer student doubts.
- How to recommend resources without sounding too formal.
- How to maintain the persona's language style.

### Instruction Prompting

The system prompt includes direct instructions that control behavior in common cases. For example, when a user asks about a course or topic that the persona teaches, the model is instructed to first mention the relevant persona/team resource and then remind the user that other internet resources are also available.

This gives the persona a consistent response strategy without making the answer feel like advertising only.

### Resource-Aware Prompting

The prompt includes official resources such as course pages, YouTube channels, Twitter/X, GitHub, and Udemy links. The model is instructed to use those links when relevant.

This improves utility because the persona can answer both conversational questions and practical "where can I learn this?" questions.

### Boundary Prompting

The prompt includes boundaries around topics that the persona should not engage with deeply. This keeps responses aligned with the intended public persona and avoids unnecessary drift.

For example, if a persona generally avoids political or religious discussion in public educational contexts, the system prompt should instruct the model to politely avoid those topics and bring the conversation back to learning, technology, or career guidance.

## System Prompt Creation

The final system prompt is created by converting collected evidence into clear model instructions.

Raw example:

```text
Student asks for a video or asks how to build confidence after finishing a course.
Persona replies with encouragement, asks the student to practice more, and suggests building projects or using the community.
```

Prepared prompt instruction:

```text
Motivate students to build more projects and consume less content. Explain that confidence comes from practice, spending time with problems, asking good questions, and staying consistent.
```

Prepared few-shot example:

```text
Student: Sir mene MERN stack ka course complete kr liya hai, kuch projects bhi banaye hai, lekin confidence nhi aata khudse project banane ke liye
Persona: Dekho Ji, practice lagti hai confidence laane ke liye...
```

This approach keeps the prompt compact while preserving the patterns found in the original examples.

## Context Management for Chats

The application manages context per persona inside the React frontend.

In `src/App.tsx`, chat history is stored as a record keyed by persona id:

```ts
Record<PersonaId, ChatMessage[]>
```

The initial history object creates a separate empty array for each persona:

```ts
{
  hitesh: [],
  piyush: []
}
```

When the user selects a persona, the app reads only that persona's messages:

```ts
const messages = histories[activePersonaId];
```

This design prevents one persona's chat from leaking into another persona's context. A user can talk to Hitesh, switch to Piyush, and start or continue a separate conversation without mixing the message histories.

## Request Flow

When a user submits a message:

1. The app trims and validates the input.
2. A user message is created with an id, role, content, and timestamp.
3. The message is appended only to the active persona's history.
4. The active persona's system prompt is selected from `PERSONAS`.
5. The active persona's messages are converted into OpenAI-compatible roles.
6. The frontend sends `{ systemPrompt, messages }` to `/api/chat`.
7. The backend places the system prompt before the chat history.
8. OpenAI generates a persona-style reply.
9. The reply is appended only to the active persona's history.

The backend call is structured like this:

```js
messages: [{ role: "system", content: systemPrompt }, ...messages]
```

This means every request includes the current persona definition as the highest-priority instruction, followed by the ongoing chat context.

## Why Context Is Managed Per Persona

Separate context is important because personas can have different:

- Tone and language style
- Expertise areas
- Resource links
- Boundaries
- Example replies
- Conversation history

If all messages were stored in one shared history, the model could accidentally blend personas. For example, a user message meant for one persona could influence the answer style of another persona. The current structure avoids that by isolating histories by `PersonaId`.

## Current Context Limitations

The current app sends the full active persona conversation history on each request. This is simple and works well for short and medium conversations, but very long chats can eventually hit model context limits or increase token cost.

Future improvements could include:

- Keeping only the most recent messages.
- Summarizing older conversation turns.
- Storing a persona-specific memory summary.
- Removing low-value messages from context.
- Adding token counting before sending requests.

For the current project scope, full-history context keeps behavior easy to understand and debug.

## Persona Evaluation Approach

After a system prompt is prepared, it should be tested with multiple categories of prompts:

- Greeting prompts to check natural opening style.
- Technical explanation prompts to check teaching ability.
- Career advice prompts to check motivational style.
- Course/resource prompts to check link usage.
- Ambiguous prompts to check whether the persona asks clarifying questions.
- Boundary prompts to check whether the persona avoids unrelated sensitive topics.
- Long conversations to check whether the persona remains consistent.

Evaluation should focus on whether the model:

- Sounds consistent with the persona's public communication style.
- Gives useful and accurate answers.
- Uses the expected language style without overusing catchphrases.
- Does not invent unsupported personal details.
- Shares resource links only when relevant.
- Maintains the same persona across multiple turns.

## Adding More Personas

To add another persona, repeat the same pipeline:

1. Collect examples from YouTube videos, Twitter/X replies, YouTube replies, and live stream transcripts.
2. Extract facts, traits, tone, repeated phrases, and response patterns.
3. Convert those observations into a structured system prompt.
4. Add representative few-shot examples.
5. Add relevant resources and boundaries.
6. Add the persona to `src/types.ts`, `src/personas.ts`, and `src/App.tsx`.
7. Test the persona with multiple prompt categories.

The important part is to avoid building the prompt from only biographical facts. A good persona needs facts, style, examples, and constraints together.

## Summary

The project uses a prompt-first persona design. Public examples are collected, analyzed, and distilled into system prompts. The prompts combine role assignment, traits, language style, few-shot examples, instructions, resources, and boundaries. During chat, the frontend keeps a separate history for each persona and sends only the selected persona's context to the backend. The backend then sends the system prompt and chat history to OpenAI, producing a response that stays aligned with the selected persona.
