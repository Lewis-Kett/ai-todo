import { renderHook } from '@testing-library/react'
import { useChatHook } from '../useChatHook'
import { useHandleTodoRequest } from '../../../../../baml_client/react/hooks'
import { handleChatToolResponse } from '@/actions/chat-tool-handler'
import type { AddTodoTool, ChatTool } from '../../../../../baml_client/types'

type HookConfig = Parameters<typeof useHandleTodoRequest>[0]

// Mock the BAML hook
jest.mock('../../../../../baml_client/react/hooks', () => ({
  useHandleTodoRequest: jest.fn()
}))

// Mock chat tool handler
jest.mock('@/actions/chat-tool-handler', () => ({
  handleChatToolResponse: jest.fn()
}))

const mockUseHandleTodoRequest = useHandleTodoRequest as jest.MockedFunction<typeof useHandleTodoRequest>
const mockHandleChatToolResponse = handleChatToolResponse as jest.MockedFunction<typeof handleChatToolResponse>

describe('useChatHook', () => {
  const mockOnStreamData = jest.fn()
  const mockOnFinalData = jest.fn()
  const mockOnError = jest.fn()
  const mockProps = {
    onStreamData: mockOnStreamData,
    onFinalData: mockOnFinalData,
    onError: mockOnError
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnStreamData.mockClear()
    mockOnFinalData.mockClear()
    mockOnError.mockClear()
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
  })

  it('configures BAML hook with streaming enabled', () => {
    renderHook(() => useChatHook(mockProps))
    
    expect(mockUseHandleTodoRequest).toHaveBeenCalledWith({
      stream: true,
      onStreamData: expect.any(Function),
      onFinalData: expect.any(Function),
      onError: expect.any(Function)
    })
  })

  it('returns BAML hook result with currentResponse', () => {
    const mockResult = {
      data: { action: 'chat' as const, responseToUser: 'test response' },
      streamData: undefined,
      finalData: undefined,
      isLoading: false,
      isPending: false,
      isStreaming: false,
      isSuccess: true,
      isError: false,
      error: undefined,
      status: 'success' as const,
      mutate: jest.fn(),
      reset: jest.fn()
    }
    
    mockUseHandleTodoRequest.mockReturnValue(mockResult)
    
    const { result } = renderHook(() => useChatHook(mockProps))
    
    expect(result.current).toEqual({
      ...mockResult,
      currentResponse: mockResult.data
    })
  })

  it('calls handleChatToolResponse for tool actions and onFinalData callback', async () => {
    let capturedConfig: HookConfig | undefined

    mockUseHandleTodoRequest.mockImplementation((config) => {
      capturedConfig = config
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

    renderHook(() => useChatHook(mockProps))

    const toolAction: AddTodoTool = {
      action: 'add_todo' as const,
      name: 'Test Todo',
      category: 'Work',
      priority: 'High Priority' as const,
      responseToUser: 'Todo added successfully!'
    }

    if (capturedConfig?.onFinalData) {
      await capturedConfig.onFinalData(toolAction)
      expect(mockHandleChatToolResponse).toHaveBeenCalledWith(toolAction)
      expect(mockOnFinalData).toHaveBeenCalledWith(toolAction)
    }
  })

  it('does not call handleChatToolResponse for chat actions but calls onFinalData callback', async () => {
    let capturedConfig: HookConfig | undefined

    mockUseHandleTodoRequest.mockImplementation((config) => {
      capturedConfig = config
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

    renderHook(() => useChatHook(mockProps))

    const chatAction: ChatTool = {
      action: 'chat' as const,
      responseToUser: 'Here is some advice...'
    }

    if (capturedConfig?.onFinalData) {
      await capturedConfig.onFinalData(chatAction)
      expect(mockHandleChatToolResponse).not.toHaveBeenCalled()
      expect(mockOnFinalData).toHaveBeenCalledWith(chatAction)
    }
  })

  it('handles undefined finalData', async () => {
    let capturedConfig: HookConfig | undefined

    mockUseHandleTodoRequest.mockImplementation((config) => {
      capturedConfig = config
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

    renderHook(() => useChatHook(mockProps))

    if (capturedConfig?.onFinalData) {
      await capturedConfig.onFinalData(undefined)
      expect(mockHandleChatToolResponse).not.toHaveBeenCalled()
      expect(mockOnFinalData).not.toHaveBeenCalled()
    }
  })

  it('calls onStreamData callback on stream data', () => {
    let capturedOnStreamData: ((partialData: ChatTool | undefined) => void) | undefined

    mockUseHandleTodoRequest.mockImplementation((config) => {
      if (config) {
        capturedOnStreamData = config.onStreamData
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

    renderHook(() => useChatHook(mockProps))

    const partialData: ChatTool = {
      action: 'chat' as const,
      responseToUser: 'Partial response...'
    }

    capturedOnStreamData!(partialData)

    expect(mockOnStreamData).toHaveBeenCalledWith(partialData)
  })

  it('handles errors by calling onError callback', () => {
    let capturedOnError: ((error: Error) => void) | undefined

    mockUseHandleTodoRequest.mockImplementation((config) => {
      if (config && config.onError) {
        capturedOnError = config.onError as (error: Error) => void
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

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    renderHook(() => useChatHook(mockProps))

    const error = new Error('Test error')
    capturedOnError!(error)

    expect(consoleSpy).toHaveBeenCalledWith('Chat error:', error)
    expect(mockOnError).toHaveBeenCalledWith(error)
    
    consoleSpy.mockRestore()
  })

  it('works with optional callbacks', () => {
    const { result } = renderHook(() => useChatHook({}))
    
    expect(mockUseHandleTodoRequest).toHaveBeenCalledWith({
      stream: true,
      onStreamData: expect.any(Function),
      onFinalData: expect.any(Function),
      onError: expect.any(Function)
    })
    
    // Should still return hook result
    expect(result.current).toBeDefined()
  })
})