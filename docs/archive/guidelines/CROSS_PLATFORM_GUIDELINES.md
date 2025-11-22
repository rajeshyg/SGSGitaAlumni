# Cross-Platform Guidelines

This document provides comprehensive guidelines for developing applications that work seamlessly across mobile devices, tablets, and desktop computers, ensuring consistent user experiences and optimal performance on all platforms.

## 📱 Mobile Device Guidelines

### Touch Interaction Standards
- **Touch Target Size**: Minimum 44px × 44px for mobile (See `src/constants/accessibility.ts`)
- **Touch Target Spacing**: Minimum 8px spacing between touch targets
- **Gesture Support**: Implement swipe, pinch, and long-press gestures
- **Haptic Feedback**: Provide tactile feedback for user actions

### Mobile-Specific Patterns
```typescript
// ✅ Mobile-optimized button component
const MobileButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary'
}) => {
  const [isPressed, setIsPressed] = useState(false)

  const handleTouchStart = () => {
    if (!disabled) {
      setIsPressed(true)
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
    if (!disabled) {
      onClick()
    }
  }

  return (
    <button
      className={cn(
        'min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg font-medium',
        'transition-all duration-150 ease-out',
        'active:scale-95 touch-manipulation',
        {
          'bg-blue-600 text-white shadow-lg': variant === 'primary' && !disabled,
          'bg-gray-200 text-gray-500': disabled,
          'scale-95': isPressed && !disabled
        }
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {children}
    </button>
  )
}
```

### Mobile Navigation Patterns
```typescript
// ✅ Bottom navigation for mobile
const MobileNavigation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home')

  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] min-h-[60px]',
                'transition-colors duration-200',
                {
                  'text-blue-600': isActive,
                  'text-gray-500': !isActive
                }
              )}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

### Mobile Form Optimization
```typescript
// ✅ Mobile-optimized form inputs
const MobileInput: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      inputMode={inputMode}
      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                 placeholder:text-gray-400"
      style={{
        fontSize: '16px', // Prevents zoom on iOS
        WebkitAppearance: 'none',
        borderRadius: '8px'
      }}
    />
  )
}
```

## 📱 Tablet Device Guidelines

### Hybrid Touch/Mouse Interaction
- **Touch Targets**: Minimum 32px × 32px (See `src/constants/accessibility.ts`)
- **Hover States**: Support both touch and mouse interactions
- **Multi-Touch Gestures**: Support pinch-to-zoom and multi-finger scrolling
- **Split-Screen Capability**: Design for split-screen multitasking

### Tablet Layout Patterns
```typescript
// ✅ Tablet-optimized layout with split-screen support
const TabletLayout: React.FC = ({ children }) => {
  const [isSplitScreen, setIsSplitScreen] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')

  useEffect(() => {
    const handleOrientationChange = () => {
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      setOrientation(newOrientation)

      // Auto-enable split screen in landscape
      if (newOrientation === 'landscape' && window.innerWidth > 1024) {
        setIsSplitScreen(true)
      } else {
        setIsSplitScreen(false)
      }
    }

    handleOrientationChange()
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  if (isSplitScreen) {
    return (
      <div className="flex h-screen">
        <div className="w-1/2 border-r border-gray-200 overflow-auto">
          {/* Primary content */}
          <div className="p-6">{children[0]}</div>
        </div>
        <div className="w-1/2 overflow-auto">
          {/* Secondary content */}
          <div className="p-6">{children[1]}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {children}
    </div>
  )
}
```

### Tablet Navigation Patterns
```typescript
// ✅ Tablet sidebar navigation
const TabletSidebar: React.FC = ({ isOpen, onToggle }) => {
  return (
    <>
      {/* Overlay for mobile/tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0 md:shadow-none',
        {
          'translate-x-0': isOpen,
          '-translate-x-full': !isOpen
        }
      )}>
        <div className="p-4">
          <button
            onClick={onToggle}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <XIcon size={24} />
          </button>
        </div>

        <nav className="px-4">
          {/* Navigation items */}
        </nav>
      </div>
    </>
  )
}
```

## 🖥️ Desktop Device Guidelines

### Keyboard-Centric Design
- **Keyboard Shortcuts**: Implement comprehensive keyboard navigation
- **Focus Management**: Clear focus indicators (See `src/constants/accessibility.ts`)
- **Context Menus**: Right-click context menus for power users
- **Multi-Window Support**: Design for multiple windows/tabs

### Desktop Interaction Patterns
```typescript
// ✅ Desktop-optimized component with keyboard support
const DesktopComponent: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        // Navigate to next item
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        // Navigate to previous item
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Activate selected item
      } else if (e.key === ' ') {
        e.preventDefault()
        // Toggle selection
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()

    // Show context menu
    const menuItems = [
      { label: 'Open', action: () => openItem(itemId) },
      { label: 'Edit', action: () => editItem(itemId) },
      { label: 'Delete', action: () => deleteItem(itemId) }
    ]

    showContextMenu(e.clientX, e.clientY, menuItems)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          ref={(el) => {
            if (el) itemRefs.current.set(item.id, el)
          }}
          className={cn(
            'p-4 border rounded-lg cursor-pointer transition-all',
            'hover:shadow-md hover:border-blue-300',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            {
              'bg-blue-50 border-blue-300': selectedItem === item.id,
              'ring-2 ring-blue-500': selectedItem === item.id
            }
          )}
          tabIndex={0}
          onClick={() => setSelectedItem(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setSelectedItem(item.id)
            }
          }}
        >
          {item.content}
        </div>
      ))}
    </div>
  )
}
```

### Desktop Keyboard Shortcuts
```typescript
// ✅ Comprehensive keyboard shortcut system
class KeyboardShortcutManager {
  private shortcuts: Map<string, () => void> = new Map()

  register(shortcut: string, callback: () => void): void {
    this.shortcuts.set(shortcut.toLowerCase(), callback)
  }

  unregister(shortcut: string): void {
    this.shortcuts.delete(shortcut.toLowerCase())
  }

  handleKeyDown(event: KeyboardEvent): void {
    const keys = []

    if (event.ctrlKey || event.metaKey) keys.push('ctrl')
    if (event.altKey) keys.push('alt')
    if (event.shiftKey) keys.push('shift')
    keys.push(event.key.toLowerCase())

    const shortcut = keys.join('+')
    const callback = this.shortcuts.get(shortcut)

    if (callback) {
      event.preventDefault()
      callback()
    }
  }
}

// Usage
const shortcutManager = new KeyboardShortcutManager()

// Register common shortcuts
shortcutManager.register('ctrl+n', () => createNewItem())
shortcutManager.register('ctrl+s', () => saveCurrentItem())
shortcutManager.register('ctrl+z', () => undoLastAction())
shortcutManager.register('ctrl+y', () => redoLastAction())
shortcutManager.register('ctrl+f', () => focusSearchInput())
shortcutManager.register('f11', () => toggleFullscreen())

// Attach to document
document.addEventListener('keydown', (e) => shortcutManager.handleKeyDown(e))
```

## 🔧 Platform Detection & Adaptation

### Device Detection System
```typescript
// ✅ Comprehensive device detection
interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
  touchSupport: boolean
}

class DeviceDetector {
  private deviceInfo: DeviceInfo

  constructor() {
    this.deviceInfo = this.detectDevice()
    this.setupListeners()
  }

  private detectDevice(): DeviceInfo {
    const width = window.innerWidth
    const height = window.innerHeight

    let type: 'mobile' | 'tablet' | 'desktop' = 'desktop'
    if (width < 768) type = 'mobile'
    else if (width < 1024) type = 'tablet'

    const orientation = height > width ? 'portrait' : 'landscape'
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    return { type, orientation, touchSupport }
  }

  private setupListeners(): void {
    window.addEventListener('resize', () => {
      this.deviceInfo = this.detectDevice()
    })
  }

  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo }
  }
}
```

### Responsive Component System
```typescript
// ✅ Platform-adaptive component system
const AdaptiveComponent = <T extends {}>({
  mobile: MobileComponent,
  tablet: TabletComponent,
  desktop: DesktopComponent,
  ...props
}: {
  mobile: React.ComponentType<T>
  tablet: React.ComponentType<T>
  desktop: React.ComponentType<T>
} & T) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth
      if (width < 768) {
        setDeviceType('mobile')
      } else if (width < 1024) {
        setDeviceType('tablet')
      } else {
        setDeviceType('desktop')
      }
    }

    updateDeviceType()
    window.addEventListener('resize', updateDeviceType)
    return () => window.removeEventListener('resize', updateDeviceType)
  }, [])

  const Component = { mobile: MobileComponent, tablet: TabletComponent, desktop: DesktopComponent }[deviceType]

  return <Component {...props} />
}

// Usage
<AdaptiveComponent
  mobile={MobileButton}
  tablet={TabletButton}
  desktop={DesktopButton}
  onClick={handleClick}
  variant="primary"
>
  Click me
</AdaptiveComponent>
```

## 📊 Cross-Platform Testing Strategy

### Automated Testing Setup
```typescript
// ✅ Cross-platform test utilities
const createPlatformTest = (platform: 'mobile' | 'tablet' | 'desktop') => {
  const setupPlatform = () => {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 }
    }

    const viewport = viewports[platform]

    // Set viewport
    Object.defineProperty(window, 'innerWidth', { value: viewport.width })
    Object.defineProperty(window, 'innerHeight', { value: viewport.height })

    // Mock touch support
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: platform === 'mobile' ? 5 : 0
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
  }

  return {
    setupPlatform,
    test: (name: string, fn: () => void) => {
      it(`${name} on ${platform}`, () => {
        setupPlatform()
        fn()
      })
    }
  }
}

// Usage
const mobileTest = createPlatformTest('mobile')
const tabletTest = createPlatformTest('tablet')
const desktopTest = createPlatformTest('desktop')

describe('Button Component', () => {
  mobileTest.test('should have minimum touch target size', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveStyle({
      minHeight: '44px',
      minWidth: '44px'
    })
  })

  desktopTest.test('should support keyboard navigation', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')

    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button).toHaveFocus()
  })
})
```

### Visual Regression Testing
```typescript
// ✅ Visual testing across platforms
describe('Visual Regression Tests', () => {
  const platforms = ['mobile', 'tablet', 'desktop']

  platforms.forEach(platform => {
    it(`should match design on ${platform}`, async () => {
      // Set viewport
      await page.setViewportSize(
        platform === 'mobile' ? { width: 375, height: 667 } :
        platform === 'tablet' ? { width: 768, height: 1024 } :
        { width: 1920, height: 1080 }
      )

      // Navigate to page
      await page.goto('/dashboard')

      // Take screenshot
      const screenshot = await page.screenshot()

      // Compare with baseline
      expect(screenshot).toMatchVisualSnapshot(`${platform}-dashboard`)
    })
  })
})
```

## 🎯 Platform-Specific Best Practices

### Performance Optimization by Platform
```typescript
// ✅ Platform-aware performance optimization
const PerformanceOptimizer = {
  mobile: {
    imageQuality: 0.8,
    animationDuration: 200,
    bundleChunkSize: '100kb',
    cacheStrategy: 'network-first'
  },
  tablet: {
    imageQuality: 0.9,
    animationDuration: 300,
    bundleChunkSize: '200kb',
    cacheStrategy: 'cache-first'
  },
  desktop: {
    imageQuality: 1.0,
    animationDuration: 400,
    bundleChunkSize: '500kb',
    cacheStrategy: 'stale-while-revalidate'
  }
}

const getPlatformOptimizations = () => {
  const width = window.innerWidth
  if (width < 768) return PerformanceOptimizer.mobile
  if (width < 1024) return PerformanceOptimizer.tablet
  return PerformanceOptimizer.desktop
}
```

### Accessibility Across Platforms
- **Mobile**: Voice control, screen reader optimization, touch target sizing
- **Tablet**: Hybrid keyboard/touch navigation, orientation changes
- **Desktop**: Full keyboard navigation, high contrast support, screen reader compatibility

### Security Considerations
- **Mobile**: Biometric authentication, secure key storage
- **Tablet**: Multi-user support, session management
- **Desktop**: Certificate-based authentication, secure credential storage

This comprehensive cross-platform guidelines document ensures that applications provide optimal user experiences across all device types while maintaining consistent functionality, performance, and accessibility standards.