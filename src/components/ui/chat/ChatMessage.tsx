import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { type ChatMessage as ChatMessageType } from '@/types/chat'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
}

export const ChatMessage = memo(function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {isUser ? 'U' : 'AI'}
        </AvatarFallback>
      </Avatar>
      
      <div
        className={cn(
          'flex flex-col gap-2 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {message.content}
          {isStreaming && (
            <span className="animate-pulse ml-1">▋</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          {message.role === 'assistant' && (
            <Badge variant="secondary" className="text-xs">
              AI
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
})