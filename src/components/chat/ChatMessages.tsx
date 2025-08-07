'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './ChatMessage'
import type { Message } from '@/baml_client/types'

interface ChatMessagesProps {
  conversationHistory: Message[]
  streamingMessageId?: string
  isStreaming: boolean
  isLoading?: boolean
  error?: string
}

export function ChatMessages({ 
  conversationHistory, 
  streamingMessageId,
  isStreaming,
  isLoading = false,
  error
}: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversationHistory])

  if (conversationHistory.length === 0 && !isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Ask me anything about your todos or productivity!</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
      <div className="space-y-2 p-4">
        {/* Render all messages from conversation history */}
        {conversationHistory.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.id === streamingMessageId}
          />
        ))}
        
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20" role="alert">
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}