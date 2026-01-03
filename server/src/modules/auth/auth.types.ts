import { UserRole } from '@prisma/client';

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

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}
