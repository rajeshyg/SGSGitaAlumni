export interface DeviceCapabilities {
  type: 'mobile' | 'tablet' | 'desktop'
  touchSupport: boolean
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  orientation: 'portrait' | 'landscape'
  userAgent: string
  platform: string
  supportsWebGL: boolean
  supportsWebRTC: boolean
  supportsServiceWorker: boolean
  supportsIndexedDB: boolean
  memory?: number // Available memory in GB
  cores?: number // CPU cores
}

class DeviceDetector {
  private capabilities: DeviceCapabilities | null = null
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.updateCapabilities()
    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.updateCapabilities())
      window.addEventListener('orientationchange', () => this.updateCapabilities())
    }
  }

  private updateCapabilities() {
    if (typeof window === 'undefined') return

    const width = window.innerWidth
    const height = window.innerHeight
    const pixelRatio = window.devicePixelRatio || 1

    // Determine device type based on screen width
    let type: 'mobile' | 'tablet' | 'desktop'
    if (width < 768) {
      type = 'mobile'
    } else if (width < 1024) {
      type = 'tablet'
    } else {
      type = 'desktop'
    }

    // Check touch support
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Determine orientation
    const orientation: 'portrait' | 'landscape' = height > width ? 'portrait' : 'landscape'

    // Check feature support
    const supportsWebGL = (() => {
      try {
        const canvas = document.createElement('canvas')
        return !!(window.WebGLRenderingContext && canvas.getContext('webgl'))
      } catch (e) {
        return false
      }
    })()

    const supportsWebRTC = !!(window.RTCPeerConnection || (window as any).webkitRTCPeerConnection)
    const supportsServiceWorker = 'serviceWorker' in navigator
    const supportsIndexedDB = 'indexedDB' in window

    // Get hardware info if available
    const memory = (navigator as any).deviceMemory
    const cores = navigator.hardwareConcurrency

    this.capabilities = {
      type,
      touchSupport,
      screenWidth: width,
      screenHeight: height,
      pixelRatio,
      orientation,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      supportsWebGL,
      supportsWebRTC,
      supportsServiceWorker,
      supportsIndexedDB,
      memory,
      cores
    }

    // Notify listeners
    this.listeners.forEach(listener => listener())
  }

  public getCapabilities(): DeviceCapabilities {
    if (!this.capabilities) {
      this.updateCapabilities()
    }
    return this.capabilities!
  }

  public onCapabilitiesChange(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  public isMobile(): boolean {
    return this.getCapabilities().type === 'mobile'
  }

  public isTablet(): boolean {
    return this.getCapabilities().type === 'tablet'
  }

  public isDesktop(): boolean {
    return this.getCapabilities().type === 'desktop'
  }

  public isTouchDevice(): boolean {
    return this.getCapabilities().touchSupport
  }

  public getBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
    const width = this.getCapabilities().screenWidth
    if (width < 640) return 'xs'
    if (width < 768) return 'sm'
    if (width < 1024) return 'md'
    if (width < 1280) return 'lg'
    if (width < 1536) return 'xl'
    return '2xl'
  }

  public shouldUseMobileLayout(): boolean {
    return this.getCapabilities().screenWidth < 768
  }

  public shouldUseTabletLayout(): boolean {
    const width = this.getCapabilities().screenWidth
    return width >= 768 && width < 1024
  }

  public shouldUseDesktopLayout(): boolean {
    return this.getCapabilities().screenWidth >= 1024
  }
}

export const deviceDetector = new DeviceDetector()