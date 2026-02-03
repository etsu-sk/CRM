import { Router } from 'express';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../controllers/companyController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// 全てのルートで認証が必要
router.use(requireAuth);

// 顧客一覧取得
router.get('/', getCompanies);

// 顧客詳細取得
router.get('/:id', getCompany);

// 顧客作成
router.post('/', createCompany);

// 顧客更新
router.put('/:id', updateCompany);

// 顧客削除（管理者のみ）
router.delete('/:id', requireAdmin, deleteCompany);

export default router;
