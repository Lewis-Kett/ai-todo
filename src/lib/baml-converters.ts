import type { ChatMessage } from '@/types/chat'
import type { Message } from '../../baml_client'

/**
 * Convert React ChatMessage to BAML Message format
 */
export function chatMessageToBamlMessage(message: ChatMessage): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString()
  }
}

/**
 * Convert BAML Message to React ChatMessage format
 */
export function bamlMessageToChatMessage(message: Message): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.timestamp)
  }
}

/**
 * Convert array of React ChatMessages to BAML Messages
 */
export function chatMessagesToBamlMessages(messages: ChatMessage[]): Message[] {
  return messages.map(chatMessageToBamlMessage)
}

/**
 * Convert array of BAML Messages to React ChatMessages
 */
export function bamlMessagesToChatMessages(messages: Message[]): ChatMessage[] {
  return messages.map(bamlMessageToChatMessage)
}