import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from './auth.validator';

const router = Router();

// Public auth endpoints
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Protected endpoints
router.get('/me', authenticate, authController.getMe);

export default router;
