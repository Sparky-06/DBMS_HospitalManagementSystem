const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { testConnection, pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('====================================================');
  console.log('  Hospital Patient Management System (HPMS) Server  ');
  console.log('====================================================');

  const dbOk = await testConnection();
  if (dbOk) {
    console.log(`[DB] Successfully connected to MySQL (${process.env.DB_NAME || 'hospital_pms'})`);
  } else {
    console.warn(`[DB WARNING] Could not connect to MySQL database.`);
    console.warn(`[DB WARNING] Ensure MySQL is running and verify backend/.env settings.`);
  }

  const server = app.listen(PORT, () => {
    console.log(`[API] Server is running on: http://localhost:${PORT}`);
    console.log(`[API] Health check:         http://localhost:${PORT}/api/health`);
    console.log(`[API] Dashboard stats:      http://localhost:${PORT}/api/dashboard/stats`);
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
