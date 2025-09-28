// Script to run database schema improvements
import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  multipleStatements: true, // Allow multiple SQL statements
};

async function runSchemaImprovements() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database successfully');

    // Read the SQL file
    const sqlContent = fs.readFileSync('database-schema-improvements.sql', 'utf8');
    
    // Split into individual statements (basic splitting by semicolon)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\nExecuting ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 80)}...`);
        await connection.execute(statement);
        successCount++;
        console.log('✅ Success');
      } catch (error) {
        errorCount++;
        
        // Some errors are expected (like adding columns that already exist)
        if (error.code === 'ER_DUP_FIELDNAME' || 
            error.code === 'ER_DUP_KEYNAME' ||
            error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log('⚠️  Expected error (already exists):', error.message);
        } else {
          console.log('❌ Error:', error.message);
        }
      }
    }

    console.log(`\n=== EXECUTION SUMMARY ===`);
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    // Verify the improvements
    console.log('\n=== VERIFYING IMPROVEMENTS ===');

    // Check alumni_members structure
    console.log('\n--- Alumni Members Table Structure ---');
    const [alumniStructure] = await connection.execute('DESCRIBE alumni_members');
    console.table(alumniStructure.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // Check app_users structure
    console.log('\n--- App Users Table Structure ---');
    const [usersStructure] = await connection.execute('DESCRIBE app_users');
    console.table(usersStructure.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Null: col.Null,
      Key: col.Key,
      Default: col.Default
    })));

    // Check foreign keys
    console.log('\n--- Foreign Key Constraints ---');
    const [foreignKeys] = await connection.execute(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_NAME IN ('app_users', 'alumni_members')
    `);
    console.table(foreignKeys);

    // Check if new tables were created
    console.log('\n--- New Tables Created ---');
    const [newTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('user_invitations', 'alumni_audit_log')
    `);
    console.table(newTables);

    // Test the improved user profile query
    console.log('\n--- Testing Improved User Profile Query ---');
    const [testResult] = await connection.execute(`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.status as user_status,
        u.email_verified,
        am.family_name,
        am.father_name,
        am.status as alumni_status,
        am.email as alumni_email
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = 4600
    `);
    
    console.log('User 4600 profile data:', testResult[0]);

    console.log('\n✅ Schema improvements completed successfully!');

  } catch (error) {
    console.error('Error running schema improvements:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSchemaImprovements();
