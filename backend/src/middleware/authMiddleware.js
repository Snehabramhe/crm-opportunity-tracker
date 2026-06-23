import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken, TOKEN_COOKIE } from '../utils/jwt.js';

/**
 * Extract the JWT from the httpOnly cookie, falling back to the
 * `Authorization: Bearer <token>` header (useful for API clients / tests).
 */
function extractToken(req) {
  if (req.cookies && req.cookies[TOKEN_COOKIE]) {
    return req.cookies[TOKEN_COOKIE];
  }
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

/**
 * Protect routes: verify the token, load the user, and attach `req.user`.
 * The user identity is derived ONLY from the token — never from the request body.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  const payload = verifyToken(token); // throws -> handled as 401 by errorMiddleware
  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  req.user = { id: user.id, name: user.name, email: user.email };
  next();
});

export default protect;
