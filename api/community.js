const { getRedis } = require('../lib/redis');
const {
  USER_PREFIX, getSession, getCsrf, requireCsrf, sendJson,
  isAdminUsername, isAdminAccount, rejectIfBanned,
  getClientIp, getRequestVisitorId
} = require('../lib/auth');

const FEEDBACK_CATEGORIES = new Set(['bug', 'exam', 'feature', 'other']);
const ADMIN_CONTACT_EMAIL = String(process.env.FEEDBACK_EMAIL_TO || 'doivo250388@gmail.com').trim();

async function forwardFeedbackNotification(item) {
  let emailSent = false;
  let webhookSent = false;
  const subj = `[HỌC CÙNG PHÚC K9] Feedback (${item.category_label}) ★${item.rating} từ ${item.sender_name}`;
  const plainText = [
    `Thời gian: ${item.created_label}`,
    `Loại: ${item.category_label} | Đánh giá: ${item.rating}/5 sao`,
    `Người gửi: ${item.sender_name}${item.username ? ` (@${item.username})` : ' (Khách)'}`,
    `Liên hệ phản hồi: ${item.contact || 'Không để lại'}`,
    `Trang / Bài đang mở: ${item.page_context || 'Không rõ'}`,
    `Thiết bị: ${item.device_hint || 'Web'}`,
    '',
    'Nội dung góp ý:',
    item.message
  ].join('\n');

  if (process.env.RESEND_API_KEY && ADMIN_CONTACT_EMAIL) {
    try {
      const fromAddr = String(process.env.FEEDBACK_EMAIL_FROM || 'Học Cùng Phúc K9 <onboarding@resend.dev>').trim();
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [ADMIN_CONTACT_EMAIL],
          subject: subj,
          text: plainText
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined
      });
      emailSent = Boolean(resp.ok);
    } catch {}
  }

  if (process.env.FEEDBACK_WEBHOOK_URL) {
    try {
      const resp = await fetch(process.env.FEEDBACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `**${subj}**\n${plainText.slice(0, 1500)}`,
          feedback: item
        }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(3500) : undefined
      });
      webhookSent = Boolean(resp.ok);
    } catch {}
  }

  return { emailSent, webhookSent };
}

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

    if (req.method === 'POST' && action === 'feedback-submit') {
      const session = await getSession(req);
      const csrf = session?.csrf || await getCsrf(req, res);
      if (session?.username) {
        const ban = await rejectIfBanned(redis, req, res, session.username);
        if (ban) return sendJson(res, 403, { ok: false, banned: true, auth_revoked: true, ban_reason: ban.reason, message: 'Tài khoản đã bị khóa vĩnh viễn.', csrf });
      }
      if (!requireCsrf(req, session, csrf)) {
        return sendJson(res, 403, { ok: false, message: 'Phiên bảo mật hết hạn, vui lòng thử bấm gửi lại.', csrf });
      }

      const ip = getClientIp(req) || 'unknown';
      const vis = getRequestVisitorId(req) || ip;
      const rlKey = `phuc:fb:rl:${vis || ip}`;
      try {
        const cnt = Number(await redis.incr(rlKey)) || 1;
        if (cnt === 1) await redis.expire(rlKey, 900);
        if (cnt > 8) {
          return sendJson(res, 429, { ok: false, message: 'Bạn gửi góp ý quá nhanh. Vui lòng chờ ít phút rồi thử lại hoặc nhắn Zalo 0382952325.', csrf });
        }
      } catch {}

      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }

      const rawUser = session?.username
        ? await redis.get(`${USER_PREFIX}${session.username}`).catch(() => null)
        : null;
      const userObj = asItem(rawUser);

      const category = FEEDBACK_CATEGORIES.has(String(body.category || '').trim())
        ? String(body.category).trim()
        : 'other';
      const catLabels = {
        bug: 'Báo lỗi Video / PDF / Web',
        exam: 'Góp ý Đề thi / Đáp án',
        feature: 'Đề xuất tính năng mới',
        other: 'Góp ý chung / Liên hệ'
      };
      const ratingNum = Math.min(5, Math.max(1, Math.round(Number(body.rating || 5))));
      const senderName = text(body.name || userObj?.display_name || session?.username || 'Học viên ẩn danh', 80) || 'Học viên ẩn danh';
      const contact = text(body.contact, 120);
      const message = String(body.message == null ? '' : body.message).replace(/\u0000/g, '').trim().slice(0, 1500);
      const pageContext = text(body.page_context, 180);
      const deviceHint = text(body.device_hint, 60);

      if (message.length < 6) {
        return sendJson(res, 422, { ok: false, message: 'Vui lòng nhập nội dung góp ý ít nhất 6 ký tự.', csrf });
      }

      const id = `fb-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
      const nowIso = new Date().toISOString();
      const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
      const hh = String(vnNow.getUTCHours()).padStart(2, '0');
      const mm = String(vnNow.getUTCMinutes()).padStart(2, '0');
      const dd = String(vnNow.getUTCDate()).padStart(2, '0');
      const mo = String(vnNow.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = vnNow.getUTCFullYear();
      const item = {
        id,
        category,
        category_label: catLabels[category],
        rating: ratingNum,
        sender_name: senderName,
        username: session?.username || '',
        contact,
        message,
        page_context: pageContext,
        device_hint: deviceHint,
        status: 'new',
        admin_note: '',
        created_at: nowIso,
        created_label: `${hh}:${mm} • ${dd}/${mo}/${yyyy}`
      };

      const relay = await forwardFeedbackNotification(item);
      item.email_sent = relay.emailSent;
      item.webhook_sent = relay.webhookSent;

      await redis.lpush('phuc:feedbacks', JSON.stringify(item));
      try { await redis.ltrim('phuc:feedbacks', 0, 299); } catch {}

      return sendJson(res, 200, {
        ok: true,
        csrf: session?.csrf || csrf,
        email_forwarded: relay.emailSent,
        feedback: {
          id: item.id,
          category_label: item.category_label,
          rating: item.rating,
          created_label: item.created_label
        },
        message: relay.emailSent
          ? 'Đã gửi góp ý vào Hộp thư Admin & chuyển tiếp tới Gmail Admin!'
          : 'Đã gửi góp ý thẳng vào Hộp thư Admin trên web!'
      });
    }

    if (req.method === 'POST' && (action === 'create' || action === 'delete')) {
      const session = await getSession(req);
      if (session?.username) {
        const ban = await rejectIfBanned(redis, req, res, session.username);
        if (ban) return sendJson(res, 403, { ok: false, banned: true, auth_revoked: true, ban_reason: ban.reason, message: 'Tài khoản đã bị khóa vĩnh viễn.', csrf });
      }
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
        const isAdm = isAdminAccount(userObj);
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

    return sendJson(res, 405, { ok: false, message: 'Upload file 25 MB dùng /api/blob; /api/community nhận GET list hoặc POST create/delete/feedback-submit.' });
  } catch (err) {
    console.error('community-api', err);
    const status = err?.code === 'REDIS_NOT_CONFIGURED' ? 503 : 500;
    return sendJson(res, status, { ok: false, message: status === 503 ? err.message : 'Không thể xử lý Thư viện cộng đồng.' });
  }
};
