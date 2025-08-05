'use client'

import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { useChat } from '@/contexts/ChatContext'

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const { 
    messages, 
    isLoading, 
    streamingMessageId, 
    messageCount,
    handleSendMessage 
  } = useChat()

  return (
    <Card className={`flex flex-col h-[600px] ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <h2 className="leading-none font-semibold" id='chat-heading'>AI Assistant</h2>
        <div className="text-sm text-muted-foreground">
          {messageCount} messages
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
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
      </CardContent>
    </Card>
  )
}