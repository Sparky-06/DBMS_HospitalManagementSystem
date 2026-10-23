const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Support loading .env from tidb_backend directory, fallback to root .env
const backendEnv = path.resolve(__dirname, '../../.env');
const rootEnv = path.resolve(__dirname, '../../../.env');

const isTestEnv = process.env.NODE_ENV === 'test';

if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv, override: true });
} else if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

// Preserve test environment if set by Jest / test runner
if (isTestEnv) {
  process.env.NODE_ENV = 'test';
}

function cleanVal(val) {
  if (!val) return val;
  return String(val).replace(/^['"]|['"]$/g, '').trim();
}

// Resolve variables with support for common aliases (DB_USER vs DB_USERNAME, DB_NAME vs DB_DATABASE)
const dbHost = cleanVal(process.env.DB_HOST || 'localhost');
const dbPort = parseInt(cleanVal(process.env.DB_PORT) || '4000', 10);
const dbUser = cleanVal(process.env.DB_USER || process.env.DB_USERNAME || 'root');
const dbPassword = cleanVal(process.env.DB_PASSWORD || process.env.DB_PASS || '');
let dbName = cleanVal(process.env.DB_NAME || process.env.DB_DATABASE || 'hospital_pms');

// If 'sys' was accidentally chosen as database, redirect to hospital_pms
if (dbName === 'sys') {
  dbName = 'hospital_pms';
}

// Build TiDB Cloud connection pool configuration
const poolConfig = {
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  // TCP KeepAlive prevents cloud load balancers / TiDB Serverless proxies from closing idle sockets
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// If full DATABASE_URL connection string is provided, parse and apply it
if (process.env.DATABASE_URL) {
  try {
    const parsedUrl = new URL(process.env.DATABASE_URL);
    poolConfig.host = parsedUrl.hostname || poolConfig.host;
    if (parsedUrl.port) {
      poolConfig.port = parseInt(parsedUrl.port, 10);
    }
    if (parsedUrl.username) {
      poolConfig.user = decodeURIComponent(parsedUrl.username);
    }
    if (parsedUrl.password) {
      poolConfig.password = decodeURIComponent(parsedUrl.password);
    }
    if (parsedUrl.pathname && parsedUrl.pathname.length > 1) {
      poolConfig.database = parsedUrl.pathname.replace(/^\//, '');
    }
  } catch (err) {
    console.warn('[DB] Warning: Could not parse DATABASE_URL as URL. Using standard parameters.', err.message);
  }
}

// Enable SSL when configured (TiDB Cloud requires SSL by default)
const isSslEnabled = process.env.DB_SSL !== 'false';
if (isSslEnabled) {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    minVersion: 'TLSv1.2'
  };

  // Optional custom CA certificate file path (e.g. if custom trust store is needed)
  if (process.env.DB_CA_PATH && fs.existsSync(process.env.DB_CA_PATH)) {
    poolConfig.ssl.ca = fs.readFileSync(process.env.DB_CA_PATH);
  }
}

const pool = mysql.createPool(poolConfig);

/**
 * Test the database connection pool
 */
async function testConnection() {
  let connection;

  try {
    if (poolConfig.user && poolConfig.user.includes('your_cluster_prefix')) {
      console.warn('[DB WARNING] You are currently using template placeholder credentials in tidb_backend/.env');
      console.warn('[DB WARNING] Please update DB_HOST, DB_USER, and DB_PASSWORD with your TiDB Cloud cluster details.');
      return false;
    }
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
  poolConfig,
  testConnection
};
