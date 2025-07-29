# TASK-04: Chat UI - Basic Chat Interface Components

## Overview
Create the user interface components for the chat functionality using shadcn/ui components and React patterns.

## Objectives
- Build responsive chat interface with shadcn/ui components
- Implement message display with streaming updates
- Create input field with send functionality
- Add loading states and error handling
- Ensure accessibility compliance

## Prerequisites
- TASK-01, TASK-02, TASK-03 completed
- shadcn/ui components available
- Server actions and API routes functional

## Steps

### 1. Install Required shadcn/ui Components
```bash
npx shadcn@latest add button input card scroll-area avatar badge
```

### 2. Create Chat Message Component
Create `src/components/ui/chat/ChatMessage.tsx`:

```tsx
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { type ChatMessage } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessage
  isStreaming?: boolean
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {isUser ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {message.content}
          {isStreaming && (
            <span className="animate-pulse ml-1">▋</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {message.role === 'assistant' && (
            <Badge variant="secondary" className="text-xs">
              AI
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3. Create Chat Input Component
Create `src/components/ui/chat/ChatInput.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1"
        aria-label="Chat message input"
      />
      <Button 
        type="submit" 
        disabled={disabled || !message.trim()}
        size="icon"
        aria-label="Send message"
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
```

### 4. Create Chat Messages Container
Create `src/components/ui/chat/ChatMessages.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './ChatMessage'
import { type ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessagesProps {
  messages: ChatMessageType[]
  streamingMessageId?: string
  isLoading?: boolean
}

export function ChatMessages({ 
  messages, 
  streamingMessageId,
  isLoading = false 
}: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingMessageId])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Ask me anything about your todos or productivity!</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="space-y-2">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              AI is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
```

### 5. Create Main Chat Interface
Create `src/components/ui/chat/ChatInterface.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { type ChatMessage } from '@/types/chat'
import { generateId } from '@/lib/utils'

interface ChatInterfaceProps {
  onSendMessage: (message: string, history: ChatMessage[]) => Promise<void>
  className?: string
}

export function ChatInterface({ onSendMessage, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string>()

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const assistantMessageId = generateId()
      setStreamingMessageId(assistantMessageId)

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      await onSendMessage(content, [...messages, userMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingMessageId(undefined)
    }
  }

  const updateStreamingMessage = (messageId: string, content: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: content }
          : msg
      )
    )
  }

  return (
    <Card className={`flex flex-col h-[600px] ${className || ''}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <div className="text-sm text-muted-foreground">
          {messages.length} messages
        </div>
      </div>
      
      <ChatMessages 
        messages={messages}
        streamingMessageId={streamingMessageId}
        isLoading={isLoading}
      />
      
      <ChatInput 
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder="Ask me about your todos or productivity..."
      />
    </Card>
  )
}
```

### 6. Add Utility Functions
Update `src/lib/utils.ts` to include ID generation:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
```

### 7. Create Chat Hook for State Management
Create `src/hooks/useChat.ts`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { type ChatMessage } from '@/types/chat'
import { sendChatMessage } from '@/app/actions/chat'

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (
    content: string,
    conversationHistory: ChatMessage[] = []
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendChatMessage(content, conversationHistory)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

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
```

### 8. Create Demo Chat Page
Create `src/app/chat/page.tsx`:

```tsx
import { ChatInterface } from '@/components/ui/chat/ChatInterface'
import { sendChatMessage } from '@/app/actions/chat'
import { type ChatMessage } from '@/types/chat'

export default function ChatPage() {
  const handleSendMessage = async (message: string, history: ChatMessage[]) => {
    const result = await sendChatMessage(message, history)
    if (!result.success) {
      throw new Error(result.error || 'Failed to send message')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">AI Chat Assistant</h1>
        <ChatInterface onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
```

## Success Criteria
- [ ] All shadcn/ui components installed and working
- [ ] Chat message component displays messages correctly
- [ ] Chat input handles user input and submission
- [ ] Messages container shows conversation history
- [ ] Main chat interface integrates all components
- [ ] Auto-scrolling works for new messages
- [ ] Loading states and error handling implemented
- [ ] Accessibility features included (ARIA labels, keyboard nav)
- [ ] Responsive design works on mobile and desktop

## Testing Checklist
- [ ] Send messages and see them appear in chat
- [ ] Try sending empty messages (should be disabled)
- [ ] Test keyboard shortcuts (Enter to send)
- [ ] Verify auto-scroll behavior
- [ ] Check loading states during message sending
- [ ] Test error handling with invalid inputs
- [ ] Verify accessibility with screen readers
- [ ] Test responsive design on different screen sizes

## Next Task
After completing the chat UI, proceed to TASK-05-todo-integration.md to connect the chat system with the existing todo functionality.

## Troubleshooting
- Check that all shadcn/ui components are properly installed
- Verify import paths are correct for the project structure
- Ensure TypeScript types are properly defined
- Test components in isolation before integrating
- Check browser console for any React warnings or errors