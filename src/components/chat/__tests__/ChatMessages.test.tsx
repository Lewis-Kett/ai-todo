import { render, screen } from '@testing-library/react'
import { ChatMessages } from '../ChatMessages'
import { type ChatMessage } from '@/types/chat'

interface MockScrollAreaProps {
  children: React.ReactNode
  [key: string]: unknown
}

interface MockChatMessageProps {
  message: {
    id: string
    content: string
  }
  isStreaming: boolean
}

// Mock the scroll-area component
jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: MockScrollAreaProps) => (
    <div data-testid="scroll-area" {...props}>
      {children}
    </div>
  )
}))

// Mock the ChatMessage component
jest.mock('../ChatMessage', () => ({
  ChatMessage: ({ message, isStreaming }: MockChatMessageProps) => (
    <div data-testid={`chat-message-${message.id}`} data-streaming={isStreaming}>
      {message.content}
    </div>
  )
}))

describe('ChatMessages', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello'
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hi there!'
    }
  ]

  it('renders empty state when no messages', () => {
    render(<ChatMessages messages={[]} />)
    
    expect(screen.getByText('Start a conversation')).toBeInTheDocument()
    expect(screen.getByText('Ask me anything about your todos or productivity!')).toBeInTheDocument()
  })

  it('does not show empty state when loading', () => {
    render(<ChatMessages messages={[]} isLoading={true} />)
    
    expect(screen.queryByText('Start a conversation')).not.toBeInTheDocument()
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
  })

  it('renders messages correctly', () => {
    render(<ChatMessages messages={mockMessages} />)
    
    expect(screen.getByTestId('chat-message-1')).toBeInTheDocument()
    expect(screen.getByTestId('chat-message-2')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('renders messages with ScrollArea component', () => {
    render(<ChatMessages messages={mockMessages} />)
    
    expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
  })

  it('shows loading indicator when isLoading is true', () => {
    render(<ChatMessages messages={mockMessages} isLoading={true} />)
    
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
  })

  it('does not show loading indicator when isLoading is false', () => {
    render(<ChatMessages messages={mockMessages} isLoading={false} />)
    
    expect(screen.queryByText('AI is thinking...')).not.toBeInTheDocument()
  })

  it('passes streaming state to correct message', () => {
    render(
      <ChatMessages 
        messages={mockMessages} 
        streamingMessageId="2" 
      />
    )
    
    const message1 = screen.getByTestId('chat-message-1')
    const message2 = screen.getByTestId('chat-message-2')
    
    expect(message1).toHaveAttribute('data-streaming', 'false')
    expect(message2).toHaveAttribute('data-streaming', 'true')
  })

  it('does not show streaming when streamingMessageId is undefined', () => {
    render(<ChatMessages messages={mockMessages} />)
    
    const message1 = screen.getByTestId('chat-message-1')
    const message2 = screen.getByTestId('chat-message-2')
    
    expect(message1).toHaveAttribute('data-streaming', 'false')
    expect(message2).toHaveAttribute('data-streaming', 'false')
  })

  it('renders messages in the correct order', () => {
    render(<ChatMessages messages={mockMessages} />)
    
    const messages = screen.getAllByTestId(/chat-message-/)
    expect(messages).toHaveLength(2)
    expect(messages[0]).toHaveAttribute('data-testid', 'chat-message-1')
    expect(messages[1]).toHaveAttribute('data-testid', 'chat-message-2')
  })

  it('renders with proper spacing classes', () => {
    const { container } = render(<ChatMessages messages={mockMessages} />)
    
    const messagesContainer = container.querySelector('.space-y-2')
    expect(messagesContainer).toBeInTheDocument()
  })
})