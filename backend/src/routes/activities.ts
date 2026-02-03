import { Router } from 'express';
import {
  getActivitiesByCompany,
  getNextActions,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activityController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 全てのルートで認証が必要
router.use(requireAuth);

// ネクストアクション一覧
router.get('/next-actions', getNextActions);

// 特定顧客の活動履歴一覧
router.get('/company/:companyId', getActivitiesByCompany);

// 活動履歴詳細
router.get('/:id', getActivity);

// 活動履歴作成
router.post('/', createActivity);

// 活動履歴更新
router.put('/:id', updateActivity);

// 活動履歴削除
router.delete('/:id', deleteActivity);

export default router;
