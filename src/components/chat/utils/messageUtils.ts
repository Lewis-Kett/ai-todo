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

/**
 * Creates a streaming placeholder message with a known ID
 */
export function createStreamingPlaceholder(): Message {
  return createMessage("assistant", "", "streaming")
}

/**
 * ID used for streaming placeholder messages
 */
export const STREAMING_MESSAGE_ID = "streaming"

/**
 * Checks if a message is the streaming placeholder
 */
export function isStreamingPlaceholder(message: Message): boolean {
  return message.id === STREAMING_MESSAGE_ID
}