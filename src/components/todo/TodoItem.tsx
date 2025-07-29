import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { Todo, TodoPriority } from "@/types/todo"
import { useInlineEdit } from "@/hooks/useInlineEdit"

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void;
}

export function TodoItem({ todo, onToggleComplete, onDelete, onUpdate }: TodoItemProps) {
  const priorities: TodoPriority[] = ['High Priority', 'Medium Priority', 'Low Priority'];
  
  const priorityVariant = todo.completed ? "outline" : "outline";
  const priorityText = todo.completed ? "Completed" : todo.priority;

  const nameEdit = useInlineEdit(todo.name, (name) => onUpdate(todo.id, { name }));
  const categoryEdit = useInlineEdit(todo.category, (category) => onUpdate(todo.id, { category }));

  const cyclePriority = () => {
    if (todo.completed) return;
    
    const currentIndex = priorities.indexOf(todo.priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    onUpdate(todo.id, { priority: priorities[nextIndex] });
  };

  return (
    <div 
      className={`flex items-center space-x-3 p-3 border rounded-lg ${todo.completed ? 'opacity-60' : ''}`} 
      role="group" 
      aria-labelledby={`task-${todo.id}-label`}
    >
      <Checkbox 
        id={`todo-${todo.id}`} 
        checked={todo.completed}
        onCheckedChange={() => onToggleComplete(todo.id)}
        aria-describedby={`task-${todo.id}-meta`} 
      />
      <div className="flex-1">
        {nameEdit.isEditing ? (
          <Input
            ref={nameEdit.inputRef}
            value={nameEdit.editedValue}
            onChange={(e) => nameEdit.setEditedValue(e.target.value)}
            onKeyDown={nameEdit.handleKeyDown}
            onBlur={nameEdit.saveValue}
            className="text-sm font-medium"
          />
        ) : (
          <label 
            htmlFor={`todo-${todo.id}`} 
            id={`task-${todo.id}-label`} 
            className={`text-sm font-medium cursor-pointer ${todo.completed ? 'line-through' : ''}`}
            onDoubleClick={nameEdit.startEditing}
          >
            {todo.name}
          </label>
        )}
        <div id={`task-${todo.id}-meta`} className="flex gap-2 mt-1" aria-label="Task metadata">
          <Badge 
            variant={priorityVariant} 
            className={`text-xs ${!todo.completed ? 'cursor-pointer' : ''}`}
            onClick={cyclePriority}
          >
            {priorityText}
          </Badge>
          {categoryEdit.isEditing ? (
            <Input
              ref={categoryEdit.inputRef}
              value={categoryEdit.editedValue}
              onChange={(e) => categoryEdit.setEditedValue(e.target.value)}
              onKeyDown={categoryEdit.handleKeyDown}
              onBlur={categoryEdit.saveValue}
              className="text-xs h-6 px-2"
            />
          ) : (
            <Badge 
              variant="secondary" 
              className="text-xs cursor-pointer"
              onDoubleClick={categoryEdit.startEditing}
            >
              {todo.category}
            </Badge>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete task: ${todo.name}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}