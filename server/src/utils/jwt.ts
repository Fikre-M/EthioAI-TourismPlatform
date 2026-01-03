import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

export const signRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

export const verifyToken = <T>(
  token: string,
  secret: string
): T | null => {
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    return null;
  }
};

export const verifyAccessToken = (token: string): TokenPayload | null => {
  return verifyToken<TokenPayload>(token, config.jwt.accessSecret);
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  return verifyToken<{ userId: string }>(token, config.jwt.refreshSecret);
};
