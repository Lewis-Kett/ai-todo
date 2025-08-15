'use server'

import { unstable_cache } from 'next/cache'
import { Todo, TodoFormData } from '@/types/todo'
import { getTodosFromFile, setTodosInFile, revalidateTodos } from '@/lib/todo-data'
import { 
  addTodoToArray, 
  deleteTodoFromArray, 
  toggleTodoInArray, 
  updateTodoInArray 
} from '@/lib/todo-operations'

// Cached version of getTodos with cache tags
export const getTodos = unstable_cache(
  async (): Promise<Todo[]> => {
    return getTodosFromFile()
  },
  ['todos'],
  {
    tags: ['todos'],
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
  updates: Partial<Omit<Todo, 'id'>>
): Promise<void> {
  const currentTodos = await getTodos()
  const updatedTodos = updateTodoInArray(currentTodos, id, updates)
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
      completedCount: currentTodos.filter((todo: Todo) => todo.completed).length,
      pendingCount: currentTodos.filter((todo: Todo) => !todo.completed).length,
      totalCount: currentTodos.length
    }
  },
  ['todo-stats'],
  {
    tags: ['todos'], // Use same tag as getTodos since stats depend on todos
    revalidate: 3600,
  }
)