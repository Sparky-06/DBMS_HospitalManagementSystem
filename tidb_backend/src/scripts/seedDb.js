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

async function seedDatabase() {
  console.log('====================================================');
  console.log('  TiDB Cloud Database Seeding                       ');
  console.log('====================================================');

  const host = cleanVal(process.env.DB_HOST || 'localhost');
  const port = parseInt(cleanVal(process.env.DB_PORT) || '4000', 10);
  const user = cleanVal(process.env.DB_USER || process.env.DB_USERNAME || 'root');
  const password = cleanVal(process.env.DB_PASSWORD || process.env.DB_PASS || '');
  let database = cleanVal(process.env.DB_NAME || process.env.DB_DATABASE || 'hospital_pms');
  if (database === 'sys') database = 'hospital_pms';
  const isSsl = process.env.DB_SSL !== 'false';

  console.log(`[Config] Target Host: ${host}:${port}`);
  console.log(`[Config] Database:    ${database}`);
  console.log(`[Config] SSL/TLS:     ${isSsl ? 'Enabled' : 'Disabled'}\n`);

  const connectionConfig = {
    host,
    port,
    user,
    password,
    database,
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

  const seedPath = path.resolve(__dirname, '../../../sql/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error(`[Error] Seed file not found at: ${seedPath}`);
    process.exit(1);
  }

  let connection;
  try {
    console.log('[1/2] Connecting to TiDB Cloud cluster...');
    connection = await mysql.createConnection(connectionConfig);
    console.log('  -> Connection established.');

    console.log('[2/2] Reading and executing sql/seed.sql...');
    let seedSql = fs.readFileSync(seedPath, 'utf8');

    // If custom database name differs from hospital_pms, adjust USE statement
    if (database !== 'hospital_pms') {
      seedSql = seedSql.replace(/USE hospital_pms;/gi, `USE \`${database}\`;`);
    }

    await connection.query(seedSql);
    console.log('  -> Seed data inserted successfully!');

    // Show quick count verification
    const [empCount] = await connection.query('SELECT COUNT(*) AS count FROM employee');
    const [patCount] = await connection.query('SELECT COUNT(*) AS count FROM patient');
    const [docCount] = await connection.query('SELECT COUNT(*) AS count FROM doctor');
    const [roomCount] = await connection.query('SELECT COUNT(*) AS count FROM room');

    console.log('\n[Verification] Current Record Counts:');
    console.log(`  - Employees: ${empCount[0].count}`);
    console.log(`  - Patients:  ${patCount[0].count}`);
    console.log(`  - Doctors:   ${docCount[0].count}`);
    console.log(`  - Rooms:     ${roomCount[0].count}`);

    console.log('\n====================================================');
    console.log('  TiDB Cloud seed completed successfully!           ');
    console.log('  You can now start the server: npm run dev         ');
    console.log('====================================================\n');
  } catch (error) {
    console.error('\n[Error seeding TiDB Cloud database]:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
