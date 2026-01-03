import { z } from 'zod';
import { UserRole } from '@prisma/client';

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, {
    message: 'Password must contain at least one special character',
  });

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters long' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: passwordSchema,
    role: z.nativeEnum(UserRole).default('USER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Invalid email address' }),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, { message: 'Token is required' }),
  }),
  body: z.object({
    password: passwordSchema,
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'] & {
  token: string;
};
