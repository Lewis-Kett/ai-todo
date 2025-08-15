import { revalidateTag } from 'next/cache'
import { promises as fs } from 'fs'
import path from 'path'
import { Todo } from '@/types/todo'

// Path to todos data file
const TODOS_FILE = path.join(process.cwd(), 'data', 'todos.json')

/**
 * Read todos from file system (bypasses cache for atomic operations)
 */
export async function getTodosFromFile(): Promise<Todo[]> {
  try {
    const data = await fs.readFile(TODOS_FILE, 'utf8')
    return JSON.parse(data)
  } catch {
    // If file doesn't exist or is invalid, return empty array
    return []
  }
}

/**
 * Write todos to file system
 */
export async function setTodosInFile(todos: Todo[]): Promise<void> {
  // Ensure directory exists (safe to call repeatedly)
  await fs.mkdir(path.dirname(TODOS_FILE), { recursive: true })
  await fs.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2), 'utf8')
}

/**
 * Invalidate todos cache to trigger revalidation
 */
export function revalidateTodos(): void {
  revalidateTag('todos')
}