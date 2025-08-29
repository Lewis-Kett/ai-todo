import { streamChatMessage } from '../chat-actions'
import { b } from '@/baml_client'
import { Message, BatchTodoResponse } from '@/baml_client/types'
import { partial_types } from '@/baml_client'
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

// Mock error handling utilities
jest.mock('@/lib/errors', () => ({
  handleError: jest.fn((error) => error),
  createChatError: jest.fn((message) => {
    const error = new Error(message)
    error.name = 'AppError'
    return Object.assign(error, { code: 'CHAT_ERROR', severity: 'medium' })
  })
}))

// Import and cast mocked functions for type safety
import { handleError, createChatError } from '@/lib/errors'

const mockGetTodos = getTodos as jest.MockedFunction<typeof getTodos>
const mockBAMLStream = b.stream.HandleTodoRequest as jest.MockedFunction<typeof b.stream.HandleTodoRequest>
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>
const mockCreateChatError = createChatError as jest.MockedFunction<typeof createChatError>

// Helper to create a mock BAML stream from batch responses
function createMockStream(batchResponse: BatchTodoResponse) {
  const stream = (async function* () {
    yield batchResponse
  })()
  
  // Add the required BAML stream properties and use type assertion
  const mockStream = Object.assign(stream, {
    ffiStream: {},
    partialCoerce: () => {},
    finalCoerce: () => {},
    ctxManager: {},
    task: Promise.resolve(),
    eventQueue: [],
    driveToCompletion: jest.fn(),
    driveToCompletionInBg: jest.fn(),
    getFinalResponse: () => Promise.resolve(batchResponse),
    toStreamable: () => new ReadableStream(),
    // Add async iterator symbol to satisfy BamlStream interface
    [Symbol.asyncIterator]: stream[Symbol.asyncIterator].bind(stream)
  })
  
  return mockStream as any
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
    it('should stream add_todo batch responses', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{
          action: 'add_todo',
          name: 'New task',
          category: 'Personal',
          priority: 'Medium Priority'
        }],
        responseToUser: 'Added your task!'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const messages: Message[] = []
      const stream = await streamChatMessage('Add a new task', messages)

      // Verify getTodos is called to fetch current state
      expect(mockGetTodos).toHaveBeenCalledTimes(1)

      // Verify BAML stream is called with correct parameters
      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Add a new task',
        mockTodos,
        messages
      )

      // Consume stream and verify responses
      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should stream delete_todo batch responses', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{
          action: 'delete_todo',
          id: '1'
        }],
        responseToUser: 'Deleted your task!'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const messages: Message[] = []
      const stream = await streamChatMessage('Delete task 1', messages)

      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Delete task 1',
        mockTodos,
        messages
      )

      // Consume stream and verify responses
      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should stream toggle_todo batch responses', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{
          action: 'toggle_todo',
          id: '1'
        }],
        responseToUser: 'Toggled your task!'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const messages: Message[] = []
      const stream = await streamChatMessage('Toggle task 1', messages)

      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Toggle task 1',
        mockTodos,
        messages
      )

      // Consume stream and verify responses
      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should stream update_todo batch responses', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{
          action: 'update_todo',
          id: '1',
          name: 'Updated task',
          category: 'Personal',
          priority: 'Low Priority'
        }],
        responseToUser: 'Updated your task!'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const messages: Message[] = []
      const stream = await streamChatMessage('Update task 1', messages)

      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Update task 1',
        mockTodos,
        messages
      )

      // Consume stream and verify responses
      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should stream batch responses with multiple actions', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [
          {
            action: 'add_todo',
            name: 'First task',
            category: 'Work',
            priority: 'High Priority'
          },
          {
            action: 'add_todo',
            name: 'Second task',
            category: 'Personal',
            priority: 'Medium Priority'
          }
        ],
        responseToUser: 'Added both tasks!'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const messages: Message[] = []
      const stream = await streamChatMessage('Add two tasks', messages)

      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Add two tasks',
        mockTodos,
        messages
      )

      // Consume stream and verify responses
      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should stream chat batch responses', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{
          action: 'chat'
        }],
        responseToUser: 'How can I help you today?'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const messages: Message[] = []
      const stream = await streamChatMessage('Hello', messages)

      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Hello',
        mockTodos,
        messages
      )

      // Consume stream and verify responses
      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should handle streaming multiple responses', async () => {
      const responses = [
        {
          actions: [{ action: 'chat' }],
          responseToUser: 'Working on it...'
        },
        {
          actions: [{
            action: 'add_todo',
            name: 'New task',
            category: 'Work',
            priority: 'High Priority'
          }],
          responseToUser: 'Task added successfully!'
        }
      ]

      const streamGenerator = (async function* () {
        for (const response of responses) {
          yield response as BatchTodoResponse
        }
      })()

      // Add BAML stream properties
      const mockStream = Object.assign(streamGenerator, {
        ffiStream: {},
        partialCoerce: () => {},
        finalCoerce: () => {},
        ctxManager: {},
        task: Promise.resolve(),
        eventQueue: [],
        driveToCompletion: jest.fn(),
        driveToCompletionInBg: jest.fn(),
        getFinalResponse: () => Promise.resolve(responses[responses.length - 1]),
        toStreamable: () => new ReadableStream(),
        [Symbol.asyncIterator]: streamGenerator[Symbol.asyncIterator].bind(streamGenerator)
      })

      mockBAMLStream.mockReturnValue(mockStream as any)

      const messages: Message[] = []
      const stream = await streamChatMessage('Add a task', messages)

      // Consume stream and verify all responses
      const collectedResponses = []
      for await (const response of stream) {
        collectedResponses.push(response)
      }

      expect(collectedResponses).toHaveLength(2)
      expect(collectedResponses[0]).toEqual(responses[0])
      expect(collectedResponses[1]).toEqual(responses[1])
    })

    it('should pass conversation history to BAML', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'Response'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const messages: Message[] = [
        { id: '1', role: 'user', content: 'Previous message' },
        { id: '2', role: 'assistant', content: 'Previous response' }
      ]

      await streamChatMessage('Current message', messages)

      expect(mockBAMLStream).toHaveBeenCalledWith(
        'Current message',
        mockTodos,
        messages
      )
    })

    it('should handle empty conversation history', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'Response'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      await streamChatMessage('First message', [])

      expect(mockBAMLStream).toHaveBeenCalledWith(
        'First message',
        mockTodos,
        []
      )
    })
  })

  describe('error handling', () => {
    it('should handle getTodos errors with proper error handling', async () => {
      const databaseError = new Error('Database error')
      mockGetTodos.mockRejectedValue(databaseError)

      await expect(streamChatMessage('Test message', []))
        .rejects.toThrow('Sorry, I encountered an error processing your request.')

      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).not.toHaveBeenCalled()
      
      // Check that error handling utilities were called
      expect(mockHandleError).toHaveBeenCalledWith(databaseError)
      expect(mockCreateChatError).toHaveBeenCalledWith('Sorry, I encountered an error processing your request.')
    })

    it('should handle BAML stream creation errors with proper error handling', async () => {
      const bamlError = new Error('BAML stream error')
      mockBAMLStream.mockImplementation(() => {
        throw bamlError
      })

      await expect(streamChatMessage('Test message', []))
        .rejects.toThrow('Sorry, I encountered an error processing your request.')

      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(mockBAMLStream).toHaveBeenCalledTimes(1)
      
      // Check that error handling utilities were called
      expect(mockHandleError).toHaveBeenCalledWith(bamlError)
      expect(mockCreateChatError).toHaveBeenCalledWith('Sorry, I encountered an error processing your request.')
    })

    it('should handle streaming errors during iteration', async () => {
      const errorStream = (async function* () {
        yield {
          actions: [{ action: 'chat' }],
          responseToUser: 'Starting...'
        } as BatchTodoResponse
        throw new Error('Stream interrupted')
      })()

      // Add BAML stream properties
      const mockErrorStream = Object.assign(errorStream, {
        ffiStream: {},
        partialCoerce: () => {},
        finalCoerce: () => {},
        ctxManager: {},
        task: Promise.resolve(),
        eventQueue: [],
        driveToCompletion: jest.fn(),
        driveToCompletionInBg: jest.fn(),
        getFinalResponse: () => Promise.reject(new Error('Stream interrupted')),
        toStreamable: () => new ReadableStream(),
        [Symbol.asyncIterator]: errorStream[Symbol.asyncIterator].bind(errorStream)
      })

      mockBAMLStream.mockReturnValue(mockErrorStream as any)

      const stream = await streamChatMessage('Test message', [])

      // Should be able to get the stream but error during iteration
      expect(stream).toBeDefined()

      // Consuming the stream should throw
      const responses: partial_types.BatchTodoResponse[] = []
      await expect(async () => {
        for await (const response of stream) {
          responses.push(response)
        }
      }).rejects.toThrow('Stream interrupted')

      // Should have gotten the first response before error
      expect(responses).toHaveLength(1)
      expect(responses[0].responseToUser).toBe('Starting...')
    })
  })

  describe('edge cases', () => {
    it('should handle empty user message', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'Please let me know how I can help you.'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const stream = await streamChatMessage('', [])

      expect(mockBAMLStream).toHaveBeenCalledWith('', mockTodos, [])

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should handle very long user messages', async () => {
      const longMessage = 'a'.repeat(10000)
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'I understand your long message.'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const stream = await streamChatMessage(longMessage, [])

      expect(mockBAMLStream).toHaveBeenCalledWith(longMessage, mockTodos, [])

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should handle empty todos array', async () => {
      mockGetTodos.mockResolvedValue([])
      
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'You have no todos yet.'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const stream = await streamChatMessage('Show my todos', [])

      expect(mockBAMLStream).toHaveBeenCalledWith('Show my todos', [], [])

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })

    it('should handle large todos array', async () => {
      const largeTodosArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Task ${i + 1}`,
        category: 'Work',
        priority: 'Medium Priority' as const,
        completed: false
      }))
      
      mockGetTodos.mockResolvedValue(largeTodosArray)
      
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'You have many todos!'
      }
      mockBAMLStream.mockReturnValue(createMockStream(mockBatchResponse))

      const stream = await streamChatMessage('Show my todos', [])

      expect(mockBAMLStream).toHaveBeenCalledWith('Show my todos', largeTodosArray, [])

      const responses = []
      for await (const response of stream) {
        responses.push(response)
      }

      expect(responses).toHaveLength(1)
      expect(responses[0]).toEqual(mockBatchResponse)
    })
  })
})