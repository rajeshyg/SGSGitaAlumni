import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  try {
    const userId = 10025;
    const [prefs] = await pool.query('SELECT areas_of_interest_ids FROM USER_PREFERENCES WHERE user_id = ?', [userId]);
    if (!prefs || prefs.length === 0) {
      console.log('NO_PREFS');
      return;
    }
    const raw = prefs[0].areas_of_interest_ids;
    let ids = [];
    if (Array.isArray(raw)) ids = raw;
    else if (Buffer.isBuffer(raw)) ids = JSON.parse(raw.toString());
    else if (typeof raw === 'string') ids = JSON.parse(raw);
    else if (typeof raw === 'object') ids = Object.values(raw);

    if (ids.length === 0) {
      console.log('NO_INTEREST_IDS');
      return;
    }
    const [rows] = await pool.query(`SELECT id, name FROM DOMAINS WHERE id IN (${ids.map(()=>'?').join(',')})`, ids);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('ERR', err);
  } finally {
    await pool.end();
  }
})();
