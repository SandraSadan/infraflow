import { Request, Response } from 'express';
import {
  findUserByEmail,
  generateAccessToken
} from '../services/auth.service.js';

export const demoLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (process.env.AUTH_PROVIDER !== 'demo') {
    res.status(403).json({
      success: false,
      message: 'Demo authentication is disabled.'
    });
    return;
  }

  const { email } = req.body;

  if (
    typeof email !== 'string' ||
    !['requester@infraflow.local', 'admin@infraflow.local'].includes(email)
  ) {
    res.status(400).json({
      success: false,
      message: 'Select a valid demo identity.'
    });
    return;
  }

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Demo user not found. Run database setup first.'
      });
      return;
    }

    const token = generateAccessToken(user);

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user
    });
  } catch (error) {
    console.error('Demo login error:', error);

    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};
