import { useState } from "react"
import { Message } from "@/baml_client/types"
import { createMessage } from "../utils/messageUtils"
import { streamChatMessage } from "@/actions/chat-actions"
import { processTodoAction, type TodoActionResponse } from "@/lib/todo-action-processor"
import { CHAT_ANIMATION_DURATION } from "@/lib/constants"

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)

  const sendMessage = async (inputValue: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const userMessage: Message = createMessage("user", inputValue)
      // Add user message immediately
      setMessages((prev) => [...prev, userMessage])

      // Create initial assistant message for streaming
      const assistantMessage = createMessage("assistant", "")
      setMessages((prev) => [...prev, assistantMessage])
      setStreamingMessageId(assistantMessage.id)

      let finalResponse: TodoActionResponse | null = null

      try {
        // Stream the response
        const stream = await streamChatMessage(inputValue, messages)
        for await (const response of stream) {
          finalResponse = response
          
          // Update the message with matching assistantMessage ID
          setMessages((prev) => {
            return prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: response.responseToUser }
                : msg
            )
          })
        }

        // After streaming completes, process any todo operations
        if (finalResponse && finalResponse.action !== "chat") {
          await processTodoAction(finalResponse)
        }
        
        // Clear streaming message ID after animation completes
        setTimeout(() => setStreamingMessageId(null), CHAT_ANIMATION_DURATION)
      } catch (streamError) {
        console.error("Streaming error:", streamError)
        setError("Failed to process your request. Please try again.")
        
        // Remove the empty assistant message on error
        setMessages((prev) => {
          return prev.filter(msg => 
            !(msg.id === assistantMessage.id && !msg.content)
          )
        })
        
        // Clear streaming message ID on error
        setTimeout(() => setStreamingMessageId(null), CHAT_ANIMATION_DURATION)
      }
    } catch (error) {
      console.error("Send message error:", error)
      setError("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => setError(null)

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    streamingMessageId
  }
}