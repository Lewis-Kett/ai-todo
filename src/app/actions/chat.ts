'use server'

import { type ChatMessage, type ApiResponse, type ChatResponse } from '@/types/chat'

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<ApiResponse<ChatResponse>> {
  // This is a mock implementation for now
  // Will be replaced with actual BAML integration in TASK 5
  try {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Log conversation history for future implementation
    console.log('Conversation history:', conversationHistory)
    
    return {
      success: true,
      data: {
        message: `You said: "${message}". This is a mock response.`,
        confidence: 0.9,
        suggestions: ['Continue the conversation', 'Ask about todos']
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