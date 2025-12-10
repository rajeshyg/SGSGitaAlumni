/**
 * Check collations across all relevant tables
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkCollations() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  console.log('Connected to database');
  console.log('');

  const tables = [
    'POSTINGS',
    'user_profiles',
    'accounts',
    'alumni_members',
    'POSTING_CATEGORIES',
    'POSTING_DOMAINS',
    'POSTING_TAGS',
    'DOMAINS',
    'TAGS'
  ];

  try {
    // Check table collations
    console.log('=== TABLE COLLATIONS ===');
    const [tableInfo] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${tables.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...tables]);
    
    for (const table of tableInfo) {
      console.log(`${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    }

    // Check column collations for key columns
    console.log('\n=== KEY COLUMN COLLATIONS ===');
    const keyColumns = [
      { table: 'POSTINGS', column: 'id' },
      { table: 'POSTINGS', column: 'author_id' },
      { table: 'POSTINGS', column: 'category_id' },
      { table: 'user_profiles', column: 'id' },
      { table: 'user_profiles', column: 'account_id' },
      { table: 'user_profiles', column: 'alumni_member_id' },
      { table: 'accounts', column: 'id' },
      { table: 'alumni_members', column: 'id' },
      { table: 'POSTING_CATEGORIES', column: 'id' }
    ];

    for (const { table, column } of keyColumns) {
      try {
        const [colInfo] = await pool.query(`
          SELECT COLUMN_NAME, COLLATION_NAME, COLUMN_TYPE, CHARACTER_SET_NAME
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [process.env.DB_NAME, table, column]);
        
        if (colInfo.length > 0) {
          const col = colInfo[0];
          console.log(`${table}.${column}: ${col.COLUMN_TYPE} | charset=${col.CHARACTER_SET_NAME} | collation=${col.COLLATION_NAME}`);
        } else {
          console.log(`${table}.${column}: NOT FOUND`);
        }
      } catch (e) {
        console.log(`${table}.${column}: ERROR - ${e.message}`);
      }
    }

    // Check for mixed collations in JOINs
    console.log('\n=== CHECKING JOIN COMPATIBILITY ===');
    
    // Check POSTINGS.author_id vs user_profiles.id
    const [postingAuthor] = await pool.query(`
      SELECT COLLATION_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'POSTINGS' AND COLUMN_NAME = 'author_id'
    `, [process.env.DB_NAME]);
    
    const [userProfileId] = await pool.query(`
      SELECT COLLATION_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'id'
    `, [process.env.DB_NAME]);
    
    console.log(`POSTINGS.author_id collation: ${postingAuthor[0]?.COLLATION_NAME}`);
    console.log(`user_profiles.id collation: ${userProfileId[0]?.COLLATION_NAME}`);
    console.log(`MATCH: ${postingAuthor[0]?.COLLATION_NAME === userProfileId[0]?.COLLATION_NAME}`);

    // Check user_profiles.account_id vs accounts.id
    const [upAccountId] = await pool.query(`
      SELECT COLLATION_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'account_id'
    `, [process.env.DB_NAME]);
    
    const [accountsId] = await pool.query(`
      SELECT COLLATION_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'accounts' AND COLUMN_NAME = 'id'
    `, [process.env.DB_NAME]);
    
    console.log(`\nuser_profiles.account_id collation: ${upAccountId[0]?.COLLATION_NAME}`);
    console.log(`accounts.id collation: ${accountsId[0]?.COLLATION_NAME}`);
    console.log(`MATCH: ${upAccountId[0]?.COLLATION_NAME === accountsId[0]?.COLLATION_NAME}`);

    // Check user_profiles.alumni_member_id vs alumni_members.id
    const [upAlumniId] = await pool.query(`
      SELECT COLLATION_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'alumni_member_id'
    `, [process.env.DB_NAME]);
    
    const [alumniId] = await pool.query(`
      SELECT COLLATION_NAME FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'alumni_members' AND COLUMN_NAME = 'id'
    `, [process.env.DB_NAME]);
    
    console.log(`\nuser_profiles.alumni_member_id collation: ${upAlumniId[0]?.COLLATION_NAME}`);
    console.log(`alumni_members.id collation: ${alumniId[0]?.COLLATION_NAME}`);
    console.log(`MATCH: ${upAlumniId[0]?.COLLATION_NAME === alumniId[0]?.COLLATION_NAME}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCollations();
