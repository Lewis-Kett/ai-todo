"use server"

import { type ApiResponse, type ChatResponse } from "@/types/chat"
import { b, type Message } from "../../baml_client"
import { getTodos } from "./todo-actions"
import { handleChatToolResponse } from "./chat-tool-handler"

export async function sendChatMessage(
  message: string,
  conversationHistory: Message[] = []
): Promise<ApiResponse<ChatResponse>> {
  try {
    // Get current todos for context
    const currentTodos = await getTodos()

    // Use new HandleTodoRequest function to determine action
    const chatResponse = await b.HandleTodoRequest(
      message,
      currentTodos,
      conversationHistory
    )

    // Handle the chat tool response
    return await handleChatToolResponse(chatResponse)
  } catch (error) {
    console.error("Chat error:", error)
    return {
      success: false,
      error: "Failed to get chat response",
    }
  }
}
