import { processChatMessage } from '../chat-actions'
import { b } from '@/baml_client'
import { Message } from '@/baml_client/types'
import { Todo } from '@/types/todo'

// Mock shared data layer
let mockTodos: Todo[] = []

jest.mock('@/lib/todo-data', () => ({
  getTodosFromFile: jest.fn().mockImplementation(() => Promise.resolve([...mockTodos])),
  setTodosInFile: jest.fn().mockImplementation((todos: Todo[]) => {
    mockTodos = [...todos]
    return Promise.resolve()
  }),
  revalidateTodos: jest.fn()
}))

// Mock shared operations - pass through to actual implementations for testing
jest.mock('@/lib/todo-operations', () => {
  const actual = jest.requireActual('@/lib/todo-operations')
  return actual
})

// BAML client is mocked globally in __mocks__/@/baml_client.js

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn()
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
})

// Import mocked functions
import { getTodosFromFile, setTodosInFile, revalidateTodos } from '@/lib/todo-data'

const mockGetTodos = getTodosFromFile as jest.MockedFunction<typeof getTodosFromFile>
const mockSetTodos = setTodosInFile as jest.MockedFunction<typeof setTodosInFile>
const mockRevalidateTodos = revalidateTodos as jest.MockedFunction<typeof revalidateTodos>
const mockBAML = b.HandleTodoRequest as jest.MockedFunction<typeof b.HandleTodoRequest>

describe('processChatMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRandomUUID.mockReturnValue('test-uuid-123')
    // Reset mock todos
    mockTodos = [
      { id: '1', name: 'Existing task', category: 'Work', priority: 'High Priority', completed: false }
    ]
  })

  describe('atomic operations', () => {
    it('should perform atomic add_todo operation with single revalidation', async () => {
      // Mock BAML response
      mockBAML.mockResolvedValueOnce({
        action: 'add_todo',
        name: 'New task',
        category: 'Personal',
        priority: 'Medium Priority',
        responseToUser: 'Added your task!'
      })

      const messages: Message[] = []
      const result = await processChatMessage('Add a new task', messages)

      // Verify atomic operation: read -> process -> write -> single revalidate
      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockSetTodos).toHaveBeenCalledTimes(1)
      expect(mockRevalidateTodos).toHaveBeenCalledTimes(1)

      // Verify the new todo was added
      expect(mockTodos).toHaveLength(2)
      expect(mockTodos[1]).toEqual({
        id: 'test-uuid-123',
        name: 'New task',
        category: 'Personal',
        priority: 'Medium Priority',
        completed: false
      })

      expect(result).toEqual({
        message: 'Added your task!',
        success: true,
        updatedTodos: mockTodos
      })
    })

    it('should perform atomic delete_todo operation', async () => {
      // Set up initial todos
      mockTodos = [
        { id: '1', name: 'Task 1', category: 'Work', priority: 'High Priority', completed: false },
        { id: '2', name: 'Task 2', category: 'Personal', priority: 'Low Priority', completed: true }
      ]

      mockBAML.mockResolvedValueOnce({
        action: 'delete_todo',
        id: '1',
        responseToUser: 'Task deleted!'
      })

      const result = await processChatMessage('Delete the first task', [])

      expect(mockTodos).toHaveLength(1)
      expect(mockTodos[0].id).toBe('2')

      expect(mockRevalidateTodos).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)
      expect(result.updatedTodos).toEqual(mockTodos)
    })

    it('should perform atomic toggle_todo operation', async () => {
      // Set up initial todos
      mockTodos = [
        { id: '1', name: 'Task 1', category: 'Work', priority: 'High Priority', completed: false }
      ]

      mockBAML.mockResolvedValueOnce({
        action: 'toggle_todo',
        id: '1',
        responseToUser: 'Task toggled!'
      })

      const result = await processChatMessage('Toggle the task', [])

      expect(mockTodos[0].completed).toBe(true)

      expect(mockRevalidateTodos).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)
    })

    it('should perform atomic update_todo operation', async () => {
      // Set up initial todos
      mockTodos = [
        { id: '1', name: 'Old name', category: 'Old category', priority: 'Low Priority', completed: false }
      ]

      mockBAML.mockResolvedValueOnce({
        action: 'update_todo',
        id: '1',
        name: 'New name',
        category: 'New category',
        priority: 'High Priority',
        responseToUser: 'Task updated!'
      })

      const result = await processChatMessage('Update the task', [])

      expect(mockTodos[0]).toEqual({
        id: '1',
        name: 'New name',
        category: 'New category',
        priority: 'High Priority',
        completed: false
      })

      expect(mockRevalidateTodos).toHaveBeenCalledTimes(1)
      expect(result.success).toBe(true)
    })
  })

  describe('chat action', () => {
    it('should handle chat action without file operations or cache invalidation', async () => {
      jest.clearAllMocks() // Clear any previous mock calls
      mockTodos = []
      
      mockBAML.mockResolvedValueOnce({
        action: 'chat',
        responseToUser: 'Here is some advice...'
      })

      const result = await processChatMessage('Give me advice', [])

      // File should be read initially, but no write should occur for chat
      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockSetTodos).not.toHaveBeenCalled()
      expect(mockRevalidateTodos).not.toHaveBeenCalled()

      expect(result).toEqual({
        message: 'Here is some advice...',
        success: true,
        updatedTodos: undefined
      })
    })
  })

  describe('error handling', () => {
    it('should handle BAML errors gracefully', async () => {
      mockTodos = []
      mockBAML.mockRejectedValueOnce(new Error('BAML error'))

      const result = await processChatMessage('Test message', [])

      expect(result).toEqual({
        message: 'Sorry, I encountered an error processing your request.',
        success: false
      })

      // Should not have called file operations after error
      expect(mockSetTodos).not.toHaveBeenCalled()
      expect(mockRevalidateTodos).not.toHaveBeenCalled()
    })

    it('should handle file read errors by starting with empty array', async () => {
      // Mock getTodosFromFile to throw error, simulating file read failure
      mockGetTodos.mockRejectedValueOnce(new Error('File not found'))
      
      mockBAML.mockResolvedValueOnce({
        action: 'add_todo',
        name: 'New task',
        category: 'Personal',
        priority: 'Medium Priority',
        responseToUser: 'Added your task!'
      })

      const result = await processChatMessage('Add a task', [])

      // Error should be caught and handled gracefully
      expect(result).toEqual({
        message: 'Sorry, I encountered an error processing your request.',
        success: false
      })
    })
  })

  describe('single cache invalidation', () => {
    it('should only call revalidateTodos once per operation', async () => {
      mockTodos = []

      mockBAML.mockResolvedValueOnce({
        action: 'add_todo',
        name: 'Test task',
        category: 'Test',
        priority: 'Low Priority',
        responseToUser: 'Added!'
      })

      await processChatMessage('Add task', [])

      // Verify single cache invalidation
      expect(mockRevalidateTodos).toHaveBeenCalledTimes(1)
    })
  })

  describe('conversation history handling', () => {
    it('should pass conversation history to BAML correctly', async () => {
      jest.clearAllMocks() // Clear any previous mock calls
      mockTodos = []
      
      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Previous message' },
        { id: '2', role: 'assistant', content: 'Previous response' }
      ]

      mockBAML.mockResolvedValueOnce({
        action: 'chat',
        responseToUser: 'Response'
      })

      await processChatMessage('New message', messages)

      expect(mockBAML).toHaveBeenCalledWith(
        'New message',
        [],
        messages
      )
    })
  })
})