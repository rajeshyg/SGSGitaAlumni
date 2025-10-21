/**
 * Test Database Setup Utilities
 * Provides utilities for creating and managing test databases for integration tests
 */

const mysql = require('mysql2/promise');

let testDbConnection = null;

/**
 * Create a test database connection
 */
async function createTestDatabase() {
  try {
    // Use environment variables or defaults for test database
    const testDbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sgsgita_alumni_test',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    };

    // Create connection
    testDbConnection = await mysql.createConnection(testDbConfig);

    // Ensure test database exists and is clean
    await initializeTestDatabase(testDbConnection);

    return testDbConnection;
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  }
}

/**
 * Clean up test database
 */
async function cleanupTestDatabase(connection) {
  try {
    if (connection) {
      // Clean up test data
      await connection.execute('DELETE FROM USER_PREFERENCES WHERE user_id LIKE ?', ['test-user-%']);
      await connection.execute('DELETE FROM users WHERE id LIKE ?', ['test-user-%']);
      await connection.execute('DELETE FROM DOMAINS WHERE id LIKE ?', ['test-%']);

      await connection.end();
    }
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
}

/**
 * Initialize test database with required tables
 */
async function initializeTestDatabase(connection) {
  try {
    // Create DOMAINS table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS DOMAINS (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        parent_domain_id VARCHAR(255),
        domain_level ENUM('primary', 'secondary', 'area_of_interest') NOT NULL,
        display_order INT DEFAULT 0,
        icon VARCHAR(255),
        color_code VARCHAR(7),
        metadata JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE
      )
    `);

    // Create users table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create USER_PREFERENCES table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS USER_PREFERENCES (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        primary_domain_id VARCHAR(255),
        secondary_domain_ids JSON,
        areas_of_interest_ids JSON,
        preference_type ENUM('professional', 'social', 'both') DEFAULT 'both',
        max_postings INT DEFAULT 5,
        notification_settings JSON,
        privacy_settings JSON,
        interface_settings JSON,
        is_professional BOOLEAN DEFAULT FALSE,
        education_status VARCHAR(255) DEFAULT 'professional',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (primary_domain_id) REFERENCES DOMAINS(id) ON DELETE SET NULL,
        UNIQUE KEY unique_user_preferences (user_id)
      )
    `);

    console.log('Test database initialized successfully');
  } catch (error) {
    console.error('Error initializing test database:', error);
    throw error;
  }
}

module.exports = {
  createTestDatabase,
  cleanupTestDatabase
};