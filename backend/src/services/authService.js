import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { signToken } from '../utils/jwt.js';

/**
 * Register a new user. Email uniqueness is enforced by the unique index;
 * we check first for a friendlier 409 message.
 */
export async function registerUser({ name, email, password }) {
  const exists = await User.findOne({ email });
  if (exists) {
    throw ApiError.conflict('Email already registered');
  }
  const user = await User.create({ name, email, password });
  const token = signToken(user.id);
  return { user, token };
}

/** Authenticate by email + password. Returns the user and a fresh token. */
export async function loginUser({ email, password }) {
  // password has select:false, so explicitly include it for comparison.
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  const token = signToken(user.id);
  return { user, token };
}

export async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
}
