/**
 * UI tests for TodoList
 * 
 * Tests the rendering and accessibility of the TodoList component.
 */

import { render, screen } from '@testing-library/react'
import { TodoList } from '../TodoList'
import { Todo } from '@/types/todo'

// Mock TodoItemClient component
jest.mock('../TodoItemClient', () => ({
  TodoItemClient: ({ todo }: { todo: Todo }) => (
    <div data-testid={`todo-item-${todo.id}`}>
      {todo.name}
    </div>
  )
}))

describe('TodoList', () => {
  const mockTodos: Todo[] = [
    {
      id: '1',
      name: 'Complete project documentation',
      category: 'Work',
      priority: 'High Priority',
      completed: false,
    },
    {
      id: '2',
      name: 'Review pull requests',
      category: 'Development',
      priority: 'Medium Priority',
      completed: false,
    },
    {
      id: '3',
      name: 'Set up development environment',
      category: 'Setup',
      priority: 'High Priority',
      completed: true,
    },
  ]

  describe('Rendering', () => {
    it('should render todo list with all elements', () => {
      render(<TodoList todos={mockTodos} pendingCount={2} />)
      
      expect(screen.getByRole('region', { name: /tasks/i })).toBeInTheDocument()
      expect(screen.getByText('Tasks')).toBeInTheDocument()
      expect(screen.getByText('2 pending')).toBeInTheDocument()
      expect(screen.getByRole('list', { name: /todo items/i })).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<TodoList todos={mockTodos} pendingCount={2} />)
      
      const section = screen.getByRole('region')
      const heading = screen.getByText('Tasks')
      const badge = screen.getByText('2 pending')
      const list = screen.getByRole('list')
      
      expect(section).toHaveAttribute('aria-labelledby', 'tasks-heading')
      expect(heading).toHaveAttribute('id', 'tasks-heading')
      expect(badge).toHaveAttribute('aria-label', '2 tasks pending')
      expect(list).toHaveAttribute('role', 'list')
      expect(list).toHaveAttribute('aria-label', 'Todo items')
    })

    it('should render all todo items', () => {
      render(<TodoList todos={mockTodos} pendingCount={2} />)
      
      mockTodos.forEach((todo) => {
        expect(screen.getByTestId(`todo-item-${todo.id}`)).toBeInTheDocument()
        expect(screen.getByText(todo.name)).toBeInTheDocument()
      })
    })

    it('should render separators between todo items', () => {
      render(<TodoList todos={mockTodos} pendingCount={2} />)
      
      // The Separator component renders as a decorative div with data-slot="separator"
      const separators = document.querySelectorAll('[data-slot="separator"]')
      // Should have separators between items but not after the last item
      expect(separators).toHaveLength(mockTodos.length - 1)
    })

    it('should display correct pending count', () => {
      render(<TodoList todos={mockTodos} pendingCount={5} />)
      
      const badge = screen.getByText('5 pending')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveAttribute('aria-label', '5 tasks pending')
    })
  })

  describe('Empty State', () => {
    it('should render with empty todos array', () => {
      render(<TodoList todos={[]} pendingCount={0} />)
      
      expect(screen.getByText('Tasks')).toBeInTheDocument()
      expect(screen.getByText('0 pending')).toBeInTheDocument()
      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(document.querySelector('[data-slot="separator"]')).not.toBeInTheDocument()
    })
  })

  describe('Single Todo', () => {
    it('should render single todo without separator', () => {
      const singleTodo = [mockTodos[0]]
      render(<TodoList todos={singleTodo} pendingCount={1} />)
      
      expect(screen.getByTestId(`todo-item-${singleTodo[0].id}`)).toBeInTheDocument()
      expect(document.querySelector('[data-slot="separator"]')).not.toBeInTheDocument()
    })
  })

  describe('Animation Styles', () => {
    it('should apply animation styles to todo items', () => {
      render(<TodoList todos={mockTodos} pendingCount={2} />)
      
      const listItems = screen.getAllByRole('listitem')
      
      listItems.forEach((item, index) => {
        expect(item).toHaveClass(
          'animate-in',
          'fade-in',
          'slide-in-from-left-4',
          'transition-all',
          'duration-300'
        )
        expect(item).toHaveStyle({
          animationDelay: `${index * 100}ms`,
          animationDuration: '500ms',
          animationFillMode: 'both'
        })
      })
    })

    it('should apply transition classes to container elements', () => {
      render(<TodoList todos={mockTodos} pendingCount={2} />)
      
      // Card should have transition classes
      const card = screen.getByRole('region').firstChild as HTMLElement
      expect(card).toHaveClass('transition-all', 'duration-500', 'ease-out')
      
      // CardContent should have transition classes
      const cardContent = screen.getByRole('list').parentElement as HTMLElement
      expect(cardContent).toHaveClass('transition-all', 'duration-500', 'ease-out')
      
      // List should have transition classes
      const list = screen.getByRole('list')
      expect(list).toHaveClass('transition-all', 'duration-500', 'ease-out')
    })
  })
})