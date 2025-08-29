import { useOptimistic, useTransition } from 'react'
import { Todo } from '@/types/todo'
import { deleteTodo, toggleTodoComplete, updateTodo } from '@/actions/todo-actions'
import { handleError, createDataError } from '@/lib/errors'
import { useToast } from '@/hooks/useToast'
import { TODO_PRIORITIES } from '@/lib/constants'

interface OptimisticTodo extends Todo {
  deleting: boolean
}

export function useTodoItem(todo: Todo) {
  const [optimisticTodo, updateOptimisticTodo] = useOptimistic(
    { ...todo, deleting: false },
    (state: OptimisticTodo, update: Partial<OptimisticTodo>) => ({ ...state, ...update })
  )
  
  const [isPending, startTransition] = useTransition()
  const { showError, showSuccess } = useToast()

  const handleToggleComplete = () => {
    startTransition(async () => {
      const previousCompleted = optimisticTodo.completed
      updateOptimisticTodo({ completed: !optimisticTodo.completed })
      try {
        await toggleTodoComplete(optimisticTodo.id)
        showSuccess("Status updated successfully")
      } catch (error) {
        const appError = handleError(error)
        console.error('Failed to toggle todo completion:', appError)
        showError(createDataError('Failed to update task completion'))
        updateOptimisticTodo({ completed: previousCompleted })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      updateOptimisticTodo({ deleting: true })
      try {
        await deleteTodo(optimisticTodo.id)
        showSuccess('Task deleted successfully!')
      } catch (error) {
        const appError = handleError(error)
        console.error('Failed to delete todo:', appError)
        showError(createDataError('Failed to delete task'))
        updateOptimisticTodo({ deleting: false })
      }
    })
  }

  const cyclePriority = () => {
    if (optimisticTodo.completed) return
    
    const currentIndex = TODO_PRIORITIES.indexOf(optimisticTodo.priority)
    const nextIndex = (currentIndex + 1) % TODO_PRIORITIES.length
    const newPriority = TODO_PRIORITIES[nextIndex]
    
    startTransition(async () => {
      updateOptimisticTodo({ priority: newPriority })
      try {
        await updateTodo(optimisticTodo.id, { priority: newPriority })
        showSuccess("Priority updated successfully")
      } catch (error) {
        const appError = handleError(error)
        console.error('Failed to update todo priority:', appError)
        showError(createDataError('Failed to update task priority'))
        updateOptimisticTodo({ priority: todo.priority })
      }
    })
  }

  const updateName = (name: string) => {
    startTransition(async () => {
      updateOptimisticTodo({ name })
      try {
        await updateTodo(optimisticTodo.id, { name })
        showSuccess("Name updated successfully")
      } catch (error) {
        const appError = handleError(error)
        console.error('Failed to update todo name:', appError)
        showError(createDataError('Failed to update task name'))
        updateOptimisticTodo({ name: todo.name })
      }
    })
  }

  const updateCategory = (category: string) => {
    startTransition(async () => {
      updateOptimisticTodo({ category })
      try {
        await updateTodo(optimisticTodo.id, { category })
        showSuccess("Category updated successfully")
      } catch (error) {
        const appError = handleError(error)
        console.error('Failed to update todo category:', appError)
        showError(createDataError('Failed to update task category'))
        updateOptimisticTodo({ category: todo.category })
      }
    })
  }

  return {
    optimisticTodo,
    isPending,
    handleToggleComplete,
    handleDelete,
    cyclePriority,
    updateName,
    updateCategory
  }
}