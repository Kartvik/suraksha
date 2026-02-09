import { Router } from 'express';
import {
  register,
  login,
  verifyEmail,
  refreshToken,
  logout,
} from '../controller/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;