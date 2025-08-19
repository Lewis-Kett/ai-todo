import { streamChatMessage } from '../chat-actions'
import { b } from '@/baml_client'
import { Message } from '@/baml_client/types'
import { Todo } from '@/types/todo'
import { getTodos } from '../todo-actions'

// Mock getTodos server action
jest.mock('../todo-actions', () => ({
  getTodos: jest.fn()
}))

// Mock BAML client
jest.mock('@/baml_client', () => ({
  b: {
    stream: {
      HandleTodoRequest: jest.fn()
    }
  }
}))

// Cast mocked functions for type safety
const mockGetTodos = getTodos as jest.MockedFunction<typeof getTodos>
const mockBAMLStream = b.stream.HandleTodoRequest as jest.MockedFunction<typeof b.stream.HandleTodoRequest>

// Helper to create a mock async generator from responses
function createMockStream(responses: any[]) {
  return (async function* () {
    for (const response of responses) {
      yield response
    }
  })()
}

describe('streamChatMessage', () => {
  const mockTodos: Todo[] = [
    { id: '1', name: 'Existing task', category: 'Work', priority: 'High Priority', completed: false }
  ]

  // Suppress console.error for these tests since we're testing error conditions
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTodos.mockResolvedValue(mockTodos)
  })

  describe('successful streaming operations', () => {
    it('should stream add_todo responses', async () => {
      const mockResponse = {
        action: 'add_todo',
        name: 'New task',
        category: 'Personal',
        priority: 'Medium Priority',
        responseToUser: 'Added your task!'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      const messages: Message[] = []
      const stream = await streamChatMessage('Add a new task', messages)

      // Verify getTodos is called to fetch current state
      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      
      // Verify BAML stream is called with current todos (not empty array)
      expect(mockBAMLStream).toHaveBeenCalledWith('Add a new task', mockTodos, messages)

      // Collect streamed responses
      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toEqual([mockResponse])
    })

    it('should stream delete_todo responses', async () => {
      const mockResponse = {
        action: 'delete_todo',
        id: '1',
        responseToUser: 'Task deleted!'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      const messages: Message[] = []
      const stream = await streamChatMessage('Delete the first task', messages)

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toEqual([mockResponse])
      expect(mockBAMLStream).toHaveBeenCalledWith('Delete the first task', mockTodos, messages)
    })

    it('should stream toggle_todo responses', async () => {
      const mockResponse = {
        action: 'toggle_todo',
        id: '1',
        responseToUser: 'Task completed!'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      const messages: Message[] = []
      const stream = await streamChatMessage('Toggle the task', messages)

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toEqual([mockResponse])
      expect(mockBAMLStream).toHaveBeenCalledWith('Toggle the task', mockTodos, messages)
    })

    it('should stream update_todo responses', async () => {
      const mockResponse = {
        action: 'update_todo',
        id: '1',
        name: 'Updated task name',
        category: 'New category',
        priority: 'High Priority',
        responseToUser: 'Task updated!'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      const messages: Message[] = []
      const stream = await streamChatMessage('Update the task', messages)

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toEqual([mockResponse])
      expect(mockBAMLStream).toHaveBeenCalledWith('Update the task', mockTodos, messages)
    })

    it('should stream chat responses', async () => {
      const mockResponse = {
        action: 'chat',
        responseToUser: 'Here is some helpful advice...'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      const messages: Message[] = []
      const stream = await streamChatMessage('Give me advice', messages)

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toEqual([mockResponse])
      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).toHaveBeenCalledWith('Give me advice', mockTodos, messages)
    })
  })

  describe('multiple streaming responses', () => {
    it('should stream multiple responses in sequence', async () => {
      const responses = [
        { action: 'chat', responseToUser: 'Processing...' },
        { action: 'add_todo', name: 'New task', category: 'Work', priority: 'High Priority', responseToUser: 'Task added!' }
      ]
      mockBAMLStream.mockReturnValue(createMockStream(responses))

      const stream = await streamChatMessage('Add a work task', [])

      const streamedResponses = []
      for await (const response of stream) {
        streamedResponses.push(response)
      }

      expect(streamedResponses).toEqual(responses)
    })
  })

  describe('conversation history handling', () => {
    it('should pass conversation history to BAML stream', async () => {
      const conversationHistory: Message[] = [
        { id: '1', role: 'user', content: 'Previous user message' },
        { id: '2', role: 'assistant', content: 'Previous assistant response' }
      ]
      
      const mockResponse = {
        action: 'chat',
        responseToUser: 'Based on our previous conversation...'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      await streamChatMessage('Continue our discussion', conversationHistory)

      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Continue our discussion',
        mockTodos,
        conversationHistory
      )
    })

    it('should handle empty conversation history', async () => {
      const mockResponse = {
        action: 'chat',
        responseToUser: 'Hello! How can I help?'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      await streamChatMessage('Hello', [])

      expect(mockBAMLStream).toHaveBeenCalledWith('Hello', mockTodos, [])
    })
  })

  describe('error handling', () => {
    it('should throw error when getTodos fails', async () => {
      mockGetTodos.mockRejectedValue(new Error('Database error'))

      await expect(streamChatMessage('Add a task', [])).rejects.toThrow(
        'Sorry, I encountered an error processing your request.'
      )
    })

    it('should throw error when BAML stream fails', async () => {
      mockBAMLStream.mockImplementation(() => {
        throw new Error('BAML API error')
      })

      await expect(streamChatMessage('Test message', [])).rejects.toThrow(
        'Sorry, I encountered an error processing your request.'
      )
    })

    it('should handle streaming errors gracefully', async () => {
      const errorStream = (async function* () {
        yield { action: 'chat', responseToUser: 'Starting...' }
        throw new Error('Stream interrupted')
      })()
      
      mockBAMLStream.mockReturnValue(errorStream)

      const stream = await streamChatMessage('Test', [])
      
      await expect(async () => {
        const responses = []
        for await (const response of stream) {
          responses.push(response)
        }
      }).rejects.toThrow('Stream interrupted')
    })
  })

  describe('different todo list states', () => {
    it('should handle empty todo list', async () => {
      mockGetTodos.mockResolvedValue([])
      
      const mockResponse = {
        action: 'add_todo',
        name: 'First task',
        category: 'Getting Started',
        priority: 'High Priority',
        responseToUser: 'Added your first task!'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      await streamChatMessage('Add my first task', [])

      expect(mockBAMLStream).toHaveBeenCalledWith('Add my first task', [], [])
    })

    it('should handle large todo list', async () => {
      const largeTodoList: Todo[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Task ${i + 1}`,
        category: 'Work',
        priority: 'Medium Priority',
        completed: i % 3 === 0
      }))
      mockGetTodos.mockResolvedValue(largeTodoList)
      
      const mockResponse = {
        action: 'chat',
        responseToUser: 'You have quite a few tasks! Let me help organize them.'
      }
      mockBAMLStream.mockReturnValue(createMockStream([mockResponse]))

      await streamChatMessage('Help me organize my tasks', [])

      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Help me organize my tasks',
        largeTodoList,
        []
      )
    })
  })
})