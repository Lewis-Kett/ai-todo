'use client'

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { type ChatMessage } from '@/types/chat'
import { sendChatMessage } from '@/app/actions/chat'
import { generateId } from '@/lib/utils'

// Chat state interface
interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  streamingMessageId?: string
}

// Action types for the reducer
type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_STREAMING_ID'; payload: string | undefined }

// Initial state
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
  streamingMessageId: undefined
}

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg
        )
      }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        error: null,
        streamingMessageId: undefined
      }
    case 'SET_STREAMING_ID':
      return { ...state, streamingMessageId: action.payload }
    default:
      return state
  }
}

// Context types
interface ChatContextType {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  streamingMessageId?: string
  messageCount: number
  hasMessages: boolean
  lastMessage: ChatMessage | null
}

interface ChatDispatchContextType {
  sendMessage: (content: string, conversationHistory?: ChatMessage[]) => Promise<unknown>
  handleSendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

// Create contexts
const ChatContext = createContext<ChatContextType | null>(null)
const ChatDispatchContext = createContext<ChatDispatchContextType | null>(null)

// Provider component
export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // Helper functions for creating messages
  const createUserMessage = useCallback((content: string): ChatMessage => ({
    id: generateId(),
    role: 'user',
    content,
    timestamp: new Date()
  }), [])

  const createAssistantMessage = useCallback((content: string = ''): ChatMessage => ({
    id: generateId(),
    role: 'assistant',
    content,
    timestamp: new Date()
  }), [])

  // Unified sendMessage function - handles direct API calls (backward compatible)
  const sendMessage = useCallback(async (
    content: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<unknown> => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      // Call server action with provided conversation history
      const result = await sendChatMessage(content, conversationHistory)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message')
      }

      return result.data
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      throw err
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // handleSendMessage for chat UI with message management
  const handleSendMessage = useCallback(async (content: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    // Add user message immediately
    const userMessage = createUserMessage(content)
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })
    
    try {
      // Create placeholder assistant message for streaming
      const assistantMessageId = generateId()
      dispatch({ type: 'SET_STREAMING_ID', payload: assistantMessageId })
      
      const assistantMessage = createAssistantMessage('')
      const assistantMessageWithId = { ...assistantMessage, id: assistantMessageId }
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessageWithId })

      // Get current messages including the new user message for context
      const currentMessages = [...state.messages, userMessage]
      
      // Call server action directly
      const result = await sendChatMessage(content, currentMessages)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message')
      }
      
      // Update the assistant message with the response
      const responseMessage = result.data?.message || 'No response received'
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id: assistantMessageId, content: responseMessage } })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      
      // Add error message to chat
      const errorChatMessage = createAssistantMessage('Sorry, I encountered an error. Please try again.')
      dispatch({ type: 'ADD_MESSAGE', payload: errorChatMessage })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'SET_STREAMING_ID', payload: undefined })
    }
  }, [state.messages, createUserMessage, createAssistantMessage])

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' })
  }, [])

  // Computed properties
  const messageCount = state.messages.length
  const hasMessages = state.messages.length > 0
  const lastMessage = state.messages.length > 0 ? state.messages[state.messages.length - 1] : null

  const contextValue: ChatContextType = {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    streamingMessageId: state.streamingMessageId,
    messageCount,
    hasMessages,
    lastMessage
  }

  const dispatchValue: ChatDispatchContextType = {
    sendMessage,
    handleSendMessage,
    clearMessages
  }

  return (
    <ChatContext.Provider value={contextValue}>
      <ChatDispatchContext.Provider value={dispatchValue}>
        {children}
      </ChatDispatchContext.Provider>
    </ChatContext.Provider>
  )
}

// Custom hooks for consuming the contexts
export function useChatState() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatState must be used within a ChatProvider')
  }
  return context
}

export function useChatDispatch() {
  const context = useContext(ChatDispatchContext)
  if (!context) {
    throw new Error('useChatDispatch must be used within a ChatProvider')
  }
  return context
}

// Convenience hook that returns both state and dispatch
export function useChat() {
  const state = useChatState()
  const dispatch = useChatDispatch()
  return { ...state, ...dispatch }
}