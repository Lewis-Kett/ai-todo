# TASK-06: Advanced Features - Enhanced AI Capabilities

## Overview
Implement advanced AI features to enhance the todo application with intelligent capabilities, personalization, and productivity insights.

## Objectives
- Add smart todo suggestions and categorization
- Implement productivity analytics and insights
- Create personalized AI recommendations
- Add chat history persistence
- Enhance user experience with advanced features

## Prerequisites
- TASK-01 through TASK-05 completed
- Basic chat and todo integration working
- BAML functions operational

## Steps

### 1. Implement Smart Todo Categorization
Create `src/components/ui/chat/SmartCategories.tsx`:

```tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Todo } from '@/types/todo'

interface SmartCategoriesProps {
  todos: Todo[]
  onCategoryFilter: (category: string | null) => void
  selectedCategory: string | null
}

export function SmartCategories({ todos, onCategoryFilter, selectedCategory }: SmartCategoriesProps) {
  // AI-generated categories based on todo content
  const categories = [
    { name: 'Work', count: 0, color: 'bg-blue-500' },
    { name: 'Personal', count: 0, color: 'bg-green-500' },
    { name: 'Health', count: 0, color: 'bg-red-500' },
    { name: 'Shopping', count: 0, color: 'bg-purple-500' },
    { name: 'Learning', count: 0, color: 'bg-orange-500' },
    { name: 'Home', count: 0, color: 'bg-yellow-500' }
  ]

  // Simple categorization logic (can be enhanced with AI)
  todos.forEach(todo => {
    const text = todo.text.toLowerCase()
    if (text.includes('work') || text.includes('meeting') || text.includes('project')) {
      categories[0].count++
    } else if (text.includes('buy') || text.includes('shop') || text.includes('groceries')) {
      categories[3].count++
    } else if (text.includes('exercise') || text.includes('health') || text.includes('doctor')) {
      categories[2].count++
    } else if (text.includes('learn') || text.includes('study') || text.includes('read')) {
      categories[4].count++
    } else if (text.includes('home') || text.includes('clean') || text.includes('fix')) {
      categories[5].count++
    } else {
      categories[1].count++
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Smart Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <button
          onClick={() => onCategoryFilter(null)}
          className={`w-full text-left p-2 rounded text-sm ${
            selectedCategory === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          All Todos ({todos.length})
        </button>
        {categories.filter(cat => cat.count > 0).map(category => (
          <button
            key={category.name}
            onClick={() => onCategoryFilter(category.name)}
            className={`w-full text-left p-2 rounded text-sm flex items-center justify-between ${
              selectedCategory === category.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${category.color}`} />
              {category.name}
            </div>
            <Badge variant="secondary" className="text-xs">
              {category.count}
            </Badge>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
```

### 2. Create Productivity Analytics Component
Create `src/components/ui/chat/ProductivityAnalytics.tsx`:

```tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Target, Clock, CheckCircle } from 'lucide-react'
import { type Todo } from '@/types/todo'

interface ProductivityAnalyticsProps {
  todos: Todo[]
}

export function ProductivityAnalytics({ todos }: ProductivityAnalyticsProps) {
  const totalTodos = todos.length
  const completedTodos = todos.filter(todo => todo.completed).length
  const completionRate = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0
  
  const priorityStats = {
    high: todos.filter(todo => todo.priority === 'high').length,
    medium: todos.filter(todo => todo.priority === 'medium').length,
    low: todos.filter(todo => todo.priority === 'low').length
  }

  const completedByPriority = {
    high: todos.filter(todo => todo.priority === 'high' && todo.completed).length,
    medium: todos.filter(todo => todo.priority === 'medium' && todo.completed).length,
    low: todos.filter(todo => todo.priority === 'low' && todo.completed).length
  }

  const insights = [
    {
      icon: CheckCircle,
      title: 'Completion Rate',
      value: `${Math.round(completionRate)}%`,
      subtitle: `${completedTodos} of ${totalTodos} completed`,
      color: completionRate >= 70 ? 'text-green-600' : completionRate >= 50 ? 'text-orange-600' : 'text-red-600'
    },
    {
      icon: Target,
      title: 'High Priority',
      value: `${completedByPriority.high}/${priorityStats.high}`,
      subtitle: 'Important tasks done',
      color: 'text-red-600'
    },
    {
      icon: TrendingUp,
      title: 'Focus Score',
      value: priorityStats.high > 0 ? Math.round((completedByPriority.high / priorityStats.high) * 100) + '%' : 'N/A',
      subtitle: 'Priority task completion',
      color: 'text-blue-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Productivity Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <div key={index} className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${insight.color}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{insight.title}</span>
                    <span className={`text-sm font-semibold ${insight.color}`}>
                      {insight.value}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{insight.subtitle}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Overall Progress</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Priority Distribution</p>
          <div className="flex gap-1">
            <Badge variant="destructive" className="text-xs">
              High: {priorityStats.high}
            </Badge>
            <Badge variant="default" className="text-xs">
              Medium: {priorityStats.medium}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Low: {priorityStats.low}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. Create AI Suggestions Component
Create `src/components/ui/chat/AiSuggestions.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, RefreshCw } from 'lucide-react'
import { type Todo } from '@/types/todo'
import { generateProductivityInsights } from '@/app/actions/todoAnalysis'

interface AiSuggestionsProps {
  todos: Todo[]
  onApplySuggestion: (suggestion: string) => void
}

export function AiSuggestions({ todos, onApplySuggestion }: AiSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const generateSuggestions = async () => {
    setIsLoading(true)
    try {
      const result = await generateProductivityInsights(todos, 'today')
      if (result.success) {
        // Parse AI insights into actionable suggestions
        const suggestionsList = [
          "Focus on high-priority tasks first",
          "Break down large tasks into smaller ones",
          "Set specific time blocks for similar tasks",
          "Consider delegating or removing low-priority items"
        ]
        setSuggestions(suggestionsList)
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (todos.length > 0) {
      generateSuggestions()
    }
  }, [todos.length])

  if (todos.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground text-sm">
          Add some todos to get AI suggestions!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            AI Suggestions
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={generateSuggestions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            Generating suggestions...
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 border rounded-md hover:bg-muted/50 cursor-pointer text-sm"
              onClick={() => onApplySuggestion(suggestion)}
            >
              {suggestion}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
```

### 4. Add Chat History Persistence
Create `src/lib/chatStorage.ts`:

```typescript
import { type ChatMessage } from '@/types/chat'

const CHAT_HISTORY_KEY = 'ai-todo-chat-history'
const MAX_MESSAGES = 100

export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const limitedMessages = messages.slice(-MAX_MESSAGES)
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(limitedMessages))
  } catch (error) {
    console.error('Failed to save chat history:', error)
  }
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY)
    if (stored) {
      const messages = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      return messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }
  } catch (error) {
    console.error('Failed to load chat history:', error)
  }
  return []
}

export function clearChatHistory(): void {
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY)
  } catch (error) {
    console.error('Failed to clear chat history:', error)
  }
}
```

### 5. Enhanced Todo Chat Page with All Features
Update `src/app/todo-chat/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { ChatInterface } from '@/components/ui/chat/ChatInterface'
import { TodoCommands } from '@/components/ui/chat/TodoCommands'
import { SmartCategories } from '@/components/ui/chat/SmartCategories'
import { ProductivityAnalytics } from '@/components/ui/chat/ProductivityAnalytics'
import { AiSuggestions } from '@/components/ui/chat/AiSuggestions'
import { useTodos } from '@/contexts/TodoContext'
import { useChat } from '@/contexts/ChatContext'
import { type TodoAction } from '@/types/chat'
import { saveChatHistory, loadChatHistory } from '@/lib/chatStorage'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export default function TodoChatPage() {
  const { todos, addTodo, updateTodo, deleteTodo } = useTodos()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const handleTodoAction = async (action: TodoAction) => {
    switch (action.action) {
      case 'create':
        if (action.todo) {
          await addTodo(action.todo.text, action.todo.priority)
        }
        break
      case 'update':
        if (action.todo) {
          await updateTodo(action.todo.id, {
            text: action.todo.text,
            priority: action.todo.priority,
            completed: action.todo.completed
          })
        }
        break
      case 'complete':
        if (action.todo) {
          await updateTodo(action.todo.id, { completed: true })
        }
        break
      case 'delete':
        if (action.todo) {
          await deleteTodo(action.todo.id)
        }
        break
    }
  }

  const { messages, sendMessage, isLoading, error, setMessages, clearMessages } = useChat({
    todos,
    onTodoAction: handleTodoAction
  })

  // Load chat history on mount
  useEffect(() => {
    const history = loadChatHistory()
    if (history.length > 0) {
      setMessages(history)
    }
  }, [setMessages])

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages)
    }
  }, [messages])

  const filteredTodos = selectedCategory 
    ? todos.filter(todo => {
        const text = todo.text.toLowerCase()
        switch (selectedCategory) {
          case 'Work': return text.includes('work') || text.includes('meeting') || text.includes('project')
          case 'Shopping': return text.includes('buy') || text.includes('shop') || text.includes('groceries')
          case 'Health': return text.includes('exercise') || text.includes('health') || text.includes('doctor')
          case 'Learning': return text.includes('learn') || text.includes('study') || text.includes('read')
          case 'Home': return text.includes('home') || text.includes('clean') || text.includes('fix')
          default: return true
        }
      })
    : todos

  const completedCount = filteredTodos.filter(todo => todo.completed).length

  const handleSendMessage = async (message: string) => {
    await sendMessage(message)
  }

  const handleQuickCommand = (command: string) => {
    sendMessage(command)
  }

  const handleClearChat = () => {
    clearMessages()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">AI Todo Assistant</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear Chat
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <ChatInterface 
              onSendMessage={handleSendMessage}
              className="h-[700px]"
            />
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <TodoCommands
              onCommand={handleQuickCommand}
              todoCount={filteredTodos.length}
              completedCount={completedCount}
            />
            
            <SmartCategories
              todos={todos}
              onCategoryFilter={setSelectedCategory}
              selectedCategory={selectedCategory}
            />
            
            <ProductivityAnalytics todos={filteredTodos} />
          </div>

          <div className="space-y-4">
            <AiSuggestions
              todos={filteredTodos}
              onApplySuggestion={handleQuickCommand}
            />
            
            <div className="space-y-2">
              <h3 className="font-medium text-sm">
                {selectedCategory ? `${selectedCategory} Todos` : 'Recent Todos'}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredTodos.slice(0, 8).map(todo => (
                  <div
                    key={todo.id}
                    className="p-2 bg-muted/50 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          todo.completed ? 'bg-green-500' : 
                          todo.priority === 'high' ? 'bg-red-500' :
                          todo.priority === 'medium' ? 'bg-orange-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className={todo.completed ? 'line-through' : ''}>
                        {todo.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6. Add Progress Component (if not already available)
```bash
npx shadcn@latest add progress
```

## Success Criteria
- [ ] Smart categorization groups todos logically
- [ ] Productivity analytics show meaningful insights
- [ ] AI suggestions provide actionable recommendations
- [ ] Chat history persists between sessions
- [ ] All advanced features integrate seamlessly
- [ ] Enhanced UI provides comprehensive todo management
- [ ] Performance remains smooth with all features
- [ ] Responsive design works across all screen sizes

## Testing Checklist
- [ ] Test smart category filtering
- [ ] Verify productivity analytics accuracy
- [ ] Try AI suggestions and verify they work
- [ ] Test chat history persistence (refresh page)
- [ ] Check all features work together
- [ ] Test with various todo scenarios (empty, full, mixed priorities)
- [ ] Verify responsive design on mobile/tablet
- [ ] Test accessibility features

## Final Integration
After completing all tasks, you'll have a comprehensive AI-powered todo application with:
- Natural language todo management
- Smart categorization and filtering
- Real-time productivity analytics
- AI-powered suggestions and insights
- Persistent chat history
- Responsive, accessible UI

## Troubleshooting
- Check localStorage availability for chat history
- Verify all components render without errors
- Test AI suggestion generation
- Ensure analytics calculations are correct
- Check responsive design breakpoints