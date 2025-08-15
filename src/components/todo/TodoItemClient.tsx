'use client'

import { useOptimistic, useTransition } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { Todo, TodoPriority } from "@/types/todo"
import { useInlineEdit } from "@/hooks/useInlineEdit"
import { deleteTodo, toggleTodoComplete, updateTodo } from '@/actions/todo-actions'

interface TodoItemClientProps {
  todo: Todo
}

export function TodoItemClient({ todo }: TodoItemClientProps) {
  //todo wrap this guy in custom hook
  const [optimisticTodo, updateOptimisticTodo] = useOptimistic(
    { ...todo, deleting: false },
    (state: Todo & { deleting: boolean }, update: Partial<Todo & { deleting: boolean }>) => ({ ...state, ...update })
  )
  const [isPending, startTransition] = useTransition()
  
  const priorities: TodoPriority[] = ['High Priority', 'Medium Priority', 'Low Priority']
  
  const priorityVariant = optimisticTodo.completed ? "outline" : "outline"
  
  const priorityText = optimisticTodo.completed ? "Completed" : optimisticTodo.priority

  const nameEdit = useInlineEdit(optimisticTodo.name, (name) => {
    startTransition(async () => {
      updateOptimisticTodo({ name })
      try {
        await updateTodo(optimisticTodo.id, { name })
      } catch (error) {
        console.error('Failed to update todo name:', error)
        // Revert optimistic update on error
        updateOptimisticTodo({ name: todo.name })
      }
    })
  })

  const categoryEdit = useInlineEdit(optimisticTodo.category, (category) => {
    startTransition(async () => {
      updateOptimisticTodo({ category })
      try {
        await updateTodo(optimisticTodo.id, { category })
      } catch (error) {
        console.error('Failed to update todo category:', error)
        // Revert optimistic update on error
        updateOptimisticTodo({ category: todo.category })
      }
    })
  })

  const handleToggleComplete = () => {
    startTransition(async () => {
      const previousCompleted = optimisticTodo.completed
      updateOptimisticTodo({ completed: !optimisticTodo.completed })
      try {
        await toggleTodoComplete(optimisticTodo.id)
      } catch (error) {
        console.error('Failed to toggle todo completion:', error)
        // Revert optimistic update on error
        updateOptimisticTodo({ completed: previousCompleted })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      // Set deleting state optimistically
      updateOptimisticTodo({ deleting: true })
      try {
        await deleteTodo(optimisticTodo.id)
      } catch (error) {
        console.error('Failed to delete todo:', error)
        // Revert optimistic update on error
        updateOptimisticTodo({ deleting: false })
      }
    })
  }

  const cyclePriority = () => {
    if (optimisticTodo.completed) return
    
    const currentIndex = priorities.indexOf(optimisticTodo.priority)
    const nextIndex = (currentIndex + 1) % priorities.length
    const newPriority = priorities[nextIndex]
    
    startTransition(async () => {
      updateOptimisticTodo({ priority: newPriority })
      try {
        await updateTodo(optimisticTodo.id, { priority: newPriority })
      } catch (error) {
        console.error('Failed to update todo priority:', error)
        // Revert optimistic update on error
        updateOptimisticTodo({ priority: todo.priority })
      }
    })
  }

  return (
    <div 
      className={`flex items-center space-x-3 p-3 border rounded-lg transition-all duration-500 ease-out transform ${
        optimisticTodo.completed ? 'opacity-60 scale-[0.98]' : 'scale-100'
      } ${isPending && !optimisticTodo.deleting ? 'opacity-70 scale-[0.99]' : ''} ${
        optimisticTodo.deleting ? 'opacity-0 scale-90 -translate-x-4 pointer-events-none' : 'translate-x-0'
      } hover:scale-[1.01] hover:border-primary/20`} 
      role="group" 
      aria-labelledby={`task-${optimisticTodo.id}-label`}
    >
      <Checkbox 
        id={`todo-${optimisticTodo.id}`} 
        checked={optimisticTodo.completed}
        onCheckedChange={handleToggleComplete}
        aria-describedby={`task-${optimisticTodo.id}-meta`}
        disabled={isPending}
      />
      <div className="flex-1">
        {nameEdit.isEditing ? (
          <Input
            ref={nameEdit.inputRef}
            value={nameEdit.editedValue}
            onChange={(e) => nameEdit.setEditedValue(e.target.value)}
            onKeyDown={nameEdit.handleKeyDown}
            onBlur={nameEdit.saveValue}
            className="text-sm font-medium"
            disabled={isPending}
          />
        ) : (
          <label 
            htmlFor={`todo-${optimisticTodo.id}`} 
            id={`task-${optimisticTodo.id}-label`} 
            className={`text-sm font-medium cursor-pointer ${
              optimisticTodo.completed ? 'line-through' : ''
            }`}
            onDoubleClick={nameEdit.startEditing}
          >
            {optimisticTodo.name}
          </label>
        )}
        <div id={`task-${optimisticTodo.id}-meta`} className="flex gap-2 mt-1" aria-label="Task metadata">
          <Badge 
            variant={priorityVariant} 
            className={`text-xs transition-all duration-300 transform ${
              !optimisticTodo.completed && !isPending 
                ? 'cursor-pointer hover:scale-105 active:scale-95' 
                : ''
            } ${isPending ? 'animate-pulse' : ''}`}
            onClick={cyclePriority}
          >
            {priorityText}
          </Badge>
          {categoryEdit.isEditing ? (
            <Input
              ref={categoryEdit.inputRef}
              value={categoryEdit.editedValue}
              onChange={(e) => categoryEdit.setEditedValue(e.target.value)}
              onKeyDown={categoryEdit.handleKeyDown}
              onBlur={categoryEdit.saveValue}
              className="text-xs h-6 px-2"
              disabled={isPending}
            />
          ) : (
            <Badge 
              variant="secondary" 
              className={`text-xs transition-all duration-300 transform ${
                !isPending 
                  ? 'cursor-pointer hover:scale-105 active:scale-95' 
                  : ''
              } ${isPending ? 'animate-pulse' : ''}`}
              onDoubleClick={categoryEdit.startEditing}
            >
              {optimisticTodo.category}
            </Badge>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleDelete}
        aria-label={`Delete task: ${optimisticTodo.name}`}
        disabled={isPending}
        className="transition-all duration-300 transform hover:scale-110 hover:text-destructive active:scale-95"
      >
        <Trash2 className={`h-4 w-4 transition-transform duration-300 ${
          optimisticTodo.deleting ? 'animate-spin' : ''
        }`} aria-hidden="true" />
      </Button>
    </div>
  )
}