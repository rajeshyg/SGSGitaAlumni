/**
 * Validation Middleware for Express Routes
 * Uses Zod schemas to validate request body, query, and params
 * 
 * @module server/middleware/validation
 */

import { ZodError } from 'zod';

/**
 * Validation error structure
 * @typedef {Object} ValidationError
 * @property {string} field - Field path (e.g., "body.email")
 * @property {string} message - Error message
 */

/**
 * Formats Zod errors into a consistent structure
 * @param {ZodError} error - Zod validation error
 * @param {string} location - Location of validation (body, query, params)
 * @returns {ValidationError[]} - Formatted error array
 */
function formatZodErrors(error, location) {
  // Zod errors always have an errors array
  if (!error || !error.errors || !Array.isArray(error.errors)) {
    console.error('[Validation] Unexpected error format:', error);
    return [{
      field: location,
      message: 'Validation failed'
    }];
  }
  
  return error.errors.map(err => ({
    field: `${location}.${err.path.join('.')}`,
    message: err.message
  }));
}

/**
 * Creates a validation middleware for Express routes
 * @param {Object} schema - Schema object with body, query, and/or params Zod schemas
 * @param {import('zod').ZodSchema} [schema.body] - Schema for request body
 * @param {import('zod').ZodSchema} [schema.query] - Schema for query parameters
 * @param {import('zod').ZodSchema} [schema.params] - Schema for URL parameters
 * @returns {Function} - Express middleware function
 * 
 * @example
 * import { LoginSchema } from '../src/schemas/validation/index.js';
 * router.post('/login', validateRequest({ body: LoginSchema }), loginHandler);
 */
export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      const validationErrors = [];

      // Validate body
      if (schema.body) {
        try {
          req.body = await schema.body.parseAsync(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            validationErrors.push(...formatZodErrors(error, 'body'));
          }
        }
      }

      // Validate query
      if (schema.query) {
        try {
          req.query = await schema.query.parseAsync(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            validationErrors.push(...formatZodErrors(error, 'query'));
          }
        }
      }

      // Validate params
      if (schema.params) {
        try {
          req.params = await schema.params.parseAsync(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            validationErrors.push(...formatZodErrors(error, 'params'));
          }
        }
      }

      // If any validation errors, return 400
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationErrors
          }
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Example usage in routes:
 * 
 * import { validateRequest } from './middleware/validation.js';
 * import { LoginSchema, OTPGenerateSchema } from '../src/schemas/validation/index.js';
 * 
 * // Login route with validation
 * router.post('/login',
 *   validateRequest({ body: LoginSchema }),
 *   async (req, res) => {
 *     const { email, password } = req.body; // Now validated and typed
 *     // ... login logic
 *   }
 * );
 * 
 * // OTP generation with validation
 * router.post('/otp/generate',
 *   validateRequest({ body: OTPGenerateSchema }),
 *   async (req, res) => {
 *     const { email, type } = req.body; // Validated
 *     // ... OTP generation logic
 *   }
 * );
 */
