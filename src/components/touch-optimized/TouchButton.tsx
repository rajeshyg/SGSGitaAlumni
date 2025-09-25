import React, { useState, useCallback } from 'react'
import { deviceDetector } from '@/lib/device-detection'
import { performanceOptimizer } from '@/lib/performance-optimization'

export interface TouchButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TouchButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const capabilities = deviceDetector.getCapabilities()
  const isTouchDevice = capabilities.touchSupport
  const animationDuration = performanceOptimizer.getAnimationDuration(150)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    setIsPressed(true)
    if (navigator.vibrate && isTouchDevice) {
      navigator.vibrate(50)
    }
    e.preventDefault()
  }, [disabled, isTouchDevice])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    setIsPressed(false)
    onClick()
    e.preventDefault()
  }, [disabled, onClick])

  const handleMouseDown = useCallback(() => {
    if (!isTouchDevice && !disabled) setIsPressed(true)
  }, [isTouchDevice, disabled])

  const handleMouseUp = useCallback(() => {
    if (!isTouchDevice && !disabled) {
      setIsPressed(false)
      onClick()
    }
  }, [isTouchDevice, disabled, onClick])

  // Size classes based on device and size prop
  const getSizeClasses = () => {
    const baseSizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    }

    if (capabilities.type === 'mobile') {
      return {
        sm: 'min-h-[44px] min-w-[44px] px-4 py-3 text-base',
        md: 'min-h-[48px] min-w-[48px] px-5 py-4 text-base',
        lg: 'min-h-[52px] min-w-[52px] px-6 py-5 text-lg'
      }[size]
    }

    return baseSizes[size]
  }

  const sizeClasses = getSizeClasses()

  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg',
    `transition-all duration-${animationDuration} ease-out`,
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizeClasses,
    isTouchDevice && !disabled ? 'active:scale-95' : '',
    !isTouchDevice && !disabled ? 'hover:bg-opacity-80' : '',
    isPressed && !disabled ? 'scale-95' : '',
    variant === 'primary' && !disabled ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : '',
    variant === 'secondary' && !disabled ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500' : '',
    variant === 'outline' && !disabled ? 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500' : '',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      className={baseClasses}
      disabled={disabled}
      onTouchStart={isTouchDevice ? handleTouchStart : undefined}
      onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
      onMouseDown={!isTouchDevice ? handleMouseDown : undefined}
      onMouseUp={!isTouchDevice ? handleMouseUp : undefined}
      onMouseLeave={!isTouchDevice ? () => setIsPressed(false) : undefined}
      style={isTouchDevice ? {
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      } : {}}
    >
      {children}
    </button>
  )
}