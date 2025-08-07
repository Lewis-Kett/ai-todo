"use client"

import { useCallback, useState, useRef } from "react"
import { useHandleTodoRequest } from "@/baml_client/react/hooks"
import type { Message } from "@/baml_client/types"
import { getTodos } from "@/actions/todo-actions"
import {
  getErrorMessage,
  processToolResponse,
  type FinalDataType,
} from "../utils/toolProcessor"
import { createUserMessage, createAssistantMessage } from "../utils/messageUtils"

export function useChat() {
  // Store conversation history for the chat
  const [conversationHistory, setConversationHistory] = useState<Message[]>([])
  // Track the current streaming message ID
  const streamingMessageIdRef = useRef<string | null>(null)

  const hookResult = useHandleTodoRequest({
    stream: true,
    onStreamData: (data) => {
      // Update streaming content in real-time by finding the message with the streaming ID
      if (data?.responseToUser && streamingMessageIdRef.current) {
        setConversationHistory(prev => 
          prev.map(msg => 
            msg.id === streamingMessageIdRef.current 
              ? { ...msg, content: data.responseToUser }
              : msg
          )
        )
      }
    },
    onFinalData: async (finalData: FinalDataType | undefined) => {
      if (!finalData) return
      
      // Update the message with final content but DO NOT add to history or change ID
      if (finalData.responseToUser && streamingMessageIdRef.current) {
        setConversationHistory(prev => 
          prev.map(msg => 
            msg.id === streamingMessageIdRef.current 
              ? { ...msg, content: finalData.responseToUser }
              : msg
          )
        )
      }
      
      //process tool responses
      try {
        await processToolResponse(finalData)
      } catch (error) {
        console.error("Tool processing error:", error)
      }
    },
  })

  const sendMessage = useCallback(
    async (content: string) => {
      try {
        const currentTodos = await getTodos()
        
        // Step 1: Add user message to history
        const userMessage = createUserMessage(content)
        
        // Step 2: Create placeholder assistant message with UUID
        const assistantMessageId = crypto.randomUUID()
        const placeholderAssistant = createAssistantMessage("", assistantMessageId)
        
        // Step 3: Construct conversation context for BAML (without placeholder)
        const contextForNextBamlCall = [...conversationHistory, userMessage]
        
        // Step 4: Add both messages to history (user + placeholder assistant)
        setConversationHistory((prev) => [...prev, userMessage, placeholderAssistant])
        
        // Step 5: Set the streaming message ID for tracking during callbacks
        streamingMessageIdRef.current = assistantMessageId

        // Step 6: Call BAML function with explicit context (excludes placeholder)
        await hookResult.mutate(content, currentTodos, contextForNextBamlCall)
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    },
    [hookResult, conversationHistory]
  )

  return {
    conversationHistory,
    streamingMessageId: streamingMessageIdRef.current || undefined,
    isLoading: hookResult.isLoading,
    isStreaming: hookResult.isStreaming,
    error: hookResult.error ? getErrorMessage(hookResult.error) : undefined,
    sendMessage,
  }
}
