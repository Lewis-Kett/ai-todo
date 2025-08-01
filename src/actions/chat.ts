'use server'

import { type ChatMessage, type ApiResponse, type ChatResponse, type TodoActionIntent } from '@/types/chat'
import { b } from '../../baml_client'
import { chatMessagesToBamlMessages, todosToBamlTodoItems, bamlTodoItemToTodo } from '@/lib/baml-converters'
import { getTodos } from './todo-actions'

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ApiResponse<ChatResponse>> {
  try {
    // First, analyze if this is a todo-related request
    const currentTodos = await getTodos()
    const bamlTodos = todosToBamlTodoItems(currentTodos)
    
    const todoAnalysis = await b.AnalyzeTodoRequest(message, bamlTodos)
    
    // If the action is "analyze", it means the user just wants to chat
    if (todoAnalysis.action === 'analyze') {
      // Convert React ChatMessages to BAML Messages format
      const bamlConversationHistory = chatMessagesToBamlMessages(conversationHistory)
      
      // Call BAML ChatWithAssistant function
      const response = await b.ChatWithAssistant(message, bamlConversationHistory)
      
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
      todo: todoAnalysis.todo ? bamlTodoItemToTodo(todoAnalysis.todo) : undefined,
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