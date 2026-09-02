const { getRedis } = require('../lib/redis');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, message: 'GET only' }));
  }
  try {
    const redis = getRedis();
    await redis.set('phuc:health:last', new Date().toISOString(), { ex: 120 });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: true, redis: true, blob: !!process.env.BLOB_READ_WRITE_TOKEN, openai: !!process.env.OPENAI_API_KEY }));
  } catch (err) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, message: err.message, redis: false, blob: !!process.env.BLOB_READ_WRITE_TOKEN, openai: !!process.env.OPENAI_API_KEY }));
  }
};
