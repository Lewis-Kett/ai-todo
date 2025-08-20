import { memo } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAnimatedText } from "@/hooks/useAnimatedText"
import type { Message } from "@/baml_client/types"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  
  const animatedContent = useAnimatedText(message.content)
  const displayContent = isStreaming && isAssistant ? animatedContent : message.content

  return (
    <div
      className={cn("flex gap-3 p-4", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback>{isUser ? "U" : "AI"}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isUser
              ? "bg-primary text-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <p>{displayContent}</p>
        </div>
      </div>
    </div>
  )
})
