'use client'

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import type { Message } from "@/baml_client/types"

interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
  streamingMessageId: string | null
}

export function ChatMessages({ messages, isLoading, streamingMessageId }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "end" 
    })
  }, [messages, isLoading])

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-2 p-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            isStreaming={message.id === streamingMessageId}
            isLoading={isLoading}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
