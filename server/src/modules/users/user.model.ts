import { Prisma, User as PrismaUser, UserRole } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class User implements PrismaUser {
  id: string;
  email: string;
  name: string | null;
  
  @Exclude()
  passwordHash: string;
  
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}

export type CreateUserInput = Prisma.UserCreateInput;

export type UpdateUserInput = Prisma.UserUpdateInput;

export interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
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
  role?: UserRole;
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

// Mapper functions
export const toUserResponse = (user: PrismaUser): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const toUserWithTokens = (
  user: PrismaUser,
  tokens: { accessToken: string; refreshToken: string }
): UserWithTokens => ({
  ...toUserResponse(user),
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
});

// Utility functions
export const isAdmin = (user: { role: UserRole }): boolean => {
  return user.role === 'ADMIN';
};

export const hasRole = (user: { role: UserRole }, ...roles: UserRole[]): boolean => {
  return roles.includes(user.role);
};
