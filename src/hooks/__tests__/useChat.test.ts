import { renderHook, act } from '@testing-library/react'
import { useChat } from '../useChat'
import { sendChatMessage } from '@/app/actions/chat'
import { type ChatMessage, type ApiResponse, type ChatResponse } from '@/types/chat'

// Mock the server action
jest.mock('@/app/actions/chat', () => ({
  sendChatMessage: jest.fn()
}))

const mockSendChatMessage = sendChatMessage as jest.MockedFunction<
  (message: string, conversationHistory?: ChatMessage[]) => Promise<SuccessResponse | ErrorResponse>
>

// Type for successful API responses
type SuccessResponse = {
  success: true
  data: ChatResponse
}

// Type for error API responses
type ErrorResponse = {
  success: false
  error: string
}

describe('useChat', () => {
  beforeEach(() => {
    mockSendChatMessage.mockClear()
  })

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useChat())

    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.streamingMessageId).toBeUndefined()
    expect(result.current.messageCount).toBe(0)
    expect(result.current.hasMessages).toBe(false)
    expect(result.current.lastMessage).toBeNull()
  })

  it('sends message successfully', async () => {
    const mockResponse: SuccessResponse = {
      success: true,
      data: {
        message: 'Hello response',
        confidence: 0.9,
        suggestions: ['suggestion1']
      }
    }

    mockSendChatMessage.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat())

    await act(async () => {
      const response = await result.current.sendMessage('Hello')
      expect(response).toEqual(mockResponse.data)
    })

    expect(mockSendChatMessage).toHaveBeenCalledWith('Hello', [])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles error during message sending', async () => {
    const mockError: ErrorResponse = {
      success: false,
      error: 'Network error'
    }

    mockSendChatMessage.mockResolvedValue(mockError)

    const { result } = renderHook(() => useChat())

    await act(async () => {
      await expect(result.current.sendMessage('Hello')).rejects.toThrow('Network error')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Network error')
  })

  it('handles unexpected error during message sending', async () => {
    mockSendChatMessage.mockRejectedValue(new Error('Unexpected error'))

    const { result } = renderHook(() => useChat())

    await act(async () => {
      await expect(result.current.sendMessage('Hello')).rejects.toThrow('Unexpected error')
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe('Unexpected error')
  })

  it('sets loading state during message sending', async () => {
    let resolveMessage: (value: unknown) => void
    const messagePromise = new Promise(resolve => {
      resolveMessage = resolve
    })
    mockSendChatMessage.mockReturnValue(messagePromise as Promise<SuccessResponse | ErrorResponse>)

    const { result } = renderHook(() => useChat())

    act(() => {
      result.current.sendMessage('Hello')
    })

    // Should be loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()

    await act(async () => {
      const resolveValue: ApiResponse<ChatResponse> = {
        success: true,
        data: { message: 'Response', confidence: 0.9, suggestions: [] }
      }
      resolveMessage!(resolveValue)
      await messagePromise
    })

    // Should no longer be loading
    expect(result.current.isLoading).toBe(false)
  })

  it('passes conversation history to sendMessage', async () => {
    const mockResponse: SuccessResponse = {
      success: true,
      data: {
        message: 'Response',
        confidence: 0.9,
        suggestions: []
      }
    }

    mockSendChatMessage.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChat())

    const conversationHistory: ChatMessage[] = [
      {
        id: '1',
        role: 'user',
        content: 'Previous message',
        timestamp: new Date()
      }
    ]

    await act(async () => {
      await result.current.sendMessage('New message', conversationHistory)
    })

    expect(mockSendChatMessage).toHaveBeenCalledWith('New message', conversationHistory)
  })

  it('clears messages', async () => {
    const { result } = renderHook(() => useChat())

    // Mock a successful response
    const mockResponse: SuccessResponse = {
      success: true,
      data: { message: 'Response', confidence: 0.9, suggestions: [] }
    }
    mockSendChatMessage.mockResolvedValue(mockResponse)

    // Add a message using handleSendMessage
    await act(async () => {
      await result.current.handleSendMessage('Test message')
    })

    expect(result.current.messages).toHaveLength(2) // user + assistant

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('computes properties correctly', async () => {
    const { result } = renderHook(() => useChat())

    // Initially empty
    expect(result.current.messageCount).toBe(0)
    expect(result.current.hasMessages).toBe(false)
    expect(result.current.lastMessage).toBeNull()

    // Mock a successful response
    const mockSuccessResponse: SuccessResponse = {
      success: true,
      data: { message: 'Response', confidence: 0.9, suggestions: [] }
    }
    mockSendChatMessage.mockResolvedValue(mockSuccessResponse)

    // Add messages using handleSendMessage
    await act(async () => {
      await result.current.handleSendMessage('First message')
    })

    expect(result.current.messageCount).toBe(2) // user + assistant
    expect(result.current.hasMessages).toBe(true)
    expect(result.current.lastMessage?.role).toBe('assistant')
    expect(result.current.lastMessage?.content).toBe('Response')
  })

  it('clears error when sending new message', async () => {
    const mockError: ErrorResponse = {
      success: false,
      error: 'Initial error'
    }

    const mockSuccess: SuccessResponse = {
      success: true,
      data: {
        message: 'Success response',
        confidence: 0.9,
        suggestions: []
      }
    }

    mockSendChatMessage
      .mockResolvedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccess)

    const { result } = renderHook(() => useChat())

    // First call should set error
    await act(async () => {
      await expect(result.current.sendMessage('First')).rejects.toThrow('Initial error')
    })

    expect(result.current.error).toBe('Initial error')

    // Second call should clear error
    await act(async () => {
      await result.current.sendMessage('Second')
    })

    expect(result.current.error).toBeNull()
  })

  describe('chat UI functionality', () => {
    it('handles complete send message workflow', async () => {
      // Mock the server action to return success
      const mockSuccessResponse: SuccessResponse = {
        success: true,
        data: {
          message: 'Mock response',
          confidence: 0.9,
          suggestions: []
        }
      }
      mockSendChatMessage.mockResolvedValue(mockSuccessResponse)

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.handleSendMessage('Test message')
      })

      expect(result.current.messages).toHaveLength(2) // User + Assistant
      expect(result.current.messages[0].role).toBe('user')
      expect(result.current.messages[0].content).toBe('Test message')
      expect(result.current.messages[1].role).toBe('assistant')
      expect(result.current.messages[1].content).toBe('Mock response')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.streamingMessageId).toBeUndefined()
      
      // Test computed properties after messages are added
      expect(result.current.messageCount).toBe(2)
      expect(result.current.hasMessages).toBe(true)
      expect(result.current.lastMessage?.content).toBe('Mock response')
      expect(result.current.lastMessage?.role).toBe('assistant')
    })

    it('handles errors in handleSendMessage', async () => {
      // Mock the server action to return failure
      const mockErrorResponse: ErrorResponse = {
        success: false,
        error: 'Send failed'
      }
      mockSendChatMessage.mockResolvedValue(mockErrorResponse)

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.handleSendMessage('Test message')
      })

      expect(result.current.messages).toHaveLength(3) // User + Empty Assistant + Error message
      expect(result.current.messages[0].role).toBe('user')
      expect(result.current.messages[0].content).toBe('Test message')
      expect(result.current.messages[1].role).toBe('assistant')
      expect(result.current.messages[1].content).toBe('') // Empty placeholder message
      expect(result.current.messages[2].role).toBe('assistant')
      expect(result.current.messages[2].content).toBe('Sorry, I encountered an error. Please try again.')
      expect(result.current.error).toBe('Send failed')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.streamingMessageId).toBeUndefined()
    })
  })
})