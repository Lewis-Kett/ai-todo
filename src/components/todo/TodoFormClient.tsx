'use client'

import { useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { addTodo } from '@/actions/todo-actions'
import { DEFAULT_TODO_CATEGORY, DEFAULT_TODO_PRIORITY } from '@/constants/todo'
import { handleError, createValidationError } from '@/lib/errors'
import { useToast } from '@/hooks/useToast'

export function TodoFormClient() {
  const [taskInput, setTaskInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const { showSuccess, showError } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedInput = taskInput.trim()
    if (!trimmedInput) {
      const validationError = createValidationError('Please enter a task description')
      showError(validationError)
      return
    }

    startTransition(async () => {
      try {
        await addTodo({
          name: trimmedInput,
          category: DEFAULT_TODO_CATEGORY,
          priority: DEFAULT_TODO_PRIORITY
        })
        setTaskInput('') // Clear immediately for rapid input
        showSuccess('Task added successfully!')
      } catch (error) {
        const appError = handleError(error)
        console.error('Failed to add todo:', appError)
        showError(appError)
        // Keep the input value so user can retry
      }
    })
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
              className="flex-1 transition-all duration-300 focus:scale-[1.02]"
              aria-describedby="add-task-heading"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              // Keep input enabled for rapid entry
            />
            <Button 
              type="submit" 
              aria-label="Add new task" 
              disabled={isPending}
              className="transition-all duration-300 transform hover:scale-105 active:scale-9"
            >
              <Plus className={`h-4 w-4 mr-2 transition-transform duration-300 ${
                isPending ? 'animate-spin' : ''
              }`} aria-hidden="true" />
              {isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}