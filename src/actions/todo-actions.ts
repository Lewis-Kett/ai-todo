'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { Todo, TodoFormData } from '@/types/todo'

// Properly typed global declaration for shared todos
declare global {
  var __sharedTodos: Todo[] | undefined
}

// Initial todos data
const INITIAL_TODOS: Todo[] = [
  {
    id: '1',
    name: 'Complete the project documentation',
    category: 'Work',
    priority: 'High Priority',
    completed: false,
  },
  {
    id: '2',
    name: 'Review pull requests',
    category: 'Development',
    priority: 'Medium Priority',
    completed: false,
  },
  {
    id: '3',
    name: 'Set up development environment',
    category: 'Setup',
    priority: 'High Priority',
    completed: true,
  },
]

// Shared data store using Node.js global object to fix module instance issue
// Get todos from global storage (shared across all module instances)
function getTodosFromGlobal(): Todo[] {
  if (!global.__sharedTodos) {
    global.__sharedTodos = [...INITIAL_TODOS]
  }
  return global.__sharedTodos
}

// Set todos in global storage (shared across all module instances)
function setTodosInGlobal(newTodos: Todo[]): void {
  global.__sharedTodos = newTodos
}

// Internal function to get todos without caching
async function getTodosInternal(): Promise<Todo[]> {
  const globalTodos = getTodosFromGlobal()
  
  // Simulate async database call - configurable delay for testing
  const delay = process.env.NODE_ENV === 'test' ? 0 : 1000
  await new Promise(resolve => setTimeout(resolve, delay))
  return [...globalTodos]
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
  const currentTodos = getTodosFromGlobal()
  
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    name: formData.name,
    category: formData.category,
    priority: formData.priority,
    completed: false,
  }
  
  const updatedTodos = [...currentTodos, newTodo]
  setTodosInGlobal(updatedTodos)
  
  revalidateTag('todos')
}

export async function deleteTodo(id: string): Promise<void> {
  const currentTodos = getTodosFromGlobal()
  const updatedTodos = currentTodos.filter((todo: Todo) => todo.id !== id)
  setTodosInGlobal(updatedTodos)
  revalidateTag('todos')
}

export async function toggleTodoComplete(id: string): Promise<void> {
  const currentTodos = getTodosFromGlobal()
  const updatedTodos = currentTodos.map((todo: Todo) =>
    todo.id === id 
      ? { ...todo, completed: !todo.completed }
      : todo
  )
  setTodosInGlobal(updatedTodos)
  revalidateTag('todos')
}

export async function updateTodo(
  id: string, 
  updates: Partial<Omit<Todo, 'id'>>
): Promise<void> {
  const currentTodos = getTodosFromGlobal()
  const updatedTodos = currentTodos.map((todo: Todo) =>
    todo.id === id 
      ? { ...todo, ...updates }
      : todo
  )
  setTodosInGlobal(updatedTodos)
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