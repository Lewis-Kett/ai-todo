import { getTodoStats } from '@/actions/todo-actions'

export async function TodoStats() {
  const { completedCount, pendingCount, totalCount } = await getTodoStats()

  return (
    <footer className="text-center text-sm text-muted-foreground" role="contentinfo" aria-live="polite">
      <p aria-label="Task statistics">
        {pendingCount} tasks pending • {completedCount} completed • {totalCount} total
      </p>
    </footer>
  )
}