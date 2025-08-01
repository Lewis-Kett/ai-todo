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
      <Card className="transition-all duration-500 ease-out">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle id="tasks-heading">Tasks</CardTitle>
            <Badge variant="secondary" aria-label={`${pendingCount} tasks pending`}>
              {pendingCount} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="transition-all duration-500 ease-out">
          <ul className="space-y-4 transition-all duration-500 ease-out" role="list" aria-label="Todo items">
            {todos.map((todo, index) => (
              <li 
                key={todo.id}
                className="animate-in fade-in slide-in-from-left-4 transition-all duration-300"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationDuration: '500ms',
                  animationFillMode: 'both'
                }}
              >
                <TodoItemClient todo={todo} />
                {index < todos.length - 1 && (
                  <Separator 
                    role="separator" 
                    aria-hidden="true" 
                    className="mt-4 transition-opacity duration-300" 
                  />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}