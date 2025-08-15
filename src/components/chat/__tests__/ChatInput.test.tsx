import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from '../ChatInput'

describe('ChatInput', () => {
  const mockOnSendMessage = jest.fn()

  beforeEach(() => {
    mockOnSendMessage.mockClear()
  })

  it('renders input field with correct aria-label', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    expect(input).toBeInTheDocument()
  })


  it('renders send button with correct aria-label', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    expect(sendButton).toBeInTheDocument()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    expect(sendButton).toBeDisabled()
  })

  it('send button is enabled when input has text', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    await user.type(input, 'Hello')
    
    expect(sendButton).toBeEnabled()
  })

  it('calls onSendMessage when form is submitted', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    await user.type(input, 'Hello world')
    await user.click(sendButton)
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world')
  })

  it('clears input after sending message', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    await user.type(input, 'Hello world')
    await user.click(sendButton)
    
    expect(input).toHaveValue('')
  })

  it('sends message when Enter key is pressed', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    
    await user.type(input, 'Hello world')
    await user.keyboard('{Enter}')
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world')
  })

  it('does not send message when Shift+Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    
    await user.type(input, 'Hello world')
    
    // Focus the input and then use keyboard event directly
    input.focus()
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })

  it('does not send empty or whitespace-only messages', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    await user.type(input, '   ')
    await user.click(sendButton)
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })


  it('shows send icon when input has text', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    await user.type(input, 'Hello')
    
    expect(sendButton).toBeInTheDocument()
    expect(sendButton).not.toBeDisabled()
  })

  it('trims whitespace from message before sending', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} />)
    
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    await user.type(input, '  Hello world  ')
    await user.click(sendButton)
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world')
  })

  it('disables input and button when disabled prop is true', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} disabled={true} />)
    
    const input = screen.getByLabelText('Chat message input')
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
    expect(input).toHaveAttribute('placeholder', 'AI is processing...')
  })

  it('shows normal placeholder when not disabled', () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} disabled={false} />)
    
    const input = screen.getByLabelText('Chat message input')
    expect(input).toHaveAttribute('placeholder', 'Type your message...')
  })

  it('does not send message when disabled', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSendMessage={mockOnSendMessage} disabled={true} />)
    
    const sendButton = screen.getByRole('button', { name: 'Send message' })
    
    // Try to interact with disabled components
    await user.click(sendButton)
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })
})