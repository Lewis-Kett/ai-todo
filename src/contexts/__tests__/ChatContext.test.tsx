import { renderHook, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { ChatProvider, useChat, useChatState, useChatDispatch } from '../ChatContext'
import { sendChatMessage } from '@/app/actions/chat'
import { generateId } from '@/lib/utils'

// Mock the server action
jest.mock('@/app/actions/chat', () => ({
  sendChatMessage: jest.fn()
}))

// Mock generateId to have predictable IDs in tests
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  generateId: jest.fn()
}))

const mockSendChatMessage = sendChatMessage as jest.MockedFunction<typeof sendChatMessage>
const mockGenerateId = generateId as jest.MockedFunction<typeof generateId>

describe('ChatContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChatProvider>{children}</ChatProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
    let idCounter = 0
    mockGenerateId.mockImplementation(() => `id-${++idCounter}`)
  })

  describe('ChatProvider', () => {
    it('provides initial state correctly', () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      expect(result.current.messages).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.streamingMessageId).toBeUndefined()
      expect(result.current.messageCount).toBe(0)
      expect(result.current.hasMessages).toBe(false)
      expect(result.current.lastMessage).toBeNull()
    })

    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        renderHook(() => useChatState())
      }).toThrow('useChatState must be used within a ChatProvider')

      expect(() => {
        renderHook(() => useChatDispatch())
      }).toThrow('useChatDispatch must be used within a ChatProvider')

      console.error = originalError
    })
  })

  describe('handleSendMessage', () => {
    it('handles successful message send', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: true,
        data: {
          message: 'AI response',
          confidence: 0.9,
          suggestions: []
        }
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.handleSendMessage('Hello AI')
      })

      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[0]).toEqual({
        id: 'id-1',
        role: 'user',
        content: 'Hello AI',
        timestamp: expect.any(Date)
      })
      expect(result.current.messages[1]).toEqual({
        id: 'id-2',
        role: 'assistant',
        content: 'AI response',
        timestamp: expect.any(Date)
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('handles message send failure', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: false,
        error: 'Network error'
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.handleSendMessage('Hello AI')
      })

      expect(result.current.messages).toHaveLength(2)
      expect(result.current.messages[0].role).toBe('user')
      expect(result.current.messages[1].content).toBe('Sorry, I encountered an error. Please try again.')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Network error')
    })

    it('sets loading and streaming states correctly', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockSendChatMessage.mockReturnValueOnce(promise as any)

      const { result } = renderHook(() => useChat(), { wrapper })

      // Start sending message
      act(() => {
        result.current.handleSendMessage('Test message')
      })

      // Check loading state is true
      expect(result.current.isLoading).toBe(true)
      expect(result.current.streamingMessageId).toBe('id-2')

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          success: true,
          data: { message: 'Response' }
        })
        await promise
      })

      // Check loading state is false
      expect(result.current.isLoading).toBe(false)
      expect(result.current.streamingMessageId).toBeUndefined()
    })
  })

  describe('sendMessage', () => {
    it('handles successful API call', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: true,
        data: {
          message: 'Response',
          confidence: 0.9
        }
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      let response
      await act(async () => {
        response = await result.current.sendMessage('Test', [])
      })

      expect(response).toEqual({
        message: 'Response',
        confidence: 0.9
      })
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('throws error on API failure', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: false,
        error: 'API Error'
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      // Capture error from sendMessage
      let thrownError: Error | null = null
      
      await act(async () => {
        try {
          await result.current.sendMessage('Test', [])
        } catch (e) {
          thrownError = e as Error
        }
      })
      
      // Verify the error was thrown
      expect(thrownError).not.toBeNull()
      expect(thrownError!.message).toBe('API Error')
      
      // The error state should be set after the failed call
      expect(result.current.error).toBe('API Error')
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('clearMessages', () => {
    it('clears all messages and resets state', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: true,
        data: { message: 'Response' }
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      // Add some messages
      await act(async () => {
        await result.current.handleSendMessage('Test')
      })

      expect(result.current.messages.length).toBeGreaterThan(0)

      // Clear messages
      act(() => {
        result.current.clearMessages()
      })

      expect(result.current.messages).toEqual([])
      expect(result.current.error).toBeNull()
      expect(result.current.streamingMessageId).toBeUndefined()
    })
  })

  describe('computed properties', () => {
    it('updates messageCount correctly', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: true,
        data: { message: 'Response' }
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      expect(result.current.messageCount).toBe(0)

      await act(async () => {
        await result.current.handleSendMessage('Test')
      })

      expect(result.current.messageCount).toBe(2)
    })

    it('updates hasMessages correctly', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: true,
        data: { message: 'Response' }
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      expect(result.current.hasMessages).toBe(false)

      await act(async () => {
        await result.current.handleSendMessage('Test')
      })

      expect(result.current.hasMessages).toBe(true)
    })

    it('updates lastMessage correctly', async () => {
      mockSendChatMessage.mockResolvedValueOnce({
        success: true,
        data: { message: 'AI Response' }
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      expect(result.current.lastMessage).toBeNull()

      await act(async () => {
        await result.current.handleSendMessage('User message')
      })

      expect(result.current.lastMessage).toEqual({
        id: 'id-2',
        role: 'assistant',
        content: 'AI Response',
        timestamp: expect.any(Date)
      })
    })
  })
})