'use client'

import { Card } from '@/components/ui/card'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { useChat } from '@/hooks/useChat'

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
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold" id='chat-heading'>AI Assistant</h2>
        <div className="text-sm text-muted-foreground">
          {messageCount} messages
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