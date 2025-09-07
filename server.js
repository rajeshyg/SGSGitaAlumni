import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Database Configuration
const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

// MySQL connection pool
let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
    console.log('MySQL: Connection pool created');
  }
  return pool;
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await getPool().getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get file imports with pagination and search
app.get('/api/file-imports', async (req, res) => {
  try {
    const connection = await getPool().getConnection();
    const { page = 0, pageSize = 10, search, status } = req.query;

    console.log('API: Fetching file imports from raw_csv_uploads...', { page, pageSize, search, status });

    // Build WHERE clause for raw_csv_uploads table
    let whereClause = '';
    const queryParams = [];

    if (search) {
      whereClause = 'WHERE (File_name LIKE ? OR Description LIKE ? OR Source LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM raw_csv_uploads ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Get paginated data
    const offset = parseInt(page) * parseInt(pageSize);
    const dataQuery = `
      SELECT * FROM raw_csv_uploads
      ${whereClause}
      ORDER BY ID DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${offset}
    `;
    const dataParams = queryParams; // Don't add LIMIT/OFFSET to params since we're using string interpolation

    const [rows] = await connection.execute(dataQuery, dataParams);

    connection.release();

    // Transform the data to match our expected format
    const transformedData = rows.map(row => ({
      id: row.ID,
      filename: row.File_name,
      file_type: row.Format || 'csv',
      upload_date: new Date().toISOString(), // We don't have upload_date, so use current date
      status: 'completed', // Assume completed since data exists
      records_count: 1, // Each row represents one file upload
      processed_records: 1,
      errors_count: 0,
      uploaded_by: row.Source || 'Unknown',
      file_size: 'Unknown', // We don't have file size info
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: row.Description,
      category: row.Category,
      // Include the actual alumni data from ROW_DATA
      alumni_data: row.ROW_DATA
    }));

    res.json({
      data: transformedData,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    });

  } catch (error) {
    console.error('Error fetching file imports:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single file import
app.get('/api/file-imports/:id', async (req, res) => {
  try {
    const connection = await getPool().getConnection();
    const { id } = req.params;

    const [rows] = await connection.execute('SELECT * FROM raw_csv_uploads WHERE ID = ?', [id]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'File import not found' });
    }

    // Transform the data to match our expected format
    const row = rows[0];
    const transformedData = {
      id: row.ID,
      filename: row.File_name,
      file_type: row.Format || 'csv',
      upload_date: new Date().toISOString(),
      status: 'completed',
      records_count: 1,
      processed_records: 1,
      errors_count: 0,
      uploaded_by: row.Source || 'Unknown',
      file_size: 'Unknown',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: row.Description,
      category: row.Category,
      alumni_data: row.ROW_DATA
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching file import:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create file import - Disabled for existing data
app.post('/api/file-imports', async (req, res) => {
  res.status(403).json({
    error: 'Creating new file imports is disabled. This endpoint works with existing raw_csv_uploads data only.'
  });
});

// Update file import - Disabled for existing data
app.put('/api/file-imports/:id', async (req, res) => {
  res.status(403).json({
    error: 'Updating file imports is disabled. This endpoint works with existing raw_csv_uploads data only.'
  });
});

// Delete file import - Disabled for existing data
app.delete('/api/file-imports/:id', async (req, res) => {
  res.status(403).json({
    error: 'Deleting file imports is disabled. This endpoint works with existing raw_csv_uploads data only.'
  });
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const connection = await getPool().getConnection();

    const query = `
      SELECT
        COUNT(*) as total_imports,
        COUNT(DISTINCT File_name) as unique_files,
        COUNT(DISTINCT Category) as categories
      FROM raw_csv_uploads
    `;

    const [rows] = await connection.execute(query);
    connection.release();

    const stats = rows[0];

    res.json({
      totalImports: stats.total_imports || 0,
      completedImports: stats.total_imports || 0, // All existing data is "completed"
      failedImports: 0, // No failed imports in existing data
      totalRecords: stats.total_imports || 0, // Each row is one record
      uniqueFiles: stats.unique_files || 0,
      categories: stats.categories || 0
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export data
app.get('/api/export', async (req, res) => {
  try {
    const { format = 'json', search } = req.query;
    const connection = await getPool().getConnection();

    // Build WHERE clause for search
    let whereClause = '';
    const queryParams = [];

    if (search) {
      whereClause = 'WHERE (File_name LIKE ? OR Description LIKE ? OR Source LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const query = `SELECT * FROM raw_csv_uploads ${whereClause} ORDER BY ID DESC`;
    const [rows] = await connection.execute(query, queryParams);
    connection.release();

    if (format === 'csv') {
      const headers = ['ID', 'File Name', 'Description', 'Source', 'Category', 'Format', 'Name', 'Email', 'Phone', 'Batch', 'Result', 'Family ID', 'Student ID', 'Family Name', 'Center Name'];
      const csvRows = rows.map(row => {
        const alumniData = row.ROW_DATA || {};
        return [
          row.ID,
          row.File_name,
          row.Description,
          row.Source,
          row.Category,
          row.Format,
          alumniData.Name || '',
          alumniData.Email || '',
          alumniData.Phone || '',
          alumniData.batch || '',
          alumniData.result || '',
          alumniData.familyId || '',
          alumniData.studentId || '',
          alumniData.FamilyName || '',
          alumniData.centerName || ''
        ];
      });

      const csvContent = [headers, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="alumni-data.csv"');
      res.send(csvContent);
    } else {
      // Transform data for JSON export
      const transformedData = rows.map(row => ({
        id: row.ID,
        filename: row.File_name,
        description: row.Description,
        source: row.Source,
        category: row.Category,
        format: row.Format,
        alumni_data: row.ROW_DATA
      }));
      res.json(transformedData);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
  console.log(`📊 MySQL Database: ${DB_CONFIG.database}`);
  console.log(`🏠 Host: ${DB_CONFIG.host}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});