import { renderHook, act } from '@testing-library/react'
import { useChatStream } from '../useChatStream'
import { Message } from '@/baml_client/types'
import { createMessage } from '../../utils/messageUtils'
import { streamChatMessage } from '@/actions/chat-actions'
import { processTodoAction, type TodoActionResponse } from '@/lib/todo-action-processor'

// Mock all external dependencies
jest.mock('../../utils/messageUtils')
jest.mock('@/actions/chat-actions')
jest.mock('@/lib/todo-action-processor')

// Cast mocked functions for type safety
const mockCreateMessage = createMessage as jest.MockedFunction<typeof createMessage>
const mockStreamChatMessage = streamChatMessage as jest.MockedFunction<typeof streamChatMessage>
const mockProcessTodoAction = processTodoAction as jest.MockedFunction<typeof processTodoAction>

// Helper to create mock async generator from responses
function createMockStream(responses: TodoActionResponse[]) {
  return (async function* () {
    for (const response of responses) {
      yield response
    }
  })()
}

// Helper to create mock messages
const createMockMessage = (role: Message['role'], content: string, id = 'mock-id'): Message => ({
  id,
  role,
  content
})

describe('useChatStream', () => {
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
  })

  describe('initial state', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useChatStream())

      expect(result.current.messages).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.sendMessage).toBe('function')
      expect(typeof result.current.clearError).toBe('function')
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

      // Verify error is set (could be either error message depending on where it fails)
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
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'Hello! How can I help you today?'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))
      
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

    it('should handle add_todo action and process todo operation', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'add_todo',
        name: 'New task',
        category: 'Work',
        priority: 'High Priority',
        responseToUser: 'I\'ve added your task!'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))
      mockProcessTodoAction.mockResolvedValue()

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
      expect(mockProcessTodoAction).toHaveBeenCalledWith(mockResponse)
      expect(result.current.messages[1].content).toBe('I\'ve added your task!')
    })

    it('should handle multiple streaming responses', async () => {
      const responses: TodoActionResponse[] = [
        { action: 'chat', responseToUser: 'Processing...' },
        { action: 'chat', responseToUser: 'Still working on it...' },
        { action: 'add_todo', name: 'Task', category: 'Work', priority: 'High Priority', responseToUser: 'Done!' }
      ]

      mockStreamChatMessage.mockResolvedValue(createMockStream(responses))
      mockProcessTodoAction.mockResolvedValue()

      const userMessage = createMockMessage('user', 'Create a task', 'user-mock-id-3')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-3')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Create a task')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.messages[1].content).toBe('Done!') // Should have final response
      expect(mockProcessTodoAction).toHaveBeenCalledWith(responses[2]) // Should process the add_todo action
    })

    it('should not process todo action for chat responses', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'Just chatting, no actions needed'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Just chat with me')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(mockProcessTodoAction).not.toHaveBeenCalled()
    })

    it('should handle all todo action types', async () => {
      const testCases: TodoActionResponse[] = [
        {
          action: 'delete_todo',
          id: '123',
          responseToUser: 'Task deleted!'
        },
        {
          action: 'toggle_todo',
          id: '456',
          responseToUser: 'Task toggled!'
        },
        {
          action: 'update_todo',
          id: '789',
          name: 'Updated task',
          category: 'Personal',
          priority: 'Medium Priority',
          responseToUser: 'Task updated!'
        }
      ]

      for (const response of testCases) {
        jest.clearAllMocks()
        mockCreateMessage
          .mockReturnValueOnce(createMockMessage('user', 'test', `user-mock-id-${response.action}`))
          .mockReturnValueOnce(createMockMessage('assistant', '', `assistant-mock-id-${response.action}`))
        
        mockStreamChatMessage.mockResolvedValue(createMockStream([response]))
        mockProcessTodoAction.mockResolvedValue()

        const { result } = renderHook(() => useChatStream())

        await act(async () => {
          result.current.sendMessage(`Test ${response.action}`)
        })

        expect(mockProcessTodoAction).toHaveBeenCalledWith(response)
        expect(result.current.error).toBe(null)
      }
    })
  })

  describe('error handling', () => {
    it('should handle stream creation errors', async () => {
      mockStreamChatMessage.mockRejectedValue(new Error('Failed to create stream'))

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('test message')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Failed to process your request. Please try again.')
      expect(result.current.messages).toHaveLength(1) // User message is added before the error occurs
      expect(result.current.messages[0].role).toBe('user')
    })

    it('should handle streaming errors and clean up assistant message', async () => {
      const errorStream = (async function* () {
        yield { action: 'chat', responseToUser: 'Starting...' } as TodoActionResponse
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
    })

    it('should handle processTodoAction errors gracefully', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'add_todo',
        name: 'Task',
        category: 'Work',
        priority: 'High Priority',
        responseToUser: 'Task added!'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))
      mockProcessTodoAction.mockRejectedValue(new Error('Failed to add todo'))

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
      // processTodoAction errors are handled in the catch block, so error will be set
      expect(result.current.error).toBe('Failed to process your request. Please try again.')
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[1].content).toBe('Task added!')
    })

    it('should not remove assistant message if it has content on streaming error', async () => {
      const errorStream = (async function* () {
        yield { action: 'chat', responseToUser: 'Partial response...' } as TodoActionResponse
        throw new Error('Stream interrupted')
      })()

      mockStreamChatMessage.mockResolvedValue(errorStream)

      const userMessage = createMockMessage('user', 'test', 'user-mock-id-no-remove')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-no-remove')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('test')
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Failed to process your request. Please try again.')
      // Should keep assistant message with partial content
      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[1].content).toBe('Partial response...')
    })
  })

  describe('loading state management', () => {
    it('should manage loading state correctly during successful flow', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'Response'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))

      const { result } = renderHook(() => useChatStream())

      // Initially not loading
      expect(result.current.isLoading).toBe(false)

      // The loading state changes are handled within the act, so we need to check
      // the loading state inside the sendMessage execution context
      await act(async () => {
        result.current.sendMessage('test')
      })

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false)
    })

    it('should manage loading state correctly during error flow', async () => {
      mockStreamChatMessage.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useChatStream())

      expect(result.current.isLoading).toBe(false)

      await act(async () => {
        result.current.sendMessage('test')
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('message state management', () => {
    it('should pass conversation history to streamChatMessage', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'Response'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))
      
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
      const responses: TodoActionResponse[] = [
        { action: 'chat', responseToUser: 'Partial...' },
        { action: 'chat', responseToUser: 'Complete response!' }
      ]

      mockStreamChatMessage.mockResolvedValue(createMockStream(responses))

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

    it('should add messages to state correctly', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'Test response'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))
      
      const userMessage = createMockMessage('user', 'Test message', 'user-mock-id-add-state')
      const assistantMessage = createMockMessage('assistant', '', 'assistant-mock-id-add-state')
      
      mockCreateMessage
        .mockReturnValueOnce(userMessage)
        .mockReturnValueOnce(assistantMessage)

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('Test message')
      })

      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[0].role).toBe('user')
      expect(result.current.messages[0].content).toBe('Test message')
      expect(result.current.messages[1].role).toBe('assistant') 
      expect(result.current.messages[1].content).toBe('Test response')
    })
  })

  describe('edge cases', () => {
    it('should handle empty input gracefully', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'How can I help?'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('')
      })

      expect(mockStreamChatMessage).toHaveBeenCalledWith('', [])
      expect(result.current.error).toBe(null)
    })

    it('should handle whitespace-only input', async () => {
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'I received your message'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage('   ')
      })

      expect(mockStreamChatMessage).toHaveBeenCalledWith('   ', [])
      expect(result.current.error).toBe(null)
    })

    it('should handle very long input messages', async () => {
      const longMessage = 'a'.repeat(10000)
      const mockResponse: TodoActionResponse = {
        action: 'chat',
        responseToUser: 'Received your long message'
      }

      mockStreamChatMessage.mockResolvedValue(createMockStream([mockResponse]))

      const { result } = renderHook(() => useChatStream())

      await act(async () => {
        result.current.sendMessage(longMessage)
      })

      expect(mockStreamChatMessage).toHaveBeenCalledWith(longMessage, [])
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
      expect(mockProcessTodoAction).not.toHaveBeenCalled()
    })
  })
})