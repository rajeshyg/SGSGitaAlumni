// Fix duplicate family member and link alumni_member_id
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alumni_network',
};

async function fix() {
  const c = await mysql.createConnection(dbConfig);
  
  const primaryId = 'bc378e2b-3be1-45ca-8f15-bc4fe081d7c4';
  const duplicateId = '2f8c2461-813e-4946-919e-7321991b1900';
  
  await c.beginTransaction();
  
  await c.execute(
    `UPDATE FAMILY_MEMBERS SET alumni_member_id = 4621 WHERE id = ?`,
    [primaryId]
  );
  
  await c.execute(
    `DELETE FROM FAMILY_MEMBERS WHERE id = ?`,
    [duplicateId]
  );
  
  await c.commit();
  await c.end();
}

fix().catch(console.error);
