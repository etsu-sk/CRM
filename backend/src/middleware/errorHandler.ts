import { Request, Response, NextFunction } from 'express';

// エラーハンドリングミドルウェア
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('エラー発生:', err);

  // エラーログの記録（本番環境では適切なログシステムを使用）
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };

  console.error(JSON.stringify(errorLog, null, 2));

  // クライアントへのレスポンス
  res.status(500).json({
    error: 'サーバーエラーが発生しました',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

// 404エラーハンドラー
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: '指定されたリソースが見つかりません' });
};
