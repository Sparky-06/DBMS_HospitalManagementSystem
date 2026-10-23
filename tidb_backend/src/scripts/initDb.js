const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables from tidb_backend/.env
const backendEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv, override: true });
}

function cleanVal(val) {
  if (!val) return val;
  return String(val).replace(/^['"]|['"]$/g, '').trim();
}

async function initializeDatabase() {
  console.log('====================================================');
  console.log('  TiDB Cloud Database Schema Initialization         ');
  console.log('====================================================');

  const host = cleanVal(process.env.DB_HOST || 'localhost');
  const port = parseInt(cleanVal(process.env.DB_PORT) || '4000', 10);
  const user = cleanVal(process.env.DB_USER || process.env.DB_USERNAME || 'root');
  const password = cleanVal(process.env.DB_PASSWORD || process.env.DB_PASS || '');
  let database = cleanVal(process.env.DB_NAME || process.env.DB_DATABASE || 'hospital_pms');
  if (database === 'sys') database = 'hospital_pms';
  const isSsl = process.env.DB_SSL !== 'false';

  console.log(`[Config] Target Host: ${host}:${port}`);
  console.log(`[Config] Target User: ${user}`);
  console.log(`[Config] Database:    ${database}`);
  console.log(`[Config] SSL/TLS:     ${isSsl ? 'Enabled' : 'Disabled'}\n`);

  const connectionConfig = {
    host,
    port,
    user,
    password,
    multipleStatements: true,
    dateStrings: true
  };

  if (isSsl) {
    connectionConfig.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      minVersion: 'TLSv1.2'
    };
    if (process.env.DB_CA_PATH && fs.existsSync(process.env.DB_CA_PATH)) {
      connectionConfig.ssl.ca = fs.readFileSync(process.env.DB_CA_PATH);
    }
  }

  const schemaPath = path.resolve(__dirname, '../../../sql/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`[Error] Schema file not found at: ${schemaPath}`);
    process.exit(1);
  }

  let connection;
  try {
    console.log('[1/3] Connecting to TiDB Cloud cluster...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('  -> Connection established.');

    console.log(`[2/3] Ensuring database "${database}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${database}\`;`);
    console.log(`  -> Switched to database "${database}".`);

    console.log('[3/3] Reading and executing sql/schema.sql...');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // If custom database name differs from hospital_pms, adjust USE statement
    if (database !== 'hospital_pms') {
      schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS hospital_pms[^;]*;/gi, '');
      schemaSql = schemaSql.replace(/USE hospital_pms;/gi, `USE \`${database}\`;`);
    }

    await connection.query(schemaSql);
    console.log('  -> Schema created successfully!');

    // Verify created tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log('\n[Verification] Created tables:');
    tableNames.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

    console.log('\n====================================================');
    console.log('  TiDB Cloud schema initialized successfully!       ');
    console.log('  Next: Run "npm run db:seed" to load sample data.   ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[Error initializing TiDB Cloud database]:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
