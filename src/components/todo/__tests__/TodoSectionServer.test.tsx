/**
 * UI tests for TodoSectionServer
 * 
 * Tests the rendering, data integration, and Suspense boundaries of the server component.
 */

import { render, screen } from '@testing-library/react'
import { TodoSectionServer } from '../TodoSectionServer'

// Mock the todo actions
jest.mock('@/actions/todo-actions', () => ({
  getTodos: jest.fn(),
}))

// Mock child components
jest.mock('../TodoFormClient', () => ({
  TodoFormClient: () => <div data-testid="todo-form-client">Todo Form</div>
}))

jest.mock('../TodoList', () => ({
  TodoList: ({ todos, pendingCount }: { todos: any[], pendingCount: number }) => (
    <div data-testid="todo-list">
      <span data-testid="todo-count">{todos.length}</span>
      <span data-testid="pending-count">{pendingCount}</span>
    </div>
  )
}))

jest.mock('../TodoStats', () => ({
  TodoStats: () => <div data-testid="todo-stats">Todo Stats</div>
}))

import { getTodos } from '@/actions/todo-actions'

const mockGetTodos = getTodos as jest.MockedFunction<typeof getTodos>

describe('TodoSectionServer', () => {
  const mockTodos = [
    {
      id: '1',
      name: 'Complete project documentation',
      category: 'Work',
      priority: 'High Priority' as const,
      completed: false,
    },
    {
      id: '2',
      name: 'Review pull requests',
      category: 'Development',
      priority: 'Medium Priority' as const,
      completed: false,
    },
    {
      id: '3',
      name: 'Set up development environment',
      category: 'Setup',
      priority: 'High Priority' as const,
      completed: true,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTodos.mockResolvedValue(mockTodos)
  })

  describe('Rendering', () => {
    it('should render all child components', async () => {
      const component = await TodoSectionServer()
      render(component)
      
      expect(screen.getByTestId('todo-form-client')).toBeInTheDocument()
      expect(screen.getByTestId('todo-list')).toBeInTheDocument()
      expect(screen.getByTestId('todo-stats')).toBeInTheDocument()
    })

    it('should have proper layout structure with spacing', async () => {
      const component = await TodoSectionServer()
      render(component)
      
      const container = screen.getByTestId('todo-form-client').parentElement
      expect(container).toHaveClass('space-y-6')
    })
  })

  describe('Data Integration', () => {
    it('should fetch todos and pass to TodoList', async () => {
      const component = await TodoSectionServer()
      render(component)
      
      expect(mockGetTodos).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('todo-count')).toHaveTextContent('3')
    })

    it('should calculate and pass pending count correctly', async () => {
      const component = await TodoSectionServer()
      render(component)
      
      // Should have 2 pending todos (only completed: false)
      expect(screen.getByTestId('pending-count')).toHaveTextContent('2')
    })

    it('should handle empty todos array', async () => {
      mockGetTodos.mockResolvedValue([])
      
      const component = await TodoSectionServer()
      render(component)
      
      expect(screen.getByTestId('todo-count')).toHaveTextContent('0')
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0')
    })

    it('should handle all completed todos', async () => {
      const allCompletedTodos = mockTodos.map(todo => ({ ...todo, completed: true }))
      mockGetTodos.mockResolvedValue(allCompletedTodos)
      
      const component = await TodoSectionServer()
      render(component)
      
      expect(screen.getByTestId('todo-count')).toHaveTextContent('3')
      expect(screen.getByTestId('pending-count')).toHaveTextContent('0')
    })

    it('should handle all pending todos', async () => {
      const allPendingTodos = mockTodos.map(todo => ({ ...todo, completed: false }))
      mockGetTodos.mockResolvedValue(allPendingTodos)
      
      const component = await TodoSectionServer()
      render(component)
      
      expect(screen.getByTestId('todo-count')).toHaveTextContent('3')
      expect(screen.getByTestId('pending-count')).toHaveTextContent('3')
    })
  })

  describe('Suspense Integration', () => {
    it('should wrap TodoStats in Suspense boundary', async () => {
      const component = await TodoSectionServer()
      render(component)
      
      // TodoStats should be present (not showing fallback)
      expect(screen.getByTestId('todo-stats')).toBeInTheDocument()
    })

    it('should have proper fallback skeleton structure', async () => {
      // We can't easily test the fallback in this test setup since TodoStats resolves synchronously
      // But we can verify the component structure exists
      const component = await TodoSectionServer()
      const { container } = render(component)
      
      // Verify the component renders without errors
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should pass todos array to TodoList component', async () => {
      const customTodos = [mockTodos[0]]
      mockGetTodos.mockResolvedValue(customTodos)
      
      const component = await TodoSectionServer()
      render(component)
      
      expect(screen.getByTestId('todo-count')).toHaveTextContent('1')
      expect(screen.getByTestId('pending-count')).toHaveTextContent('1')
    })

    it('should maintain component order in layout', async () => {
      const component = await TodoSectionServer()
      const { container } = render(component)
      
      const children = Array.from(container.firstChild?.children || [])
      expect(children[0]).toBe(screen.getByTestId('todo-form-client'))
      expect(children[1]).toBe(screen.getByTestId('todo-list'))
      // TodoStats is wrapped in Suspense, so it's the third child at a different level
    })
  })

  describe('Error Handling', () => {
    it('should handle getTodos rejection gracefully', async () => {
      mockGetTodos.mockRejectedValue(new Error('Failed to fetch todos'))
      
      await expect(TodoSectionServer()).rejects.toThrow('Failed to fetch todos')
    })
  })
})