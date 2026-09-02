const { getRedis } = require('../lib/redis');
const { getSession, sendJson } = require('../lib/auth');

function text(v) { return String(v == null ? '' : v).trim(); }
function asItem(x) {
  if (!x) return null;
  if (typeof x === 'object') return x;
  try { return JSON.parse(x); } catch { return null; }
}

module.exports = async function handler(req, res) {
  try {
    const action = String(req.query?.action || 'list').toLowerCase();
    if (req.method !== 'GET' || action !== 'list') {
      return sendJson(res, 405, { ok: false, message: 'Upload file 25 MB dùng Vercel Blob client upload tại /api/blob; /api/community chỉ phục vụ danh sách.' });
    }
    const redis = getRedis();
    const q = text(req.query?.q).toLowerCase();
    const subject = text(req.query?.subject);
    const grade = text(req.query?.grade);
    const raw = await redis.lrange('phuc:student-library', 0, 499);
    const items = raw.map(asItem).filter(Boolean);
    const filtered = items.filter(item => {
      if (subject && text(item.subject) !== subject) return false;
      if (grade && text(item.grade) !== grade) return false;
      if (q) {
        const hay = [item.title, item.original_name, item.source, item.note, item.uploader, item.subject, item.grade].map(text).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const base = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host || ''}`;
    const output = filtered.slice(0, 200).map(item => ({
      ...item,
      // Always route private student-library files through the authenticated Blob download endpoint.
      download_url: item.pathname
        ? `/api/blob?kind=student-library&download=1&pathname=${encodeURIComponent(String(item.pathname))}`
        : (item.download_url || item.url || '')
    }));
    return sendJson(res, 200, { ok: true, count: filtered.length, items: output });
  } catch (err) {
    console.error('community-api', err);
    const status = err?.code === 'REDIS_NOT_CONFIGURED' ? 503 : 500;
    return sendJson(res, status, { ok: false, message: status === 503 ? err.message : 'Không thể tải kho tài liệu.' });
  }
};
