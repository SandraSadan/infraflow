
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth.service.js';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Authentication token is required.'
    });
    return;
  }

  const token = authorization.split(' ')[1];

  try {
    const user = verifyAccessToken(token);

    req.user = user;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};
