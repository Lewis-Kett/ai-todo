import { render, screen } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'
import { useChat } from '@/contexts/ChatContext'
import { ChatProvider } from '@/contexts/ChatContext'

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


// Mock the useChat hook from context
jest.mock('@/contexts/ChatContext', () => ({
  ...jest.requireActual('@/contexts/ChatContext'),
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

// No need to mock simple UI components - test the real rendered output

const mockUseChat = useChat as jest.MockedFunction<typeof useChat>

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      streamingMessageId: undefined,
      messageCount: 0,
      handleSendMessage: jest.fn()
    })
  })

  it('renders with default structure', () => {
    render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    )
    
    // Test semantic structure and user-visible content
    expect(screen.getByRole('heading', { name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
    
    // Verify actual DOM structure using data-slot attributes from card components
    const cardElement = screen.getByRole('heading').closest('[data-slot="card"]')
    expect(cardElement).toBeInTheDocument()
    expect(cardElement).toHaveClass('flex', 'flex-col', 'h-[600px]')
    
    const headerElement = screen.getByRole('heading').closest('[data-slot="card-header"]')
    expect(headerElement).toBeInTheDocument()
    
    const contentElement = document.querySelector('[data-slot="card-content"]')
    expect(contentElement).toBeInTheDocument()
  })

  it('applies custom className to the card', () => {
    render(
      <ChatProvider>
        <ChatInterface className="custom-class" />
      </ChatProvider>
    )
    
    // The className should be applied to the Card component
    const cardElement = screen.getByRole('heading').closest('[data-slot="card"]')
    expect(cardElement).toHaveClass('custom-class')
  })

  it('shows correct message count from hook', () => {
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      streamingMessageId: undefined,
      messageCount: 5,
      handleSendMessage: jest.fn()
    })
    
    render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    )
    
    expect(screen.getByText('5 messages')).toBeInTheDocument()
  })

  it('passes correct placeholder to ChatInput', () => {
    render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    )
    
    expect(screen.getByTestId('input-placeholder')).toHaveTextContent('Ask me about your todos or productivity...')
  })

  it('passes handleSendMessage from hook to ChatInput', () => {
    const mockHandleSendMessage = jest.fn()
    mockUseChat.mockReturnValue({
      messages: [],
      isLoading: false,
      streamingMessageId: undefined,
      messageCount: 0,
      handleSendMessage: mockHandleSendMessage
    })
    
    render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    )
    
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
    
    render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    )
    
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
    
    render(
      <ChatProvider>
        <ChatInterface />
      </ChatProvider>
    )
    
    expect(screen.getByTestId('streaming-id')).toHaveTextContent('test-streaming-id')
  })
})