import { Router } from 'express';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  assignUser,
  unassignUser,
} from '../controllers/contactController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 全てのルートで認証が必要
router.use(requireAuth);

// 取引先担当者管理
router.get('/company/:companyId', getContacts); // 特定顧客の取引先担当者一覧
router.get('/:id', getContact); // 取引先担当者詳細
router.post('/company/:companyId', createContact); // 取引先担当者作成
router.put('/:id', updateContact); // 取引先担当者更新
router.delete('/:id', deleteContact); // 取引先担当者削除

// 当方担当者割り当て管理
router.post('/company/:companyId/assign', assignUser); // 当方担当者割り当て
router.delete('/assignment/:assignmentId', unassignUser); // 当方担当者割り当て解除

export default router;
