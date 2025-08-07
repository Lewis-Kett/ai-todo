import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { ChatProvider, useChat, useChatState, useChatDispatch } from '../ChatContext'

describe('ChatContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChatProvider>{children}</ChatProvider>
  )

  describe('ChatProvider', () => {
    it('provides initial state correctly', () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      expect(result.current.messages).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.streamingMessageId).toBeUndefined()
      expect(result.current.messageCount).toBe(0)
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

})