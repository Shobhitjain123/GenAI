import { useEffect, useRef, useState } from "react";
import { sendChat } from "./api";
import { PERSONAS, PERSONA_LIST } from "./personas";
import type { ChatMessage, MessageRole, PersonaId } from "./types";

const PERSONA_AVATARS: Record<PersonaId, string> = {
  hitesh: "/HC image.png",
  piyush: "/PG image.png",
};

function ChatAvatar({
  role,
  personaId,
}: {
  role: MessageRole;
  personaId?: PersonaId;
}) {
  if (role === "user") {
    return (
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-terminal-cyan/40 bg-terminal-cyan/10"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-terminal-cyan"
          fill="currentColor"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={PERSONA_AVATARS[personaId!]}
      alt=""
      className="h-9 w-9 shrink-0 rounded-full border border-terminal-green/40 object-cover"
    />
  );
}

function createId() {
  return crypto.randomUUID();
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === "user" ? ("user" as const) : ("assistant" as const),
    content: message.content,
  }));
}

function createInitialHistories(): Record<PersonaId, ChatMessage[]> {
  return {
    hitesh: [],
    piyush: [],
  };
}

function App() {
  const [activePersonaId, setActivePersonaId] = useState<PersonaId>("hitesh");
  const [histories, setHistories] = useState(createInitialHistories);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activePersona = PERSONAS[activePersonaId];
  const messages = histories[activePersonaId];
  const userHistory = messages.filter((message) => message.role === "user");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activePersonaId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];

    setHistories((prev) => ({
      ...prev,
      [activePersonaId]: updatedMessages,
    }));
    setInput("");
    setIsTyping(true);

    try {
      const reply = await sendChat(
        activePersona.systemPrompt,
        toOpenAIMessages(updatedMessages),
      );

      const personaMessage: ChatMessage = {
        id: createId(),
        role: "persona",
        content: reply,
        timestamp: new Date(),
      };

      setHistories((prev) => ({
        ...prev,
        [activePersonaId]: [...prev[activePersonaId], personaMessage],
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: createId(),
        role: "persona",
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "Error: Failed to get a response from the server.",
        timestamp: new Date(),
      };

      setHistories((prev) => ({
        ...prev,
        [activePersonaId]: [...prev[activePersonaId], errorMessage],
      }));
    } finally {
      setIsTyping(false);
    }
  }

  function handleHistoryClick(content: string) {
    setInput(content);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full min-h-screen bg-terminal-bg text-[#c9d1d9]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-terminal-border bg-terminal-panel">
        <div className="border-b border-terminal-border px-4 py-3">
          <p className="text-xs text-terminal-muted">~/chat-history</p>
          <h2 className="mt-1 text-sm font-semibold text-terminal-green">
            session.log
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {userHistory.length === 0 ? (
            <p className="px-2 py-4 text-xs text-terminal-muted">
              No messages yet. Start typing below.
            </p>
          ) : (
            <ul className="space-y-1">
              {userHistory.map((message, index) => (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => handleHistoryClick(message.content)}
                    className="w-full rounded border border-transparent px-2 py-2 text-left text-xs transition hover:border-terminal-border hover:bg-terminal-bg"
                  >
                    <span className="text-terminal-amber">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>{" "}
                    <span className="line-clamp-2 text-[#c9d1d9]">
                      {message.content}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-terminal-border px-4 py-3 text-xs text-terminal-muted">
          <p>
            persona:{" "}
            <span className={activePersona.accentColor}>
              {activePersona.handle}
            </span>
          </p>
          <p className="mt-1">msgs: {messages.length}</p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-terminal-border bg-terminal-panel px-5 py-3">
          <div>
            <p className="text-xs text-terminal-muted">persona-chat v0.1.0</p>
            <h1 className="text-base font-semibold text-terminal-green">
              AI Persona Terminal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <label
              htmlFor="persona-select"
              className="text-xs text-terminal-muted"
            >
              select persona:
            </label>
            <select
              id="persona-select"
              value={activePersonaId}
              onChange={(event) =>
                setActivePersonaId(event.target.value as PersonaId)
              }
              className="rounded border border-terminal-border bg-terminal-bg px-3 py-1.5 text-sm text-[#c9d1d9] outline-none focus:border-terminal-green"
            >
              {PERSONA_LIST.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-6 py-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-terminal-green">
                $ persona --init {activePersona.name.toLowerCase()}
              </p>
              <p className="mt-2 max-w-md text-sm text-terminal-muted">
                Connected to{" "}
                <span className={activePersona.accentColor}>
                  {activePersona.name}
                </span>
                . Type a message in the terminal below and press Enter.
              </p>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "persona" && (
                    <ChatAvatar role="persona" personaId={activePersonaId} />
                  )}
                  <div
                    className={`max-w-[80%] rounded border px-4 py-3 ${
                      message.role === "user"
                        ? "border-terminal-cyan/40 bg-terminal-cyan/10"
                        : "border-terminal-green/40 bg-terminal-green/10"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span
                        className={
                          message.role === "user"
                            ? "text-terminal-cyan"
                            : "text-terminal-green"
                        }
                      >
                        {message.role === "user"
                          ? "you@local"
                          : activePersona.handle}
                      </span>
                      <span className="text-terminal-muted">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  {message.role === "user" && <ChatAvatar role="user" />}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <ChatAvatar role="persona" personaId={activePersonaId} />
                  <div className="rounded border border-terminal-green/40 bg-terminal-green/10 px-4 py-3 text-sm text-terminal-green">
                    {activePersona.name} is typing...
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </section>

        <footer className="border-t border-terminal-border bg-terminal-panel px-5 py-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 rounded border border-terminal-border bg-terminal-bg px-3 py-2">
              <span className="shrink-0 text-sm text-terminal-green">$</span>
              <span className="shrink-0 text-sm text-terminal-amber">
                {activePersona.name.toLowerCase()}&gt;
              </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your message and press Enter..."
                disabled={isTyping}
                className="min-w-0 flex-1 bg-transparent text-sm text-[#c9d1d9] outline-none placeholder:text-terminal-muted disabled:opacity-50"
              />
              <span className="hidden text-xs text-terminal-muted sm:inline">
                [enter]
              </span>
            </div>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default App;
