'use client'

import { useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { addTodo } from '@/actions/todo-actions'
import { DEFAULT_TODO_CATEGORY, DEFAULT_TODO_PRIORITY } from '@/constants/todo'

export function TodoFormClient() {
  const [taskInput, setTaskInput] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = taskInput.trim()
    if (trimmedInput) {
      startTransition(async () => {
        try {
          await addTodo({
            name: trimmedInput,
            category: DEFAULT_TODO_CATEGORY,
            priority: DEFAULT_TODO_PRIORITY
          })
          setTaskInput('')
        } catch (error) {
          console.error('Failed to add todo:', error)
          // Keep the input value so user can retry
        }
      })
    }
  }

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
              disabled={isPending}
            />
            <Button type="submit" aria-label="Add new task" disabled={isPending}>
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}