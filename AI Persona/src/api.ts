export interface OpenAIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface UsageInfo {
  limit: number
  remaining: number
  resetAt: string
}

interface ChatResponse {
  reply?: string
  error?: string
  usage?: UsageInfo
}

export class ChatError extends Error {
  usage?: UsageInfo

  constructor(message: string, usage?: UsageInfo) {
    super(message)
    this.name = 'ChatError'
    this.usage = usage
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function sendChat(
  systemPrompt: string,
  messages: OpenAIMessage[],
): Promise<{ reply: string; usage?: UsageInfo }> {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, messages }),
  })

  const data = (await response.json()) as ChatResponse

  if (!response.ok) {
    throw new ChatError(
      data.error || 'Failed to get a response from the server',
      data.usage,
    )
  }

  if (!data.reply) {
    throw new ChatError('No reply received from the server', data.usage)
  }

  return { reply: data.reply, usage: data.usage }
}

export async function fetchUsage(): Promise<UsageInfo | null> {
  try {
    const response = await fetch(`${API_BASE}/api/usage`)
    if (!response.ok) return null
    const data = (await response.json()) as { usage?: UsageInfo }
    return data.usage ?? null
  } catch {
    return null
  }
}
