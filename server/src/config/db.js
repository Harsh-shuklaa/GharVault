import mongoose from 'mongoose';
import dns from 'dns';
import { seedInitialData } from './seed.js';

let isConnected = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('username:password') || mongoUri.includes('<password>')) {
    console.warn('[Database] MONGODB_URI not provided or placeholder detected.');
    console.log('[Database] Initializing in-memory mock MongoDB data store for seamless local execution.');
    await seedInitialData(false);
    return;
  }

  // Set reliable public DNS resolvers so ISP routers do not time out on SRV record queries
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (dnsErr) {
    // ignore if restricted
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Atlas Connected: ${conn.connection.host}`);
    await seedInitialData(true);
  } catch (err) {
    console.error(`[Database] MongoDB Atlas connection failed: ${err.message}`);
    console.log('[Database] Falling back to high-fidelity In-Memory Store so GharVault remains 100% operational.');
    await seedInitialData(false);
  }
};

export { isConnected };
