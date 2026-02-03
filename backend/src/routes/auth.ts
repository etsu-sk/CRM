import { Router } from 'express';
import { login, logout, getCurrentUser } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ログイン
router.post('/login', login);

// ログアウト
router.post('/logout', requireAuth, logout);

// 現在のユーザー情報取得
router.get('/me', requireAuth, getCurrentUser);

export default router;
