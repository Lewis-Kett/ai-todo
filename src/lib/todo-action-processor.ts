import { BatchTodoResponse } from "@/baml_client/types"
import { partial_types } from "@/baml_client"
import { processBatchTodoActions } from "@/actions/todo-actions"

/**
 * Type guard to check if a BatchTodoResponse is complete and safe to process.
 * After streaming completes with @stream.done, all required fields should be present.
 */
function isCompleteBatchResponse(
  response: BatchTodoResponse | partial_types.BatchTodoResponse
): response is BatchTodoResponse {
  // Check if actions array exists and all actions have required fields
  if (!response.actions || !Array.isArray(response.actions)) {
    return false
  }

  // Check each action has its required fields based on action type
  for (const action of response.actions) {
    if (!action.action) return false

    switch (action.action) {
      case "add_todo":
        if (!action.name || !action.category || !action.priority) return false
        break
      case "delete_todo":
      case "toggle_todo":
        if (!action.id) return false
        break
      case "update_todo":
        if (!action.id) return false
        break
      case "chat":
        // Chat tool only requires action field
        break
      default:
        return false
    }
  }

  return true
}

/**
 * Processes a BatchTodoResponse by calling the appropriate server actions sequentially.
 * This centralizes the logic for mapping BAML responses to server actions and avoids race conditions.
 */
export async function processBatchTodoResponse(
  batchResponse: BatchTodoResponse | partial_types.BatchTodoResponse
): Promise<void> {
  // Type guard to ensure response is complete
  if (!isCompleteBatchResponse(batchResponse)) {
    throw new Error(
      "BatchTodoResponse is not complete - streaming may not have finished"
    )
  }

  await processBatchTodoActions(batchResponse.actions)
}
