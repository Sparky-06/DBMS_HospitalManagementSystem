const path = require('path');
const fs = require('fs');

// Load tidb_backend/.env
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath, override: true });
}

function cleanVal(val) {
  if (!val) return val;
  return String(val).replace(/^['"]|['"]$/g, '').trim();
}

async function runDiagnostics() {
  console.log('====================================================');
  console.log('  TiDB Cloud Connection Diagnostics                 ');
  console.log('====================================================');

  const host = cleanVal(process.env.DB_HOST || '');
  const port = cleanVal(process.env.DB_PORT || '4000');
  const user = cleanVal(process.env.DB_USER || process.env.DB_USERNAME || '');
  const password = cleanVal(process.env.DB_PASSWORD || process.env.DB_PASS || '');
  let database = cleanVal(process.env.DB_NAME || process.env.DB_DATABASE || 'hospital_pms');
  if (database === 'sys') database = 'hospital_pms';
  const dbUrl = cleanVal(process.env.DATABASE_URL || '');

  console.log(`[Config Check]`);
  console.log(`  - DB_HOST:     ${host || '(not set)'}`);
  console.log(`  - DB_PORT:     ${port}`);
  console.log(`  - DB_USER:     ${user || '(not set)'}`);
  console.log(`  - DB_PASSWORD: ${password ? '******** (' + password.length + ' chars)' : '(not set)'}`);
  console.log(`  - DB_NAME:     ${database}`);
  console.log(`  - DB_SSL:      ${process.env.DB_SSL || 'true'}`);
  if (dbUrl) {
    console.log(`  - DATABASE_URL: Set (${dbUrl.replace(/:[^:@]+@/, ':****@')})`);
  }
  console.log('----------------------------------------------------');

  // Check for placeholder credentials
  const isPlaceholder = 
    user.includes('your_cluster_prefix') || 
    password.includes('your_tidb_cloud_password') ||
    (dbUrl && (dbUrl.includes('<user>') || dbUrl.includes('<password>')));

  if (isPlaceholder) {
    console.error('\n❌ ERROR: Placeholder credentials detected in tidb_backend/.env!');
    console.error('You need to replace the placeholders with your actual TiDB Cloud cluster details:\n');
    console.error('1. Open your TiDB Cloud Console: https://tidbcloud.com');
    console.error('2. Go to your cluster -> click "Connect" -> choose "Node.js" or "General / SQL Client".');
    console.error('3. Copy your actual Endpoint, Username (e.g. 3ABCxyz.root), and Password.');
    console.error('4. Paste them into tidb_backend/.env, then rerun:\n     npm run db:test\n');
    process.exit(1);
  }

  console.log('\n[Connecting] Attempting handshake with TiDB Cloud...');
  const { pool, poolConfig } = require('../config/db');

  try {
    const conn = await pool.getConnection();
    console.log('✅ Handshake successful!');

    const [ver] = await conn.query('SELECT VERSION() AS version');
    console.log(`✅ Cluster Version: ${ver[0].version}`);

    try {
      const [tidbVer] = await conn.query('SELECT tidb_version() AS tidb');
      if (tidbVer && tidbVer[0]) {
        console.log(`✅ TiDB Engine confirmed.`);
      }
    } catch (e) {
      // ignore
    }

    // Check if hospital_pms tables exist
    const [tables] = await conn.query('SHOW TABLES');
    conn.release();

    console.log(`\n✅ Database "${poolConfig.database}" is reachable!`);
    console.log(`   Found ${tables.length} tables in this database.`);
    if (tables.length === 0) {
      console.log('\n💡 Notice: No tables found yet in database.');
      console.log('   Run: npm run db:init   (to create schema)');
      console.log('   Run: npm run db:seed   (to load sample data)');
    }

    console.log('\n====================================================');
    console.log('  TiDB Cloud is ready! You can now start the server:');
    console.log('  npm run dev                                       ');
    console.log('====================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection Failed:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code:    ${error.code || 'N/A'}`);

    if (error.message && error.message.includes('user-name-prefix')) {
      console.error('\n👉 Cause: Invalid Username Prefix or Password.');
      console.error('   On TiDB Cloud Serverless, your username MUST have a prefix, e.g.:');
      console.error('   DB_USER=2aXyZ918.root');
      console.error('   Verify your credentials in TiDB Cloud Console -> Connect.');
    } else if (error.message && error.message.includes('ENOTFOUND')) {
      console.error('\n👉 Cause: The DB_HOST could not be resolved. Please verify the host name in .env.');
    }
    console.log('\n====================================================\n');
    process.exit(1);
  }
}

runDiagnostics();
