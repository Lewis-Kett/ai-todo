export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatResponse {
  message: string
  confidence?: number
  suggestions?: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}