import { renderHook, act } from '@testing-library/react'
import { useTypewriter } from '../useTypewriter'

describe('useTypewriter', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should display text character by character', () => {
    const { result } = renderHook(() => useTypewriter('Hello'))

    // Initially empty
    expect(result.current).toBe('')

    // After 30ms, show first character
    act(() => {
      jest.advanceTimersByTime(30)
    })
    expect(result.current).toBe('H')

    // After 60ms total, show two characters
    act(() => {
      jest.advanceTimersByTime(30)
    })
    expect(result.current).toBe('He')

    // Continue for all characters
    act(() => {
      jest.advanceTimersByTime(30)
    })
    expect(result.current).toBe('Hel')

    act(() => {
      jest.advanceTimersByTime(30)
    })
    expect(result.current).toBe('Hell')

    act(() => {
      jest.advanceTimersByTime(30)
    })
    expect(result.current).toBe('Hello')
  })

  it('should complete animation and show full text', () => {
    const text = 'Test message'
    const { result } = renderHook(() => useTypewriter(text))

    // Fast-forward to complete the animation
    // 12 characters * 30ms = 360ms
    act(() => {
      jest.advanceTimersByTime(360)
    })

    expect(result.current).toBe(text)
  })

  it('should show full text immediately when enabled is false', () => {
    const text = 'Instant text'
    const { result } = renderHook(() => useTypewriter(text, false))

    // Should show full text immediately without animation
    expect(result.current).toBe(text)

    // Advancing timers should not change anything
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(result.current).toBe(text)
  })

  it('should reset animation when text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter(text),
      { initialProps: { text: 'First' } }
    )

    // Advance to show some characters
    act(() => {
      jest.advanceTimersByTime(90) // 3 characters
    })
    expect(result.current).toBe('Fir')

    // Change text
    rerender({ text: 'Second' })
    
    // Should reset to empty
    expect(result.current).toBe('')

    // Start new animation
    act(() => {
      jest.advanceTimersByTime(30)
    })
    expect(result.current).toBe('S')
  })

  it('should clean up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    const { unmount } = renderHook(() => useTypewriter('Hello'))

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('should handle empty string', () => {
    const { result } = renderHook(() => useTypewriter(''))

    expect(result.current).toBe('')

    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(result.current).toBe('')
  })

  it('should handle very long text', () => {
    const longText = 'a'.repeat(100)
    const { result } = renderHook(() => useTypewriter(longText))

    // Fast-forward to complete
    act(() => {
      jest.advanceTimersByTime(100 * 30) // 100 chars * 30ms
    })

    expect(result.current).toBe(longText)
    expect(result.current.length).toBe(100)
  })

  it('should continue animation when text grows (streaming scenario)', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter(text),
      { initialProps: { text: 'Hello' } }
    )

    // Let animation start for "Hello"
    act(() => {
      jest.advanceTimersByTime(90) // 3 characters: "Hel"
    })
    expect(result.current).toBe('Hel')

    // Simulate streaming - text grows to "Hello world"
    rerender({ text: 'Hello world' })
    
    // Should continue from "Hel", not restart from beginning
    act(() => {
      jest.advanceTimersByTime(60) // 2 more characters: "Hello"
    })
    expect(result.current).toBe('Hello')

    // Continue to animate the new part
    act(() => {
      jest.advanceTimersByTime(180) // 6 more characters: " world"
    })
    expect(result.current).toBe('Hello world')
  })

  it('should reset when text changes completely (non-streaming scenario)', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter(text),
      { initialProps: { text: 'Hello' } }
    )

    // Let animation progress
    act(() => {
      jest.advanceTimersByTime(90) // "Hel"
    })
    expect(result.current).toBe('Hel')

    // Change to completely different text
    rerender({ text: 'Goodbye' })
    
    // Should reset to empty and start over
    expect(result.current).toBe('')

    // Start new animation
    act(() => {
      jest.advanceTimersByTime(30)
    })
    expect(result.current).toBe('G')
  })

  it('should continue animation after shouldStartAnimation becomes false', () => {
    const { result, rerender } = renderHook(
      ({ text, shouldStart }) => useTypewriter(text, shouldStart),
      { initialProps: { text: 'Hello world', shouldStart: true } }
    )

    // Let animation start and progress
    act(() => {
      jest.advanceTimersByTime(90) // "Hel"
    })
    expect(result.current).toBe('Hel')

    // Simulate streaming stopping (shouldStart becomes false)
    rerender({ text: 'Hello world', shouldStart: false })
    
    // Animation should continue, not jump to full text
    act(() => {
      jest.advanceTimersByTime(60) // "Hello"
    })
    expect(result.current).toBe('Hello')

    // Should continue until complete
    act(() => {
      jest.advanceTimersByTime(180) // " world"
    })
    expect(result.current).toBe('Hello world')
  })
})