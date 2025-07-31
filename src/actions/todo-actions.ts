'use server'

import { revalidatePath } from 'next/cache'
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

export async function getTodos(): Promise<Todo[]> {
  // Simulate async database call
  await new Promise(resolve => setTimeout(resolve, 10))
  return [...todos]
}

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
  revalidatePath('/')
}

export async function deleteTodo(id: string): Promise<void> {
  todos = todos.filter(todo => todo.id !== id)
  revalidatePath('/')
}

export async function toggleTodoComplete(id: string): Promise<void> {
  todos = todos.map(todo =>
    todo.id === id 
      ? { ...todo, completed: !todo.completed }
      : todo
  )
  revalidatePath('/')
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
  revalidatePath('/')
}

export async function getTodoStats(): Promise<{
  completedCount: number
  pendingCount: number
  totalCount: number
}> {
  const currentTodos = await getTodos()
  return {
    completedCount: currentTodos.filter(todo => todo.completed).length,
    pendingCount: currentTodos.filter(todo => !todo.completed).length,
    totalCount: currentTodos.length
  }
}