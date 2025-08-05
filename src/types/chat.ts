import type { AddTodoTool, AnalyzeTool } from '../../baml_client/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

// New tool-based action types
export type TodoTool = AddTodoTool | AnalyzeTool

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