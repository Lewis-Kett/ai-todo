import { AddTodoTool, DeleteTodoTool, ToggleTodoTool, UpdateTodoTool, ChatTool } from "@/baml_client/types"
import { addTodo, deleteTodo, toggleTodoComplete, updateTodo } from "@/actions/todo-actions"
import { Todo } from "@/types/todo"

export type TodoActionResponse = AddTodoTool | DeleteTodoTool | ToggleTodoTool | UpdateTodoTool | ChatTool

/**
 * Processes a todo action response by calling the appropriate server action.
 * This centralizes the logic for mapping BAML responses to server actions.
 */
export async function processTodoAction(response: TodoActionResponse): Promise<void> {
  try {
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
        // No action needed for chat responses
        break

      default:
        console.warn("Unknown action type:", (response as { action: string }).action)
    }
  } catch (error) {
    console.error("Error processing todo action:", error)
    throw error
  }
}