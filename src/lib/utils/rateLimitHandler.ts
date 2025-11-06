// ============================================================================
// CLIENT-SIDE RATE LIMIT HANDLER
// ============================================================================
// Utility for handling 429 rate limit responses from the API

import { AxiosError } from 'axios';

export interface RateLimitError {
  rateLimited: true;
  retryAfter: number; // seconds
  resetTime: Date;
  limit: number;
  policy: string;
  message: string;
}

export interface RateLimitHeaders {
  'x-ratelimit-limit'?: string;
  'x-ratelimit-remaining'?: string;
  'x-ratelimit-reset'?: string;
  'x-ratelimit-policy'?: string;
  'retry-after'?: string;
}

/**
 * Check if error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): error is AxiosError {
  return (
    error instanceof Error &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    error.response.status === 429
  );
}

/**
 * Extract rate limit information from error response
 */
export function extractRateLimitInfo(error: AxiosError): RateLimitError | null {
  if (!isRateLimitError(error)) {
    return null;
  }

  const response = error.response;
  const headers = response?.headers as RateLimitHeaders;
  const data = response?.data as any;

  const retryAfter = parseInt(headers['retry-after'] || data?.retryAfter || '60');
  const resetTime = headers['x-ratelimit-reset'] 
    ? new Date(headers['x-ratelimit-reset'])
    : new Date(Date.now() + retryAfter * 1000);

  return {
    rateLimited: true,
    retryAfter,
    resetTime,
    limit: parseInt(headers['x-ratelimit-limit'] || '0'),
    policy: headers['x-ratelimit-policy'] || 'unknown',
    message: data?.message || `Rate limit exceeded. Please wait ${retryAfter} seconds.`
  };
}

/**
 * Show rate limit error notification
 * Note: This is a simple alert. Replace with your preferred notification system
 */
export function showRateLimitNotification(rateLimitInfo: RateLimitError): void {
  const { message } = rateLimitInfo;
  console.error('[Rate Limit]', message);
  // TODO: Replace with your notification system (toast, alert, etc.)
  // Example: toast.error(message);
}

/**
 * Format retry-after time for display
 */
export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get user-friendly message for rate limit policy
 */
export function getRateLimitMessage(policy: string, retryAfter: number): string {
  const timeStr = formatRetryAfter(retryAfter);
  
  const messages: Record<string, string> = {
    otp: `Too many OTP requests. Please wait ${timeStr} before trying again.`,
    login: `Too many login attempts. Please wait ${timeStr} before trying again.`,
    invitations: `Too many invitation requests. Please wait ${timeStr} before sending more.`,
    email: `Too many emails sent. Please wait ${timeStr} before sending more.`,
    search: `Too many search requests. Please wait ${timeStr} before searching again.`,
    registration: `Too many registration attempts. Please wait ${timeStr} before trying again.`,
    default: `Too many requests. Please wait ${timeStr} before trying again.`,
  };

  return messages[policy] || messages.default;
}

/**
 * Handle rate limit error with automatic retry
 */
export async function handleRateLimitWithRetry<T>(
  apiCall: () => Promise<T>,
  options: {
    maxRetries?: number;
    showToast?: boolean;
    onRateLimited?: (info: RateLimitError) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, showToast = true, onRateLimited } = options;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (!isRateLimitError(error)) {
        throw error; // Not a rate limit error, rethrow
      }

      const rateLimitInfo = extractRateLimitInfo(error);
      
      if (!rateLimitInfo) {
        throw error;
      }

      // Callback for custom handling
      onRateLimited?.(rateLimitInfo);

      // Show notification if enabled
      if (showToast) {
        const message = getRateLimitMessage(
          rateLimitInfo.policy,
          rateLimitInfo.retryAfter
        );
        console.error(`[Rate Limit] ${message}`);
        // TODO: Replace with your notification system
        // Example: toast.error(message);
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Wait before retrying
      await delay(rateLimitInfo.retryAfter * 1000);
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if rate limit is active for a specific operation
 * Returns null if no rate limit, or RateLimitError if limited
 */
export function checkLocalRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): RateLimitError | null {
  const now = Date.now();
  const storageKey = `ratelimit_${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      // First request, initialize
      localStorage.setItem(storageKey, JSON.stringify({
        count: 1,
        windowStart: now
      }));
      return null;
    }

    const data = JSON.parse(stored);
    const windowEnd = data.windowStart + windowMs;

    // Check if window has expired
    if (now > windowEnd) {
      // Reset window
      localStorage.setItem(storageKey, JSON.stringify({
        count: 1,
        windowStart: now
      }));
      return null;
    }

    // Within window, check count
    if (data.count >= maxRequests) {
      const retryAfter = Math.ceil((windowEnd - now) / 1000);
      return {
        rateLimited: true,
        retryAfter,
        resetTime: new Date(windowEnd),
        limit: maxRequests,
        policy: 'client-side',
        message: `Please wait ${formatRetryAfter(retryAfter)} before trying again.`
      };
    }

    // Increment count
    localStorage.setItem(storageKey, JSON.stringify({
      count: data.count + 1,
      windowStart: data.windowStart
    }));

    return null;
  } catch (error) {
    console.error('Local rate limit check failed:', error);
    return null; // Allow request on error
  }
}

/**
 * Clear local rate limit for a key
 */
export function clearLocalRateLimit(key: string): void {
  const storageKey = `ratelimit_${key}`;
  localStorage.removeItem(storageKey);
}

/**
 * Get remaining requests for a key
 */
export function getRemainingRequests(
  key: string,
  maxRequests: number
): number {
  const storageKey = `ratelimit_${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) {
      return maxRequests;
    }

    const data = JSON.parse(stored);
    return Math.max(0, maxRequests - data.count);
  } catch (error) {
    console.error('Failed to get remaining requests:', error);
    return maxRequests;
  }
}
