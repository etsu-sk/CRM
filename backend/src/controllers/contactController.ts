import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../config/database';
import { Contact } from '../types';
import { canUserEditCompany } from '../utils/permissions';

// 取引先担当者一覧取得
export const getContacts = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const contacts = await dbAll(
      'SELECT * FROM contacts WHERE company_id = ? AND deleted_at IS NULL ORDER BY id ASC',
      [companyId]
    );

    res.json({ contacts });
  } catch (error) {
    console.error('取引先担当者一覧取得エラー:', error);
    res.status(500).json({ error: '取引先担当者一覧の取得中にエラーが発生しました' });
  }
};

// 取引先担当者詳細取得
export const getContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await dbGet(
      'SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL',
      [id]
    ) as Contact | undefined;

    if (!contact) {
      return res.status(404).json({ error: '取引先担当者が見つかりません' });
    }

    res.json({ contact });
  } catch (error) {
    console.error('取引先担当者詳細取得エラー:', error);
    res.status(500).json({ error: '取引先担当者詳細の取得中にエラーが発生しました' });
  }
};

// 取引先担当者作成
export const createContact = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const {
      name,
      name_kana,
      department,
      position,
      phone,
      mobile,
      email,
      notes,
    } = req.body;

    // 権限チェック
    if (req.user) {
      const canEdit = await canUserEditCompany(req.user.id, req.user.role, Number(companyId));
      if (!canEdit) {
        return res.status(403).json({ error: '取引先担当者を作成する権限がありません' });
      }
    }

    // バリデーション
    if (!name) {
      return res.status(400).json({ error: '氏名は必須です' });
    }

    // 顧客が存在するか確認
    const company = await dbGet(
      'SELECT id FROM companies WHERE id = ? AND deleted_at IS NULL',
      [companyId]
    );

    if (!company) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }

    const result = await dbRun(
      `INSERT INTO contacts (
        company_id, name, name_kana, department, position, phone, mobile, email, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId, name, name_kana || null, department || null,
        position || null, phone || null, mobile || null, email || null, notes || null
      ]
    );

    const contactId = result.lastID;

    res.status(201).json({
      message: '取引先担当者を作成しました',
      contactId,
    });
  } catch (error) {
    console.error('取引先担当者作成エラー:', error);
    res.status(500).json({ error: '取引先担当者の作成中にエラーが発生しました' });
  }
};

// 取引先担当者更新
export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      name_kana,
      department,
      position,
      phone,
      mobile,
      email,
      notes,
    } = req.body;

    // 取引先担当者が存在するか確認
    const contact = await dbGet(
      'SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL',
      [id]
    ) as Contact | undefined;

    if (!contact) {
      return res.status(404).json({ error: '取引先担当者が見つかりません' });
    }

    // 権限チェック
    if (req.user) {
      const canEdit = await canUserEditCompany(req.user.id, req.user.role, contact.company_id);
      if (!canEdit) {
        return res.status(403).json({ error: '取引先担当者を編集する権限がありません' });
      }
    }

    // バリデーション
    if (!name) {
      return res.status(400).json({ error: '氏名は必須です' });
    }

    await dbRun(
      `UPDATE contacts SET
        name = ?, name_kana = ?, department = ?, position = ?, phone = ?,
        mobile = ?, email = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, name_kana || null, department || null, position || null,
        phone || null, mobile || null, email || null, notes || null, id
      ]
    );

    res.json({ message: '取引先担当者情報を更新しました' });
  } catch (error) {
    console.error('取引先担当者更新エラー:', error);
    res.status(500).json({ error: '取引先担当者情報の更新中にエラーが発生しました' });
  }
};

// 取引先担当者削除（論理削除）
export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 取引先担当者が存在するか確認
    const contact = await dbGet(
      'SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL',
      [id]
    ) as Contact | undefined;

    if (!contact) {
      return res.status(404).json({ error: '取引先担当者が見つかりません' });
    }

    // 権限チェック
    if (req.user) {
      const canEdit = await canUserEditCompany(req.user.id, req.user.role, contact.company_id);
      if (!canEdit) {
        return res.status(403).json({ error: '取引先担当者を削除する権限がありません' });
      }
    }

    await dbRun(
      'UPDATE contacts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: '取引先担当者を削除しました' });
  } catch (error) {
    console.error('取引先担当者削除エラー:', error);
    res.status(500).json({ error: '取引先担当者の削除中にエラーが発生しました' });
  }
};

// 当方担当者割り当て
export const assignUser = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { userId, isPrimary, notes } = req.body;

    // 権限チェック（管理者または既に担当している一般ユーザー）
    if (req.user) {
      const canEdit = await canUserEditCompany(req.user.id, req.user.role, Number(companyId));
      if (!canEdit) {
        return res.status(403).json({ error: '担当者を割り当てる権限がありません' });
      }
    }

    // バリデーション
    if (!userId) {
      return res.status(400).json({ error: '担当者を指定してください' });
    }

    // 顧客が存在するか確認
    const company = await dbGet(
      'SELECT id FROM companies WHERE id = ? AND deleted_at IS NULL',
      [companyId]
    );

    if (!company) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }

    // ユーザーが存在するか確認
    const user = await dbGet(
      'SELECT id FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 既に割り当てられているか確認
    const existing = await dbGet(
      'SELECT id FROM company_assignments WHERE company_id = ? AND user_id = ? AND deleted_at IS NULL',
      [companyId, userId]
    );

    if (existing) {
      return res.status(400).json({ error: 'このユーザーは既に割り当てられています' });
    }

    const result = await dbRun(
      `INSERT INTO company_assignments (company_id, user_id, is_primary, notes)
       VALUES (?, ?, ?, ?)`,
      [companyId, userId, isPrimary ? 1 : 0, notes || null]
    );

    res.status(201).json({
      message: '担当者を割り当てました',
      assignmentId: result.lastID,
    });
  } catch (error) {
    console.error('担当者割り当てエラー:', error);
    res.status(500).json({ error: '担当者の割り当て中にエラーが発生しました' });
  }
};

// 当方担当者割り当て解除
export const unassignUser = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;

    // 割り当てが存在するか確認
    const assignment = await dbGet(
      'SELECT * FROM company_assignments WHERE id = ? AND deleted_at IS NULL',
      [assignmentId]
    );

    if (!assignment) {
      return res.status(404).json({ error: '担当者割り当てが見つかりません' });
    }

    // 権限チェック（管理者または既に担当している一般ユーザー）
    if (req.user) {
      const canEdit = await canUserEditCompany(req.user.id, req.user.role, assignment.company_id);
      if (!canEdit) {
        return res.status(403).json({ error: '担当者割り当てを解除する権限がありません' });
      }
    }

    await dbRun(
      'UPDATE company_assignments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [assignmentId]
    );

    res.json({ message: '担当者割り当てを解除しました' });
  } catch (error) {
    console.error('担当者割り当て解除エラー:', error);
    res.status(500).json({ error: '担当者割り当ての解除中にエラーが発生しました' });
  }
};
