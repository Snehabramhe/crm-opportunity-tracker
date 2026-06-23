import app from './app.js';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';

async function start() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
