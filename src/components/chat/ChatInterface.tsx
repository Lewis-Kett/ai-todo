"use client"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { useChatStream } from "./hooks/useChatStream"
import { Button } from "../ui/button"

export function ChatInterface() {
  const { messages, isLoading, error, sendMessage, clearError } =
    useChatStream()

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
          <ChatMessages messages={messages} isLoading={isLoading} />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-700">{error}</span>
              <Button onClick={clearError} variant="destructive">
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </CardContent>
    </Card>
  )
}
