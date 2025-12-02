---
version: 1.0
status: pending
last_updated: 2025-11-27
applies_to: architecture
---

# Mobile Native UI Extensibility

## Overview

This document outlines how the development framework can be extended to support mobile native UI layers (React Native, iOS, Android) while maintaining the existing web application and backend infrastructure.

The framework is designed to be platform-agnostic, with shared business logic and platform-specific UI implementations.

---

## Architecture Principles

### 1. **Separation of Concerns**
```
┌─────────────────────────────────────────────────┐
│                  Backend (API)                  │
│  Node.js + Express + MySQL (Platform-agnostic) │
└────────────────┬────────────────────────────────┘
                 │ REST/WebSocket APIs
        ┌────────┴─────────┐
        │                  │
┌───────▼──────┐   ┌──────▼───────┐
│   Web UI     │   │  Mobile UI   │
│  React 18    │   │ React Native │
│  TypeScript  │   │ TypeScript   │
└──────────────┘   └──────────────┘
```

**Key Principle**: Backend provides APIs; UI layers consume them independently.

---

### 2. **Shared Code Strategy**

#### **What to Share**
- API client/service layer
- Business logic utilities
- Type definitions (TypeScript interfaces)
- Validation schemas
- Constants and configuration

#### **What NOT to Share**
- UI components (platform-specific)
- Routing (web vs native navigation)
- Storage (localStorage vs AsyncStorage)
- Platform-specific features (camera, notifications)

---

## Project Structure for Multi-Platform

### Option 1: Monorepo Structure

```
project-root/
├── backend/                    # Backend API (existing)
│   ├── server/
│   ├── routes/
│   └── services/
├── web/                        # Web UI (existing React)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── pages/
│   └── package.json
├── mobile/                     # Mobile UI (React Native)
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   └── navigation/
│   ├── ios/
│   ├── android/
│   └── package.json
├── shared/                     # Shared code
│   ├── types/                 # TypeScript types
│   ├── api/                   # API client
│   ├── utils/                 # Utilities
│   └── constants/             # Constants
└── package.json               # Root package.json
```

### Option 2: Separate Repositories

```
backend-repo/                   # Backend API
web-repo/                       # Web UI
mobile-repo/                    # Mobile UI (references shared package)
shared-lib/                     # Published npm package or git submodule
```

---

## Implementation Phases

### Phase 1: Backend API Preparation
**Goal**: Ensure backend APIs are platform-agnostic

**Tasks**:
1. ✅ Ensure all APIs return JSON (no HTML templates)
2. ✅ Use consistent response format: `{ success, data?, error? }`
3. ✅ Implement proper CORS for mobile clients
4. ✅ Add API versioning (e.g., `/api/v1/...`)
5. ✅ Document all endpoints (OpenAPI/Swagger)

**Scout**:
```bash
claude --model haiku -p "scout all API routes and verify JSON response format"
```

---

### Phase 2: Shared Code Extraction
**Goal**: Extract reusable logic into shared module

**Tasks**:
1. Create `shared/` directory or npm package
2. Move API client logic to `shared/api/`
3. Move TypeScript types to `shared/types/`
4. Move validation logic to `shared/validators/`
5. Update web app to import from shared module

**Structure**:
```typescript
// shared/api/client.ts
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    // Platform-agnostic fetch
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    // Platform-agnostic fetch
  }
}

// shared/types/[feature].ts
export interface User {
  id: number;
  email: string;
  // ... platform-agnostic types
}

// shared/utils/validation.ts
export function validateEmail(email: string): boolean {
  // Platform-agnostic validation
}
```

---

### Phase 3: Mobile Project Setup
**Goal**: Initialize React Native project with shared dependencies

**Option A: React Native (Expo)**
```bash
# Create new Expo project
npx create-expo-app mobile --template typescript

# Link to shared code
cd mobile
npm install ../shared  # or published package
```

**Option B: React Native CLI**
```bash
# Create new React Native project
npx react-native init MobileApp --template react-native-template-typescript

# Link to shared code
cd MobileApp
npm install ../shared
```

**Option C: Native iOS/Android**
- Use Swift/Kotlin for native development
- Create API client libraries for each platform
- Reference shared API contracts (OpenAPI spec)

---

### Phase 4: Mobile UI Implementation
**Goal**: Build mobile screens using shared business logic

**Example**: Authentication Screen

```typescript
// mobile/src/screens/LoginScreen.tsx
import React from 'react';
import { View, TextInput, Button } from 'react-native';
import { ApiClient } from '@shared/api/client';
import { validateEmail } from '@shared/utils/validation';

export function LoginScreen() {
  const [email, setEmail] = React.useState('');

  const handleLogin = async () => {
    if (!validateEmail(email)) {  // Shared validation
      return;
    }

    const api = new ApiClient(process.env.API_URL);
    const result = await api.post('/auth/login', { email });  // Shared API client
    // Handle result
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

---

## Platform-Specific Considerations

### Storage
```typescript
// shared/storage/interface.ts
export interface IStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// web/src/storage/localStorage.ts
export class WebStorage implements IStorage {
  async getItem(key: string) {
    return localStorage.getItem(key);
  }
  // ...
}

// mobile/src/storage/asyncStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export class MobileStorage implements IStorage {
  async getItem(key: string) {
    return AsyncStorage.getItem(key);
  }
  // ...
}
```

### Navigation
```typescript
// Web: React Router
import { BrowserRouter, Route } from 'react-router-dom';

// Mobile: React Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
```

### Real-time Communication
```typescript
// shared/websocket/interface.ts
export interface IWebSocket {
  connect(url: string): void;
  on(event: string, callback: Function): void;
  emit(event: string, data: any): void;
  disconnect(): void;
}

// Both web and mobile can use socket.io-client
// Platform-agnostic implementation
```

---

## Development Workflow

### Scout-Plan-Build for Multi-Platform Features

**Example: Adding "Profile Edit" feature**

#### Scout Phase
```bash
# Scout backend
claude --model haiku -p "scout profile editing APIs and data structures"

# Scout web implementation (for reference)
claude --model haiku -p "scout existing profile components in web UI"
```

#### Plan Phase
```markdown
## Implementation Plan: Profile Edit (Multi-Platform)

### Architecture Decisions
1. Backend: Add PUT /api/users/:id endpoint
2. Shared: Create ProfileValidator utility
3. Web: Update ProfileForm component
4. Mobile: Create ProfileEditScreen

### File Changes
**Backend**:
- routes/users.js - Add PUT endpoint

**Shared**:
- shared/types/user.ts - Add UpdateProfileDTO
- shared/validators/profile.ts - Add validateProfile()

**Web**:
- src/components/ProfileForm.tsx - Reuse validator

**Mobile**:
- mobile/src/screens/ProfileEditScreen.tsx - New screen
- Use shared validator and API client
```

#### Build Phase (Parallel)
```bash
# Agent 1: Backend API
claude -p "implement PUT /api/users/:id for profile updates"

# Agent 2: Shared validators
claude -p "create shared profile validation logic"

# Agent 3: Web UI (sequential with Agent 2)
claude -p "update web ProfileForm to use shared validators"

# Agent 4: Mobile UI (sequential with Agent 2)
claude -p "create mobile ProfileEditScreen using shared validators and API"
```

---

## SDD/TAC Framework Adaptation

### Prime Commands for Mobile

**New Command**: `/prime-mobile`
```markdown
# Prime: Mobile Development Context

## Platform
- React Native (iOS/Android)
- TypeScript

## Key Patterns
- Use shared API client from `@shared/api`
- Use shared types from `@shared/types`
- Use shared validators from `@shared/validators`
- Platform-specific UI components only

## Navigation
- Stack Navigator for screens
- Bottom Tab Navigator for main navigation
- Deep linking for notifications

## Storage
- Use AsyncStorage wrapper from `mobile/src/storage`
- Never use localStorage (web-only)

## Testing
- Jest for unit tests
- Detox for E2E tests (iOS/Android)
```

### Updated Always-On Context
```markdown
## Tech Stack (Multi-Platform)
**Backend**: Node.js 18+, Express, MySQL2
**Web**: React 18, TypeScript
**Mobile**: React Native, TypeScript (optional)
**Shared**: TypeScript, API client, validators
```

---

## Testing Strategy

### Backend API Testing
```bash
# E2E tests ensure APIs work for both platforms
npm run test:e2e:api
```

### Web UI Testing
```bash
# Existing Playwright tests
npm run test:e2e:web
```

### Mobile UI Testing
```bash
# Detox for React Native
npm run test:e2e:mobile:ios
npm run test:e2e:mobile:android
```

### Shared Code Testing
```bash
# Unit tests for shared utilities
cd shared && npm test
```

---

## Deployment Strategy

### Backend
- Same deployment as current (no changes)
- Ensure APIs are versioned for compatibility

### Web
- Same deployment as current (no changes)

### Mobile
**React Native**:
- iOS: App Store (via Xcode)
- Android: Play Store (via Android Studio or Fastlane)

**Native Apps**:
- iOS: Xcode + App Store Connect
- Android: Android Studio + Play Console

---

## Migration Path (Existing Project)

### Step 1: Audit Backend APIs
```bash
claude --model haiku -p "audit all API routes and list any that return HTML or non-JSON"
```

### Step 2: Create Shared Module
```bash
# Create shared directory
mkdir shared
cd shared
npm init -y

# Move shared code
# (types, API client, validators)
```

### Step 3: Refactor Web to Use Shared
```bash
# Update web imports to use @shared
# Test web app still works
npm run test:e2e:web
```

### Step 4: Initialize Mobile Project
```bash
# Create mobile project
npx create-expo-app mobile --template typescript

# Install shared module
cd mobile
npm install ../shared
```

### Step 5: Implement Core Mobile Features
```bash
# Start with authentication
claude -p "implement mobile login/signup screens using shared API client"

# Then core features
claude -p "implement mobile [feature] screen"
```

---

## Best Practices

### DO
- ✅ Keep business logic in shared code
- ✅ Use TypeScript interfaces for API contracts
- ✅ Test shared code independently
- ✅ Version backend APIs for compatibility
- ✅ Use platform-agnostic utilities (date-fns, lodash)

### DON'T
- ❌ Share UI components between web and mobile (different paradigms)
- ❌ Use web-specific APIs in shared code (window, document)
- ❌ Hardcode platform-specific values in shared code
- ❌ Skip testing shared code (it's used by multiple platforms)

---

## Cost Optimization

### Scout Phase (Multi-Platform)
```bash
# Use Haiku for discovery across platforms
claude --model haiku -p "scout [feature] in web and identify what needs mobile equivalent"
```

### Plan Phase
```bash
# Use Sonnet for cross-platform planning
claude -p "plan [feature] implementation for web and mobile with shared logic"
```

### Build Phase (Parallel)
```bash
# Spawn parallel agents per platform
# Agent 1: Backend API
# Agent 2: Shared logic
# Agent 3: Web UI
# Agent 4: Mobile UI
```

**Cost Savings**: Shared code reduces duplication = faster development = lower costs

---

## Future Considerations

### Progressive Web App (PWA)
- Alternative to native mobile apps
- Reuse web codebase
- Add service workers, manifest.json
- Limited native features but easier deployment

### Desktop Apps (Electron)
- Reuse web codebase
- Package as desktop app (Windows, Mac, Linux)
- Similar shared code strategy

### Server-Side Rendering (SSR)
- Next.js for web
- Improves SEO and initial load time
- Shared types/validators still apply

---

## Related Documentation

- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Core workflow
- [Agent Orchestration](./agent-orchestration.md) - Parallel development
- [Coding Standards](./coding-standards.md) - Applies to all platforms
- [Database Schema](../database/schema-design.md) - Backend patterns

---

## Summary

The development framework is **platform-agnostic by design**:
1. Backend provides JSON APIs (no UI coupling)
2. Shared code (types, validators, API client) reduces duplication
3. Platform-specific UI layers (web, mobile) consume shared logic
4. SDD/TAC workflow applies to all platforms
5. Parallel agents can build web + mobile simultaneously

**Next Steps**:
1. Audit backend APIs for JSON-only responses
2. Extract shared code into separate module
3. Initialize mobile project (if needed)
4. Apply Scout-Plan-Build workflow per feature, per platform
