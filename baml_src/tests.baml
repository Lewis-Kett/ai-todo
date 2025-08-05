// ===== HandleTodoRequest TESTS =====

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
  @@check( has_response, {{ this.responseToUser|length > 0 }} )
  @@assert({{ _.checks.is_add_todo and _.checks.has_name and _.checks.has_category and _.checks.valid_priority and _.checks.has_response }})
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

// Test HandleTodoRequest with chat message (should return ChatTool)
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
  @@check( is_chat, {{ this.action == "chat" }} )
  @@check( has_response, {{ this.responseToUser|length > 0 }} )
  @@assert({{ _.checks.is_chat and _.checks.has_response }})
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

// Test HandleTodoRequest with delete request
test TestHandleDeleteTodoRequest {
  functions [HandleTodoRequest]
  args {
    user_message "Delete the first task from my list"
    current_todos [
      {
        id "1"
        name "Complete project report"
        completed false
        priority "High Priority"
        category "Work"
      },
      {
        id "2"
        name "Buy groceries"
        completed false
        priority "Medium Priority"
        category "Personal"
      }
    ]
  }
  @@check( is_delete_todo, {{ this.action == "delete_todo" }} )
  @@check( has_id, {{ this.id|length > 0 }} )
  @@check( has_response, {{ this.responseToUser|length > 0 }} )
  @@assert({{ _.checks.is_delete_todo and _.checks.has_id and _.checks.has_response }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test HandleTodoRequest with toggle completion request
test TestHandleToggleTodoRequest {
  functions [HandleTodoRequest]
  args {
    user_message "Mark the project report as completed"
    current_todos [
      {
        id "1"
        name "Complete project report"
        completed false
        priority "High Priority"
        category "Work"
      },
      {
        id "2"
        name "Review code"
        completed true
        priority "Medium Priority"
        category "Work"
      }
    ]
  }
  @@check( is_toggle_todo, {{ this.action == "toggle_todo" }} )
  @@check( has_id, {{ this.id|length > 0 }} )
  @@check( has_response, {{ this.responseToUser|length > 0 }} )
  @@assert({{ _.checks.is_toggle_todo and _.checks.has_id and _.checks.has_response }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test HandleTodoRequest with update request
test TestHandleUpdateTodoRequest {
  functions [HandleTodoRequest]
  args {
    user_message "Change the priority of the grocery task to high priority"
    current_todos [
      {
        id "1"
        name "Complete project report"
        completed false
        priority "High Priority"
        category "Work"
      },
      {
        id "2"
        name "Buy groceries"
        completed false
        priority "Medium Priority"
        category "Personal"
      }
    ]
  }
  @@check( is_update_todo, {{ this.action == "update_todo" }} )
  @@check( has_id, {{ this.id|length > 0 }} )
  @@check( has_response, {{ this.responseToUser|length > 0 }} )
  @@assert({{ _.checks.is_update_todo and _.checks.has_id and _.checks.has_response }})
  @@assert({{ _.latency_ms < 5000 }})
}

// Test HandleTodoRequest with update name request
test TestHandleUpdateTodoName {
  functions [HandleTodoRequest]
  args {
    user_message "Rename the first task to 'Finalize quarterly report'"
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
  @@check( is_update_todo, {{ this.action == "update_todo" }} )
  @@check( has_id, {{ this.id|length > 0 }} )
  @@check( has_new_name, {{ this.name|length > 0 }} )
  @@check( has_response, {{ this.responseToUser|length > 0 }} )
  @@assert({{ _.checks.is_update_todo and _.checks.has_id and _.checks.has_new_name and _.checks.has_response }})
}