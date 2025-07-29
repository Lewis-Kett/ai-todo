import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '../page'

describe('Update Todo Feature', () => {
  describe('Toggle Completion', () => {
    it('should toggle completion status when checkbox is clicked', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      const checkbox = screen.getByRole('checkbox', { name: /complete the project documentation/i })
      expect(checkbox).not.toBeChecked()
      
      await user.click(checkbox)
      
      expect(checkbox).toBeChecked()
      expect(screen.getByText('Complete the project documentation')).toHaveClass('line-through')
    })

    it('should update statistics when completing a todo', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      expect(screen.getByText('2 tasks pending • 1 completed • 3 total')).toBeInTheDocument()
      
      const checkbox = screen.getByRole('checkbox', { name: /complete the project documentation/i })
      await user.click(checkbox)
      
      expect(screen.getByText('1 tasks pending • 2 completed • 3 total')).toBeInTheDocument()
      expect(screen.getByText('1 pending')).toBeInTheDocument()
    })

    it('should toggle from completed back to pending', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      const completedCheckbox = screen.getByRole('checkbox', { name: /set up development environment/i })
      expect(completedCheckbox).toBeChecked()
      
      await user.click(completedCheckbox)
      
      expect(completedCheckbox).not.toBeChecked()
      expect(screen.getByText('Set up development environment')).not.toHaveClass('line-through')
      expect(screen.getByText('3 tasks pending • 0 completed • 3 total')).toBeInTheDocument()
    })
  })

  describe('Inline Edit Todo Name', () => {
    it('should allow editing todo name when double-clicked', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      const todoLabel = screen.getByText('Complete the project documentation')
      await user.dblClick(todoLabel)
      
      const editInput = screen.getByDisplayValue('Complete the project documentation')
      expect(editInput).toBeInTheDocument()
      expect(editInput).toHaveFocus()
    })

    it('should save changes when Enter is pressed', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      const todoLabel = screen.getByText('Complete the project documentation')
      await user.dblClick(todoLabel)
      
      const editInput = screen.getByDisplayValue('Complete the project documentation')
      await user.clear(editInput)
      await user.type(editInput, 'Updated project documentation')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('Updated project documentation')).toBeInTheDocument()
      expect(screen.queryByText('Complete the project documentation')).not.toBeInTheDocument()
    })

    it('should cancel editing when Escape is pressed', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      const todoLabel = screen.getByText('Complete the project documentation')
      await user.dblClick(todoLabel)
      
      const editInput = screen.getByDisplayValue('Complete the project documentation')
      await user.clear(editInput)
      await user.type(editInput, 'This should be cancelled')
      await user.keyboard('{Escape}')
      
      expect(screen.getByText('Complete the project documentation')).toBeInTheDocument()
      expect(screen.queryByText('This should be cancelled')).not.toBeInTheDocument()
    })

    it('should save changes when input loses focus', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      const todoLabel = screen.getByText('Complete the project documentation')
      await user.dblClick(todoLabel)
      
      const editInput = screen.getByDisplayValue('Complete the project documentation')
      await user.clear(editInput)
      await user.type(editInput, 'Documentation via blur')
      
      // Click outside to blur
      await user.click(document.body)
      
      expect(screen.getByText('Documentation via blur')).toBeInTheDocument()
    })

    it('should not save empty or whitespace-only names', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      const todoLabel = screen.getByText('Complete the project documentation')
      await user.dblClick(todoLabel)
      
      const editInput = screen.getByDisplayValue('Complete the project documentation')
      await user.clear(editInput)
      await user.type(editInput, '   ')
      await user.keyboard('{Enter}')
      
      expect(screen.getByText('Complete the project documentation')).toBeInTheDocument()
    })
  })

  describe('Priority Selection', () => {
    it('should cycle through priorities on badge click', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      // Find the specific todo group first
      const todoItem = screen.getByText('Complete the project documentation').closest('[role="group"]')
      const priorityBadge = todoItem?.querySelector('span:first-child') as HTMLElement
      expect(priorityBadge).toHaveTextContent('High Priority')
      
      await user.click(priorityBadge)
      
      // Should cycle to Medium Priority
      expect(priorityBadge).toHaveTextContent('Medium Priority')
      
      // Click again to cycle to Low Priority
      await user.click(priorityBadge)
      
      expect(priorityBadge).toHaveTextContent('Low Priority')
      
      // Click again to cycle back to High Priority
      await user.click(priorityBadge)
      
      expect(priorityBadge).toHaveTextContent('High Priority')
    })
  })

  describe('Category Selection', () => {
    it('should allow editing category inline on double-click', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      // Find the specific todo and its category badge
      const todoItem = screen.getByText('Complete the project documentation').closest('[role="group"]')
      const categoryBadge = todoItem?.querySelector('span:last-child') as HTMLElement
      expect(categoryBadge).toHaveTextContent('Work')
      
      await user.dblClick(categoryBadge)
      
      const editInput = screen.getByDisplayValue('Work')
      await user.clear(editInput)
      await user.type(editInput, 'Business')
      await user.keyboard('{Enter}')
      
      expect(todoItem).toContainElement(screen.getByText('Business'))
    })
  })
})