
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export type UserRole = 'REQUESTER' | 'ADMIN';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return secret;
};

export const findUserByEmail = async (
  email: string
): Promise<AuthUser | null> => {
  const result = await pool.query(
    `SELECT id, name, email, role
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] ?? null;
};

export const generateAccessToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      sub: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role
    },
    getJwtSecret(),
    {
      expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn']
    }
  );
};

export const verifyAccessToken = (token: string): AuthUser => {
  const decoded = jwt.verify(token, getJwtSecret());

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.name !== 'string' ||
    typeof decoded.email !== 'string' ||
    !['REQUESTER', 'ADMIN'].includes(decoded.role as string)
  ) {
    throw new Error('Invalid access token.');
  }

  return {
    id: Number(decoded.sub),
    name: decoded.name,
    email: decoded.email,
    role: decoded.role as UserRole
  };
};
