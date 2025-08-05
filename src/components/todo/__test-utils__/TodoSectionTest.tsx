'use client'

import { TodoFormClient } from '../TodoFormClient'
import { TodoList } from '../TodoList'
import { Todo } from '@/types/todo'

const mockTodos: Todo[] = [
  {
    id: '1',
    name: 'Complete the project documentation',
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

export function TodoSectionTest() {
  const pendingCount = mockTodos.filter(todo => !todo.completed).length
  const completedCount = mockTodos.filter(todo => todo.completed).length
  const totalCount = mockTodos.length

  return (
    <div className="space-y-6">
      {/* Add Todo Form */}
      <TodoFormClient />

      {/* Todo List */}
      <TodoList todos={mockTodos} pendingCount={pendingCount} />

      {/* Stats Footer */}
      <footer className="text-center text-sm text-muted-foreground" role="contentinfo" aria-live="polite">
        <p aria-label="Task statistics">
          {pendingCount} tasks pending • {completedCount} completed • {totalCount} total
        </p>
      </footer>
    </div>
  )
}