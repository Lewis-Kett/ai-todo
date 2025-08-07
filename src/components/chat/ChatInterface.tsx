'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { useChatHook, type ChatMessage } from './hooks/useChatHook'
import type { Message } from '../../../baml_client/types'
import { getTodos } from '@/actions/todo-actions'

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const {
    isLoading,
    isStreaming,
    mutate
  } = useChatHook({
    onStreamData: (partialData) => {
      // Update the streaming assistant message with partial response
      if (partialData?.responseToUser) {
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = partialData.responseToUser
          }
          return newMessages
        })
      }
    },
    onFinalData: (finalData) => {
      // Update the final assistant message
      if (finalData?.responseToUser) {
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = finalData.responseToUser
          }
          return newMessages
        })
      }
    },
    onError: (error) => {
      console.error('BAML error:', error)
      // Update the assistant message with error
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage?.role === 'assistant') {
          lastMessage.content = 'Sorry, I encountered an error. Please try again.'
        }
        return newMessages
      })
    }
  })


  // Get the streaming message ID
  const streamingMessageId = isStreaming && messages.length > 0 
    ? messages[messages.length - 1]?.id 
    : undefined

  const messageCount = messages.length

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
        <h2 className="leading-none font-semibold" id='chat-heading'>AI Assistant</h2>
        <div className="text-sm text-muted-foreground">
          {messageCount} messages
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages}
            streamingMessageId={streamingMessageId}
            isLoading={isLoading}
          />
        </div>
        
        <ChatInput 
          onSendMessage={(content) => {
            console.log('ChatInterface: onSendMessage called with:', content)
            const userMessageId = crypto.randomUUID()
            const assistantMessageId = crypto.randomUUID()

            // Add user message
            const userMessage: ChatMessage = {
              id: userMessageId,
              role: 'user',
              content
            }

            // Add empty assistant message for streaming
            const assistantMessage: ChatMessage = {
              id: assistantMessageId,
              role: 'assistant',
              content: ''
            }

            setMessages(prev => [...prev, userMessage, assistantMessage])

            // Get todos and send message asynchronously
            getTodos().then(async (currentTodos) => {
              const conversationHistory: Message[] = [
                ...messages.map(msg => ({
                  id: msg.id,
                  role: msg.role,
                  content: msg.content
                })),
                { id: userMessageId, role: 'user', content }
              ]
              
              // Call BAML function
              try {
                await mutate(content, currentTodos, conversationHistory)
              } catch (error) {
                console.error('Failed to send message:', error)
              }
            }).catch(error => {
              console.error('Failed to get todos:', error)
              // Update the assistant message with error
              setMessages(prev => {
                const newMessages = [...prev]
                const lastMessage = newMessages[newMessages.length - 1]
                if (lastMessage?.role === 'assistant') {
                  lastMessage.content = 'Sorry, I encountered an error loading your todos. Please try again.'
                }
                return newMessages
              })
            })
          }}
          disabled={isLoading}
          placeholder="Ask me about your todos or productivity..."
        />
      </CardContent>
    </Card>
  )
}