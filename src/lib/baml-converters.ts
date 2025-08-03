import type { ChatMessage } from '@/types/chat'
import type { Todo } from '@/types/todo'
import type { Message, TodoItem } from '../../baml_client'

/**
 * Convert React ChatMessage to BAML Message format
 */
export function chatMessageToBamlMessage(message: ChatMessage): Message {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString()
  }
}

/**
 * Convert BAML Message to React ChatMessage format
 */
export function bamlMessageToChatMessage(message: Message): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: new Date(message.timestamp)
  }
}

/**
 * Convert array of React ChatMessages to BAML Messages
 */
export function chatMessagesToBamlMessages(messages: ChatMessage[]): Message[] {
  return messages.map(chatMessageToBamlMessage)
}

/**
 * Convert array of BAML Messages to React ChatMessages
 */
export function bamlMessagesToChatMessages(messages: Message[]): ChatMessage[] {
  return messages.map(bamlMessageToChatMessage)
}

/**
 * Convert React Todo to BAML TodoItem format
 */
export function todoToBamlTodoItem(todo: Todo): TodoItem {
  return {
    id: todo.id,
    name: todo.name,
    completed: todo.completed,
    priority: todo.priority,
    category: todo.category,
    createdAt: typeof todo.createdAt === 'string' 
      ? todo.createdAt 
      : todo.createdAt.toISOString(),
    dueDate: null // React Todo doesn't have dueDate yet
  }
}

/**
 * Convert BAML TodoItem to React Todo format
 */
export function bamlTodoItemToTodo(todoItem: TodoItem): Todo {
  return {
    id: todoItem.id,
    name: todoItem.name,
    completed: todoItem.completed,
    priority: todoItem.priority,
    category: todoItem.category,
    createdAt: todoItem.createdAt instanceof Date 
      ? todoItem.createdAt 
      : new Date(todoItem.createdAt)
  }
}

/**
 * Convert array of React Todos to BAML TodoItems
 */
export function todosToBamlTodoItems(todos: Todo[]): TodoItem[] {
  return todos.map(todoToBamlTodoItem)
}

/**
 * Convert array of BAML TodoItems to React Todos
 */
export function bamlTodoItemsToTodos(todoItems: TodoItem[]): Todo[] {
  return todoItems.map(bamlTodoItemToTodo)
}