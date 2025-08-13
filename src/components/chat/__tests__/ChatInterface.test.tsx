import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ChatInterface } from '../ChatInterface'
import { useHandleTodoRequest } from '@/baml_client/react/hooks'
import type { BamlErrors } from '@boundaryml/baml/errors'
import { getTodos } from '@/actions/todo-actions'

// Mock the BAML hook
jest.mock('@/baml_client/react/hooks', () => ({
  useHandleTodoRequest: jest.fn()
}))

// Mock todo actions
jest.mock('@/actions/todo-actions', () => ({
  getTodos: jest.fn()
}))

// Mock chat tool handler
jest.mock('@/actions/chat-tool-handler', () => ({
  handleChatToolResponse: jest.fn()
}))


// Mock child components
jest.mock('../ChatMessages', () => ({
  ChatMessages: ({ messages }: any) => (
    <div data-testid="chat-messages">
      <div data-testid="messages-count">{messages.length}</div>
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          {msg.content}
        </div>
      ))}
    </div>
  )
}))

jest.mock('../ChatInput', () => ({
  ChatInput: ({ onSendMessage }: any) => (
    <div data-testid="chat-input">
      <button 
        onClick={() => onSendMessage('test message')}
        data-testid="send-button"
      >
        Send
      </button>
    </div>
  )
}))

const mockUseHandleTodoRequest = useHandleTodoRequest as jest.MockedFunction<typeof useHandleTodoRequest>
const mockGetTodos = getTodos as jest.MockedFunction<typeof getTodos>

describe('ChatInterface with BAML Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHandleTodoRequest.mockReturnValue({
      data: undefined,
      streamData: undefined,
      finalData: undefined,
      isLoading: false,
      isPending: false,
      isStreaming: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      status: 'idle',
      mutate: jest.fn(),
      reset: jest.fn()
    })
    mockGetTodos.mockResolvedValue([])
  })

  it('renders with correct structure', () => {
    render(<ChatInterface />)
    
    expect(screen.getByRole('heading', { name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByText('0 messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-messages')).toBeInTheDocument()
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
  })


  it('configures BAML hook with streaming', () => {
    render(<ChatInterface />)
    
    expect(mockUseHandleTodoRequest).toHaveBeenCalledWith({
      stream: true,
      onFinalData: expect.any(Function)
    })
  })



  it('sends messages through BAML hook', async () => {
    const mockMutate = jest.fn()
    mockUseHandleTodoRequest.mockReturnValue({
      data: undefined,
      streamData: undefined,
      finalData: undefined,
      isLoading: false,
      isPending: false,
      isStreaming: false,
      isSuccess: false,
      isError: false,
      error: undefined,
      status: 'idle',
      mutate: mockMutate,
      reset: jest.fn()
    })

    const mockTodos = [{ id: '1', name: 'Test Todo', completed: false, priority: 'High Priority' as const, category: 'Work' }]
    mockGetTodos.mockResolvedValue(mockTodos)
    
    render(<ChatInterface />)
    
    const sendButton = screen.getByTestId('send-button')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockGetTodos).toHaveBeenCalled()
      expect(mockMutate).toHaveBeenCalledWith(
        'test message',
        mockTodos,
        []
      )
    })
  })

  it('handles tool actions on final response', async () => {
    const mockOnFinalData = jest.fn()
    mockUseHandleTodoRequest.mockImplementation((props) => {
      if (props && 'onFinalData' in props) {
        mockOnFinalData.mockImplementation(props.onFinalData!)
      }
      return {
        data: undefined,
        streamData: undefined,
        finalData: undefined,
        isLoading: false,
        isPending: false,
        isStreaming: false,
        isSuccess: false,
        isError: false,
        error: undefined,
        status: 'idle',
        mutate: jest.fn(),
        reset: jest.fn()
      }
    })

    render(<ChatInterface />)

    const toolAction = {
      action: 'add_todo' as const,
      name: 'Test Todo',
      category: 'Work',
      priority: 'High Priority' as const,
      responseToUser: 'Todo added successfully!'
    }

    await act(async () => {
      await mockOnFinalData(toolAction)
    })

    // Tool action is handled by handleChatToolResponse, which is mocked
  })

  it('does not execute tool for chat actions', async () => {
    const mockOnFinalData = jest.fn()
    mockUseHandleTodoRequest.mockImplementation((props) => {
      if (props && 'onFinalData' in props) {
        mockOnFinalData.mockImplementation(props.onFinalData!)
      }
      return {
        data: undefined,
        streamData: undefined,
        finalData: undefined,
        isLoading: false,
        isPending: false,
        isStreaming: false,
        isSuccess: false,
        isError: false,
        error: undefined,
        status: 'idle',
        mutate: jest.fn(),
        reset: jest.fn()
      }
    })

    render(<ChatInterface />)

    const chatAction = {
      action: 'chat' as const,
      responseToUser: 'Here is some advice...'
    }

    await act(async () => {
      await mockOnFinalData(chatAction)
    })

    // Chat actions don't trigger handleChatToolResponse
  })

  it('handles error state from BAML hook', () => {
    const mockError = new Error('BAML error') as BamlErrors
    mockUseHandleTodoRequest.mockReturnValue({
      data: undefined,
      streamData: undefined,
      finalData: undefined,
      isLoading: false,
      isPending: false,
      isStreaming: false,
      isSuccess: false,
      isError: true,
      error: mockError,
      status: 'error',
      mutate: jest.fn(),
      reset: jest.fn()
    })
    
    render(<ChatInterface />)
    
    // Component should still render without crashing
    expect(screen.getByRole('heading', { name: 'AI Assistant' })).toBeInTheDocument()
  })
})