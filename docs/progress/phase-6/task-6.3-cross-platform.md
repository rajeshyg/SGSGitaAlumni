# Task 6.3: Cross-Platform Optimization

## Overview

Optimize the SGSGita Alumni application for consistent performance and user experience across mobile devices, tablets, and desktop computers, ensuring accessibility and usability on all platforms.

## Status
- **Status:** 🔴 Pending
- **Estimated Effort:** 3-4 days
- **Priority:** High
- **Dependencies:** Task 6.1 (Quality Assurance Framework)

## Objectives

1. **Device Detection** - Implement robust device and platform detection
2. **Responsive Design** - Ensure optimal layouts across all screen sizes
3. **Touch Optimization** - Enhance touch interactions for mobile/tablet
4. **Performance Optimization** - Platform-specific performance tuning
5. **Cross-Browser Compatibility** - Ensure consistent behavior across browsers
6. **Accessibility Compliance** - WCAG 2.1 AA compliance across platforms

## Implementation Plan

### Phase 1: Device Detection & Adaptation (Day 1)

#### Advanced Device Detection System
```typescript
// src/lib/device-detection.ts

export interface DeviceCapabilities {
  type: 'mobile' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
  touchSupport: boolean
  screenSize: { width: number; height: number }
  pixelRatio: number
  platform: string
  browser: string
  capabilities: {
    webgl: boolean
    serviceWorker: boolean
    indexedDB: boolean
    localStorage: boolean
    geolocation: boolean
    camera: boolean
    microphone: boolean
  }
}

export class DeviceDetector {
  private capabilities: DeviceCapabilities
  private listeners: Set<(capabilities: DeviceCapabilities) => void> = new Set()

  constructor() {
    this.capabilities = this.detectCapabilities()
    this.setupEventListeners()
  }

  private detectCapabilities(): DeviceCapabilities {
    const userAgent = navigator.userAgent
    const screen = window.screen
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    // Device type detection
    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (viewport.width < 768) {
      type = 'mobile'
    } else if (viewport.width < 1024) {
      type = 'tablet'
    }

    // Orientation detection
    const orientation: 'portrait' | 'landscape' =
      viewport.height > viewport.width ? 'portrait' : 'landscape'

    // Platform detection
    let platform = 'unknown'
    if (userAgent.includes('Android')) platform = 'android'
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'ios'
    else if (userAgent.includes('Windows')) platform = 'windows'
    else if (userAgent.includes('Mac')) platform = 'macos'
    else if (userAgent.includes('Linux')) platform = 'linux'

    // Browser detection
    let browser = 'unknown'
    if (userAgent.includes('Chrome')) browser = 'chrome'
    else if (userAgent.includes('Firefox')) browser = 'firefox'
    else if (userAgent.includes('Safari')) browser = 'safari'
    else if (userAgent.includes('Edge')) browser = 'edge'

    return {
      type,
      orientation,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      screenSize: { width: screen.width, height: screen.height },
      pixelRatio: window.devicePixelRatio || 1,
      platform,
      browser,
      capabilities: {
        webgl: this.detectWebGL(),
        serviceWorker: 'serviceWorker' in navigator,
        indexedDB: 'indexedDB' in window,
        localStorage: this.detectLocalStorage(),
        geolocation: 'geolocation' in navigator,
        camera: this.detectCamera(),
        microphone: this.detectMicrophone()
      }
    }
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext &&
        canvas.getContext('webgl'))
    } catch (e) {
      return false
    }
  }

  private detectLocalStorage(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  private detectCamera(): boolean {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia)
  }

  private detectMicrophone(): boolean {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      navigator.mediaDevices.enumerateDevices)
  }

  private setupEventListeners(): void {
    // Orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.capabilities = this.detectCapabilities()
        this.notifyListeners()
      }, 100)
    })

    // Resize
    window.addEventListener('resize', () => {
      this.capabilities = this.detectCapabilities()
      this.notifyListeners()
    })

    // Device capabilities might change (e.g., camera permission)
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' }).then(result => {
        result.addEventListener('change', () => {
          this.capabilities.capabilities.camera = result.state === 'granted'
          this.notifyListeners()
        })
      }).catch(() => {})
    }
  }

  public getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities }
  }

  public onCapabilitiesChange(callback: (capabilities: DeviceCapabilities) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.capabilities))
  }

  // Utility methods
  public isMobile(): boolean {
    return this.capabilities.type === 'mobile'
  }

  public isTablet(): boolean {
    return this.capabilities.type === 'tablet'
  }

  public isDesktop(): boolean {
    return this.capabilities.type === 'desktop'
  }

  public isTouchDevice(): boolean {
    return this.capabilities.touchSupport
  }

  public getOptimalImageSize(): { width: number; height: number } {
    const { screenSize, pixelRatio } = this.capabilities
    return {
      width: Math.min(screenSize.width * pixelRatio, 1920),
      height: Math.min(screenSize.height * pixelRatio, 1080)
    }
  }
}

// Singleton instance
export const deviceDetector = new DeviceDetector()
```

#### Platform-Specific Component System
```typescript
// src/components/platform-adaptive/PlatformAdaptive.tsx

import React, { useState, useEffect } from 'react'
import { deviceDetector, DeviceCapabilities } from '@/lib/device-detection'

interface PlatformComponents<T> {
  mobile?: React.ComponentType<T>
  tablet?: React.ComponentType<T>
  desktop?: React.ComponentType<T>
  fallback?: React.ComponentType<T>
}

interface PlatformAdaptiveProps<T> extends T {
  components: PlatformComponents<T>
}

export function PlatformAdaptive<T = {}>({
  components,
  ...props
}: PlatformAdaptiveProps<T>) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const capabilities = deviceDetector.getCapabilities()
    setDeviceType(capabilities.type)

    const unsubscribe = deviceDetector.onCapabilitiesChange((newCapabilities) => {
      setDeviceType(newCapabilities.type)
    })

    return unsubscribe
  }, [])

  const Component = components[deviceType] || components.fallback

  if (!Component) {
    console.warn(`No component found for device type: ${deviceType}`)
    return null
  }

  return <Component {...(props as T)} />
}

// Usage example
export function AdaptiveButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <PlatformAdaptive
      components={{
        mobile: MobileButton,
        tablet: TabletButton,
        desktop: DesktopButton
      }}
      onClick={onClick}
    >
      {children}
    </PlatformAdaptive>
  )
}
```

### Phase 2: Touch & Interaction Optimization (Day 2)

#### Touch-Optimized Components
```typescript
// src/components/touch-optimized/TouchButton.tsx

import React, { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { deviceDetector } from '@/lib/device-detection'

interface TouchButtonProps {
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
  className
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [touchStartTime, setTouchStartTime] = useState(0)

  const capabilities = deviceDetector.getCapabilities()
  const isTouchDevice = capabilities.touchSupport

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return

    setIsPressed(true)
    setTouchStartTime(Date.now())

    // Haptic feedback for supported devices
    if (navigator.vibrate && isTouchDevice) {
      navigator.vibrate(50)
    }

    // Prevent scrolling on touch
    e.preventDefault()
  }, [disabled, isTouchDevice])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return

    const touchDuration = Date.now() - touchStartTime

    // Only trigger click if touch was not too long (prevent accidental long presses)
    if (touchDuration < 500) {
      onClick()
    }

    setIsPressed(false)
    e.preventDefault()
  }, [disabled, onClick, touchStartTime])

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false)
  }, [])

  const handleMouseDown = useCallback(() => {
    if (!isTouchDevice && !disabled) {
      setIsPressed(true)
    }
  }, [isTouchDevice, disabled])

  const handleMouseUp = useCallback(() => {
    if (!isTouchDevice && !disabled) {
      setIsPressed(false)
      onClick()
    }
  }, [isTouchDevice, disabled, onClick])

  const handleMouseLeave = useCallback(() => {
    if (!isTouchDevice) {
      setIsPressed(false)
    }
  }, [isTouchDevice])

  // Platform-specific sizing
  const getSizeClasses = () => {
    const baseSizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg'
    }

    if (capabilities.type === 'mobile') {
      // Ensure minimum touch target size
      return {
        sm: 'min-h-[44px] min-w-[44px] px-4 py-3 text-base',
        md: 'min-h-[48px] min-w-[48px] px-5 py-4 text-base',
        lg: 'min-h-[52px] min-w-[52px] px-6 py-4 text-lg'
      }
    }

    return baseSizes
  }

  const sizeClasses = getSizeClasses()[size]

  const baseClasses = cn(
    'relative inline-flex items-center justify-center font-medium rounded-lg',
    'transition-all duration-150 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizeClasses,
    {
      // Touch device styles
      'active:scale-95': isTouchDevice && !disabled,
      'hover:bg-opacity-80': !isTouchDevice && !disabled,

      // Pressed state
      'scale-95': isPressed && !disabled,

      // Variants
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary' && !disabled,
      'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary' && !disabled,
      'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500': variant === 'outline' && !disabled,
    },
    className
  )

  const touchProps = isTouchDevice ? {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    style: {
      WebkitTapHighlightColor: 'transparent',
      WebkitTouchCallout: 'none',
      WebkitUserSelect: 'none'
    }
  } : {}

  const mouseProps = !isTouchDevice ? {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave
  } : {}

  return (
    <button
      className={baseClasses}
      disabled={disabled}
      {...touchProps}
      {...mouseProps}
    >
      {children}
    </button>
  )
}
```

#### Swipe Gesture Handler
```typescript
// src/hooks/useSwipeGesture.ts

import { useRef, useCallback } from 'react'
import { deviceDetector } from '@/lib/device-detection'

interface SwipeConfig {
  threshold?: number
  restraint?: number
  allowedTime?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export function useSwipeGesture(config: SwipeConfig = {}) {
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)

  const {
    threshold = 150,
    restraint = 100,
    allowedTime = 300,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  } = config

  const capabilities = deviceDetector.getCapabilities()

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!capabilities.touchSupport) return

    const touch = e.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
    touchStartTime.current = Date.now()
  }, [capabilities.touchSupport])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!capabilities.touchSupport || !touchStartX.current || !touchStartY.current || !touchStartTime.current) return

    const touch = e.changedTouches[0]
    const touchEndX = touch.clientX
    const touchEndY = touch.clientY
    const touchEndTime = Date.now()

    const timeDiff = touchEndTime - touchStartTime.current
    const distanceX = touchEndX - touchStartX.current
    const distanceY = touchEndY - touchStartY.current

    // Check if swipe was within allowed time
    if (timeDiff > allowedTime) return

    // Check if swipe distance meets threshold
    if (Math.abs(distanceX) >= threshold && Math.abs(distanceY) <= restraint) {
      if (distanceX > 0) {
        onSwipeRight?.()
      } else {
        onSwipeLeft?.()
      }
    } else if (Math.abs(distanceY) >= threshold && Math.abs(distanceX) <= restraint) {
      if (distanceY > 0) {
        onSwipeDown?.()
      } else {
        onSwipeUp?.()
      }
    }

    // Reset touch coordinates
    touchStartX.current = null
    touchStartY.current = null
    touchStartTime.current = null
  }, [capabilities.touchSupport, threshold, restraint, allowedTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd
  }
}

// Usage example
export function SwipeableCard({ children, onSwipeLeft, onSwipeRight }: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}) {
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight
  })

  return (
    <div
      {...swipeHandlers}
      className="cursor-grab active:cursor-grabbing"
    >
      {children}
    </div>
  )
}
```

### Phase 3: Responsive Layout System (Day 3)

#### Adaptive Layout Components
```typescript
// src/components/layout/AdaptiveLayout.tsx

import React, { useState, useEffect } from 'react'
import { deviceDetector } from '@/lib/device-detection'

interface LayoutConfig {
  mobile: React.ComponentType<any>
  tablet: React.ComponentType<any>
  desktop: React.ComponentType<any>
}

interface AdaptiveLayoutProps {
  layouts: LayoutConfig
  layoutProps?: Record<string, any>
}

export function AdaptiveLayout({ layouts, layoutProps = {} }: AdaptiveLayoutProps) {
  const [currentLayout, setCurrentLayout] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const capabilities = deviceDetector.getCapabilities()
    setCurrentLayout(capabilities.type)

    const unsubscribe = deviceDetector.onCapabilitiesChange((newCapabilities) => {
      setCurrentLayout(newCapabilities.type)
    })

    return unsubscribe
  }, [])

  const LayoutComponent = layouts[currentLayout]

  return <LayoutComponent {...layoutProps} />
}

// Usage example
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdaptiveLayout
      layouts={{
        mobile: MobileLayout,
        tablet: TabletLayout,
        desktop: DesktopLayout
      }}
      layoutProps={{ children }}
    />
  )
}
```

#### Mobile-First Navigation
```typescript
// src/components/navigation/MobileNavigation.tsx

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { deviceDetector } from '@/lib/device-detection'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  onClick: () => void
}

interface MobileNavigationProps {
  items: NavigationItem[]
  activeItem?: string
  className?: string
}

export function MobileNavigation({ items, activeItem, className }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const capabilities = deviceDetector.getCapabilities()

  if (capabilities.type === 'desktop') {
    // Desktop sidebar navigation
    return (
      <nav className={cn('w-64 bg-white border-r border-gray-200', className)}>
        <div className="p-4">
          <ul className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon
              const isActive = activeItem === item.id

              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      item.onClick()
                      setIsMenuOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors',
                      'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
                      {
                        'bg-blue-50 text-blue-700': isActive,
                        'text-gray-700': !isActive
                      }
                    )}
                  >
                    <Icon size={20} className="mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    )
  }

  // Mobile bottom navigation
  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={cn(
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50',
        'safe-area-bottom', // iOS safe area
        className
      )}>
        <div className="flex justify-around items-center max-w-md mx-auto">
          {items.slice(0, 5).map((item) => { // Limit to 5 items for mobile
            const Icon = item.icon
            const isActive = activeItem === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick()
                  setIsMenuOpen(false)
                }}
                className={cn(
                  'flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] min-h-[60px]',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  {
                    'text-blue-600': isActive,
                    'text-gray-500': !isActive
                  }
                )}
              >
                <Icon size={24} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Mobile Menu Overlay (for additional items) */}
      {items.length > 5 && (
        <>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg z-40"
            aria-label="More options"
          >
            <span className="text-xl">⋯</span>
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg z-50 p-4">
                <div className="grid grid-cols-2 gap-4">
                  {items.slice(5).map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.onClick()
                          setIsMenuOpen(false)
                        }}
                        className="flex flex-col items-center p-4 rounded-lg hover:bg-gray-100"
                      >
                        <Icon size={24} />
                        <span className="text-sm mt-2">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
```

### Phase 4: Performance Optimization (Day 4)

#### Platform-Specific Performance Tuning
```typescript
// src/lib/performance-optimization.ts

import { deviceDetector } from '@/lib/device-detection'

export interface PerformanceConfig {
  imageQuality: number
  animationDuration: number
  bundleChunkSize: string
  cacheStrategy: 'cache-first' | 'network-first' | 'stale-while-revalidate'
  preloadStrategy: 'aggressive' | 'conservative' | 'none'
}

export class PerformanceOptimizer {
  private config: PerformanceConfig

  constructor() {
    this.config = this.getOptimalConfig()
  }

  private getOptimalConfig(): PerformanceConfig {
    const capabilities = deviceDetector.getCapabilities()

    switch (capabilities.type) {
      case 'mobile':
        return {
          imageQuality: 0.8,
          animationDuration: 200,
          bundleChunkSize: '100kb',
          cacheStrategy: 'network-first',
          preloadStrategy: 'conservative'
        }

      case 'tablet':
        return {
          imageQuality: 0.9,
          animationDuration: 300,
          bundleChunkSize: '200kb',
          cacheStrategy: 'cache-first',
          preloadStrategy: 'aggressive'
        }

      case 'desktop':
      default:
        return {
          imageQuality: 1.0,
          animationDuration: 400,
          bundleChunkSize: '500kb',
          cacheStrategy: 'stale-while-revalidate',
          preloadStrategy: 'aggressive'
        }
    }
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  public optimizeImage(src: string, options?: { quality?: number }): string {
    const quality = options?.quality || this.config.imageQuality

    // Implement image optimization logic
    // This could integrate with a service like Cloudinary or ImageKit
    return `${src}?quality=${quality * 100}`
  }

  public getAnimationDuration(baseDuration: number): number {
    // Adjust animation duration based on device capabilities
    const capabilities = deviceDetector.getCapabilities()

    if (capabilities.type === 'mobile') {
      return Math.min(baseDuration, 200) // Cap mobile animations
    }

    return baseDuration
  }

  public shouldPreload(resource: string): boolean {
    switch (this.config.preloadStrategy) {
      case 'aggressive':
        return true
      case 'conservative':
        // Only preload critical resources
        return resource.includes('critical') || resource.includes('hero')
      case 'none':
      default:
        return false
    }
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// React hook for performance optimization
export function usePerformanceOptimization() {
  const [config, setConfig] = useState<PerformanceConfig>(performanceOptimizer.getConfig())

  useEffect(() => {
    const unsubscribe = deviceDetector.onCapabilitiesChange(() => {
      setConfig(performanceOptimizer.getConfig())
    })

    return unsubscribe
  }, [])

  return {
    config,
    optimizeImage: performanceOptimizer.optimizeImage.bind(performanceOptimizer),
    getAnimationDuration: performanceOptimizer.getAnimationDuration.bind(performanceOptimizer),
    shouldPreload: performanceOptimizer.shouldPreload.bind(performanceOptimizer)
  }
}
```

#### Lazy Loading with Platform Awareness
```typescript
// src/components/lazy/LazyComponent.tsx

import React, { Suspense, lazy, ComponentType } from 'react'
import { performanceOptimizer } from '@/lib/performance-optimization'
import { deviceDetector } from '@/lib/device-detection'

interface LazyComponentProps {
  importFunc: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ComponentType<any>
  preload?: boolean
  componentProps?: Record<string, any>
}

export function LazyComponent({
  importFunc,
  fallback: Fallback,
  preload = false,
  componentProps = {}
}: LazyComponentProps) {
  const [LazyLoadedComponent, setLazyLoadedComponent] = useState<ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const module = await importFunc()
        setLazyLoadedComponent(() => module.default)
      } catch (error) {
        console.error('Failed to load component:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (preload || performanceOptimizer.shouldPreload('component')) {
      loadComponent()
    } else {
      // Delay loading for mobile devices to improve initial page load
      const capabilities = deviceDetector.getCapabilities()
      const delay = capabilities.type === 'mobile' ? 100 : 0

      setTimeout(loadComponent, delay)
    }
  }, [importFunc, preload])

  if (isLoading || !LazyLoadedComponent) {
    return Fallback ? <Fallback /> : <div>Loading...</div>
  }

  return <LazyLoadedComponent {...componentProps} />
}

// Usage example
const AdminPage = lazy(() => import('../pages/AdminPage'))
const HomePage = lazy(() => import('../pages/HomePage'))

export function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/admin"
          element={
            <LazyComponent
              importFunc={() => import('../pages/AdminPage')}
              fallback={AdminPageSkeleton}
              preload={performanceOptimizer.shouldPreload('admin')}
            />
          }
        />
        <Route
          path="/"
          element={
            <LazyComponent
              importFunc={() => import('../pages/HomePage')}
              fallback={HomePageSkeleton}
            />
          }
        />
      </Routes>
    </Router>
  )
}
```

## Testing & Validation

### Cross-Platform Testing Suite
```typescript
// src/test/cross-platform.test.ts

import { render, screen, fireEvent } from '@testing-library/react'
import { deviceDetector } from '@/lib/device-detection'
import { TouchButton } from '@/components/touch-optimized/TouchButton'

// Mock device detection
jest.mock('@/lib/device-detection', () => ({
  deviceDetector: {
    getCapabilities: jest.fn(),
    onCapabilitiesChange: jest.fn(() => jest.fn())
  }
}))

describe('Cross-Platform Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('TouchButton', () => {
    it('renders with mobile optimizations', () => {
      (deviceDetector.getCapabilities as jest.Mock).mockReturnValue({
        type: 'mobile',
        touchSupport: true
      })

      render(<TouchButton onClick={() => {}}>Click me</TouchButton>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[44px]') // Mobile touch target size
      expect(button).toHaveClass('min-w-[44px]')
    })

    it('renders with desktop optimizations', () => {
      (deviceDetector.getCapabilities as jest.Mock).mockReturnValue({
        type: 'desktop',
        touchSupport: false
      })

      render(<TouchButton onClick={() => {}}>Click me</TouchButton>)

      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('min-h-[44px]') // No mobile-specific classes
    })

    it('handles touch events on touch devices', () => {
      (deviceDetector.getCapabilities as jest.Mock).mockReturnValue({
        type: 'mobile',
        touchSupport: true
      })

      const handleClick = jest.fn()
      render(<TouchButton onClick={handleClick}>Click me</TouchButton>)

      const button = screen.getByRole('button')

      // Simulate touch events
      fireEvent.touchStart(button, {
        touches: [{ clientX: 0, clientY: 0 }]
      })

      fireEvent.touchEnd(button, {
        changedTouches: [{ clientX: 0, clientY: 0 }]
      })

      expect(handleClick).toHaveBeenCalled()
    })

    it('handles mouse events on desktop', () => {
      (deviceDetector.getCapabilities as jest.Mock).mockReturnValue({
        type: 'desktop',
        touchSupport: false
      })

      const handleClick = jest.fn()
      render(<TouchButton onClick={handleClick}>Click me</TouchButton>)

      const button = screen.getByRole('button')

      // Simulate mouse events
      fireEvent.mouseDown(button)
      fireEvent.mouseUp(button)

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Device Detection', () => {
    it('detects mobile device correctly', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', { value: 375 })

      const detector = new (deviceDetector.constructor as any)()
      const capabilities = detector.getCapabilities()

      expect(capabilities.type).toBe('mobile')
    })

    it('detects tablet device correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 })

      const detector = new (deviceDetector.constructor as any)()
      const capabilities = detector.getCapabilities()

      expect(capabilities.type).toBe('tablet')
    })

    it('detects desktop device correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920 })

      const detector = new (deviceDetector.constructor as any)()
      const capabilities = detector.getCapabilities()

      expect(capabilities.type).toBe('desktop')
    })
  })
})
```

### Performance Testing
```typescript
// src/test/performance.test.ts

import { performanceOptimizer } from '@/lib/performance-optimization'

describe('Performance Optimization', () => {
  describe('Platform-specific configurations', () => {
    it('optimizes for mobile devices', () => {
      // Mock mobile device
      jest.spyOn(deviceDetector, 'getCapabilities').mockReturnValue({
        type: 'mobile',
        touchSupport: true
      } as any)

      const config = performanceOptimizer.getConfig()

      expect(config.imageQuality).toBe(0.8)
      expect(config.animationDuration).toBe(200)
      expect(config.bundleChunkSize).toBe('100kb')
    })

    it('optimizes for desktop devices', () => {
      jest.spyOn(deviceDetector, 'getCapabilities').mockReturnValue({
        type: 'desktop',
        touchSupport: false
      } as any)

      const config = performanceOptimizer.getConfig()

      expect(config.imageQuality).toBe(1.0)
      expect(config.animationDuration).toBe(400)
      expect(config.bundleChunkSize).toBe('500kb')
    })
  })

  describe('Image optimization', () => {
    it('optimizes image URLs for different platforms', () => {
      const baseUrl = 'https://example.com/image.jpg'

      // Mobile optimization
      jest.spyOn(deviceDetector, 'getCapabilities').mockReturnValue({
        type: 'mobile'
      } as any)

      expect(performanceOptimizer.optimizeImage(baseUrl)).toContain('quality=80')

      // Desktop optimization
      jest.spyOn(deviceDetector, 'getCapabilities').mockReturnValue({
        type: 'desktop'
      } as any)

      expect(performanceOptimizer.optimizeImage(baseUrl)).toContain('quality=100')
    })
  })
})
```

## Success Criteria
- ✅ Device detection works across all platforms
- ✅ Touch interactions optimized for mobile/tablet
- ✅ Responsive layouts adapt to screen sizes
- ✅ Platform-specific performance optimizations applied
- ✅ Cross-browser compatibility maintained
- ✅ Mobile load time under 3 seconds
- ✅ Desktop load time under 1 second
- ✅ Touch response time under 100ms
- ✅ Cross-platform compatibility at 100%
- ✅ Performance score above 90 (Lighthouse)

## Performance Requirements
- **Mobile Load Time:** < 3 seconds
- **Tablet Load Time:** < 2 seconds
- **Desktop Load Time:** < 1 second
- **Touch Response Time:** < 100ms
- **Layout Shift:** < 0.1 CLS (Cumulative Layout Shift)
- **Cross-Platform Compatibility:** 100%
- **Touch Target Compliance:** 100% (44px minimum)
- **Responsive Breakpoint Coverage:** 100%
- **Performance Score:** > 90 (Lighthouse)
- **Accessibility Score:** > 95 (WCAG compliance)

## Documentation Updates

### Platform Guidelines
```markdown
# Cross-Platform Development Guidelines

## Device Support Matrix

| Feature | Mobile | Tablet | Desktop | Notes |
|---------|--------|--------|---------|-------|
| Touch Support | ✅ | ✅ | ❌ | Use touch events on touch devices |
| Hover States | ❌ | ⚠️ | ✅ | Avoid hover-only interactions |
| Minimum Touch Target | 44px | 32px | N/A | Follow platform guidelines |
| Keyboard Navigation | ✅ | ✅ | ✅ | Full keyboard support required |
| Screen Reader | ✅ | ✅ | ✅ | WCAG 2.1 AA compliance |

## Implementation Patterns

### 1. Device Detection
Always use the centralized device detection system:

```typescript
import { deviceDetector } from '@/lib/device-detection'

const capabilities = deviceDetector.getCapabilities()
if (capabilities.type === 'mobile') {
  // Mobile-specific logic
}
```

### 2. Platform-Adaptive Components
Use the PlatformAdaptive component for device-specific implementations:

```typescript
<PlatformAdaptive
  components={{
    mobile: MobileButton,
    tablet: TabletButton,
    desktop: DesktopButton
  }}
  onClick={handleClick}
/>
```

### 3. Performance Optimization
Apply platform-specific optimizations:

```typescript
import { performanceOptimizer } from '@/lib/performance-optimization'

const config = performanceOptimizer.getConfig()
// Use config values for platform-specific behavior
```

## Testing Checklist

- [ ] Test on actual devices (not just browser dev tools)
- [ ] Verify touch targets meet minimum size requirements
- [ ] Test orientation changes on mobile/tablet
- [ ] Validate keyboard navigation on all platforms
- [ ] Check performance metrics across devices
- [ ] Test with screen readers
- [ ] Verify cross-browser compatibility
```

## Next Steps

1. **Device Testing Setup** - Configure testing devices and emulators
2. **Performance Benchmarking** - Establish baseline performance metrics
3. **Accessibility Audit** - Conduct WCAG 2.1 AA compliance audit
4. **Cross-Browser Testing** - Set up automated cross-browser testing
5. **Documentation Review** - Update component documentation with platform notes

## Risk Mitigation

### Common Issues
1. **False Device Detection** - Use multiple detection methods
2. **Touch Event Conflicts** - Prevent default behaviors appropriately
3. **Performance Degradation** - Monitor and optimize for each platform
4. **Layout Shifts** - Use proper responsive design techniques
5. **Browser Inconsistencies** - Test on actual browsers, not just dev tools

### Monitoring & Alerts
- Set up performance monitoring per platform
- Alert on cross-platform compatibility issues
- Monitor touch interaction success rates
- Track accessibility compliance metrics

## Additional Requirements
- [ ] Application renders correctly on all target devices (mobile, tablet, desktop)
- [ ] Touch interactions work smoothly on mobile and tablet devices
- [ ] Performance meets targets on all platforms (< 200ms response time)
- [ ] Cross-browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility compliance (WCAG 2.1 AA) achieved across all platforms
- [ ] Responsive design adapts seamlessly to different screen sizes
- [ ] Device-specific optimizations improve user experience
- [ ] Platform detection accurately identifies device capabilities
- [ ] Performance monitoring provides platform-specific insights
- [ ] User testing validates cross-platform functionality

---

*Task 6.3: Cross-Platform Optimization - Last updated: September 22, 2025*