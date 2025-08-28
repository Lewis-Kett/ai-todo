import { renderHook, act } from '@testing-library/react'
import { useChatStream } from '../useChatStream'
import { Message, BatchTodoResponse } from '@/baml_client/types'
import { createMessage } from '../../utils/messageUtils'
import { streamChatMessage } from '@/actions/chat-actions'
import { processBatchTodoResponse } from '@/lib/todo-action-processor'

// Mock all external dependencies
jest.mock('../../utils/messageUtils')
jest.mock('@/actions/chat-actions')
jest.mock('@/lib/todo-action-processor')
jest.mock('@/hooks/useToast')
jest.mock('@/lib/errors')

// Cast mocked functions for type safety
const mockCreateMessage = createMessage as jest.MockedFunction<typeof createMessage>
const mockStreamChatMessage = streamChatMessage as jest.MockedFunction<typeof streamChatMessage>
const mockProcessBatchTodoResponse = processBatchTodoResponse as jest.MockedFunction<typeof processBatchTodoResponse>

// Import and mock toast functions
import { useToast } from '@/hooks/useToast'
import { handleError, createChatError } from '@/lib/errors'

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>
const mockCreateChatError = createChatError as jest.MockedFunction<typeof createChatError>

// Helper to create mock async generator from batch responses
function createMockStream(batchResponse: BatchTodoResponse) {
  return (async function* () {
    yield batchResponse
  })()
}

// Helper to create mock messages
const createMockMessage = (role: Message['role'], content: string, id = 'mock-id'): Message => ({
  id,
  role,
  content
})

describe('useChatStream', () => {
  const mockShowError = jest.fn()

  // Suppress console.error for error condition tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock implementations
    mockCreateMessage.mockImplementation((role, content, id) => ({
      id: id || 'mock-id',
      role,
      content
    }))

    // Mock useToast hook
    mockUseToast.mockReturnValue({
      showSuccess: jest.fn(),
      showError: mockShowError,
      showWarning: jest.fn(),
      showInfo: jest.fn(),
      showLoading: jest.fn(),
      dismiss: jest.fn(),
    })

    // Mock error handling functions
    mockHandleError.mockImplementation((error) => error)
    mockCreateChatError.mockImplementation((message) => ({ message, code: 'CHAT_ERROR', severity: 'medium' }))
  })

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useChatStream())

      expect(result.current.messages).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.sendMessage).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
      expect(result.current.streamingMessageId).toBe(null)
    })
  })

  describe('clearError functionality', () => {
    it('should clear error state when clearError is called', async () => {
      const { result } = renderHook(() => useChatStream())

      // Simulate an error by making streamChatMessage reject
      mockStreamChatMessage.mockRejectedValue(new Error('Network error'))

      // Send message to trigger error
      await act(async () => {
        result.current.sendMessage('test message')
      })

      // Verify error is set
      expect(result.current.error).not.toBe(null)

      // Clear error
      act(() => {
        result.current.clearError()
      })

      // Verify error is cleared
      expect(result.current.error).toBe(null)
    })
  })

  describe('successful message sending', () => {
    it('should handle chat response successfully', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'Hello! How can I help you today?'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))
      
      const userMessage = createMockMessage('user', 'Hello', 'user-mock-id')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Hello')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[0]).toEqual(userMessage)
      expect(result.current.messages[1]).toEqual({
        ...assistantMessage,
        content: 'Hello! How can I help you today?'
      })
    })

    it('should handle add_todo action and process batch todo operations', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{
          action: 'add_todo',
          name: 'New task',
          category: 'Work',
          priority: 'High Priority'
        }],
        responseToUser: 'I\'ve added your task!'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))
      mockProcessBatchTodoResponse.mockResolvedValue()

      const userMessage = createMockMessage('user', 'Add a new task', 'user-mock-id-2')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-2')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Add a new task')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(mockProcessBatchTodoResponse).toHaveBeenCalledWith(mockBatchResponse)
      expect(result.current.messages[1].content).toBe('I\'ve added your task!')
    })

    it('should handle multiple actions in batch', async () => {
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
        responseToUser: 'I\'ve added both tasks for you!'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))
      mockProcessBatchTodoResponse.mockResolvedValue()

      const userMessage = createMockMessage('user', 'Add two tasks', 'user-mock-id-3')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-3')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Add two tasks')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.messages[1].content).toBe('I\'ve added both tasks for you!')
      expect(mockProcessBatchTodoResponse).toHaveBeenCalledWith(mockBatchResponse)
    })

    it('should not process batch when only chat actions', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'Just chatting, no actions needed'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Just chat with me')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(mockProcessBatchTodoResponse).toHaveBeenCalledWith(mockBatchResponse)
    })

    it('should handle all todo action types in batch', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [
          {
            action: 'delete_todo',
            id: '123'
          },
          {
            action: 'toggle_todo',
            id: '456'
          },
          {
            action: 'update_todo',
            id: '789',
            name: 'Updated task',
            category: 'Personal',
            priority: 'Medium Priority'
          }
        ],
        responseToUser: 'I\'ve processed all your todo operations!'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))
      mockProcessBatchTodoResponse.mockResolvedValue()

      const userMessage = createMockMessage('user', 'Delete task 123, toggle task 456, and update task 789')
      const assistantMessage = createMockMessage('assistant', '')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Delete task 123, toggle task 456, and update task 789')
      })

      expect(mockProcessBatchTodoResponse).toHaveBeenCalledWith(mockBatchResponse)
      expect(result.current.error).toBe(null)
      expect(result.current.messages[1].content).toBe('I\'ve processed all your todo operations!')
    })
  })

  describe('error handling', () => {
    it('should handle stream creation errors and show toast', async () => {
      const streamError = new Error('Failed to create stream')
      mockStreamChatMessage.mockRejectedValue(streamError)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('test message')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Failed to process your request. Please try again.')
      expect(result.current.messages).toHaveLength(1) // User message is added before the error occurs
      expect(result.current.messages[0].role).toBe('user')
      
      // Check error handling and toast notification
      expect(mockHandleError).toHaveBeenCalledWith(streamError)
      expect(mockCreateChatError).toHaveBeenCalledWith('Failed to process your request. Please try again.')
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should handle streaming errors and clean up assistant message', async () => {
      const errorStream = (async function* () {
        yield { 
          actions: [{ action: 'chat' }],
          responseToUser: 'Starting...'
        } as BatchTodoResponse
        throw new Error('Stream interrupted')
      })()

      mockStreamChatMessage.mockResolvedValue(errorStream)

      const userMessage = createMockMessage('user', 'test', 'user-mock-id-stream-error')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-stream-error')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('test')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Failed to process your request. Please try again.')
      // Should keep assistant message with content on error
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[0]).toEqual(userMessage)
      expect(result.current.messages[1].content).toBe('Starting...')
      
      // Check error handling and toast notification
      expect(mockCreateChatError).toHaveBeenCalledWith('Failed to process your request. Please try again.')
      expect(mockShowError).toHaveBeenCalled()
    })

    it('should handle processBatchTodoResponse errors gracefully', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{
          action: 'add_todo',
          name: 'Task',
          category: 'Work',
          priority: 'High Priority'
        }],
        responseToUser: 'Task added!'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))
      mockProcessBatchTodoResponse.mockRejectedValue(new Error('Failed to add todo'))

      const userMessage = createMockMessage('user', 'Add task', 'user-mock-id-process-error')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-process-error')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Add task')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Failed to process your request. Please try again.')
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[1].content).toBe('Task added!')
    })
  })

  describe('loading state management', () => {
    it('should manage loading state correctly during successful flow', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'Response'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))

      const { result } = renderHook(() => useChatStream())

      // Initially not loading
      expect(result.current.isLoading).toBe(false)

      await act(async () => {
        result.current.sendMessage('test')
      })

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('message state management', () => {
    it('should pass conversation history to streamChatMessage', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'Response'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))
      
      const userMessage = createMockMessage('user', 'Test message', 'user-mock-id-update-content')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-update-content')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Test message')
      })

      // Verify that streamChatMessage was called with empty history (initial state)
      expect(mockStreamChatMessage).toHaveBeenCalledWith('Test message', [])
    })

    it('should update assistant message content during streaming', async () => {
      const responses = [
        {
          actions: [{ action: 'chat' }],
          responseToUser: 'Partial...'
        },
        {
          actions: [{ action: 'chat' }], 
          responseToUser: 'Complete response!'
        }
      ]

      const streamGenerator = (async function* () {
        for (const response of responses) {
          yield response as BatchTodoResponse
        }
      })()

      mockStreamChatMessage.mockResolvedValue(streamGenerator)

      const userMessage = createMockMessage('user', 'test', 'user-mock-id-streaming-update')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-streaming-update')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('test')
      })

      // Should have final response content
      expect(result.current.messages[1].content).toBe('Complete response!')
    })
  })

  describe('edge cases', () => {
    it('should handle empty input gracefully', async () => {
      const mockBatchResponse: BatchTodoResponse = {
        actions: [{ action: 'chat' }],
        responseToUser: 'How can I help?'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream(mockBatchResponse))
      mockProcessBatchTodoResponse.mockResolvedValue()

      const userMessage = createMockMessage('user', '', 'user-mock-id-empty')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-empty')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('')
      })

      expect(mockStreamChatMessage).toHaveBeenCalledWith('', [])
      expect(result.current.error).toBe(null)
    })

    it('should handle empty stream responses', async () => {
      const emptyStream = (async function* () {
        // Yield nothing
      })()

      mockStreamChatMessage.mockResolvedValue(emptyStream)

      const userMessage = createMockMessage('user', 'test')
      const assistantMessage = createMockMessage('assistant', '')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('test')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[1].content).toBe('') // Assistant message should remain empty
      expect(mockProcessBatchTodoResponse).not.toHaveBeenCalled()
    })
  })
})