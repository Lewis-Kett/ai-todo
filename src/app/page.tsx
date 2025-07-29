"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TodoItem } from "@/components/todo/TodoItem"
import { TodoForm } from "@/components/todo/TodoForm"
import { ChatInterface } from "@/components/ui/chat/ChatInterface"
import { useTodos } from "@/hooks/useTodos"

export default function Home() {
  const { todos, addTodo, deleteTodo, toggleComplete, updateTodo, completedCount, pendingCount, totalCount } = useTodos();

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">AI Todo</h1>
        <p className="text-muted-foreground text-center">Manage your tasks efficiently with AI assistance</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Todo Section */}
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

        {/* Chat Section */}
        <div>
          <section aria-labelledby="chat-heading">
            <Card className="h-full">
              <CardContent className="p-0">
                <ChatInterface />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
