import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { ensureBucketExists } from './services/supabaseStorage.js';

import authRoutes from './routes/auth.routes.js';
import familyRoutes from './routes/family.routes.js';
import documentRoutes from './routes/document.routes.js';
import auditRoutes from './routes/audit.routes.js';
import quorumRoutes from './routes/quorum.routes.js';
import breakGlassRoutes from './routes/breakGlass.routes.js';
import categoryRoutes from './routes/category.routes.js';
import exportRoutes from './routes/export.routes.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/quorum', quorumRoutes);
app.use('/api/break-glass', breakGlassRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    app: 'GharVault Secure API',
    version: '2.4.9',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      supabaseStorage: true,
      mongoAtlas: true,
      breakGlassProtocol: true,
      dualKeyQuorum: true,
      sha256AuditChain: true,
    },
  });
});

// Serve frontend in production / unified mode
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('GharVault Backend API is active. Run Vite dev server for frontend.');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const startServer = async () => {
  try {
    await connectDB();
    await ensureBucketExists();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🛡️  GharVault Backend Server running on port ${PORT}`);
      console.log(`📍  API Health: http://localhost:${PORT}/api/health`);
      console.log(`🔒  Zero-Knowledge Encryption: Active (256-bit AES)`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
};

startServer();
