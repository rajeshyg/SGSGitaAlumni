export interface SwipeGestureOptions {
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

// Pure factory that returns handlers and does not use React hooks.
// This allows tests to call it outside of component render.
export function useSwipeGesture({
  threshold = 30,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown
}: SwipeGestureOptions = {}) {
  let touchStartX: number | null = null
  let touchStartY: number | null = null

  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX === null || touchStartY === null) return

    const touch = e.changedTouches[0]
    const distanceX = touch.clientX - touchStartX
    const distanceY = touch.clientY - touchStartY

    const absDistanceX = Math.abs(distanceX)
    const absDistanceY = Math.abs(distanceY)

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

    touchStartX = null
    touchStartY = null
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}