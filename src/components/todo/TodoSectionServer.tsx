import { Suspense } from 'react'
import { getTodos } from '@/actions/todo-actions'
import { TodoFormClient } from './TodoFormClient'
import { TodoList } from './TodoList'
import { TodoStats } from './TodoStats'

export async function TodoSectionServer() {
  const todos = await getTodos()
  const pendingCount = todos.filter(todo => !todo.completed).length

  return (
    <div className="space-y-6">
      <TodoFormClient />
      <TodoList todos={todos} pendingCount={pendingCount} />
      <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading stats...</div>}>
        <TodoStats />
      </Suspense>
    </div>
  )
}