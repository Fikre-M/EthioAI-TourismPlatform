import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { config } from '../config/index';
import { log } from '../utils/logger';
import { EmailService } from './email.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
  UpdateProfileInput
} from '../schemas/auth.schemas';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: RegisterInput): Promise<any> {
    const existingUser = await prisma.users.findUnique({ where: { email: data.email } });
    if (existingUser) throw new ConflictError('User with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, config.security.bcryptSaltRounds);

    const user = await (prisma.users.create as any)({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        passwordHash,
        phone: (data as any).phone,
        role: 'USER',
        updatedAt: new Date(),
      },
    });

    const tokens = generateTokenPair(user.id, user.role);

    await (prisma.refresh_tokens.create as any)({
      data: {
        id: crypto.randomUUID(),
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    try {
      await EmailVerificationService.sendVerificationEmail(user.id);
    } catch (emailError) {
      log.error('Failed to send welcome email:', emailError);
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  static async login(data: LoginInput): Promise<any> {
    const user = await prisma.users.findUnique({ where: { email: data.email } });
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedError('Invalid email or password');

    const tokens = generateTokenPair(user.id, user.role);

    if (!(data as any).rememberMe) {
      await prisma.refresh_tokens.deleteMany({ where: { userId: user.id } });
    }

    await (prisma.refresh_tokens.create as any)({
      data: {
        id: crypto.randomUUID(),
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + ((data as any).rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    log.auth('User logged in', user.id, { email: user.email });

    const { passwordHash: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.refresh_tokens.deleteMany({ where: { userId, token: refreshToken } });
    } else {
      await prisma.refresh_tokens.deleteMany({ where: { userId } });
    }
    log.auth('User logged out', userId);
  }

  static async refreshToken(refreshToken: string): Promise<any> {
    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const storedToken = await prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
      include: { users: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired or invalid');
    }

    const tokens = generateTokenPair(storedToken.users.id, storedToken.users.role);

    await prisma.refresh_tokens.update({
      where: { id: storedToken.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });

    log.auth('Token refreshed', storedToken.users.id);
    return tokens;
  }

  static async getCurrentUser(userId: string): Promise<any> {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(userId: string, data: UpdateProfileInput): Promise<any> {
    const updateData: any = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if ((data as any).phone !== undefined) updateData.phone = (data as any).phone;
    if ((data as any).bio !== undefined) updateData.bio = (data as any).bio;
    if ((data as any).location !== undefined) updateData.location = (data as any).location;
    if ((data as any).dateOfBirth !== undefined) {
      updateData.dateOfBirth = (data as any).dateOfBirth ? new Date((data as any).dateOfBirth) : null;
    }

    const user = await prisma.users.update({ where: { id: userId }, data: updateData });
    log.auth('Profile updated', userId);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const isCurrentPasswordValid = await bcrypt.compare((data as any).currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) throw new UnauthorizedError('Current password is incorrect');

    const newPasswordHash = await bcrypt.hash((data as any).newPassword, config.security.bcryptSaltRounds);
    await prisma.users.update({ where: { id: userId }, data: { passwordHash: newPasswordHash, updatedAt: new Date() } });
    await prisma.refresh_tokens.deleteMany({ where: { userId } });
    log.auth('Password changed', userId);
  }

  static async forgotPassword(data: ForgotPasswordInput): Promise<any> {
    return PasswordResetService.requestPasswordReset(data.email);
  }

  static async resetPassword(data: ResetPasswordInput): Promise<any> {
    return PasswordResetService.resetPassword((data as any).token, (data as any).newPassword);
  }

  static async verifyEmail(userId: string, token: string): Promise<void> {
    const result = await EmailVerificationService.verifyEmail(token);
    if ((result as any).users?.id !== userId) {
      throw new UnauthorizedError('Token does not belong to this user');
    }
  }
}
