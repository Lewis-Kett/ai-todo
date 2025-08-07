"use client"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { ChatMessages } from "./ChatMessages"
import { ChatInput } from "./ChatInput"
import { useChat } from "./hooks/useChat"

export function ChatInterface() {
  const {
    messages,
    streamingMessageId,
    messageCount,
    sendMessage,
    isLoading,
    error,
  } = useChat()

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <h2 className="leading-none font-semibold" id="chat-heading">
          AI Assistant
        </h2>
        <div className="text-sm text-muted-foreground">
          {messageCount} messages
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
            streamingMessageId={streamingMessageId}
            isLoading={isLoading}
            error={error}
          />
        </div>

        <ChatInput
          onSendMessage={sendMessage}
          disabled={isLoading}
          placeholder="Ask me about your todos or productivity..."
        />
      </CardContent>
    </Card>
  )
}
