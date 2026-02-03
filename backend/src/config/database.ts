import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || './database/crm.db';
const dbDir = path.dirname(dbPath);

// データベースディレクトリが存在しない場合は作成
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// SQLite3データベース接続
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('データベース接続エラー:', err.message);
  } else {
    console.log('データベースに接続しました');
  }
});

// カスタムプロミスラッパー（lastIDとchangesを含む）
export const dbRun = (sql: string, params?: any): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

export const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any) => Promise<any>;
export const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any) => Promise<any>;

export default db;
