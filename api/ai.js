const OpenAI = require('openai');
const crypto = require('crypto');
const { sendJson, getSession } = require('../lib/auth');
const { getRedis } = require('../lib/redis');

let client;
function getOpenAI() {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error('Thiếu OPENAI_API_KEY trên Vercel.');
    err.code = 'OPENAI_NOT_CONFIGURED';
    throw err;
  }
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}


function requesterKey(req, session) {
  if (session?.username) return `user:${String(session.username).toLowerCase()}`;
  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  return `ip:${crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32)}`;
}
async function enforceRateLimit(redis, key, max, seconds) {
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const redisKey = `phuc:ai:limit:${key}:${seconds}:${bucket}`;
  const n = Number(await redis.incr(redisKey));
  if (n === 1) await redis.expire(redisKey, seconds + 5);
  return n <= max;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return sendJson(res, 405, { ok: false, message: 'AI Tutor chỉ nhận POST.' });
    }
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }
    const message = String(body.message || '').trim();
    if (!message) return sendJson(res, 422, { ok: false, message: 'Nội dung câu hỏi đang trống.' });
    if (message.length > 2000) return sendJson(res, 422, { ok: false, message: 'Câu hỏi tối đa 2000 ký tự.' });

    // AI is intentionally available to guests, but every request must consume a server-side quota.
    // If Redis is unavailable, fail closed rather than expose an unmetered paid endpoint.
    const session = await getSession(req).catch(() => null);
    const clientKey = requesterKey(req, session);
    const redis = getRedis();
    if (!await enforceRateLimit(redis, clientKey, 8, 60) || !await enforceRateLimit(redis, clientKey, 40, 3600)) {
      return sendJson(res, 429, { ok: false, message: 'Bạn đã dùng nhiều lượt AI trong thời gian ngắn. Hãy thử lại sau.' });
    }

    const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
    const context = body.context || {};
    const system = `Bạn là PHÚC K9 AI TUTOR cho học sinh THPT Việt Nam. Trả lời bằng tiếng Việt, dễ hiểu, ưu tiên hướng dẫn từng bước và không bịa dữ kiện. Khi người học hỏi bài toán, hãy trình bày phép biến đổi rõ ràng. Khi chưa đủ dữ kiện, hỏi lại đúng phần còn thiếu. Context bài học: ${String(context.title || '').slice(0, 300)}. Mô tả: ${String(context.description || '').slice(0, 1000)}.`;

    const response = await getOpenAI().responses.create({
      model,
      input: [
        { role: 'developer', content: system },
        { role: 'user', content: message }
      ],
      max_output_tokens: 1400,
      store: false
    });

    return sendJson(res, 200, { ok: true, answer: response.output_text || 'Mình chưa tạo được câu trả lời.' });
  } catch (err) {
    console.error('ai-api', err);
    if (err?.code === 'OPENAI_NOT_CONFIGURED') return sendJson(res, 503, { ok: false, message: err.message });
    if (err?.code === 'REDIS_NOT_CONFIGURED') return sendJson(res, 503, { ok: false, message: 'AI Tutor đang tạm ngưng vì hệ thống giới hạn lượt gọi chưa sẵn sàng. Vui lòng thử lại sau.' });
    if (err?.status === 401) return sendJson(res, 502, { ok: false, message: 'OPENAI_API_KEY không hợp lệ hoặc đã hết quyền.' });
    if (err?.status === 429) { const code = err?.code || err?.error?.code || err?.body?.error?.code; if (code === 'insufficient_quota') return sendJson(res, 429, { ok: false, message: 'OpenAI API đang hết quota/credit. API key đúng nhưng tài khoản API cần có billing/credit.' }); return sendJson(res, 429, { ok: false, message: 'OpenAI đang giới hạn lượt gọi. Thử lại sau 5–10 giây.' }); }
    return sendJson(res, 500, { ok: false, message: 'AI Tutor gặp lỗi máy chủ. Kiểm tra OPENAI_API_KEY và OPENAI_MODEL.' });
  }
};
