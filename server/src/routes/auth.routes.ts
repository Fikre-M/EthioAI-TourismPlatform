import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, validateRefreshToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '../schemas/auth.schemas';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

/**
 * Authentication Routes
 * All routes are prefixed with /api/auth
 */

// One-time demo user seed endpoint — protected by a secret token
router.post('/seed-demo', async (req: Request, res: Response) => {
  const { secret } = req.body;
  if (secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const email = 'demo@example.com';
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.json({ message: 'Demo user already exists', email });
    }
    const passwordHash = await bcrypt.hash('Demo123!', 10);
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Demo User',
        email,
        passwordHash,
        role: 'user',
        updatedAt: new Date(),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(201).json({ message: 'Demo user created', user });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Public routes (no authentication required)
router.post('/register', validate({ body: registerSchema }), AuthController.register);
router.post('/login', validate({ body: loginSchema }), AuthController.login);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), AuthController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), AuthController.resetPassword);
router.post('/refresh', validate({ body: refreshTokenSchema }), AuthController.refreshToken);

// Protected routes (authentication required)
router.get('/me', authenticate, AuthController.getCurrentUser);
router.post('/logout', authenticate, AuthController.logout);
router.put('/profile', authenticate, validate({ body: updateProfileSchema }), AuthController.updateProfile);
router.put('/change-password', authenticate, validate({ body: changePasswordSchema }), AuthController.changePassword);
router.post('/verify-email', authenticate, AuthController.verifyEmail);

export default router;