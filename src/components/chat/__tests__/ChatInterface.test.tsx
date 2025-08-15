import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'
import { processChatMessage } from '@/actions/chat-actions'

// Mock the server action
jest.mock('@/actions/chat-actions', () => ({
  processChatMessage: jest.fn()
}))

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

const mockProcessChatMessage = processChatMessage as jest.MockedFunction<typeof processChatMessage>

describe('ChatInterface with Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with correct structure', () => {
    render(<ChatInterface />)
    
    expect(screen.getByRole('heading', { name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })

  it('sends messages through server action successfully', async () => {
    mockProcessChatMessage.mockResolvedValue({
      success: true,
      message: 'Todo added successfully!'
    })
    
    render(<ChatInterface />)
    
    const sendButton = screen.getByTestId('send-button')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockProcessChatMessage).toHaveBeenCalledWith('test message', [])
    })

    // Should show both user and assistant messages
    await waitFor(() => {
      expect(screen.getByText('2 messages')).toBeInTheDocument()
    })
  })

  it('handles server action error response', async () => {
    mockProcessChatMessage.mockResolvedValue({
      success: false,
      message: 'Sorry, I encountered an error processing your request.'
    })
    
    render(<ChatInterface />)
    
    const sendButton = screen.getByTestId('send-button')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockProcessChatMessage).toHaveBeenCalledWith('test message', [])
    })

    // Should show error message from server
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an error processing your request.')).toBeInTheDocument()
    })
  })

  it('handles server action exception', async () => {
    mockProcessChatMessage.mockRejectedValue(new Error('Network error'))
    
    render(<ChatInterface />)
    
    const sendButton = screen.getByTestId('send-button')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockProcessChatMessage).toHaveBeenCalledWith('test message', [])
    })

    // Should show generic error message from catch block
    await waitFor(() => {
      expect(screen.getByText('Sorry, I encountered an unexpected error. Please try again.')).toBeInTheDocument()
    })
  })

  it('disables input during processing', async () => {
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockProcessChatMessage.mockReturnValue(promise as any)
    
    render(<ChatInterface />)
    
    // Initially enabled
    expect(screen.getByTestId('input-disabled')).toHaveTextContent('enabled')
    
    const sendButton = screen.getByTestId('send-button')
    fireEvent.click(sendButton)
    
    // Should be disabled during processing
    await waitFor(() => {
      expect(screen.getByTestId('input-disabled')).toHaveTextContent('disabled')
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })
    
    // Resolve the promise
    resolvePromise!({
      success: true,
      message: 'Response completed'
    })
    
    // Should be enabled again after completion
    await waitFor(() => {
      expect(screen.getByTestId('input-disabled')).toHaveTextContent('enabled')
    })
  })

  it('maintains conversation history', async () => {
    mockProcessChatMessage.mockResolvedValue({
      success: true,
      message: 'First response'
    })
    
    render(<ChatInterface />)
    
    const sendButton = screen.getByTestId('send-button')
    
    // Send first message
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockProcessChatMessage).toHaveBeenCalledWith('test message', [])
      expect(screen.getByText('2 messages')).toBeInTheDocument()
    })

    // Reset mock for second call
    mockProcessChatMessage.mockResolvedValue({
      success: true,
      message: 'Second response'
    })
    
    // Send second message - should include conversation history
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockProcessChatMessage).toHaveBeenCalledWith('test message', expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'test message' }),
        expect.objectContaining({ role: 'assistant', content: 'First response' })
      ]))
      expect(screen.getByText('4 messages')).toBeInTheDocument()
    })
  })

  it('updates message count correctly', async () => {
    mockProcessChatMessage.mockResolvedValue({
      success: true,
      message: 'Response message'
    })
    
    render(<ChatInterface />)
    
    // Initially 0 messages
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    
    const sendButton = screen.getByTestId('send-button')
    fireEvent.click(sendButton)
    
    // After sending, should have 2 messages (user + assistant)
    await waitFor(() => {
      expect(screen.getByText('2 messages')).toBeInTheDocument()
    })
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
})