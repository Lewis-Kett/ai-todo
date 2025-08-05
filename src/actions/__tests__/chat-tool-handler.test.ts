import { handleChatToolResponse } from '../chat-tool-handler'
import { addTodo } from '../todo-actions'
import { type AddTodoTool, type ChatTool } from '../../../baml_client/types'

// Mock the todo-actions module
jest.mock('../todo-actions', () => ({
  addTodo: jest.fn(),
}))

const mockAddTodo = addTodo as jest.MockedFunction<typeof addTodo>

describe('handleChatToolResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('add_todo case', () => {
    it('should handle add_todo action successfully', async () => {
      const addTodoTool: AddTodoTool = {
        action: 'add_todo',
        name: 'Buy groceries',
        category: 'Personal',
        priority: 'Medium Priority',
        responseToUser: 'Added your grocery shopping task!'
      }

      mockAddTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(addTodoTool)

      expect(mockAddTodo).toHaveBeenCalledWith({
        name: 'Buy groceries',
        category: 'Personal',
        priority: 'Medium Priority'
      })

      expect(result).toEqual({
        success: true,
        data: {
          message: 'Added your grocery shopping task!',
          todoTool: addTodoTool
        }
      })
    })

    it('should handle add_todo with high priority task', async () => {
      const urgentTodoTool: AddTodoTool = {
        action: 'add_todo',
        name: 'Submit tax documents',
        category: 'Work',
        priority: 'High Priority',
        responseToUser: 'Added urgent tax submission task!'
      }

      mockAddTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(urgentTodoTool)

      expect(mockAddTodo).toHaveBeenCalledWith({
        name: 'Submit tax documents',
        category: 'Work',
        priority: 'High Priority'
      })

      expect(result).toEqual({
        success: true,
        data: {
          message: 'Added urgent tax submission task!',
          todoTool: urgentTodoTool
        }
      })
    })

    it('should handle add_todo with low priority task', async () => {
      const lowPriorityTool: AddTodoTool = {
        action: 'add_todo',
        name: 'Organize photos',
        category: 'Personal',
        priority: 'Low Priority',
        responseToUser: 'Added photo organization to your list!'
      }

      mockAddTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(lowPriorityTool)

      expect(mockAddTodo).toHaveBeenCalledWith({
        name: 'Organize photos',
        category: 'Personal',
        priority: 'Low Priority'
      })

      expect(result).toEqual({
        success: true,
        data: {
          message: 'Added photo organization to your list!',
          todoTool: lowPriorityTool
        }
      })
    })
  })

  describe('chat case', () => {
    it('should handle chat action successfully', async () => {
      const chatTool: ChatTool = {
        action: 'chat',
        responseToUser: 'Here are some productivity tips for managing your tasks effectively...'
      }

      const result = await handleChatToolResponse(chatTool)

      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Here are some productivity tips for managing your tasks effectively...',
          todoTool: chatTool
        }
      })
    })

    it('should handle chat action with advice response', async () => {
      const adviceChatTool: ChatTool = {
        action: 'chat',
        responseToUser: 'Based on your current tasks, I recommend focusing on high-priority items first.'
      }

      const result = await handleChatToolResponse(adviceChatTool)

      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Based on your current tasks, I recommend focusing on high-priority items first.',
          todoTool: adviceChatTool
        }
      })
    })

    it('should handle chat action with question response', async () => {
      const questionChatTool: ChatTool = {
        action: 'chat',
        responseToUser: 'Could you tell me more about what specific areas you need help organizing?'
      }

      const result = await handleChatToolResponse(questionChatTool)

      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Could you tell me more about what specific areas you need help organizing?',
          todoTool: questionChatTool
        }
      })
    })
  })

  describe('default case', () => {
    it('should handle unknown action with fallback response', async () => {
      // Create a tool with an unknown action by casting
      const unknownTool = {
        action: 'unknown_action',
        someProperty: 'test'
      } as any

      const result = await handleChatToolResponse(unknownTool)

      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        data: {
          message: `I received your request but couldn't process it properly.`,
          todoTool: unknownTool
        }
      })
    })

    it('should handle malformed tool object', async () => {
      const malformedTool = {
        action: 'invalid_type'
      } as any

      const result = await handleChatToolResponse(malformedTool)

      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(result).toEqual({
        success: true,
        data: {
          message: `I received your request but couldn't process it properly.`,
          todoTool: malformedTool
        }
      })
    })
  })

  describe('edge cases', () => {
    it('should handle add_todo with empty strings gracefully', async () => {
      const emptyTodoTool: AddTodoTool = {
        action: 'add_todo',
        name: '',
        category: '',
        priority: 'Low Priority',
        responseToUser: 'Added empty task'
      }

      mockAddTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(emptyTodoTool)

      expect(mockAddTodo).toHaveBeenCalledWith({
        name: '',
        category: '',
        priority: 'Low Priority'
      })

      expect(result.success).toBe(true)
      expect(result.data?.todoTool).toBe(emptyTodoTool)
    })

    it('should handle chat with empty response', async () => {
      const emptyChatTool: ChatTool = {
        action: 'chat',
        responseToUser: ''
      }

      const result = await handleChatToolResponse(emptyChatTool)

      expect(result).toEqual({
        success: true,
        data: {
          message: '',
          todoTool: emptyChatTool
        }
      })
    })
  })
})