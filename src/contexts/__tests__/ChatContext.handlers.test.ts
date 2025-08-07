import { processChatMessage } from '../ChatContext.handlers'
import { sendChatMessage } from '@/actions/chat'
import { generateId } from '@/lib/utils'
import type { ChatAction } from '../ChatContext.types'
import type { ChatMessage } from '@/types/chat'

// Mock the server action
jest.mock('@/actions/chat', () => ({
  sendChatMessage: jest.fn()
}))

// Mock generateId to have predictable IDs in tests
jest.mock('@/lib/utils', () => ({
  ...jest.requireActual('@/lib/utils'),
  generateId: jest.fn()
}))

// Mock the dynamic import of chat-tool-handler
jest.mock('@/actions/chat-tool-handler', () => ({
  handleChatToolResponse: jest.fn()
}))

const mockSendChatMessage = sendChatMessage as jest.MockedFunction<typeof sendChatMessage>
const mockGenerateId = generateId as jest.MockedFunction<typeof generateId>

// Helper function to create mock streams
const createMockStream = (responses: Array<{ partial?: any; final?: any }>) => {
  const readMock = jest.fn()
  
  responses.forEach((response) => {
    readMock.mockResolvedValueOnce({
      done: false,
      value: new TextEncoder().encode(JSON.stringify(response))
    })
  })
  
  readMock.mockResolvedValueOnce({ done: true })
  
  return {
    getReader: () => ({ read: readMock })
  }
}

describe('ChatContext.handlers', () => {
  let dispatch: jest.MockedFunction<(action: ChatAction) => void>
  let messages: ChatMessage[]

  beforeEach(() => {
    jest.clearAllMocks()
    dispatch = jest.fn()
    messages = []
    
    let idCounter = 0
    mockGenerateId.mockImplementation(() => `id-${++idCounter}`)
  })

  describe('processChatMessage', () => {
    it('handles successful message send with streaming', async () => {
      const mockStream = createMockStream([
        { partial: { responseToUser: 'AI is thinking...' } },
        { partial: { responseToUser: 'AI response' } },
        { final: { action: 'chat', responseToUser: 'AI response' } }
      ])

      mockSendChatMessage.mockResolvedValueOnce(mockStream as any)

      await processChatMessage('Hello AI', dispatch, messages)

      // Verify dispatch calls
      expect(dispatch).toHaveBeenCalledWith({ type: 'START_CHAT' })
      expect(dispatch).toHaveBeenCalledWith({
        type: 'ADD_MESSAGE',
        payload: { id: 'id-1', role: 'user', content: 'Hello AI' }
      })
      expect(dispatch).toHaveBeenCalledWith({
        type: 'SET_STREAMING_ID',
        payload: 'id-2'
      })
      expect(dispatch).toHaveBeenCalledWith({
        type: 'ADD_MESSAGE',
        payload: { id: 'id-2', role: 'assistant', content: '' }
      })
      
      // Verify streaming updates
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_MESSAGE',
        payload: { id: 'id-2', content: 'AI is thinking...' }
      })
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_MESSAGE',
        payload: { id: 'id-2', content: 'AI response' }
      })
      
      expect(dispatch).toHaveBeenCalledWith({ type: 'COMPLETE_CHAT' })
      expect(sendChatMessage).toHaveBeenCalledWith('Hello AI', messages)
    })

    it('handles tool action responses', async () => {
      const mockStream = createMockStream([
        { partial: { responseToUser: 'Adding todo...' } },
        { 
          final: { 
            action: 'add_todo', 
            responseToUser: 'Todo added!',
            name: 'Test todo',
            category: 'Work',
            priority: 'High Priority'
          } 
        }
      ])

      mockSendChatMessage.mockResolvedValueOnce(mockStream as any)
      
      // We need to mock the dynamic import
      const { handleChatToolResponse } = await import('@/actions/chat-tool-handler')
      const mockHandleChatToolResponse = handleChatToolResponse as jest.MockedFunction<typeof handleChatToolResponse>

      await processChatMessage('Add a todo', dispatch, messages)

      // Verify tool handler was called
      expect(mockHandleChatToolResponse).toHaveBeenCalledWith({
        action: 'add_todo',
        responseToUser: 'Todo added!',
        name: 'Test todo',
        category: 'Work',
        priority: 'High Priority'
      })
    })

    it('handles message send failure', async () => {
      mockSendChatMessage.mockRejectedValueOnce(new Error('Network error'))

      await processChatMessage('Hello AI', dispatch, messages)

      // Verify error handling
      expect(dispatch).toHaveBeenCalledWith({ type: 'CHAT_ERROR', payload: '' })
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_MESSAGE',
        payload: { 
          id: 'id-2', 
          content: 'Sorry, I encountered an error. Please try again.' 
        }
      })
    })

    it('handles parsing errors gracefully', async () => {
      const readMock = jest.fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode('invalid json')
        })
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(JSON.stringify({ 
            final: { action: 'chat', responseToUser: 'Valid response' } 
          }))
        })
        .mockResolvedValueOnce({ done: true })
      
      const mockStream = {
        getReader: () => ({ read: readMock })
      }

      mockSendChatMessage.mockResolvedValueOnce(mockStream as any)
      
      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await processChatMessage('Test', dispatch, messages)

      // Verify parsing error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error parsing stream chunk:',
        expect.any(Error)
      )

      // Verify the valid response was still processed
      expect(dispatch).toHaveBeenCalledWith({
        type: 'UPDATE_MESSAGE',
        payload: { id: 'id-2', content: 'Valid response' }
      })

      consoleErrorSpy.mockRestore()
    })

    it('skips tool execution for chat actions', async () => {
      const mockStream = createMockStream([
        { final: { action: 'chat', responseToUser: 'Just chatting' } }
      ])

      mockSendChatMessage.mockResolvedValueOnce(mockStream as any)
      
      const { handleChatToolResponse } = await import('@/actions/chat-tool-handler')
      const mockHandleChatToolResponse = handleChatToolResponse as jest.MockedFunction<typeof handleChatToolResponse>

      await processChatMessage('Just chat', dispatch, messages)

      // Verify tool handler was NOT called for chat action
      expect(mockHandleChatToolResponse).not.toHaveBeenCalled()
    })

    it('passes conversation history to sendChatMessage', async () => {
      const existingMessages: ChatMessage[] = [
        { id: 'msg-1', role: 'user', content: 'Previous message' },
        { id: 'msg-2', role: 'assistant', content: 'Previous response' }
      ]

      const mockStream = createMockStream([
        { final: { action: 'chat', responseToUser: 'Response' } }
      ])

      mockSendChatMessage.mockResolvedValueOnce(mockStream as any)

      await processChatMessage('New message', dispatch, existingMessages)

      expect(sendChatMessage).toHaveBeenCalledWith('New message', existingMessages)
    })
  })
})