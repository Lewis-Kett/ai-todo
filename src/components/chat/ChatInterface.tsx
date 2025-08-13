"use client"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { useHandleTodoRequest } from "@/baml_client/react/hooks"
import { useState } from "react"
import { Message } from "@/baml_client/types"
import { getTodos } from "@/actions/todo-actions"
import { createMessage } from "./utils/messageUtils"
import { handleChatToolResponse } from "@/actions/chat-tool-handler"

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])

  const { mutate, data, reset } = useHandleTodoRequest({
    stream: true,
    onFinalData: async (data) => {
      if (data) {
        // Clear streaming data first to prevent flash of duplicate messages
        reset()
        
        // Add final assistant message to history
        const assistantMessage = createMessage("assistant", data.responseToUser)
        setMessages((prev) => [...prev, assistantMessage])

        if (data.action && data.action !== "chat") {
          await handleChatToolResponse(data)
        }
      }
    },
  })

  const handleSendMessage = async (inputValue: string) => {
    try {
      const userMessage: Message = createMessage("user", inputValue)
      const todos = await getTodos()

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage])

      await mutate(userMessage.content, todos, messages)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <h2 className="leading-none font-semibold" id="chat-heading">
          AI Assistant
        </h2>
        <div className="text-sm text-muted-foreground">
          {messages.length + (data ? 1 : 0)} messages
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
            messages={[
              ...messages,
              // Show current streaming response if available
              ...(data
                ? [createMessage("assistant", data.responseToUser)]
                : []),
            ]}
          />
        </div>

        <ChatInput onSendMessage={handleSendMessage} />
      </CardContent>
    </Card>
  )
}
