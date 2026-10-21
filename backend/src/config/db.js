
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Support loading .env from the backend directory or project root
const backendEnv = path.resolve(__dirname, '../../.env');
const rootEnv = path.resolve(__dirname, '../../../.env');

if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv });
}

if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

// Create the MySQL connection pool
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_pms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

// Enable SSL when configured (e.g. TiDB Cloud)
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized:
      process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2'
  };
}

const pool = mysql.createPool(poolConfig);

/**
 * Test the database connection pool
 */
async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  pool,
  testConnection
};
