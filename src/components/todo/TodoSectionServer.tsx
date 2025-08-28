import { Suspense } from 'react'
import { getTodos } from '@/actions/todo-actions'
import { TodoFormClient } from './TodoFormClient'
import { TodoList } from './TodoList'
import { TodoStats } from './TodoStats'
import { Skeleton } from '@/components/ui/skeleton'

export async function TodoSectionServer() {
  const todos = await getTodos()
  const pendingCount = todos.filter(todo => !todo.completed).length

  return (
    <div className="space-y-6">
      <TodoFormClient />
      <TodoList todos={todos} pendingCount={pendingCount} />
      <Suspense fallback={
        <div className="flex justify-between space-x-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      }>
        <TodoStats />
      </Suspense>
    </div>
  )
}