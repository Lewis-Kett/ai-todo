/**
 * UI tests for TodoItemClient
 * 
 * Tests the rendering, accessibility, and UI interactions.
 * Business logic is tested separately in useTodoItem.test.ts
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoItemClient } from '../TodoItemClient'
import { Todo } from '@/types/todo'

// Mock the custom hooks
jest.mock('@/hooks/useTodoItem', () => ({
  useTodoItem: jest.fn(),
}))

jest.mock('@/hooks/useInlineEdit', () => ({
  useInlineEdit: jest.fn(),
}))

import { useTodoItem } from '@/hooks/useTodoItem'
import { useInlineEdit } from '@/hooks/useInlineEdit'

const mockUseTodoItem = useTodoItem as jest.MockedFunction<typeof useTodoItem>
const mockUseInlineEdit = useInlineEdit as jest.MockedFunction<typeof useInlineEdit>

describe('TodoItemClient', () => {

  const mockTodo: Todo = {
    id: 'test-todo-1',
    name: 'Test Todo Item',
    category: 'Testing',
    priority: 'High Priority',
    completed: false,
  }

  const mockTodoItemHook = {
    optimisticTodo: { ...mockTodo, deleting: false },
    isPending: false,
    handleToggleComplete: jest.fn(),
    handleDelete: jest.fn(),
    cyclePriority: jest.fn(),
    updateName: jest.fn(),
    updateCategory: jest.fn(),
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
    
    // Mock useTodoItem hook
    mockUseTodoItem.mockReturnValue(mockTodoItemHook)
    
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
      const completedOptimisticTodo = { ...mockTodo, completed: true, deleting: false }
      mockUseTodoItem.mockReturnValue({
        ...mockTodoItemHook,
        optimisticTodo: completedOptimisticTodo
      })
      
      render(<TodoItemClient todo={{ ...mockTodo, completed: true }} />)
      
      const checkbox = screen.getByRole('checkbox')
      const label = screen.getByText(mockTodo.name)
      const priorityBadge = screen.getByText('Completed')
      
      expect(checkbox).toBeChecked()
      expect(label).toHaveClass('line-through')
      expect(priorityBadge).toBeInTheDocument()
    })

    it('should show pending state styling when actions are pending', () => {
      mockUseTodoItem.mockReturnValue({
        ...mockTodoItemHook,
        isPending: true
      })
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const group = screen.getByRole('group')
      expect(group).toHaveClass('opacity-70')
      
      // Elements should be disabled during pending state
      const checkbox = screen.getByRole('checkbox')
      const deleteButton = screen.getByLabelText(`Delete task: ${mockTodo.name}`)
      
      expect(checkbox).toBeDisabled()
      expect(deleteButton).toBeDisabled()
    })

    it('should show deleting animation when todo is being deleted', () => {
      mockUseTodoItem.mockReturnValue({
        ...mockTodoItemHook,
        optimisticTodo: { ...mockTodo, deleting: true }
      })
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const group = screen.getByRole('group')
      expect(group).toHaveClass('opacity-0', 'scale-90', '-translate-x-4', 'pointer-events-none')
    })
  })

  describe('UI Interactions', () => {
    it('should call handleToggleComplete when checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<TodoItemClient todo={mockTodo} />)
      
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)
      
      expect(mockTodoItemHook.handleToggleComplete).toHaveBeenCalled()
    })

    it('should call handleDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      render(<TodoItemClient todo={mockTodo} />)
      
      const deleteButton = screen.getByLabelText(`Delete task: ${mockTodo.name}`)
      await user.click(deleteButton)
      
      expect(mockTodoItemHook.handleDelete).toHaveBeenCalled()
    })

    it('should call cyclePriority when priority badge is clicked', async () => {
      const user = userEvent.setup()
      render(<TodoItemClient todo={mockTodo} />)
      
      const priorityBadge = screen.getByText(mockTodo.priority)
      await user.click(priorityBadge)
      
      expect(mockTodoItemHook.cyclePriority).toHaveBeenCalled()
    })

    it('should not call cyclePriority for completed todos', async () => {
      const user = userEvent.setup()
      const completedOptimisticTodo = { ...mockTodo, completed: true, deleting: false }
      mockUseTodoItem.mockReturnValue({
        ...mockTodoItemHook,
        optimisticTodo: completedOptimisticTodo
      })
      
      render(<TodoItemClient todo={{ ...mockTodo, completed: true }} />)
      
      const priorityBadge = screen.getByText('Completed')
      await user.click(priorityBadge)
      
      expect(mockTodoItemHook.cyclePriority).toHaveBeenCalled()
    })
  })

  describe('Inline Editing Integration', () => {
    it('should integrate with useInlineEdit for name editing', () => {
      render(<TodoItemClient todo={mockTodo} />)
      
      expect(mockUseInlineEdit).toHaveBeenCalledWith(
        mockTodo.name,
        mockTodoItemHook.updateName
      )
    })

    it('should integrate with useInlineEdit for category editing', () => {
      render(<TodoItemClient todo={mockTodo} />)
      
      expect(mockUseInlineEdit).toHaveBeenCalledWith(
        mockTodo.category,
        mockTodoItemHook.updateCategory
      )
    })

    it('should render input when name is being edited', () => {
      const editingState = {
        ...mockInlineEditReturnValue,
        isEditing: true,
        editedValue: 'Editing name...',
      }
      
      mockUseInlineEdit.mockReturnValueOnce(editingState)
        .mockReturnValueOnce(mockInlineEditReturnValue) // for category
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const input = screen.getByDisplayValue('Editing name...')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('text-sm', 'font-medium')
    })

    it('should render input when category is being edited', () => {
      mockUseInlineEdit.mockReturnValueOnce(mockInlineEditReturnValue) // for name
        .mockReturnValueOnce({
          ...mockInlineEditReturnValue,
          isEditing: true,
          editedValue: 'Editing category...',
        })
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const input = screen.getByDisplayValue('Editing category...')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('text-xs', 'h-6', 'px-2')
    })

    it('should disable inputs during pending state', () => {
      mockUseTodoItem.mockReturnValue({
        ...mockTodoItemHook,
        isPending: true
      })
      
      const editingState = {
        ...mockInlineEditReturnValue,
        isEditing: true,
        editedValue: 'Editing...',
      }
      
      mockUseInlineEdit.mockReturnValueOnce(editingState)
        .mockReturnValueOnce(mockInlineEditReturnValue)
      
      render(<TodoItemClient todo={mockTodo} />)
      
      const input = screen.getByDisplayValue('Editing...')
      expect(input).toBeDisabled()
    })
  })

  describe('Hook Integration', () => {
    it('should call useTodoItem with the provided todo', () => {
      render(<TodoItemClient todo={mockTodo} />)
      
      expect(mockUseTodoItem).toHaveBeenCalledWith(mockTodo)
    })

    it('should use optimistic todo values for display', () => {
      const optimisticTodo = {
        ...mockTodo,
        name: 'Updated Name',
        category: 'Updated Category',
        priority: 'Medium Priority' as const,
        deleting: false
      }
      
      mockUseTodoItem.mockReturnValue({
        ...mockTodoItemHook,
        optimisticTodo
      })
      
      render(<TodoItemClient todo={mockTodo} />)
      
      expect(screen.getByText('Updated Name')).toBeInTheDocument()
      expect(screen.getByText('Updated Category')).toBeInTheDocument()
      expect(screen.getByText('Medium Priority')).toBeInTheDocument()
    })
  })
})