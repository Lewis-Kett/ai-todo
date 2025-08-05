'use server'

import { type ApiResponse, type ChatResponse } from '@/types/chat'
import { type TodoFormData } from '@/types/todo'
import { type AddTodoTool, type ChatTool } from '../../baml_client/types'
import { addTodo } from './todo-actions'

export async function handleChatToolResponse(
  chatResponse: AddTodoTool | ChatTool
): Promise<ApiResponse<ChatResponse>> {
  switch (chatResponse.action) {
    case 'add_todo': {
      // User wants to add a todo - execute the action
      const formData: TodoFormData = {
        name: chatResponse.name,
        category: chatResponse.category,
        priority: chatResponse.priority,
      }

      // Add the todo
      await addTodo(formData)

      return {
        success: true,
        data: {
          message: chatResponse.responseToUser,
          todoTool: chatResponse,
        },
      }
    }

    case 'chat': {
      // Handle chat tool - return the AI's response
      return {
        success: true,
        data: {
          message: chatResponse.responseToUser,
          todoTool: chatResponse,
        },
      }
    }

    default: {
      // Fallback - should not happen with current tool types
      return {
        success: true,
        data: {
          message: `I received your request but couldn't process it properly.`,
          todoTool: chatResponse,
        },
      }
    }
  }
}