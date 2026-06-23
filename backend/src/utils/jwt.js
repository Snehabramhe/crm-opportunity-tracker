import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/** Sign a JWT carrying the user id as `sub`. */
export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/** Verify a JWT and return its decoded payload. Throws on invalid/expired tokens. */
export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/**
 * Standard options for the auth cookie.
 * In production the frontend and backend live on different domains (Vercel/Render),
 * so the cookie must be SameSite=None + Secure to be sent cross-site.
 */
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: env.cookieMaxAge,
    path: '/',
  };
}

export const TOKEN_COOKIE = 'token';
