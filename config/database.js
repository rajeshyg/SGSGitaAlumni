/**
 * Database configuration and connection pool
 */
import dotenv from 'dotenv';
dotenv.config();

import { getPool } from '../utils/database.js';

// Export a function that returns the pool
export default getPool();
