# Prime: UI/Frontend Context

Load this context before working on React components.

## Variables
- `$TASK`: The specific UI task to perform
- `$COMPONENT`: Target component name
- `$PAGE`: Target page (if applicable)

## Context to Load
Read these files to understand UI patterns:
- `docs/specs/context/always-on.md` - Critical rules
- `docs/specs/technical/ui-standards/theme-system.md` - **CRITICAL** Theme & CSS variables
- `docs/specs/technical/ui-standards/accessibility.md` - WCAG compliance
- `docs/specs/technical/ui-standards/component-patterns.md` - Component development

## Key Files
- `src/contexts/AuthContext.tsx` - Auth state
- `src/App.tsx` - Routes and PrivateRoute pattern
- `src/lib/api.ts` - API call patterns
- `src/components/ui/` - Shared UI components

## Patterns to Follow
- Use existing UI components from `src/components/ui/`
- Follow AuthContext for auth state
- API calls via `src/lib/api.ts`
- Responsive design with Tailwind

## Workflow
1. Read the context files listed above
2. Check existing components for similar patterns
3. Use shared UI components where possible
4. Connect to AuthContext if auth needed
5. Handle loading/error states
6. Ensure responsive design

## Report
After completing the task:
- Components created/modified
- Uses shared UI components: Yes/No
- Auth integration: Yes/No
- E2E test coverage: `tests/e2e/[module].spec.ts`
