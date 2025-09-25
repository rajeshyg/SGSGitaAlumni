import { deviceDetector } from './device-detection'

export interface PerformanceConfig {
  imageQuality: number
  animationDuration: number
  bundleChunkSize: string
  preloadStrategy: 'aggressive' | 'conservative' | 'none'
  cacheStrategy: 'memory' | 'indexeddb' | 'none'
}

class PerformanceOptimizer {
  private config: PerformanceConfig | null = null

  constructor() {
    this.updateConfig()
    deviceDetector.onCapabilitiesChange(() => this.updateConfig())
  }

  private updateConfig() {
    const capabilities = deviceDetector.getCapabilities()

    switch (capabilities.type) {
      case 'mobile':
        this.config = {
          imageQuality: 0.8,
          animationDuration: 200,
          bundleChunkSize: '100kb',
          preloadStrategy: 'conservative',
          cacheStrategy: capabilities.supportsIndexedDB ? 'indexeddb' : 'memory'
        }
        break
      case 'tablet':
        this.config = {
          imageQuality: 0.9,
          animationDuration: 300,
          bundleChunkSize: '250kb',
          preloadStrategy: 'conservative',
          cacheStrategy: capabilities.supportsIndexedDB ? 'indexeddb' : 'memory'
        }
        break
      default: // desktop
        this.config = {
          imageQuality: 1.0,
          animationDuration: 400,
          bundleChunkSize: '500kb',
          preloadStrategy: 'aggressive',
          cacheStrategy: 'memory'
        }
    }
  }

  public getConfig(): PerformanceConfig {
    if (!this.config) {
      this.updateConfig()
    }
    return this.config!
  }

  public optimizeImage(src: string, quality?: number): string {
    const qualityValue = quality || this.getConfig().imageQuality
    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}quality=${Math.round(qualityValue * 100)}`
  }

  public getAnimationDuration(baseDuration: number): number {
    const capabilities = deviceDetector.getCapabilities()
    if (capabilities.type === 'mobile') {
      return Math.min(baseDuration, 200)
    }
    return baseDuration
  }

  public shouldPreload(resource: string): boolean {
    const config = this.getConfig()
    if (config.preloadStrategy === 'none') return false
    if (config.preloadStrategy === 'aggressive') return true

    // Conservative strategy: only preload critical resources
    return resource.includes('critical') ||
           resource.includes('hero') ||
           resource.includes('above-fold')
  }

  public getCacheStrategy(): 'memory' | 'indexeddb' | 'none' {
    return this.getConfig().cacheStrategy
  }

  public shouldUseLazyLoading(): boolean {
    const capabilities = deviceDetector.getCapabilities()
    return capabilities.type === 'mobile' || capabilities.screenWidth < 1024
  }

  public getImageLoadingStrategy(): 'eager' | 'lazy' {
    const capabilities = deviceDetector.getCapabilities()
    return capabilities.type === 'mobile' ? 'lazy' : 'eager'
  }

  public shouldDebounceInput(): boolean {
    const capabilities = deviceDetector.getCapabilities()
    return capabilities.type === 'mobile' // Debounce on mobile for performance
  }

  public getDebounceDelay(): number {
    const capabilities = deviceDetector.getCapabilities()
    return capabilities.type === 'mobile' ? 300 : 150
  }
}

export const performanceOptimizer = new PerformanceOptimizer()