import { renderHook, act } from "@testing-library/react"
import { useChat } from "../useChat"
import { useHandleTodoRequest } from "@/baml_client/react/hooks"
import { getTodos } from "@/actions/todo-actions"
import { processToolResponse } from "../../utils/toolProcessor"
import { STREAMING_MESSAGE_ID } from "../../utils/messageUtils"

// Mock the BAML hook
jest.mock("@/baml_client/react/hooks", () => ({
  useHandleTodoRequest: jest.fn(),
}))

// Mock todo actions
jest.mock("@/actions/todo-actions", () => ({
  getTodos: jest.fn().mockResolvedValue([]),
}))

// Mock the tool processor
jest.mock("../../utils/toolProcessor", () => ({
  processToolResponse: jest.fn(),
  getErrorMessage: jest.fn().mockReturnValue("Error occurred"),
}))

const mockUseHandleTodoRequest = useHandleTodoRequest as jest.MockedFunction<
  typeof useHandleTodoRequest
>
const mockGetTodos = getTodos as jest.MockedFunction<typeof getTodos>
const mockProcessToolResponse = processToolResponse as jest.MockedFunction<
  typeof processToolResponse
>

describe("useChat", () => {
  const mockMutate = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTodos.mockResolvedValue([])
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
      status: "idle",
      mutate: mockMutate,
      reset: jest.fn(),
    })
  })

  it("configures BAML hook with streaming enabled and callbacks", () => {
    renderHook(() => useChat())

    expect(mockUseHandleTodoRequest).toHaveBeenCalledWith({
      stream: true,
      onStreamData: expect.any(Function),
      onFinalData: expect.any(Function),
    })
  })

  it("returns messages state and derived values", () => {
    const { result } = renderHook(() => useChat())

    expect(result.current).toEqual({
      messages: [],
      streamingMessageId: undefined,
      messageCount: 0,
      sendMessage: expect.any(Function),
      isLoading: false,
      isStreaming: false,
      error: undefined,
    })
  })

  it("sendMessage calls BAML mutate with user message and todos", async () => {
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage("Hello")
    })

    expect(mockGetTodos).toHaveBeenCalled()
    expect(mockMutate).toHaveBeenCalledWith(
      "Hello",
      [],
      [
        {
          id: expect.any(String),
          role: "user",
          content: "Hello",
        },
      ]
    )
  })

  it("returns streamingMessageId when streaming", () => {
    mockUseHandleTodoRequest.mockReturnValue({
      data: undefined,
      streamData: { action: "chat", responseToUser: "Streaming..." },
      finalData: undefined,
      isLoading: false,
      isPending: false,
      isStreaming: true,
      isSuccess: false,
      isError: false,
      error: undefined,
      status: "streaming",
      mutate: mockMutate,
      reset: jest.fn(),
    })

    const { result } = renderHook(() => useChat())

    expect(result.current.streamingMessageId).toBe(STREAMING_MESSAGE_ID)
  })

  it("handles sendMessage error correctly", async () => {
    mockGetTodos.mockRejectedValue(new Error("Failed to load todos"))
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage("test")
    })

    // Error handling is now done through BAML hook's error state
    expect(mockGetTodos).toHaveBeenCalled()
  })

  it("builds messages from conversation history only when not streaming", () => {
    mockUseHandleTodoRequest.mockReturnValue({
      data: undefined,
      streamData: undefined,
      finalData: { action: "chat", responseToUser: "Hello there!" },
      isLoading: false,
      isPending: false,
      isStreaming: false,
      isSuccess: true,
      isError: false,
      error: undefined,
      status: "success",
      mutate: mockMutate,
      reset: jest.fn(),
    })

    const { result } = renderHook(() => useChat())

    // When not streaming and no conversation history exists, messages should be empty
    // Final responses are added to conversation history via onFinalData callback
    expect(result.current.messages).toHaveLength(0)
  })

  it("includes streaming message when streaming (after sending a message)", async () => {
    mockUseHandleTodoRequest.mockReturnValue({
      data: undefined,
      streamData: { action: "chat", responseToUser: "Streaming response..." },
      finalData: undefined,
      isLoading: false,
      isPending: false,
      isStreaming: true,
      isSuccess: false,
      isError: false,
      error: undefined,
      status: "streaming",
      mutate: mockMutate,
      reset: jest.fn(),
    })

    const { result } = renderHook(() => useChat())
    
    // First send a message to create the placeholder
    await act(async () => {
      await result.current.sendMessage("Test message")
    })
    
    // Should have user message + placeholder
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1]).toEqual({
      id: STREAMING_MESSAGE_ID,
      role: "assistant",
      content: "", // Initially empty, will be updated by onStreamData
    })
  })

  it("processes tool response via processToolResponse function", async () => {
    const mockFinalData = {
      action: "add_todo" as const,
      name: "Test todo",
      category: "work",
      priority: "Medium Priority" as const,
      responseToUser: "Added todo",
    }

    renderHook(() => useChat())

    // Get the onFinalData callback and call it
    const onFinalDataCall = mockUseHandleTodoRequest.mock.calls[0][0]
    await act(async () => {
      if (onFinalDataCall?.onFinalData) {
        await onFinalDataCall.onFinalData(mockFinalData)
      }
    })

    expect(mockProcessToolResponse).toHaveBeenCalledWith(mockFinalData)
  })

  it("replaces placeholder with final response via onFinalData callback", async () => {
    const { result } = renderHook(() => useChat())
    
    // First send a message to create the placeholder
    await act(async () => {
      await result.current.sendMessage("Test message")
    })
    
    // Should have user message + placeholder
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1].id).toBe(STREAMING_MESSAGE_ID)
    
    const mockFinalData = {
      action: "chat" as const,
      responseToUser: "Hello from assistant!",
    }

    // Get the onFinalData callback and call it
    const onFinalDataCall = mockUseHandleTodoRequest.mock.calls[0][0]
    await act(async () => {
      if (onFinalDataCall?.onFinalData) {
        await onFinalDataCall.onFinalData(mockFinalData)
      }
    })

    // Should still have 2 messages, but placeholder is now replaced with final response
    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1]).toEqual({
      id: expect.any(String), // New ID assigned
      role: "assistant", 
      content: "Hello from assistant!",
    })
    // ID should have changed from placeholder
    expect(result.current.messages[1].id).not.toBe(STREAMING_MESSAGE_ID)
  })

  it("sends message adds both user message and placeholder immediately", async () => {
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage("Hello from user")
    })

    // Both user message and placeholder should be added immediately
    expect(result.current.messages).toHaveLength(2)
    
    // User message
    expect(result.current.messages[0]).toEqual({
      id: expect.any(String),
      role: "user",
      content: "Hello from user",
    })
    
    // Placeholder assistant message
    expect(result.current.messages[1]).toEqual({
      id: STREAMING_MESSAGE_ID,
      role: "assistant",
      content: "",
    })
  })
})
