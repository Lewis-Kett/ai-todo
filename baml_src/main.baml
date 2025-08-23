// Message types for chat functionality
class Message {
  id string
  role "user" | "assistant" | "system"
  content string
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
  action "add_todo" @stream.not_null
  name string @stream.done @description("The todo item name")
  category string @stream.done @description("Category like Work, Personal, etc.")
  priority "High Priority" | "Medium Priority" | "Low Priority" @stream.done
}

class DeleteTodoTool {
  action "delete_todo" @stream.not_null
  id string @stream.done @description("The ID of the todo item to delete")
}

class ToggleTodoTool {
  action "toggle_todo" @stream.not_null
  id string @stream.done @description("The ID of the todo item to toggle completion status")
}

class UpdateTodoTool {
  action "update_todo" @stream.not_null
  id string @stream.done @description("The ID of the todo item to update")
  name string? @stream.done @description("New name for the todo item (optional)")
  category string? @stream.done @description("New category for the todo item (optional)")
  priority ("High Priority" | "Medium Priority" | "Low Priority")? @stream.done @description("New priority for the todo item (optional)")
}

class ChatTool {
  action "chat" @stream.not_null
}

class BatchTodoResponse {
  actions (AddTodoTool | DeleteTodoTool | ToggleTodoTool | UpdateTodoTool | ChatTool)[] @stream.done @description("Array of actions to perform")
  responseToUser string @stream.not_null @description("Your consolidated response to the user")
}

// Configure LLM Client
client<llm> GPT4 {
  provider "openai"
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
    max_tokens 1000
    temperature 0.7
    supports_streaming true
  }
}

// Enhanced Todo Request Handler
function HandleTodoRequest(
  user_message: string,
  current_todos: TodoItem[],
  conversation_history: Message[]?
) -> BatchTodoResponse {
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
    
    Analyze the user's message and determine what actions to perform. You can perform multiple todo actions in a single request.
    
    Available actions for the actions array:
    - AddTodoTool: For creating new todo items
    - DeleteTodoTool: For removing todo items (specify the ID)
    - ToggleTodoTool: For marking items complete/incomplete (specify the ID)
    - UpdateTodoTool: For modifying existing items (specify the ID and fields to update)
    - ChatTool: For general chat/advice (when no todo actions are needed)

    Current todos:
    {% for todo in current_todos %}
    - ID: {{ todo.id }} | {{ todo.name }} ({{ todo.category }}, {{ todo.priority }}, completed: {{ todo.completed }})
    {% endfor %}

    User message: {{ user_message }}

    {{ ctx.output_format() }}

    Guidelines:
    - Put all actions in the actions array, even for single requests
    - For batch requests, identify all actions and return them in logical order
    - For AddTodoTool: Extract name, determine appropriate category and priority
    - For DeleteTodoTool: Use the exact ID from the todo list above
    - For ToggleTodoTool: Use the exact ID from the todo list above  
    - For UpdateTodoTool: Use the exact ID from the todo list above and specify which fields to update
    - For ChatTool: Use when only providing general chat/advice
    - Priority levels: "High Priority" for urgent/critical, "Medium Priority" for important, "Low Priority" for non-urgent
    - Common categories: Work, Personal, Health, Learning, Shopping, General
    - Provide a single consolidated responseToUser that addresses the user's request
    
    Examples:
    - "Add milk to shopping list" -> actions: [AddTodoTool], responseToUser: "I've added milk to your shopping list."
    - "Mark task 1 complete and add bread" -> actions: [ToggleTodoTool, AddTodoTool], responseToUser: "I've marked task 1 as complete and added bread to your list."
    - "How are you doing?" -> actions: [ChatTool], responseToUser: "I'm doing well, thank you for asking!"
  "#
}

