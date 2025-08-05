import { ChatMessage } from '@/types/chat'

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  streamingMessageId?: string
}

export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_STREAMING_ID'; payload: string | undefined }
  | { type: 'START_CHAT' }
  | { type: 'COMPLETE_CHAT' }
  | { type: 'CHAT_ERROR'; payload: string }

export interface ChatContextType {
  messages: ChatMessage[]
  isLoading: boolean
  streamingMessageId?: string
  messageCount: number
}

export interface ChatDispatchContextType {
  handleSendMessage: (content: string) => Promise<void>
}

export interface ChatProviderProps {
  children: React.ReactNode
}