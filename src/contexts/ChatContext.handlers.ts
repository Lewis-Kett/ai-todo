'use client'

import { sendChatMessage } from '@/actions/chat'
import { generateId } from '@/lib/utils'
import { processStreamChunks } from '@/lib/stream-utils'
import { 
  createUserMessage, 
  createAssistantMessageWithId
} from './ChatContext.helpers'
import type { ChatAction } from './ChatContext.types'
import type { ChatMessage } from '@/types/chat'
import type { Dispatch } from 'react'
import type { AddTodoTool, DeleteTodoTool, ToggleTodoTool, UpdateTodoTool, ChatTool } from '../../baml_client/types'

// Type definitions for streaming response data
interface PartialResponse {
  partial?: {
    responseToUser?: string
  }
}

interface FinalResponse {
  final?: {
    action?: string
    responseToUser?: string
    [key: string]: unknown
  }
}

type StreamingResponse = PartialResponse & FinalResponse

export function handlePartialResponse(
  data: StreamingResponse, 
  assistantMessageId: string, 
  dispatch: Dispatch<ChatAction>
) {
  if (!data.partial?.responseToUser) return
  
  dispatch({ 
    type: 'UPDATE_MESSAGE', 
    payload: { 
      id: assistantMessageId, 
      content: data.partial.responseToUser 
    } 
  })
}

export async function handleFinalResponse(
  data: StreamingResponse, 
  assistantMessageId: string, 
  dispatch: Dispatch<ChatAction>
) {
  if (!data.final) return

  // Handle tool actions
  if (data.final.action && data.final.action !== 'chat') {
    const { handleChatToolResponse } = await import('@/actions/chat-tool-handler')
    await handleChatToolResponse(data.final as AddTodoTool | DeleteTodoTool | ToggleTodoTool | UpdateTodoTool | ChatTool)
  }
  
  // Update with final message
  dispatch({ 
    type: 'UPDATE_MESSAGE', 
    payload: { 
      id: assistantMessageId, 
      content: data.final.responseToUser || '' 
    } 
  })
}

export function initializeChatSession(content: string, dispatch: Dispatch<ChatAction>) {
  dispatch({ type: 'START_CHAT' })
  
  // Add user message
  const userMessage = createUserMessage(content)
  dispatch({ type: 'ADD_MESSAGE', payload: userMessage })
  
  // Setup assistant message for streaming
  const assistantMessageId = generateId()
  const assistantMessage = createAssistantMessageWithId(assistantMessageId, '')
  
  dispatch({ type: 'SET_STREAMING_ID', payload: assistantMessageId })
  dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })
  
  return assistantMessageId
}

export function handleStreamError(
  error: unknown, 
  assistantMessageId: string, 
  dispatch: Dispatch<ChatAction>
) {
  console.error('Chat streaming error:', error)
  
  dispatch({ type: 'CHAT_ERROR', payload: '' })
  dispatch({ 
    type: 'UPDATE_MESSAGE', 
    payload: { 
      id: assistantMessageId, 
      content: 'Sorry, I encountered an error. Please try again.' 
    } 
  })
}

export async function processChatMessage(
  content: string,
  dispatch: Dispatch<ChatAction>,
  messages: ChatMessage[]
) {
  const assistantMessageId = initializeChatSession(content, dispatch)

  try {
    const stream = await sendChatMessage(content, messages)
    
    for await (const data of processStreamChunks(stream)) {
      handlePartialResponse(data, assistantMessageId, dispatch)
      await handleFinalResponse(data, assistantMessageId, dispatch)
    }
    
    dispatch({ type: 'COMPLETE_CHAT' })
    
  } catch (error) {
    handleStreamError(error, assistantMessageId, dispatch)
  }
}