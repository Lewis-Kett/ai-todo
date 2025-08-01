'use server'

import { type ChatMessage, type ApiResponse, type ChatResponse } from '@/types/chat'
import { b } from '../../baml_client'
import { chatMessagesToBamlMessages } from '@/lib/baml-converters'

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ApiResponse<ChatResponse>> {
  try {
    // Convert React ChatMessages to BAML Messages format
    const bamlConversationHistory = chatMessagesToBamlMessages(conversationHistory)
    
    // Call BAML ChatWithAssistant function
    const response = await b.ChatWithAssistant(message, bamlConversationHistory)
    
    return {
      success: true,
      data: {
        message: response.message,
        confidence: response.confidence ?? undefined,
        suggestions: response.suggestions ?? undefined
      }
    }
  } catch (error) {
    console.error('Chat error:', error)
    return {
      success: false,
      error: 'Failed to get chat response'
    }
  }
}