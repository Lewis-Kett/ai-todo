import { processChatMessage } from '../chat-actions'
import { b } from '@/baml_client'
import { Message } from '@/baml_client/types'
import { Todo } from '@/types/todo'

// Mock shared data layer
let mockTodos: Todo[] = []

// Mock todo-actions to simulate the server actions
jest.mock('../todo-actions', () => ({
  getTodos: jest.fn().mockImplementation(() => Promise.resolve([...mockTodos])),
  addTodo: jest.fn().mockImplementation((formData) => {
    const newTodo: Todo = {
      id: 'test-uuid-123',
      name: formData.name,
      category: formData.category,
      priority: formData.priority,
      completed: false
    }
    mockTodos = [...mockTodos, newTodo]
    return Promise.resolve()
  }),
  deleteTodo: jest.fn().mockImplementation((id) => {
    mockTodos = mockTodos.filter(todo => todo.id !== id)
    return Promise.resolve()
  }),
  toggleTodoComplete: jest.fn().mockImplementation((id) => {
    mockTodos = mockTodos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
    return Promise.resolve()
  }),
  updateTodo: jest.fn().mockImplementation((id, updates) => {
    mockTodos = mockTodos.map(todo =>
      todo.id === id ? { ...todo, ...updates } : todo
    )
    return Promise.resolve()
  })
}))

// BAML client is mocked globally in __mocks__/@/baml_client.js

// Mock crypto.randomUUID
const mockRandomUUID = jest.fn()
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: mockRandomUUID,
  },
})

// Import mocked functions
import { getTodos, addTodo, deleteTodo, toggleTodoComplete, updateTodo } from '../todo-actions'

const mockGetTodos = getTodos as jest.MockedFunction<typeof getTodos>
const mockAddTodo = addTodo as jest.MockedFunction<typeof addTodo>
const mockDeleteTodo = deleteTodo as jest.MockedFunction<typeof deleteTodo>
const mockToggleTodo = toggleTodoComplete as jest.MockedFunction<typeof toggleTodoComplete>
const mockUpdateTodo = updateTodo as jest.MockedFunction<typeof updateTodo>
const mockBAML = b.HandleTodoRequest as jest.MockedFunction<typeof b.HandleTodoRequest>

describe('processChatMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRandomUUID.mockReturnValue('test-uuid-123')
    // Reset mock todos
    mockTodos = [
      { id: '1', name: 'Existing task', category: 'Work', priority: 'High Priority', completed: false }
    ]
    // Reset mock implementations
    mockGetTodos.mockImplementation(() => Promise.resolve([...mockTodos]))
    mockAddTodo.mockImplementation((formData) => {
      const newTodo: Todo = {
        id: 'test-uuid-123',
        name: formData.name,
        category: formData.category,
        priority: formData.priority,
        completed: false
      }
      mockTodos = [...mockTodos, newTodo]
      return Promise.resolve()
    })
    mockDeleteTodo.mockImplementation((id) => {
      mockTodos = mockTodos.filter(todo => todo.id !== id)
      return Promise.resolve()
    })
    mockToggleTodo.mockImplementation((id) => {
      mockTodos = mockTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
      return Promise.resolve()
    })
    mockUpdateTodo.mockImplementation((id, updates) => {
      mockTodos = mockTodos.map(todo =>
        todo.id === id ? { ...todo, ...updates } : todo
      )
      return Promise.resolve()
    })
  })

  describe('atomic operations', () => {
    beforeEach(() => {
      // Clear all mocks before each test in this describe block
      jest.clearAllMocks()
    })

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

      // Verify operations were called
      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockAddTodo).toHaveBeenCalledWith({
        name: 'New task',
        category: 'Personal',
        priority: 'Medium Priority'
      })

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
        success: true
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

      expect(mockDeleteTodo).toHaveBeenCalledWith('1')
      expect(result.success).toBe(true)
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

      expect(mockToggleTodo).toHaveBeenCalledWith('1')
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

      expect(mockUpdateTodo).toHaveBeenCalledWith('1', {
        name: 'New name',
        category: 'New category',
        priority: 'High Priority'
      })
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

      // File should be read initially, but no todo operations should occur for chat
      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(mockDeleteTodo).not.toHaveBeenCalled()
      expect(mockToggleTodo).not.toHaveBeenCalled()
      expect(mockUpdateTodo).not.toHaveBeenCalled()

      expect(result).toEqual({
        message: 'Here is some advice...',
        success: true
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

      // Should not have called any todo operations after error
      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(mockDeleteTodo).not.toHaveBeenCalled()
      expect(mockToggleTodo).not.toHaveBeenCalled()
      expect(mockUpdateTodo).not.toHaveBeenCalled()
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

  describe('server action delegation', () => {
    beforeEach(() => {
      // Ensure complete isolation for this test suite
      jest.resetAllMocks()
      jest.clearAllMocks()
      mockTodos = []
      
      // Re-setup the mocks completely fresh
      mockGetTodos.mockImplementation(() => Promise.resolve([]))
      mockAddTodo.mockImplementation(() => Promise.resolve())
      mockDeleteTodo.mockImplementation(() => Promise.resolve())
      mockToggleTodo.mockImplementation(() => Promise.resolve())
      mockUpdateTodo.mockImplementation(() => Promise.resolve())
    })

    it('should delegate to appropriate server action', async () => {
      mockBAML.mockResolvedValueOnce({
        action: 'add_todo',
        name: 'Test task',
        category: 'Test',
        priority: 'Low Priority',
        responseToUser: 'Added!'
      })

      await processChatMessage('Add task', [])

      // Verify server action was called
      expect(mockAddTodo).toHaveBeenCalledTimes(1)
      expect(mockAddTodo).toHaveBeenCalledWith({
        name: 'Test task',
        category: 'Test',
        priority: 'Low Priority'
      })
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