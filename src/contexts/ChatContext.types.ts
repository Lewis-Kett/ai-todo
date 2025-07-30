import { ChatMessage } from '@/types/chat'

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  streamingMessageId?: string
}

export type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_STREAMING_ID'; payload: string | undefined }
  | { type: 'START_CHAT' }
  | { type: 'COMPLETE_CHAT' }
  | { type: 'CHAT_ERROR'; payload: string }

export interface ChatContextType {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  streamingMessageId?: string
  messageCount: number
  hasMessages: boolean
  lastMessage: ChatMessage | null
}

export interface ChatDispatchContextType {
  sendMessage: (content: string, conversationHistory?: ChatMessage[]) => Promise<unknown>
  handleSendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

export interface ChatProviderProps {
  children: React.ReactNode
}