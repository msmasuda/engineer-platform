1. プロダクト概要
エンジニアが自身の手がけた成果物（Webアプリやゲームなど）のURLを投稿し、それを見たユーザーから評価（いいね）を貰ったり、企業の採用担当者やクライアントから直接仕事の依頼（コンタクト）を受け取ることができる、「アウトプット起点型」のポートフォリオ・マッチングプラットフォーム。

2. ターゲットユーザー
投稿者： 個人開発プロダクトをアピールしたい、案件を獲得したいエンジニア

閲覧者： 面白いプロダクトを探しているユーザー、優秀なエンジニアをスカウトしたい採用担当者やクライアント

3. 主要機能一覧（要件定義）
① 認証・ユーザー管理
管理コストと開発効率を最優先し、NextAuth.js（Auth.js）等を用いて以下の3つのソーシャルログインに限定して実装。

GitHub： エンジニアユーザーの必須動線

Google： 非エンジニア（採用担当・クライアント）向けの万人動線

Apple： 国内でシェアの高いMac/iPhoneユーザー向けのスムーズな動線

② プロダクト投稿・編集機能
入力ストレスによる離脱を防ぐため、UIを最適化（インクリメンタルサーチや動的フォームの採用）。

基本情報： タイトル、プロダクトURL、概要・説明文、GitHubリポジトリURL（任意）

使っている技術タグ： 1文字入力ごとのサジェスト（インクリメンタルサーチ）および主要技術の1タップ選択

AI活用の可視化（条件付き動的フォーム）：
「AIを使用しましたか？」のトグルがONの時のみ、以下の選択項目をシュッと展開。

使用LLM（例: Gemini 3 Pro, Claude 3.5 Sonnet, GPT-4o など）

使用AIプロダクト/ツール（例: Cursor, Cline, Roo Code など）

③ リアルタイムランキング機能
サイトの活性化とリピート率向上のための目玉機能。Vercel KV（Redis）のSorted Setを活用して爆速で集計・表示する。

累計いいねランキング： 歴代の人気プロダクトを表示。

週間トレンドランキング： 直近1週間で注目を集めたプロダクトを表示し、新規投稿者にもチャンスを創出。

④ 仕事の依頼（コンタクト）機能
成果物詳細ページに「仕事を依頼する / 話を聞いてみる」導線を設置。

（初期フェーズでは外部SNSやメールへのリンク、次フェーズ以降でアプリ内簡易フォームの実装を検討）

4. 技術スタック・アーキテクチャ
管理画面や環境変数の設定を一箇所にまとめ、運用の手間（インフラ管理）を限りなくゼロにするため、すべてのインフラを「Vercel」に一元化するスマートなサーバーレス構成。

フロントエンド ＆ バックエンド： Next.js (App Router)

Vercelにそのままデプロイ。フロントとAPI（Node.js環境）を一括管理。

メインデータベース： Vercel Postgres (PostgreSQL)

ユーザー、投稿、技術タグなどの構造化データを強固に管理。Prismaから直接接続。

キャッシュ・ランキング： Vercel KV (Redis)

Sorted Set 構造を用いたリアルタイム・超高速なランキング集計をVercel内で完結。

ORM： Prisma

TypeScriptベースで安全かつスムーズにデータベースを操作。

UIフレームワークは、shadcn/uiを使用する

5. データベース設計（Prisma Schema）
コード スニペット
// ユーザー情報
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String?
  image         String?  // ソーシャルアカウントのアイコン
  provider      String   // "github", "google", "apple"
  createdAt     DateTime @default(now())
  
  posts         Post[]   // ユーザーが投稿したプロダクト
  likes         Like[]   // ユーザーが押したいいね
}

// プロダクト投稿情報
model Post {
  id          String   @id @default(uuid())
  title       String
  url         String
  description String
  githubUrl   String?
  createdAt   DateTime @default(now())
  
  // AI関連
  usesAI      Boolean  @default(false)
  aiModels    String[] // ["Gemini 3 Pro", "Claude 3.5 Sonnet"]
  aiTools     String[] // ["Cursor", "Roo Code"]

  // リレーション
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  techTags    TechTag[] // 多対多のリレーション
  likes       Like[]
}

// 技術タグ（表記揺れ防止のためのマスター化）
model TechTag {
  id    String @id @default(uuid())
  name  String @unique // "React", "PostgreSQL"
  posts Post[]
}

// いいね管理（重複防止用）
model Like {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id])
  post      Post     @relation(fields: [postId], references: [id])

  @@unique([userId, postId]) // 1人1投稿に対して1回まで
}