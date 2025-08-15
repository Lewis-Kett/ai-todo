/**
 * Unit tests for pure todo operations
 */

import { 
  addTodoToArray, 
  deleteTodoFromArray, 
  toggleTodoInArray, 
  updateTodoInArray 
} from '../todo-operations'
import { Todo, TodoFormData } from '@/types/todo'

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-123')
  }
})

describe('Todo Operations', () => {
  const baseTodos: Todo[] = [
    {
      id: 'todo-1',
      name: 'First Todo',
      category: 'Work',
      priority: 'High Priority',
      completed: false
    },
    {
      id: 'todo-2',
      name: 'Second Todo',
      category: 'Personal',
      priority: 'Medium Priority',
      completed: true
    },
    {
      id: 'todo-3',
      name: 'Third Todo',
      category: 'Work',
      priority: 'Low Priority',
      completed: false
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addTodoToArray', () => {
    it('should add new todo to array', () => {
      const todoData: TodoFormData = {
        name: 'New Todo',
        category: 'Test',
        priority: 'High Priority'
      }

      const result = addTodoToArray(baseTodos, todoData)

      expect(result).toHaveLength(baseTodos.length + 1)
      expect(result[result.length - 1]).toEqual({
        id: 'mock-uuid-123',
        name: 'New Todo',
        category: 'Test',
        priority: 'High Priority',
        completed: false
      })
    })

    it('should not mutate original array', () => {
      const todoData: TodoFormData = {
        name: 'New Todo',
        category: 'Test',
        priority: 'Medium Priority'
      }

      const result = addTodoToArray(baseTodos, todoData)

      expect(result).not.toBe(baseTodos)
      expect(baseTodos).toHaveLength(3) // Original unchanged
    })

    it('should generate unique ID', () => {
      const todoData: TodoFormData = {
        name: 'Test Todo',
        category: 'Test',
        priority: 'Low Priority'
      }

      const result = addTodoToArray(baseTodos, todoData)
      const newTodo = result[result.length - 1]

      expect(newTodo.id).toBe('mock-uuid-123')
      expect(crypto.randomUUID).toHaveBeenCalled()
    })
  })

  describe('deleteTodoFromArray', () => {
    it('should remove todo with specified ID', () => {
      const result = deleteTodoFromArray(baseTodos, 'todo-2')

      expect(result).toHaveLength(baseTodos.length - 1)
      expect(result.find(todo => todo.id === 'todo-2')).toBeUndefined()
      expect(result.find(todo => todo.id === 'todo-1')).toBeDefined()
      expect(result.find(todo => todo.id === 'todo-3')).toBeDefined()
    })

    it('should not mutate original array', () => {
      const result = deleteTodoFromArray(baseTodos, 'todo-1')

      expect(result).not.toBe(baseTodos)
      expect(baseTodos).toHaveLength(3) // Original unchanged
    })

    it('should return same array if ID not found', () => {
      const result = deleteTodoFromArray(baseTodos, 'non-existent')

      expect(result).toHaveLength(baseTodos.length)
      expect(result).toEqual(baseTodos)
    })
  })

  describe('toggleTodoInArray', () => {
    it('should toggle completion status of specified todo', () => {
      const result = toggleTodoInArray(baseTodos, 'todo-1')
      const toggledTodo = result.find(todo => todo.id === 'todo-1')

      expect(toggledTodo?.completed).toBe(true) // Was false, now true
    })

    it('should toggle from completed to incomplete', () => {
      const result = toggleTodoInArray(baseTodos, 'todo-2')
      const toggledTodo = result.find(todo => todo.id === 'todo-2')

      expect(toggledTodo?.completed).toBe(false) // Was true, now false
    })

    it('should not affect other todos', () => {
      const result = toggleTodoInArray(baseTodos, 'todo-1')
      const unchanged1 = result.find(todo => todo.id === 'todo-2')
      const unchanged2 = result.find(todo => todo.id === 'todo-3')

      expect(unchanged1?.completed).toBe(true) // Same as original
      expect(unchanged2?.completed).toBe(false) // Same as original
    })

    it('should not mutate original array', () => {
      const result = toggleTodoInArray(baseTodos, 'todo-1')

      expect(result).not.toBe(baseTodos)
      expect(baseTodos[0].completed).toBe(false) // Original unchanged
    })

    it('should return same array if ID not found', () => {
      const result = toggleTodoInArray(baseTodos, 'non-existent')

      expect(result).toEqual(baseTodos)
    })
  })

  describe('updateTodoInArray', () => {
    it('should update todo name', () => {
      const result = updateTodoInArray(baseTodos, 'todo-1', { name: 'Updated Name' })
      const updatedTodo = result.find(todo => todo.id === 'todo-1')

      expect(updatedTodo?.name).toBe('Updated Name')
      expect(updatedTodo?.category).toBe('Work') // Unchanged
      expect(updatedTodo?.priority).toBe('High Priority') // Unchanged
    })

    it('should update todo category', () => {
      const result = updateTodoInArray(baseTodos, 'todo-2', { category: 'Updated Category' })
      const updatedTodo = result.find(todo => todo.id === 'todo-2')

      expect(updatedTodo?.category).toBe('Updated Category')
      expect(updatedTodo?.name).toBe('Second Todo') // Unchanged
    })

    it('should update todo priority', () => {
      const result = updateTodoInArray(baseTodos, 'todo-3', { priority: 'High Priority' })
      const updatedTodo = result.find(todo => todo.id === 'todo-3')

      expect(updatedTodo?.priority).toBe('High Priority')
      expect(updatedTodo?.completed).toBe(false) // Unchanged
    })

    it('should update multiple fields at once', () => {
      const updates = {
        name: 'Multi Updated',
        category: 'Multi Category',
        priority: 'Medium Priority' as const,
        completed: true
      }

      const result = updateTodoInArray(baseTodos, 'todo-1', updates)
      const updatedTodo = result.find(todo => todo.id === 'todo-1')

      expect(updatedTodo).toEqual({
        id: 'todo-1',
        name: 'Multi Updated',
        category: 'Multi Category',
        priority: 'Medium Priority',
        completed: true
      })
    })

    it('should not affect other todos', () => {
      const result = updateTodoInArray(baseTodos, 'todo-1', { name: 'Updated' })
      const unchanged1 = result.find(todo => todo.id === 'todo-2')
      const unchanged2 = result.find(todo => todo.id === 'todo-3')

      expect(unchanged1).toEqual(baseTodos[1])
      expect(unchanged2).toEqual(baseTodos[2])
    })

    it('should not mutate original array', () => {
      const result = updateTodoInArray(baseTodos, 'todo-1', { name: 'Updated' })

      expect(result).not.toBe(baseTodos)
      expect(baseTodos[0].name).toBe('First Todo') // Original unchanged
    })

    it('should return same array if ID not found', () => {
      const result = updateTodoInArray(baseTodos, 'non-existent', { name: 'Updated' })

      expect(result).toEqual(baseTodos)
    })

    it('should handle empty updates object', () => {
      const result = updateTodoInArray(baseTodos, 'todo-1', {})
      const todo = result.find(todo => todo.id === 'todo-1')

      expect(todo).toEqual(baseTodos[0]) // No changes
    })
  })
})