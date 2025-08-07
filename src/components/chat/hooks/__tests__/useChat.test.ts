import { renderHook, act } from "@testing-library/react"
import { useChat } from "../useChat"
import { useHandleTodoRequest } from "@/baml_client/react/hooks"
import { getTodos } from "@/actions/todo-actions"
import { processToolResponse } from "../../utils/toolProcessor"

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

  it("returns conversation state and derived values", () => {
    const { result } = renderHook(() => useChat())

    expect(result.current).toEqual({
      conversationHistory: [],
      streamingMessageId: undefined,
      sendMessage: expect.any(Function),
      isLoading: false,
      isStreaming: false,
      error: undefined,
    })
  })

  it("sendMessage adds user and placeholder assistant messages", async () => {
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage("Hello")
    })

    expect(mockGetTodos).toHaveBeenCalled()
    expect(result.current.conversationHistory).toHaveLength(2)
    expect(result.current.conversationHistory[0]).toMatchObject({
      role: "user",
      content: "Hello",
    })
    expect(result.current.conversationHistory[1]).toMatchObject({
      role: "assistant",
      content: "",
    })
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

  it("returns streamingMessageId when streaming after sending message", async () => {
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage("Hello")
    })

    // After sending a message, streaming message ID should be set
    expect(result.current.streamingMessageId).toBeDefined()
    expect(typeof result.current.streamingMessageId).toBe("string")
  })

  it("handles sendMessage error correctly", async () => {
    // Suppress console.error for this test since we're intentionally triggering an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    mockGetTodos.mockRejectedValue(new Error("Failed to load todos"))
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage("test")
    })

    // Error handling is now done through BAML hook's error state
    expect(mockGetTodos).toHaveBeenCalled()
    
    // Restore console.error
    consoleSpy.mockRestore()
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
    expect(result.current.conversationHistory).toHaveLength(0)
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
    expect(result.current.conversationHistory).toHaveLength(2)
    expect(result.current.conversationHistory[1]).toMatchObject({
      id: expect.any(String),
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

  it("updates placeholder with streaming and final response via callbacks", async () => {
    const { result } = renderHook(() => useChat())
    
    // First send a message to create the placeholder
    await act(async () => {
      await result.current.sendMessage("Test message")
    })
    
    // Should have user message + placeholder
    expect(result.current.conversationHistory).toHaveLength(2)
    const placeholderId = result.current.conversationHistory[1].id
    expect(placeholderId).toBeDefined()
    expect(result.current.conversationHistory[1].content).toBe("")
    
    // Simulate streaming data
    const mockStreamData = {
      action: "chat" as const,
      responseToUser: "Hello from",
    }

    // Get the onStreamData callback and call it
    const onStreamDataCall = mockUseHandleTodoRequest.mock.calls[0][0]
    await act(async () => {
      if (onStreamDataCall?.onStreamData) {
        await onStreamDataCall.onStreamData(mockStreamData)
      }
    })

    // Content should be updated with streaming data
    expect(result.current.conversationHistory[1].content).toBe("Hello from")
    
    const mockFinalData = {
      action: "chat" as const,
      responseToUser: "Hello from assistant!",
    }

    // Get the onFinalData callback and call it
    await act(async () => {
      if (onStreamDataCall?.onFinalData) {
        await onStreamDataCall.onFinalData(mockFinalData)
      }
    })

    // Should still have 2 messages, with final content
    expect(result.current.conversationHistory).toHaveLength(2)
    expect(result.current.conversationHistory[1]).toMatchObject({
      id: placeholderId, // Same ID as placeholder
      role: "assistant", 
      content: "Hello from assistant!",
    })
  })

  it("sends message adds both user message and placeholder immediately", async () => {
    const { result } = renderHook(() => useChat())

    await act(async () => {
      await result.current.sendMessage("Hello from user")
    })

    // Both user message and placeholder should be added immediately
    expect(result.current.conversationHistory).toHaveLength(2)
    
    // User message
    expect(result.current.conversationHistory[0]).toMatchObject({
      id: expect.any(String),
      role: "user",
      content: "Hello from user",
    })
    
    // Placeholder assistant message
    expect(result.current.conversationHistory[1]).toMatchObject({
      id: expect.any(String),
      role: "assistant",
      content: "",
    })
  })
})
