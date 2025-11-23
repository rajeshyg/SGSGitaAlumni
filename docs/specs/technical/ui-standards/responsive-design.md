---
title: Responsive Design Standards
version: 1.0
status: active
last_updated: 2025-11-23
category: technical-specs
applies_to: frontend
approach: mobile-first
---

# Responsive Design Standards

This document outlines mobile-first responsive design patterns, breakpoints, and touch interaction guidelines for the SGS Gita Alumni project.

## Mobile-First Approach

Design and develop for mobile devices first, then progressively enhance for larger screens.

### Breakpoints

```css
/* src/styles/breakpoints.css */
:root {
  --breakpoint-sm: 640px;   /* Small tablets */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Small laptops */
  --breakpoint-xl: 1280px;  /* Desktops */
  --breakpoint-2xl: 1536px; /* Large screens */
}
```

### Tailwind Breakpoint Usage

```typescript
// Mobile-first responsive classes
<div className="
  w-full           // Mobile: full width
  md:w-1/2         // Tablet: half width
  lg:w-1/3         // Desktop: third width
  xl:w-1/4         // Large: quarter width
">
  Content
</div>
```

## Viewport Support

- **Minimum**: 320px (small mobile)
- **Maximum**: 1920px+ (large displays)
- Support all viewports in between

## Touch-Friendly Targets

### Minimum Touch Target Size

All interactive elements must have a minimum touch target of **44x44 pixels**.

```typescript
// Mobile-optimized button
export function ResponsiveButton({ children, onClick }: ButtonProps) {
  return (
    <button
      className="min-h-[44px] min-w-[44px] px-4 py-2 touch-manipulation
                active:scale-95 transition-transform duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Touch Interaction Patterns

```typescript
// Touch-optimized swipe interactions
export function SwipeableCard({ children, onSwipe }: CardProps) {
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const handleTouchStart = (e: TouchEvent) =>
    setTouchStart(e.targetTouches[0].clientX)

  const handleTouchMove = (e: TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX)

  const handleTouchEnd = () => {
    const distance = touchStart - touchEnd
    if (Math.abs(distance) > 50) {
      onSwipe(distance > 0 ? 'left' : 'right')
    }
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}
```

## Flexible Grid System

### Responsive Grid Layout

```typescript
// Adaptive grid layout
<div className="
  grid
  grid-cols-1      // Mobile: single column
  sm:grid-cols-2   // Small: 2 columns
  md:grid-cols-3   // Medium: 3 columns
  lg:grid-cols-4   // Large: 4 columns
  gap-4
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Container Patterns

```typescript
// Responsive container with max-width
<div className="
  w-full
  max-w-7xl
  mx-auto
  px-4 sm:px-6 lg:px-8
">
  Content
</div>
```

## Platform-Adaptive Components

### Device Detection Hook

```typescript
// Platform-adaptive component
export function AdaptiveLayout({ children }: LayoutProps) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      if (width < 768) setDeviceType('mobile')
      else if (width < 1024) setDeviceType('tablet')
      else setDeviceType('desktop')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const layouts = {
    mobile: MobileLayout,
    tablet: TabletLayout,
    desktop: DesktopLayout
  }
  const LayoutComponent = layouts[deviceType]

  return <LayoutComponent>{children}</LayoutComponent>
}
```

### Responsive Typography

```typescript
// Fluid typography scaling
<h1 className="
  text-2xl         // Mobile
  sm:text-3xl      // Small tablet
  md:text-4xl      // Tablet
  lg:text-5xl      // Desktop
  font-bold
">
  Responsive Heading
</h1>
```

## Navigation Patterns

### Mobile Navigation

```typescript
// Mobile-friendly navigation
export function ResponsiveNav() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav>
      {/* Mobile menu button */}
      <button
        className="md:hidden min-h-[44px] min-w-[44px]"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle navigation"
      >
        <MenuIcon />
      </button>

      {/* Navigation links */}
      <ul className={cn(
        "flex flex-col md:flex-row",
        "md:visible",
        isOpen ? "visible" : "invisible md:visible"
      )}>
        <li><a href="/">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  )
}
```

## Image Responsiveness

### Responsive Images

```typescript
// Responsive image with srcset
<img
  src="/image-800.jpg"
  srcSet="
    /image-400.jpg 400w,
    /image-800.jpg 800w,
    /image-1200.jpg 1200w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="Responsive image"
  className="w-full h-auto"
/>
```

## Testing Requirements

### E2E Tests

- `tests/e2e/responsive.spec.ts` - Viewport testing
- `tests/e2e/cross-browser.spec.ts` - Browser compatibility

### Test Viewports

```typescript
// Test across multiple viewports
const viewports = [
  { width: 320, height: 568 },   // iPhone SE
  { width: 375, height: 667 },   // iPhone 8
  { width: 768, height: 1024 },  // iPad
  { width: 1024, height: 768 },  // iPad landscape
  { width: 1440, height: 900 },  // Desktop
]
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)
- iOS Safari
- Android Chrome

## Code References

- Breakpoints: `src/styles/breakpoints.css`
- Mobile layouts: `src/styles/mobile/`

## Related Documentation

- [Theme System](./theme-system.md)
- [Accessibility Standards](./accessibility.md)
- [Component Patterns](./component-patterns.md)
