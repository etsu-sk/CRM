import { Request, Response } from 'express';
import { dbRun, dbGet, dbAll } from '../config/database';
import { Company } from '../types';
import { canUserEditCompany, isUserAssignedToCompany } from '../utils/permissions';

// 顧客一覧取得
export const getCompanies = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT c.*,
        GROUP_CONCAT(DISTINCT u.name) as assigned_users
      FROM companies c
      LEFT JOIN company_assignments ca ON c.id = ca.company_id AND ca.deleted_at IS NULL
      LEFT JOIN users u ON ca.user_id = u.id AND u.deleted_at IS NULL
      WHERE c.deleted_at IS NULL
    `;

    const params: any[] = [];

    // 検索条件
    if (search) {
      query += ` AND (c.name LIKE ? OR c.name_kana LIKE ? OR c.address LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` GROUP BY c.id ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const companies = await dbAll(query, params);

    // 総件数取得
    let countQuery = 'SELECT COUNT(*) as total FROM companies WHERE deleted_at IS NULL';
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (name LIKE ? OR name_kana LIKE ? OR address LIKE ?)`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern);
    }

    const countResult = await dbGet(countQuery, countParams) as { total: number };

    res.json({
      companies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('顧客一覧取得エラー:', error);
    res.status(500).json({ error: '顧客一覧の取得中にエラーが発生しました' });
  }
};

// 顧客詳細取得
export const getCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const company = await dbGet(
      'SELECT * FROM companies WHERE id = ? AND deleted_at IS NULL',
      [id]
    ) as Company | undefined;

    if (!company) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }

    // 担当者一覧を取得
    const assignments = await dbAll(
      `SELECT ca.*, u.name as user_name, u.email as user_email
       FROM company_assignments ca
       JOIN users u ON ca.user_id = u.id
       WHERE ca.company_id = ? AND ca.deleted_at IS NULL
       ORDER BY ca.is_primary DESC, ca.assigned_at DESC`,
      [id]
    );

    // 取引先担当者一覧を取得
    const contacts = await dbAll(
      'SELECT * FROM contacts WHERE company_id = ? AND deleted_at IS NULL ORDER BY id ASC',
      [id]
    );

    res.json({
      company,
      assignments,
      contacts,
    });
  } catch (error) {
    console.error('顧客詳細取得エラー:', error);
    res.status(500).json({ error: '顧客詳細の取得中にエラーが発生しました' });
  }
};

// 顧客作成
export const createCompany = async (req: Request, res: Response) => {
  try {
    const {
      name,
      name_kana,
      postal_code,
      address,
      phone,
      fax,
      email,
      website,
      industry,
      employee_count,
      capital,
      notes,
    } = req.body;

    // バリデーション
    if (!name) {
      return res.status(400).json({ error: '会社名は必須です' });
    }

    const result = await dbRun(
      `INSERT INTO companies (
        name, name_kana, postal_code, address, phone, fax, email, website,
        industry, employee_count, capital, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, name_kana || null, postal_code || null, address || null,
        phone || null, fax || null, email || null, website || null,
        industry || null, employee_count || null, capital || null, notes || null
      ]
    );

    const companyId = result.lastID;

    // 作成した顧客に自分を担当者として割り当て
    if (req.user) {
      await dbRun(
        `INSERT INTO company_assignments (company_id, user_id, is_primary)
         VALUES (?, ?, 1)`,
        [companyId, req.user.id]
      );
    }

    res.status(201).json({
      message: '顧客を作成しました',
      companyId,
    });
  } catch (error) {
    console.error('顧客作成エラー:', error);
    res.status(500).json({ error: '顧客の作成中にエラーが発生しました' });
  }
};

// 顧客更新
export const updateCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      name_kana,
      postal_code,
      address,
      phone,
      fax,
      email,
      website,
      industry,
      employee_count,
      capital,
      notes,
    } = req.body;

    // 権限チェック
    if (req.user) {
      const canEdit = await canUserEditCompany(req.user.id, req.user.role, Number(id));
      if (!canEdit) {
        return res.status(403).json({ error: 'この顧客を編集する権限がありません' });
      }
    }

    // バリデーション
    if (!name) {
      return res.status(400).json({ error: '会社名は必須です' });
    }

    // 顧客が存在するか確認
    const company = await dbGet(
      'SELECT id FROM companies WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!company) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }

    await dbRun(
      `UPDATE companies SET
        name = ?, name_kana = ?, postal_code = ?, address = ?, phone = ?,
        fax = ?, email = ?, website = ?, industry = ?, employee_count = ?,
        capital = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, name_kana || null, postal_code || null, address || null,
        phone || null, fax || null, email || null, website || null,
        industry || null, employee_count || null, capital || null,
        notes || null, id
      ]
    );

    res.json({ message: '顧客情報を更新しました' });
  } catch (error) {
    console.error('顧客更新エラー:', error);
    res.status(500).json({ error: '顧客情報の更新中にエラーが発生しました' });
  }
};

// 顧客削除（論理削除）
export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 権限チェック（管理者のみ削除可能）
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: '顧客を削除する権限がありません' });
    }

    // 顧客が存在するか確認
    const company = await dbGet(
      'SELECT id FROM companies WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!company) {
      return res.status(404).json({ error: '顧客が見つかりません' });
    }

    await dbRun(
      'UPDATE companies SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: '顧客を削除しました' });
  } catch (error) {
    console.error('顧客削除エラー:', error);
    res.status(500).json({ error: '顧客の削除中にエラーが発生しました' });
  }
};
