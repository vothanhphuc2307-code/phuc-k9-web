const { getRedis } = require('../lib/redis');
const {
  USER_PREFIX, getSession, getCsrf, requireCsrf, sendJson,
  isAdminUsername, isAdminAccount
} = require('../lib/auth');

function text(v, max = 500) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}
function asItem(x) {
  if (!x) return null;
  if (typeof x === 'object') return x;
  try { return JSON.parse(x); } catch { return null; }
}
function isSafeHttpUrl(raw) {
  try {
    const u = new URL(String(raw || '').trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

module.exports = async function handler(req, res) {
  try {
    const action = String(req.query?.action || 'list').toLowerCase();
    const redis = getRedis();

    if (req.method === 'GET' && action === 'list') {
      const q = text(req.query?.q, 120).toLowerCase();
      const subject = text(req.query?.subject, 60);
      const grade = text(req.query?.grade, 20);
      const raw = await redis.lrange('phuc:student-library', 0, 499);
      const items = (raw || []).map(asItem).filter(Boolean);
      const filtered = items.filter(item => {
        if (subject && text(item.subject, 60) !== subject) return false;
        if (grade && text(item.grade, 20) !== grade) return false;
        if (q) {
          const hay = [item.title, item.original_name, item.source, item.note, item.uploader, item.author, item.subject, item.grade]
            .map(v => text(v, 200))
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      const output = filtered.slice(0, 200).map(item => ({
        ...item,
        download_url: item.pathname
          ? `/api/blob?kind=student-library&download=1&pathname=${encodeURIComponent(String(item.pathname))}`
          : (isSafeHttpUrl(item.download_url || item.url) ? (item.download_url || item.url) : '')
      }));
      return sendJson(res, 200, { ok: true, count: filtered.length, items: output });
    }

    if (req.method === 'POST' && (action === 'create' || action === 'delete')) {
      const session = await getSession(req);
      const csrf = session?.csrf || await getCsrf(req, res);
      if (!session?.username) {
        return sendJson(res, 401, { ok: false, message: 'Vui lòng đăng nhập để chia sẻ hoặc quản lý tài liệu cộng đồng.', csrf });
      }
      if (!requireCsrf(req, session, csrf)) {
        return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
      }

      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }

      const rawUser = await redis.get(`${USER_PREFIX}${session.username}`).catch(() => null);
      const userObj = asItem(rawUser);

      if (action === 'create') {
        const title = text(body.title, 180);
        const subject = text(body.subject || 'Tài liệu K9', 60);
        const grade = text(body.grade || userObj?.settings?.preferred_grade || '2K9', 20);
        const note = text(body.note, 400);
        const rawUrl = text(body.url, 600);
        if (title.length < 3) {
          return sendJson(res, 422, { ok: false, message: 'Tên tài liệu cần ít nhất 3 ký tự.', csrf });
        }
        if (subject.length < 2) {
          return sendJson(res, 422, { ok: false, message: 'Vui lòng nhập môn học (ít nhất 2 ký tự).', csrf });
        }
        if (!isSafeHttpUrl(rawUrl)) {
          return sendJson(res, 422, { ok: false, message: 'Link tài liệu phải bắt đầu bằng https:// hoặc http://.', csrf });
        }
        const id = await redis.incr('phuc:student-library:next-id');
        const created = new Date().toISOString();
        const uploader = text(userObj?.display_name || session.username, 80);
        const item = {
          id,
          title,
          subject,
          grade,
          note,
          username: session.username,
          author: uploader,
          uploader,
          created_label: new Date(created).toLocaleDateString('vi-VN'),
          created_at: created,
          url: rawUrl,
          download_url: rawUrl
        };
        await redis.lpush('phuc:student-library', JSON.stringify(item));
        try { await redis.ltrim('phuc:student-library', 0, 499); } catch {}
        return sendJson(res, 200, { ok: true, item, csrf: session.csrf || csrf, message: 'Đã lưu tài liệu lên Thư viện Cộng đồng!' });
      }

      if (action === 'delete') {
        const targetId = String(body.id || '').trim();
        if (!targetId) {
          return sendJson(res, 422, { ok: false, message: 'Thiếu ID tài liệu cần xóa.', csrf });
        }
        const isAdm = isAdminUsername(session.username) || isAdminAccount(userObj);
        const raw = await redis.lrange('phuc:student-library', 0, 499);
        const items = (raw || []).map(asItem).filter(Boolean);
        const match = items.find(it => String(it.id || '') === targetId);
        if (!match) {
          return sendJson(res, 404, { ok: false, message: 'Không tìm thấy tài liệu này.', csrf });
        }
        if (!isAdm && String(match.username || '').toLowerCase() !== String(session.username).toLowerCase()) {
          return sendJson(res, 403, { ok: false, message: 'Bạn chỉ có thể xóa tài liệu do chính mình chia sẻ.', csrf });
        }
        const kept = items.filter(it => String(it.id || '') !== targetId);
        await redis.del('phuc:student-library');
        for (let i = kept.length - 1; i >= 0; i--) {
          await redis.lpush('phuc:student-library', JSON.stringify(kept[i]));
        }
        return sendJson(res, 200, { ok: true, deleted_id: targetId, csrf: session.csrf || csrf });
      }
    }

    return sendJson(res, 405, { ok: false, message: 'Upload file 25 MB dùng /api/blob; /api/community chỉ nhận GET list hoặc POST create/delete.' });
  } catch (err) {
    console.error('community-api', err);
    const status = err?.code === 'REDIS_NOT_CONFIGURED' ? 503 : 500;
    return sendJson(res, status, { ok: false, message: status === 503 ? err.message : 'Không thể xử lý Thư viện cộng đồng.' });
  }
};
