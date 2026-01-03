import { PrismaClient, User, UserRole } from '@prisma/client';
import { hashPassword, comparePasswords } from '../../utils/password';

const prisma = new PrismaClient();

export interface CreateUserInput {
  name?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
}

export interface UserResponse {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userService = {
  async createUser(data: CreateUserInput): Promise<UserResponse> {
    const { password, ...rest } = data;
    const passwordHash = await hashPassword(password);

    return prisma.user.create({
      data: {
        ...rest,
        passwordHash,
      },
      select: userSelect,
    });
  },

  async findUserByEmail(email: string, includePassword = false): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        refreshTokens: false,
        ...(includePassword && { passwordHash: true }),
      },
    });
  },

  async findUserById(id: string): Promise<UserResponse | null> {
    return prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
  },

  async updateUser(
    id: string,
    data: UpdateUserInput
  ): Promise<UserResponse> {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
      delete updateData.password;
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
  },

  async deleteUser(id: string): Promise<UserResponse> {
    return prisma.user.delete({
      where: { id },
      select: userSelect,
    });
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return comparePasswords(password, user.passwordHash);
  },

  async markEmailAsVerified(email: string): Promise<UserResponse> {
    return prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
      select: userSelect,
    });
  },

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  },

  async listUsers({
    page = 1,
    limit = 10,
    role,
  }: {
    page?: number;
    limit?: number;
    role?: UserRole;
  } = {}): Promise<{ users: UserResponse[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  async changeUserRole(id: string, role: UserRole): Promise<UserResponse> {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
  },
};
