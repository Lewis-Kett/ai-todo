"use client"

import { useCallback, useState } from "react"
import { useHandleTodoRequest } from "@/baml_client/react/hooks"
import type { Message } from "@/baml_client/types"
import { getTodos } from "@/actions/todo-actions"
import {
  getErrorMessage,
  processToolResponse,
  type FinalDataType,
} from "../utils/toolProcessor"
import {
  createUserMessage,
  createStreamingPlaceholder,
  isStreamingPlaceholder,
  STREAMING_MESSAGE_ID,
} from "../utils/messageUtils"

export function useChat() {
  // Single state array for all messages
  const [messages, setMessages] = useState<Message[]>([])
  
  const hookResult = useHandleTodoRequest({
    stream: true,
    onStreamData: (streamData) => {
      // Update placeholder message content during streaming
      if (streamData?.responseToUser) {
        setMessages(prev => prev.map(msg => 
          isStreamingPlaceholder(msg)
            ? { ...msg, content: streamData.responseToUser }
            : msg
        ))
      }
    },
    onFinalData: async (finalData: FinalDataType | undefined) => {
      if (!finalData) return

      // Replace placeholder with final assistant message
      if (finalData.responseToUser) {
        setMessages(prev => prev.map(msg => 
          isStreamingPlaceholder(msg)
            ? { ...msg, id: crypto.randomUUID(), content: finalData.responseToUser }
            : msg
        ))
      }

      // Process tool responses using the tool processor
      try {
        await processToolResponse(finalData)
      } catch (error) {
        console.error("Tool processing error:", error)
      }
    },
  })

  const streamingMessageId = hookResult.isStreaming
    ? STREAMING_MESSAGE_ID
    : undefined

  const messageCount = messages.length

  // Simplified send message function using utility functions
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const currentTodos = await getTodos()
        
        // Create messages using utility functions
        const userMessage = createUserMessage(content)
        const placeholderMessage = createStreamingPlaceholder()
        
        // First, update the UI immediately
        let bamlMessages: Message[] = []
        
        setMessages(prev => {
          const newMessages = [...prev, userMessage, placeholderMessage]
          
          // Prepare BAML messages (exclude placeholder) for use outside
          bamlMessages = newMessages
            .filter(msg => !isStreamingPlaceholder(msg))
          
          return newMessages
        })

        // Call BAML function OUTSIDE of state update to avoid recursion
        await hookResult.mutate(content, currentTodos, bamlMessages)
        
      } catch (error) {
        console.error("Failed to send message:", error)
        // Error handling is now managed by BAML hook's built-in error state
      }
    },
    [hookResult]
  )

  return {
    messages,
    streamingMessageId,
    messageCount,
    sendMessage,
    isLoading: hookResult.isLoading,
    isStreaming: hookResult.isStreaming,
    error: hookResult.error ? getErrorMessage(hookResult.error) : undefined,
  }
}
