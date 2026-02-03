import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { dbGet } from '../config/database';
import { User } from '../types';

// ログイン
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // バリデーション
    if (!username || !password) {
      return res.status(400).json({ error: 'ユーザー名とパスワードを入力してください' });
    }

    // ユーザーを検索
    const user = await dbGet(
      'SELECT * FROM users WHERE username = ? AND is_active = 1 AND deleted_at IS NULL',
      [username]
    ) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません' });
    }

    // パスワードを検証
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが正しくありません' });
    }

    // セッションにユーザー情報を保存
    req.session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    // パスワードを除いたユーザー情報を返す
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      message: 'ログインに成功しました',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ error: 'ログイン処理中にエラーが発生しました' });
  }
};

// ログアウト
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('ログアウトエラー:', err);
      return res.status(500).json({ error: 'ログアウト処理中にエラーが発生しました' });
    }
    res.json({ message: 'ログアウトしました' });
  });
};

// 現在のユーザー情報取得
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: '認証されていません' });
    }

    const userId = req.session.user.id;

    // 最新のユーザー情報を取得
    const user = await dbGet(
      'SELECT id, username, name, email, role, is_active, created_at, updated_at FROM users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL',
      [userId]
    ) as User | undefined;

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ user });
  } catch (error) {
    console.error('ユーザー情報取得エラー:', error);
    res.status(500).json({ error: 'ユーザー情報の取得中にエラーが発生しました' });
  }
};
