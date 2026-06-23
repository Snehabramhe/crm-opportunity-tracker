import asyncHandler from '../utils/asyncHandler.js';
import { cookieOptions, TOKEN_COOKIE } from '../utils/jwt.js';
import * as authService from '../services/authService.js';

/** Set the JWT as an httpOnly cookie on the response. */
function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE, token, cookieOptions());
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  setAuthCookie(res, token);
  res.status(201).json({
    success: true,
    // token also returned in the body for non-browser API clients / tests.
    token,
    user,
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  setAuthCookie(res, token);
  res.status(200).json({ success: true, token, user });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(TOKEN_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.status(200).json({ success: true, message: 'Logged out' });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  res.status(200).json({ success: true, user });
});
