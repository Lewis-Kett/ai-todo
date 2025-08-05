// ===== TEST CASES =====

// Test basic chat functionality
test TestBasicChat {
  functions [ChatWithAssistant]
  args {
    message "Hello! Can you help me organize my tasks for today?"
    conversation_history null
  }
  @@check( has_message, {{ this.message|length > 0 }} )
  @@check( has_confidence, {{ this.confidence is defined }} )
  @@check( has_suggestions, {{ this.suggestions is defined }} )
  @@assert({{ _.checks.has_message }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test chat with conversation history
test TestChatWithHistory {
  functions [ChatWithAssistant]
  args {
    message "What did I just ask about?"
    conversation_history [
      {
        id "1"
        role "user"
        content "I need to prepare for a presentation next week"
        timestamp "2024-01-01T10:00:00Z"
      },
      {
        id "2"
        role "assistant"
        content "I can help you prepare for your presentation. Here are some tasks you might want to consider..."
        timestamp "2024-01-01T10:00:30Z"
      }
    ]
  }
  @@check( has_message, {{ this.message|length > 0 }} )
  @@assert({{ _.checks.has_message }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test chat with system message
test TestChatWithSystemMessage {
  functions [ChatWithAssistant]
  args {
    message "Help me prioritize my tasks"
    conversation_history [
      {
        id "1"
        role "system"
        content "You are a productivity assistant focused on helping users manage their time effectively"
        timestamp "2024-01-01T09:00:00Z"
      },
      {
        id "2"
        role "user"
        content "I have many tasks to complete today"
        timestamp "2024-01-01T09:01:00Z"
      }
    ]
  }
  @@assert({{ this.message|length > 0 }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test chat response with confidence and suggestions
test TestChatResponseFields {
  functions [ChatWithAssistant]
  args {
    message "Can you suggest some productivity tips?"
    conversation_history null
  }
  @@check( has_message, {{ this.message|length > 0 }} )
  @@check( confidence_valid, {{ this.confidence >= 0.0 and this.confidence <= 1.0 if this.confidence is defined else true }} )
  @@check( suggestions_array, {{ this.suggestions|length >= 0 if this.suggestions is defined else true }} )
  @@assert({{ _.checks.has_message }})
}

// ===== NEW HandleTodoRequest TESTS =====

// Test new HandleTodoRequest function with add todo request
test TestHandleAddTodoRequest {
  functions [HandleTodoRequest]
  args {
    user_message "I need to add a task to buy groceries for dinner tonight"
    current_todos [
      {
        id "1"
        name "Complete project report"
        completed false
        priority "High Priority"
        category "Work"
      }
    ]
  }
  @@check( is_add_todo, {{ this.action == "add_todo" }} )
  @@check( has_name, {{ this.name|length > 0 }} )
  @@check( has_category, {{ this.category|length > 0 }} )
  @@check( valid_priority, {{ this.priority in ["High Priority", "Medium Priority", "Low Priority"] }} )
  @@check( has_reasoning, {{ this.reasoning|length > 0 }} )
  @@assert({{ _.checks.is_add_todo and _.checks.has_name and _.checks.has_category and _.checks.valid_priority and _.checks.has_reasoning }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test HandleTodoRequest with urgent task
test TestHandleUrgentTodoRequest {
  functions [HandleTodoRequest]
  args {
    user_message "URGENT: Add submit tax documents by end of week"
    current_todos []
  }
  @@check( is_add_todo, {{ this.action == "add_todo" }} )
  @@check( high_priority, {{ this.priority == "High Priority" }} )
  @@check( has_name, {{ this.name|length > 0 }} )
  @@assert({{ _.checks.is_add_todo and _.checks.high_priority and _.checks.has_name }})
}

// Test HandleTodoRequest with chat message (should return AnalyzeTool)
test TestHandleChatMessage {
  functions [HandleTodoRequest]
  args {
    user_message "What should I focus on today? Can you give me some productivity tips?"
    current_todos [
      {
        id "1"
        name "Review code"
        completed false
        priority "Medium Priority"
        category "Work"
      }
    ]
  }
  @@check( is_analyze, {{ this.action == "analyze" }} )
  @@check( has_reasoning, {{ this.reasoning|length > 0 }} )
  @@assert({{ _.checks.is_analyze and _.checks.has_reasoning }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test HandleTodoRequest with work-related task
test TestHandleWorkTodoRequest {
  functions [HandleTodoRequest]
  args {
    user_message "Add review pull request #123 to my work tasks"
    current_todos [
      {
        id "1"
        name "Finish feature development"
        completed false
        priority "High Priority"
        category "Work"
      }
    ]
  }
  @@check( is_add_todo, {{ this.action == "add_todo" }} )
  @@check( work_category, {{ this.category == "Work" }} )
  @@check( has_name, {{ this.name|length > 0 }} )
  @@assert({{ _.checks.is_add_todo and _.checks.work_category }})
}