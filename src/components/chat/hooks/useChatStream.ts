import { useState } from "react"
import { Message } from "@/baml_client/types"
import { createMessage } from "../utils/messageUtils"
import { streamChatMessage } from "@/actions/chat-actions"
import { processTodoAction, type TodoActionResponse } from "@/lib/todo-action-processor"

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      let finalResponse: TodoActionResponse | null = null

      try {
        // Stream the response
        const stream = await streamChatMessage(inputValue, messages)
        for await (const response of stream) {
          finalResponse = response
          
          // Update the last message (assistant) with the streamed responseToUser content
          setMessages((prev) => {
            const newMessages = [...prev]
            if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
              newMessages[newMessages.length - 1] = {
                ...newMessages[newMessages.length - 1],
                content: response.responseToUser
              }
            }
            return newMessages
          })
        }

        // After streaming completes, process any todo operations
        if (finalResponse && finalResponse.action !== "chat") {
          await processTodoAction(finalResponse)
        }
      } catch (streamError) {
        console.error("Streaming error:", streamError)
        setError("Failed to process your request. Please try again.")
        
        // Remove the empty assistant message on error
        setMessages((prev) => {
          const newMessages = [...prev]
          if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant" && !newMessages[newMessages.length - 1].content) {
            newMessages.pop()
          }
          return newMessages
        })
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
    clearError
  }
}