/**
 * Add College Admission and Scholarships domains to the database
 * This script adds missing education-related domains that are commonly needed
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
};

async function addEducationDomains() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');

    // ========================================================================
    // STEP 1: Find or create Education primary domain
    // ========================================================================
    console.log('📋 Step 1: Checking for Education primary domain...');
    
    const [educationDomains] = await connection.query(`
      SELECT id, name FROM DOMAINS
      WHERE name = 'Education' AND domain_level = 'primary'
      LIMIT 1
    `);
    
    let educationPrimaryId;
    
    if (educationDomains.length === 0) {
      console.log('⚠️  Education primary domain not found, creating it...');
      educationPrimaryId = uuidv4();
      await connection.query(`
        INSERT INTO DOMAINS (
          id, name, description, parent_domain_id, domain_level,
          display_order, icon, color_code, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        educationPrimaryId,
        'Education',
        'Education and learning domains',
        null,
        'primary',
        4,
        'graduation-cap',
        '#10b981',
        true
      ]);
      console.log('✅ Created Education primary domain');
    } else {
      educationPrimaryId = educationDomains[0].id;
      console.log(`✅ Found Education primary domain: ${educationPrimaryId}`);
    }

    // ========================================================================
    // STEP 2: Find or create Higher Education secondary domain
    // ========================================================================
    console.log('\n📋 Step 2: Checking for Higher Education secondary domain...');
    
    const [higherEdDomains] = await connection.query(`
      SELECT id, name FROM DOMAINS
      WHERE name = 'Higher Education' AND domain_level = 'secondary'
      AND parent_domain_id = ?
      LIMIT 1
    `, [educationPrimaryId]);
    
    let higherEdSecondaryId;
    
    if (higherEdDomains.length === 0) {
      console.log('⚠️  Higher Education secondary domain not found, creating it...');
      higherEdSecondaryId = uuidv4();
      await connection.query(`
        INSERT INTO DOMAINS (
          id, name, description, parent_domain_id, domain_level,
          display_order, icon, color_code, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        higherEdSecondaryId,
        'Higher Education',
        'Post-secondary education and research',
        educationPrimaryId,
        'secondary',
        1,
        'university',
        '#10b981',
        true
      ]);
      console.log('✅ Created Higher Education secondary domain');
    } else {
      higherEdSecondaryId = higherEdDomains[0].id;
      console.log(`✅ Found Higher Education secondary domain: ${higherEdSecondaryId}`);
    }

    // ========================================================================
    // STEP 3: Add College Admission and Scholarships areas of interest
    // ========================================================================
    console.log('\n📋 Step 3: Adding College Admission and Scholarships areas of interest...');
    
    const areasToAdd = [
      {
        name: 'College Admissions',
        description: 'College application process, admissions counseling, and university selection'
      },
      {
        name: 'Scholarships & Financial Aid',
        description: 'Scholarship opportunities, financial aid, grants, and student funding'
      },
      {
        name: 'Graduate School Admissions',
        description: 'Graduate program applications, GRE/GMAT prep, and advanced degree planning'
      },
      {
        name: 'Study Abroad Programs',
        description: 'International education opportunities and exchange programs'
      }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const area of areasToAdd) {
      // Check if area already exists
      const [existing] = await connection.query(`
        SELECT id FROM DOMAINS
        WHERE name = ? AND parent_domain_id = ?
      `, [area.name, higherEdSecondaryId]);

      if (existing.length > 0) {
        console.log(`⏭️  Skipped "${area.name}" (already exists)`);
        skippedCount++;
        continue;
      }

      const areaId = uuidv4();
      await connection.query(`
        INSERT INTO DOMAINS (
          id, name, description, parent_domain_id, domain_level,
          display_order, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        areaId,
        area.name,
        area.description,
        higherEdSecondaryId,
        'area_of_interest',
        addedCount + 1,
        true
      ]);
      
      console.log(`✅ Added "${area.name}"`);
      addedCount++;
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Added ${addedCount} new area(s) of interest`);
    console.log(`⏭️  Skipped ${skippedCount} existing area(s)`);
    console.log(`📁 Parent domain: Education > Higher Education`);
    console.log('='.repeat(70));
    console.log('\n✅ Script completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
addEducationDomains();

