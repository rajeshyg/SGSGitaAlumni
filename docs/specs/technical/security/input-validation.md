---
title: Input Validation Specification
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: all
enforcement: required
---

# Input Validation

## Overview

Comprehensive input validation and sanitization to prevent injection attacks, XSS, and other input-based vulnerabilities.

## Implementation Status: Complete

## SQL Injection Prevention

### Parameterized Queries

All database queries use parameterized statements to prevent SQL injection.

```javascript
// CORRECT - Parameterized query
const getUser = async (userId) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  return await db.query(query, [userId]);
};

// INCORRECT - Never do this
const getUser = async (userId) => {
  const query = `SELECT * FROM users WHERE id = ${userId}`; // VULNERABLE
  return await db.query(query);
};
```

### ORM Usage

When using ORM (Sequelize/Knex), built-in parameterization is enforced:

```javascript
// Sequelize example
const user = await User.findOne({
  where: { id: userId } // Automatically parameterized
});

// Knex example
const user = await knex('users')
  .where('id', userId) // Automatically parameterized
  .first();
```

## XSS Prevention

### Content Security Policy

```javascript
// config/security.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"]
    }
  }
}));
```

### Output Encoding

```javascript
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
```

### HTML Sanitization

```javascript
const sanitizeHtml = require('sanitize-html');

const sanitizeUserContent = (content) => {
  return sanitizeHtml(content, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    allowedAttributes: {
      'a': ['href']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
};
```

## Input Sanitization

### Validation Middleware

```javascript
// middleware/validation.js
const { validationResult, body } = require('express-validator');

const validateUserInput = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name must contain only letters and spaces'),

  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Invalid phone format'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### Schema Validation

```javascript
// validators/userValidator.js
const Joi = require('joi');

const userSchema = Joi.object({
  name: Joi.string().min(1).max(100).pattern(/^[a-zA-Z\s]+$/).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  graduationYear: Joi.number().min(1950).max(new Date().getFullYear()).required()
});

const validateUser = (data) => {
  return userSchema.validate(data, { abortEarly: false });
};
```

## Request Validation

### Size Limits

```javascript
// Limit request body size
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// File upload limits
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  }
});
```

### Content Type Validation

```javascript
const validateContentType = (req, res, next) => {
  const contentType = req.headers['content-type'];

  if (req.method === 'POST' || req.method === 'PUT') {
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        error: 'Unsupported Media Type'
      });
    }
  }

  next();
};
```

## File Upload Validation

```javascript
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage: multer.diskStorage({...}),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
```

## API Input Validation

### Request Parameter Validation

```javascript
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: error.details
      });
    }
    next();
  };
};

// Usage
router.get('/users/:id',
  validateParams(Joi.object({ id: Joi.string().uuid() })),
  userController.getUser
);
```

### Query Parameter Validation

```javascript
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }
    req.query = value; // Use sanitized values
    next();
  };
};
```

## Error Handling

### Generic Error Messages

```javascript
// Don't expose internal errors
const errorHandler = (err, req, res, next) => {
  console.error(err); // Log for debugging

  // Send generic message to client
  res.status(500).json({
    error: 'An error occurred processing your request'
  });
};
```

## Code References

| Component | File Path |
|-----------|-----------|
| Validation Middleware | `middleware/validation.js` |
| Validators | `validators/` |
| Security Config | `config/security.js` |

## E2E Tests

- `tests/e2e/api.spec.ts` - API input validation tests

## OWASP Alignment

This specification addresses:
- **A03:2021 - Injection**: Parameterized queries, input validation
- **A07:2021 - XSS**: CSP, output encoding, HTML sanitization

## Related Specifications

- [Data Protection](./data-protection.md) - Data handling after validation
- [Security Overview](./README.md) - Overall security architecture
