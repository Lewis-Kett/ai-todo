'use client'

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { Todo, TodoFormData } from '@/types/todo'

// Todo state interface
interface TodosState {
  todos: Todo[]
}

// Action types for the reducer
type TodoAction =
  | { type: 'ADD_TODO'; payload: TodoFormData }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'UPDATE_TODO'; payload: { id: string; updates: Partial<Omit<Todo, 'id' | 'createdAt'>> } }
  | { type: 'TOGGLE_COMPLETE'; payload: string }
  | { type: 'SET_TODOS'; payload: Todo[] }

// Initial todos data
const INITIAL_TODOS: Todo[] = [
  {
    id: '1',
    name: 'Complete the project documentation',
    category: 'Work',
    priority: 'High Priority',
    completed: false,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Review pull requests',
    category: 'Development',
    priority: 'Medium Priority',
    completed: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Set up development environment',
    category: 'Setup',
    priority: 'High Priority',
    completed: true,
    createdAt: new Date(),
  },
]

// Initial state
const initialState: TodosState = {
  todos: INITIAL_TODOS
}

// Reducer function
function todosReducer(state: TodosState, action: TodoAction): TodosState {
  switch (action.type) {
    case 'ADD_TODO': {
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        category: action.payload.category,
        priority: action.payload.priority,
        completed: false,
        createdAt: new Date(),
      }
      return { ...state, todos: [...state.todos, newTodo] }
    }
    
    case 'DELETE_TODO':
      return { 
        ...state, 
        todos: state.todos.filter(todo => todo.id !== action.payload) 
      }
    
    case 'UPDATE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id 
            ? { ...todo, ...action.payload.updates } 
            : todo
        )
      }
    
    case 'TOGGLE_COMPLETE':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload 
            ? { ...todo, completed: !todo.completed } 
            : todo
        )
      }
    
    case 'SET_TODOS':
      return { ...state, todos: action.payload }
    
    default:
      return state
  }
}

// Context types
interface TodoContextType {
  todos: Todo[]
  completedCount: number
  pendingCount: number
  totalCount: number
}

interface TodoDispatchContextType {
  addTodo: (formData: TodoFormData) => void
  deleteTodo: (id: string) => void
  updateTodo: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void
  toggleComplete: (id: string) => void
  setTodos: (todos: Todo[]) => void
}

// Create contexts
const TodoContext = createContext<TodoContextType | null>(null)
const TodoDispatchContext = createContext<TodoDispatchContextType | null>(null)

// Provider component
export function TodoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(todosReducer, initialState)
  const { todos } = state

  // Action creators
  const addTodo = useCallback((formData: TodoFormData) => {
    dispatch({ type: 'ADD_TODO', payload: formData })
  }, [])

  const deleteTodo = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TODO', payload: id })
  }, [])

  const updateTodo = useCallback((id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    dispatch({ type: 'UPDATE_TODO', payload: { id, updates } })
  }, [])

  const toggleComplete = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_COMPLETE', payload: id })
  }, [])

  const setTodos = useCallback((todos: Todo[]) => {
    dispatch({ type: 'SET_TODOS', payload: todos })
  }, [])

  // Computed properties
  const completedCount = todos.filter(todo => todo.completed).length
  const pendingCount = todos.filter(todo => !todo.completed).length
  const totalCount = todos.length

  const contextValue: TodoContextType = {
    todos,
    completedCount,
    pendingCount,
    totalCount
  }

  const dispatchValue: TodoDispatchContextType = {
    addTodo,
    deleteTodo,
    updateTodo,
    toggleComplete,
    setTodos
  }

  return (
    <TodoContext.Provider value={contextValue}>
      <TodoDispatchContext.Provider value={dispatchValue}>
        {children}
      </TodoDispatchContext.Provider>
    </TodoContext.Provider>
  )
}

// Custom hooks for consuming the contexts
export function useTodoState() {
  const context = useContext(TodoContext)
  if (!context) {
    throw new Error('useTodoState must be used within a TodoProvider')
  }
  return context
}

export function useTodoDispatch() {
  const context = useContext(TodoDispatchContext)
  if (!context) {
    throw new Error('useTodoDispatch must be used within a TodoProvider')
  }
  return context
}

// Convenience hook that returns both state and dispatch
export function useTodos() {
  const state = useTodoState()
  const dispatch = useTodoDispatch()
  return { ...state, ...dispatch }
}