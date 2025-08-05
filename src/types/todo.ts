export interface Todo {
  id: string;
  name: string;
  category: string;
  priority: 'High Priority' | 'Medium Priority' | 'Low Priority';
  completed: boolean;
}

export type TodoPriority = Todo['priority'];

export interface TodoFormData {
  name: string;
  category: string;
  priority: TodoPriority;
}