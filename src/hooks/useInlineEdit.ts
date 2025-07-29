import { useState, useRef, useEffect } from 'react';

export function useInlineEdit(initialValue: string, onSave: (value: string) => void) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setIsEditing(true);
    setEditedValue(initialValue);
  };

  const saveValue = () => {
    const trimmedValue = editedValue.trim();
    if (trimmedValue && trimmedValue !== initialValue) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setEditedValue(initialValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveValue();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  return {
    isEditing,
    editedValue,
    inputRef,
    setEditedValue,
    startEditing,
    saveValue,
    cancelEditing,
    handleKeyDown,
  };
}