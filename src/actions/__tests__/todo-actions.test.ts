/**
 * Unit tests for Server Actions
 * 
 * Following Next.js best practices: Server Actions can be tested as pure functions
 * since they are just async functions that receive parameters and return values.
 */

import { addTodo, deleteTodo, toggleTodoComplete, updateTodo, getTodos, getTodoStats } from '../todo-actions'
import { TodoFormData } from '@/types/todo'

// Mock Next.js cache functions since they're server functions
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn), // Pass through the function for testing
}))

// Import the mocked function for testing
import { revalidateTag } from 'next/cache'

describe('Todo Server Actions', () => {
  beforeEach(() => {
    // Reset the todos array to initial state before each test
    // Note: In a real app, you'd reset your database state
    jest.clearAllMocks()
  })

  describe('getTodos', () => {
    it('should return an array of todos', async () => {
      const todos = await getTodos()
      
      expect(Array.isArray(todos)).toBe(true)
      expect(todos.length).toBeGreaterThan(0)
      expect(todos[0]).toHaveProperty('id')
      expect(todos[0]).toHaveProperty('name')
      expect(todos[0]).toHaveProperty('category')
      expect(todos[0]).toHaveProperty('priority')
      expect(todos[0]).toHaveProperty('completed')
      expect(todos[0]).toHaveProperty('createdAt')
    })

    it('should return todos with correct structure', async () => {
      const todos = await getTodos()
      
      todos.forEach(todo => {
        expect(typeof todo.id).toBe('string')
        expect(typeof todo.name).toBe('string')
        expect(typeof todo.category).toBe('string')
        expect(['High Priority', 'Medium Priority', 'Low Priority']).toContain(todo.priority)
        expect(typeof todo.completed).toBe('boolean')
        expect(todo.createdAt).toBeInstanceOf(Date)
      })
    })
  })

  describe('getTodoStats', () => {
    it('should return correct statistics', async () => {
      const stats = await getTodoStats()
      
      expect(stats).toHaveProperty('completedCount')
      expect(stats).toHaveProperty('pendingCount')
      expect(stats).toHaveProperty('totalCount')
      expect(typeof stats.completedCount).toBe('number')
      expect(typeof stats.pendingCount).toBe('number')
      expect(typeof stats.totalCount).toBe('number')
      expect(stats.completedCount + stats.pendingCount).toBe(stats.totalCount)
    })

    it('should calculate stats correctly', async () => {
      const todos = await getTodos()
      const stats = await getTodoStats()
      
      const expectedCompleted = todos.filter(todo => todo.completed).length
      const expectedPending = todos.filter(todo => !todo.completed).length
      
      expect(stats.completedCount).toBe(expectedCompleted)
      expect(stats.pendingCount).toBe(expectedPending)
      expect(stats.totalCount).toBe(todos.length)
    })
  })

  describe('addTodo', () => {
    it('should add a new todo with valid data', async () => {
      const initialTodos = await getTodos()
      const initialCount = initialTodos.length

      const newTodoData: TodoFormData = {
        name: 'Test Todo',
        category: 'Testing',
        priority: 'High Priority'
      }

      await addTodo(newTodoData)
      
      const updatedTodos = await getTodos()
      expect(updatedTodos).toHaveLength(initialCount + 1)
      
      const newTodo = updatedTodos.find(todo => todo.name === 'Test Todo')
      expect(newTodo).toBeDefined()
      expect(newTodo?.category).toBe('Testing')
      expect(newTodo?.priority).toBe('High Priority')
      expect(newTodo?.completed).toBe(false)
    })

    it('should generate unique IDs for new todos', async () => {
      const todo1Data: TodoFormData = {
        name: 'Todo 1',
        category: 'Test',
        priority: 'Medium Priority'
      }
      
      const todo2Data: TodoFormData = {
        name: 'Todo 2',
        category: 'Test',
        priority: 'Low Priority'
      }

      await addTodo(todo1Data)
      await addTodo(todo2Data)
      
      const todos = await getTodos()
      const todo1 = todos.find(t => t.name === 'Todo 1')
      const todo2 = todos.find(t => t.name === 'Todo 2')
      
      expect(todo1?.id).not.toBe(todo2?.id)
    })
  })

  describe('deleteTodo', () => {
    it('should remove todo with specified ID', async () => {
      const initialTodos = await getTodos()
      const todoToDelete = initialTodos[0]
      
      await deleteTodo(todoToDelete.id)
      
      const updatedTodos = await getTodos()
      expect(updatedTodos).toHaveLength(initialTodos.length - 1)
      expect(updatedTodos.find(todo => todo.id === todoToDelete.id)).toBeUndefined()
    })

    it('should not affect other todos when deleting', async () => {
      const initialTodos = await getTodos()
      const todoToDelete = initialTodos[0]
      const todoToKeep = initialTodos[1]
      
      await deleteTodo(todoToDelete.id)
      
      const updatedTodos = await getTodos()
      const keptTodo = updatedTodos.find(todo => todo.id === todoToKeep.id)
      expect(keptTodo).toBeDefined()
      expect(keptTodo).toEqual(todoToKeep)
    })
  })

  describe('toggleTodoComplete', () => {
    it('should toggle completion status of a todo', async () => {
      const todos = await getTodos()
      const todoToToggle = todos.find(todo => !todo.completed) || todos[0]
      const originalStatus = todoToToggle.completed
      
      await toggleTodoComplete(todoToToggle.id)
      
      const updatedTodos = await getTodos()
      const toggledTodo = updatedTodos.find(todo => todo.id === todoToToggle.id)
      
      expect(toggledTodo?.completed).toBe(!originalStatus)
    })

    it('should only affect the specified todo', async () => {
      const todos = await getTodos()
      const todoToToggle = todos[0]
      const otherTodo = todos[1]
      
      await toggleTodoComplete(todoToToggle.id)
      
      const updatedTodos = await getTodos()
      const unchangedTodo = updatedTodos.find(todo => todo.id === otherTodo.id)
      
      expect(unchangedTodo?.completed).toBe(otherTodo.completed)
    })
  })

  describe('updateTodo', () => {
    it('should update todo name', async () => {
      const todos = await getTodos()
      const todoToUpdate = todos[0]
      const newName = 'Updated Todo Name'
      
      await updateTodo(todoToUpdate.id, { name: newName })
      
      const updatedTodos = await getTodos()
      const updatedTodo = updatedTodos.find(todo => todo.id === todoToUpdate.id)
      
      expect(updatedTodo?.name).toBe(newName)
    })

    it('should update todo category', async () => {
      const todos = await getTodos()
      const todoToUpdate = todos[0]
      const newCategory = 'Updated Category'
      
      await updateTodo(todoToUpdate.id, { category: newCategory })
      
      const updatedTodos = await getTodos()
      const updatedTodo = updatedTodos.find(todo => todo.id === todoToUpdate.id)
      
      expect(updatedTodo?.category).toBe(newCategory)
    })

    it('should update todo priority', async () => {
      const todos = await getTodos()
      const todoToUpdate = todos[0]
      const newPriority = 'Low Priority' as const
      
      await updateTodo(todoToUpdate.id, { priority: newPriority })
      
      const updatedTodos = await getTodos()
      const updatedTodo = updatedTodos.find(todo => todo.id === todoToUpdate.id)
      
      expect(updatedTodo?.priority).toBe(newPriority)
    })

    it('should update multiple fields at once', async () => {
      const todos = await getTodos()
      const todoToUpdate = todos[0]
      const updates = {
        name: 'Multi-Update Todo',
        category: 'Multi-Update',
        priority: 'High Priority' as const
      }
      
      await updateTodo(todoToUpdate.id, updates)
      
      const updatedTodos = await getTodos()
      const updatedTodo = updatedTodos.find(todo => todo.id === todoToUpdate.id)
      
      expect(updatedTodo?.name).toBe(updates.name)
      expect(updatedTodo?.category).toBe(updates.category)
      expect(updatedTodo?.priority).toBe(updates.priority)
    })

    it('should preserve unchanged fields', async () => {
      const todos = await getTodos()
      const todoToUpdate = todos[0]
      const originalCompleted = todoToUpdate.completed
      const originalCreatedAt = todoToUpdate.createdAt
      
      await updateTodo(todoToUpdate.id, { name: 'Updated Name Only' })
      
      const updatedTodos = await getTodos()
      const updatedTodo = updatedTodos.find(todo => todo.id === todoToUpdate.id)
      
      expect(updatedTodo?.completed).toBe(originalCompleted)
      expect(updatedTodo?.createdAt).toEqual(originalCreatedAt)
      expect(updatedTodo?.id).toBe(todoToUpdate.id)
    })
  })

  describe('revalidateTag integration', () => {
    it('should call revalidateTag after mutations', async () => {
      await addTodo({ name: 'Test', category: 'Test', priority: 'Medium Priority' })
      expect(revalidateTag).toHaveBeenCalledWith('todos')
      
      await deleteTodo('test-id')
      expect(revalidateTag).toHaveBeenCalledWith('todos')
      
      await toggleTodoComplete('test-id')
      expect(revalidateTag).toHaveBeenCalledWith('todos')
      
      await updateTodo('test-id', { name: 'Updated' })
      expect(revalidateTag).toHaveBeenCalledWith('todos')
    })
  })
})