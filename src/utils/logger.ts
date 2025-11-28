// Simple logger utility for server-side logging
// This is a CommonJS/ESM compatible logger for use in server.js
/* eslint-disable no-console */

interface Logger {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
}

export function createLogger(context?: string): Logger {
  const prefix = context ? `[${context}]` : '';
  
  return {
    info: (message: string, data?: unknown) => {
      console.log(`${prefix} [INFO] ${message}`, data || '');
    },
    warn: (message: string, data?: unknown) => {
      console.warn(`${prefix} [WARN] ${message}`, data || '');
    },
    error: (message: string, data?: unknown) => {
      console.error(`${prefix} [ERROR] ${message}`, data || '');
    },
    debug: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${prefix} [DEBUG] ${message}`, data || '');
      }
    }
  };
}

// Default logger instance
export const logger = createLogger('Server');

