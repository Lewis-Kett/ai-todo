"use client"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { useState } from "react"
import { Message } from "@/baml_client/types"
import { createMessage } from "./utils/messageUtils"
import { processChatMessage } from "@/actions/chat-actions"

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  //TODO Wrap this guy in a custom hook
  const handleSendMessage = async (inputValue: string) => {
    try {
      setIsLoading(true)
      
      const userMessage: Message = createMessage("user", inputValue)
      // Add user message immediately
      setMessages((prev) => [...prev, userMessage])

      // Call server action directly
      const response = await processChatMessage(inputValue, messages)
      
      // Add assistant response
      if (response.success) {
        const assistantMessage = createMessage("assistant", response.message)
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Handle error case
        const errorMessage = createMessage("assistant", response.message || "Sorry, I encountered an error processing your request.")
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Error processing message:", error)
      // Add error message to chat
      const errorMessage = createMessage("assistant", "Sorry, I encountered an unexpected error. Please try again.")
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <h2 className="leading-none font-semibold" id="chat-heading">
          AI Assistant
        </h2>
        <div className="text-sm text-muted-foreground">
          {messages.length} messages
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div
          className="flex-1 min-h-0"
          role="log"
          aria-live="polite"
          aria-labelledby="chat-heading"
          aria-label="Chat conversation"
        >
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
          />
        </div>

        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </CardContent>
    </Card>
  )
}