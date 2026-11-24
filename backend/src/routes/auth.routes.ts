import { Router } from 'express';
import { demoLogin } from '../controllers/auth.controller.js';

const router = Router();

router.post('/demo', demoLogin);

export default router;
