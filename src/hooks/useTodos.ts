import { useState, useCallback } from 'react';
import { Todo, TodoFormData } from '@/types/todo';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: '1',
      name: 'Complete the project documentation',
      category: 'Work',
      priority: 'High Priority',
      completed: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      name: 'Review pull requests',
      category: 'Development',
      priority: 'Medium Priority',
      completed: false,
      createdAt: new Date(),
    },
    {
      id: '3',
      name: 'Set up development environment',
      category: 'Setup',
      priority: 'High Priority',
      completed: true,
      createdAt: new Date(),
    },
  ]);

  const addTodo = useCallback((formData: TodoFormData) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      name: formData.name,
      category: formData.category,
      priority: formData.priority,
      completed: false,
      createdAt: new Date(),
    };
    setTodos(prev => [...prev, newTodo]);
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, ...updates } : todo
      )
    );
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const completedCount = todos.filter(todo => todo.completed).length;
  const pendingCount = todos.filter(todo => !todo.completed).length;

  return {
    todos,
    addTodo,
    deleteTodo,
    updateTodo,
    toggleComplete,
    completedCount,
    pendingCount,
    totalCount: todos.length,
  };
}