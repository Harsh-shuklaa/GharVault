import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from server directory and current working directory
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import { authenticate } from './middleware/auth.js';

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
import userRoutes from './routes/user.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(authenticate);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
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
    service: 'GharVault REST API',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
    features: {
      storage: 'Supabase Private Buckets',
      database: 'MongoDB Atlas',
      encryption: 'AES-256-GCM',
    },
  });
});

// Serve local uploads in offline/fallback mode securely
app.use('/api/documents/raw', (req, res, next) => {
  const filePath = req.path.replace(/^\//, '');
  const baseUploads = path.resolve(__dirname, '../uploads/vault');
  const localTarget = path.resolve(baseUploads, decodeURIComponent(filePath).replace(/\//g, '_'));
  if (path.resolve(localTarget).startsWith(baseUploads)) {
    res.sendFile(localTarget, (err) => {
      if (err) next();
    });
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.url}`,
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

    app.listen(PORT, '0.0.0.0', () => {
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
