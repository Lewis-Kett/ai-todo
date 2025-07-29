import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../page'

describe('Create Todo Feature', () => {
  it('should create a new todo when form is submitted with valid input', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const input = screen.getByLabelText(/task description/i)
    const submitButton = screen.getByRole('button', { name: /add new task/i })
    
    await user.type(input, 'New test task')
    await user.click(submitButton)
    
    expect(screen.getByText('New test task')).toBeInTheDocument()
  })

  it('should clear the input field after successful todo creation', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const input = screen.getByLabelText(/task description/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /add new task/i })
    
    await user.type(input, 'Another test task')
    await user.click(submitButton)
    
    expect(input.value).toBe('')
  })

  it('should update task statistics after creating a new todo', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const initialStats = screen.getByText('2 tasks pending • 1 completed • 3 total')
    expect(initialStats).toBeInTheDocument()
    
    const input = screen.getByLabelText(/task description/i)
    const submitButton = screen.getByRole('button', { name: /add new task/i })
    
    await user.type(input, 'Task that increases count')
    await user.click(submitButton)
    
    expect(screen.getByText('3 tasks pending • 1 completed • 4 total')).toBeInTheDocument()
  })

  it('should not create a todo with empty input', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const submitButton = screen.getByRole('button', { name: /add new task/i })
    const initialTodoCount = screen.getAllByRole('checkbox').length
    
    await user.click(submitButton)
    
    const finalTodoCount = screen.getAllByRole('checkbox').length
    expect(finalTodoCount).toBe(initialTodoCount)
  })

  it('should not create a todo with only whitespace', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const input = screen.getByLabelText(/task description/i)
    const submitButton = screen.getByRole('button', { name: /add new task/i })
    const initialTodoCount = screen.getAllByRole('checkbox').length
    
    await user.type(input, '   ')
    await user.click(submitButton)
    
    const finalTodoCount = screen.getAllByRole('checkbox').length
    expect(finalTodoCount).toBe(initialTodoCount)
  })

  it('should create todo with default priority and category', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const input = screen.getByLabelText(/task description/i)
    const submitButton = screen.getByRole('button', { name: /add new task/i })
    
    await user.type(input, 'Task with defaults')
    await user.click(submitButton)
    
    expect(screen.getByText('Task with defaults')).toBeInTheDocument()
    
    const mediumPriorityBadges = screen.getAllByText('Medium Priority')
    expect(mediumPriorityBadges.length).toBeGreaterThan(0)
    
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const input = screen.getByLabelText(/task description/i)
    
    await user.type(input, 'Task created with Enter')
    await user.keyboard('{Enter}')
    
    expect(screen.getByText('Task created with Enter')).toBeInTheDocument()
  })
})