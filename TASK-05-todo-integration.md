# TASK-05: Todo Integration - Connect Chat to Todo System

## Overview
Integrate the chat functionality with the existing todo system, enabling AI-powered todo management through natural language.

## Objectives
- Connect chat interface to existing todo hooks
- Enable AI to create, update, and analyze todos via chat
- Implement natural language todo commands
- Add todo-specific chat responses and suggestions

## Prerequisites
- TASK-01 through TASK-04 completed
- Existing todo system (`useTodos.ts`) functional
- Chat interface and backend working
- BAML functions for todo analysis available

## Steps

### 1. Enhance Todo Types for AI Integration
Update `src/types/chat.ts` to include todo-specific types:

```typescript
import { type Todo } from '@/types/todo'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatResponse {
  message: string
  confidence?: number
  suggestions?: string[]
  todoActions?: TodoAction[]
}

export interface TodoAction {
  action: 'create' | 'update' | 'delete' | 'complete' | 'analyze'
  todo?: Todo
  reasoning: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ChatContext {
  todos: Todo[]
  recentActions: TodoAction[]
}
```

### 2. Create Enhanced Chat Hook with Todo Integration
Update `src/hooks/useChat.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { type ChatMessage, type TodoAction, type ChatContext } from '@/types/chat'
import { type Todo } from '@/types/todo'
import { sendChatMessage } from '@/app/actions/chat'
import { analyzeTodoRequest, createSmartTodo } from '@/app/actions/todoAnalysis'

interface UseChatProps {
  todos: Todo[]
  onTodoAction: (action: TodoAction) => Promise<void>
}

export function useChat({ todos, onTodoAction }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processMessage = useCallback(async (content: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // First, analyze if this is a todo-related request
      const todoAnalysis = await analyzeTodoRequest(content, todos)
      
      if (todoAnalysis.success && todoAnalysis.data.action !== 'analyze') {
        // Handle todo actions
        await onTodoAction(todoAnalysis.data)
        
        // Generate response about the action taken
        const actionResponse = generateActionResponse(todoAnalysis.data)
        return {
          message: actionResponse,
          todoActions: [todoAnalysis.data]
        }
      } else {
        // Regular chat with todo context
        const chatContext = { todos, recentActions: [] }
        const result = await sendChatMessage(content, messages, chatContext)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send message')
        }

        return result.data
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [todos, messages, onTodoAction])

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      const response = await processMessage(content)
      
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      return response
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
      throw err
    }
  }, [processMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMessages
  }
}

function generateActionResponse(action: TodoAction): string {
  switch (action.action) {
    case 'create':
      return `✅ Created todo: "${action.todo?.text}". ${action.reasoning}`
    case 'update':
      return `📝 Updated todo: "${action.todo?.text}". ${action.reasoning}`
    case 'complete':
      return `🎉 Completed todo: "${action.todo?.text}". ${action.reasoning}`
    case 'delete':
      return `🗑️ Deleted todo: "${action.todo?.text}". ${action.reasoning}`
    default:
      return `✨ ${action.reasoning}`
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
```

### 3. Update Chat Server Actions with Todo Context
Update `src/app/actions/chat.ts`:

```typescript
'use server'

import { b } from '../../../baml_client'
import { type Message } from '../../../baml_client/types'
import { type ChatContext } from '@/types/chat'

export async function sendChatMessage(
  message: string,
  conversationHistory: Message[] = [],
  context?: ChatContext
) {
  try {
    // Prepare context-aware message
    let contextualMessage = message
    
    if (context?.todos && context.todos.length > 0) {
      const todoContext = context.todos.map(todo => 
        `- ${todo.text} (${todo.completed ? 'completed' : 'pending'}, ${todo.priority} priority)`
      ).join('\n')
      
      contextualMessage = `Current todos:\n${todoContext}\n\nUser message: ${message}`
    }

    const response = await b.ChatWithAssistant(contextualMessage, conversationHistory)
    return {
      success: true,
      data: response
    }
  } catch (error) {
    console.error('Chat error:', error)
    return {
      success: false,
      error: 'Failed to get chat response'
    }
  }
}
```

### 4. Create Todo Chat Commands Component
Create `src/components/ui/chat/TodoCommands.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, CheckCircle, BarChart3, Lightbulb } from 'lucide-react'

interface TodoCommandsProps {
  onCommand: (command: string) => void
  todoCount: number
  completedCount: number
}

export function TodoCommands({ onCommand, todoCount, completedCount }: TodoCommandsProps) {
  const quickCommands = [
    {
      icon: Plus,
      label: 'Add Todo',
      command: 'Create a new todo for me',
      description: 'Add a new task to your list'
    },
    {
      icon: CheckCircle,
      label: 'Complete Tasks',
      command: 'Show me my pending tasks',
      description: 'View incomplete todos'
    },
    {
      icon: BarChart3,
      label: 'Productivity Report',
      command: 'Give me a productivity analysis',
      description: 'Analyze your progress'
    },
    {
      icon: Lightbulb,
      label: 'Suggestions',
      command: 'What should I focus on today?',
      description: 'Get AI recommendations'
    }
  ]

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <div className="flex gap-2">
          <Badge variant="secondary">{todoCount} total</Badge>
          <Badge variant="default">{completedCount} completed</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {quickCommands.map((cmd, index) => {
          const Icon = cmd.icon
          return (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start h-auto p-3"
              onClick={() => onCommand(cmd.command)}
            >
              <Icon className="h-4 w-4 mr-3 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium text-sm">{cmd.label}</div>
                <div className="text-xs text-muted-foreground">{cmd.description}</div>
              </div>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
```

### 5. Create Integrated Todo Chat Page
Create `src/app/todo-chat/page.tsx`:

```tsx
'use client'

import { ChatInterface } from '@/components/ui/chat/ChatInterface'
import { TodoCommands } from '@/components/ui/chat/TodoCommands'
import { useTodos } from '@/contexts/TodoContext'
import { useChat } from '@/contexts/ChatContext'
import { type TodoAction } from '@/types/chat'
import { type Todo } from '@/types/todo'

export default function TodoChatPage() {
  const { todos, addTodo, updateTodo, deleteTodo } = useTodos()
  
  const handleTodoAction = async (action: TodoAction) => {
    switch (action.action) {
      case 'create':
        if (action.todo) {
          await addTodo(action.todo.text, action.todo.priority)
        }
        break
      case 'update':
        if (action.todo) {
          await updateTodo(action.todo.id, {
            text: action.todo.text,
            priority: action.todo.priority,
            completed: action.todo.completed
          })
        }
        break
      case 'complete':
        if (action.todo) {
          await updateTodo(action.todo.id, { completed: true })
        }
        break
      case 'delete':
        if (action.todo) {
          await deleteTodo(action.todo.id)
        }
        break
    }
  }

  const { messages, sendMessage, isLoading, error } = useChat({
    todos,
    onTodoAction: handleTodoAction
  })

  const completedCount = todos.filter(todo => todo.completed).length

  const handleSendMessage = async (message: string) => {
    await sendMessage(message)
  }

  const handleQuickCommand = (command: string) => {
    sendMessage(command)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6">AI Todo Assistant</h1>
          <ChatInterface 
            onSendMessage={handleSendMessage}
            className="h-[700px]"
          />
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <TodoCommands
            onCommand={handleQuickCommand}
            todoCount={todos.length}
            completedCount={completedCount}
          />
          
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Recent Todos</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {todos.slice(0, 5).map(todo => (
                <div
                  key={todo.id}
                  className="p-2 bg-muted/50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        todo.completed ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span className={todo.completed ? 'line-through' : ''}>
                      {todo.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6. Update Navigation to Include Todo Chat
Update your main navigation to include the new todo chat page.

### 7. Add Natural Language Processing Examples
Create example conversations that demonstrate the integration:

```typescript
// Example conversations the AI can handle:
// "Add a task to buy groceries with high priority"
// "Mark my exercise task as complete"
// "What tasks should I focus on today?"
// "Give me a summary of my productivity this week"
// "Delete the task about calling the dentist"
// "Show me all my high priority tasks"
```

## Success Criteria
- [ ] Chat integrates seamlessly with existing todo system
- [ ] AI can create todos through natural language
- [ ] AI can update and complete existing todos
- [ ] Quick action buttons work correctly
- [ ] Todo context is provided to AI responses
- [ ] Recent todos display updates in real-time
- [ ] Natural language commands are processed correctly
- [ ] Error handling works for todo operations

## Testing Checklist
- [ ] Try creating todos via chat: "Add buy milk to my list"
- [ ] Test completing todos: "Mark exercise as done"
- [ ] Test updating todos: "Change my meeting task to high priority"
- [ ] Try productivity questions: "How am I doing with my tasks?"
- [ ] Test quick action buttons
- [ ] Verify todo list updates in real-time
- [ ] Check error handling for invalid commands
- [ ] Test with empty todo list vs populated list

## Next Task
After completing the todo integration, proceed to TASK-06-advanced-features.md to add enhanced AI capabilities and polish the user experience.

## Troubleshooting
- Ensure todo hooks are properly connected
- Verify BAML functions can access todo data
- Check that todo actions are being executed
- Test natural language processing with various phrasings
- Verify real-time updates work correctly