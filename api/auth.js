const {
  getRedis
} = require('../lib/redis');
const {
  USER_PREFIX,
  parseCookies,
  clearCookie,
  sendJson,
  normalizeUsername,
  validUsername,
  hashPassword,
  verifyPassword,
  safeUser,
  createSession,
  getSession,
  getCsrf,
  requireCsrf
} = require('../lib/auth');

function updateStreak(user, now = new Date()) {
  const old = Number(user.streak || 1);
  if (!user.last_active) return 1;
  const a = new Date(user.last_active);
  const day = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(a)) / 86400000);
  return diff === 1 ? old + 1 : diff > 1 ? 1 : old;
}

module.exports = async function handler(req, res) {
  try {
    const action = String(req.query?.action || 'me').toLowerCase();
    const redis = getRedis();
    const session = await getSession(req);
    const csrf = session?.csrf || await getCsrf(req, res);

    if (action === 'me' && req.method === 'GET') {
      if (!session) return sendJson(res, 200, { ok: true, authenticated: false, user: null, csrf });
      setCookie(res, 'phuc_csrf', session.csrf || csrf, { httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
      const user = await redis.get(`${USER_PREFIX}${session.username}`);
      return sendJson(res, 200, { ok: true, authenticated: !!user, user: safeUser(user), csrf: session.csrf || csrf });
    }

    if (!['register', 'login', 'save-state', 'logout'].includes(action)) {
      return sendJson(res, 400, { ok: false, message: 'Hành động không hợp lệ.' });
    }
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, message: 'API này chỉ nhận POST cho action này.' });

    if (!requireCsrf(req, session, csrf)) {
      return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ. Hãy tải lại trang và thử lại.', csrf });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }

    if (action === 'register') {
      const username = normalizeUsername(body.username);
      const displayName = String(body.display_name || '').trim();
      const password = String(body.password || '');
      if (!validUsername(username)) return sendJson(res, 422, { ok: false, message: 'Tên đăng nhập 3–40 ký tự, chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.' });
      if (displayName.length < 2 || displayName.length > 80) return sendJson(res, 422, { ok: false, message: 'Họ và tên không hợp lệ.' });
      if (password.length < 6 || password.length > 128) return sendJson(res, 422, { ok: false, message: 'Mật khẩu cần từ 6 đến 128 ký tự.' });
      const { salt, hash } = hashPassword(password);
      const now = new Date().toISOString();
      const user = {
        username,
        display_name: displayName,
        salt,
        password_hash: hash,
        created_at: now,
        last_active: now,
        streak: 1,
        progress: { done: {}, resume: null, notes: {} }
      };
      const created = await redis.set(`${USER_PREFIX}${username}`, user, { nx: true });
      if (!created) return sendJson(res, 409, { ok: false, message: 'Tên đăng nhập đã tồn tại.' });
      await createSession(res, username, csrf);
      return sendJson(res, 200, { ok: true, authenticated: true, user: safeUser(user), csrf, message: 'Tạo tài khoản thành công. Dữ liệu đã được lưu trên máy chủ.' });
    }

    if (action === 'login') {
      const username = normalizeUsername(body.username);
      const password = String(body.password || '');
      const user = await redis.get(`${USER_PREFIX}${username}`);
      if (!user || !verifyPassword(password, user)) {
        return sendJson(res, 401, { ok: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.', csrf });
      }
      const now = new Date();
      user.streak = updateStreak(user, now);
      user.last_active = now.toISOString();
      await redis.set(`${USER_PREFIX}${username}`, user);
      await createSession(res, username, csrf);
      return sendJson(res, 200, { ok: true, authenticated: true, user: safeUser(user), csrf, message: 'Đăng nhập thành công.' });
    }

    if (action === 'save-state') {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Phiên đăng nhập đã hết. Hãy đăng nhập lại.', csrf });
      const user = await redis.get(`${USER_PREFIX}${session.username}`);
      if (!user) return sendJson(res, 401, { ok: false, message: 'Không tìm thấy tài khoản.', csrf });
      user.progress = {
        done: body.done && typeof body.done === 'object' ? body.done : {},
        resume: body.resume && typeof body.resume === 'object' ? body.resume : null,
        notes: body.notes && typeof body.notes === 'object' ? body.notes : {}
      };
      user.last_active = new Date().toISOString();
      await redis.set(`${USER_PREFIX}${session.username}`, user);
      return sendJson(res, 200, { ok: true, user: safeUser(user), csrf: session.csrf || csrf });
    }

    if (action === 'logout') {
      const cookies = parseCookies(req);
      if (cookies.phuc_session) await redis.del(`phuc:session:${cookies.phuc_session}`);
      clearCookie(res, 'phuc_session');
      clearCookie(res, 'phuc_csrf');
      return sendJson(res, 200, { ok: true, authenticated: false, user: null, message: 'Đã đăng xuất.' });
    }

    return sendJson(res, 400, { ok: false, message: 'Hành động không hợp lệ.' });
  } catch (err) {
    console.error('auth-api', err);
    const status = err?.code === 'REDIS_NOT_CONFIGURED' ? 503 : 500;
    return sendJson(res, status, { ok: false, message: status === 503 ? err.message : 'Lỗi máy chủ xác thực. Kiểm tra Environment Variables trên Vercel.' });
  }
};
