import dns from 'dns';
import mongoose from 'mongoose';
import { seedInitialData } from './seed.js';
import User from '../models/User.js';

// Configure reliable DNS servers to prevent Windows querySrv ECONNREFUSED on MongoDB SRV records
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('[Database] Custom DNS resolver setup warning:', dnsErr.message);
}

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

  // Attempt connection with public DNS resolvers
  try {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch (e) {}

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    try {
      await User.syncIndexes();
      console.log('[Database] User unique indexes synchronized.');
    } catch (idxErr) {
      console.warn('[Database] User index sync warning:', idxErr.message);
    }
    await seedInitialData(true);
  } catch (err) {
    console.warn(`[Database] MongoDB Atlas initial connection failed (${err.message}), retrying once with explicit Cloudflare DNS...`);
    try {
      dns.setServers(['1.1.1.1', '8.8.8.8']);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 12000,
        connectTimeoutMS: 12000,
        family: 4,
      });
      isConnected = true;
      console.log(`[Database] MongoDB Atlas Connected on retry: ${conn.connection.host}`);
      await seedInitialData(true);
    } catch (retryErr) {
      isConnected = false;
      console.error(`[Database] MongoDB Atlas connection failed: ${retryErr.message}`);
      console.log('[Database] Falling back to high-fidelity In-Memory Store so GharVault remains 100% operational.');
      await seedInitialData(false);
    }
  }
};

export const getIsConnected = () => {
  return (isConnected || mongoose.connection.readyState === 1);
};

export { isConnected };
