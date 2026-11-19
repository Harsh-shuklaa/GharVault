import mongoose from 'mongoose';
import { seedInitialData } from './seed.js';

let isConnected = false;

// Dynamically track Mongoose connection state
mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[Database] MongoDB Atlas connection established.');
});

mongoose.connection.on('error', (err) => {
  console.warn('[Database] MongoDB Atlas connection warning:', err.message);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] MongoDB Atlas disconnected. Using in-memory fallback store.');
  isConnected = false;
});

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('username:password') || mongoUri.includes('<password>')) {
    console.warn('[Database] MONGODB_URI not provided or placeholder detected.');
    console.log('[Database] Initializing in-memory mock MongoDB data store for seamless local execution.');
    await seedInitialData(false);
    return;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      family: 4,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    await seedInitialData(true);
  } catch (err) {
    isConnected = false;
    console.error(`[Database] MongoDB Atlas connection failed: ${err.message}`);
    console.log('[Database] Falling back to high-fidelity In-Memory Store so GharVault remains 100% operational.');
    await seedInitialData(false);
  }
};

export const getIsConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

export { isConnected };
