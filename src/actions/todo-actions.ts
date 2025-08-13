'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { promises as fs } from 'fs'
import path from 'path'
import { Todo, TodoFormData } from '@/types/todo'

// Path to todos data file
const TODOS_FILE = path.join(process.cwd(), 'data', 'todos.json')

// Read todos from file system
async function getTodosFromFile(): Promise<Todo[]> {
  try {
    const data = await fs.readFile(TODOS_FILE, 'utf8')
    return JSON.parse(data)
  } catch {
    // If file doesn't exist, return empty array
    return []
  }
}

// Write todos to file system
async function setTodosInFile(todos: Todo[]): Promise<void> {
  // Ensure directory exists (safe to call repeatedly)
  await fs.mkdir(path.dirname(TODOS_FILE), { recursive: true })
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2), 'utf8')
}

// Internal function to get todos with simulated delay for consistency
async function getTodosInternal(): Promise<Todo[]> {
  const todos = await getTodosFromFile()
  
  // Simulate async database call - configurable delay for testing
  const delay = process.env.NODE_ENV === 'test' ? 0 : 100 // Reduced delay since we're reading from file
  await new Promise(resolve => setTimeout(resolve, delay))
  return todos
}

// Cached version of getTodos with cache tags
export const getTodos = unstable_cache(
  async (): Promise<Todo[]> => {
    return getTodosInternal()
  },
  ['todos'],
  {
    tags: ['todos'],
    revalidate: 3600, // Cache for 1 hour, but can be invalidated earlier with tags
  }
)

export async function addTodo(formData: TodoFormData): Promise<void> {
  const currentTodos = await getTodosFromFile()
  
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    name: formData.name,
    category: formData.category,
    priority: formData.priority,
    completed: false,
  }
  
  const updatedTodos = [...currentTodos, newTodo]
  await setTodosInFile(updatedTodos)
  
  revalidateTag('todos')
}

export async function deleteTodo(id: string): Promise<void> {
  const currentTodos = await getTodosFromFile()
  const updatedTodos = currentTodos.filter((todo: Todo) => todo.id !== id)
  await setTodosInFile(updatedTodos)
  revalidateTag('todos')
}

export async function toggleTodoComplete(id: string): Promise<void> {
  const currentTodos = await getTodosFromFile()
  const updatedTodos = currentTodos.map((todo: Todo) =>
    todo.id === id 
      ? { ...todo, completed: !todo.completed }
      : todo
  )
  await setTodosInFile(updatedTodos)
  revalidateTag('todos')
}

export async function updateTodo(
  id: string, 
  updates: Partial<Omit<Todo, 'id'>>
): Promise<void> {
  const currentTodos = await getTodosFromFile()
  const updatedTodos = currentTodos.map((todo: Todo) =>
    todo.id === id 
      ? { ...todo, ...updates }
      : todo
  )
  await setTodosInFile(updatedTodos)
  revalidateTag('todos')
}

// Cached version of getTodoStats with cache tags
export const getTodoStats = unstable_cache(
  async (): Promise<{
    completedCount: number
    pendingCount: number
    totalCount: number
  }> => {
    const currentTodos = await getTodosInternal()
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