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
    Create a todo item from: {{ user_input }}
    
    {% if existing_todos %}
    Context: {% for todo in existing_todos %}{{ todo.text }} ({{ todo.category }}, {{ todo.priority }}){% if not loop.last %}, {% endif %}{% endfor %}
    {% endif %}

    {{ ctx.output_format() }}

    Rules:
    1. Required: id, text, completed (false), priority ("high"/"medium"/"low")
    2. Priority: "high" for urgent/critical/explicit urgency, "medium" for important, "low" for non-urgent
    3. Category: Only if clearly determinable (work/personal/health/learning/shopping), otherwise null
    4. DueDate: Only if explicit time mentioned ("Friday"/"tomorrow"/"end of day"), otherwise null
    5. Use JSON null (not "", "none", "N/A") for empty optional fields

    Generic/vague tasks → category: null, no deadline → dueDate: null
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
    {{ "✓" if todo.completed else "○" }} {{ todo.text }} ({{ todo.priority }})
    {% endfor %}

    Provide: completion rate, priority focus, one tip.
  "#
}

