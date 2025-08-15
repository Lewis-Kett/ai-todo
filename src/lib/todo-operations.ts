import { Todo, TodoFormData } from '@/types/todo'

/**
 * Pure function to add a todo to an array
 */
export function addTodoToArray(todos: Todo[], todoData: TodoFormData): Todo[] {
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    name: todoData.name,
    category: todoData.category,
    priority: todoData.priority,
    completed: false,
  }
  
  return [...todos, newTodo]
}

/**
 * Pure function to delete a todo from an array
 */
export function deleteTodoFromArray(todos: Todo[], id: string): Todo[] {
  return todos.filter(todo => todo.id !== id)
}

/**
 * Pure function to toggle todo completion status
 */
export function toggleTodoInArray(todos: Todo[], id: string): Todo[] {
  return todos.map(todo =>
    todo.id === id 
      ? { ...todo, completed: !todo.completed }
      : todo
  )
}

/**
 * Pure function to update todo fields
 */
export function updateTodoInArray(
  todos: Todo[], 
  id: string, 
  updates: Partial<Omit<Todo, 'id'>>
): Todo[] {
  return todos.map(todo =>
    todo.id === id 
      ? { ...todo, ...updates }
      : todo
  )
}