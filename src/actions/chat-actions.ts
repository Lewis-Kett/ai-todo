"use server"

import { Message } from "@/baml_client/types"
import { b } from "@/baml_client"
import { getTodos } from "./todo-actions"

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
    console.error("Error in streamChatMessage:", error)
    throw new Error("Sorry, I encountered an error processing your request.")
  }
}
