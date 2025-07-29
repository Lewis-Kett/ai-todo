import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2 } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">AI Todo</h1>
        <p className="text-muted-foreground text-center">Manage your tasks efficiently</p>
      </header>

      <main>
        {/* Add Todo Form */}
        <section aria-labelledby="add-task-heading" className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle id="add-task-heading">Add New Task</CardTitle>
              <CardDescription>Create a new todo item to stay organized</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex gap-2" role="form" aria-label="Add new task">
                <label htmlFor="new-task-input" className="sr-only">
                  Task description
                </label>
                <Input 
                  id="new-task-input"
                  placeholder="Enter your task..." 
                  className="flex-1"
                  aria-describedby="add-task-heading"
                />
                <Button type="submit" aria-label="Add new task">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Add Task
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Todo List */}
        <section aria-labelledby="tasks-heading">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle id="tasks-heading">Tasks</CardTitle>
                <Badge variant="secondary" aria-label="3 tasks pending">3 pending</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4" role="list" aria-label="Todo items">
                {/* Sample Todo Items */}
                <li>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg" role="group" aria-labelledby="task-1-label">
                    <Checkbox id="todo-1" aria-describedby="task-1-meta" />
                    <div className="flex-1">
                      <label htmlFor="todo-1" id="task-1-label" className="text-sm font-medium cursor-pointer">
                        Complete the project documentation
                      </label>
                      <div id="task-1-meta" className="flex gap-2 mt-1" aria-label="Task metadata">
                        <Badge variant="outline" className="text-xs">High Priority</Badge>
                        <Badge variant="secondary" className="text-xs">Work</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      aria-label="Delete task: Complete the project documentation"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>

                <li>
                  <Separator role="separator" aria-hidden="true" />
                </li>

                <li>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg" role="group" aria-labelledby="task-2-label">
                    <Checkbox id="todo-2" aria-describedby="task-2-meta" />
                    <div className="flex-1">
                      <label htmlFor="todo-2" id="task-2-label" className="text-sm font-medium cursor-pointer">
                        Review pull requests
                      </label>
                      <div id="task-2-meta" className="flex gap-2 mt-1" aria-label="Task metadata">
                        <Badge variant="outline" className="text-xs">Medium Priority</Badge>
                        <Badge variant="secondary" className="text-xs">Development</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      aria-label="Delete task: Review pull requests"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>

                <li>
                  <Separator role="separator" aria-hidden="true" />
                </li>

                <li>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg opacity-60" role="group" aria-labelledby="task-3-label">
                    <Checkbox id="todo-3" checked aria-describedby="task-3-meta" />
                    <div className="flex-1">
                      <label htmlFor="todo-3" id="task-3-label" className="text-sm font-medium cursor-pointer line-through">
                        Set up development environment
                      </label>
                      <div id="task-3-meta" className="flex gap-2 mt-1" aria-label="Task metadata">
                        <Badge variant="outline" className="text-xs">Completed</Badge>
                        <Badge variant="secondary" className="text-xs">Setup</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      aria-label="Delete task: Set up development environment"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Stats Footer */}
        <footer className="mt-6 text-center text-sm text-muted-foreground" role="status" aria-live="polite">
          <p aria-label="Task statistics">2 tasks pending • 1 completed • 3 total</p>
        </footer>
      </main>
    </div>
  )
}
