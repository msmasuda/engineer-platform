import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "crypto";
import Redis from "ioredis";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

// --- ユーザーデータ ---
const USERS = [
  {
    email: "tanaka.sho@example.com",
    name: "田中 翔",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=tanaka-sho",
  },
  {
    email: "yamamoto.yuki@example.com",
    name: "山本 悠希",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=yamamoto-yuki",
  },
  {
    email: "suzuki.ren@example.com",
    name: "鈴木 蓮",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=suzuki-ren",
  },
  {
    email: "watanabe.mao@example.com",
    name: "渡辺 真央",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=watanabe-mao",
  },
  {
    email: "ito.haruto@example.com",
    name: "伊藤 陽翔",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=ito-haruto",
  },
  {
    email: "nakamura.saki@example.com",
    name: "中村 咲",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=nakamura-saki",
  },
  {
    email: "kobayashi.takumi@example.com",
    name: "小林 匠",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=kobayashi-takumi",
  },
  {
    email: "kato.hina@example.com",
    name: "加藤 陽菜",
    provider: "credentials",
    image: "https://api.dicebear.com/9.x/avataaars/svg?seed=kato-hina",
  },
];

// --- 投稿データ ---
// userEmail で投稿者を紐付け、likedBy で「いいね」したユーザーを指定する
const POSTS = [
  {
    title: "AIコードレビューBot",
    url: "https://ai-code-review-bot.vercel.app",
    githubUrl: "https://github.com/tanaka-sho/ai-code-review-bot",
    description:
      "プルリクエストに自動でコードレビューコメントを付けるGitHub Actionsボット。Claude 3.5 Sonnetを使ってバグの指摘・改善提案・セキュリティチェックを実行します。レビュー待ち時間を大幅に削減できました。",
    techTags: ["TypeScript", "Next.js", "Docker"],
    usesAI: true,
    aiModels: ["Claude 3.5 Sonnet"],
    aiTools: ["Cursor"],
    userEmail: "tanaka.sho@example.com",
    likedBy: [
      "yamamoto.yuki@example.com",
      "suzuki.ren@example.com",
      "watanabe.mao@example.com",
      "ito.haruto@example.com",
      "nakamura.saki@example.com",
      "kobayashi.takumi@example.com",
      "kato.hina@example.com",
    ],
    createdAt: daysAgo(12),
  },
  {
    title: "Rustで作ったHTTPサーバーフレームワーク",
    url: "https://crates.io/crates/rusty-http",
    githubUrl: "https://github.com/kobayashi-takumi/rusty-http",
    description:
      "ゼロコスト抽象化にこだわったRust製の軽量HTTPサーバーフレームワーク。Axumにインスパイアされており、マクロを使わずに型安全なルーティングを実現しています。ベンチマークではActix-webの95%の性能を達成。",
    techTags: ["Rust"],
    usesAI: false,
    aiModels: [],
    aiTools: [],
    userEmail: "kobayashi.takumi@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "suzuki.ren@example.com",
      "watanabe.mao@example.com",
      "ito.haruto@example.com",
      "nakamura.saki@example.com",
    ],
    createdAt: daysAgo(10),
  },
  {
    title: "Next.js ポートフォリオテンプレート",
    url: "https://nextjs-portfolio-template.vercel.app",
    githubUrl: "https://github.com/nakamura-saki/nextjs-portfolio",
    description:
      "エンジニア向けのNext.js 14製ポートフォリオテンプレート。MDXでブログ記事を管理でき、GitHub APIと連携してピン止めリポジトリを自動表示。Tailwind CSSとframer-motionでアニメーションも充実。v0でUIを生成してCursorで実装しました。",
    techTags: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    usesAI: true,
    aiModels: ["Claude 3.5 Sonnet"],
    aiTools: ["Cursor", "v0"],
    userEmail: "nakamura.saki@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "yamamoto.yuki@example.com",
      "watanabe.mao@example.com",
      "kobayashi.takumi@example.com",
      "kato.hina@example.com",
    ],
    createdAt: daysAgo(9),
  },
  {
    title: "GoでGPUクラスタスケジューラ",
    url: "https://gpu-scheduler-demo.fly.dev",
    githubUrl: "https://github.com/suzuki-ren/gpu-scheduler",
    description:
      "Kubernetesを使わずにGoで書いたシンプルなGPUクラスタスケジューラ。MLの学習ジョブをキューイングして優先度付きで実行します。社内の研究チームで実際に使っていて、GPU稼働率が30%向上しました。",
    techTags: ["Go", "Docker", "Redis", "PostgreSQL"],
    usesAI: false,
    aiModels: [],
    aiTools: [],
    userEmail: "suzuki.ren@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "yamamoto.yuki@example.com",
      "ito.haruto@example.com",
      "kato.hina@example.com",
    ],
    createdAt: daysAgo(8),
  },
  {
    title: "PostgreSQLパフォーマンスダッシュボード",
    url: "https://pg-perf-dashboard.vercel.app",
    githubUrl: "https://github.com/kato-hina/pg-perf-dashboard",
    description:
      "PostgreSQLのスロークエリ・インデックス使用率・テーブルサイズをリアルタイムで可視化するNext.jsダッシュボード。pg_stat_statementsの解析をAIが行い、インデックス追加の提案もしてくれます。DBAのいないスタートアップで重宝しています。",
    techTags: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS"],
    usesAI: true,
    aiModels: ["GPT-4o"],
    aiTools: ["GitHub Copilot"],
    userEmail: "kato.hina@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "yamamoto.yuki@example.com",
      "suzuki.ren@example.com",
      "watanabe.mao@example.com",
    ],
    createdAt: daysAgo(7),
  },
  {
    title: "TypeScript型パズルコレクション",
    url: "https://type-puzzles.netlify.app",
    githubUrl: "https://github.com/tanaka-sho/typescript-type-puzzles",
    description:
      "TypeScriptの型システムだけで解くパズル集。Conditional Types・Template Literal Types・Inferを駆使した30問を収録。type-challengesにインスパイアされて、実務でよく使うパターンを中心に問題を作りました。",
    techTags: ["TypeScript"],
    usesAI: false,
    aiModels: [],
    aiTools: [],
    userEmail: "tanaka.sho@example.com",
    likedBy: [
      "kobayashi.takumi@example.com",
      "nakamura.saki@example.com",
      "yamamoto.yuki@example.com",
    ],
    createdAt: daysAgo(6),
  },
  {
    title: "Dockerイメージ最適化CLI",
    url: "https://docker-slim-cli.vercel.app",
    githubUrl: "https://github.com/ito-haruto/docker-slim-cli",
    description:
      "DockerfileのANTI-PATTERNを検出して最適化提案するCLIツール。マルチステージビルドへの自動変換やROOTユーザー実行の警告など15種類のチェックを実施。LLMがDockerfileの改善案を自然言語で説明してくれます。",
    techTags: ["Go", "Docker", "Python"],
    usesAI: true,
    aiModels: ["Gemini 3.5 Flash"],
    aiTools: ["Cline"],
    userEmail: "ito.haruto@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "suzuki.ren@example.com",
      "kobayashi.takumi@example.com",
    ],
    createdAt: daysAgo(5),
  },
  {
    title: "Prisma ERDビジュアライザー",
    url: "https://prisma-erd.vercel.app",
    githubUrl: "https://github.com/yamamoto-yuki/prisma-erd",
    description:
      "schema.prismaを読み込んでER図をインタラクティブに表示するWebアプリ。Reactフローを使ってテーブルをドラッグ&ドロップで整理でき、Mermaid形式でエクスポートも可能。チームでスキーマ設計をするときに重宝しています。",
    techTags: ["React", "Next.js", "TypeScript", "Prisma"],
    usesAI: false,
    aiModels: [],
    aiTools: [],
    userEmail: "yamamoto.yuki@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "watanabe.mao@example.com",
      "kato.hina@example.com",
    ],
    createdAt: daysAgo(4),
  },
  {
    title: "リアルタイム株価スクリーナー",
    url: "https://stock-screener-jp.vercel.app",
    githubUrl: "https://github.com/watanabe-mao/stock-screener",
    description:
      "WebSocketで日本株の価格をリアルタイム配信し、カスタムフィルター（PER・PBR・出来高急増など）でスクリーニングするツール。DeepSeek-V3がニュースのセンチメント分析を行い、シグナルと合わせて表示します。個人投資家向けに作りました。",
    techTags: ["Next.js", "TypeScript", "Redis", "PostgreSQL", "Tailwind CSS"],
    usesAI: true,
    aiModels: ["DeepSeek-V3"],
    aiTools: ["AntigravityIDE"],
    userEmail: "watanabe.mao@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "yamamoto.yuki@example.com",
    ],
    createdAt: daysAgo(3),
  },
  {
    title: "React UIコンポーネントライブラリ",
    url: "https://ui-kit-docs.vercel.app",
    githubUrl: "https://github.com/nakamura-saki/react-ui-kit",
    description:
      "shadcn/uiをベースにしたカスタマイズ可能なUIコンポーネントライブラリ。Storybookでドキュメントを整備し、アクセシビリティ（WCAG 2.1 AA）に準拠。v0でコンポーネントの初期実装を生成し、Cursorで細かい調整を行いました。npmに公開済みで週200DL達成。",
    techTags: ["React", "TypeScript", "Tailwind CSS"],
    usesAI: true,
    aiModels: ["Claude 3.5 Sonnet"],
    aiTools: ["Cursor", "v0"],
    userEmail: "nakamura.saki@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "suzuki.ren@example.com",
    ],
    createdAt: daysAgo(2),
  },
  {
    title: "Pythonデータパイプラインフレームワーク",
    url: "https://datapipe-py.readthedocs.io",
    githubUrl: "https://github.com/kato-hina/datapipe-py",
    description:
      "Airflowより軽量なPythonネイティブのデータパイプラインフレームワーク。依存関係をデコレータで宣言するだけで自動でDAGを構築し、失敗時のリトライや部分実行に対応。SQLAlchemyとの統合でDBへのロードも1行で書けます。",
    techTags: ["Python", "PostgreSQL", "Docker"],
    usesAI: false,
    aiModels: [],
    aiTools: [],
    userEmail: "kato.hina@example.com",
    likedBy: [
      "yamamoto.yuki@example.com",
      "suzuki.ren@example.com",
    ],
    createdAt: daysAgo(2),
  },
  {
    title: "Lambda関数ローカルテストツール",
    url: "https://lambda-local-test.vercel.app",
    githubUrl: "https://github.com/ito-haruto/lambda-local-test",
    description:
      "AWS Lambda関数をローカルでテストするためのNode.js CLI。SAMを使わずにDockerでランタイムをエミュレートし、イベントのモックも簡単に設定できます。GitHub Copilotでテストコードを自動生成する機能も搭載。",
    techTags: ["TypeScript", "Docker", "AWS"],
    usesAI: true,
    aiModels: ["GPT-4o"],
    aiTools: ["GitHub Copilot"],
    userEmail: "ito.haruto@example.com",
    likedBy: [
      "watanabe.mao@example.com",
    ],
    createdAt: daysAgo(1),
  },
  {
    title: "CLIでJSONを爆速フォーマット",
    url: "https://crates.io/crates/jfmt",
    githubUrl: "https://github.com/kobayashi-takumi/jfmt",
    description:
      "RustでゼロアロケーションにこだわったJSON整形CLIツール。jqより速く、100MBのJSONファイルでも0.2秒以内に整形が完了します。カラー出力・キー絞り込み・圧縮モードに対応。HomebrewとWingetに公開済み。",
    techTags: ["Rust"],
    usesAI: false,
    aiModels: [],
    aiTools: [],
    userEmail: "kobayashi.takumi@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "suzuki.ren@example.com",
    ],
    createdAt: daysAgo(1),
  },
  {
    title: "Vercelデプロイメトリクスダッシュボード",
    url: "https://vercel-metrics-dashboard.vercel.app",
    githubUrl: "https://github.com/yamamoto-yuki/vercel-metrics",
    description:
      "Vercel APIを使ってデプロイ頻度・ビルド時間・エラー率などを可視化するNext.jsダッシュボード。Gemini 3 Proがデプロイの失敗パターンを分析して改善提案を表示します。Roo Codeでコード補完しながら実装しました。",
    techTags: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
    usesAI: true,
    aiModels: ["Gemini 3 Pro"],
    aiTools: ["Roo Code"],
    userEmail: "yamamoto.yuki@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "nakamura.saki@example.com",
      "ito.haruto@example.com",
    ],
    createdAt: daysAgo(0),
  },
  {
    title: "RedisセッションマネージャーNPMパッケージ",
    url: "https://www.npmjs.com/package/redis-session-manager",
    githubUrl: "https://github.com/suzuki-ren/redis-session-manager",
    description:
      "express-sessionのRedisアダプタより設定が簡単なNPMパッケージ。スライディングウィンドウ方式のセッション延長・デバイス管理・強制ログアウト機能をビルトインで提供。TypeScript型定義完備でNext.js Auth.jsとの統合もスムーズ。週間500DL達成。",
    techTags: ["TypeScript", "Redis", "Next.js"],
    usesAI: false,
    aiModels: [],
    aiTools: [],
    userEmail: "suzuki.ren@example.com",
    likedBy: [
      "tanaka.sho@example.com",
      "watanabe.mao@example.com",
      "kato.hina@example.com",
      "nakamura.saki@example.com",
    ],
    createdAt: daysAgo(0),
  },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("🌱 Seeding started...");

  // 既存データをクリア（外部キー制約の順番に注意）
  await db.like.deleteMany();
  await db.post.deleteMany();
  await db.techTag.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();
  console.log("🗑️  Cleared existing data.");

  // Redis のランキングキーをクリア
  const redis = new Redis(process.env.KV_URL || process.env.REDIS_URL || "redis://localhost:6379");
  await redis.del("ranking:likes");
  // 直近14日分のデイリーキーを削除
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `ranking:daily:${d.toISOString().split("T")[0]}`;
    await redis.del(key);
  }
  console.log("🗑️  Cleared Redis ranking keys.");

  // ユーザーを作成
  const userMap = new Map<string, string>(); // email -> id
  for (const u of USERS) {
    const user = await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        provider: u.provider,
        passwordHash: hashPassword("password123"),
        image: u.image,
        emailVerified: new Date(),
      },
    });
    userMap.set(u.email, user.id);
  }
  console.log(`👤 Created ${USERS.length} users.`);

  // 投稿・タグ・いいねを作成
  let postCount = 0;
  let likeCount = 0;

  for (const p of POSTS) {
    const authorId = userMap.get(p.userEmail);
    if (!authorId) {
      console.warn(`⚠️ User not found: ${p.userEmail}`);
      continue;
    }

    // techTags を upsert
    const tagConnectOrCreate = p.techTags.map((name) => ({
      where: { name },
      create: { name },
    }));

    const post = await db.post.create({
      data: {
        title: p.title,
        url: p.url,
        githubUrl: p.githubUrl,
        description: p.description,
        usesAI: p.usesAI,
        aiModels: p.aiModels,
        aiTools: p.aiTools,
        userId: authorId,
        createdAt: p.createdAt,
        updatedAt: p.createdAt,
        techTags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
    });
    postCount++;

    // いいねを作成し Redis に反映
    const todayStr = new Date().toISOString().split("T")[0];
    const dailyKey = `ranking:daily:${todayStr}`;

    for (const likerEmail of p.likedBy) {
      const likerId = userMap.get(likerEmail);
      if (!likerId) continue;

      await db.like.create({
        data: { userId: likerId, postId: post.id },
      });
      likeCount++;

      // Redis 累計ランキング
      await redis.zincrby("ranking:likes", 1, post.id);
      // Redis デイリーランキング（今日の日付で全いいねを加算）
      await redis.zincrby(dailyKey, 1, post.id);
    }

    // デイリーキーのTTLを設定
    if (p.likedBy.length > 0) {
      await redis.expire(dailyKey, 864000);
    }
  }

  console.log(`📝 Created ${postCount} posts.`);
  console.log(`❤️  Created ${likeCount} likes.`);

  await redis.quit();
  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
