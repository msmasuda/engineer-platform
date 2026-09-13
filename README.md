# Engineer Platform

エンジニアが手がけた成果物（Webアプリ・ツール・ライブラリなど）を投稿し、他のエンジニアから評価や仕事の依頼を受け取れるマッチングプラットフォームです。

**本番URL**: https://engineer-platform.vercel.app

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **DB**: PostgreSQL (Prisma ORM + `@prisma/adapter-pg`)
- **キャッシュ / ランキング**: Redis (ioredis)
- **認証**: Auth.js (NextAuth v5) — メール/パスワード・パスワード再設定・GitHub・Google・Apple
- **メール通知**: Resend
- **スタイル**: Tailwind CSS v4
- **デプロイ**: Vercel

## ローカル開発環境のセットアップ

### 前提条件

- Node.js 20+
- Docker（`192.168.100.2` のDockerホストでPostgreSQL・Redisを起動）

### 手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd engineer-platform

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数の設定（Git管理外）
cp .env.example .env
# .env のパスワード・トークンを実際の値へ変更

# 4. PostgreSQL・Redis の起動（192.168.100.2 のDockerホストで実行）
docker compose up -d

# 5. マイグレーションの適用
npx prisma migrate deploy

# 6. テストデータの投入（任意）
npm run db:seed

# 7. 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

`POSTGRES_PASSWORD` はPostgreSQLボリュームの初回作成時だけ反映されます。既存の `postgres_data` を残したまま値を変更する場合は、DB内のユーザーパスワードも同じ値へ更新してください。

## 主なコマンド

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLintによるコード品質チェック |
| `npm run db:seed` | テストデータをDBとRedisに投入（既存データはリセット） |
| `npx prisma migrate dev` | マイグレーションの作成・適用 |
| `npx prisma studio` | Prisma Studio でDBを GUI 操作 |
| `npm test` | ユニットテストを実行 (Vitest) |
| `npm run test:e2e` | E2E テストを実行 (Playwright) |

## テストデータ（シード）

`npm run db:seed` を実行すると以下のデータが投入されます。

### テストユーザー

全員パスワードは `password123` です。

| 名前 | メールアドレス |
|---|---|
| 田中 翔 | tanaka.sho@example.com |
| 山本 悠希 | yamamoto.yuki@example.com |
| 鈴木 蓮 | suzuki.ren@example.com |
| 渡辺 真央 | watanabe.mao@example.com |
| 伊藤 陽翔 | ito.haruto@example.com |
| 中村 咲 | nakamura.saki@example.com |
| 小林 匠 | kobayashi.takumi@example.com |
| 加藤 陽菜 | kato.hina@example.com |

シードは冪等ではなく、**実行のたびに既存データをすべて削除してから再投入**します。

## 主な機能

- **プロダクト投稿**: タイトル・URL・GitHub URL・説明・技術タグ・AI利用情報を登録
- **いいね**: 投稿にいいねでき、ランキングに反映
- **ランキング**: 累計いいね順・週間トレンド順のサイドバー表示
- **認証**: メール/パスワードによるサインイン（新規登録も同一フォームで完結）・メールによるパスワード再設定
- **投稿の編集・削除**: 投稿者本人のみ操作可能
- **コンタクト**: 問い合わせをDBへ保存し、投稿者へメール通知（匿名送信可・レート制限付き）

メール/パスワード認証では、パスワードをscrypt（N=32768、r=8、p=3）で保存します。新規パスワードは15〜128文字です。旧PBKDF2形式のハッシュは、次回のログイン成功時に自動的にscrypt形式へ更新されます。ログイン試行はアカウント単位・IP単位で制限されます。

## メール送信の設定

投稿者へのコンタクト通知とパスワード再設定メールにはResendを使用します。Resendで送信ドメインを検証し、次の環境変数を設定してください。

```bash
AUTH_URL="http://localhost:3000"
PASSWORD_RESET_EMAIL_MODE="resend"
RESEND_API_KEY="re_..."
CONTACT_EMAIL_FROM="Engineer Platform <contact@example.com>"
```

`AUTH_URL`にはアプリの公開URLを指定します。VercelではResend Marketplace Integrationを利用すると`RESEND_API_KEY`を連携できます。`CONTACT_EMAIL_FROM`にはResendで検証済みのドメインに属する送信元を指定してください。未設定または送信失敗時もコンタクト内容はDBに`FAILED`として保存され、画面には通知失敗が表示されます。

ローカルでResendを使わずにパスワード再設定を確認する場合は、`.env`へ `PASSWORD_RESET_EMAIL_MODE="console"` を設定して開発サーバーを再起動します。再設定を依頼すると、開発サーバーのターミナルへ `[password-reset]` で始まるURLが表示されます。本番環境ではこの値に関係なくResendを使用します。

パスワード再設定リンクは1時間有効で、一度使用すると無効になります。登録されていないメールアドレスやソーシャルログイン専用アカウントへは送信しませんが、アカウントの存在を推測されないよう画面には同じ完了メッセージを表示します。

## AI選択肢のマスター管理

投稿フォームの「使用したLLMモデル」と「使用したAIプロダクト・ツール」は、DBの `AiModel`・`AiTool` テーブルから取得します。コードを変更せずに Prisma Studio などから選択肢を管理できます。

```bash
npx prisma studio
```

- `name`: 投稿画面に表示する名称（重複不可）
- `displayOrder`: 数値が小さい順に表示
- `isActive`: `false` にすると新規選択肢から非表示（既存投稿の値は保持）

マスターを更新した後は、投稿画面を再読み込みすると反映されます。
