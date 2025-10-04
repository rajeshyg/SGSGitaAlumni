// Simple logger utility for server-side logging
// This is a CommonJS/ESM compatible logger for use in server.js

export function createLogger(context) {
  const prefix = context ? `[${context}]` : '';
  
  return {
    info: (message, data) => {
      console.log(`${prefix} [INFO] ${message}`, data || '');
    },
    warn: (message, data) => {
      console.warn(`${prefix} [WARN] ${message}`, data || '');
    },
    error: (message, data) => {
      console.error(`${prefix} [ERROR] ${message}`, data || '');
    },
    debug: (message, data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${prefix} [DEBUG] ${message}`, data || '');
      }
    }
  };
}

// Default logger instance
export const logger = createLogger('Server');

