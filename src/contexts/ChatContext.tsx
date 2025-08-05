'use client'

import { createContext, useContext, useReducer, useCallback } from 'react'
import { sendChatMessage } from '@/actions/chat'
import { generateId } from '@/lib/utils'
import { 
  createUserMessage, 
  createAssistantMessageWithId
} from './ChatContext.helpers'
import type { 
  ChatState, 
  ChatAction, 
  ChatContextType, 
  ChatDispatchContextType,
  ChatProviderProps 
} from './ChatContext.types'


// Initial state
const initialState: ChatState = {
  messages: [],
  isLoading: false,
  streamingMessageId: undefined
}

// Reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
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
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        streamingMessageId: undefined
      }
    case 'SET_STREAMING_ID':
      return { ...state, streamingMessageId: action.payload }
    case 'START_CHAT':
      return { ...state, isLoading: true }
    case 'COMPLETE_CHAT':
      return { ...state, isLoading: false, streamingMessageId: undefined }
    case 'CHAT_ERROR':
      return { ...state, isLoading: false, streamingMessageId: undefined }
    default:
      return state
  }
}


// Create contexts
const ChatContext = createContext<ChatContextType | null>(null)
const ChatDispatchContext = createContext<ChatDispatchContextType | null>(null)

// Provider component
export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // handleSendMessage for chat UI with message management
  const handleSendMessage = useCallback(async (content: string) => {
    // Start chat session
    dispatch({ type: 'START_CHAT' })

    // Add user message
    const userMessage = createUserMessage(content)
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })
    
    // Setup assistant message for streaming
    const assistantMessageId = generateId()
    const assistantMessage = createAssistantMessageWithId(assistantMessageId, '')
    
    dispatch({ type: 'SET_STREAMING_ID', payload: assistantMessageId })
    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage })

    try {
      // Get current messages including the new user message for context
      const currentMessages = [...state.messages, userMessage]
      
      // Call server action
      const result = await sendChatMessage(content, currentMessages)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message')
      }
      
      // Update assistant message with response
      const responseMessage = result.data?.message || 'No response received'
      dispatch({ type: 'UPDATE_MESSAGE', payload: { id: assistantMessageId, content: responseMessage } })
      dispatch({ type: 'COMPLETE_CHAT' })
      
    } catch {
      // Handle error - just update the assistant message with error text
      dispatch({ type: 'CHAT_ERROR', payload: '' })
      dispatch({ 
        type: 'UPDATE_MESSAGE', 
        payload: { 
          id: assistantMessageId, 
          content: 'Sorry, I encountered an error. Please try again.' 
        } 
      })
    }
  }, [state.messages])

  // Computed properties
  const messageCount = state.messages.length

  const contextValue: ChatContextType = {
    messages: state.messages,
    isLoading: state.isLoading,
    streamingMessageId: state.streamingMessageId,
    messageCount
  }

  const dispatchValue: ChatDispatchContextType = {
    handleSendMessage
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