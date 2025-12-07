# Context Bundle: Profile Enhancement & Mobile Alignment

**Date:** December 6, 2025
**Status:** ✅ IMPLEMENTED
**Related:** Mobile App Alignment, Profile Schema, Age Verification

---

## Executive Summary

Aligned the web application's profile handling with the native mobile app (`SGSGitaMahayagnaMetroNOExpo`) requirements. This includes simplifying birth date capture to **Year of Birth (YOB)** only, and adding support for **Current Center** and **Profile Picture** during the age verification/profile creation flow.

---

## Changes Implemented

### 1. Database Schema
- Added `current_center` column to `FAMILY_MEMBERS` table.
- Migration file: `migrations/add-current-center-to-family-members.sql`

### 2. Backend Logic (`server/services/FamilyMemberService.js`)
- Updated `createFamilyMember` to handle `currentCenter` and convert YOB (YYYY) to date (YYYY-01-01).
- Updated `updateBirthDate` to handle YOB input logic.
- Updated `getFamilyMembers` to return `current_center`.
- Updated `updateFamilyMember` to allow updating `current_center`.

### 3. API Routes (`routes/family-members.js`)
- Enhanced `POST /api/family-members/:id/birth-date` to:
    - Accept `currentCenter` and `profileImageUrl` in the body.
    - Validate `birthDate` as either `YYYY-MM-DD` or `YYYY`.
    - Update additional profile fields if provided.

### 4. Frontend Service (`src/services/familyMemberService.ts`)
- Updated `FamilyMember` interface to include `current_center`.
- Updated `CreateFamilyMemberRequest` and `UpdateFamilyMemberRequest` to include `currentCenter` and `profileImageUrl`.
- Updated `updateBirthDate` function signature to accept optional profile data.

### 5. Frontend UI (`src/components/family/AddFamilyMemberModal.tsx`)
- Changed "Birth Date" input to "Year of Birth" (YYYY) number input.
- Added "Current Center" text input.
- Added "Profile Image URL" input.
- Made these fields available in both "Add Member" and "Age Verification" (Edit) modes.
- Updated `calculateAge` to handle year-only input.
- Updated `handleSubmit` to send new fields to the backend.

---

## User Flow Updates

1.  **Add Family Member**: User enters Name, Relationship, Year of Birth, Current Center, and Profile Image URL.
2.  **Age Verification (Edit Mode)**: User is prompted to enter Year of Birth. They are also encouraged to enter Current Center and Profile Image URL.
3.  **Data Storage**: YOB is stored as `YYYY-01-01` in the database to maintain DATE type compatibility while simplifying input.

---

## Mobile App Alignment

- **YOB Only**: Matches mobile app's `yearOfBirth` capture.
- **Direct Profile Update**: Web app now supports updating profile details directly during verification, similar to mobile app flow.
- **Schema**: `FAMILY_MEMBERS` now includes `current_center` to match mobile app's `currentCenter`.

