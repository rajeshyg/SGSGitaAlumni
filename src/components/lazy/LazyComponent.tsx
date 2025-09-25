import React, { Suspense, lazy, ComponentType, useState, useEffect } from 'react'
import { performanceOptimizer } from '@/lib/performance-optimization'
import { deviceDetector } from '@/lib/device-detection'

export interface LazyComponentProps {
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
      const capabilities = deviceDetector.getCapabilities()
      const delay = capabilities.type === 'mobile' ? 100 : 0
      const timer = setTimeout(loadComponent, delay)
      return () => clearTimeout(timer)
    }
  }, [importFunc, preload])

  if (isLoading || !LazyLoadedComponent) {
    return Fallback ? <Fallback /> : <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
  }

  return <LazyLoadedComponent {...componentProps} />
}

// Hook for performance-aware lazy loading
export function useLazyPerformance() {
  const [config, setConfig] = useState(performanceOptimizer.getConfig())

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
    shouldPreload: performanceOptimizer.shouldPreload.bind(performanceOptimizer),
    shouldUseLazyLoading: performanceOptimizer.shouldUseLazyLoading.bind(performanceOptimizer),
    getImageLoadingStrategy: performanceOptimizer.getImageLoadingStrategy.bind(performanceOptimizer)
  }
}