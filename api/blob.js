const { handleUpload } = require('@vercel/blob/client');
const crypto = require('node:crypto');
const { getRedis } = require('../lib/redis');
const { getSession, getUserByUsername, sendJson } = require('../lib/auth');

const ALLOWED_EXT = new Set(['pdf','doc','docx','ppt','pptx','xls','xlsx','txt','jpg','jpeg','png','webp']);
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/octet-stream'
]);

function clean(v, max) { return String(v || '').trim().slice(0, max); }
function extOf(name) { const p = String(name || '').toLowerCase().split('.'); return p.length > 1 ? p.pop() : ''; }

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, message: 'Blob endpoint chỉ nhận POST.' });
    const session = await getSession(req);

    let body = req.body;
    if (!body) body = {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    const response = await handleUpload({
      request: req,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = clientPayload ? JSON.parse(clientPayload) : {};
        const user = await getUserByUsername(session.username);
        if (!user) throw new Error('Không tìm thấy tài khoản.');
        if (String(payload.csrf || '') !== String(session.csrf || '')) throw new Error('CSRF token không hợp lệ.');
        const filename = clean(payload.original_name, 180);
        const ext = extOf(filename);
        const mime = clean(payload.mime, 120) || 'application/octet-stream';
        if (!ALLOWED_EXT.has(ext)) throw new Error('Định dạng file không được phép.');
        if (!ALLOWED_MIME.has(mime)) throw new Error('MIME file không được phép.');
        if (!session) throw new Error('Bạn cần đăng nhập trước khi upload.');
        return {
          allowedContentTypes: Array.from(ALLOWED_MIME),
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            username: session.username,
            title: clean(payload.title, 180),
            subject: clean(payload.subject, 60),
            grade: clean(payload.grade, 20),
            source: clean(payload.source, 250),
            note: clean(payload.note, 800),
            original_name: filename,
            mime,
            csrf: session.csrf
          })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const meta = JSON.parse(tokenPayload || '{}');
        const user = await getUserByUsername(meta.username);
        if (!user) throw new Error('Không xác minh được người upload.');
        const redis = getRedis();
        const id = await redis.incr('phuc:student-library:next-id');
        const created = new Date().toISOString();
        const bytes = Number(blob.size || 0);
        const sizeLabel = bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        const item = {
          id,
          title: meta.title,
          subject: meta.subject,
          grade: meta.grade,
          source: meta.source,
          note: meta.note,
          uploader: user.display_name || user.username,
          original_name: meta.original_name,
          mime: meta.mime,
          size: bytes,
          size_label: sizeLabel,
          created_label: new Date(created).toLocaleDateString('vi-VN'),
          created_at: created,
          download_url: blob.downloadUrl || blob.url,
          url: blob.url,
          pathname: blob.pathname
        };
        await redis.lpush('phuc:student-library', JSON.stringify(item));
      }
    });

    return sendJson(res, 200, response);
  } catch (err) {
    console.error('blob-api', err);
    return sendJson(res, 400, { ok: false, message: err?.message || 'Không thể chuẩn bị upload Blob.' });
  }
};
