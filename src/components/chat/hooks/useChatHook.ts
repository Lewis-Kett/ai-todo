'use client'

import { useHandleTodoRequest } from '../../../../baml_client/react/hooks'
import type { AddTodoTool, DeleteTodoTool, ToggleTodoTool, UpdateTodoTool, ChatTool } from '../../../../baml_client/types'
import { handleChatToolResponse } from '@/actions/chat-tool-handler'

// Convert BAML Message type to our ChatMessage type
export type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

type FinalDataType = AddTodoTool | DeleteTodoTool | ToggleTodoTool | UpdateTodoTool | ChatTool

interface UseChatHookProps {
  onStreamData?: (partialData: FinalDataType | undefined) => void
  onFinalData?: (finalData: FinalDataType | undefined) => void
  onError?: (error: Error) => void
}

export function useChatHook({ onStreamData, onFinalData, onError }: UseChatHookProps) {
  const hookResult = useHandleTodoRequest({
    stream: true,
    onStreamData: (partialData: FinalDataType | undefined) => {
      onStreamData?.(partialData)
    },
    onFinalData: async (finalData: FinalDataType | undefined) => {
      if (!finalData) return

      // Handle tool execution
      if (finalData.action && finalData.action !== 'chat') {
        await handleChatToolResponse(finalData as AddTodoTool | DeleteTodoTool | ToggleTodoTool | UpdateTodoTool | ChatTool)
      }

      onFinalData?.(finalData)
    },
    onError: (error: Error) => {
      console.error('Chat error:', error)
      onError?.(error)
    }
  })

  return {
    ...hookResult,
    currentResponse: hookResult.data
  }
}