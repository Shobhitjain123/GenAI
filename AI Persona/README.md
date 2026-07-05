# AI Persona Terminal

AI Persona Terminal is a React and Express application that lets users chat with AI-generated personas. Each persona is backed by a carefully prepared system prompt that describes the person's background, tone, language style, communication habits, constraints, and example responses.

The frontend provides a terminal-style chat experience. The backend keeps the OpenAI API key private and sends each request to OpenAI with the selected persona's system prompt and that persona's current chat history.

## Features

- Chat with selectable AI personas from one interface.
- Keep a separate message history for each persona.
- Send persona-specific system prompts to OpenAI.
- Display previous user prompts in a sidebar for quick reuse.
- Use a terminal-inspired UI built with React, TypeScript, Vite, and Tailwind CSS.
- Run a small Express API server for secure OpenAI calls.

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Styling: Tailwind CSS 4
- Backend: Node.js, Express
- AI provider: OpenAI Chat Completions API
- Development tooling: ESLint, concurrently

## Project Structure

```text
AI Persona/
├── public/
│   ├── HC image.png
│   ├── PG image.png
│   └── meetme.png
├── server/
│   └── index.js
├── src/
│   ├── api.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── personas.ts
│   └── types.ts
├── .env.example
├── package.json
├── PERSONA_DOCUMENTATION.md
└── README.md
```

## Prerequisites

Before running the project, install:

- Node.js 20 or newer
- npm
- An OpenAI API key

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
cp .env.example .env
```

3. Add your OpenAI API key in `.env`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

For local development, `VITE_API_URL` can be omitted because the frontend calls the same origin by default when proxied or deployed together. If the frontend and backend run on different origins, set `VITE_API_URL` to the backend URL.

4. Start the backend and frontend together:

```bash
npm run dev:all
```

5. Open the app:

```text
http://localhost:5173
```

## Available Scripts

- `npm run dev`: starts only the Vite frontend.
- `npm run server`: starts only the Express API server.
- `npm run start`: starts the Express API server.
- `npm run dev:all`: starts frontend and backend together.
- `npm run build`: type-checks and builds the frontend.
- `npm run lint`: runs ESLint.
- `npm run preview`: previews the production frontend build.

## Environment Variables

The backend reads variables from `.env`.

```text
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
```

- `OPENAI_API_KEY`: required. Used by the Express server to call OpenAI.
- `PORT`: optional. Defaults to `3001`.
- `FRONTEND_URL`: optional for local development, required when the frontend is hosted separately so CORS allows that origin.

For hosted frontend deployments, set this variable in the frontend hosting platform:

```text
VITE_API_URL=https://your-api-url.example.com
```

## Application Walkthrough

When the user opens the app, `src/main.tsx` mounts the React application and loads the global Tailwind theme from `src/index.css`. The theme defines terminal colors, monospace fonts, and full-screen layout defaults.

`src/App.tsx` controls the full chat experience. It stores the active persona, the typed input, a loading state, and a separate chat history for each persona. The persona selector changes the active persona without mixing conversations. The sidebar shows previous user messages from the selected persona so the user can quickly reuse earlier prompts.

Each persona is configured in `src/personas.ts`. A persona includes an id, display name, handle, accent color, and system prompt. The system prompt is the main behavior layer for the model. It describes the persona's background, expertise, speaking style, example replies, boundaries, and useful resource links.

When a user submits a message, `App.tsx` appends the user message to the active persona's history, converts the UI message format into OpenAI-compatible messages, and calls `sendChat()` from `src/api.ts`. The request body contains:

```json
{
  "systemPrompt": "selected persona system prompt",
  "messages": [{ "role": "user", "content": "latest user message" }]
}
```

The frontend sends this payload to `/api/chat`. The backend endpoint in `server/index.js` validates the payload, loads the OpenAI client from `OPENAI_API_KEY`, and calls the Chat Completions API with the selected system prompt followed by the current message history.

The model response is returned to the frontend as `{ "reply": "..." }`. The frontend then appends it to the selected persona's chat history and renders it in the terminal chat window.

## Backend API

### `GET /api/health`

Returns a simple health response:

```json
{ "status": "ok" }
```

### `POST /api/chat`

Accepts a persona system prompt and OpenAI-style chat messages:

```json
{
  "systemPrompt": "You are ...",
  "messages": [
    { "role": "user", "content": "Explain GenAI roadmaps" },
    { "role": "assistant", "content": "..." }
  ]
}
```

Returns:

```json
{
  "reply": "Model generated response"
}
```

## Persona Configuration

Personas live in `src/personas.ts`. To add or update a persona:

1. Add the persona id to `PersonaId` in `src/types.ts`.
2. Add an avatar image in `public/`.
3. Add the avatar path to `PERSONA_AVATARS` in `src/App.tsx`.
4. Add a new entry in `PERSONAS` inside `src/personas.ts`.
5. Include background, persona traits, language style, instructions, examples, boundaries, and resources in the system prompt.
6. Test the persona with short prompts, long prompts, ambiguous prompts, and prompts that ask for links or advice.

The current implementation contains a detailed Hitesh and Piyush persona prompt

## Deployment Notes

One practical deployment setup is:

- Host the Express backend on Railway or another Node.js server.
- Host the Vite frontend on Vercel or another static frontend host.
- Set `OPENAI_API_KEY`, `PORT`, and `FRONTEND_URL` on the backend.
- Set `VITE_API_URL` on the frontend to the deployed backend URL.

The backend CORS configuration allows `http://localhost:5173` and the configured `FRONTEND_URL`.

## Troubleshooting

- If the app shows `OPENAI_API_KEY is not configured on the server`, check that `.env` exists and the backend was restarted after adding the key.
- If the browser shows a CORS error, set `FRONTEND_URL` on the backend to the exact deployed frontend URL.
- If requests go to the wrong API URL, check `VITE_API_URL` in the frontend environment.
- If a persona responds out of character, improve the system prompt with clearer traits, stronger instructions, and more representative examples.
- If conversations feel mixed, verify that each persona id has its own history entry in `createInitialHistories()`.

## Additional Documentation

For the persona research, prompt design, and chat context approach, see `PERSONA_DOCUMENTATION.md`.
