---
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: mobile
author: research-phase
---

# Mobile Technology Research

## Executive Summary

This document evaluates mobile development technologies for SGS Gita Alumni, considering:
- iOS deployment complexity (primary concern based on past experience)
- Code reuse from existing React web application
- Development without Mac hardware
- Production deployment reliability

**Recommendation**: Start with **separate native codebases** (Swift for iOS, Kotlin for Android) with shared business logic extracted to TypeScript packages, using **cloud build services** for iOS.

---

## Technology Comparison

### Cross-Platform Frameworks

| Technology | iOS Deploy | Android Deploy | Mac Required | Code Reuse | Learning Curve | Production Reliability |
|------------|------------|----------------|--------------|------------|----------------|----------------------|
| **Capacitor** | 🟡 Medium | 🟢 Easy | Yes* | 95% | Low | 🟢 Good |
| **React Native (bare)** | 🟡 Medium | 🟢 Easy | Yes* | 70% | Medium | 🟡 Variable |
| **Expo (managed)** | 🔴 Complex | 🟢 Easy | No | 80% | Low | 🔴 Issues reported |
| **Expo (bare)** | 🟡 Medium | 🟢 Easy | Yes* | 75% | Medium | 🟡 Better than managed |
| **Flutter** | 🟡 Medium | 🟢 Easy | Yes* | 0% (new lang) | High | 🟢 Good |
| **Kotlin Multiplatform** | 🟡 Medium | 🟢 Easy | Yes* | 40% | High | 🟢 Good |

**\* Cloud build services can substitute for local Mac**

### Native Development

| Technology | Platform | Deploy Difficulty | Mac Required | Code Reuse | Reliability |
|------------|----------|-------------------|--------------|------------|-------------|
| **Swift/SwiftUI** | iOS only | 🟢 Easiest | Yes* | 0% | 🟢 Excellent |
| **Kotlin/Jetpack Compose** | Android only | 🟢 Easiest | No | 0% | 🟢 Excellent |
| **Objective-C** | iOS only | 🟢 Easy | Yes* | 0% | 🟢 Excellent |
| **Java** | Android only | 🟢 Easy | No | 0% | 🟢 Excellent |

---

## Mac Hardware Alternatives

### Cloud Build Services

| Service | Cost | Use Case | iOS Support | Reliability |
|---------|------|----------|-------------|-------------|
| **Codemagic** | Free tier + $10/mo | CI/CD builds | ✅ Full | 🟢 Excellent |
| **GitHub Actions (macOS)** | 2000 min/mo free | CI/CD builds | ✅ Full | 🟢 Excellent |
| **Bitrise** | Free tier + $50/mo | CI/CD builds | ✅ Full | 🟢 Good |
| **App Center** | Free tier | CI/CD + distribution | ✅ Full | 🟡 Sunset announced |

### Cloud Mac Rental

| Service | Cost | Use Case | Reliability |
|---------|------|----------|-------------|
| **MacStadium** | $79-99/mo | Dedicated Mac | 🟢 Excellent |
| **MacinCloud** | $20-49/mo | Shared/dedicated | 🟡 Good |
| **AWS EC2 Mac** | ~$26/day (24hr min) | On-demand | 🟢 Excellent |
| **Scaleway Mac Mini** | €0.10/hr (~$3/hr) | On-demand EU | 🟡 Good |

### Hardware Purchase

| Option | Cost | Notes |
|--------|------|-------|
| **Mac Mini M1 (used)** | $400-500 | Best long-term investment |
| **Mac Mini M2** | $599 new | Official support |
| **MacBook Air M1 (used)** | $600-700 | Portable option |

**Break-even analysis**: Mac Mini M1 @ $450 = 9-22 months of cloud rental costs

---

## iOS Deployment Deep Dive

### Why iOS Deployment is Difficult

| Challenge | Description | Impact |
|-----------|-------------|--------|
| **Code Signing** | Provisioning profiles, certificates | High friction |
| **Apple Developer Program** | $99/year, review process | Cost + time |
| **Xcode Requirement** | Only runs on macOS | Hardware dependency |
| **TestFlight** | Beta testing requirements | Additional steps |
| **App Review** | 24-48hr reviews, rejections possible | Unpredictable delays |
| **Privacy Requirements** | ATT, privacy manifests (iOS 17+) | Ongoing compliance |

### Cross-Platform iOS Issues

| Framework | Common iOS Issues |
|-----------|-------------------|
| **Expo (managed)** | Ejecting breaks builds, native module conflicts, EAS timeouts |
| **React Native** | CocoaPods conflicts, Flipper issues, Hermes configuration |
| **Capacitor** | Plugin compatibility, WKWebView limitations |
| **Flutter** | Code signing integration, plugin channels |

### Native iOS Advantages

| Advantage | Detail |
|-----------|--------|
| Direct Xcode control | No abstraction layer issues |
| Apple documentation | First-party support |
| SwiftUI/UIKit stability | Mature, well-documented |
| Debugging | Full native debugging tools |
| Performance | No bridge overhead |

---

## Code Reuse Analysis

### From Current React Web App

| Code Category | Files | Reusability | Target |
|---------------|-------|-------------|--------|
| **API Services** | `src/services/*.ts` | 🟢 95% | Extract to shared package |
| **Auth Logic** | `AuthContext.tsx`, `StorageUtils` | 🟢 90% | Minor storage API changes |
| **Chat Client** | `src/lib/socket/chatClient.ts` | 🟢 85% | Socket.io-client works on RN |
| **Business Logic** | Registration, OTP, Invitation | 🟢 90% | Pure TypeScript |
| **Type Definitions** | `src/types/*.ts` | 🟢 100% | Direct reuse |
| **Theme Tokens** | `src/lib/theme/configs.ts` | 🟡 70% | Convert to platform tokens |
| **Validation Schemas** | Zod schemas | 🟢 95% | Direct reuse |
| **Hooks** | `src/hooks/*.ts` | 🟡 60% | Some platform-specific |
| **UI Components** | shadcn/ui | 🔴 10% | Complete rewrite needed |
| **Routing** | React Router | 🔴 0% | Different paradigm |

### Shared Code Architecture

```
packages/
├── @sgsgita/core/           # 100% shared
│   ├── types/               # TypeScript interfaces
│   ├── validation/          # Zod schemas
│   └── constants/           # App constants
├── @sgsgita/services/       # 90% shared
│   ├── api/                 # API client (axios)
│   ├── auth/                # Auth logic
│   └── chat/                # Socket.io client
├── @sgsgita/hooks/          # 60% shared
│   ├── useAuth.ts           # Platform-agnostic
│   └── useMessaging.ts      # Platform-agnostic
apps/
├── web/                     # Current React app
├── ios/                     # Swift/SwiftUI
└── android/                 # Kotlin/Compose
```

---

## Deployment Comparison

### iOS Deployment Flow

| Approach | Steps | Complexity | Time to First Deploy |
|----------|-------|------------|---------------------|
| **Native (Xcode)** | Code → Build → Sign → Archive → Upload | 🟢 Low | 1-2 days |
| **React Native** | Code → Metro → Xcode → Sign → Archive → Upload | 🟡 Medium | 2-3 days |
| **Capacitor** | Code → Build Web → Cap Sync → Xcode → Sign → Archive → Upload | 🟡 Medium | 2-3 days |
| **Expo EAS** | Code → EAS Build → EAS Submit | 🟡 Medium* | 1-2 days |

**\* When it works; debugging failures is complex**

### Android Deployment Flow

| Approach | Steps | Complexity | Time to First Deploy |
|----------|-------|------------|---------------------|
| **Native (Android Studio)** | Code → Build → Sign → Upload | 🟢 Low | 1 day |
| **React Native** | Code → Metro → Gradle → Sign → Upload | 🟢 Low | 1-2 days |
| **Capacitor** | Code → Build Web → Cap Sync → Gradle → Sign → Upload | 🟢 Low | 1-2 days |

---

## Recommended Approach

### Option A: Hybrid with Shared Packages (Recommended)

**Architecture:**
- Extract business logic to `@sgsgita/core` and `@sgsgita/services`
- Build native iOS app with SwiftUI consuming shared TypeScript via API
- Build native Android app with Kotlin/Compose consuming same API
- Use cloud builds (Codemagic/GitHub Actions) for iOS

**Pros:**
- Full deployment control
- Best iOS deployment reliability
- Native performance and UX
- Cleaner debugging

**Cons:**
- Higher initial development time
- Maintain two UI codebases

**Estimated Timeline:** 6-8 weeks for MVP (Login + Dashboard + Chat)

---

### Option B: Capacitor Wrapper (Faster but Riskier)

**Architecture:**
- Wrap existing React web app in Capacitor
- Add native plugins for push, storage, etc.
- Build iOS via Xcode (cloud Mac)

**Pros:**
- Fastest time to market
- Maximum code reuse (95%)
- Single codebase

**Cons:**
- WebView performance limitations
- Native feature friction
- Debugging complexity
- May hit iOS review issues

**Estimated Timeline:** 2-3 weeks for MVP

---

### Option C: React Native Bare (Middle Ground)

**Architecture:**
- React Native without Expo
- Reuse services and hooks
- Rewrite UI with React Native components
- NativeWind for styling (Tailwind classes)

**Pros:**
- React knowledge transfers
- Good code reuse (70%)
- Native performance

**Cons:**
- Previous deployment issues may recur
- CocoaPods/native module management
- Metro bundler complexity

**Estimated Timeline:** 4-6 weeks for MVP

---

## Decision Matrix

| Factor | Weight | Capacitor | RN Bare | Native Hybrid |
|--------|--------|-----------|---------|---------------|
| iOS Deploy Reliability | 30% | 6/10 | 5/10 | 9/10 |
| Code Reuse | 25% | 10/10 | 7/10 | 4/10 |
| Development Speed | 20% | 9/10 | 6/10 | 5/10 |
| Long-term Maintenance | 15% | 5/10 | 6/10 | 9/10 |
| Native UX Quality | 10% | 5/10 | 8/10 | 10/10 |
| **Weighted Score** | 100% | **7.0** | **6.2** | **7.2** |

---

## Recommended Decision Path

1. **Week 1**: Set up cloud build pipeline (Codemagic)
2. **Week 1**: Extract shared code to packages
3. **Week 2-3**: Try Capacitor approach first (fastest)
4. **If Capacitor fails iOS review**: Pivot to native hybrid
5. **Long-term**: Consider native rewrite for better UX

---

## References

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Codemagic iOS Builds](https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/)
- [Apple Developer Program](https://developer.apple.com/programs/)
- [NativeWind (Tailwind for RN)](https://www.nativewind.dev/)
