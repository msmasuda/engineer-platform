import { kv as vercelKv } from '@vercel/kv';
import Redis from 'ioredis';

export interface CustomKV {
  zincrby(key: string, increment: number, member: string): Promise<number | null>;
  expire(key: string, seconds: number): Promise<number>;
  zrem(key: string, member: string): Promise<number>;
  zrange<T = any>(key: string, min: number | string, max: number | string, options?: { rev?: boolean }): Promise<T>;
  zunionstore(destination: string, numkeys: number, keys: string[]): Promise<number>;
  del(...keys: string[]): Promise<number>;
}

let kv: CustomKV = vercelKv as unknown as CustomKV;

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
      const res = await (client as any).zrange(key, min, max, ...(options?.rev ? ['REV'] : []));
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
