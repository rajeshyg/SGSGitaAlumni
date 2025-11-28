---
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: mobile
author: research-phase
---

# Component Migration Matrix

## Overview

This document details the effort required to migrate each component from the current React web application to production mobile deployment. Effort is measured in developer-days and categorized by reuse potential.

---

## Critical Clarification: What Changes vs. What Stays

### ❌ NO Changes Required (Backend - Mobile Calls Existing APIs)

| Layer | Location | Mobile Impact |
|-------|----------|---------------|
| **REST APIs** | `routes/*.js`, `server/services/*.js` | Mobile calls same endpoints |
| **Database** | MySQL + migrations | No change - backend handles all |
| **Socket.IO Server** | `server/socket/*.js` | Mobile connects to same server |
| **Server Validation** | Backend Zod schemas | API validates all requests |
| **Middleware** | `middleware/*.js` | No change |
| **Authentication Backend** | JWT, OTP verification | No change |

**Your entire backend is production-ready for mobile. Zero changes needed.**

### ✅ Keep Web Project As-Is (No Restructuring)

| What You Built | Status | Mobile Impact |
|----------------|--------|---------------|
| Project structure | ✅ Keep | Web-only tooling |
| Validation scripts | ✅ Keep | Web-only tooling |
| Pre-commit hooks | ✅ Keep | Web-only tooling |
| ESLint/Husky setup | ✅ Keep | Web-only tooling |
| Spec documentation | ✅ Keep | Shared reference |

**All your recent structure/validation work is preserved unchanged.**

### 📋 Code Reuse Strategy (Simple Copy, No Monorepo)

```
SGSGitaAlumni/                    ← Current web project (NO CHANGES)
│
SGSGitaAlumni-Mobile/             ← NEW separate project
├── shared/                       ← Copy these files from web
│   ├── services/                 # APIService.ts, OTPService.ts, etc.
│   ├── types/                    # All type definitions
│   ├── schemas/                  # Zod validation schemas
│   └── chatClient.ts             # Socket.io client
├── ios/ or android/ or src/      ← Platform-specific UI (new code)
└── ...
```

**Simple approach**: Copy reusable files to mobile project. No monorepo, no shared packages, no restructuring.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 | Direct reuse (minimal changes) |
| 🟡 | Partial rewrite (platform adaptations) |
| 🔴 | Complete rewrite required |
| ⚪ | New development (doesn't exist in web) |

---

## Authentication Module

| Component | Current State | Reusability | iOS Effort | Android Effort | Notes |
|-----------|---------------|-------------|------------|----------------|-------|
| **Auth Backend API** | ✅ Complete | ✅ **No change** | 0 days | 0 days | Mobile calls `/api/auth/*` |
| **OTP Backend** | ✅ Complete | ✅ **No change** | 0 days | 0 days | Mobile calls existing API |
| **OTP Service (frontend)** | ✅ Complete | 🟢 Copy | 0.25 days | 0.25 days | Pure TypeScript, copy to mobile |
| **Token Storage** | ✅ localStorage | 🟡 Adapt | 0.5 days | 0.5 days | iOS Keychain / Android EncryptedSharedPrefs |
| **Session Management** | ✅ Complete | 🟢 Copy | 0.25 days | 0.25 days | Token refresh logic, copy to mobile |
| **Auth Error Handling** | ✅ Complete | 🟢 Copy | 0.25 days | 0.25 days | `AuthErrorHandler` copy to mobile |
| **Login Form UI** | ✅ shadcn/ui | 🔴 Rewrite | 2 days | 1.5 days | Native UI needed |
| **Biometric Auth** | ❌ None | ⚪ New | 1 day | 1 day | FaceID/TouchID, Fingerprint |
| **Total** | | | **4.25 days** | **3.75 days** | |

---

## Dashboard Module

| Component | Current State | Reusability | iOS Effort | Android Effort | Notes |
|-----------|---------------|-------------|------------|----------------|-------|
| **Dashboard APIs** | ✅ Complete | ✅ **No change** | 0 days | 0 days | Mobile calls existing `/api/dashboard/*` |
| **useDashboardData Hook** | ✅ Complete | 🟢 Copy | 0.5 days | 0.5 days | API call logic, copy to mobile |
| **Dashboard Layout UI** | ✅ Responsive | 🔴 Rewrite | 2 days | 1.5 days | Native navigation patterns differ |
| **Stats Cards UI** | ✅ shadcn/ui | 🔴 Rewrite | 1 day | 1 day | Native components needed |
| **Quick Actions UI** | ✅ Button grid | 🔴 Rewrite | 0.5 days | 0.5 days | Touch-optimized native buttons |
| **Recent Activity UI** | ✅ List view | 🔴 Rewrite | 1 day | 1 day | FlatList/RecyclerView needed |
| **Pull-to-Refresh** | ❌ None | ⚪ New | 0.5 days | 0.5 days | Native gesture handling |
| **Skeleton Loading** | ✅ CSS-based | 🔴 Rewrite | 0.5 days | 0.5 days | Platform-specific animation |
| **Total** | | | **6 days** | **5.5 days** | |

---

## Chat Module

| Component | Current State | Reusability | iOS Effort | Android Effort | Notes |
|-----------|---------------|-------------|------------|----------------|-------|
| **Chat Backend APIs** | ✅ Complete | ✅ **No change** | 0 days | 0 days | Mobile calls existing `/api/conversations/*` |
| **Socket.IO Server** | ✅ Complete | ✅ **No change** | 0 days | 0 days | Mobile connects to same server |
| **chatClient.ts** | ✅ Socket.io | 🟢 Copy | 0.5 days | 0.5 days | socket.io-client works everywhere, copy to mobile |
| **useMessaging Hook** | ✅ Complete | 🟢 Copy | 0.5 days | 0.5 days | State management logic, copy to mobile |
| **Typing Indicators** | ✅ Complete | 🟢 Copy | 0.25 days | 0.25 days | Logic reusable, copy to mobile |
| **Read Receipts** | ✅ Complete | 🟢 Copy | 0.25 days | 0.25 days | Logic reusable, copy to mobile |
| **ChatWindow UI** | ✅ Complete | 🔴 Rewrite | 2 days | 1.5 days | Complex UI, native list performance |
| **MessageList UI** | ✅ Virtual scroll | 🔴 Rewrite | 1.5 days | 1.5 days | FlatList/RecyclerView needed |
| **MessageInput UI** | ✅ Complete | 🔴 Rewrite | 1 day | 1 day | Keyboard handling differs |
| **ConversationList UI** | ✅ Complete | 🔴 Rewrite | 1 day | 1 day | Native list with swipe actions |
| **Message Reactions UI** | ✅ Complete | 🔴 Rewrite | 0.5 days | 0.5 days | Gesture handling differs |
| **Image/File Preview** | ✅ Basic | 🔴 Rewrite | 1 day | 1 day | Native media handling |
| **Total** | | | **8.5 days** | **8 days** | |

---

## Theme System

| Component | Current State | Reusability | iOS Effort | Android Effort | Notes |
|-----------|---------------|-------------|------------|----------------|-------|
| **Color Palette** | ✅ Complete | 🟢 Copy | 0.25 days | 0.25 days | Colors as JSON/constants, copy to mobile |
| **Spacing System** | ✅ Complete | 🟢 Copy | 0.25 days | 0.25 days | Values as constants, copy to mobile |
| **Theme Types** | ✅ Complete | 🟢 Copy | 0 days | 0 days | TypeScript interfaces, direct copy |
| **Theme Configs** | ✅ 4 themes | 🟡 Adapt | 1 day | 1 day | Convert CSS vars to platform tokens |
| **Typography** | ✅ Complete | 🟡 Adapt | 0.5 days | 0.5 days | Font system differs per platform |
| **Component Overrides** | ✅ Complete | 🔴 Rewrite | 1 day | 1 day | Platform-specific styling |
| **Theme Provider** | ✅ Context-based | 🔴 Rewrite | 0.5 days | 0.5 days | Similar pattern, different impl |
| **Dark Mode** | ✅ Complete | 🟡 Adapt | 0.5 days | 0.5 days | System preference handling |
| **Total** | | | **4 days** | **4 days** | |

---

## Push Notifications (New)

| Component | Current State | Reusability | iOS Effort | Android Effort | Notes |
|-----------|---------------|-------------|------------|----------------|-------|
| **Notification Service** | ❌ None | ⚪ New | 1.5 days | 1 day | APNs vs FCM setup |
| **Permission Handling** | ❌ None | ⚪ New | 0.5 days | 0.5 days | iOS stricter than Android |
| **Token Registration** | ❌ None | ⚪ New | 0.5 days | 0.5 days | Backend API needed |
| **Notification Display** | ❌ None | ⚪ New | 0.5 days | 0.5 days | Platform-native |
| **Deep Linking** | ❌ None | ⚪ New | 1 day | 0.5 days | iOS universal links complex |
| **Background Handling** | ❌ None | ⚪ New | 0.5 days | 0.5 days | Background fetch |
| **Total** | | | **4.5 days** | **3.5 days** | |

---

## Navigation & Routing

| Component | Current State | Reusability | iOS Effort | Android Effort | Notes |
|-----------|---------------|-------------|------------|----------------|-------|
| **Router Setup** | ✅ React Router | 🔴 Rewrite | 1.5 days | 1.5 days | Native navigation stack |
| **Tab Navigation** | ✅ Web tabs | 🔴 Rewrite | 0.5 days | 0.5 days | Bottom tabs native |
| **Stack Navigation** | ❌ SPA | ⚪ New | 1 day | 1 day | Screen stack management |
| **Deep Links** | ❌ None | ⚪ New | 1 day | 0.5 days | URL scheme handling |
| **Auth Flow** | ✅ Route guards | 🟡 60% | 0.5 days | 0.5 days | Logic reusable |
| **Total** | | | **4.5 days** | **4 days** | |

---

## Shared Services (Core Logic) - COPY TO MOBILE

These files are **copied** to the mobile project (not shared via monorepo). Update in both places if API changes.

| Service | Current State | Reusability | Action | Notes |
|---------|---------------|-------------|--------|-------|
| **APIService.ts** | ✅ Axios-based | 🟢 95% | Copy | Works on all platforms |
| **StreamlinedRegistrationService.ts** | ✅ Complete | 🟢 90% | Copy | Pure business logic |
| **InvitationService.ts** | ✅ Complete | 🟢 95% | Copy | API calls only |
| **AgeVerificationService.ts** | ✅ Complete | 🟢 95% | Copy | Pure logic |
| **EmailService.ts** | ✅ Complete | 🟢 95% | Copy | API calls only |
| **OTPService.ts** | ✅ Complete | 🟢 95% | Copy | Pure TypeScript |
| **chatClient.ts** | ✅ Socket.io | 🟢 95% | Copy | socket.io-client works everywhere |
| **Zod Schemas** | ✅ Complete | 🟢 100% | Copy | Direct reuse, no changes |
| **Type Definitions** | ✅ Complete | 🟢 100% | Copy | Direct reuse, no changes |
| **Auth Error Handling** | ✅ Complete | 🟢 95% | Copy | `AuthErrorHandler` direct reuse |

### Files to Copy (One-Time, ~1.5 days)

```
FROM: SGSGitaAlumni/src/           TO: SGSGitaAlumni-Mobile/shared/
─────────────────────────────────────────────────────────────────────
services/APIService.ts          →  services/APIService.ts
services/OTPService.ts          →  services/OTPService.ts
services/InvitationService.ts   →  services/InvitationService.ts
services/AgeVerificationService.ts → services/AgeVerificationService.ts
lib/socket/chatClient.ts        →  chatClient.ts
lib/auth/errorHandling.ts       →  auth/errorHandling.ts
types/*.ts                      →  types/
schemas/*.ts                    →  schemas/
```

**Minor tweaks needed**: Storage API (localStorage → AsyncStorage/Keychain)

---

## App Infrastructure

| Component | Current State | Reusability | iOS Effort | Android Effort | Notes |
|-----------|---------------|-------------|------------|----------------|-------|
| **Error Boundary** | ✅ React-based | 🟡 50% | 0.5 days | 0.5 days | Similar concept |
| **Performance Monitor** | ✅ Web Vitals | 🔴 Rewrite | 1 day | 1 day | Platform-specific metrics |
| **Crash Reporting** | ✅ Sentry web | 🟡 70% | 0.5 days | 0.5 days | Sentry has RN/native SDKs |
| **Analytics** | ❌ None | ⚪ New | 0.5 days | 0.5 days | Firebase Analytics |
| **App State** | ❌ Web only | ⚪ New | 0.5 days | 0.5 days | Background/foreground |
| **Offline Support** | ⚠️ Partial | 🟡 40% | 1.5 days | 1.5 days | Need queue persistence |
| **Total** | | | **4.5 days** | **4.5 days** | |

---

## Summary by Approach

### Approach A: Capacitor (Wrapper)

| Module | Effort | Notes |
|--------|--------|-------|
| Auth | 2 days | Plugin for secure storage |
| Dashboard | 1 day | Minor responsive fixes |
| Chat | 2 days | Socket works, UI tweaks |
| Push | 2 days | Capacitor push plugin |
| Navigation | 1 day | Deep link config |
| Build Setup | 3 days | Xcode/Android Studio config |
| **Total iOS** | **~11 days** | |
| **Total Android** | **~9 days** | |

### Approach B: React Native (Bare)

| Module | Effort | Notes |
|--------|--------|-------|
| Auth | 5 days | UI rewrite + logic port |
| Dashboard | 6 days | Full UI rewrite |
| Chat | 9 days | Complex native lists |
| Push | 4 days | react-native-push-notification |
| Navigation | 4 days | React Navigation setup |
| Theme | 4 days | NativeWind setup |
| Build Setup | 3 days | Xcode/Gradle config |
| **Total iOS** | **~35 days** | |
| **Total Android** | **~30 days** | |

### Approach C: Native Hybrid (Swift + Kotlin)

| Module | iOS (Swift) | Android (Kotlin) | Notes |
|--------|-------------|------------------|-------|
| Auth | 5 days | 4.5 days | Native UI + shared services |
| Dashboard | 6 days | 5.5 days | SwiftUI/Compose |
| Chat | 8.5 days | 8 days | Native chat UI |
| Push | 4.5 days | 3.5 days | APNs/FCM native |
| Navigation | 4.5 days | 4 days | Native stack |
| Theme | 4 days | 4 days | Design tokens |
| Shared Code Extract | 1.5 days | 0 days | One-time effort |
| Build Setup | 2 days | 1 day | Standard native |
| **Total iOS** | **~36 days** | | |
| **Total Android** | | **~30.5 days** | |

---

## Timeline Estimates

| Approach | iOS MVP | Android MVP | Both Platforms | Risk Level |
|----------|---------|-------------|----------------|------------|
| **Capacitor** | 2 weeks | 1.5 weeks | 3 weeks | 🟡 Medium |
| **React Native** | 6-7 weeks | 5-6 weeks | 8 weeks* | 🟡 Medium |
| **Native Hybrid** | 7-8 weeks | 5-6 weeks | 9 weeks* | 🟢 Low |

**\* Parallel development possible after initial mobile project setup**

---

## Recommended Prioritization

### Phase 1 (Week 1-2): Foundation
1. Copy shared services to mobile project
2. Set up cloud build pipeline (Codemagic)
3. Configure iOS/Android projects

### Phase 2 (Week 3-4): Auth + Navigation
1. Implement authentication flow
2. Set up navigation structure
3. Push notification infrastructure

### Phase 3 (Week 5-6): Core Features
1. Dashboard implementation
2. Chat module (highest complexity)

### Phase 4 (Week 7-8): Polish + Deploy
1. Theme consistency
2. Error handling
3. App store submission
