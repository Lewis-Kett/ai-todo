/**
 * Streaming utilities for processing ReadableStreams
 * 
 * This module provides utilities for safely processing streaming data,
 * particularly for chat message streams that contain JSON chunks.
 */

/**
 * Safely parse a JSON chunk string
 * @param chunk - The string to parse as JSON
 * @returns Parsed JSON object or null if parsing fails
 */
export function tryParseChunk(chunk: string) {
  try {
    return JSON.parse(chunk)
  } catch (error) {
    console.error('Error parsing stream chunk:', error)
    return null
  }
}

/**
 * Async generator that processes ReadableStream chunks
 * 
 * Reads stream data, decodes it as text, and yields parsed JSON objects.
 * Automatically handles stream cleanup and skips empty/invalid chunks.
 * 
 * @param stream - ReadableStream to process
 * @yields Parsed JSON objects from valid chunks
 */
export async function* processStreamChunks(stream: ReadableStream) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true }).trim()
      if (!chunk) continue
      
      const parsed = tryParseChunk(chunk)
      if (parsed) yield parsed
    }
  } finally {
    reader.releaseLock()
  }
}