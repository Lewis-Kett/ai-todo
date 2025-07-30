'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TodoItem } from "@/components/todo/TodoItem"
import { TodoForm } from "@/components/todo/TodoForm"
import { useTodos } from "@/contexts/TodoContext"

export function TodoSection() {
  const { todos, addTodo, deleteTodo, toggleComplete, updateTodo, completedCount, pendingCount, totalCount } = useTodos()

  return (
    <div className="space-y-6">
      {/* Add Todo Form */}
      <TodoForm onAddTodo={addTodo} />

      {/* Todo List */}
      <section aria-labelledby="tasks-heading">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle id="tasks-heading">Tasks</CardTitle>
              <Badge variant="secondary" aria-label={`${pendingCount} tasks pending`}>
                {pendingCount} pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4" role="list" aria-label="Todo items">
              {todos.map((todo, index) => (
                <li key={todo.id}>
                  <TodoItem 
                    todo={todo}
                    onToggleComplete={toggleComplete}
                    onDelete={deleteTodo}
                    onUpdate={updateTodo}
                  />
                  {index < todos.length - 1 && (
                    <Separator role="separator" aria-hidden="true" className="mt-4" />
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Stats Footer */}
      <footer className="text-center text-sm text-muted-foreground" role="contentinfo" aria-live="polite">
        <p aria-label="Task statistics">
          {pendingCount} tasks pending • {completedCount} completed • {totalCount} total
        </p>
      </footer>
    </div>
  )
}