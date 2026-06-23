import { Router } from 'express';
import { register, login, logout, me } from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';
import { registerSchema, loginSchema } from '../validators/authValidators.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', protect, logout);
router.get('/me', protect, me);

export default router;
