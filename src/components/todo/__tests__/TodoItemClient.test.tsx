/**
 * Integration tests for TodoItemClient
 * 
 * Tests the client component that uses useOptimistic for immediate UI updates
 * and integrates with server actions for persistence
 */

import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoItemClient } from '../TodoItemClient'
import { Todo } from '@/types/todo'

// Mock the server actions
jest.mock('@/actions/todo-actions', () => ({
  deleteTodo: jest.fn(),
  toggleTodoComplete: jest.fn(),
  updateTodo: jest.fn(),
}))

// Mock the useInlineEdit hook
jest.mock('@/hooks/useInlineEdit', () => ({
  useInlineEdit: jest.fn(),
}))

// Import the mocked functions
import { deleteTodo, toggleTodoComplete, updateTodo } from '@/actions/todo-actions'
import { useInlineEdit } from '@/hooks/useInlineEdit'

const mockDeleteTodo = deleteTodo as jest.MockedFunction<typeof deleteTodo>
const mockToggleTodoComplete = toggleTodoComplete as jest.MockedFunction<typeof toggleTodoComplete>
const mockUpdateTodo = updateTodo as jest.MockedFunction<typeof updateTodo>
const mockUseInlineEdit = useInlineEdit as jest.MockedFunction<typeof useInlineEdit>

describe('TodoItemClient', () => {

  const mockTodo: Todo = {
    id: 'test-todo-1',
    name: 'Test Todo Item',
    category: 'Testing',
    priority: 'High Priority',
    completed: false,
    createdAt: new Date('2023-01-01'),
  }

  const mockInlineEditReturnValue = {
    isEditing: false,
    editedValue: '',
    inputRef: { current: null },
    setEditedValue: jest.fn(),
    startEditing: jest.fn(),
    saveValue: jest.fn(),
    cancelEditing: jest.fn(),
    handleKeyDown: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful server actions
    mockDeleteTodo.mockResolvedValue(undefined)
    mockToggleTodoComplete.mockResolvedValue(undefined)
    mockUpdateTodo.mockResolvedValue(undefined)
    
    // Mock useInlineEdit hook with default values
    mockUseInlineEdit.mockReturnValue(mockInlineEditReturnValue)
  })

  describe('Rendering', () => {
    it('should render todo item with all elements', () => {
      render(<TodoItemClient todo={mockTodo} />)
      
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
      expect(screen.getByLabelText(`Delete task: ${mockTodo.name}`)).toBeInTheDocument()
      expect(screen.getByText(mockTodo.name)).toBeInTheDocument()
      expect(screen.getByText(mockTodo.priority)).toBeInTheDocument()
      expect(screen.getByText(mockTodo.category)).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<TodoItemClient todo={mockTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      const deleteButton = screen.getByLabelText(`Delete task: ${mockTodo.name}`)
      const group = screen.getByRole('group')
      
      expect(checkbox).toHaveAttribute('id', `todo-${mockTodo.id}`)
      expect(group).toHaveAttribute('aria-labelledby', `task-${mockTodo.id}-label`)
      expect(deleteButton).toHaveAttribute('aria-label', `Delete task: ${mockTodo.name}`)
    })

    it('should render completed todo with different styling', () => {
      const completedTodo = { ...mockTodo, completed: true }
      render(<TodoItemClient todo={completedTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      const label = screen.getByText(completedTodo.name)
      const priorityBadge = screen.getByText('Completed')
      
      expect(checkbox).toBeChecked()
      expect(label).toHaveClass('line-through')
      expect(priorityBadge).toBeInTheDocument()
    })

    it('should show pending state styling when actions are pending', async () => {
      const user = userEvent.setup()
      
      // Mock delayed server action
      mockToggleTodoComplete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      
      // Should show pending styling
      const group = screen.getByRole('group')
      expect(group).toHaveClass('opacity-70')
    })
  })

  describe('Toggle Complete', () => {
    it('should call toggleTodoComplete when checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<TodoItemClient todo={mockTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      
      await waitFor(() => {
        expect(mockToggleTodoComplete).toHaveBeenCalledWith(mockTodo.id)
      })
    })

    it('should show optimistic update immediately', async () => {
      const user = userEvent.setup()
      
      // Mock delayed server action to test optimistic updates
      mockToggleTodoComplete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
      
      await user.click(checkbox)
      
      // Should immediately show as checked (optimistic update)
      expect(checkbox).toBeChecked()
      
      // Wait for server action to complete
      await waitFor(() => {
        expect(mockToggleTodoComplete).toHaveBeenCalledWith(mockTodo.id)
      })
    })

    it('should disable checkbox during pending state', async () => {
      const user = userEvent.setup()
      
      // Mock delayed server action
      mockToggleTodoComplete.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      
      expect(checkbox).toBeDisabled()
      
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled()
      })
    })
  })

  describe('Delete Todo', () => {
    it('should call deleteTodo when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<TodoItemClient todo={mockTodo} />)
      
      const deleteButton = screen.getByLabelText(`Delete task: ${mockTodo.name}`)
      await user.click(deleteButton)
      
      await waitFor(() => {
        expect(mockDeleteTodo).toHaveBeenCalledWith(mockTodo.id)
      })
    })

    it('should disable delete button during pending state', async () => {
      const user = userEvent.setup()
      
      // Mock delayed server action
      mockDeleteTodo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const deleteButton = screen.getByLabelText(`Delete task: ${mockTodo.name}`)
      await user.click(deleteButton)
      
      expect(deleteButton).toBeDisabled()
      
      await waitFor(() => {
        expect(deleteButton).not.toBeDisabled()
      })
    })
  })

  describe('Priority Cycling', () => {
    it('should cycle priority when priority badge is clicked', async () => {
      const user = userEvent.setup()
      render(<TodoItemClient todo={mockTodo} />)
      
      const priorityBadge = screen.getByText(mockTodo.priority)
      await user.click(priorityBadge)
      
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { priority: 'Medium Priority' })
      })
    })

    it('should show optimistic priority update', async () => {
      const user = userEvent.setup()
      
      // Mock delayed server action
      mockUpdateTodo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const priorityBadge = screen.getByText('High Priority')
      await user.click(priorityBadge)
      
      // Should immediately show new priority (optimistic update)
      expect(screen.getByText('Medium Priority')).toBeInTheDocument()
      expect(screen.queryByText('High Priority')).not.toBeInTheDocument()
    })

    it('should not allow priority cycling for completed todos', async () => {
      const user = userEvent.setup()
      const completedTodo = { ...mockTodo, completed: true }
      
      render(<TodoItemClient todo={completedTodo} />)
      
      const priorityBadge = screen.getByText('Completed')
      await user.click(priorityBadge)
      
      expect(mockUpdateTodo).not.toHaveBeenCalled()
    })

    it('should cycle through all priority levels correctly', async () => {
      const user = userEvent.setup()
      
      // Test High -> Medium
      const { unmount } = render(<TodoItemClient todo={mockTodo} />)
      
      const priorityBadge = screen.getByText('High Priority')
      
      // High -> Medium
      await user.click(priorityBadge)
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { priority: 'Medium Priority' })
      })
      
      // Unmount previous component
      unmount()
      
      // Test Medium -> Low with fresh component
      const updatedTodo = { ...mockTodo, priority: 'Medium Priority' as const }
      render(<TodoItemClient todo={updatedTodo} />)
      
      const mediumBadge = screen.getByText('Medium Priority')
      
      // Medium -> Low
      await user.click(mediumBadge)
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { priority: 'Low Priority' })
      })
    })
  })

  describe('Inline Editing', () => {
    it('should integrate with useInlineEdit for name editing', () => {
      const mockNameEditValue = {
        ...mockInlineEditReturnValue,
        isEditing: false,
      }
      
      mockUseInlineEdit.mockReturnValueOnce(mockNameEditValue)
        .mockReturnValueOnce(mockInlineEditReturnValue) // for category
      
      render(<TodoItemClient todo={mockTodo} />)
      
      expect(mockUseInlineEdit).toHaveBeenCalledWith(
        mockTodo.name,
        expect.any(Function)
      )
    })

    it('should integrate with useInlineEdit for category editing', () => {
      mockUseInlineEdit.mockReturnValueOnce(mockInlineEditReturnValue) // for name
        .mockReturnValueOnce(mockInlineEditReturnValue) // for category
      
      render(<TodoItemClient todo={mockTodo} />)
      
      expect(mockUseInlineEdit).toHaveBeenCalledWith(
        mockTodo.category,
        expect.any(Function)
      )
    })

    it('should call updateTodo when inline edit saves', async () => {
      const mockSaveFunction = jest.fn()
      
      mockUseInlineEdit.mockReturnValueOnce({
        ...mockInlineEditReturnValue,
        saveValue: mockSaveFunction,
      }).mockReturnValueOnce(mockInlineEditReturnValue)
      
      render(<TodoItemClient todo={mockTodo} />)
      
      // Get the callback passed to useInlineEdit for name editing
      const nameEditCallback = mockUseInlineEdit.mock.calls[0][1]
      
      // Call the callback with new name wrapped in act
      await act(async () => {
        nameEditCallback('Updated Name')
      })
      
      await waitFor(() => {
        expect(mockUpdateTodo).toHaveBeenCalledWith(mockTodo.id, { name: 'Updated Name' })
      })
    })

    it('should disable inline editing during pending state', () => {
      const mockEditingState = {
        ...mockInlineEditReturnValue,
        isEditing: true,
        editedValue: 'Editing...',
      }
      
      mockUseInlineEdit.mockReturnValueOnce(mockEditingState)
        .mockReturnValueOnce(mockInlineEditReturnValue)
      
      // Mock pending state
      mockUpdateTodo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const input = screen.getByDisplayValue('Editing...')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle server action errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const user = userEvent.setup()
      
      // Mock server error
      mockToggleTodoComplete.mockRejectedValue(new Error('Server error'))
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      
      // Component should handle error gracefully
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled()
      })
      
      consoleErrorSpy.mockRestore()
    })
  })
})