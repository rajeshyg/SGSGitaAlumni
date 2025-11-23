---
title: Unit Testing Patterns
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: frontend
framework: vitest
---

# Unit Testing Patterns

Unit testing standards and patterns using Vitest and React Testing Library.

## Vitest Configuration

The project uses Vitest for unit testing. Configuration is in `/vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/api-test-setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  }
})
```

## Component Testing with React Testing Library

### Test Structure Pattern

Follow the AAA (Arrange, Act, Assert) pattern:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it('should throw error with invalid email', async () => {
      // Arrange
      const invalidData = { name: 'John', email: 'invalid-email' };

      // Act & Assert
      await expect(service.createUser(invalidData)).rejects.toThrow();
    });
  });
});
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  beforeEach(() => {
    // Setup test data
  });

  afterEach(() => {
    // Cleanup
  });

  describe('happy path', () => {
    it('should submit form with valid credentials', async () => {
      const onSubmit = vi.fn();
      render(<LoginForm onSubmit={onSubmit} />);

      await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  describe('error cases', () => {
    it('should display validation error for invalid email', async () => {
      render(<LoginForm onSubmit={vi.fn()} />);

      await userEvent.type(screen.getByLabelText('Email'), 'invalid');
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

## Mocking Patterns

### API Mocking with MSW

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: 'John' }]));
  }),

  rest.post('/api/users', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 2, ...req.body }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Module Mocking

```typescript
// Mock a module
vi.mock('@/services/api', () => ({
  fetchUsers: vi.fn().mockResolvedValue([{ id: 1, name: 'Test' }])
}));

// Mock with implementation
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true
  })
}));
```

### Timer Mocking

```typescript
describe('debounced search', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce search input', async () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    await userEvent.type(screen.getByRole('textbox'), 'test');

    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
```

## Test Organization

```
src/
  components/
    LoginForm/
      LoginForm.tsx
      LoginForm.test.tsx    # Co-located tests
  services/
    auth/
      authService.ts
      authService.test.ts
tests/
  api/                      # API integration tests
  unit/                     # Standalone unit tests
  setup/                    # Test configuration
```

## Best Practices

### Do

- Test component behavior from user perspective
- Use `screen` queries for better error messages
- Prefer `userEvent` over `fireEvent` for realistic interactions
- Write descriptive test names that explain the scenario
- Mock external dependencies at the boundary

### Don't

```typescript
// Bad: Testing implementation details
it('should call API with correct headers', () => {
  // This tests implementation, not behavior
});

// Bad: Brittle selectors
expect(container.querySelector('.btn-primary')).toBeInTheDocument();

// Bad: No assertions
it('should render component', () => {
  render(<Component />);
  // Missing assertions
});
```

## Test Checklist

- [ ] Test covers happy path scenarios
- [ ] Test covers error conditions
- [ ] Test covers edge cases
- [ ] Mock external dependencies
- [ ] Test is isolated and repeatable
- [ ] Test has descriptive name
- [ ] Test follows AAA pattern

## Reference Files

- Setup: `/src/test/setup.ts`
- Mock data: `/src/test/mockData.test.ts`
- Configuration: `/vitest.config.ts`
