'use client'

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "./ChatMessage"
import type { Message } from "@/baml_client/types"

interface ChatMessagesProps {
  messages: Message[]
  isLoading?: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
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
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="animate-pulse flex space-x-1">
              <div className="rounded-full bg-current w-2 h-2"></div>
              <div className="rounded-full bg-current w-2 h-2"></div>
              <div className="rounded-full bg-current w-2 h-2"></div>
            </div>
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
