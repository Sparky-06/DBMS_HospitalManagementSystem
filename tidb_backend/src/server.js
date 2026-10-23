const path = require('path');
const fs = require('fs');

// Load environment variables with priority to tidb_backend/.env
const backendEnv = path.resolve(__dirname, '../.env');
const rootEnv = path.resolve(__dirname, '../../.env');

if (fs.existsSync(backendEnv)) {
  require('dotenv').config({ path: backendEnv, override: true });
} else if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv });
}

const app = require('./app');
const { testConnection, pool, poolConfig } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('====================================================');
  console.log('  Hospital PMS Server (TiDB Cloud Backend)          ');
  console.log('====================================================');

  const isPlaceholder = poolConfig.user && poolConfig.user.includes('your_cluster_prefix');
  if (isPlaceholder) {
    console.warn('\n⚠️  [ACTION REQUIRED] Placeholder credentials detected in tidb_backend/.env');
    console.warn('   To connect to TiDB Cloud, please update tidb_backend/.env with:');
    console.warn('     - DB_HOST (your cluster host, e.g. gateway01.us-east-1.prod.aws.tidbcloud.com)');
    console.warn('     - DB_USER (your user with prefix, e.g. 2xYzAbc.root)');
    console.warn('     - DB_PASSWORD (your generated TiDB password)');
    console.warn('   Then run: npm run db:test\n');
  }

  const dbOk = await testConnection();

  if (dbOk) {
    console.log(
      `[DB] Successfully connected to TiDB Cloud database: ${poolConfig.database}`
    );
    console.log(
      `[DB] Endpoint: ${poolConfig.host}:${poolConfig.port} | SSL: ${poolConfig.ssl ? 'Enabled (TLS v1.2+)' : 'Disabled'}`
    );
  } else if (!isPlaceholder) {
    console.warn('[DB WARNING] Could not connect to TiDB Cloud database.');
    console.warn(
      '[DB WARNING] Verify credentials in tidb_backend/.env (DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_SSL).'
    );
  }

  const server = app.listen(PORT, () => {
    console.log(`[API] Server is running on: http://localhost:${PORT}`);
    console.log(`[API] Health check:         http://localhost:${PORT}/api/health`);
    console.log(`[API] Dashboard stats:      http://localhost:${PORT}/api/dashboard/stats`);
    console.log(`[API] Compatible with:      Frontend on http://localhost:5173`);
    console.log('====================================================\n');
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Closing HTTP server and DB connections...`);

    server.close(async () => {
      try {
        await pool.end();
        console.log('Database pool closed cleanly.');
      } catch (err) {
        console.error('Error closing database pool:', err);
      }

      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();
