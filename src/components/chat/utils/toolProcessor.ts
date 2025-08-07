import type {
  AddTodoTool,
  DeleteTodoTool,
  ToggleTodoTool,
  UpdateTodoTool,
  ChatTool,
} from "@/baml_client/types"
import { handleChatToolResponse } from "@/actions/chat-tool-handler"

export type FinalDataType =
  | AddTodoTool
  | DeleteTodoTool
  | ToggleTodoTool
  | UpdateTodoTool
  | ChatTool

export async function processToolResponse(
  toolResponse: FinalDataType
): Promise<void> {
  // Handle tool execution only if it's not just a chat response
  if (toolResponse.action && toolResponse.action !== "chat") {
    await handleChatToolResponse(toolResponse)
  }
}

// Error message utilities
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("todos")) {
      return "Sorry, I encountered an error loading your todos. Please try again."
    }
    return error.message
  }
  return "Sorry, I encountered an error. Please try again."
}
