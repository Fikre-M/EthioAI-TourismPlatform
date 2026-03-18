import { Prisma } from '@prisma/client';
import { UserRole } from '../auth/auth.types';

export type UserRoleType = UserRole;

export interface UserModel {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  dateOfBirth?: Date | null;
}

export type CreateUserInput = Prisma.usersCreateInput;
export type UpdateUserInput = Prisma.usersUpdateInput;

export interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithTokens extends UserResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserFilterOptions {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  isEmailVerified?: boolean;
}

export interface PaginatedUserResponse {
  data: UserResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const toUserResponse = (user: UserModel): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const toUserWithTokens = (
  user: UserModel,
  tokens: { accessToken: string; refreshToken: string }
): UserWithTokens => ({
  ...toUserResponse(user),
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
});

export const isAdmin = (user: { role: string }): boolean => {
  return user.role === 'ADMIN';
};

export const hasRole = (user: { role: string }, ...roles: string[]): boolean => {
  return roles.includes(user.role);
};
