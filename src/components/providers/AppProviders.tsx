'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { TodoProvider } from '@/contexts/TodoContext'
import { ChatProvider } from '@/contexts/ChatContext'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TodoProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </TodoProvider>
    </ThemeProvider>
  )
}