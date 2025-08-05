import type { AddTodoTool, ChatTool } from '../../baml_client/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

// New tool-based action types
export type TodoTool = AddTodoTool | ChatTool

export interface ChatResponse {
  message: string
  confidence?: number
  suggestions?: string[]
  todoTool?: TodoTool
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}