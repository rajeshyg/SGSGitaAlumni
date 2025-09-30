# Scripts Documentation

## Overview

This directory contains all the utility scripts for the SGS Gita Alumni project, organized into logical categories for easy maintenance and usage.

## Script Organization

### Root Level Scripts (`/scripts/`)
General-purpose utility scripts that don't belong to a specific category.

| Script | Purpose | Usage |
|--------|---------|-------|
| `check-documentation.js` | Validates documentation standards | `node scripts/check-documentation.js` |
| `check-redundancy.js` | Detects code redundancy | `node scripts/check-redundancy.js` |
| `deployment-validation.js` | Validates deployment readiness | `node scripts/deployment-validation.js` |
| `detect-mock-data.js` | Scans for mock data usage | `node scripts/detect-mock-data.js` |
| `test-runner.js` | Unified test execution | `node scripts/test-runner.js [type] [options]` |
| `validate-documentation-standards.js` | Documentation quality validation | `node scripts/validate-documentation-standards.js` |

### Database Scripts (`/scripts/database/`)
Database-related scripts for migrations, testing, and maintenance.

| Script | Purpose | Usage |
|--------|---------|-------|
| `add-missing-columns.js` | Adds missing database columns | `node scripts/database/add-missing-columns.js` |
| `check-alumni-members.js` | Validates alumni member data | `node scripts/database/check-alumni-members.js` |
| `check-app-users.js` | Validates app user data | `node scripts/database/check-app-users.js` |
| `check-foreign-keys.js` | Validates foreign key constraints | `node scripts/database/check-foreign-keys.js` |
| `check-invitations-table.js` | Validates invitation table structure | `node scripts/database/check-invitations-table.js` |
| `check-last-names.js` | Checks for missing last names | `node scripts/database/check-last-names.js` |
| `check-migration-audit.js` | Audits migration history | `node scripts/database/check-migration-audit.js` |
| `check-raw-data-format.js` | Validates raw CSV data format | `node scripts/database/check-raw-data-format.js` |
| `check-specific-users.js` | Checks specific user records | `node scripts/database/check-specific-users.js` |
| `check-table-structure.js` | Validates table structures | `node scripts/database/check-table-structure.js` |
| `check-tables.js` | General table validation | `node scripts/database/check-tables.js` |
| `check-users-table.js` | Validates users table | `node scripts/database/check-users-table.js` |
| `create-admin.js` | Creates admin user | `node scripts/database/create-admin.js` |
| `debug-migration.js` | Debugs migration issues | `node scripts/database/debug-migration.js` |
| `debug-user-profile.js` | Debugs user profile issues | `node scripts/database/debug-user-profile.js` |
| `fix-user-profile-immediate.js` | Immediate user profile fixes | `node scripts/database/fix-user-profile-immediate.js` |
| `migrate-sannidhi-sriharsha.js` | Specific user migration | `node scripts/database/migrate-sannidhi-sriharsha.js` |
| `migrate-specific-users.js` | Migrates specific users | `node scripts/database/migrate-specific-users.js` |
| `run-migration.js` | Executes database migrations | `node scripts/database/run-migration.js` |
| `run-schema-corrections.js` | Runs schema corrections | `node scripts/database/run-schema-corrections.js` |
| `run-schema-improvements.js` | Runs schema improvements | `node scripts/database/run-schema-improvements.js` |
| `run-step1-improvements.js` | Runs step 1 improvements | `node scripts/database/run-step1-improvements.js` |
| `test-db.js` | Database connectivity testing | `node scripts/database/test-db.js` |
| `test-debug-profile.js` | Tests user profile debugging | `node scripts/database/test-debug-profile.js` |
| `test-updated-apis.js` | Tests updated API endpoints | `node scripts/database/test-updated-apis.js` |

### SQL Migration Files (`/scripts/database/`)
SQL files for database schema changes and migrations.

| Script | Purpose | Usage |
|--------|---------|-------|
| `add-user-id-to-invitations-migration.sql` | Adds user ID to invitations | Execute via MySQL client |
| `create-invitation-tables.sql` | Creates invitation system tables | Execute via MySQL client |
| `database-schema-corrections.sql` | Database structure corrections | Execute via MySQL client |
| `database-schema-improvements.sql` | Database enhancements | Execute via MySQL client |
| `database-schema-migration.sql` | General schema migration | Execute via MySQL client |
| `fix-users-table-autoincrement.sql` | Fixes user table auto-increment | Execute via MySQL client |
| `schema-improvements-step1.sql` | Step 1 schema improvements | Execute via MySQL client |

### Archived Scripts (`/scripts/archive/`)
Deprecated or unused scripts preserved for reference.

| Script | Purpose | Status |
|--------|---------|--------|
| `check-table-structure-stale-20240930.js` | Outdated table structure checker | Archived |

## Usage Instructions

### Running Database Scripts

#### JavaScript Database Scripts
```bash
# Basic usage
node scripts/database/check-alumni-members.js

# With specific parameters (check script documentation)
node scripts/database/check-specific-users.js --user-id=123

# Debug mode
DEBUG=1 node scripts/database/debug-migration.js
```

#### SQL Migration Scripts
```bash
# Execute SQL script via MySQL client
mysql -h [host] -u [user] -p [database] < scripts/database/create-invitation-tables.sql

# Via database management tool
# Import the SQL file through your preferred MySQL management interface
```

### Running Utility Scripts

#### Documentation and Quality Scripts
```bash
# Check documentation standards
npm run validate-docs

# Detect mock data usage
npm run detect-mock-data

# Check for code redundancy
npm run check-redundancy

# Validate deployment readiness
npm run validate-deployment
```

#### Test Runner Scripts
```bash
# Run all tests
node scripts/test-runner.js all --report

# Run specific test types
node scripts/test-runner.js unit e2e

# Quick test run
node scripts/test-runner.js quick
```

## Script Development Guidelines

### Adding New Scripts

1. **Choose the Right Location**:
   - Database-related: `scripts/database/`
   - General utilities: `scripts/`
   - Deprecated scripts: `scripts/archive/`

2. **Follow Naming Conventions**:
   - Use descriptive names: `check-foreign-keys.js`
   - Use kebab-case for multi-word names
   - Include category prefix when appropriate

3. **Include Documentation**:
   - Add file header with purpose and usage
   - Include parameter descriptions
   - Add examples in this README

4. **Error Handling**:
   - Implement proper error handling
   - Provide meaningful error messages
   - Include logging for debugging

### Script Standards

- **Configuration**: Use environment variables for configuration
- **Logging**: Use console.log for output, console.error for errors
- **Exit Codes**: Return 0 for success, non-zero for errors
- **Dependencies**: Document any external dependencies

## Environment Variables

Common environment variables used by scripts:

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | Database connection string | Required for DB scripts |
| `NODE_ENV` | Environment (development/production) | development |
| `DEBUG` | Enable debug logging | 0 |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | info |

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify `DATABASE_URL` environment variable
   - Check database server status
   - Validate credentials

2. **Permission Errors**:
   - Ensure proper file permissions on script files
   - Check database user privileges
   - Verify write permissions for output files

3. **Module Not Found Errors**:
   - Run `npm install` to install dependencies
   - Check Node.js version compatibility
   - Verify package.json dependencies

### Getting Help

- Check script file headers for usage instructions
- Review error messages for specific guidance
- Consult this documentation for script purposes
- Check existing scripts for similar functionality

## Maintenance

### Regular Tasks

- **Script Updates**: Keep scripts current with database schema changes
- **Archive Management**: Move unused scripts to archive folder
- **Documentation Updates**: Update this README when adding/removing scripts
- **Dependency Updates**: Keep npm packages updated

### Backup Procedures

- Scripts are version controlled in the repository
- Archive folder contains historical scripts for reference
- Database scripts should be tested before production use

---

**Last Updated**: 2025-09-30
**Scripts Version**: 1.0.0
**Maintained By**: Development Team