# TASK-03: Chat Backend - Server Actions and API Setup

## Overview
Implement the backend infrastructure for the chat functionality using Next.js server actions and BAML integration.

## Objectives
- Create Next.js server actions for chat functionality
- Implement streaming responses for real-time chat
- Set up error handling and validation
- Create API routes for chat operations

## Prerequisites
- TASK-01 completed (BAML setup)
- TASK-02 completed (BAML functions defined)
- Generated BAML client available

## Steps

### 1. Create Chat Server Actions
Create `src/app/actions/chat.ts`:

```typescript
'use server'

import { b } from '../../../baml_client'
import { type Message } from '../../../baml_client/types'

export async function sendChatMessage(
  message: string,
  conversationHistory: Message[] = []
) {
  try {
    const response = await b.ChatWithAssistant(message, conversationHistory)
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

export async function streamChatMessage(
  message: string,
  conversationHistory: Message[] = []
) {
  try {
    const stream = b.ChatWithAssistant.stream(message, conversationHistory)
    return {
      success: true,
      stream
    }
  } catch (error) {
    console.error('Chat streaming error:', error)
    return {
      success: false,
      error: 'Failed to stream chat response'
    }
  }
}
```

### 2. Create Todo Analysis Server Actions
Create `src/app/actions/todoAnalysis.ts`:

```typescript
'use server'

import { b } from '../../../baml_client'
import { type TodoItem } from '../../../baml_client/types'

export async function analyzeTodoRequest(
  userMessage: string,
  currentTodos: TodoItem[]
) {
  try {
    const analysis = await b.AnalyzeTodoRequest(userMessage, currentTodos)
    return {
      success: true,
      data: analysis
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
  existingTodos: TodoItem[] = []
) {
  try {
    const todoItem = await b.CreateSmartTodo(userInput, existingTodos)
    return {
      success: true,
      data: todoItem
    }
  } catch (error) {
    console.error('Smart todo creation error:', error)
    return {
      success: false,
      error: 'Failed to create smart todo'
    }
  }
}

export async function generateProductivityInsights(
  todos: TodoItem[],
  timeframe: string = 'week'
) {
  try {
    const insights = await b.GenerateProductivityInsights(todos, timeframe)
    return {
      success: true,
      data: insights
    }
  } catch (error) {
    console.error('Productivity insights error:', error)
    return {
      success: false,
      error: 'Failed to generate insights'
    }
  }
}
```

### 3. Create Chat API Route
Create `src/app/api/chat/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { b } from '../../../../baml_client'
import { type Message } from '../../../../baml_client/types'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const response = await b.ChatWithAssistant(
      message,
      conversationHistory || []
    )

    return NextResponse.json({
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
```

### 4. Create Streaming Chat API Route
Create `src/app/api/chat/stream/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { b } from '../../../../../baml_client'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json()

    if (!message || typeof message !== 'string') {
      return new Response('Message is required', { status: 400 })
    }

    const stream = b.ChatWithAssistant.stream(
      message,
      conversationHistory || []
    )

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(data))
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat streaming API error:', error)
    return new Response('Failed to stream chat response', { status: 500 })
  }
}
```

### 5. Create Todo Actions API Route
Create `src/app/api/todos/analyze/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { analyzeTodoRequest, createSmartTodo } from '../../../actions/todoAnalysis'

export async function POST(request: NextRequest) {
  try {
    const { action, userMessage, currentTodos, userInput, existingTodos } = await request.json()

    switch (action) {
      case 'analyze':
        if (!userMessage || !Array.isArray(currentTodos)) {
          return NextResponse.json(
            { error: 'userMessage and currentTodos are required' },
            { status: 400 }
          )
        }
        return NextResponse.json(await analyzeTodoRequest(userMessage, currentTodos))

      case 'create':
        if (!userInput) {
          return NextResponse.json(
            { error: 'userInput is required' },
            { status: 400 }
          )
        }
        return NextResponse.json(await createSmartTodo(userInput, existingTodos || []))

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Todo analysis API error:', error)
    return NextResponse.json(
      { error: 'Failed to process todo request' },
      { status: 500 }
    )
  }
}
```

### 6. Create Type Definitions
Create `src/types/chat.ts`:

```typescript
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
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### 7. Add Error Handling Utilities
Create `src/lib/errors.ts`:

```typescript
export class ChatError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ChatError'
  }
}

export class TodoAnalysisError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'TodoAnalysisError'
  }
}

export function handleApiError(error: unknown): { error: string } {
  if (error instanceof Error) {
    return { error: error.message }
  }
  return { error: 'An unexpected error occurred' }
}
```

### 8. Test Server Actions
Create a simple test to verify server actions work:

```typescript
// Test in Next.js dev tools or create a test page
import { sendChatMessage } from '@/app/actions/chat'

// Test basic chat
const result = await sendChatMessage('Hello, can you help me with my todos?')
console.log(result)
```

## Success Criteria
- [ ] Chat server actions created and functional
- [ ] Streaming chat implementation working
- [ ] Todo analysis server actions implemented
- [ ] API routes created for all chat operations
- [ ] Error handling implemented throughout
- [ ] Type definitions created for consistency
- [ ] No TypeScript compilation errors
- [ ] Server actions can be called successfully

## Testing Checklist
- [ ] Basic chat message responds correctly
- [ ] Streaming chat works with real-time updates
- [ ] Todo analysis provides meaningful results
- [ ] Smart todo creation generates appropriate todos
- [ ] Error handling works for invalid inputs
- [ ] API routes return proper HTTP status codes

## Next Task
After completing the backend infrastructure, proceed to TASK-04-chat-ui.md to create the user interface components.

## Troubleshooting
- Check BAML client imports are correct
- Verify environment variables are accessible in server actions
- Ensure Next.js app directory structure is followed
- Test API routes with a tool like Postman or curl
- Check server console for detailed error messages