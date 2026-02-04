import db, { dbRun } from './database';
import bcrypt from 'bcrypt';

async function migrate() {

  try {
    console.log('マイグレーション開始...');

    // ユーザーテーブル
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user')) DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
      )
    `);
    console.log('✓ usersテーブル作成');

    // 法人情報テーブル
    await dbRun(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_kana TEXT,
        postal_code TEXT,
        address TEXT,
        phone TEXT,
        fax TEXT,
        email TEXT,
        website TEXT,
        industry TEXT,
        employee_count INTEGER,
        capital INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
      )
    `);
    console.log('✓ companiesテーブル作成');

    // 取引先担当者テーブル
    await dbRun(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        name_kana TEXT,
        department TEXT,
        position TEXT,
        phone TEXT,
        mobile TEXT,
        email TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    console.log('✓ contactsテーブル作成');

    // 当方担当者割り当てテーブル
    await dbRun(`
      CREATE TABLE IF NOT EXISTS company_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_primary INTEGER NOT NULL DEFAULT 0,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ company_assignmentsテーブル作成');

    // 活動履歴テーブル
    await dbRun(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        activity_date DATETIME NOT NULL,
        activity_type TEXT NOT NULL CHECK(activity_type IN ('visit', 'phone', 'email', 'web_meeting', 'other')),
        content TEXT NOT NULL,
        next_action_date DATETIME,
        next_action_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (company_id) REFERENCES companies(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✓ activity_logsテーブル作成');

    // インデックス作成
    await dbRun('CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_company_assignments_company_id ON company_assignments(company_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_company_assignments_user_id ON company_assignments(user_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_date ON activity_logs(activity_date)');
    await dbRun('CREATE INDEX IF NOT EXISTS idx_activity_logs_next_action_date ON activity_logs(next_action_date)');
    console.log('✓ インデックス作成');

    // デフォルト管理者ユーザーを作成（パスワード: admin123）
    
    const defaultPassword = await bcrypt.hash('admin123', 10);

    await dbRun(`
      INSERT OR IGNORE INTO users (id, username, password_hash, name, email, role, is_active)
      VALUES (1, 'admin', ?, '管理者', 'admin@example.com', 'admin', 1)
    `, [defaultPassword]);
    console.log('✓ デフォルト管理者ユーザー作成（username: admin, password: admin123）');

        console.log('\nマイグレーション完了！');

  } catch (error) {
    console.error('マイグレーションエラー:', error);
    throw error;
  }
  // データベース接続は維持（サーバーで使用するため）
}


// スクリプトとして実行された場合
if (require.main === module) {
  migrate();
}

export default migrate;
