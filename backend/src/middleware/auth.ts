import { Request, Response, NextFunction } from 'express';

// 認証チェックミドルウェア
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  req.user = req.session.user;
  next();
};

// 管理者権限チェックミドルウェア
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '管理者権限が必要です' });
  }
  next();
};

// セッション型定義の拡張
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      name: string;
      role: 'admin' | 'user';
    };
  }
}
