import { kv as vercelKv } from '@vercel/kv';
import Redis from 'ioredis';

let kv: any = vercelKv;

const hasRestApi = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
const redisUrl = process.env.KV_URL || process.env.REDIS_URL;

if (!hasRestApi && redisUrl) {
  const client = new Redis(redisUrl);
  
  kv = {
    async zincrby(key: string, increment: number, member: string): Promise<number | null> {
      const res = await client.zincrby(key, increment, member);
      return res !== null ? parseFloat(res) : null;
    },
    async expire(key: string, seconds: number): Promise<number> {
      return await client.expire(key, seconds);
    },
    async zrem(key: string, member: string): Promise<number> {
      return await client.zrem(key, member);
    },
    async zrange<T = any>(key: string, min: number | string, max: number | string, options?: { rev?: boolean }): Promise<T> {
      let args: any[] = [key, min, max];
      if (options?.rev) {
        args.push('REV');
      }
      const res = await client.zrange(...args);
      return res as unknown as T;
    },
    async zunionstore(destination: string, numkeys: number, keys: string[]): Promise<number> {
      return await client.zunionstore(destination, numkeys, ...keys);
    },
    async del(...keys: string[]): Promise<number> {
      return await client.del(...keys);
    }
  };
}

export { kv };
