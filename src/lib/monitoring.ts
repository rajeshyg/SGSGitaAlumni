// Monitoring utilities
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, ...args)
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args)
  }
}

export const performanceMonitor = {
  start: (label: string) => {
    if (import.meta.env.DEV) {
      console.time(label)
    }
  },
  end: (label: string) => {
    if (import.meta.env.DEV) {
      console.timeEnd(label)
    }
  }
}