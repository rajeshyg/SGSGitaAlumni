#!/bin/bash

# COPPA Database Migration - Run Locally
# This script deploys PARENT_CONSENT_RECORDS and AGE_VERIFICATION_AUDIT tables

echo "🚀 Starting COPPA Compliance Database Migration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with database credentials"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Migration Details:"
echo "   Database: $DB_NAME"
echo "   Host: $DB_HOST"
echo "   User: $DB_USER"
echo ""

# Run migration
echo "🔧 Running migration script..."
node scripts/database/run-migration.js scripts/database/migrations/create-coppa-compliance-tables.sql

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Verifying tables..."

    # Connect to database and verify tables
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
        SELECT 'Checking PARENT_CONSENT_RECORDS...' as status;
        SELECT COUNT(*) as row_count FROM PARENT_CONSENT_RECORDS;
        SELECT 'Checking AGE_VERIFICATION_AUDIT...' as status;
        SELECT COUNT(*) as row_count FROM AGE_VERIFICATION_AUDIT;
    "

    echo ""
    echo "✅ All done! Tables created successfully."
    echo ""
    echo "Next steps:"
    echo "1. Start the server: npm start"
    echo "2. Follow testing guide: docs/COPPA_TESTING_GUIDE.md"
else
    echo ""
    echo "❌ Migration failed. Check error messages above."
    echo ""
    echo "Troubleshooting:"
    echo "1. Verify database credentials in .env"
    echo "2. Check network connection to AWS RDS"
    echo "3. Ensure database user has CREATE TABLE permissions"
    exit 1
fi
