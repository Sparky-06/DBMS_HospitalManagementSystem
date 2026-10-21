const mysql = require('mysql2/promise');
const path = require('path');
<<<<<<< HEAD
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
=======
const fs = require('fs');

// Support loading .env from root or backend directory
const backendEnv = path.resolve(__dirname, '../../.env');
const rootEnv = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv });
}
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}
require('dotenv').config();

const poolConfig = {
>>>>>>> ab06b9a (DA2 Final Commit)
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_pms',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // Returns DATE and TIME as strings instead of JavaScript Date objects to avoid timezone shift
<<<<<<< HEAD
});
=======
};

// Enable SSL when configured (required for TiDB Cloud or SSL-enabled MySQL)
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2'
  };
}

const pool = mysql.createPool(poolConfig);
>>>>>>> ab06b9a (DA2 Final Commit)

/**
 * Test the database connection pool
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
