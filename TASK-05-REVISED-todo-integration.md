# TASK-05-REVISED: Todo Integration - Connect Chat to Todo System

## Overview
Integrate the existing chat functionality with the todo system, enabling AI-powered todo management through natural language. This revised plan accounts for the current architecture where both ChatContext and TodoContext are fully implemented.

## Current State Analysis
- ✅ TodoContext: Complete with reducer pattern and proper state management
- ✅ ChatContext: Full implementation with message handling and server actions
- ✅ BAML Setup: Functions for todo analysis and chat responses are configured
- ✅ UI Components: Chat interface and todo sections exist side-by-side
- ❌ Integration Layer: Missing bridge between chat and todo operations
- ❌ Type Alignment: Mismatches between Todo types and BAML expectations

## Prerequisites
- Existing TodoContext (`src/contexts/TodoContext.tsx`) functional
- Existing ChatContext (`src/contexts/ChatContext.tsx`) working
- BAML functions configured in `baml_src/main.baml`
- Chat interface and todo components operational

## Implementation Steps

### Step 1: Fix Type Mismatches

#### 1.1 Update Chat Types for Todo Integration
**File**: `src/types/chat.ts`

Add todo-specific types to the existing chat types:

```typescript
// Add to existing file
import { type Todo } from '@/types/todo'

export interface TodoAction {
  action: 'create' | 'update' | 'delete' | 'complete' | 'analyze'
  todo?: Todo
  reasoning: string
}

export interface ChatContext {
  todos: Todo[]
  recentActions: TodoAction[]
}

// Update existing ChatResponse to include todo actions
export interface ChatResponse {
  message: string
  confidence?: number
  suggestions?: string[]
  todoActions?: TodoAction[]  // Add this line
}
```

#### 1.2 Align Todo and BAML Type Definitions
**Analysis**: Current mismatch:
- Todo type uses `name` field, BAML expects `text`
- Todo uses `"High Priority"` format, BAML uses `"high"`

**Option A** (Recommended): Update BAML to match existing Todo types
**File**: `baml_src/main.baml`

```baml
// Update TodoItem class to match existing Todo type
class TodoItem {
  id string
  name string                    // Changed from 'text' to 'name'
  completed bool
  priority "Low Priority" | "Medium Priority" | "High Priority"  // Match existing format
  category string?
  dueDate string?
  createdAt string?             // Add to match Todo type
}
```

**Option B**: Update Todo types to match BAML (if preferred)
**File**: `src/types/todo.ts`

```typescript
export interface Todo {
  id: string;
  text: string;  // Changed from 'name' to 'text'
  category: string;
  priority: 'high' | 'medium' | 'low';  // Simplified format
  completed: boolean;
  createdAt: Date;
}
```

### Step 2: Create Todo Analysis Server Actions

#### 2.1 Create Todo Analysis Actions
**File**: `src/app/actions/todoAnalysis.ts` (new file)

```typescript
'use server'

import { b } from '../../../baml_client'
import { type Todo } from '@/types/todo'
import { type TodoAction, type ApiResponse } from '@/types/chat'

export async function analyzeTodoRequest(
  userMessage: string,
  currentTodos: Todo[]
): Promise<ApiResponse<TodoAction>> {
  try {
    // Convert Todo objects to BAML-compatible format
    const bamlTodos = currentTodos.map(todo => ({
      id: todo.id,
      name: todo.name,  // or 'text' if using Option B
      completed: todo.completed,
      priority: todo.priority,
      category: todo.category,
      createdAt: todo.createdAt.toISOString()
    }))

    const result = await b.AnalyzeTodoRequest(userMessage, bamlTodos)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Todo analysis error:', error)
    return {
      success: false,
      error: 'Failed to analyze todo request'
    }
  }
}

export async function createSmartTodo(
  userInput: string,
  existingTodos: Todo[] = []
): Promise<ApiResponse<Todo>> {
  try {
    const bamlTodos = existingTodos.map(todo => ({
      id: todo.id,
      name: todo.name,
      completed: todo.completed,
      priority: todo.priority,
      category: todo.category
    }))

    const result = await b.CreateSmartTodo(userInput, bamlTodos)
    
    // Convert BAML result back to Todo type
    const newTodo: Todo = {
      id: result.id || crypto.randomUUID(),
      name: result.name,  // or 'text' if using Option B
      category: result.category || 'General',
      priority: result.priority || 'Medium Priority',  // Adjust based on chosen option
      completed: result.completed || false,
      createdAt: new Date()
    }

    return {
      success: true,
      data: newTodo
    }
  } catch (error) {
    console.error('Smart todo creation error:', error)
    return {
      success: false,
      error: 'Failed to create smart todo'
    }
  }
}
```

### Step 3: Update Chat Server Actions with Todo Context

#### 3.1 Enhance Chat Server Action
**File**: `src/app/actions/chat.ts`

Update the existing `sendChatMessage` function:

```typescript
'use server'

import { b } from '../../../baml_client'
import { type ChatMessage, type ApiResponse, type ChatResponse, type ChatContext } from '@/types/chat'

export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  context?: ChatContext  // Add this parameter
): Promise<ApiResponse<ChatResponse>> {
  try {
    // Prepare context-aware message
    let contextualMessage = message
    
    if (context?.todos && context.todos.length > 0) {
      const todoContext = context.todos.map(todo => 
        `- ${todo.name} (${todo.completed ? 'completed' : 'pending'}, ${todo.priority})`
      ).join('\n')
      
      contextualMessage = `Current todos:\n${todoContext}\n\nUser message: ${message}`
    }

    // Convert ChatMessage[] to BAML Message format
    const bamlHistory = conversationHistory.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }))

    const response = await b.ChatWithAssistant(contextualMessage, bamlHistory)
    
    return {
      success: true,
      data: {
        message: response.message,
        confidence: response.confidence,
        suggestions: response.suggestions
      }
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

### Step 4: Create Enhanced Chat Hook with Todo Integration

#### 4.1 Create Integrated Chat Hook
**File**: `src/hooks/useTodoChat.ts` (new file)

```typescript
'use client'

import { useCallback } from 'react'
import { useChatDispatch, useChatState } from '@/contexts/ChatContext'
import { useTodos } from '@/contexts/TodoContext'
import { analyzeTodoRequest, createSmartTodo } from '@/app/actions/todoAnalysis'
import { sendChatMessage } from '@/app/actions/chat'
import { type TodoAction, type ChatContext } from '@/types/chat'

export function useTodoChat() {
  const chatState = useChatState()
  const { sendMessage: baseSendMessage, handleSendMessage } = useChatDispatch()
  const { todos, addTodo, updateTodo, deleteTodo, toggleComplete } = useTodos()

  const executeTodoAction = useCallback(async (action: TodoAction) => {
    switch (action.action) {
      case 'create':
        if (action.todo) {
          addTodo({
            name: action.todo.name,
            category: action.todo.category,
            priority: action.todo.priority
          })
        }
        break
      case 'update':
        if (action.todo) {
          updateTodo(action.todo.id, {
            name: action.todo.name,
            category: action.todo.category,
            priority: action.todo.priority
          })
        }
        break
      case 'complete':
        if (action.todo) {
          toggleComplete(action.todo.id)
        }
        break
      case 'delete':
        if (action.todo) {
          deleteTodo(action.todo.id)
        }
        break
    }
  }, [addTodo, updateTodo, deleteTodo, toggleComplete])

  const sendMessageWithTodoContext = useCallback(async (content: string) => {
    try {
      // First, analyze if this is a todo-related request
      const todoAnalysis = await analyzeTodoRequest(content, todos)
      
      if (todoAnalysis.success && todoAnalysis.data && todoAnalysis.data.action !== 'analyze') {
        // Execute the todo action
        await executeTodoAction(todoAnalysis.data)
        
        // Generate response about the action taken
        const actionResponse = generateActionResponse(todoAnalysis.data)
        
        // Add the response to chat (using existing chat context)
        // This simulates a successful chat interaction
        return {
          message: actionResponse,
          todoActions: [todoAnalysis.data]
        }
      } else {
        // Regular chat with todo context
        const chatContext: ChatContext = { 
          todos, 
          recentActions: [] 
        }
        
        // Use existing chat system but with todo context
        const result = await sendChatMessage(content, chatState.messages, chatContext)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send message')
        }

        return result.data
      }
    } catch (error) {
      console.error('Todo chat error:', error)
      throw error
    }
  }, [todos, chatState.messages, executeTodoAction])

  const sendTodoMessage = useCallback(async (content: string) => {
    // Use the existing handleSendMessage but intercept with todo logic
    await handleSendMessage(content)
  }, [handleSendMessage])

  return {
    ...chatState,
    sendMessageWithTodoContext,
    sendTodoMessage,
    executeTodoAction
  }
}

function generateActionResponse(action: TodoAction): string {
  const todoName = action.todo?.name || 'item'
  
  switch (action.action) {
    case 'create':
      return `✅ Created todo: "${todoName}". ${action.reasoning}`
    case 'update':
      return `📝 Updated todo: "${todoName}". ${action.reasoning}`
    case 'complete':
      return `🎉 Completed todo: "${todoName}". ${action.reasoning}`
    case 'delete':
      return `🗑️ Deleted todo: "${todoName}". ${action.reasoning}`
    default:
      return `✨ ${action.reasoning}`
  }
}
```

### Step 5: Create Todo Commands Component

#### 5.1 Quick Actions Component
**File**: `src/components/ui/chat/TodoCommands.tsx` (new file)

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
      description: 'Add a task to your list'
    },
    {
      icon: CheckCircle,
      label: 'Show Pending',
      command: 'Show me my pending tasks',
      description: 'View incomplete todos'
    },
    {
      icon: BarChart3,
      label: 'Progress Report',
      command: 'Give me a productivity summary',
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

### Step 6: Update Main Page to Include Todo Integration

#### 6.1 Enhance Home Page
**File**: `src/app/page.tsx`

Update the existing page to include todo commands:

```tsx
import { TodoSection } from "@/components/todo/TodoSection"
import { ChatInterface } from "@/components/ui/chat/ChatInterface"
import { TodoChatSidebar } from "@/components/ui/chat/TodoChatSidebar"  // New component

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">AI Todo</h1>
        <p className="text-muted-foreground text-center">Manage your tasks efficiently with AI assistance</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-2">
          <TodoSection />
        </div>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ChatInterface />
            </div>
            <div className="lg:col-span-1">
              <TodoChatSidebar />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

#### 6.2 Create Todo Chat Sidebar
**File**: `src/components/ui/chat/TodoChatSidebar.tsx` (new file)

```tsx
'use client'

import { TodoCommands } from './TodoCommands'
import { useTodos } from '@/contexts/TodoContext'
import { useChat } from '@/contexts/ChatContext'

export function TodoChatSidebar() {
  const { todos, completedCount, totalCount } = useTodos()
  const { handleSendMessage } = useChat()

  const handleQuickCommand = (command: string) => {
    handleSendMessage(command)
  }

  const recentTodos = todos.slice(0, 5)

  return (
    <div className="space-y-4">
      <TodoCommands
        onCommand={handleQuickCommand}
        todoCount={totalCount}
        completedCount={completedCount}
      />
      
      <div className="space-y-2">
        <h3 className="font-medium text-sm">Recent Todos</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {recentTodos.map(todo => (
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
                  {todo.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Step 7: Testing Implementation

#### 7.1 Create Integration Tests
**File**: `src/hooks/__tests__/useTodoChat.test.ts` (new file)

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTodoChat } from '../useTodoChat'
import { TodoProvider } from '@/contexts/TodoContext'
import { ChatProvider } from '@/contexts/ChatContext'

// Mock the server actions
jest.mock('@/app/actions/todoAnalysis')
jest.mock('@/app/actions/chat')

const Providers = ({ children }: { children: React.ReactNode }) => (
  <TodoProvider>
    <ChatProvider>
      {children}
    </ChatProvider>
  </TodoProvider>
)

describe('useTodoChat', () => {
  it('should execute todo actions correctly', async () => {
    const { result } = renderHook(() => useTodoChat(), {
      wrapper: Providers
    })

    // Test todo action execution
    const mockAction = {
      action: 'create' as const,
      todo: {
        id: '1',
        name: 'Test todo',
        category: 'Test',
        priority: 'Medium Priority' as const,
        completed: false,
        createdAt: new Date()
      },
      reasoning: 'User requested new todo'
    }

    await act(async () => {
      await result.current.executeTodoAction(mockAction)
    })

    // Verify the todo was added (check with todo context)
    expect(result.current).toBeDefined()
  })
})
```

#### 7.2 Create TodoCommands Tests
**File**: `src/components/ui/chat/__tests__/TodoCommands.test.tsx` (new file)

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoCommands } from '../TodoCommands'

describe('TodoCommands', () => {
  const mockOnCommand = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders todo stats correctly', () => {
    render(
      <TodoCommands
        onCommand={mockOnCommand}
        todoCount={5}
        completedCount={2}
      />
    )

    expect(screen.getByText('5 total')).toBeInTheDocument()
    expect(screen.getByText('2 completed')).toBeInTheDocument()
  })

  it('calls onCommand when quick action is clicked', () => {
    render(
      <TodoCommands
        onCommand={mockOnCommand}
        todoCount={5}
        completedCount={2}
      />
    )

    const addTodoButton = screen.getByText('Add Todo')
    fireEvent.click(addTodoButton)

    expect(mockOnCommand).toHaveBeenCalledWith('Create a new todo for me')
  })
})
```

## Success Criteria

### Functional Requirements
- [ ] Chat can create todos via natural language ("Add buy milk to my list")
- [ ] Chat can update existing todos ("Change my meeting task to high priority")
- [ ] Chat can complete todos ("Mark exercise as done")
- [ ] Chat can delete todos ("Remove the dentist task")
- [ ] AI responses include current todo context
- [ ] Quick action buttons work correctly
- [ ] Real-time sync between todo list and chat
- [ ] Error handling for invalid commands

### Technical Requirements
- [ ] Type safety maintained across all integrations
- [ ] Existing tests continue to pass
- [ ] New functionality has comprehensive test coverage
- [ ] BAML functions integrate correctly with TypeScript types
- [ ] Server actions handle errors gracefully
- [ ] Context providers work together without conflicts

### User Experience Requirements
- [ ] Natural language processing feels intuitive
- [ ] Visual feedback for completed actions
- [ ] Current layout and design preserved
- [ ] Accessibility standards maintained
- [ ] Performance impact minimal

## Testing Checklist

### Manual Testing
1. **Todo Creation**: "Add a task to buy groceries with high priority"
2. **Todo Completion**: "Mark my exercise task as complete"
3. **Todo Updates**: "Change my meeting to medium priority"
4. **Todo Deletion**: "Delete the task about calling the dentist"
5. **Context Queries**: "What tasks should I focus on today?"
6. **Progress Analysis**: "How am I doing with my tasks?"
7. **Quick Actions**: Test all sidebar buttons
8. **Error Handling**: Invalid commands and edge cases

### Automated Testing
- [ ] Run existing test suite to ensure no regressions
- [ ] New integration tests pass
- [ ] Component tests for new UI elements
- [ ] Type checking passes
- [ ] Linting passes

## Troubleshooting Guide

### Common Issues
1. **Type Mismatches**: Ensure chosen option (A or B) is consistently applied
2. **BAML Integration**: Verify environment variables and client configuration
3. **Context Conflicts**: Check provider order in App layout
4. **Server Action Errors**: Check console for BAML function failures
5. **Real-time Updates**: Verify React state updates trigger re-renders

### Debug Steps
1. Check browser console for errors
2. Verify BAML client is properly initialized
3. Test server actions independently
4. Check context provider hierarchy
5. Validate todo state changes

## Next Steps
After successful implementation:
1. Proceed to TASK-06-advanced-features.md for enhanced AI capabilities
2. Consider adding todo categories management via chat
3. Implement productivity insights and analytics
4. Add todo scheduling and reminder features

## Notes
- This revised plan preserves the existing architecture while adding the missing integration layer
- Choose type alignment option (A or B) early and apply consistently
- Test thoroughly with real BAML API calls before considering complete
- Consider rate limiting for AI requests in production