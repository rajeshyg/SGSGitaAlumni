# SGS Gita Connect

A modern React-based alumni management platform with advanced data table functionality, theme system, and robust development tooling.

---

## 🤖 Working with AI Agents?

**Start here**: [`docs/specs/context/always-on.md`](docs/specs/context/always-on.md) — Designed for both humans and AI models to understand the project, tech stack, and Scout-Plan-Build workflow (SDD framework).

Also see: [`claude.md`](claude.md) for a quick pointer to all essential context.

## 🚀 Features

- **Advanced Data Tables**: TanStack Table with sorting, filtering, pagination, and inline editing
- **Theme System**: Multiple themes (Default, Dark, Gita, Professional) with CSS variables
- **Type-Safe**: Full TypeScript implementation
- **Modern UI**: Shadcn/ui components with Tailwind CSS
- **Testing**: Vitest + React Testing Library
- **Quality Gates**: ESLint, Husky pre-commit hooks, automated checks

## 🛠️ Development Tools

### Quality Assurance
- **ESLint + SonarJS**: Advanced code linting with redundancy detection
- **jscpd**: Professional duplicate code detection
- **Husky**: Git hooks for pre-commit quality checks
- **Vitest**: Fast unit testing framework
- **React Testing Library**: Component testing utilities

### Monitoring & Error Tracking
- **Sentry**: Real-time error tracking and performance monitoring
- **Bundle Analyzer**: Visual bundle size analysis and optimization
- **Error Boundaries**: Enhanced error handling with Sentry integration

### Code Quality Rules
- ❌ No console statements in production code
- 📏 Files limited to 500 lines maximum (AI context optimization)
- 🔧 Functions limited to 50 lines maximum
- 🗑️ No unused imports or variables
- 📦 No duplicate imports
- 🔍 **SonarJS Rules**: Advanced redundancy detection
- 📊 **jscpd**: Copy-paste detection (10+ lines, 50+ tokens)

See [Quality Standards](docs/specs/technical/coding-standards/README.md) for complete coding guidelines and metrics.

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Testing
```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📋 Development Guidelines

### Code Organization
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   └── dashboard/      # Dashboard-specific components
├── pages/              # Route components
├── lib/                # Utilities and configurations
│   ├── theme/          # Theme system
│   └── api/            # API utilities
├── hooks/              # Custom React hooks
└── test/               # Test utilities
```

### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLazyData.ts`)
- **Types**: PascalCase with descriptive names (e.g., `UserProfile`)

### Testing Strategy
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: User workflows (future implementation)

### Commit Guidelines
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Pre-commit hooks will enforce code quality
- Keep commits focused and atomic

## 🔧 Tool Configuration

See [Technical Specifications](docs/specs/technical/README.md) for complete setup instructions and configuration details.

## 🚫 Preventing Redundancy

See [Quality Standards](docs/specs/technical/coding-standards/README.md) for comprehensive redundancy prevention guidelines and automated quality checks.

## 📚 Documentation

### Specifications (Primary Reference)
- [Technical Specifications](docs/specs/technical/README.md) - All technical standards
- [Functional Specifications](docs/specs/functional/) - Feature specifications
- [Context & Patterns](docs/specs/context/always-on.md) - Essential development context

### Key Technical Docs
- [Architecture Overview](docs/specs/technical/architecture/README.md)
- [Theme System](docs/specs/technical/ui-standards/theme-system.md) - **Critical for UI work**
- [Code Review Checklist](docs/specs/technical/coding-standards/code-review-checklist.md)
- [Security Standards](docs/specs/technical/security/README.md)

### Development Guides
- [Spec-Driven Development](docs/spec-driven-development/README.md) - SDD framework
- [Feature Matrix](docs/FEATURE_MATRIX.md) - Feature status tracking

## 📊 Quality Improvements

### Phase 1 Achievements
- ✅ **ESLint Errors Reduced**: 473 → 205 (56% improvement)
- ✅ **Industry-Standard Tools**: Replaced custom scripts with jscpd + SonarJS
- ✅ **Advanced Detection**: SonarJS finds duplicate strings, identical functions
- ✅ **AI Optimization**: Maintained 300-line file limits for context efficiency
- ✅ **Modern Configuration**: Upgraded to ESLint 9 flat config

### Current Quality Gates
- 🔍 **Redundancy Detection**: jscpd + SonarJS active
- 📏 **File Size Limits**: 500 lines max (AI context optimized)
- 🔧 **Function Complexity**: 50 lines max, complexity score ≤10
- ❌ **Zero Console**: Production code free of debug statements
- ✅ **Test Coverage**: Automated testing pipeline
- 📊 **Bundle Monitoring**: Size analysis and performance tracking
- 🚨 **Error Tracking**: Sentry integration for production monitoring

### Environment Configuration
Create `.env.local` for local development:
```bash
# Sentry Configuration (get from https://sentry.io)
VITE_SENTRY_DSN=https://your-sentry-dsn-here

# Environment
NODE_ENV=development
```

## 🤖 AI Assistant Guidelines

See [Spec-Driven Development](docs/spec-driven-development/README.md) for comprehensive AI assistance protocols and best practices.

## 📈 CI/CD

GitHub Actions workflow includes:
- Code linting
- Unit tests
- Build verification
- Quality gate enforcement

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the guidelines
4. Ensure tests pass and code lints
5. Submit a pull request

## 📄 License

This project is part of the SGSGita Alumni system.
