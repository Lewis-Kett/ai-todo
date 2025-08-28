/**
 * Unit tests for todo-action-processor
 * 
 * Tests the processBatchTodoResponse function that processes BAML batch responses
 */

import { processBatchTodoResponse } from '../todo-action-processor'
import { BatchTodoResponse } from '@/baml_client/types'
import { partial_types } from '@/baml_client'

// Mock the batch processor
jest.mock('@/actions/todo-actions', () => ({
  processBatchTodoActions: jest.fn(),
}))

// Import the mocked function for testing
import { processBatchTodoActions } from '@/actions/todo-actions'

describe('todo-action-processor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('processBatchTodoResponse', () => {
    describe('complete batch responses', () => {
      beforeEach(() => {
        // Ensure mock resolves for successful tests
        ;(processBatchTodoActions as jest.Mock).mockResolvedValue(undefined)
      })

      it('should process batch response with single add_todo action', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [{
            action: 'add_todo',
            name: 'Test Todo',
            category: 'Work',
            priority: 'High Priority'
          }],
          responseToUser: 'Todo added successfully'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
        expect(processBatchTodoActions).toHaveBeenCalledTimes(1)
      })

      it('should process batch response with multiple actions', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [
            {
              action: 'add_todo',
              name: 'First Todo',
              category: 'Work',
              priority: 'High Priority'
            },
            {
              action: 'delete_todo',
              id: '123'
            },
            {
              action: 'toggle_todo',
              id: '456'
            }
          ],
          responseToUser: 'All operations completed'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
        expect(processBatchTodoActions).toHaveBeenCalledTimes(1)
      })

      it('should process batch response with delete_todo action', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [{
            action: 'delete_todo',
            id: 'test-id-123'
          }],
          responseToUser: 'Todo deleted successfully'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })

      it('should process batch response with toggle_todo action', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [{
            action: 'toggle_todo',
            id: 'test-id-456'
          }],
          responseToUser: 'Todo toggled successfully'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })

      it('should process batch response with update_todo action (all fields)', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [{
            action: 'update_todo',
            id: 'test-id-789',
            name: 'Updated Todo',
            category: 'Personal',
            priority: 'Medium Priority'
          }],
          responseToUser: 'Todo updated successfully'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })

      it('should process batch response with update_todo action (partial fields)', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [{
            action: 'update_todo',
            id: 'test-id-789',
            name: 'Updated Name Only'
          }],
          responseToUser: 'Todo name updated successfully'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })

      it('should process batch response with chat action only', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [{
            action: 'chat'
          }],
          responseToUser: 'Just chatting, no todos to process'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })

      it('should process batch response with mixed actions including chat', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [
            {
              action: 'add_todo',
              name: 'New Task',
              category: 'Work',
              priority: 'High Priority'
            },
            {
              action: 'chat'
            },
            {
              action: 'delete_todo',
              id: '123'
            }
          ],
          responseToUser: 'Added task and deleted another one'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })
    })

    describe('incomplete batch responses', () => {
      it('should throw error for incomplete add_todo action (missing name)', async () => {
        const incompleteResponse = {
          actions: [{
            action: 'add_todo',
            category: 'Work',
            priority: 'High Priority'
            // missing name
          }],
          responseToUser: 'Todo added'
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for incomplete add_todo action (missing category)', async () => {
        const incompleteResponse = {
          actions: [{
            action: 'add_todo',
            name: 'Test Todo',
            priority: 'High Priority'
            // missing category
          }],
          responseToUser: 'Todo added'
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for incomplete add_todo action (missing priority)', async () => {
        const incompleteResponse = {
          actions: [{
            action: 'add_todo',
            name: 'Test Todo',
            category: 'Work'
            // missing priority
          }],
          responseToUser: 'Todo added'
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for incomplete delete_todo action (missing id)', async () => {
        const incompleteResponse = {
          actions: [{
            action: 'delete_todo'
            // missing id
          }],
          responseToUser: 'Todo deleted'
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for incomplete toggle_todo action (missing id)', async () => {
        const incompleteResponse = {
          actions: [{
            action: 'toggle_todo'
            // missing id
          }],
          responseToUser: 'Todo toggled'
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for incomplete update_todo action (missing id)', async () => {
        const incompleteResponse = {
          actions: [{
            action: 'update_todo',
            name: 'Updated Todo'
            // missing id
          }],
          responseToUser: 'Todo updated'
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for missing actions array', async () => {
        const incompleteResponse = {
          responseToUser: 'Something happened'
          // missing actions
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for empty actions array that is not an array', async () => {
        const incompleteResponse = {
          actions: null,
          responseToUser: 'Something happened'
        } as any as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })

      it('should throw error for action without action field', async () => {
        const incompleteResponse = {
          actions: [{
            name: 'Test Todo',
            category: 'Work',
            priority: 'High Priority'
            // missing action field
          } as any],
          responseToUser: 'Something happened'
        } as partial_types.BatchTodoResponse

        await expect(processBatchTodoResponse(incompleteResponse))
          .rejects.toThrow('BatchTodoResponse is not complete - streaming may not have finished')

        expect(processBatchTodoActions).not.toHaveBeenCalled()
      })
    })

    describe('error handling from processBatchTodoActions', () => {
      it('should propagate errors from processBatchTodoActions', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [{
            action: 'add_todo',
            name: 'Test Todo',
            category: 'Work',
            priority: 'High Priority'
          }],
          responseToUser: 'Todo added successfully'
        }

        const testError = new Error('Failed to process batch actions')
        ;(processBatchTodoActions as jest.Mock).mockRejectedValue(testError)

        await expect(processBatchTodoResponse(batchResponse))
          .rejects.toThrow('Failed to process batch actions')

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })
    })

    describe('edge cases', () => {
      beforeEach(() => {
        // Reset mock to resolve for edge cases
        ;(processBatchTodoActions as jest.Mock).mockResolvedValue(undefined)
      })

      it('should process batch response with empty actions array', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [],
          responseToUser: 'No actions to process'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith([])
      })

      it('should process batch response with only chat actions', async () => {
        const batchResponse: BatchTodoResponse = {
          actions: [
            { action: 'chat' },
            { action: 'chat' }
          ],
          responseToUser: 'Just having a conversation'
        }

        await processBatchTodoResponse(batchResponse)

        expect(processBatchTodoActions).toHaveBeenCalledWith(batchResponse.actions)
      })
    })
  })
})