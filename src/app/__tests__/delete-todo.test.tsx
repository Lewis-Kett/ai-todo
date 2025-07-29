import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../page'

describe('Delete Todo Feature', () => {
  it('should delete a todo when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    expect(screen.getByText('Complete the project documentation')).toBeInTheDocument()
    
    const deleteButton = screen.getByLabelText(/delete task: complete the project documentation/i)
    await user.click(deleteButton)
    
    expect(screen.queryByText('Complete the project documentation')).not.toBeInTheDocument()
  })

  it('should update task statistics after deleting a todo', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    expect(screen.getByText('2 tasks pending • 1 completed • 3 total')).toBeInTheDocument()
    
    const deleteButton = screen.getByLabelText(/delete task: complete the project documentation/i)
    await user.click(deleteButton)
    
    expect(screen.getByText('1 tasks pending • 1 completed • 2 total')).toBeInTheDocument()
  })

  it('should delete a completed todo', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    expect(screen.getByText('Set up development environment')).toBeInTheDocument()
    
    const deleteButton = screen.getByLabelText(/delete task: set up development environment/i)
    await user.click(deleteButton)
    
    expect(screen.queryByText('Set up development environment')).not.toBeInTheDocument()
  })

  it('should update pending count when deleting a pending todo', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const pendingBadge = screen.getByText('2 pending')
    expect(pendingBadge).toBeInTheDocument()
    
    const deleteButton = screen.getByLabelText(/delete task: review pull requests/i)
    await user.click(deleteButton)
    
    expect(screen.getByText('1 pending')).toBeInTheDocument()
  })

  it('should update completed count when deleting a completed todo', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    expect(screen.getByText('2 tasks pending • 1 completed • 3 total')).toBeInTheDocument()
    
    const deleteButton = screen.getByLabelText(/delete task: set up development environment/i)
    await user.click(deleteButton)
    
    expect(screen.getByText('2 tasks pending • 0 completed • 2 total')).toBeInTheDocument()
  })

  it('should handle deleting all todos', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const deleteButtons = screen.getAllByLabelText(/delete task:/i)
    
    for (const button of deleteButtons) {
      await user.click(button)
    }
    
    expect(screen.getByText('0 tasks pending • 0 completed • 0 total')).toBeInTheDocument()
    expect(screen.getByText('0 pending')).toBeInTheDocument()
  })

  it('should remove todo from accessibility tree when deleted', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const initialCheckboxes = screen.getAllByRole('checkbox')
    expect(initialCheckboxes).toHaveLength(3)
    
    const deleteButton = screen.getByLabelText(/delete task: complete the project documentation/i)
    await user.click(deleteButton)
    
    const finalCheckboxes = screen.getAllByRole('checkbox')
    expect(finalCheckboxes).toHaveLength(2)
  })
})