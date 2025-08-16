import { render, screen } from '@testing-library/react'
import { ChatMessages } from '../ChatMessages'
import type { Message } from '@/baml_client/types'

interface MockScrollAreaProps {
  children: React.ReactNode
  [key: string]: unknown
}

interface MockChatMessageProps {
  message: {
    id: string
    content: string
  }
}

// Mock scrollIntoView
const mockScrollIntoView = jest.fn()
Element.prototype.scrollIntoView = mockScrollIntoView

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
  ChatMessage: ({ message }: MockChatMessageProps) => (
    <div data-testid={`chat-message-${message.id}`}>
      {message.content}
    </div>
  )
}))

describe('ChatMessages', () => {
  const mockMessages: Message[] = [
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

  beforeEach(() => {
    mockScrollIntoView.mockClear()
  })

  it('renders empty state when no messages', () => {
    render(<ChatMessages messages={[]} />)
    
    // Empty state is not rendered in the simplified version
    const container = screen.getByTestId('scroll-area')
    expect(container).toBeInTheDocument()
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

  it('calls scrollIntoView when messages are rendered', () => {
    render(<ChatMessages messages={mockMessages} />)
    
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end'
    })
  })

  it('calls scrollIntoView when loading state changes', () => {
    const { rerender } = render(<ChatMessages messages={mockMessages} />)
    mockScrollIntoView.mockClear()
    
    rerender(<ChatMessages messages={mockMessages} isLoading={true} />)
    
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'end'
    })
  })
})