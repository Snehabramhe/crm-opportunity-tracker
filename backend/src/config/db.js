import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

/**
 * Connect to MongoDB. Called once on server startup.
 * Throws on failure so server.js can exit with a non-zero code.
 */
export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  logger.info(`MongoDB connected: ${conn.connection.host}`);
  return conn;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export default connectDB;
