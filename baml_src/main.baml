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
  name string
  completed bool
  priority "Low Priority" | "Medium Priority" | "High Priority"
  category string
  createdAt string
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

// Faster client for insights
client<llm> GPT4Fast {
  provider "openai"
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
    max_tokens 200
    temperature 0.3
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
    - {{ todo.name }} ({{ todo.priority }}, completed: {{ todo.completed }})
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
    Create a todo item from: {{ user_input }}
    
    {% if existing_todos %}
    Context: {% for todo in existing_todos %}{{ todo.name }} ({{ todo.category }}, {{ todo.priority }}){% if not loop.last %}, {% endif %}{% endfor %}
    {% endif %}

    {{ ctx.output_format() }}

    Rules:
    1. Required: id, name, completed (false), priority ("Low Priority"/"Medium Priority"/"High Priority"), category, createdAt
    2. Priority: "High Priority" for urgent/critical/explicit urgency, "Medium Priority" for important, "Low Priority" for non-urgent
    3. Category: Determine from context (work/personal/health/learning/shopping), default to "General" if unclear
    4. DueDate: Only if explicit time mentioned ("Friday"/"tomorrow"/"end of day"), otherwise null
    5. CreatedAt: Set to current timestamp in ISO format
    6. Use JSON null for optional dueDate if not specified
  "#
}

// Productivity Insights Function
function GenerateProductivityInsights(
  todos: TodoItem[],
  timeframe: string
) -> string {
  client GPT4Fast
  prompt #"
    {{ timeframe }} summary:
    {% for todo in todos %}
    {{ "✓" if todo.completed else "○" }} {{ todo.name }} ({{ todo.priority }})
    {% endfor %}

    Provide: completion rate, priority focus, one tip.
  "#
}

