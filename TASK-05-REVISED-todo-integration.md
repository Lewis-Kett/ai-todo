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

### Step 4: Update Main Page

#### 4.1 Update Home Page
**File**: `src/app/page.tsx`

Update the existing page to use the integrated chat with todo context:

```tsx
import { TodoSection } from "@/components/todo/TodoSection"
import { ChatInterface } from "@/components/ui/chat/ChatInterface"

export default function Home() {
  return (
    <div className="container mx-auto max-w-7xl p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">AI Todo</h1>
        <p className="text-muted-foreground text-center">Manage your tasks efficiently with AI assistance</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <TodoSection />
        </div>
        <div>
          <ChatInterface />
        </div>
      </main>
    </div>
  )
}
```

### Step 5: Testing Implementation

#### 5.1 Create Integration Tests
**File**: `src/app/actions/__tests__/todoAnalysis.test.ts` (new file)

```typescript
import { analyzeTodoRequest, createSmartTodo } from '../todoAnalysis'
import { type Todo } from '@/types/todo'

// Mock the BAML client
jest.mock('../../../../baml_client', () => ({
  b: {
    AnalyzeTodoRequest: jest.fn(),
    CreateSmartTodo: jest.fn()
  }
}))

describe('todoAnalysis server actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('analyzeTodoRequest', () => {
    it('should analyze todo requests correctly', async () => {
      const mockTodos: Todo[] = [{
        id: '1',
        name: 'Test todo',
        category: 'Work',
        priority: 'High Priority',
        completed: false,
        createdAt: new Date()
      }]

      const result = await analyzeTodoRequest('Complete the test todo', mockTodos)
      
      expect(result.success).toBeDefined()
    })
  })

  describe('createSmartTodo', () => {
    it('should create a smart todo from user input', async () => {
      const result = await createSmartTodo('Buy groceries for dinner')
      
      expect(result.success).toBeDefined()
    })
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
7. **Error Handling**: Invalid commands and edge cases

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