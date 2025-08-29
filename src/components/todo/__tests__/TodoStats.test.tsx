/**
 * UI tests for TodoStats
 * 
 * Tests the rendering, accessibility, and data integration of the server component.
 */

import { render, screen } from '@testing-library/react'
import { TodoStats } from '../TodoStats'

// Mock the todo actions
jest.mock('@/actions/todo-actions', () => ({
  getTodoStats: jest.fn(),
}))

import { getTodoStats } from '@/actions/todo-actions'

const mockGetTodoStats = getTodoStats as jest.MockedFunction<typeof getTodoStats>

describe('TodoStats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render statistics with proper structure', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 5,
        pendingCount: 3,
        totalCount: 8,
      })
      
      const component = await TodoStats()
      render(component)
      
      const footer = screen.getByRole('contentinfo')
      const statsText = screen.getByLabelText('Task statistics')
      
      expect(footer).toBeInTheDocument()
      expect(statsText).toBeInTheDocument()
      expect(statsText).toHaveTextContent('3 tasks pending • 5 completed • 8 total')
    })

    it('should have proper accessibility attributes', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 2,
        pendingCount: 1,
        totalCount: 3,
      })
      
      const component = await TodoStats()
      render(component)
      
      const footer = screen.getByRole('contentinfo')
      const statsText = screen.getByLabelText('Task statistics')
      
      expect(footer).toHaveAttribute('role', 'contentinfo')
      expect(footer).toHaveAttribute('aria-live', 'polite')
      expect(footer).toHaveClass('text-center', 'text-sm', 'text-muted-foreground')
      expect(statsText).toHaveAttribute('aria-label', 'Task statistics')
    })
  })

  describe('Data Integration', () => {
    it('should fetch and display statistics correctly', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 10,
        pendingCount: 5,
        totalCount: 15,
      })
      
      const component = await TodoStats()
      render(component)
      
      expect(mockGetTodoStats).toHaveBeenCalledTimes(1)
      expect(screen.getByText('5 tasks pending • 10 completed • 15 total')).toBeInTheDocument()
    })

    it('should handle zero values correctly', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 0,
        pendingCount: 0,
        totalCount: 0,
      })
      
      const component = await TodoStats()
      render(component)
      
      expect(screen.getByText('0 tasks pending • 0 completed • 0 total')).toBeInTheDocument()
    })

    it('should handle only pending tasks', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 0,
        pendingCount: 7,
        totalCount: 7,
      })
      
      const component = await TodoStats()
      render(component)
      
      expect(screen.getByText('7 tasks pending • 0 completed • 7 total')).toBeInTheDocument()
    })

    it('should handle only completed tasks', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 12,
        pendingCount: 0,
        totalCount: 12,
      })
      
      const component = await TodoStats()
      render(component)
      
      expect(screen.getByText('0 tasks pending • 12 completed • 12 total')).toBeInTheDocument()
    })

    it('should handle single task scenarios', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 1,
        pendingCount: 0,
        totalCount: 1,
      })
      
      const component = await TodoStats()
      render(component)
      
      expect(screen.getByText('0 tasks pending • 1 completed • 1 total')).toBeInTheDocument()
    })
  })

  describe('Formatting', () => {
    it('should format statistics in correct order', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 3,
        pendingCount: 2,
        totalCount: 5,
      })
      
      const component = await TodoStats()
      render(component)
      
      // Check the exact format: pending • completed • total
      const text = screen.getByLabelText('Task statistics').textContent
      expect(text).toBe('2 tasks pending • 3 completed • 5 total')
    })

    it('should use proper separators', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 1,
        pendingCount: 1,
        totalCount: 2,
      })
      
      const component = await TodoStats()
      render(component)
      
      const text = screen.getByLabelText('Task statistics').textContent
      expect(text).toContain(' • ')
      expect(text?.split(' • ')).toHaveLength(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle getTodoStats rejection gracefully', async () => {
      mockGetTodoStats.mockRejectedValue(new Error('Failed to fetch stats'))
      
      await expect(TodoStats()).rejects.toThrow('Failed to fetch stats')
    })
  })

  describe('Live Region Behavior', () => {
    it('should have aria-live=polite for dynamic updates', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 4,
        pendingCount: 6,
        totalCount: 10,
      })
      
      const component = await TodoStats()
      render(component)
      
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Styling', () => {
    it('should apply correct CSS classes', async () => {
      mockGetTodoStats.mockResolvedValue({
        completedCount: 1,
        pendingCount: 1,
        totalCount: 2,
      })
      
      const component = await TodoStats()
      render(component)
      
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('text-center', 'text-sm', 'text-muted-foreground')
    })
  })
})