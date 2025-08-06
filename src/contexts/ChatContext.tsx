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
      // Call server action with existing conversation history (not including current message)
      const stream = await sendChatMessage(content, state.messages)
      
      // Create a reader for the stream
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      
      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true }).trim()
        if (!chunk) continue
        
        try {
          const parsed = JSON.parse(chunk)
          
          // Handle streaming partial response
          if (parsed.partial?.responseToUser) {
            dispatch({ 
              type: 'UPDATE_MESSAGE', 
              payload: { 
                id: assistantMessageId, 
                content: parsed.partial.responseToUser 
              } 
            })
          }
          
          // Handle final response
          if (parsed.final) {
            // Execute tool actions if needed
            if (parsed.final.action && parsed.final.action !== 'chat') {
              const { handleChatToolResponse } = await import('@/actions/chat-tool-handler')
              await handleChatToolResponse(parsed.final)
            }
            
            // Update with final message
            dispatch({ 
              type: 'UPDATE_MESSAGE', 
              payload: { 
                id: assistantMessageId, 
                content: parsed.final.responseToUser 
              } 
            })
          }
        } catch (parseError) {
          console.error('Error parsing stream chunk:', parseError)
        }
      }
      
      dispatch({ type: 'COMPLETE_CHAT' })
      
    } catch (error) {
      console.error('Chat streaming error:', error)
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