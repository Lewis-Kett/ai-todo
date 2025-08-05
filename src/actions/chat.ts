'use server'

import { type ApiResponse, type ChatResponse, type TodoActionIntent } from '@/types/chat'
import { type Todo } from '@/types/todo'
import { b, type Message } from '../../baml_client'
import { getTodos } from './todo-actions'

export async function sendChatMessage(
  message: string,
  conversationHistory: Message[] = []
): Promise<ApiResponse<ChatResponse>> {
  try {
    // First, analyze if this is a todo-related request
    const currentTodos = await getTodos()
    // Todo and TodoItem have the same structure now
    const bamlTodos = currentTodos
    
    const todoAnalysis = await b.AnalyzeTodoRequest(message, bamlTodos)
    
    // If the action is "analyze", it means the user just wants to chat
    if (todoAnalysis.action === 'analyze') {
      // Call BAML ChatWithAssistant function
      const response = await b.ChatWithAssistant(message, conversationHistory)
      
      return {
        success: true,
        data: {
          message: response.message,
          confidence: response.confidence ?? undefined,
          suggestions: response.suggestions ?? undefined
        }
      }
    }
    
    // Otherwise, return the todo action intent
    const todoActionIntent: TodoActionIntent = {
      action: todoAnalysis.action,
      // TodoItem and Todo have the same structure now
      todo: todoAnalysis.todo as Todo | undefined,
      reasoning: todoAnalysis.reasoning
    }
    
    return {
      success: true,
      data: {
        message: `I understand you want to ${todoAnalysis.action} a todo. ${todoAnalysis.reasoning}`,
        todoAction: todoActionIntent
      }
    }
  } catch (error) {
    console.error('Chat error:', error)
    return {
      success: false,
      error: 'Failed to get chat response'
    }
  }
}