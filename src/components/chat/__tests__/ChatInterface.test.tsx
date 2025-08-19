import { render, screen, fireEvent } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'
import { useChatStream } from '../hooks/useChatStream'
import { Message } from '@/baml_client/types'

// Mock the custom hook
jest.mock('../hooks/useChatStream', () => ({
  useChatStream: jest.fn()
}))

const mockUseChatStream = useChatStream as jest.MockedFunction<typeof useChatStream>

// Mock child components
jest.mock('../ChatMessages', () => ({
  ChatMessages: ({ messages, isLoading }: any) => (
    <div data-testid="chat-messages">
      <div data-testid="messages-count">{messages.length}</div>
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          {msg.content}
        </div>
      ))}
    </div>
  )
}))

jest.mock('../ChatInput', () => ({
  ChatInput: ({ onSendMessage, disabled }: any) => (
    <div data-testid="chat-input">
      <button 
        onClick={() => onSendMessage('test message')}
        data-testid="send-button"
        disabled={disabled}
      >
        Send
      </button>
      <div data-testid="input-disabled">{disabled ? 'disabled' : 'enabled'}</div>
    </div>
  )
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock implementation
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: jest.fn(),
      clearError: jest.fn()
    })
  })

  it('renders with correct structure', () => {
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: jest.fn(),
      clearError: jest.fn()
    })
    
    render(<ChatInterface />)
    
    expect(screen.getByRole('heading', { name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('sends messages through streaming hook successfully', async () => {
    const mockSendMessage = jest.fn()
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'test message' },
      { id: '2', role: 'assistant', content: 'Todo added successfully!' }
    ]
    
    mockUseChatStream.mockReturnValue({
      messages,
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    render(<ChatInterface />)
    
    const sendButton = screen.getByTestId('send-button')
    fireEvent.click(sendButton)
    
    expect(mockSendMessage).toHaveBeenCalledWith('test message')
    expect(screen.getByText('2 messages')).toBeInTheDocument()
  })

  it('displays error messages with dismiss functionality', async () => {
    const mockClearError = jest.fn()
    const mockSendMessage = jest.fn()
    
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: false,
      error: 'Failed to process your request. Please try again.',
      sendMessage: mockSendMessage,
      clearError: mockClearError
    })
    
    render(<ChatInterface />)
    
    expect(screen.getByText('Failed to process your request. Please try again.')).toBeInTheDocument()
    expect(screen.getByText('Dismiss')).toBeInTheDocument()
    
    // Test error dismissal
    fireEvent.click(screen.getByText('Dismiss'))
    expect(mockClearError).toHaveBeenCalledTimes(1)
  })

  it('hides error section when no error is present', () => {
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: jest.fn(),
      clearError: jest.fn()
    })
    
    render(<ChatInterface />)
    
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument()
  })

  it('disables input during processing', async () => {
    const mockSendMessage = jest.fn()
    
    // Initially not loading
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    const { rerender } = render(<ChatInterface />)
    
    // Initially enabled
    expect(screen.getByTestId('input-disabled')).toHaveTextContent('enabled')
    
    // Update to loading state
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: true,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    rerender(<ChatInterface />)
    
    // Should be disabled during processing
    expect(screen.getByTestId('input-disabled')).toHaveTextContent('disabled')
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    
    // Update to completed state
    mockUseChatStream.mockReturnValue({
      messages: [{ id: '1', role: 'assistant', content: 'Response completed' }],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    rerender(<ChatInterface />)
    
    // Should be enabled again after completion
    expect(screen.getByTestId('input-disabled')).toHaveTextContent('enabled')
  })

  it('maintains conversation history through streaming hook', async () => {
    const mockSendMessage = jest.fn()
    
    // First state with initial messages
    const initialMessages: Message[] = [
      { id: '1', role: 'user', content: 'test message' },
      { id: '2', role: 'assistant', content: 'First response' }
    ]
    
    mockUseChatStream.mockReturnValue({
      messages: initialMessages,
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    const { rerender } = render(<ChatInterface />)
    
    expect(screen.getByText('2 messages')).toBeInTheDocument()
    
    // Update with more messages
    const updatedMessages: Message[] = [
      ...initialMessages,
      { id: '3', role: 'user', content: 'test message' },
      { id: '4', role: 'assistant', content: 'Second response' }
    ]
    
    mockUseChatStream.mockReturnValue({
      messages: updatedMessages,
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    rerender(<ChatInterface />)
    
    expect(screen.getByText('4 messages')).toBeInTheDocument()
  })

  it('updates message count correctly', async () => {
    const mockSendMessage = jest.fn()
    
    // Initially 0 messages
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    const { rerender } = render(<ChatInterface />)
    
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    
    // Update with messages
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'test message' },
      { id: '2', role: 'assistant', content: 'Response message' }
    ]
    
    mockUseChatStream.mockReturnValue({
      messages,
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearError: jest.fn()
    })
    
    rerender(<ChatInterface />)
    
    expect(screen.getByText('2 messages')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<ChatInterface />)
    
    const chatSection = screen.getByRole('log')
    expect(chatSection).toHaveAttribute('aria-live', 'polite')
    expect(chatSection).toHaveAttribute('aria-labelledby', 'chat-heading')
    expect(chatSection).toHaveAttribute('aria-label', 'Chat conversation')
    
    const heading = screen.getByRole('heading', { name: 'AI Assistant' })
    expect(heading).toHaveAttribute('id', 'chat-heading')
  })

  it('renders error section with proper styling', () => {
    mockUseChatStream.mockReturnValue({
      messages: [],
      isLoading: false,
      error: 'Connection failed',
      sendMessage: jest.fn(),
      clearError: jest.fn()
    })
    
    render(<ChatInterface />)
    
    // The error section is the parent div that contains the error styling
    const errorSection = screen.getByText('Connection failed').closest('.p-4')
    expect(errorSection).toHaveClass('p-4', 'bg-red-50', 'border-t', 'border-red-200')
  })

  it('preserves message content during streaming', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Add a new task' },
      { id: '2', role: 'assistant', content: 'I\'ll add that task for you!' }
    ]
    
    mockUseChatStream.mockReturnValue({
      messages,
      isLoading: false,
      error: null,
      sendMessage: jest.fn(),
      clearError: jest.fn()
    })
    
    render(<ChatInterface />)
    
    expect(screen.getByTestId('message-1')).toHaveTextContent('Add a new task')
    expect(screen.getByTestId('message-2')).toHaveTextContent('I\'ll add that task for you!')
  })
})