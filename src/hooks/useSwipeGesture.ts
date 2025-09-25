import { useRef, useCallback } from 'react'

export interface SwipeGestureOptions {
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export function useSwipeGesture({
  threshold = 150,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown
}: SwipeGestureOptions = {}) {
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return

    const touch = e.changedTouches[0]
    const distanceX = touch.clientX - touchStartX.current
    const distanceY = touch.clientY - touchStartY.current

    const absDistanceX = Math.abs(distanceX)
    const absDistanceY = Math.abs(distanceY)

    // Determine if it's a horizontal or vertical swipe
    if (absDistanceX >= threshold && absDistanceY <= 100) {
      if (distanceX > 0) {
        onSwipeRight?.()
      } else {
        onSwipeLeft?.()
      }
    } else if (absDistanceY >= threshold && absDistanceX <= 100) {
      if (distanceY > 0) {
        onSwipeDown?.()
      } else {
        onSwipeUp?.()
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}