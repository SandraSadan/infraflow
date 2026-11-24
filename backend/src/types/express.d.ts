import { AuthUser } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export {};
