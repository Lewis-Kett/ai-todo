import type { Message } from "@/baml_client/types"

/**
 * Creates a new message with a unique ID
 */
export function createMessage(
  role: Message["role"],
  content: string,
  id?: string
): Message {
  return {
    id: id || crypto.randomUUID(),
    role,
    content,
  }
}

/**
 * Creates a user message
 */
export function createUserMessage(content: string): Message {
  return createMessage("user", content)
}

/**
 * Creates an assistant message
 */
export function createAssistantMessage(content: string, id?: string): Message {
  return createMessage("assistant", content, id)
}
