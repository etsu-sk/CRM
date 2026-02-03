import { dbGet } from '../config/database';

// ユーザーが顧客の担当者かどうかを確認
export const isUserAssignedToCompany = async (
  userId: number,
  companyId: number
): Promise<boolean> => {
  const assignment = await dbGet(
    `SELECT id FROM company_assignments
     WHERE user_id = ? AND company_id = ? AND deleted_at IS NULL`,
    [userId, companyId]
  );
  return !!assignment;
};

// ユーザーが顧客を編集できるかどうかを確認
export const canUserEditCompany = async (
  userId: number,
  userRole: 'admin' | 'user',
  companyId: number
): Promise<boolean> => {
  // 管理者は全て編集可能
  if (userRole === 'admin') {
    return true;
  }

  // 一般ユーザーは担当顧客のみ編集可能
  return await isUserAssignedToCompany(userId, companyId);
};

// ユーザーが活動履歴を編集できるかどうかを確認
export const canUserEditActivity = async (
  userId: number,
  userRole: 'admin' | 'user',
  activityId: number
): Promise<boolean> => {
  // 管理者は全て編集可能
  if (userRole === 'admin') {
    return true;
  }

  // 一般ユーザーは自分が登録した活動のみ編集可能
  const activity = await dbGet(
    'SELECT user_id FROM activity_logs WHERE id = ? AND deleted_at IS NULL',
    [activityId]
  );

  return activity && activity.user_id === userId;
};
