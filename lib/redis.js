let redis;
let memoryStore;

function createMemoryRedis() {
  const kv = new Map();
  const sets = new Map();
  const lists = new Map();
  const zsets = new Map();
  const expiries = new Map();

  function isExpired(key) {
    const exp = expiries.get(key);
    if (exp && Date.now() > exp) {
      kv.delete(key);
      sets.delete(key);
      lists.delete(key);
      zsets.delete(key);
      expiries.delete(key);
      return true;
    }
    return false;
  }

  return {
    __isMemoryFallback: true,
    async get(key) {
      if (isExpired(key)) return null;
      return kv.has(key) ? kv.get(key) : null;
    },
    async set(key, value, opts = {}) {
      if (isExpired(key)) { /* cleaned */ }
      if (opts && opts.nx && kv.has(key)) return null;
      kv.set(key, value);
      if (opts && Number(opts.ex) > 0) {
        expiries.set(key, Date.now() + Number(opts.ex) * 1000);
      }
      return 'OK';
    },
    async del(key) {
      const existed = kv.delete(key) || sets.delete(key) || lists.delete(key) || zsets.delete(key);
      expiries.delete(key);
      return existed ? 1 : 0;
    },
    async incr(key) {
      if (isExpired(key)) { /* cleaned */ }
      const next = (Number(kv.get(key) || 0) || 0) + 1;
      kv.set(key, next);
      return next;
    },
    async expire(key, seconds) {
      if (Number(seconds) > 0) expiries.set(key, Date.now() + Number(seconds) * 1000);
      return 1;
    },
    async sadd(key, ...members) {
      if (isExpired(key)) { /* cleaned */ }
      let s = sets.get(key);
      if (!s) { s = new Set(); sets.set(key, s); }
      let added = 0;
      for (const m of members.flat()) {
        const str = String(m);
        if (!s.has(str)) { s.add(str); added++; }
      }
      return added;
    },
    async smembers(key) {
      if (isExpired(key)) return [];
      const s = sets.get(key);
      return s ? [...s] : [];
    },
    async scard(key) {
      if (isExpired(key)) return 0;
      const s = sets.get(key);
      return s ? s.size : 0;
    },
    async lpush(key, ...values) {
      if (isExpired(key)) { /* cleaned */ }
      let arr = lists.get(key);
      if (!arr) { arr = []; lists.set(key, arr); }
      for (const v of values) arr.unshift(v);
      return arr.length;
    },
    async lrange(key, start, stop) {
      if (isExpired(key)) return [];
      const arr = lists.get(key) || [];
      const end = stop < 0 ? arr.length + stop + 1 : stop + 1;
      return arr.slice(Math.max(0, start), end);
    },
    async llen(key) {
      if (isExpired(key)) return 0;
      const arr = lists.get(key);
      return arr ? arr.length : 0;
    },
    async ltrim(key, start, stop) {
      if (isExpired(key)) return 'OK';
      const arr = lists.get(key);
      if (!arr) return 'OK';
      const end = stop < 0 ? arr.length + stop + 1 : stop + 1;
      lists.set(key, arr.slice(Math.max(0, start), end));
      return 'OK';
    },
    async zincrby(key, increment, member) {
      if (isExpired(key)) { /* cleaned */ }
      let z = zsets.get(key);
      if (!z) { z = new Map(); zsets.set(key, z); }
      const strMember = String(member);
      const next = (Number(z.get(strMember) || 0) || 0) + Number(increment || 0);
      z.set(strMember, next);
      return next;
    },
    async zadd(key, item) {
      if (isExpired(key)) { /* cleaned */ }
      let z = zsets.get(key);
      if (!z) { z = new Map(); zsets.set(key, z); }
      const items = Array.isArray(item) ? item : [item];
      let added = 0;
      for (const entry of items) {
        if (entry && entry.member !== undefined) {
          const strM = String(entry.member);
          if (!z.has(strM)) added++;
          z.set(strM, Number(entry.score || 0));
        }
      }
      return added;
    },
    async zscore(key, member) {
      if (isExpired(key)) return null;
      const z = zsets.get(key);
      if (!z) return null;
      const val = z.get(String(member));
      return val === undefined ? null : val;
    },
    async zrem(key, member) {
      if (isExpired(key)) return 0;
      const z = zsets.get(key);
      if (!z) return 0;
      return z.delete(String(member)) ? 1 : 0;
    },
    async zrange(key, start = 0, stop = -1, opts = {}) {
      if (isExpired(key)) return [];
      const z = zsets.get(key);
      if (!z || z.size === 0) return [];
      const entries = [...z.entries()].sort((a, b) => opts?.rev ? (b[1] - a[1]) : (a[1] - b[1]));
      const len = entries.length;
      const sIdx = start < 0 ? Math.max(0, len + start) : start;
      const eIdx = stop < 0 ? len + stop : stop;
      const sliced = entries.slice(sIdx, eIdx + 1);
      if (opts?.withScores) {
        const flat = [];
        for (const [m, sc] of sliced) flat.push(m, sc);
        return flat;
      }
      return sliced.map(([m]) => m);
    },
    async scan(cursor, opts = {}) {
      const pattern = String(opts.match || '*');
      const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
      const allKeys = [...new Set([...kv.keys(), ...sets.keys(), ...lists.keys(), ...zsets.keys()])]
        .filter(k => !isExpired(k) && regex.test(k));
      return [0, allKeys];
    }
  };
}

function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    if (!memoryStore) memoryStore = createMemoryRedis();
    return memoryStore;
  }
  try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({ url, token });
    return redis;
  } catch {
    if (!memoryStore) memoryStore = createMemoryRedis();
    return memoryStore;
  }
}

module.exports = { getRedis };
