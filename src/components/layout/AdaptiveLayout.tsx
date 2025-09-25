import React, { useState, useEffect } from 'react'
import { deviceDetector } from '@/lib/device-detection'

export interface AdaptiveLayoutProps {
  layouts: {
    mobile: React.ComponentType<any>
    tablet: React.ComponentType<any>
    desktop: React.ComponentType<any>
  }
  layoutProps?: Record<string, any>
}

export function AdaptiveLayout({
  layouts,
  layoutProps = {}
}: AdaptiveLayoutProps) {
  const [currentLayout, setCurrentLayout] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const updateLayout = () => {
      const capabilities = deviceDetector.getCapabilities()
      setCurrentLayout(capabilities.type)
    }

    updateLayout()

    return deviceDetector.onCapabilitiesChange(updateLayout)
  }, [])

  const LayoutComponent = layouts[currentLayout]
  return <LayoutComponent {...layoutProps} />
}

// Convenience hook for using adaptive layouts
export function useAdaptiveLayout() {
  const [layout, setLayout] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const updateLayout = () => {
      const capabilities = deviceDetector.getCapabilities()
      setLayout(capabilities.type)
    }

    updateLayout()

    return deviceDetector.onCapabilitiesChange(updateLayout)
  }, [])

  return layout
}