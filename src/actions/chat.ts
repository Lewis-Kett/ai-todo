'use server'

import { type ApiResponse, type ChatResponse } from '@/types/chat'
// TodoTool is used in the function body for type checking
import { type TodoFormData } from '@/types/todo'
import { b, type Message } from '../../baml_client'
import { getTodos, addTodo } from './todo-actions'

export async function sendChatMessage(
  message: string,
  conversationHistory: Message[] = []
): Promise<ApiResponse<ChatResponse>> {
  try {
    // Get current todos for context
    const currentTodos = await getTodos()
    // Todo and TodoItem have the same structure now
    const bamlTodos = currentTodos
    
    // Use new HandleTodoRequest function to determine action
    const todoTool = await b.HandleTodoRequest(message, bamlTodos)
    
    // Handle different tool types
    if (todoTool.action === 'analyze') {
      // User just wants to chat - use ChatWithAssistant
      const response = await b.ChatWithAssistant(message, conversationHistory)
      
      return {
        success: true,
        data: {
          message: response.message,
          confidence: response.confidence ?? undefined,
          suggestions: response.suggestions ?? undefined,
          todoTool
        }
      }
    } else if (todoTool.action === 'add_todo') {
      // User wants to add a todo - execute the action
      const formData: TodoFormData = {
        name: todoTool.name,
        category: todoTool.category,
        priority: todoTool.priority
      }
      
      // Add the todo
      await addTodo(formData)
      
      return {
        success: true,
        data: {
          message: `Added todo: "${todoTool.name}" to ${todoTool.category} with ${todoTool.priority}. ${todoTool.reasoning}`,
          todoTool
        }
      }
    }
    
    // Fallback - should not happen with current tool types
    return {
      success: true,
      data: {
        message: `I received your request but couldn't process it properly.`,
        todoTool
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