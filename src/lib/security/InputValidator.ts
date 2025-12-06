// ============================================================================
// INPUT VALIDATOR
// ============================================================================
// Comprehensive input validation and sanitization

import DOMPurify from 'dompurify';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: any;
}

export interface FileValidationResult extends ValidationResult {
  valid: boolean;
  errors: string[];
  file?: File;
}

export class InputValidator {
  // Schema-based validation using simple validation rules
  private static readonly VALIDATION_RULES: Record<string, any> = {
    username: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/,
      message: 'Username must be 3-50 characters, letters, numbers, and underscores only'
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    },
    password: {
      minLength: 12,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: 'Password must be 12-128 characters with uppercase, lowercase, number, and special character'
    },
    age: {
      min: 13,
      max: 120,
      message: 'Age must be between 13 and 120'
    },
    name: {
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\-']+$/,
      message: 'Name must contain only letters, spaces, hyphens, and apostrophes'
    },
    phone: {
      pattern: /^[\d\s\-\(\)+]+$/,
      message: 'Invalid phone number format. Use (555) 123-4567 or +1 555 123 4567 for US, or +[country code] for international'
    }
  };

  /**
   * Validate user registration data
   */
  static validateUserRegistration(data: any): ValidationResult {
    const errors: string[] = [];

    // Username validation
    if (!data.username || typeof data.username !== 'string') {
      errors.push('Username is required');
    } else {
      const usernameResult = this.validateField(data.username, 'username');
      if (!usernameResult.valid) errors.push(...usernameResult.errors);
    }

    // Email validation
    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required');
    } else {
      const emailResult = this.validateField(data.email, 'email');
      if (!emailResult.valid) errors.push(...emailResult.errors);
    }

    // Password validation
    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    } else {
      const passwordResult = this.validateField(data.password, 'password');
      if (!passwordResult.valid) errors.push(...passwordResult.errors);
    }

    // Age validation (for COPPA compliance)
    if (data.age !== undefined) {
      const ageResult = this.validateField(data.age, 'age');
      if (!ageResult.valid) errors.push(...ageResult.errors);
    }

    // Name validation
    if (data.firstName) {
      const firstNameResult = this.validateField(data.firstName, 'name');
      if (!firstNameResult.valid) errors.push(...firstNameResult.errors);
    }

    if (data.lastName) {
      const lastNameResult = this.validateField(data.lastName, 'name');
      if (!lastNameResult.valid) errors.push(...lastNameResult.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeUserData(data) : undefined
    };
  }

  /**
   * Validate login credentials
   */
  static validateLoginCredentials(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data.username || typeof data.username !== 'string') {
      errors.push('Username is required');
    }

    if (!data.password || typeof data.password !== 'string') {
      errors.push('Password is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeLoginData(data) : undefined
    };
  }

  /**
   * Validate profile update data
   */
  static validateProfileUpdate(data: any): ValidationResult {
    const errors: string[] = [];

    // Validate optional fields
    if (data.firstName !== undefined) {
      const result = this.validateField(data.firstName, 'name');
      if (!result.valid) errors.push(`First name: ${result.errors.join(', ')}`);
    }

    if (data.lastName !== undefined) {
      const result = this.validateField(data.lastName, 'name');
      if (!result.valid) errors.push(`Last name: ${result.errors.join(', ')}`);
    }

    if (data.email !== undefined) {
      const result = this.validateField(data.email, 'email');
      if (!result.valid) errors.push(`Email: ${result.errors.join(', ')}`);
    }

    if (data.phone !== undefined && data.phone !== '') {
      const result = this.validateField(data.phone, 'phone');
      if (!result.valid) errors.push(`Phone: ${result.errors.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeProfileData(data) : undefined
    };
  }

  /**
   * Validate a single field against predefined rules
   */
  static validateField(value: any, fieldType: keyof typeof InputValidator.VALIDATION_RULES): ValidationResult {
    const rule = this.VALIDATION_RULES[fieldType];
    const errors: string[] = [];

    if (value === null || value === undefined) {
      return { valid: false, errors: ['Value is required'] };
    }

    // Type checking
    if (fieldType === 'age' && typeof value !== 'number') {
      errors.push('Must be a number');
    } else if (fieldType !== 'age' && typeof value !== 'string') {
      errors.push('Must be a string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors.push(`Minimum length is ${rule.minLength} characters`);
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      errors.push(`Maximum length is ${rule.maxLength} characters`);
    }

    // Range validation for numbers
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`Must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`Must be at most ${rule.max}`);
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push(rule.message);
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? this.sanitizeString(value) : undefined
    };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, options: {
    allowedTypes?: string[];
    maxSize?: number;
    required?: boolean;
  } = {}): FileValidationResult {
    const errors: string[] = [];
    const { allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024 } = options;

    if (!file) {
      if (options.required) {
        errors.push('File is required');
      }
      return { valid: false, errors };
    }

    // Type validation
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Size validation
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      errors.push(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Security checks
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
      errors.push('Invalid file name');
    }

    return {
      valid: errors.length === 0,
      errors,
      file: errors.length === 0 ? file : undefined
    };
  }

  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(input: string, options: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  } = {}): string {
    const defaultTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'];
    const defaultAttributes = ['href', 'target'];

    const config = {
      ALLOWED_TAGS: options.allowedTags || defaultTags,
      ALLOWED_ATTR: options.allowedAttributes || defaultAttributes,
      ALLOW_DATA_ATTR: false
    };

    return DOMPurify.sanitize(input, config);
  }

  /**
   * Sanitize string input (remove potentially dangerous characters)
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .trim()
      .replace(/[<>'"&]/g, '') // Remove HTML characters
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .substring(0, 10000); // Limit length
  }

  /**
   * Sanitize SQL input (basic protection against SQL injection)
   */
  static sanitizeSQL(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/['"\\;]/g, '\\$&')
      .substring(0, 1000); // Limit length
  }

  /**
   * Escape HTML entities
   */
  static escapeHTML(input: string): string {
    if (typeof input !== 'string') return '';

    const entityMap: { [key: string]: string } = {
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"',
      "'": '&#x27;',
      '/': '&#x2F;'
    };

    return input.replace(/[&<>"'/]/g, (char) => entityMap[char]);
  }

  /**
   * Validate URL
   */
  static validateURL(url: string): ValidationResult {
    try {
      const parsedUrl = new URL(url);

      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, errors: ['Only HTTP and HTTPS URLs are allowed'] };
      }

      // Basic domain validation
      if (!parsedUrl.hostname.includes('.')) {
        return { valid: false, errors: ['Invalid domain name'] };
      }

      return { valid: true, errors: [], sanitized: parsedUrl.toString() };
    } catch {
      return { valid: false, errors: ['Invalid URL format'] };
    }
  }

  /**
   * Sanitize user data for storage
   */
  private static sanitizeUserData(data: any): any {
    return {
      username: this.sanitizeString(data.username),
      email: this.sanitizeString(data.email).toLowerCase(),
      password: data.password, // Don't sanitize passwords
      firstName: data.firstName ? this.sanitizeString(data.firstName) : undefined,
      lastName: data.lastName ? this.sanitizeString(data.lastName) : undefined,
      age: data.age,
      phone: data.phone ? this.sanitizeString(data.phone) : undefined
    };
  }

  /**
   * Sanitize login data
   */
  private static sanitizeLoginData(data: any): any {
    return {
      username: this.sanitizeString(data.username),
      password: data.password // Don't sanitize passwords
    };
  }

  /**
   * Sanitize profile data
   */
  private static sanitizeProfileData(data: any): any {
    const sanitized: any = {};

    Object.keys(data).forEach(key => {
      if (key === 'password') {
        sanitized[key] = data[key]; // Don't sanitize passwords
      } else if (typeof data[key] === 'string') {
        sanitized[key] = this.sanitizeString(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    });

    return sanitized;
  }
}