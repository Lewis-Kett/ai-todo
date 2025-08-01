'use server'

import { revalidateTag, unstable_cache } from 'next/cache'
import { Todo, TodoFormData } from '@/types/todo'

// In a real app, this would be a database. For now, we'll simulate with a global variable.
// This is just for demonstration - in production you'd use a proper database.
let todos: Todo[] = [
  {
    id: '1',
    name: 'Complete the project documentation',
    category: 'Work',
    priority: 'High Priority',
    completed: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Review pull requests',
    category: 'Development',
    priority: 'Medium Priority',
    completed: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Set up development environment',
    category: 'Setup',
    priority: 'High Priority',
    completed: true,
    createdAt: new Date(),
  },
]

// Internal function to get todos without caching
async function getTodosInternal(): Promise<Todo[]> {
  // Simulate async database call - configurable delay for testing
  const delay = process.env.NODE_ENV === 'test' ? 0 : 1000
  await new Promise(resolve => setTimeout(resolve, delay))
  return [...todos]
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
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    name: formData.name,
    category: formData.category,
    priority: formData.priority,
    completed: false,
    createdAt: new Date(),
  }
  
  todos.push(newTodo)
  revalidateTag('todos')
}

export async function deleteTodo(id: string): Promise<void> {
  todos = todos.filter(todo => todo.id !== id)
  revalidateTag('todos')
}

export async function toggleTodoComplete(id: string): Promise<void> {
  todos = todos.map(todo =>
    todo.id === id 
      ? { ...todo, completed: !todo.completed }
      : todo
  )
  revalidateTag('todos')
}

export async function updateTodo(
  id: string, 
  updates: Partial<Omit<Todo, 'id' | 'createdAt'>>
): Promise<void> {
  todos = todos.map(todo =>
    todo.id === id 
      ? { ...todo, ...updates }
      : todo
  )
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
      completedCount: currentTodos.filter(todo => todo.completed).length,
      pendingCount: currentTodos.filter(todo => !todo.completed).length,
      totalCount: currentTodos.length
    }
  },
  ['todo-stats'],
  {
    tags: ['todos'], // Use same tag as getTodos since stats depend on todos
    revalidate: 3600,
  }
)