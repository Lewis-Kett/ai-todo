import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { TodoFormData } from "@/types/todo"

interface TodoFormProps {
  onAddTodo: (formData: TodoFormData) => void;
}

export function TodoForm({ onAddTodo }: TodoFormProps) {
  const [taskInput, setTaskInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = taskInput.trim();
    if (trimmedInput) {
      onAddTodo({
        name: trimmedInput,
        category: 'General',
        priority: 'Medium Priority'
      });
      setTaskInput('');
    }
  };

  return (
    <section aria-labelledby="add-task-heading" className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle id="add-task-heading">Add New Task</CardTitle>
          <CardDescription>Create a new todo item to stay organized</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-2" role="form" aria-label="Add new task" onSubmit={handleSubmit}>
            <label htmlFor="new-task-input" className="sr-only">
              Task description
            </label>
            <Input 
              id="new-task-input"
              placeholder="Enter your task..." 
              className="flex-1"
              aria-describedby="add-task-heading"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
            />
            <Button type="submit" aria-label="Add new task">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Add Task
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}