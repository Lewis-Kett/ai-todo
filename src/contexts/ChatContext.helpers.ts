import { ChatMessage } from '@/types/chat'
import { generateId } from '@/lib/utils'

export function createUserMessage(content: string): ChatMessage {
  return {
    id: generateId(),
    role: 'user',
    content
  }
}

export function createAssistantMessage(content: string = ''): ChatMessage {
  return {
    id: generateId(),
    role: 'assistant',
    content
  }
}

export function createAssistantMessageWithId(id: string, content: string = ''): ChatMessage {
  return {
    id,
    role: 'assistant',
    content
  }
}

export function createErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

export function createChatErrorMessage(): ChatMessage {
  return createAssistantMessage('Sorry, I encountered an error. Please try again.')
}