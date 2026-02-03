import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { dbRun, dbGet, dbAll } from '../config/database';
import { User } from '../types';

// ユーザー一覧取得
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { active_only } = req.query;

    let query = 'SELECT id, username, name, email, role, is_active, created_at, updated_at FROM users WHERE deleted_at IS NULL';

    if (active_only === 'true') {
      query += ' AND is_active = 1';
    }

    query += ' ORDER BY created_at DESC';

    const users = await dbAll(query);

    res.json({ users });
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    res.status(500).json({ error: 'ユーザー一覧の取得中にエラーが発生しました' });
  }
};

// ユーザー詳細取得
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await dbGet(
      'SELECT id, username, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    ) as Omit<User, 'password_hash'> | undefined;

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ user });
  } catch (error) {
    console.error('ユーザー詳細取得エラー:', error);
    res.status(500).json({ error: 'ユーザー詳細の取得中にエラーが発生しました' });
  }
};

// ユーザー作成（管理者のみ）
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, role } = req.body;

    // バリデーション
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'ユーザー名、パスワード、氏名は必須です' });
    }

    if (role && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: '無効な権限です' });
    }

    // ユーザー名の重複チェック
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'このユーザー名は既に使用されています' });
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await dbRun(
      `INSERT INTO users (username, password_hash, name, email, role, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [username, passwordHash, name, email || null, role || 'user']
    );

    const userId = result.lastID;

    res.status(201).json({
      message: 'ユーザーを作成しました',
      userId,
    });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    res.status(500).json({ error: 'ユーザーの作成中にエラーが発生しました' });
  }
};

// ユーザー更新
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;

    // 一般ユーザーは自分のアカウントのみ更新可能（権限は変更不可）
    if (req.user?.role !== 'admin' && Number(id) !== req.user?.id) {
      return res.status(403).json({ error: 'ユーザー情報を更新する権限がありません' });
    }

    // ユーザーが存在するか確認
    const user = await dbGet(
      'SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // バリデーション
    if (!name) {
      return res.status(400).json({ error: '氏名は必須です' });
    }

    // 一般ユーザーは権限と有効/無効を変更できない
    let updateRole = user.role;
    let updateIsActive = undefined;

    if (req.user?.role === 'admin') {
      if (role && ['admin', 'user'].includes(role)) {
        updateRole = role;
      }
      updateIsActive = is_active !== undefined ? (is_active ? 1 : 0) : undefined;
    }

    if (updateIsActive !== undefined) {
      await dbRun(
        `UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, email || null, updateRole, updateIsActive, id]
      );
    } else {
      await dbRun(
        `UPDATE users SET name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, email || null, updateRole, id]
      );
    }

    res.json({ message: 'ユーザー情報を更新しました' });
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    res.status(500).json({ error: 'ユーザー情報の更新中にエラーが発生しました' });
  }
};

// パスワード変更
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 一般ユーザーは自分のパスワードのみ変更可能
    if (req.user?.role !== 'admin' && Number(id) !== req.user?.id) {
      return res.status(403).json({ error: 'パスワードを変更する権限がありません' });
    }

    // バリデーション
    if (!newPassword) {
      return res.status(400).json({ error: '新しいパスワードを入力してください' });
    }

    // 一般ユーザーの場合は現在のパスワードを確認
    if (req.user?.role !== 'admin') {
      if (!currentPassword) {
        return res.status(400).json({ error: '現在のパスワードを入力してください' });
      }

      const user = await dbGet(
        'SELECT password_hash FROM users WHERE id = ? AND deleted_at IS NULL',
        [id]
      ) as { password_hash: string } | undefined;

      if (!user) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: '現在のパスワードが正しくありません' });
      }
    }

    // 新しいパスワードをハッシュ化
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await dbRun(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, id]
    );

    res.json({ message: 'パスワードを変更しました' });
  } catch (error) {
    console.error('パスワード変更エラー:', error);
    res.status(500).json({ error: 'パスワードの変更中にエラーが発生しました' });
  }
};

// ユーザー削除（論理削除、管理者のみ）
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 自分自身は削除できない
    if (Number(id) === req.user?.id) {
      return res.status(400).json({ error: '自分自身を削除することはできません' });
    }

    // ユーザーが存在するか確認
    const user = await dbGet(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    await dbRun(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'ユーザーを削除しました' });
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    res.status(500).json({ error: 'ユーザーの削除中にエラーが発生しました' });
  }
};
