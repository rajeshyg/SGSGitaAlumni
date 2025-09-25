import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { deviceDetector } from '@/lib/device-detection'
import { performanceOptimizer } from '@/lib/performance-optimization'
import { TouchButton } from '@/components/touch-optimized/TouchButton'
import { useSwipeGesture } from '@/hooks/useSwipeGesture'
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout'

// Mock device detection
vi.mock('@/lib/device-detection', () => ({
  deviceDetector: {
    getCapabilities: vi.fn(),
    onCapabilitiesChange: vi.fn(() => vi.fn())
  }
}))

// Mock performance optimizer
vi.mock('@/lib/performance-optimization', () => ({
  performanceOptimizer: {
    getConfig: vi.fn(),
    optimizeImage: vi.fn(),
    getAnimationDuration: vi.fn(),
    shouldPreload: vi.fn(),
    shouldUseLazyLoading: vi.fn(),
    getImageLoadingStrategy: vi.fn()
  }
}))

describe('Cross-Platform Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('TouchButton', () => {
    it('renders with mobile optimizations', () => {
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'mobile',
        touchSupport: true,
        screenWidth: 375,
        screenHeight: 667
      })

      render(<TouchButton onClick={() => {}}>Click me</TouchButton>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-[44px]') // Mobile touch target size
      expect(button).toHaveClass('min-w-[44px]')
      expect(button).toHaveClass('active:scale-95') // Touch feedback
    })

    it('renders with desktop optimizations', () => {
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'desktop',
        touchSupport: false,
        screenWidth: 1920,
        screenHeight: 1080
      })

      render(<TouchButton onClick={() => {}}>Click me</TouchButton>)

      const button = screen.getByRole('button')
      expect(button).not.toHaveClass('min-h-[44px]') // No mobile-specific classes
      expect(button).not.toHaveClass('active:scale-95') // No touch feedback
      expect(button).toHaveClass('hover:bg-opacity-80') // Hover effects
    })

    it('handles touch events on touch devices', () => {
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'mobile',
        touchSupport: true
      })

      const handleClick = vi.fn()
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
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'desktop',
        touchSupport: false
      })

      const handleClick = vi.fn()
      render(<TouchButton onClick={handleClick}>Click me</TouchButton>)

      const button = screen.getByRole('button')

      // Simulate mouse events
      fireEvent.mouseDown(button)
      fireEvent.mouseUp(button)

      expect(handleClick).toHaveBeenCalled()
    })

    it('respects disabled state', () => {
      const handleClick = vi.fn()
      render(<TouchButton onClick={handleClick} disabled>Click me</TouchButton>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50')

      // Click should not work when disabled
      fireEvent.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Device Detection', () => {
    it('detects mobile device correctly', () => {
      // Mock window dimensions for mobile
      Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true })

      const detector = new (deviceDetector.constructor as any)()
      const capabilities = detector.getCapabilities()

      expect(capabilities.type).toBe('mobile')
      expect(capabilities.screenWidth).toBe(375)
      expect(capabilities.screenHeight).toBe(667)
    })

    it('detects tablet device correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true })

      const detector = new (deviceDetector.constructor as any)()
      const capabilities = detector.getCapabilities()

      expect(capabilities.type).toBe('tablet')
    })

    it('detects desktop device correctly', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1920, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1080, configurable: true })

      const detector = new (deviceDetector.constructor as any)()
      const capabilities = detector.getCapabilities()

      expect(capabilities.type).toBe('desktop')
    })

    it('detects touch support', () => {
      // Mock touch support
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })

      const detector = new (deviceDetector.constructor as any)()
      const capabilities = detector.getCapabilities()

      expect(capabilities.touchSupport).toBe(true)
    })
  })

  describe('Performance Optimization', () => {
    it('optimizes for mobile devices', () => {
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'mobile',
        touchSupport: true
      })

      const config = performanceOptimizer.getConfig()

      expect(config.imageQuality).toBe(0.8)
      expect(config.animationDuration).toBe(200)
    })

    it('optimizes for desktop devices', () => {
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'desktop',
        touchSupport: false
      })

      const config = performanceOptimizer.getConfig()

      expect(config.imageQuality).toBe(1.0)
      expect(config.animationDuration).toBe(400)
    })

    it('optimizes image URLs for different platforms', () => {
      const baseUrl = 'https://example.com/image.jpg'

      // Mobile optimization
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'mobile'
      })
      ;(performanceOptimizer.optimizeImage as any).mockReturnValue(`${baseUrl}?quality=80`)

      expect(performanceOptimizer.optimizeImage(baseUrl)).toContain('quality=80')

      // Desktop optimization
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'desktop'
      })
      ;(performanceOptimizer.optimizeImage as any).mockReturnValue(`${baseUrl}?quality=100`)

      expect(performanceOptimizer.optimizeImage(baseUrl)).toContain('quality=100')
    })
  })

  describe('Adaptive Layout', () => {
    const MobileLayout = () => <div>Mobile Layout</div>
    const TabletLayout = () => <div>Tablet Layout</div>
    const DesktopLayout = () => <div>Desktop Layout</div>

    it('renders mobile layout for mobile devices', () => {
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'mobile'
      })

      render(
        <AdaptiveLayout
          layouts={{ mobile: MobileLayout, tablet: TabletLayout, desktop: DesktopLayout }}
        />
      )

      expect(screen.getByText('Mobile Layout')).toBeInTheDocument()
    })

    it('renders desktop layout for desktop devices', () => {
      (deviceDetector.getCapabilities as any).mockReturnValue({
        type: 'desktop'
      })

      render(
        <AdaptiveLayout
          layouts={{ mobile: MobileLayout, tablet: TabletLayout, desktop: DesktopLayout }}
        />
      )

      expect(screen.getByText('Desktop Layout')).toBeInTheDocument()
    })
  })

  describe('Swipe Gesture Hook', () => {
    it('detects swipe left', () => {
      const onSwipeLeft = vi.fn()
      const { onTouchStart, onTouchEnd } = useSwipeGesture({ onSwipeLeft })

      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({ clientX: 100, clientY: 100, identifier: 0, target: document.body })]
      })
      onTouchStart(touchStartEvent)

      // Simulate touch end (swipe left)
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({ clientX: 50, clientY: 100, identifier: 0, target: document.body })]
      })
      onTouchEnd(touchEndEvent)

      expect(onSwipeLeft).toHaveBeenCalled()
    })

    it('detects swipe right', () => {
      const onSwipeRight = vi.fn()
      const { onTouchStart, onTouchEnd } = useSwipeGesture({ onSwipeRight })

      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [new Touch({ clientX: 100, clientY: 100, identifier: 0, target: document.body })]
      })
      onTouchStart(touchStartEvent)

      // Simulate touch end (swipe right)
      const touchEndEvent = new TouchEvent('touchend', {
        changedTouches: [new Touch({ clientX: 150, clientY: 100, identifier: 0, target: document.body })]
      })
      onTouchEnd(touchEndEvent)

      expect(onSwipeRight).toHaveBeenCalled()
    })
  })
})