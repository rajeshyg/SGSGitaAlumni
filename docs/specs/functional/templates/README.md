# Functional Spec Templates

Templates for creating functional specification documents.

## Available Templates

- `_TEMPLATE_db-schema.md` - Template for database schema documentation

## Usage

Copy the appropriate template to your module folder and rename it appropriately.

For db-schema files:
1. Copy `_TEMPLATE_db-schema.md` to `docs/specs/functional/[module]/db-schema.md`
2. Replace all `[bracketed]` placeholders with actual content
3. Update the frontmatter with correct module info
4. Change status from `template` to `pending` when work begins

## Note on DB Schema Documentation

DB schema files follow a **different structure** than feature specifications:

**Required for db-schema.md**:
- Overview
- Tables
- Table Relationships
- Common Query Patterns  
- Migration Notes
- Related

**NOT required** (these belong in README.md feature specs):
- User Flow
- Acceptance Criteria
- Implementation

This follows TAC framework R&D principles - keeping database documentation focused on database structure.
