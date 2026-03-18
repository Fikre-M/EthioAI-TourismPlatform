import { Request, Response, NextFunction } from 'express';

export type UserRole = 'USER' | 'ADMIN' | 'GUIDE' | 'VENDOR';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

// Use type alias with intersection to ensure all Request properties are available
export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  userId?: string;
};
