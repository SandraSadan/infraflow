import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getTerraformConfig } from '../controllers/terraform.controller.js';

const router = Router();

router.use(authenticateToken);
router.get('/:id', getTerraformConfig);

export default router;
