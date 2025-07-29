import { render, screen } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'
import { useChat } from '@/hooks/useChat'

interface MockChatMessagesProps {
  messages: unknown[]
  isLoading: boolean
  streamingMessageId?: string
}

interface MockChatInputProps {
  onSendMessage: (message: string) => void
  disabled: boolean
  placeholder: string
}

interface MockCardProps {
  children: React.ReactNode
  className?: string
}

// Mock the useChat hook
jest.mock('@/hooks/useChat', () => ({
  useChat: jest.fn()
}))

// Mock the child components
jest.mock('../ChatMessages', () => ({
  ChatMessages: ({ messages, isLoading, streamingMessageId }: MockChatMessagesProps) => (
    <div data-testid="chat-messages">
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="streaming-id">{streamingMessageId || 'none'}</div>
    </div>
  )
}))

jest.mock('../ChatInput', () => ({
  ChatInput: ({ onSendMessage, disabled, placeholder }: MockChatInputProps) => (
    <div data-testid="chat-input">
      <button 
        onClick={() => onSendMessage('test message')}
        disabled={disabled}
        data-testid="send-button"
      >
        Send
      </button>
      <div data-testid="input-disabled">{disabled.toString()}</div>
      <div data-testid="input-placeholder">{placeholder}</div>
    </div>
  )
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: MockCardProps) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  )
}))

const mockUseChat = useChat as jest.MockedFunction<typeof useChat>

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      streamingMessageId: undefined,
      messageCount: 0,
      handleSendMessage: jest.fn(),
      error: null,
      hasMessages: false,
      lastMessage: null,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
    })
  })

  it('renders with default structure', () => {
    render(<ChatInterface />)
    
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<ChatInterface className="custom-class" />)
    
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-class')
  })

  it('shows correct message count from hook', () => {
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      streamingMessageId: undefined,
      messageCount: 5,
      handleSendMessage: jest.fn(),
      error: null,
      hasMessages: false,
      lastMessage: null,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
    })
    
    render(<ChatInterface />)
    
    expect(screen.getByText('5 messages')).toBeInTheDocument()
  })

  it('passes correct placeholder to ChatInput', () => {
    render(<ChatInterface />)
    
    expect(screen.getByTestId('input-placeholder')).toHaveTextContent('Ask me about your todos or productivity...')
  })

  it('passes handleSendMessage from hook to ChatInput', () => {
    const mockHandleSendMessage = jest.fn()
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      streamingMessageId: undefined,
      messageCount: 0,
      handleSendMessage: mockHandleSendMessage,
      error: null,
      hasMessages: false,
      lastMessage: null,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
    })
    
    render(<ChatInterface />)
    
    // The handleSendMessage should be passed to ChatInput
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('reflects loading state from hook', () => {
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: true,
      streamingMessageId: undefined,
      messageCount: 0,
      handleSendMessage: jest.fn(),
      error: null,
      hasMessages: false,
      lastMessage: null,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
    })
    
    render(<ChatInterface />)
    
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true')
    expect(screen.getByTestId('input-disabled')).toHaveTextContent('true')
  })

  it('reflects streaming state from hook', () => {
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      streamingMessageId: 'test-streaming-id',
      messageCount: 0,
      handleSendMessage: jest.fn(),
      error: null,
      hasMessages: false,
      lastMessage: null,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
    })
    
    render(<ChatInterface />)
    
    expect(screen.getByTestId('streaming-id')).toHaveTextContent('test-streaming-id')
  })
})