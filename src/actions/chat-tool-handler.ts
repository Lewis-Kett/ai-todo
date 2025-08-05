'use server'

import { type ApiResponse, type ChatResponse } from '@/types/chat'
import { type TodoFormData } from '@/types/todo'
import { type AddTodoTool, type ChatTool, type DeleteTodoTool, type ToggleTodoTool, type UpdateTodoTool } from '../../baml_client/types'
import { addTodo, deleteTodo, toggleTodoComplete, updateTodo } from './todo-actions'

export async function handleChatToolResponse(
  chatResponse: AddTodoTool | DeleteTodoTool | ToggleTodoTool | UpdateTodoTool | ChatTool
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

    case 'delete_todo': {
      // User wants to delete a todo - execute the action
      await deleteTodo(chatResponse.id)

      return {
        success: true,
        data: {
          message: chatResponse.responseToUser,
          todoTool: chatResponse,
        },
      }
    }

    case 'toggle_todo': {
      // User wants to toggle todo completion - execute the action
      await toggleTodoComplete(chatResponse.id)

      return {
        success: true,
        data: {
          message: chatResponse.responseToUser,
          todoTool: chatResponse,
        },
      }
    }

    case 'update_todo': {
      // User wants to update a todo - execute the action
      const updates: Partial<Omit<import('@/types/todo').Todo, 'id'>> = {}
      
      if (chatResponse.name) updates.name = chatResponse.name
      if (chatResponse.category) updates.category = chatResponse.category
      if (chatResponse.priority) updates.priority = chatResponse.priority

      await updateTodo(chatResponse.id, updates)

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