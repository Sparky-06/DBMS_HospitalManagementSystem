const express = require('express');
const router = express.Router();
const { testConnection } = require('../config/db');

router.get('/', async (req, res) => {
  const isDbConnected = await testConnection();

  return res.status(200).json({
    success: true,
    data: {
      status: isDbConnected ? 'UP' : 'DEGRADED',
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime())
    },
    message: isDbConnected ? 'Hospital PMS API and Database are healthy' : 'Hospital PMS API is running but Database connection is down'
  });
});

module.exports = router;
