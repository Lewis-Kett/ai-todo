import { 
  chatMessageToBamlMessage, 
  bamlMessageToChatMessage,
  chatMessagesToBamlMessages,
  bamlMessagesToChatMessages
} from '../baml-converters'
import type { ChatMessage } from '@/types/chat'
import type { Message } from '../../../baml_client'

describe('BAML Converters', () => {
  const mockChatMessage: ChatMessage = {
    id: 'test-id',
    role: 'user',
    content: 'Hello world',
    timestamp: new Date('2024-01-01T00:00:00.000Z')
  }

  const mockBamlMessage: Message = {
    id: 'test-id',
    role: 'user',
    content: 'Hello world',
    timestamp: '2024-01-01T00:00:00.000Z'
  }

  describe('chatMessageToBamlMessage', () => {
    it('converts ChatMessage to BAML Message format', () => {
      const result = chatMessageToBamlMessage(mockChatMessage)
      
      expect(result).toEqual(mockBamlMessage)
      expect(typeof result.timestamp).toBe('string')
    })
  })

  describe('bamlMessageToChatMessage', () => {
    it('converts BAML Message to ChatMessage format', () => {
      const result = bamlMessageToChatMessage(mockBamlMessage)
      
      expect(result).toEqual(mockChatMessage)
      expect(result.timestamp instanceof Date).toBe(true)
    })
  })

  describe('chatMessagesToBamlMessages', () => {
    it('converts array of ChatMessages to BAML Messages', () => {
      const chatMessages = [mockChatMessage, { ...mockChatMessage, id: 'test-id-2' }]
      const result = chatMessagesToBamlMessages(chatMessages)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(mockBamlMessage)
      expect(typeof result[0].timestamp).toBe('string')
    })

    it('handles empty array', () => {
      const result = chatMessagesToBamlMessages([])
      expect(result).toEqual([])
    })
  })

  describe('bamlMessagesToChatMessages', () => {
    it('converts array of BAML Messages to ChatMessages', () => {
      const bamlMessages = [mockBamlMessage, { ...mockBamlMessage, id: 'test-id-2' }]
      const result = bamlMessagesToChatMessages(bamlMessages)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(mockChatMessage)
      expect(result[0].timestamp instanceof Date).toBe(true)
    })

    it('handles empty array', () => {
      const result = bamlMessagesToChatMessages([])
      expect(result).toEqual([])
    })
  })

  describe('round-trip conversion', () => {
    it('maintains data integrity through round-trip conversion', () => {
      const originalChatMessage = mockChatMessage
      
      // Convert to BAML and back
      const bamlMessage = chatMessageToBamlMessage(originalChatMessage)
      const convertedBackMessage = bamlMessageToChatMessage(bamlMessage)
      
      expect(convertedBackMessage).toEqual(originalChatMessage)
    })
  })
})