import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
} from '../controllers/userController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// 全てのルートで認証が必要
router.use(requireAuth);

// ユーザー一覧取得
router.get('/', getUsers);

// ユーザー詳細取得
router.get('/:id', getUser);

// ユーザー作成（管理者のみ）
router.post('/', requireAdmin, createUser);

// ユーザー更新
router.put('/:id', updateUser);

// パスワード変更
router.post('/:id/change-password', changePassword);

// ユーザー削除（管理者のみ）
router.delete('/:id', requireAdmin, deleteUser);

export default router;
