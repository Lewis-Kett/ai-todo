import { renderHook, act } from '@testing-library/react';
import { useInlineEdit } from '../useInlineEdit';

describe('useInlineEdit', () => {
  const mockOnSave = jest.fn();
  const initialValue = 'Initial value';

  beforeEach(() => {
    mockOnSave.mockClear();
  });


  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editedValue).toBe(initialValue);
    expect(result.current.inputRef.current).toBe(null);
  });

  it('should start editing when startEditing is called', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));

    act(() => {
      result.current.startEditing();
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.editedValue).toBe(initialValue);
  });

  it('should update edited value when setEditedValue is called', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));
    const newValue = 'New value';

    act(() => {
      result.current.startEditing();
      result.current.setEditedValue(newValue);
    });

    expect(result.current.editedValue).toBe(newValue);
  });

  it('should save value and exit editing mode when saveValue is called with different value', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));
    const newValue = 'Updated value';

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.setEditedValue(newValue);
    });

    act(() => {
      result.current.saveValue();
    });

    expect(result.current.isEditing).toBe(false);
    expect(mockOnSave).toHaveBeenCalledWith(newValue);
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  it('should not save if edited value is empty after trimming', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));

    act(() => {
      result.current.startEditing();
      result.current.setEditedValue('   ');
      result.current.saveValue();
    });

    expect(result.current.isEditing).toBe(false);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should not save if edited value is same as initial value', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));

    act(() => {
      result.current.startEditing();
      result.current.setEditedValue(initialValue);
      result.current.saveValue();
    });

    expect(result.current.isEditing).toBe(false);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should trim whitespace when saving different value', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));
    const valueWithWhitespace = '  Trimmed value  ';
    const expectedValue = 'Trimmed value';

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.setEditedValue(valueWithWhitespace);
    });

    act(() => {
      result.current.saveValue();
    });

    expect(mockOnSave).toHaveBeenCalledWith(expectedValue);
  });

  it('should cancel editing and reset value when cancelEditing is called', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));
    const newValue = 'Changed value';

    act(() => {
      result.current.startEditing();
      result.current.setEditedValue(newValue);
      result.current.cancelEditing();
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editedValue).toBe(initialValue);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should save value when Enter key is pressed with different value', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));
    const newValue = 'Enter key value';

    act(() => {
      result.current.startEditing();
    });

    act(() => {
      result.current.setEditedValue(newValue);
    });

    act(() => {
      result.current.handleKeyDown({ key: 'Enter' } as React.KeyboardEvent);
    });

    expect(result.current.isEditing).toBe(false);
    expect(mockOnSave).toHaveBeenCalledWith(newValue);
  });

  it('should cancel editing when Escape key is pressed', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));
    const newValue = 'Escape key value';

    act(() => {
      result.current.startEditing();
      result.current.setEditedValue(newValue);
      result.current.handleKeyDown({ key: 'Escape' } as React.KeyboardEvent);
    });

    expect(result.current.isEditing).toBe(false);
    expect(result.current.editedValue).toBe(initialValue);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should not react to other key presses', () => {
    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));

    act(() => {
      result.current.startEditing();
      result.current.handleKeyDown({ key: 'Tab' } as React.KeyboardEvent);
    });

    expect(result.current.isEditing).toBe(true);
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('should focus and select input when editing starts', () => {
    const mockInput = {
      focus: jest.fn(),
      select: jest.fn(),
    };

    const { result } = renderHook(() => useInlineEdit(initialValue, mockOnSave));

    // Mock the inputRef
    Object.defineProperty(result.current.inputRef, 'current', {
      value: mockInput,
      writable: true,
    });

    act(() => {
      result.current.startEditing();
    });

    // Trigger the useEffect by re-rendering
    act(() => {
      // The useEffect should have run and called focus and select
    });

    expect(mockInput.focus).toHaveBeenCalled();
    expect(mockInput.select).toHaveBeenCalled();
  });
});