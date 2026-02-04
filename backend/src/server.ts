import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// SQLite3セッションストア
const SQLiteStore = require('connect-sqlite3')(session);

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア設定
app.use(cors({
  origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// セッション設定
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './database',
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24時間
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
}));

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ルートのインポート
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import contactRoutes from './routes/contacts';
import activityRoutes from './routes/activities';
import userRoutes from './routes/users';

// ルートの登録
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/users', userRoutes);

// エラーハンドリング
app.use(notFoundHandler);
app.use(errorHandler);

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
