// ============================================================================
// SECURITY MODULE EXPORTS
// ============================================================================
// Centralized exports for all security services and utilities

export { EncryptionService, type KeyPair, type EncryptedData } from './EncryptionService';
export { SecureAPIClient, type RequestOptions, type APIResponse, type SecurityHeaders } from './SecureAPIClient';
export { InputValidator, type ValidationResult, type FileValidationResult } from './InputValidator';
export { AccessControlService, type Permission, type Role, type UserPermissions, type AccessRequest, type AccessDecision } from './AccessControlService';

// Re-export advanced security engines
export { ComplianceAutomationEngine } from './ComplianceAutomationEngine';
export { PrivacyAssessmentEngine } from './PrivacyAssessmentEngine';
export { SecurityChaosEngine } from './SecurityChaosEngine';
export { ThreatModelingEngine } from './ThreatModelingEngine';
export { VulnerabilityPredictionEngine } from './VulnerabilityPredictionEngine';
export { ZeroTrustEngine } from './ZeroTrustEngine';

// ============================================================================
// SECURITY SERVICE INSTANCES
// ============================================================================
// Pre-configured service instances for application use

import { EncryptionService } from './EncryptionService';
import { SecureAPIClient } from './SecureAPIClient';
import { InputValidator } from './InputValidator';
import { AccessControlService } from './AccessControlService';

// Global encryption service instance
export const encryptionService = new EncryptionService();

// Global secure API client instance - only create on client side
export const secureAPIClient = (() => {
  // Only create on client side
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Try to get from Vite environment variables
    const baseURL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) 
      || 'http://localhost:3001';
    
    return new SecureAPIClient(baseURL);
  } catch (e) {
    console.error('[Security] Failed to initialize SecureAPIClient:', e);
    return null;
  }
})();

// Global input validator instance
export const inputValidator = new InputValidator();

// Global access control service instance
export const accessControlService = new AccessControlService();

// Initialize default roles
accessControlService.initializeDefaultRoles();

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Initialize security services for the application
 */
export function initializeSecurity(): void {
  console.log('[Security] Initializing security services...');

  // Setup CSP if in browser environment
  if (typeof document !== 'undefined') {
    setupContentSecurityPolicy();
  }

  console.log('[Security] Security services initialized');
}

/**
 * Setup Content Security Policy
 */
function setupContentSecurityPolicy(): void {
  // Add CSP meta tag if not present
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
    document.head.appendChild(meta);
  }
}

/**
 * Security audit logging
 */
export function logSecurityEvent(event: string, details: any): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  };

  console.log('[Security Audit]', logEntry);

  // In production, this would send to a security monitoring service
  // securityMonitoringService.logEvent(logEntry);
}
