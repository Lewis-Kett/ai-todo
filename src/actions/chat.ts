"use server"

import { HandleTodoRequest } from "../../baml_client/react/server_streaming"
import { type Message } from "../../baml_client"
import { getTodos } from "./todo-actions"

export async function sendChatMessage(
  message: string,
  conversationHistory: Message[] = []
): Promise<ReadableStream<Uint8Array>> {
  // Get current todos for context
  const currentTodos = await getTodos()

  // Use streaming version from BAML
  const stream = await HandleTodoRequest(
    message,
    currentTodos,
    conversationHistory
  )

  return stream
}
