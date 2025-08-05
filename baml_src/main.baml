// Message types for chat functionality
class Message {
  id string
  role "user" | "assistant" | "system"
  content string
}

class ChatResponse {
  message string @stream.not_null
  confidence float?
  suggestions string[]?
}

// Todo-related types
class TodoItem {
  id string
  name string
  completed bool
  priority "Low Priority" | "Medium Priority" | "High Priority"
  category string
}

// Tool classes for CRUD operations
class AddTodoTool {
  action "add_todo"
  name string @description("The todo item name")
  category string @description("Category like Work, Personal, etc.")
  priority "High Priority" | "Medium Priority" | "Low Priority"
  reasoning string @description("Why this action was chosen")
}

class AnalyzeTool {
  action "analyze"
  reasoning string @description("Why this is just a chat message")
}

// Configure LLM Client
client<llm> GPT4 {
  provider "openai"
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
    max_tokens 1000
    temperature 0.7
  }
}

// Basic Chat Function
function ChatWithAssistant(
  message: string,
  conversation_history: Message[]?
) -> ChatResponse {
  client GPT4
  prompt #"
    You are a helpful AI assistant for a todo application. 
    Help users manage their tasks, provide productivity advice, and answer questions.

    {% if conversation_history %}
    Previous conversation:
    {% for msg in conversation_history %}
    {{ msg.role }}: {{ msg.content }}
    {% endfor %}
    {% endif %}

    {{ ctx.output_format() }}

    {{ _.role("user") }}
    {{ message }}
  "#
}

// Enhanced Todo Request Handler
function HandleTodoRequest(
  user_message: string,
  current_todos: TodoItem[]
) -> AddTodoTool | AnalyzeTool {
  client GPT4
  prompt #"
    Analyze the user's message and determine what they want to do.
    
    If they want to ADD/CREATE a new todo item, use AddTodoTool.
    If they just want to chat/analyze/get advice, use AnalyzeTool.

    Current todos:
    {% for todo in current_todos %}
    - {{ todo.name }} ({{ todo.category }}, {{ todo.priority }}, completed: {{ todo.completed }})
    {% endfor %}

    User message: {{ user_message }}

    {{ ctx.output_format() }}

    Guidelines:
    - For AddTodoTool: Extract name, determine appropriate category and priority
    - For AnalyzeTool: Provide helpful reasoning about why this is a chat message
    - Priority levels: "High Priority" for urgent/critical, "Medium Priority" for important, "Low Priority" for non-urgent
    - Common categories: Work, Personal, Health, Learning, Shopping, General
  "#
}

