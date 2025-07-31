import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Todo } from "@/types/todo"
import { TodoItemClient } from "./TodoItemClient"

interface TodoListProps {
  todos: Todo[]
  pendingCount: number
}

export function TodoList({ todos, pendingCount }: TodoListProps) {
  return (
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
                <TodoItemClient todo={todo} />
                {index < todos.length - 1 && (
                  <Separator role="separator" aria-hidden="true" className="mt-4" />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}