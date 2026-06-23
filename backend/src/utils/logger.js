import env from '../config/env.js';

/**
 * Small centralized logger. Keeps logging in one place so the rest of the
 * app never calls console.* directly. Silent during tests to keep output clean.
 */
const isTest = env.nodeEnv === 'test';

function ts() {
  // Date.now is fine at runtime (only the workflow sandbox forbids it).
  return new Date().toISOString();
}

function write(level, args) {
  if (isTest) return;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${ts()}] [${level.toUpperCase()}]`, ...args);
}

const logger = {
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args),
  // Stream adapter so morgan writes through this logger.
  stream: {
    write: (message) => write('info', [message.trim()]),
  },
};

export default logger;
