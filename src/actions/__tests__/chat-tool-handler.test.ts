import { handleChatToolResponse } from '../chat-tool-handler'
import { addTodo, deleteTodo, toggleTodoComplete, updateTodo } from '../todo-actions'
import { type AddTodoTool, type ChatTool, type DeleteTodoTool, type ToggleTodoTool, type UpdateTodoTool } from '../../../baml_client/types'

// Mock the todo-actions module
jest.mock('../todo-actions', () => ({
  addTodo: jest.fn(),
  deleteTodo: jest.fn(),
  toggleTodoComplete: jest.fn(),
  updateTodo: jest.fn(),
}))

const mockAddTodo = addTodo as jest.MockedFunction<typeof addTodo>
const mockDeleteTodo = deleteTodo as jest.MockedFunction<typeof deleteTodo>
const mockToggleTodoComplete = toggleTodoComplete as jest.MockedFunction<typeof toggleTodoComplete>
const mockUpdateTodo = updateTodo as jest.MockedFunction<typeof updateTodo>

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

  describe('delete_todo case', () => {
    it('should handle delete_todo action successfully', async () => {
      const deleteTodoTool: DeleteTodoTool = {
        action: 'delete_todo',
        id: '123',
        responseToUser: 'Successfully deleted the task!'
      }

      mockDeleteTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(deleteTodoTool)

      expect(mockDeleteTodo).toHaveBeenCalledWith('123')
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Successfully deleted the task!',
          todoTool: deleteTodoTool
        }
      })
    })

    it('should handle delete_todo with different ID format', async () => {
      const deleteTodoTool: DeleteTodoTool = {
        action: 'delete_todo',
        id: 'todo-uuid-456',
        responseToUser: 'Task has been removed from your list!'
      }

      mockDeleteTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(deleteTodoTool)

      expect(mockDeleteTodo).toHaveBeenCalledWith('todo-uuid-456')
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Task has been removed from your list!',
          todoTool: deleteTodoTool
        }
      })
    })
  })

  describe('toggle_todo case', () => {
    it('should handle toggle_todo action successfully', async () => {
      const toggleTodoTool: ToggleTodoTool = {
        action: 'toggle_todo',
        id: '789',
        responseToUser: 'Task completion status has been toggled!'
      }

      mockToggleTodoComplete.mockResolvedValueOnce()

      const result = await handleChatToolResponse(toggleTodoTool)

      expect(mockToggleTodoComplete).toHaveBeenCalledWith('789')
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Task completion status has been toggled!',
          todoTool: toggleTodoTool
        }
      })
    })

    it('should handle toggle_todo with completion message', async () => {
      const toggleCompleteTool: ToggleTodoTool = {
        action: 'toggle_todo',
        id: '999',
        responseToUser: 'Great job! Task marked as complete!'
      }

      mockToggleTodoComplete.mockResolvedValueOnce()

      const result = await handleChatToolResponse(toggleCompleteTool)

      expect(mockToggleTodoComplete).toHaveBeenCalledWith('999')
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Great job! Task marked as complete!',
          todoTool: toggleCompleteTool
        }
      })
    })
  })

  describe('update_todo case', () => {
    it('should handle update_todo with all fields', async () => {
      const updateTodoTool: UpdateTodoTool = {
        action: 'update_todo',
        id: '456',
        name: 'Updated task name',
        category: 'Updated Work',
        priority: 'High Priority',
        responseToUser: 'Task has been updated with new details!'
      }

      mockUpdateTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(updateTodoTool)

      expect(mockUpdateTodo).toHaveBeenCalledWith('456', {
        name: 'Updated task name',
        category: 'Updated Work',
        priority: 'High Priority'
      })
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Task has been updated with new details!',
          todoTool: updateTodoTool
        }
      })
    })

    it('should handle update_todo with only name', async () => {
      const updateNameTool: UpdateTodoTool = {
        action: 'update_todo',
        id: '789',
        name: 'New task name only',
        responseToUser: 'Task name has been updated!'
      }

      mockUpdateTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(updateNameTool)

      expect(mockUpdateTodo).toHaveBeenCalledWith('789', {
        name: 'New task name only'
      })
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Task name has been updated!',
          todoTool: updateNameTool
        }
      })
    })

    it('should handle update_todo with only priority', async () => {
      const updatePriorityTool: UpdateTodoTool = {
        action: 'update_todo',
        id: '101',
        priority: 'Low Priority',
        responseToUser: 'Task priority has been changed to low!'
      }

      mockUpdateTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(updatePriorityTool)

      expect(mockUpdateTodo).toHaveBeenCalledWith('101', {
        priority: 'Low Priority'
      })
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Task priority has been changed to low!',
          todoTool: updatePriorityTool
        }
      })
    })

    it('should handle update_todo with only category', async () => {
      const updateCategoryTool: UpdateTodoTool = {
        action: 'update_todo',
        id: '202',
        category: 'Personal',
        responseToUser: 'Task category has been updated!'
      }

      mockUpdateTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(updateCategoryTool)

      expect(mockUpdateTodo).toHaveBeenCalledWith('202', {
        category: 'Personal'
      })
      expect(result).toEqual({
        success: true,
        data: {
          message: 'Task category has been updated!',
          todoTool: updateCategoryTool
        }
      })
    })

    it('should handle update_todo with no optional fields', async () => {
      const updateEmptyTool: UpdateTodoTool = {
        action: 'update_todo',
        id: '303',
        responseToUser: 'No changes were made to the task!'
      }

      mockUpdateTodo.mockResolvedValueOnce()

      const result = await handleChatToolResponse(updateEmptyTool)

      expect(mockUpdateTodo).toHaveBeenCalledWith('303', {})
      expect(result).toEqual({
        success: true,
        data: {
          message: 'No changes were made to the task!',
          todoTool: updateEmptyTool
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