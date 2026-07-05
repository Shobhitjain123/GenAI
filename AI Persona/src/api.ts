export interface OpenAIMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  reply?: string
  error?: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function sendChat(
  systemPrompt: string,
  messages: OpenAIMessage[],
): Promise<string> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages }),
  })

  const data = (await response.json()) as ChatResponse

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get a response from the server')
  }

  if (!data.reply) {
    throw new Error('No reply received from the server')
  }

  return data.reply
}
