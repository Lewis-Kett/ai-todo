import { useState } from "react"
import { Message, BatchTodoResponse } from "@/baml_client/types"
import { createMessage } from "../utils/messageUtils"
import { streamChatMessage } from "@/actions/chat-actions"
import { processBatchTodoResponse } from "@/lib/todo-action-processor"
import { CHAT_ANIMATION_DURATION } from "@/lib/constants"
import { partial_types } from "@/baml_client"
import { handleError, createChatError } from "@/lib/errors"
import { useToast } from "@/hooks/useToast"

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  )
  const { showError } = useToast()

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

      let bamlResponse: BatchTodoResponse | partial_types.BatchTodoResponse | null =
        null

      try {
        // Stream the response
        const stream = await streamChatMessage(inputValue, messages)
        for await (const response of stream) {
          bamlResponse = response

          // Update the message with matching assistantMessage ID
          setMessages((prev) => {
            return prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: response.responseToUser }
                : msg
            )
          })
        }

        // After streaming completes, process any todo operations, ensure all action fields are present
        if (bamlResponse) {
          await processBatchTodoResponse(bamlResponse)
        }

        // Clear streaming message ID after animation completes
        setTimeout(() => setStreamingMessageId(null), CHAT_ANIMATION_DURATION)
      } catch (error) {
        const appError = handleError(error)
        const chatError = createChatError("Failed to process your request. Please try again.")
        
        console.error("Error:", appError)
        setError(chatError.message)
        showError(chatError)

        // Remove the empty assistant message on error
        setMessages((prev) => {
          return prev.filter(
            (msg) => !(msg.id === assistantMessage.id && !msg.content)
          )
        })

        // Clear streaming message ID on error
        setTimeout(() => setStreamingMessageId(null), CHAT_ANIMATION_DURATION)
      }
    } catch (error) {
      const appError = handleError(error)
      const chatError = createChatError("Failed to send message. Please try again.")
      
      console.error("Send message error:", appError)
      setError(chatError.message)
      showError(chatError)
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
    streamingMessageId,
  }
}
