"use server"

import { Message } from "@/baml_client/types"
import { b } from "@/baml_client"
import { getTodos } from "./todo-actions"
import { handleError, createChatError } from "@/lib/errors"

export async function streamChatMessage(
  userMessage: string,
  conversationHistory: Message[]
) {
  try {
    // 1. Get current todos
    const todos = await getTodos()

    // 2. Create streaming response
    const stream = b.stream.HandleTodoRequest(
      userMessage,
      todos,
      conversationHistory
    )

    // 3. Return async generator that yields full response objects
    return (async function* () {
      for await (const response of stream) {
        yield response
      }
    })()
  } catch (error) {
    const appError = handleError(error)
    console.error("Error in streamChatMessage:", appError)
    
    const chatError = createChatError("Sorry, I encountered an error processing your request.")
    throw chatError
  }
}
