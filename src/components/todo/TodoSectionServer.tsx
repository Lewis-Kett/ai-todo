import { getTodos, getTodoStats } from '@/actions/todo-actions'
import { TodoFormClient } from './TodoFormClient'
import { TodoList } from './TodoList'
import { TodoStats } from './TodoStats'

export async function TodoSectionServer() {
  const [todos, stats] = await Promise.all([
    getTodos(),
    getTodoStats()
  ])

  return (
    <div className="space-y-6">
      <TodoFormClient />
      <TodoList todos={todos} pendingCount={stats.pendingCount} />
      <TodoStats />
    </div>
  )
}