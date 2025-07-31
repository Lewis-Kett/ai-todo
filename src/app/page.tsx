import { TodoSectionServer } from "@/components/todo/TodoSectionServer"
import { ChatInterface } from "@/components/ui/chat/ChatInterface"

export default function Home() {
  return (
    <div className="container mx-auto max-w-6xl p-6">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">AI Todo</h1>
        <p className="text-muted-foreground text-center">Manage your tasks efficiently with AI assistance</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TodoSectionServer />
        <ChatInterface />
      </main>
    </div>
  )
}
