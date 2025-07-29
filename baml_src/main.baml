// Message types for chat functionality
class Message {
  id string
  role "user" | "assistant" | "system"
  content string
  timestamp string
}

class ChatResponse {
  message string @stream.not_null
  confidence float?
  suggestions string[]?
}

// Todo-related types
class TodoItem {
  id string
  text string
  completed bool
  priority "low" | "medium" | "high"
  category string?
  dueDate string?
}

class TodoAction {
  action "create" | "update" | "delete" | "complete" | "analyze"
  todo TodoItem?
  reasoning string
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

// Todo Analysis Function
function AnalyzeTodoRequest(
  user_message: string,
  current_todos: TodoItem[]
) -> TodoAction {
  client GPT4
  prompt #"
    Analyze the user's message and determine what todo action they want to perform.
    Consider the context of their current todos.

    Current todos:
    {% for todo in current_todos %}
    - {{ todo.text }} ({{ todo.priority }} priority, completed: {{ todo.completed }})
    {% endfor %}

    User message: {{ user_message }}

    {{ ctx.output_format() }}

    Determine the appropriate action and provide reasoning.
  "#
}

// Smart Todo Creation Function
function CreateSmartTodo(
  user_input: string,
  existing_todos: TodoItem[]?
) -> TodoItem {
  client GPT4
  prompt #"
    Create a well-structured todo item based on the user's input.
    Consider priority, category, and potential due dates.

    {% if existing_todos %}
    Existing todos for context:
    {% for todo in existing_todos %}
    - {{ todo.text }} ({{ todo.category }}, {{ todo.priority }})
    {% endfor %}
    {% endif %}

    User wants to create: {{ user_input }}

    {{ ctx.output_format() }}

    Generate a complete todo item with appropriate defaults.
  "#
}

// Productivity Insights Function
function GenerateProductivityInsights(
  todos: TodoItem[],
  timeframe: string
) -> string {
  client GPT4
  prompt #"
    Analyze the user's todo list and provide productivity insights.

    Todo items:
    {% for todo in todos %}
    - {{ todo.text }} (Priority: {{ todo.priority }}, Completed: {{ todo.completed }})
      {% if todo.category %}Category: {{ todo.category }}{% endif %}
      {% if todo.dueDate %}Due: {{ todo.dueDate }}{% endif %}
    {% endfor %}

    Timeframe for analysis: {{ timeframe }}

    Provide insights about:
    - Task completion patterns
    - Priority distribution
    - Productivity suggestions
    - Potential improvements

    Keep the response concise and actionable.
  "#
}