/**
 * Unit tests for useTodoItem hook
 * 
 * Tests the business logic including optimistic updates, server actions,
 * error handling, and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useTodoItem } from '../useTodoItem'
import { Todo } from '@/types/todo'

// Mock the server actions
jest.mock('@/actions/todo-actions', () => ({
  deleteTodo: jest.fn(),
  toggleTodoComplete: jest.fn(),
  updateTodo: jest.fn(),
}))

// Mock the toast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}))

// Mock the error handling
jest.mock('@/lib/errors', () => ({
  handleError: jest.fn(),
  createDataError: jest.fn(),
}))

// Mock constants
jest.mock('@/lib/constants', () => ({
  TODO_PRIORITIES: ['High Priority', 'Medium Priority', 'Low Priority'],
}))

import { deleteTodo, toggleTodoComplete, updateTodo } from '@/actions/todo-actions'
import { useToast } from '@/hooks/useToast'
import { handleError, createDataError } from '@/lib/errors'

const mockDeleteTodo = deleteTodo as jest.MockedFunction<typeof deleteTodo>
const mockToggleTodoComplete = toggleTodoComplete as jest.MockedFunction<typeof toggleTodoComplete>
const mockUpdateTodo = updateTodo as jest.MockedFunction<typeof updateTodo>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockHandleError = handleError as jest.MockedFunction<typeof handleError>
const mockCreateDataError = createDataError as jest.MockedFunction<typeof createDataError>

describe('useTodoItem', () => {
  const mockTodo: Todo = {
    id: 'test-todo-1',
    name: 'Test Todo Item',
    category: 'Testing',
    priority: 'High Priority',
    completed: false,
  }

  const mockToast = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
    showLoading: jest.fn(),
    dismiss: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful server actions
    mockDeleteTodo.mockResolvedValue(undefined)
    mockToggleTodoComplete.mockResolvedValue(undefined)
    mockUpdateTodo.mockResolvedValue(undefined)
    
    // Mock toast hook
    mockUseToast.mockReturnValue(mockToast)
    
    // Mock error handling
    mockHandleError.mockReturnValue({ name: 'Error', message: 'Test error', code: 'TEST_ERROR', severity: 'medium' })
    mockCreateDataError.mockReturnValue({ name: 'DataError', message: 'Data error', code: 'DATA_ERROR', severity: 'medium' })
  })

  describe('Initial State', () => {
    it('should initialize with optimistic todo and deleting: false', () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      expect(result.current.optimisticTodo).toEqual({
        ...mockTodo,
        deleting: false,
      })
      expect(result.current.isPending).toBe(false)
    })

    it('should provide all necessary functions', () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      expect(typeof result.current.handleToggleComplete).toBe('function')
      expect(typeof result.current.handleDelete).toBe('function')
      expect(typeof result.current.cyclePriority).toBe('function')
      expect(typeof result.current.updateName).toBe('function')
      expect(typeof result.current.updateCategory).toBe('function')
    })
  })

  describe('Toggle Complete', () => {
    it('should optimistically update completed state', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      expect(result.current.optimisticTodo.completed).toBe(false)
      
      act(() => {
        result.current.handleToggleComplete()
      })
      
      expect(result.current.optimisticTodo.completed).toBe(true)
      expect(result.current.isPending).toBe(true)
    })

    it('should call toggleTodoComplete server action', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.handleToggleComplete()
      })
      
      await waitFor(() => {
        expect(mockToggleTodoComplete).toHaveBeenCalledWith(mockTodo.id)
      })
    })

    it('should show success message after server action succeeds', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.handleToggleComplete()
      })
      
      await waitFor(() => {
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Status updated successfully')
      })
    })

    it('should revert optimistic update on server error', async () => {
      const serverError = new Error('Server error')
      mockToggleTodoComplete.mockRejectedValue(serverError)
      
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.handleToggleComplete()
      })
      
      expect(result.current.optimisticTodo.completed).toBe(true) // Optimistic
      
      await waitFor(() => {
        expect(result.current.optimisticTodo.completed).toBe(false) // Reverted
      })
      
      expect(mockToast.showError).toHaveBeenCalled()
    })
  })

  describe('Delete Todo', () => {
    it('should optimistically set deleting to true', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.handleDelete()
      })
      
      expect(result.current.optimisticTodo.deleting).toBe(true)
      expect(result.current.isPending).toBe(true)
    })

    it('should call deleteTodo server action', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.handleDelete()
      })
      
      await waitFor(() => {
        expect(mockDeleteTodo).toHaveBeenCalledWith(mockTodo.id)
      })
    })

    it('should show success message after server action succeeds', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.handleDelete()
      })
      
      await waitFor(() => {
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Task deleted successfully!')
      })
    })

    it('should revert deleting state on server error', async () => {
      const serverError = new Error('Server error')
      mockDeleteTodo.mockRejectedValue(serverError)
      
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.handleDelete()
      })
      
      expect(result.current.optimisticTodo.deleting).toBe(true) // Optimistic
      
      await waitFor(() => {
        expect(result.current.optimisticTodo.deleting).toBe(false) // Reverted
      })
      
      expect(mockToast.showError).toHaveBeenCalled()
    })
  })

  describe('Priority Cycling', () => {
    it('should cycle priority from High to Medium', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.cyclePriority()
      })
      
      expect(result.current.optimisticTodo.priority).toBe('Medium Priority')
      
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { priority: 'Medium Priority' })
      })
    })

    it('should cycle priority from Medium to Low', async () => {
      const mediumTodo = { ...mockTodo, priority: 'Medium Priority' as const }
      const { result } = renderHook(() => useTodoItem(mediumTodo))
      
      act(() => {
        result.current.cyclePriority()
      })
      
      expect(result.current.optimisticTodo.priority).toBe('Low Priority')
      
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { priority: 'Low Priority' })
      })
    })

    it('should cycle priority from Low to High', async () => {
      const lowTodo = { ...mockTodo, priority: 'Low Priority' as const }
      const { result } = renderHook(() => useTodoItem(lowTodo))
      
      act(() => {
        result.current.cyclePriority()
      })
      
      expect(result.current.optimisticTodo.priority).toBe('High Priority')
      
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { priority: 'High Priority' })
      })
    })

    it('should not cycle priority for completed todos', async () => {
      const completedTodo = { ...mockTodo, completed: true }
      const { result } = renderHook(() => useTodoItem(completedTodo))
      
      act(() => {
        result.current.cyclePriority()
      })
      
      expect(mockUpdateTodo).not.toHaveBeenCalled()
      expect(result.current.optimisticTodo.priority).toBe(mockTodo.priority)
    })

    it('should revert priority on server error', async () => {
      const serverError = new Error('Server error')
      mockUpdateTodo.mockRejectedValue(serverError)
      
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.cyclePriority()
      })
      
      expect(result.current.optimisticTodo.priority).toBe('Medium Priority') // Optimistic
      
      await waitFor(() => {
        expect(result.current.optimisticTodo.priority).toBe('High Priority') // Reverted
      })
      
      expect(mockToast.showError).toHaveBeenCalled()
    })
  })

  describe('Update Name', () => {
    it('should optimistically update name', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.updateName('Updated Name')
      })
      
      expect(result.current.optimisticTodo.name).toBe('Updated Name')
      expect(result.current.isPending).toBe(true)
    })

    it('should call updateTodo server action with name', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.updateName('Updated Name')
      })
      
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { name: 'Updated Name' })
      })
    })

    it('should revert name on server error', async () => {
      const serverError = new Error('Server error')
      mockUpdateTodo.mockRejectedValue(serverError)
      
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.updateName('Updated Name')
      })
      
      expect(result.current.optimisticTodo.name).toBe('Updated Name') // Optimistic
      
      await waitFor(() => {
        expect(result.current.optimisticTodo.name).toBe(mockTodo.name) // Reverted
      })
      
      expect(mockToast.showError).toHaveBeenCalled()
    })
  })

  describe('Update Category', () => {
    it('should optimistically update category', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.updateCategory('Updated Category')
      })
      
      expect(result.current.optimisticTodo.category).toBe('Updated Category')
      expect(result.current.isPending).toBe(true)
    })

    it('should call updateTodo server action with category', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.updateCategory('Updated Category')
      })
      
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { category: 'Updated Category' })
      })
    })

    it('should revert category on server error', async () => {
      const serverError = new Error('Server error')
      mockUpdateTodo.mockRejectedValue(serverError)
      
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      act(() => {
        result.current.updateCategory('Updated Category')
      })
      
      expect(result.current.optimisticTodo.category).toBe('Updated Category') // Optimistic
      
      await waitFor(() => {
        expect(result.current.optimisticTodo.category).toBe(mockTodo.category) // Reverted
      })
      
      expect(mockToast.showError).toHaveBeenCalled()
    })
  })

  describe('Success Messages', () => {
    it('should show appropriate success messages for each operation', async () => {
      const { result } = renderHook(() => useTodoItem(mockTodo))
      
      // Test priority update
      act(() => {
        result.current.cyclePriority()
      })
      
      await waitFor(() => {
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Priority updated successfully')
      })
      
      // Test name update
      act(() => {
        result.current.updateName('New Name')
      })
      
      await waitFor(() => {
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Name updated successfully')
      })
      
      // Test category update  
      act(() => {
        result.current.updateCategory('New Category')
      })
      
      await waitFor(() => {
        expect(mockToast.showSuccess).toHaveBeenCalledWith('Category updated successfully')
      })
    })
  })
})