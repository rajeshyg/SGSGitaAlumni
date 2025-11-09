// ============================================================================
// SIMPLE LOGGER UTILITY
// ============================================================================
// Provides logging with history for debugging

export interface LogEntry {
  timestamp: number;
  level: 'info' | 'debug' | 'error';
  message: string;
  args: any[];
}

export class Logger {
  private history: LogEntry[] = [];
  private maxHistorySize = 100;

  info(message: string, ...args: any[]) {
    console.log(`[INFO] ${message}`, ...args);
    this.addToHistory('info', message, args);
  }

  debug(message: string, ...args: any[]) {
    console.log(`[DEBUG] ${message}`, ...args);
    this.addToHistory('debug', message, args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
    this.addToHistory('error', message, args);
  }

  private addToHistory(level: 'info' | 'debug' | 'error', message: string, args: any[]) {
    this.history.push({
      timestamp: Date.now(),
      level,
      message,
      args: args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      )
    });

    // Keep only the last maxHistorySize entries
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  getLogHistory(): LogEntry[] {
    return [...this.history];
  }

  clearLogHistory() {
    this.history = [];
  }
}

export const logger = new Logger();
export default logger;
