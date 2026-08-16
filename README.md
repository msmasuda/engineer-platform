# Engineer Platform

エンジニアが手がけた成果物（Webアプリ・ツール・ライブラリなど）を投稿し、他のエンジニアから評価や仕事の依頼を受け取れるマッチングプラットフォームです。

**本番URL**: https://engineer-platform.vercel.app

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **DB**: PostgreSQL (Prisma ORM + `@prisma/adapter-pg`)
- **キャッシュ / ランキング**: Redis (ioredis)
- **認証**: Auth.js (NextAuth v5) — メール/パスワード・GitHub・Google・Apple
- **メール通知**: Resend
- **スタイル**: Tailwind CSS v4
- **デプロイ**: Vercel

## ローカル開発環境のセットアップ

### 前提条件

- Node.js 20+
- Docker（PostgreSQL・Redis の起動に使用）

### 手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd engineer-platform

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数の設定
cp .env.example .env.local
# .env.local を編集して DATABASE_URL・REDIS_URL などを設定

# 4. データベースの起動
docker compose up -d

# 5. マイグレーションの適用
npx prisma migrate deploy

# 6. テストデータの投入（任意）
npm run db:seed

# 7. 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

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
- **認証**: メール/パスワードによるサインイン（新規登録も同一フォームで完結）
- **投稿の編集・削除**: 投稿者本人のみ操作可能
- **コンタクト**: 問い合わせをDBへ保存し、投稿者へメール通知（匿名送信可・レート制限付き）

## コンタクト通知の設定

投稿者への通知メールにはResendを使用します。Resendで送信ドメインを検証し、次の環境変数を設定してください。

```bash
RESEND_API_KEY="re_..."
CONTACT_EMAIL_FROM="Engineer Platform <contact@example.com>"
```

VercelではResend Marketplace Integrationを利用すると`RESEND_API_KEY`を連携できます。`CONTACT_EMAIL_FROM`にはResendで検証済みのドメインに属する送信元を指定してください。未設定または送信失敗時もコンタクト内容はDBに`FAILED`として保存され、画面には通知失敗が表示されます。

## AI選択肢のマスター管理

投稿フォームの「使用したLLMモデル」と「使用したAIプロダクト・ツール」は、DBの `AiModel`・`AiTool` テーブルから取得します。コードを変更せずに Prisma Studio などから選択肢を管理できます。

```bash
npx prisma studio
```

- `name`: 投稿画面に表示する名称（重複不可）
- `displayOrder`: 数値が小さい順に表示
- `isActive`: `false` にすると新規選択肢から非表示（既存投稿の値は保持）

マスターを更新した後は、投稿画面を再読み込みすると反映されます。
