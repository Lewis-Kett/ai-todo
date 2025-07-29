# TASK-02: Define Core BAML Functions

## Overview
Create the fundamental BAML functions that will power the AI chat functionality in the todo application.

## Objectives
- Define message and conversation schemas
- Create basic chat response function with streaming
- Implement todo-specific AI functions
- Set up LLM client configuration

## Prerequisites
- TASK-01 completed (BAML setup and installation)
- Environment variables configured
- BAML client generated successfully

## Steps

### 1. Define Core Data Types
Create/update `baml_src/main.baml` with core schemas:

```baml
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
```

### 2. Configure LLM Client
Add client configuration to `baml_src/main.baml`:

```baml
client<llm> GPT4 {
  provider "openai"
  options {
    model "gpt-4o"
    api_key env.OPENAI_API_KEY
    max_tokens 1000
    temperature 0.7
  }
}
```

### 3. Basic Chat Function
Create streaming chat response function:

```baml
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
```

### 4. Todo Analysis Function
Create function to analyze and suggest todo actions:

```baml
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
```

### 5. Smart Todo Creation Function
Create function for intelligent todo creation:

```baml
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
```

### 6. Productivity Insights Function
Create function for todo analysis and insights:

```baml
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
```

### 7. Update Generator Configuration
Ensure `baml_src/main.baml` includes proper TypeScript generation:

```baml
generator typescript {
  output_type "typescript"
  output_dir "../baml_client"
  module_format "esm"
}
```

### 8. Generate and Test
```bash
npx baml-cli generate
```

### 9. Verify Generated Types
Check that `baml_client/` contains:
- Type definitions for all classes
- Function interfaces
- Proper TypeScript exports

## Success Criteria
- [ ] Core data types defined (Message, ChatResponse, TodoItem, TodoAction)
- [ ] LLM client configured with API key
- [ ] Basic chat function created with streaming support
- [ ] Todo-specific AI functions implemented
- [ ] TypeScript client generated successfully
- [ ] All generated types are properly typed
- [ ] No compilation errors in generated code

## Testing
Create a simple test in the BAML playground (VSCode extension):
1. Open any `.baml` file in VSCode
2. Use the BAML playground to test functions
3. Verify streaming responses work
4. Test with sample todo data

## Next Task
After completing the BAML functions, proceed to TASK-03-chat-backend.md to create the server actions and API integration.

## Troubleshooting
- If generation fails, check BAML syntax
- Ensure environment variables are accessible
- Verify LLM client configuration is correct
- Check for any TypeScript compilation errors