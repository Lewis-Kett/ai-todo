"use server"

import { Todo } from "@/types/todo"
import { Message } from "@/baml_client/types"
import { b } from "@/baml_client"
import { getTodos, addTodo, deleteTodo, toggleTodoComplete, updateTodo } from "./todo-actions"

export interface ChatResponse {
  message: string
  success: boolean
}

/**
 * Processes a chat message and handles both chat and todo operations.
 * This function delegates todo operations to existing server actions
 * to maintain consistency and eliminate code duplication.
 */
export async function processChatMessage(
  userMessage: string,
  conversationHistory: Message[]
): Promise<ChatResponse> {
  try {
    // 1. Get current todos
    const todos = await getTodos()

    // 2. Call BAML function
    const response = await b.HandleTodoRequest(
      userMessage,
      todos,
      conversationHistory
    )

    // 3. Process todo operations using existing server actions
    switch (response.action) {
      case "add_todo":
        await addTodo({
          name: response.name,
          category: response.category,
          priority: response.priority,
        })
        break

      case "delete_todo":
        await deleteTodo(response.id)
        break

      case "toggle_todo":
        await toggleTodoComplete(response.id)
        break

      case "update_todo":
        const updates: Partial<Omit<Todo, "id">> = {}
        if (response.name) updates.name = response.name
        if (response.category) updates.category = response.category
        if (response.priority) updates.priority = response.priority

        await updateTodo(response.id, updates)
        break

      case "chat":
        // No modification needed
        break
    }

    // 4. Return response
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
