import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const [tables] = await connection.execute(
    "SHOW TABLES LIKE 'FAMILY_ACCESS_LOG'"
  );
  
  if (tables.length === 0) {
    console.log('❌ FAMILY_ACCESS_LOG table does NOT exist!');
    console.log('Creating table now...');
    
    await connection.execute(`
      CREATE TABLE FAMILY_ACCESS_LOG (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        family_member_id VARCHAR(36) NOT NULL,
        parent_user_id INT NOT NULL,
        access_type ENUM('login', 'profile_switch', 'logout') NOT NULL,
        ip_address VARCHAR(45),
        user_agent VARCHAR(255),
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_family_member (family_member_id),
        INDEX idx_parent_user (parent_user_id),
        INDEX idx_accessed_at (accessed_at),
        FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ FAMILY_ACCESS_LOG table created successfully!');
  } else {
    console.log('✅ FAMILY_ACCESS_LOG table already exists');
  }
  
  await connection.end();
}

checkTable().catch(console.error);
