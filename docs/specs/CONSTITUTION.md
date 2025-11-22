# SGS Gita Alumni Platform - Project Constitution

## Architecture
- React 18+ frontend with TypeScript
- Node.js Express backend with MySQL database
- Socket.IO for real-time messaging
- JWT authentication with family account support

## Core Principles
- API-first design with RESTful endpoints
- Invitation-based registration (no public signup)
- Family accounts with shared email, individual profiles
- Role-based access (Member, Moderator, Admin)
- Mobile-first responsive design

## Technology Stack
- **Frontend**: React, TypeScript, CSS Modules
- **Backend**: Node.js, Express, MySQL2
- **Real-time**: Socket.IO
- **Auth**: JWT, OTP verification

## Code Standards
- TypeScript for frontend, JavaScript for backend routes
- Parameterized SQL queries (no string interpolation)
- Connection pooling with proper release in finally blocks
- Structured error responses with consistent format
- Theme variables for all colors (no hardcoded values)

## Security Requirements
- Input validation on all API endpoints
- XSS prevention through sanitization
- CSRF protection
- Rate limiting on authentication endpoints
- No secrets in logs

## Constraints
- WCAG 2.1 AA accessibility compliance
- Support modern browsers (last 2 versions)
- Maximum API response time: 500ms
- Connection pool limit: 10 connections

## Domain Terminology
- **Alumni**: Verified former students/members
- **Family Member**: Related individuals sharing family account
- **Posting**: Job/mentorship/event/resource content
- **Domain/Sub-domain/Area**: Hierarchical interest taxonomy
