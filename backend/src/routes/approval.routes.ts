import { Router } from 'express';

import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

import {
  approveRequest,
  rejectRequest
} from '../controllers/approval.controller.js';

const router = Router();

// All approval operations require admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

// Approve an infrastructure request
router.post('/:id/approve', approveRequest);

// Reject an infrastructure request
router.post('/:id/reject', rejectRequest);

export default router;
