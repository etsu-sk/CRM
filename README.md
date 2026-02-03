# CRM システム

顧客情報の一元管理と営業活動の履歴管理を実現するCRMシステムです。

## 技術スタック

### バックエンド
- **言語**: TypeScript
- **フレームワーク**: Node.js + Express
- **データベース**: SQLite3
- **認証**: Express Session + bcrypt

### フロントエンド
- **言語**: TypeScript
- **フレームワーク**: React 18
- **ビルドツール**: Vite
- **ルーティング**: React Router v6
- **HTTPクライアント**: Axios

## 主な機能

### 1. 顧客管理
- 法人情報の登録・編集・削除
- 取引先担当者の管理
- 当方担当者の割り当て

### 2. 活動履歴管理
- 顧客との接触履歴の記録（訪問、電話、メール、Web会議など）
- ネクストアクションの管理
- 期限超過アラート表示

### 3. ユーザー権限管理
- 管理者権限と一般ユーザー権限
- 担当顧客ベースのアクセス制御
- セッションベースの認証

### 4. ダッシュボード
- ネクストアクション一覧
- 期限超過の警告表示

## セットアップ方法

### 1. リポジトリのクローンまたはダウンロード

### 2. バックエンドのセットアップ

```bash
cd backend

# 依存パッケージのインストール
npm install

# データベースのマイグレーション（テーブル作成 + 初期データ）
npm run migrate

# 開発サーバーの起動
npm run dev
```

バックエンドは http://localhost:3001 で起動します。

### 3. フロントエンドのセットアップ

別のターミナルで実行してください。

```bash
cd frontend

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは http://localhost:5173 で起動します。

### 4. アプリケーションへのアクセス

ブラウザで http://localhost:5173 にアクセスしてください。

**デフォルトログイン情報:**
- ユーザー名: `admin`
- パスワード: `admin123`

## プロジェクト構成

```
crm/
├── backend/                # バックエンドアプリケーション
│   ├── src/
│   │   ├── config/        # データベース設定とマイグレーション
│   │   ├── controllers/   # コントローラー
│   │   ├── middleware/    # ミドルウェア
│   │   ├── models/        # データモデル（未使用）
│   │   ├── routes/        # APIルート
│   │   ├── types/         # TypeScript型定義
│   │   ├── utils/         # ユーティリティ関数
│   │   └── server.ts      # エントリーポイント
│   ├── database/          # SQLiteデータベースファイル（自動生成）
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/              # フロントエンドアプリケーション
│   ├── src/
│   │   ├── components/   # 共通コンポーネント
│   │   ├── hooks/        # カスタムフック
│   │   ├── pages/        # ページコンポーネント
│   │   ├── services/     # APIサービス
│   │   ├── types/        # TypeScript型定義
│   │   ├── utils/        # ユーティリティ関数
│   │   ├── App.tsx       # ルートコンポーネント
│   │   └── main.tsx      # エントリーポイント
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md             # このファイル
```

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得

### 顧客管理
- `GET /api/companies` - 顧客一覧取得
- `GET /api/companies/:id` - 顧客詳細取得
- `POST /api/companies` - 顧客作成
- `PUT /api/companies/:id` - 顧客更新
- `DELETE /api/companies/:id` - 顧客削除（管理者のみ）

### 取引先担当者
- `GET /api/contacts/company/:companyId` - 取引先担当者一覧
- `POST /api/contacts/company/:companyId` - 取引先担当者作成
- `PUT /api/contacts/:id` - 取引先担当者更新
- `DELETE /api/contacts/:id` - 取引先担当者削除
- `POST /api/contacts/company/:companyId/assign` - 当方担当者割り当て
- `DELETE /api/contacts/assignment/:assignmentId` - 担当者割り当て解除

### 活動履歴
- `GET /api/activities/company/:companyId` - 顧客の活動履歴一覧
- `GET /api/activities/next-actions` - ネクストアクション一覧
- `POST /api/activities` - 活動履歴作成
- `PUT /api/activities/:id` - 活動履歴更新
- `DELETE /api/activities/:id` - 活動履歴削除

### ユーザー管理
- `GET /api/users` - ユーザー一覧取得
- `GET /api/users/:id` - ユーザー詳細取得
- `POST /api/users` - ユーザー作成（管理者のみ）
- `PUT /api/users/:id` - ユーザー更新
- `POST /api/users/:id/change-password` - パスワード変更
- `DELETE /api/users/:id` - ユーザー削除（管理者のみ）

## データベーススキーマ

### users（ユーザー）
- id, username, password_hash, name, email, role, is_active
- 作成日時、更新日時、削除日時

### companies（法人情報）
- id, name, name_kana, postal_code, address, phone, fax, email
- website, industry, employee_count, capital, notes
- 作成日時、更新日時、削除日時

### contacts（取引先担当者）
- id, company_id, name, name_kana, department, position
- phone, mobile, email, notes
- 作成日時、更新日時、削除日時

### company_assignments（当方担当者割り当て）
- id, company_id, user_id, is_primary, assigned_at, notes
- 作成日時、更新日時、削除日時

### activity_logs（活動履歴）
- id, company_id, user_id, activity_date, activity_type, content
- next_action_date, next_action_content
- 作成日時、更新日時、削除日時

## 権限管理

### 管理者（admin）
- 全顧客情報の閲覧・編集・削除
- 全活動履歴の閲覧・編集・削除
- ユーザー管理（追加、編集、削除）

### 一般ユーザー（user）
- 担当顧客の閲覧・編集
- 全顧客の閲覧（編集は担当顧客のみ）
- 担当顧客の活動履歴登録・編集・削除
- 自分が登録した活動履歴の編集・削除のみ可能

## 環境変数

バックエンドの `.env` ファイルで以下の設定が可能です：

```env
PORT=3001
NODE_ENV=development
DB_PATH=./database/crm.db
SESSION_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:5173
```

## 本番環境へのデプロイ

### バックエンド
1. TypeScriptをビルド: `npm run build`
2. 本番サーバーで起動: `npm start`
3. 環境変数を本番用に設定
4. HTTPS通信の設定

### フロントエンド
1. ビルド: `npm run build`
2. `dist` フォルダをWebサーバーにデプロイ
3. APIエンドポイントを本番URLに変更

## ライセンス

本プロジェクトはサンプル実装です。

## 今後の拡張予定

- メールシステムとの連携
- カレンダーシステムとの連携
- レポート機能
- エクスポート機能（CSV、Excel）
- モバイル対応の強化
- 通知機能

---

**開発日**: 2026年2月2日
**バージョン**: 1.0.0
