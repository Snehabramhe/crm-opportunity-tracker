import dotenv from 'dotenv';

dotenv.config();

const required = ['JWT_SECRET'];

// In non-test environments MONGO_URI is also required (tests use an in-memory server).
if (process.env.NODE_ENV !== 'test') {
  required.push('MONGO_URI');
}

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Fail fast with a clear message instead of cryptic downstream errors.
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const env = {
  port: Number(process.env.PORT) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  cookieMaxAge: Number(process.env.COOKIE_MAX_AGE) || 2 * 60 * 60 * 1000,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

export default env;
