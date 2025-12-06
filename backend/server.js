import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import bountiesRouter from './routes/bounties.js';
import reportsRouter from './routes/reports.js';
import { startAutoApprovalJob } from './jobs/autoApproval.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json({ limit: '10mb' })); // Support large encrypted payloads

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BountyChain MVP Backend'
  });
});

// API Routes
app.use('/api/bounties', bountiesRouter);
app.use('/api/reports', reportsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('');
  console.log('🚀 BountyChain MVP Backend');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`🔐 Encryption: AES-256-GCM + RSA-2048`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('📚 API Endpoints:');
  console.log('  POST   /api/bounties           - Create bounty');
  console.log('  GET    /api/bounties/:id       - Get bounty');
  console.log('  GET    /api/bounties           - List bounties');
  console.log('  POST   /api/reports            - Submit encrypted report');
  console.log('  GET    /api/reports/:id        - Get encrypted report');
  console.log('  GET    /api/reports/bounty/:id - List bounty reports');
  console.log('  POST   /api/reports/:id/status - Update report status');
  console.log('');

  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // Start auto-approval job
  startAutoApprovalJob();

  console.log('');
  console.log('✅ Server ready!');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️  SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});
