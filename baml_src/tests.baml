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

// Test todo creation analysis
test TestAnalyzeCreateTodo {
  functions [AnalyzeTodoRequest]
  args {
    user_message "I need to add a task to call my dentist tomorrow"
    current_todos [
      {
        id "existing-1"
        text "Finish project report"
        completed false
        priority "high"
        category "work"
        dueDate "2024-01-05"
      }
    ]
  }
  @@assert({{ this.action == "create" }})
  @@assert({{ this.reasoning|length > 0 }})
}

// Test todo completion analysis
test TestAnalyzeCompleteTodo {
  functions [AnalyzeTodoRequest]
  args {
    user_message "I finished the project report"
    current_todos [
      {
        id "existing-1"
        text "Finish project report"
        completed false
        priority "high"
        category "work"
        dueDate "2024-01-05"
      },
      {
        id "existing-2"
        text "Buy groceries"
        completed false
        priority "medium"
        category "personal"
        dueDate null
      }
    ]
  }
  @@assert({{ this.action == "complete" }})
}

// Test smart todo creation with high priority
test TestCreateHighPriorityTodo {
  functions [CreateSmartTodo]
  args {
    user_input "URGENT: Submit tax documents by end of day"
    existing_todos []
  }
  @@check( priority_correct, {{ this.priority == "high" }} )
  @@check( text_exists, {{ this.text|length > 0 }} )
  @@check( id_exists, {{ this.id|length > 0 }} )
  @@check( completed_default, {{ this.completed == false }} )
  @@assert({{ _.checks.priority_correct and _.checks.text_exists and _.checks.id_exists }})
  @@assert({{ _.latency_ms < 3000 }})
}

// Test smart todo creation with context
test TestCreateTodoWithContext {
  functions [CreateSmartTodo]
  args {
    user_input "Schedule meeting with John about the marketing campaign"
    existing_todos [
      {
        id "1"
        text "Review marketing budget"
        completed false
        priority "medium"
        category "marketing"
        dueDate null
      },
      {
        id "2"
        text "Prepare campaign slides"
        completed true
        priority "medium"
        category "marketing"
        dueDate null
      }
    ]
  }
  @@check( category_valid, {{ this.category == "marketing" or this.category == "work" }} )
  @@check( text_exists, {{ this.text|length > 0 }} )
  @@check( priority_set, {{ this.priority in ["low", "medium", "high"] }} )
  @@assert({{ _.checks.category_valid and _.checks.text_exists and _.checks.priority_set }})
  @@assert({{ _.latency_ms < 3000 }})
}

// Test productivity insights with mixed todos
test TestProductivityInsights {
  functions [GenerateProductivityInsights]
  args {
    todos [
      {
        id "1"
        text "Complete quarterly review"
        completed true
        priority "high"
        category "work"
        dueDate "2024-01-15"
      },
      {
        id "2"
        text "Exercise for 30 minutes"
        completed true
        priority "medium"
        category "health"
        dueDate null
      },
      {
        id "3"
        text "Read programming book"
        completed false
        priority "low"
        category "learning"
        dueDate null
      },
      {
        id "4"
        text "Fix critical bug"
        completed true
        priority "high"
        category "work"
        dueDate "2024-01-10"
      },
      {
        id "5"
        text "Plan vacation"
        completed false
        priority "low"
        category "personal"
        dueDate null
      }
    ]
    timeframe "week"
  }
  @@check( min_length, {{ this|length > 50 }} )
  @@check( max_length, {{ this|length < 2000 }} )
  @@assert({{ _.checks.min_length and _.checks.max_length }})
  @@assert({{ _.latency_ms < 4000 }})
}

// Test empty todo list insights
test TestEmptyTodoInsights {
  functions [GenerateProductivityInsights]
  args {
    todos []
    timeframe "month"
  }
  @@assert({{ this|length > 0 }})
}

// Test todo update analysis
test TestAnalyzeUpdateTodo {
  functions [AnalyzeTodoRequest]
  args {
    user_message "Change the priority of the project report to low"
    current_todos [
      {
        id "existing-1"
        text "Finish project report"
        completed false
        priority "high"
        category "work"
        dueDate "2024-01-05"
      }
    ]
  }
  @@assert({{ this.action == "update" }})
  @@assert({{ this.reasoning|length > 0 }})
}

// Test todo deletion analysis
test TestAnalyzeDeleteTodo {
  functions [AnalyzeTodoRequest]
  args {
    user_message "Remove the groceries task from my list"
    current_todos [
      {
        id "existing-1"
        text "Buy groceries"
        completed false
        priority "medium"
        category "personal"
        dueDate null
      },
      {
        id "existing-2"
        text "Finish project report"
        completed false
        priority "high"
        category "work"
        dueDate "2024-01-05"
      }
    ]
  }
  @@assert({{ this.action == "delete" }})
  @@assert({{ this.reasoning|length > 0 }})
}

// Test todo analysis request
test TestAnalyzeAnalyzeTodo {
  functions [AnalyzeTodoRequest]
  args {
    user_message "What should I focus on today based on my current tasks?"
    current_todos [
      {
        id "1"
        text "Submit quarterly report"
        completed false
        priority "high"
        category "work"
        dueDate "2024-01-15"
      },
      {
        id "2"
        text "Exercise"
        completed false
        priority "low"
        category "health"
        dueDate null
      }
    ]
  }
  @@assert({{ this.action == "analyze" }})
  @@assert({{ this.reasoning|length > 0 }})
}

// Test error handling - empty message
test TestAnalyzeEmptyMessage {
  functions [AnalyzeTodoRequest]
  args {
    user_message ""
    current_todos [
      {
        id "1"
        text "Sample task"
        completed false
        priority "medium"
        category "work"
        dueDate null
      }
    ]
  }
  @@check( has_action, {{ this.action|length > 0 }} )
  @@check( has_reasoning, {{ this.reasoning|length > 0 }} )
  @@assert({{ _.checks.has_reasoning }})
}

// Test error handling - no current todos
test TestAnalyzeNoTodos {
  functions [AnalyzeTodoRequest]
  args {
    user_message "Mark my project as complete"
    current_todos []
  }
  @@assert({{ this.reasoning|length > 0 }})
}

// Test boundary conditions - very long text
test TestCreateTodoLongText {
  functions [CreateSmartTodo]
  args {
    user_input "This is an extremely long todo item description that contains multiple sentences and detailed information about what needs to be accomplished, including specific requirements, deadlines, and various other details that might be relevant to completing this task successfully"
    existing_todos []
  }
  @@check( text_length, {{ this.text|length > 0 and this.text|length < 500 }} )
  @@check( has_id, {{ this.id|length > 0 }} )
  @@assert({{ _.checks.text_length and _.checks.has_id }})
}

// Test edge case - special characters in input
test TestCreateTodoSpecialChars {
  functions [CreateSmartTodo]
  args {
    user_input "Review Q4 report & prepare summary (due: 12/31) - HIGH PRIORITY!"
    existing_todos []
  }
  @@assert({{ this.text|length > 0 }})
  @@assert({{ this.id|length > 0 }})
}

// Test different timeframe variations
test TestInsightsDaily {
  functions [GenerateProductivityInsights]
  args {
    todos [
      {
        id "1"
        text "Morning standup"
        completed true
        priority "medium"
        category "work"
        dueDate "2024-01-15"
      }
    ]
    timeframe "day"
  }
  @@assert({{ this|length > 0 }})
}

test TestInsightsQuarterly {
  functions [GenerateProductivityInsights]
  args {
    todos [
      {
        id "1"
        text "Quarterly planning"
        completed false
        priority "high"
        category "work"
        dueDate "2024-03-31"
      },
      {
        id "2"
        text "Team review"
        completed true
        priority "medium"
        category "work"
        dueDate "2024-03-15"
      }
    ]
    timeframe "quarter"
  }
  @@check( insights_length, {{ this|length > 0 }} )
  @@assert({{ _.checks.insights_length }})
  @@assert({{ _.latency_ms < 5000 }})
}

test TestInsightsYearly {
  functions [GenerateProductivityInsights]
  args {
    todos [
      {
        id "1"
        text "Annual goals review"
        completed true
        priority "high"
        category "personal"
        dueDate "2024-12-31"
      }
    ]
    timeframe "year"
  }
  @@assert({{ this|length > 0 }})
}

// Test optional field combinations
test TestTodoAllFieldsPresent {
  functions [CreateSmartTodo]
  args {
    user_input "Complete client presentation by Friday - very important"
    existing_todos []
  }
  @@check( all_required_fields, {{ this.id|length > 0 and this.text|length > 0 and this.priority in ["low", "medium", "high"] and this.completed == false }} )
  @@check( optional_fields_valid, {{ (this.category|length > 0 if this.category is defined else true) and (this.dueDate|length > 0 if this.dueDate is defined else true) }} )
  @@assert({{ _.checks.all_required_fields and _.checks.optional_fields_valid }})
}

// Test boundary condition - null category
test TestTodoNullCategory {
  functions [CreateSmartTodo]
  args {
    user_input "Generic task without specific category"
    existing_todos []
  }
  @@check( required_fields, {{ this.id|length > 0 and this.text|length > 0 }} )
  @@check( category_handling, {{ this.category is defined == false or this.category|length > 0 }} )
  @@assert({{ _.checks.required_fields }})
}

// Test boundary condition - null due date
test TestTodoNullDueDate {
  functions [CreateSmartTodo]
  args {
    user_input "Task without specific deadline"
    existing_todos []
  }
  @@check( required_fields, {{ this.id|length > 0 and this.text|length > 0 }} )
  @@check( due_date_handling, {{ this.dueDate is defined == false or this.dueDate|length > 0 }} )
  @@assert({{ _.checks.required_fields }})
}

// Test mixed priority todos with context
test TestMixedPriorityContext {
  functions [AnalyzeTodoRequest]
  args {
    user_message "What's most important right now?"
    current_todos [
      {
        id "1"
        text "Critical bug fix"
        completed false
        priority "high"
        category "work"
        dueDate "2024-01-16"
      },
      {
        id "2"
        text "Team lunch planning"
        completed false
        priority "low"
        category "social"
        dueDate null
      },
      {
        id "3"
        text "Code review"
        completed false
        priority "medium"
        category "work"
        dueDate "2024-01-17"
      }
    ]
  }
  @@check( action_valid, {{ this.action in ["create", "update", "delete", "complete", "analyze"] }} )
  @@check( reasoning_detailed, {{ this.reasoning|length > 20 }} )
  @@assert({{ _.checks.action_valid and _.checks.reasoning_detailed }})
  @@assert({{ _.latency_ms < 4000 }})
}