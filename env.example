const { Redis } = require('@upstash/redis');

let redis;

function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    const err = new Error('Thiếu UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN trên Vercel.');
    err.code = 'REDIS_NOT_CONFIGURED';
    throw err;
  }
  redis = new Redis({ url, token });
  return redis;
}

module.exports = { getRedis };
