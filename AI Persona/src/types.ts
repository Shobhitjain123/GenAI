export type PersonaId = 'hitesh' | 'piyush'

export type MessageRole = 'user' | 'persona'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

export interface Persona {
  id: PersonaId
  name: string
  handle: string
  accentColor: string
  systemPrompt: string
}
