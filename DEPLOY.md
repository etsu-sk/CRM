# Render デプロイガイド

このガイドでは、CRMシステムをRenderにデプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Renderアカウント（https://render.com）
- コードがGitHubにプッシュされていること

## デプロイ手順

### 1. Renderにログイン

1. https://render.com にアクセス
2. GitHubアカウントでログイン

### 2. Blueprint からデプロイ

1. Renderダッシュボードで「New +」ボタンをクリック
2. 「Blueprint」を選択
3. GitHubリポジトリ `etsu-sk/CRM` を接続
4. `render.yaml` が自動的に検出されます
5. 「Apply」をクリック

### 3. サービスの確認

以下の2つのサービスが作成されます：

- **crm-backend**: バックエンドAPI
  - URL: `https://crm-backend.onrender.com`
  
- **crm-frontend**: フロントエンド
  - URL: `https://crm-frontend.onrender.com`

### 4. 環境変数の設定（必要に応じて）

バックエンドサービスの環境変数を確認・調整します：

- `SESSION_SECRET`: セッション暗号化キー（自動生成）
- `CORS_ORIGIN`: フロントエンドのURL
- `PORT`: ポート番号（3001）

### 5. データベースについて

- SQLiteデータベースは永続ディスクに保存されます
- 初回デプロイ時にマイグレーションが自動実行されます
- デフォルトの管理者アカウント:
  - ユーザー名: `admin`
  - パスワード: `admin123`

⚠️ **重要**: デプロイ後、必ず管理者パスワードを変更してください。

### 6. デプロイの確認

1. フロントエンドURL（`https://crm-frontend.onrender.com`）にアクセス
2. 管理者アカウントでログイン
3. 正常に動作することを確認

## トラブルシューティング

### ビルドエラーが発生する場合

- Renderのログを確認
- `render.yaml` の設定を確認
- GitHubに最新のコードがプッシュされているか確認

### CORSエラーが発生する場合

- バックエンドの `CORS_ORIGIN` 環境変数が正しいフロントエンドURLに設定されているか確認

### データベース接続エラー

- 永続ディスクが正しくマウントされているか確認
- ビルドログでマイグレーションが成功しているか確認

## 手動デプロイ方法（代替）

Blueprintを使用しない場合は、以下の手順で個別にデプロイできます：

### バックエンド

1. 「New +」→「Web Service」を選択
2. GitHubリポジトリを接続
3. 設定:
   - Name: `crm-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build && npm run migrate`
   - Start Command: `npm start`
4. 環境変数を設定
5. Diskを追加（1GB、マウントパス: `/opt/render/project/src/backend`）

### フロントエンド

1. 「New +」→「Web Service」を選択
2. GitHubリポジトリを接続
3. 設定:
   - Name: `crm-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview -- --host 0.0.0.0 --port $PORT`
4. 環境変数:
   - `VITE_API_URL`: バックエンドのURL（例: `https://crm-backend.onrender.com`）

## 更新方法

コードを更新してGitHubにプッシュすると、Renderが自動的に再デプロイします：

```bash
git add .
git commit -m "更新内容"
git push
```

## 料金について

- Renderの無料プランでデプロイ可能
- 無料プランの制限:
  - サービスは15分間アクセスがないとスリープ
  - 月750時間まで無料
  - ディスクは1GBまで無料

有料プラン（$7/月〜）にアップグレードすると：
- サービスがスリープしない
- より高速なビルド
- より多くのリソース
