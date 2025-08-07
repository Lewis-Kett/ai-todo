'use client'

import { sendChatMessage } from '@/actions/chat'
import { generateId } from '@/lib/utils'
import { 
  createUserMessage, 
  createAssistantMessageWithId
} from './ChatContext.helpers'
import type { ChatAction } from './ChatContext.types'
import type { ChatMessage } from '@/types/chat'
import type { Dispatch } from 'react'

export async function processChatMessage(
  content: string,
  dispatch: Dispatch<ChatAction>,
  messages: ChatMessage[]
) {
    // Start chat session
    dispatch({ type: 'START_CHAT' })

    // Add user message
    const userMessage = createUserMessage(content)
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })
    
    // Setup assistant message for streaming
    const assistantMessageId = generateId()
    const assistantMessage = createAssistantMessageWithId(assistantMessageId, '')
    
    dispatch({ type: 'SET_STREAMING_ID', payload: assistantMessageId })
    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })

    try {
      // Call server action with existing conversation history (not including current message)
      const stream = await sendChatMessage(content, messages)
      
      // Create a reader for the stream
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      
      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true }).trim()
        if (!chunk) continue
        
        try {
          const parsed = JSON.parse(chunk)
          
          // Handle streaming partial response
          if (parsed.partial?.responseToUser) {
            dispatch({ 
              type: 'UPDATE_MESSAGE', 
              payload: { 
                id: assistantMessageId, 
                content: parsed.partial.responseToUser 
              } 
            })
          }
          
          // Handle final response
          if (parsed.final) {
            // Execute tool actions if needed
            if (parsed.final.action && parsed.final.action !== 'chat') {
              const { handleChatToolResponse } = await import('@/actions/chat-tool-handler')
              await handleChatToolResponse(parsed.final)
            }
            
            // Update with final message
            dispatch({ 
              type: 'UPDATE_MESSAGE', 
              payload: { 
                id: assistantMessageId, 
                content: parsed.final.responseToUser 
              } 
            })
          }
        } catch (parseError) {
          console.error('Error parsing stream chunk:', parseError)
        }
      }
      
      dispatch({ type: 'COMPLETE_CHAT' })
      
    } catch (error) {
      console.error('Chat streaming error:', error)
      // Handle error - just update the assistant message with error text
      dispatch({ type: 'CHAT_ERROR', payload: '' })
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: assistantMessageId, 
          content: 'Sorry, I encountered an error. Please try again.' 
        } 
      })
    }
}