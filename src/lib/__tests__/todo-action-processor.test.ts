/**
 * Unit tests for todo-action-processor
 * 
 * Tests the processTodoAction function that maps BAML responses to server actions
 */

import { processTodoAction, TodoActionResponse } from '../todo-action-processor'
import { AddTodoTool, DeleteTodoTool, ToggleTodoTool, UpdateTodoTool, ChatTool } from '@/baml_client/types'

// Mock all server actions
jest.mock('@/actions/todo-actions', () => ({
  addTodo: jest.fn(),
  deleteTodo: jest.fn(),
  toggleTodoComplete: jest.fn(),
  updateTodo: jest.fn(),
}))

// Import the mocked functions for testing
import { addTodo, deleteTodo, toggleTodoComplete, updateTodo } from '@/actions/todo-actions'

// Mock console methods to test logging
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('todo-action-processor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('processTodoAction', () => {
    describe('add_todo action', () => {
      it('should call addTodo with correct parameters', async () => {
        const response: AddTodoTool = {
          action: 'add_todo',
          name: 'Test Todo',
          category: 'Work',
          priority: 'High Priority',
          responseToUser: 'Todo added successfully'
        }

        await processTodoAction(response)

        expect(addTodo).toHaveBeenCalledWith({
          name: 'Test Todo',
          category: 'Work',
          priority: 'High Priority'
        })
        expect(addTodo).toHaveBeenCalledTimes(1)
      })

      it('should handle all priority levels', async () => {
        const priorities = ['High Priority', 'Medium Priority', 'Low Priority'] as const
        
        for (const priority of priorities) {
          const response: AddTodoTool = {
            action: 'add_todo',
            name: `Test Todo ${priority}`,
            category: 'Test',
            priority,
            responseToUser: 'Todo added'
          }

          await processTodoAction(response)

          expect(addTodo).toHaveBeenCalledWith({
            name: `Test Todo ${priority}`,
            category: 'Test',
            priority
          })
        }
      })
    })

    describe('delete_todo action', () => {
      it('should call deleteTodo with the correct ID', async () => {
        const response: DeleteTodoTool = {
          action: 'delete_todo',
          id: 'test-todo-123',
          responseToUser: 'Todo deleted successfully'
        }

        await processTodoAction(response)

        expect(deleteTodo).toHaveBeenCalledWith('test-todo-123')
        expect(deleteTodo).toHaveBeenCalledTimes(1)
      })
    })

    describe('toggle_todo action', () => {
      it('should call toggleTodoComplete with the correct ID', async () => {
        const response: ToggleTodoTool = {
          action: 'toggle_todo',
          id: 'test-todo-456',
          responseToUser: 'Todo toggled successfully'
        }

        await processTodoAction(response)

        expect(toggleTodoComplete).toHaveBeenCalledWith('test-todo-456')
        expect(toggleTodoComplete).toHaveBeenCalledTimes(1)
      })
    })

    describe('update_todo action', () => {
      it('should call updateTodo with only name update', async () => {
        const response: UpdateTodoTool = {
          action: 'update_todo',
          id: 'test-todo-789',
          name: 'Updated Todo Name',
          category: null,
          priority: null,
          responseToUser: 'Todo updated successfully'
        }

        await processTodoAction(response)

        expect(updateTodo).toHaveBeenCalledWith('test-todo-789', {
          name: 'Updated Todo Name'
        })
        expect(updateTodo).toHaveBeenCalledTimes(1)
      })

      it('should call updateTodo with only category update', async () => {
        const response: UpdateTodoTool = {
          action: 'update_todo',
          id: 'test-todo-789',
          name: null,
          category: 'Updated Category',
          priority: null,
          responseToUser: 'Todo updated successfully'
        }

        await processTodoAction(response)

        expect(updateTodo).toHaveBeenCalledWith('test-todo-789', {
          category: 'Updated Category'
        })
      })

      it('should call updateTodo with only priority update', async () => {
        const response: UpdateTodoTool = {
          action: 'update_todo',
          id: 'test-todo-789',
          name: null,
          category: null,
          priority: 'Low Priority',
          responseToUser: 'Todo updated successfully'
        }

        await processTodoAction(response)

        expect(updateTodo).toHaveBeenCalledWith('test-todo-789', {
          priority: 'Low Priority'
        })
      })

      it('should call updateTodo with multiple field updates', async () => {
        const response: UpdateTodoTool = {
          action: 'update_todo',
          id: 'test-todo-789',
          name: 'Multi-Update Todo',
          category: 'Updated Category',
          priority: 'High Priority',
          responseToUser: 'Todo updated successfully'
        }

        await processTodoAction(response)

        expect(updateTodo).toHaveBeenCalledWith('test-todo-789', {
          name: 'Multi-Update Todo',
          category: 'Updated Category',
          priority: 'High Priority'
        })
      })

      it('should handle undefined optional fields correctly', async () => {
        const response: UpdateTodoTool = {
          action: 'update_todo',
          id: 'test-todo-789',
          responseToUser: 'Todo updated successfully'
        }

        await processTodoAction(response)

        expect(updateTodo).toHaveBeenCalledWith('test-todo-789', {})
      })

      it('should exclude null values from updates object', async () => {
        const response: UpdateTodoTool = {
          action: 'update_todo',
          id: 'test-todo-789',
          name: 'Updated Name',
          category: null,
          priority: null,
          responseToUser: 'Todo updated successfully'
        }

        await processTodoAction(response)

        expect(updateTodo).toHaveBeenCalledWith('test-todo-789', {
          name: 'Updated Name'
        })
      })
    })

    describe('chat action', () => {
      it('should not call any server actions for chat responses', async () => {
        const response: ChatTool = {
          action: 'chat',
          responseToUser: 'This is a chat response'
        }

        await processTodoAction(response)

        expect(addTodo).not.toHaveBeenCalled()
        expect(deleteTodo).not.toHaveBeenCalled()
        expect(toggleTodoComplete).not.toHaveBeenCalled()
        expect(updateTodo).not.toHaveBeenCalled()
      })
    })

    describe('unknown action type', () => {
      it('should log a warning for unknown action types', async () => {
        const response = {
          action: 'unknown_action',
          responseToUser: 'Unknown response'
        } as unknown as TodoActionResponse

        await processTodoAction(response)

        expect(mockConsoleWarn).toHaveBeenCalledWith('Unknown action type:', 'unknown_action')
        expect(addTodo).not.toHaveBeenCalled()
        expect(deleteTodo).not.toHaveBeenCalled()
        expect(toggleTodoComplete).not.toHaveBeenCalled()
        expect(updateTodo).not.toHaveBeenCalled()
      })
    })

    describe('error handling', () => {
      it('should catch and re-throw errors from addTodo', async () => {
        const testError = new Error('Add todo failed')
        ;(addTodo as jest.Mock).mockRejectedValueOnce(testError)

        const response: AddTodoTool = {
          action: 'add_todo',
          name: 'Test Todo',
          category: 'Test',
          priority: 'Medium Priority',
          responseToUser: 'Todo added'
        }

        await expect(processTodoAction(response)).rejects.toThrow('Add todo failed')
        expect(mockConsoleError).toHaveBeenCalledWith('Error processing todo action:', testError)
      })

      it('should catch and re-throw errors from deleteTodo', async () => {
        const testError = new Error('Delete todo failed')
        ;(deleteTodo as jest.Mock).mockRejectedValueOnce(testError)

        const response: DeleteTodoTool = {
          action: 'delete_todo',
          id: 'test-id',
          responseToUser: 'Todo deleted'
        }

        await expect(processTodoAction(response)).rejects.toThrow('Delete todo failed')
        expect(mockConsoleError).toHaveBeenCalledWith('Error processing todo action:', testError)
      })

      it('should catch and re-throw errors from toggleTodoComplete', async () => {
        const testError = new Error('Toggle todo failed')
        ;(toggleTodoComplete as jest.Mock).mockRejectedValueOnce(testError)

        const response: ToggleTodoTool = {
          action: 'toggle_todo',
          id: 'test-id',
          responseToUser: 'Todo toggled'
        }

        await expect(processTodoAction(response)).rejects.toThrow('Toggle todo failed')
        expect(mockConsoleError).toHaveBeenCalledWith('Error processing todo action:', testError)
      })

      it('should catch and re-throw errors from updateTodo', async () => {
        const testError = new Error('Update todo failed')
        ;(updateTodo as jest.Mock).mockRejectedValueOnce(testError)

        const response: UpdateTodoTool = {
          action: 'update_todo',
          id: 'test-id',
          name: 'Updated Name',
          responseToUser: 'Todo updated'
        }

        await expect(processTodoAction(response)).rejects.toThrow('Update todo failed')
        expect(mockConsoleError).toHaveBeenCalledWith('Error processing todo action:', testError)
      })
    })
  })
})