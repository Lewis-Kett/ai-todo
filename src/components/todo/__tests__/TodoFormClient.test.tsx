/**
 * Integration tests for TodoFormClient
 * 
 * Following React/Next.js best practices for testing client components
 * that use server actions with useTransition and controlled form handling
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoFormClient } from '../TodoFormClient'

// Mock the server action
jest.mock('@/actions/todo-actions', () => ({
  addTodo: jest.fn(),
}))

// Mock the useToast hook
jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(),
}))

// Mock the error utilities
jest.mock('@/lib/errors', () => ({
  handleError: jest.fn((error) => error),
  createValidationError: jest.fn((message) => ({ message, code: 'VALIDATION_ERROR', severity: 'low' })),
}))

// Import the mocked functions
import { addTodo } from '@/actions/todo-actions'
import { useToast } from '@/hooks/useToast'
import { createValidationError } from '@/lib/errors'

const mockAddTodo = addTodo as jest.MockedFunction<typeof addTodo>
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>
const mockCreateValidationError = createValidationError as jest.MockedFunction<typeof createValidationError>

describe('TodoFormClient', () => {
  const mockShowSuccess = jest.fn()
  const mockShowError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful response by default
    mockAddTodo.mockResolvedValue(undefined)
    
    // Mock useToast hook return
    mockUseToast.mockReturnValue({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
      showWarning: jest.fn(),
      showInfo: jest.fn(),
      showLoading: jest.fn(),
      dismiss: jest.fn(),
    })
  })

  describe('Form rendering', () => {
    it('should render form with all required elements', () => {
      render(<TodoFormClient />)
      
      expect(screen.getByText('Add New Task')).toBeInTheDocument()
      expect(screen.getByText(/create a new todo item to stay organized/i)).toBeInTheDocument()
      expect(screen.getByRole('form', { name: /add new task/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/task description/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      const form = screen.getByRole('form', { name: /add new task/i })
      const button = screen.getByRole('button', { name: /add new task/i })
      
      expect(input).toHaveAttribute('id', 'new-task-input')
      expect(input).toHaveAttribute('placeholder', 'Enter your task...')
      expect(input).toHaveAttribute('aria-describedby', 'add-task-heading')
      expect(form).toHaveAttribute('role', 'form')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('Form submission', () => {
    it('should call addTodo with correct data when form is submitted', async () => {
      const user = userEvent.setup()
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, 'New test task')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalledWith({
          name: 'New test task',
          category: 'General',
          priority: 'Medium Priority'
        })
      })
    })

    it('should clear input field and show success toast after successful submission', async () => {
      const user = userEvent.setup()
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, 'Task to be cleared')
      await user.click(submitButton)
      
      // With controlled inputs, clearing happens immediately
      await waitFor(() => {
        expect(input.value).toBe('')
        expect(mockShowSuccess).toHaveBeenCalledWith('Task added successfully!')
      })
    })

    it('should handle form submission with Enter key', async () => {
      const user = userEvent.setup()
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      
      await user.type(input, 'Task via Enter key')
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalledWith({
          name: 'Task via Enter key',
          category: 'General',
          priority: 'Medium Priority'
        })
      })
    })

    it('should show validation error for empty task', async () => {
      const user = userEvent.setup()
      render(<TodoFormClient />)
      
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.click(submitButton)
      
      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(mockCreateValidationError).toHaveBeenCalledWith('Please enter a task description')
      expect(mockShowError).toHaveBeenCalledWith({
        message: 'Please enter a task description',
        code: 'VALIDATION_ERROR',
        severity: 'low'
      })
    })

    it('should show validation error for task with only whitespace', async () => {
      const user = userEvent.setup()
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, '   ')
      await user.click(submitButton)
      
      expect(mockAddTodo).not.toHaveBeenCalled()
      expect(mockCreateValidationError).toHaveBeenCalledWith('Please enter a task description')
      expect(mockShowError).toHaveBeenCalledWith({
        message: 'Please enter a task description',
        code: 'VALIDATION_ERROR',
        severity: 'low'
      })
    })

    it('should trim whitespace from task name', async () => {
      const user = userEvent.setup()
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, '  Trimmed Task  ')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalledWith({
          name: 'Trimmed Task',
          category: 'General',
          priority: 'Medium Priority'
        })
      })
    })
  })

  describe('Pending state handling', () => {
    it('should show loading state while form is submitting', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      mockAddTodo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, 'Pending task')
      await user.click(submitButton)
      
      // Should show loading state on button
      expect(screen.getByText('Adding...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
      
      // Input stays enabled for rapid entry
      expect(input).not.toBeDisabled()
      
      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText('Add Task')).toBeInTheDocument()
      })
      
      expect(input).not.toBeDisabled()
      expect(submitButton).not.toBeDisabled()
    })

    it('should prevent multiple submissions while pending', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      mockAddTodo.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, 'Test task')
      
      // Click multiple times rapidly
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // Should only be called once
      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('Error handling', () => {
    it('should handle server action errors gracefully and show error toast', async () => {
      const user = userEvent.setup()
      
      // Mock server error
      const serverError = new Error('Server error')
      mockAddTodo.mockRejectedValue(serverError)
      
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, 'Task that will fail')
      await user.click(submitButton)
      
      // Component should handle error gracefully and return to normal state
      await waitFor(() => {
        expect(screen.getByText('Add Task')).toBeInTheDocument()
        expect(input).not.toBeDisabled()
        expect(submitButton).not.toBeDisabled()
      }, { timeout: 3000 })
      
      // With controlled inputs on error, input value is preserved for retry
      expect(input).toHaveValue('Task that will fail')
      
      // Check error handling and toast notification
      expect(console.error).toHaveBeenCalledWith('Failed to add todo:', serverError)
      expect(mockShowError).toHaveBeenCalledWith(serverError)
    })

    it('should preserve input value on server error for retry', async () => {
      const user = userEvent.setup()
      
      // Mock server error
      mockAddTodo.mockRejectedValue(new Error('Network timeout'))
      
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i) as HTMLInputElement
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, 'Task to retry')
      await user.click(submitButton)
      
      // Wait for error handling to complete
      await waitFor(() => {
        expect(screen.getByText('Add Task')).toBeInTheDocument()
      })
      
      // Input value should be preserved for retry
      expect(input).toHaveValue('Task to retry')
      expect(mockShowError).toHaveBeenCalled()
    })
  })

  describe('Default values', () => {
    it('should use correct default category and priority', async () => {
      const user = userEvent.setup()
      render(<TodoFormClient />)
      
      const input = screen.getByLabelText(/task description/i)
      const submitButton = screen.getByRole('button', { name: /add new task/i })
      
      await user.type(input, 'Task with defaults')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockAddTodo).toHaveBeenCalledWith({
          name: 'Task with defaults',
          category: 'General',
          priority: 'Medium Priority'
        })
      })
    })
  })
})