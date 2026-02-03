import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../config/database';
import { ActivityLog } from '../types';
import { canUserEditActivity, isUserAssignedToCompany } from '../utils/permissions';

// 活動履歴一覧取得（顧客ごと）
export const getActivitiesByCompany = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const activities = await dbAll(
      `SELECT a.*, u.name as user_name, c.name as company_name
       FROM activity_logs a
       JOIN users u ON a.user_id = u.id
       JOIN companies c ON a.company_id = c.id
       WHERE a.company_id = ? AND a.deleted_at IS NULL
       ORDER BY a.activity_date DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [companyId, Number(limit), offset]
    );

    // 総件数取得
    const countResult = await dbGet(
      'SELECT COUNT(*) as total FROM activity_logs WHERE company_id = ? AND deleted_at IS NULL',
      [companyId]
    ) as { total: number };

    res.json({
      activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('活動履歴一覧取得エラー:', error);
    res.status(500).json({ error: '活動履歴一覧の取得中にエラーが発生しました' });
  }
};

// ネクストアクション一覧取得
export const getNextActions = async (req: Request, res: Response) => {
  try {
    const { days = 7, overdue } = req.query;

    let query = `
      SELECT a.*, u.name as user_name, c.name as company_name
      FROM activity_logs a
      JOIN users u ON a.user_id = u.id
      JOIN companies c ON a.company_id = c.id
      WHERE a.next_action_date IS NOT NULL AND a.deleted_at IS NULL
    `;

    const params: any[] = [];

    // 一般ユーザーは自分が担当している顧客のネクストアクションのみ表示
    if (req.user?.role !== 'admin') {
      query += ` AND c.id IN (
        SELECT company_id FROM company_assignments
        WHERE user_id = ? AND deleted_at IS NULL
      )`;
      params.push(req.user?.id);
    }

    // 期限超過の場合
    if (overdue === 'true') {
      query += ` AND date(a.next_action_date) < date('now')`;
    } else {
      // 指定日数以内のネクストアクション
      query += ` AND date(a.next_action_date) BETWEEN date('now') AND date('now', '+' || ? || ' days')`;
      params.push(Number(days));
    }

    query += ` ORDER BY a.next_action_date ASC`;

    const activities = await dbAll(query, params);

    res.json({ activities });
  } catch (error) {
    console.error('ネクストアクション一覧取得エラー:', error);
    res.status(500).json({ error: 'ネクストアクション一覧の取得中にエラーが発生しました' });
  }
};

// 活動履歴詳細取得
export const getActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await dbGet(
      `SELECT a.*, u.name as user_name, c.name as company_name
       FROM activity_logs a
       JOIN users u ON a.user_id = u.id
       JOIN companies c ON a.company_id = c.id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [id]
    ) as ActivityLog | undefined;

    if (!activity) {
      return res.status(404).json({ error: '活動履歴が見つかりません' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('活動履歴詳細取得エラー:', error);
    res.status(500).json({ error: '活動履歴詳細の取得中にエラーが発生しました' });
  }
};

// 活動履歴作成
export const createActivity = async (req: Request, res: Response) => {
  try {
    const {
      companyId,
      activityDate,
      activityType,
      content,
      nextActionDate,
      nextActionContent,
    } = req.body;

    // バリデーション
    if (!companyId || !activityDate || !activityType || !content) {
      return res.status(400).json({ error: '必須項目を入力してください' });
    }

    // 活動種別の検証
    const validTypes = ['visit', 'phone', 'email', 'web_meeting', 'other'];
    if (!validTypes.includes(activityType)) {
      return res.status(400).json({ error: '無効な活動種別です' });
    }

    // 顧客が存在するか確認
    const company = await dbGet(
      'SELECT id FROM companies WHERE id = ? AND deleted_at IS NULL',
      [companyId]
    );

    if (!company) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }

    // 担当顧客かどうかを確認（一般ユーザーの場合）
    if (req.user?.role !== 'admin') {
      const isAssigned = await isUserAssignedToCompany(req.user!.id, Number(companyId));
      if (!isAssigned) {
        return res.status(403).json({ error: '担当していない顧客の活動履歴は作成できません' });
      }
    }

    const result = await dbRun(
      `INSERT INTO activity_logs (
        company_id, user_id, activity_date, activity_type, content,
        next_action_date, next_action_content
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId,
        req.user!.id,
        activityDate,
        activityType,
        content,
        nextActionDate || null,
        nextActionContent || null,
      ]
    );

    const activityId = result.lastID;

    res.status(201).json({
      message: '活動履歴を作成しました',
      activityId,
    });
  } catch (error) {
    console.error('活動履歴作成エラー:', error);
    res.status(500).json({ error: '活動履歴の作成中にエラーが発生しました' });
  }
};

// 活動履歴更新
export const updateActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      activityDate,
      activityType,
      content,
      nextActionDate,
      nextActionContent,
    } = req.body;

    // 活動履歴が存在するか確認
    const activity = await dbGet(
      'SELECT * FROM activity_logs WHERE id = ? AND deleted_at IS NULL',
      [id]
    ) as ActivityLog | undefined;

    if (!activity) {
      return res.status(404).json({ error: '活動履歴が見つかりません' });
    }

    // 権限チェック
    if (req.user) {
      const canEdit = await canUserEditActivity(req.user.id, req.user.role, Number(id));
      if (!canEdit) {
        return res.status(403).json({ error: '活動履歴を編集する権限がありません' });
      }
    }

    // バリデーション
    if (!activityDate || !activityType || !content) {
      return res.status(400).json({ error: '必須項目を入力してください' });
    }

    // 活動種別の検証
    const validTypes = ['visit', 'phone', 'email', 'web_meeting', 'other'];
    if (!validTypes.includes(activityType)) {
      return res.status(400).json({ error: '無効な活動種別です' });
    }

    await dbRun(
      `UPDATE activity_logs SET
        activity_date = ?, activity_type = ?, content = ?,
        next_action_date = ?, next_action_content = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        activityDate,
        activityType,
        content,
        nextActionDate || null,
        nextActionContent || null,
        id,
      ]
    );

    res.json({ message: '活動履歴を更新しました' });
  } catch (error) {
    console.error('活動履歴更新エラー:', error);
    res.status(500).json({ error: '活動履歴の更新中にエラーが発生しました' });
  }
};

// 活動履歴削除（論理削除）
export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 活動履歴が存在するか確認
    const activity = await dbGet(
      'SELECT * FROM activity_logs WHERE id = ? AND deleted_at IS NULL',
      [id]
    ) as ActivityLog | undefined;

    if (!activity) {
      return res.status(404).json({ error: '活動履歴が見つかりません' });
    }

    // 権限チェック
    if (req.user) {
      const canEdit = await canUserEditActivity(req.user.id, req.user.role, Number(id));
      if (!canEdit) {
        return res.status(403).json({ error: '活動履歴を削除する権限がありません' });
      }
    }

    await dbRun(
      'UPDATE activity_logs SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: '活動履歴を削除しました' });
  } catch (error) {
    console.error('活動履歴削除エラー:', error);
    res.status(500).json({ error: '活動履歴の削除中にエラーが発生しました' });
  }
};
