"use server"

import { unstable_cache } from "next/cache"
import { Todo, TodoFormData } from "@/types/todo"
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
import { BatchTodoResponse } from "@/baml_client"
import { createDataError } from "@/lib/errors"

// Cached version of getTodos with cache tags
export const getTodos = unstable_cache(
  async (): Promise<Todo[]> => {
    return getTodosFromFile()
  },
  ["todos"],
  {
    tags: ["todos"],
    revalidate: 3600, // Cache for 1 hour, but can be invalidated earlier with tags
  }
)

export async function addTodo(formData: TodoFormData): Promise<void> {
  const currentTodos = await getTodos()
  const updatedTodos = addTodoToArray(currentTodos, formData)
  await setTodosInFile(updatedTodos)
  revalidateTodos()
}

export async function deleteTodo(id: string): Promise<void> {
  const currentTodos = await getTodos()
  const updatedTodos = deleteTodoFromArray(currentTodos, id)
  await setTodosInFile(updatedTodos)
  revalidateTodos()
}

export async function toggleTodoComplete(id: string): Promise<void> {
  const currentTodos = await getTodos()
  const updatedTodos = toggleTodoInArray(currentTodos, id)
  await setTodosInFile(updatedTodos)
  revalidateTodos()
}

export async function updateTodo(
  id: string,
  updates: Partial<Omit<Todo, "id">>
): Promise<void> {
  const currentTodos = await getTodos()
  const updatedTodos = updateTodoInArray(currentTodos, id, updates)
  await setTodosInFile(updatedTodos)
  revalidateTodos()
}

/**
 * Process multiple todo operations in a single atomic transaction.
 * This prevents race conditions, reduces file I/O by batching all operations and performs a single cache invalidation.
 */
export async function processBatchTodoActions(
  actions: BatchTodoResponse["actions"]
): Promise<void> {
  // Pre-validate all operations before applying any changes
  const currentTodos = await getTodosFromFile() // Bypass cache for atomic operation

  // Create a Map for O(1) ID lookups during validation
  const todoMap = new Map(currentTodos.map(todo => [todo.id, todo]))

  for (const todoAction of actions) {
    if (
      todoAction.action === "delete_todo" ||
      todoAction.action === "toggle_todo" ||
      todoAction.action === "update_todo"
    ) {
      if (!todoMap.has(todoAction.id)) {
        throw createDataError(`Todo with id "${todoAction.id}" not found`)
      }
    }
  }

  // Apply all operations to the in-memory array
  let updatedTodos = [...currentTodos]

  for (const todoAction of actions) {
    switch (todoAction.action) {
      case "add_todo":
        updatedTodos = addTodoToArray(updatedTodos, {
          name: todoAction.name,
          category: todoAction.category,
          priority: todoAction.priority,
        })
        break
      case "delete_todo":
        updatedTodos = deleteTodoFromArray(updatedTodos, todoAction.id)
        break
      case "toggle_todo":
        updatedTodos = toggleTodoInArray(updatedTodos, todoAction.id)
        break
      case "update_todo":
        const updates: Partial<Omit<Todo, "id">> = {}
        if (todoAction.name) updates.name = todoAction.name
        if (todoAction.category) updates.category = todoAction.category
        if (todoAction.priority) updates.priority = todoAction.priority

        updatedTodos = updateTodoInArray(updatedTodos, todoAction.id, updates)
        break
    }
  }

  // Single atomic write and cache invalidation
  await setTodosInFile(updatedTodos)
  revalidateTodos()
}

// Cached version of getTodoStats with cache tags
export const getTodoStats = unstable_cache(
  async (): Promise<{
    completedCount: number
    pendingCount: number
    totalCount: number
  }> => {
    const currentTodos = await getTodos()
    return {
      completedCount: currentTodos.filter((todo: Todo) => todo.completed)
        .length,
      pendingCount: currentTodos.filter((todo: Todo) => !todo.completed).length,
      totalCount: currentTodos.length,
    }
  },
  ["todo-stats"],
  {
    tags: ["todos"], // Use same tag as getTodos since stats depend on todos
    revalidate: 3600,
  }
)
