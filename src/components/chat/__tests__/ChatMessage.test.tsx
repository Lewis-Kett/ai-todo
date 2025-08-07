import { render, screen } from '@testing-library/react'
import { ChatMessage } from '../ChatMessage'
import type { Message } from '@/baml_client/types'
import { useTypewriter } from '@/hooks/useTypewriter'

// Mock the useTypewriter hook
jest.mock('@/hooks/useTypewriter', () => ({
  useTypewriter: jest.fn()
}))

const mockUseTypewriter = useTypewriter as jest.MockedFunction<typeof useTypewriter>

describe('ChatMessage', () => {
  const mockUserMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Hello, how are you?'
  }

  const mockAssistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'I am doing well, thank you!'
  }

  beforeEach(() => {
    // Default mock behavior: return the full text (no animation)
    mockUseTypewriter.mockImplementation((text: string, enabled?: boolean) => {
      return enabled !== false ? text : text // Simplified for testing
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders user message with correct styling', () => {
    render(<ChatMessage message={mockUserMessage} />)
    
    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    expect(screen.getByText('U')).toBeInTheDocument()
    
    const messageContent = screen.getByText('Hello, how are you?')
    expect(messageContent).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('renders assistant message with correct styling', () => {
    render(<ChatMessage message={mockAssistantMessage} />)
    
    expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument()
    expect(screen.getAllByText('AI')).toHaveLength(2) // Avatar fallback and badge
    
    const messageContent = screen.getByText('I am doing well, thank you!')
    expect(messageContent).toHaveClass('bg-muted', 'text-muted-foreground')
  })


  it('shows streaming indicator when isStreaming is true', () => {
    render(<ChatMessage message={mockAssistantMessage} isStreaming={true} />)
    
    const streamingIndicator = screen.getByText('▋')
    expect(streamingIndicator).toBeInTheDocument()
    expect(streamingIndicator).toHaveClass('animate-pulse')
  })

  it('does not show streaming indicator when isStreaming is false', () => {
    render(<ChatMessage message={mockAssistantMessage} isStreaming={false} />)
    
    expect(screen.queryByText('▋')).not.toBeInTheDocument()
  })

  it('applies correct layout for user messages (flex-row-reverse)', () => {
    const { container } = render(<ChatMessage message={mockUserMessage} />)
    
    const messageContainer = container.firstChild
    expect(messageContainer).toHaveClass('flex-row-reverse')
  })

  it('applies correct layout for assistant messages (flex-row)', () => {
    const { container } = render(<ChatMessage message={mockAssistantMessage} />)
    
    const messageContainer = container.firstChild
    expect(messageContainer).toHaveClass('flex-row')
  })

  describe('typewriter effect', () => {
    it('uses typewriter hook for assistant messages when streaming', () => {
      render(<ChatMessage message={mockAssistantMessage} isStreaming={true} />)
      
      expect(mockUseTypewriter).toHaveBeenCalledWith(
        'I am doing well, thank you!',
        true // shouldAnimateText = true for assistant + streaming
      )
    })

    it('does not use typewriter animation for user messages', () => {
      render(<ChatMessage message={mockUserMessage} isStreaming={true} />)
      
      expect(mockUseTypewriter).toHaveBeenCalledWith(
        'Hello, how are you?',
        false // shouldAnimateText = false for user messages
      )
    })

    it('does not use typewriter animation for assistant messages when not streaming', () => {
      render(<ChatMessage message={mockAssistantMessage} isStreaming={false} />)
      
      expect(mockUseTypewriter).toHaveBeenCalledWith(
        'I am doing well, thank you!',
        false // shouldAnimateText = false when not streaming
      )
    })

    it('displays partially typed text from typewriter hook', () => {
      // Mock typewriter to return partial text
      mockUseTypewriter.mockReturnValue('I am doing we')
      
      render(<ChatMessage message={mockAssistantMessage} isStreaming={true} />)
      
      expect(screen.getByText('I am doing we')).toBeInTheDocument()
      expect(screen.queryByText('I am doing well, thank you!')).not.toBeInTheDocument()
    })

    it('still shows cursor when streaming with partial text', () => {
      mockUseTypewriter.mockReturnValue('I am doing we')
      
      render(<ChatMessage message={mockAssistantMessage} isStreaming={true} />)
      
      expect(screen.getByText('I am doing we')).toBeInTheDocument()
      expect(screen.getByText('▋')).toBeInTheDocument()
    })
  })
})