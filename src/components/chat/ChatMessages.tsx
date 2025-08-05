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
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingMessageId])

  if (messages.length === 0 && !isLoading) {
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