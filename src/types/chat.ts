import type { Todo } from './todo'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface TodoActionIntent {
  action: 'create' | 'update' | 'delete' | 'complete' | 'analyze'
  todo?: Todo
  reasoning: string
}

export interface ChatResponse {
  message: string
  confidence?: number
  suggestions?: string[]
  todoAction?: TodoActionIntent
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}