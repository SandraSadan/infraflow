import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

import {
  createRequest,
  getRequests,
  getRequestById
} from '../controllers/request.controller.js';

const router = Router();

// All request endpoints require authentication
router.use(authenticateToken);

// Submit a new infrastructure request
router.post(
  '/',
  authorizeRoles('REQUESTER', 'ADMIN'),
  createRequest
);

// Retrieve requests visible to the logged-in user
router.get('/', getRequests);

// Retrieve a specific request
router.get('/:id', getRequestById);

export default router;
