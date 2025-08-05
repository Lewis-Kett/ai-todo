import { Todo, TodoFormData } from "@/types/todo"

const mockTodos: Todo[] = [
  {
    id: "1",
    name: "Complete the project documentation",
    category: "Work",
    priority: "High Priority",
    completed: false,
  },
  {
    id: "2",
    name: "Review pull requests",
    category: "Development",
    priority: "Medium Priority",
    completed: false,
  },
  {
    id: "3",
    name: "Set up development environment",
    category: "Setup",
    priority: "High Priority",
    completed: true,
  },
]

export async function getTodos(): Promise<Todo[]> {
  return Promise.resolve([...mockTodos])
}

export async function addTodo(formData: TodoFormData): Promise<void> {
  // Mock implementation - formData parameter intentionally unused
  void formData
  return Promise.resolve()
}

export async function deleteTodo(id: string): Promise<void> {
  // Mock implementation - id parameter intentionally unused
  void id
  return Promise.resolve()
}

export async function toggleTodoComplete(id: string): Promise<void> {
  // Mock implementation - id parameter intentionally unused
  void id
  return Promise.resolve()
}

export async function updateTodo(
  id: string,
  updates: Partial<Omit<Todo, "id">>
): Promise<void> {
  // Mock implementation - parameters intentionally unused
  void id
  void updates
  return Promise.resolve()
}

export async function getTodoStats(): Promise<{
  completedCount: number
  pendingCount: number
  totalCount: number
}> {
  return Promise.resolve({
    completedCount: 1,
    pendingCount: 2,
    totalCount: 3,
  })
}
