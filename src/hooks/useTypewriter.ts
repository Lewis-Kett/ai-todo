import { useState, useEffect } from 'react'

/**
 * A hook that animates text character by character
 * @param text - The full text to display
 * @param shouldStartAnimation - Whether to start/enable animation
 * @returns The currently displayed portion of the text
 */
export function useTypewriter(text: string, shouldStartAnimation: boolean = true): string {
  const [displayedText, setDisplayedText] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // If we shouldn't start animation and haven't started yet, show full text
    if (!shouldStartAnimation && !isAnimating) {
      setDisplayedText(text)
      return
    }

    // If this is a new animation starting, or if text completely changed, reset
    if (shouldStartAnimation && (!text.startsWith(displayedText) || displayedText === '')) {
      setDisplayedText('')
      setIsAnimating(true)
    }
    
    // Start from where we left off, or from the beginning if reset
    let currentIndex = displayedText.length
    
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        // Animation complete
        clearInterval(interval)
        setIsAnimating(false)
      }
    }, 30) // 30ms per character

    // Cleanup interval on unmount or text change
    return () => clearInterval(interval)
  }, [text, shouldStartAnimation, displayedText, isAnimating])

  return displayedText
}