"use server"

import { Todo } from "@/types/todo"
import { Message } from "@/baml_client/types"
import { b } from "@/baml_client"
import {
  getTodosFromFile,
  setTodosInFile,
  revalidateTodos,
} from "@/lib/todo-data"
import {
  addTodoToArray,
  deleteTodoFromArray,
  toggleTodoInArray,
  updateTodoInArray,
} from "@/lib/todo-operations"

export interface ChatResponse {
  message: string
  success: boolean
}

/**
 * Processes a chat message and handles both chat and todo operations atomically.
 * This function consolidates all todo operations to eliminate race conditions
 * and provides a single cache invalidation point for better performance.
 */
export async function processChatMessage(
  userMessage: string,
  conversationHistory: Message[]
): Promise<ChatResponse> {
  try {
    // 1. Get current todos - fresh read bypassing cache
    const todos = await getTodosFromFile()

    // 2. Call BAML function
    const response = await b.HandleTodoRequest(
      userMessage,
      todos,
      conversationHistory
    )

    // 3. Process todo operations atomically
    let updatedTodos = [...todos]
    let todoModified = false

    switch (response.action) {
      case "add_todo":
        updatedTodos = addTodoToArray(updatedTodos, {
          name: response.name,
          category: response.category,
          priority: response.priority,
        })
        todoModified = true
        break

      case "delete_todo":
        updatedTodos = deleteTodoFromArray(updatedTodos, response.id)
        todoModified = true
        break

      case "toggle_todo":
        updatedTodos = toggleTodoInArray(updatedTodos, response.id)
        todoModified = true
        break

      case "update_todo":
        const updates: Partial<Omit<Todo, "id">> = {}
        if (response.name) updates.name = response.name
        if (response.category) updates.category = response.category
        if (response.priority) updates.priority = response.priority

        updatedTodos = updateTodoInArray(updatedTodos, response.id, updates)
        todoModified = true
        break

      case "chat":
        // No modification needed
        break
    }

    // 4. Save and invalidate cache ONCE
    if (todoModified) {
      await setTodosInFile(updatedTodos)
      revalidateTodos() // Single invalidation
    }

    // 5. Return comprehensive response
    return {
      message: response.responseToUser,
      success: true,
    }
  } catch (error) {
    console.error("Error in processChatMessage:", error)
    return {
      message: "Sorry, I encountered an error processing your request.",
      success: false,
    }
  }
}
