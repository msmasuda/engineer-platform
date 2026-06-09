import { kv } from "@/lib/kv";
import { db } from "@/lib/db";

/**
 * 累計ランキングと今日のデイリーランキングをインクリメントします。
 */
export async function recordLikeInRedis(postId: string): Promise<void> {
  const todayStr = new Date().toISOString().split("T")[0];
  const dailyKey = `ranking:daily:${todayStr}`;

  // 1. 累計いいねの更新
  await kv.zincrby("ranking:likes", 1, postId);

  // 2. 本日のデイリーいいねの更新
  await kv.zincrby(dailyKey, 1, postId);
  
  // デイリーキーのTTLを10日間に設定（データが古くなったら自動で消えるようにする）
  await kv.expire(dailyKey, 864000); // 10 days = 864000 seconds
}

/**
 * 累計ランキングと今日のデイリーランキングをデクリメントします。
 * スコアが0以下になった場合は、ランキングからメンバーを削除します。
 */
export async function recordUnlikeInRedis(postId: string): Promise<void> {
  const todayStr = new Date().toISOString().split("T")[0];
  const dailyKey = `ranking:daily:${todayStr}`;

  // 1. 累計いいねのデクリメント
  const allTimeScore = await kv.zincrby("ranking:likes", -1, postId);
  if (allTimeScore === null || allTimeScore <= 0) {
    await kv.zrem("ranking:likes", postId);
  }

  // 2. 本日のデイリーいいねのデクリメント
  const dailyScore = await kv.zincrby(dailyKey, -1, postId);
  if (dailyScore === null || dailyScore <= 0) {
    await kv.zrem(dailyKey, postId);
  }
}

/**
 * 累計いいねランキングのトッププロダクト一覧を取得します。
 */
export async function getCumulativeRanking(limit: number = 10) {
  const postIds = await kv.zrange<string[]>("ranking:likes", 0, limit - 1, { rev: true });
  if (!postIds || postIds.length === 0) {
    return [];
  }
  return fetchPostsInOrder(postIds);
}

/**
 * 直近1週間（7日間）のいいねデータを集計した週間トレンドランキングを取得します。
 */
export async function getWeeklyTrendRanking(limit: number = 10) {
  // 直近7日間の日付キーを生成
  const dailyKeys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split("T")[0];
    dailyKeys.push(`ranking:daily:${dateString}`);
  }

  // ランダムな一時キー名を作成
  const tempKey = `ranking:weekly_temp:${Math.random().toString(36).substring(2, 9)}`;

  try {
    // 7日間のデイリーランキングキーをZUNIONSTOREで合算
    await kv.zunionstore(tempKey, dailyKeys.length, dailyKeys);

    // 合算結果から上位を取得
    const postIds = await kv.zrange<string[]>(tempKey, 0, limit - 1, { rev: true });
    
    if (!postIds || postIds.length === 0) {
      return [];
    }

    return await fetchPostsInOrder(postIds);
  } finally {
    // 一時キーを削除
    await kv.del(tempKey);
  }
}

/**
 * 指定されたPost IDの配列順にデータベースからPostを取得し、その順序を保持したまま返します。
 */
async function fetchPostsInOrder(postIds: string[]) {
  // DBから対象の投稿を取得（作成者と技術タグもインクルード）
  const posts = await db.post.findMany({
    where: {
      id: { in: postIds },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      techTags: true,
      likes: {
        select: {
          userId: true,
        },
      },
    },
  });

  // Prismaのクエリ結果は順序が保証されないため、postIds配列の順序に並び替える
  const postMap = new Map(posts.map((post) => [post.id, post]));
  
  return postIds
    .map((id) => postMap.get(id))
    .filter((post): post is NonNullable<typeof post> => !!post);
}
