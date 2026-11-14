const { getRedis } = require('../lib/redis');
const {
  USER_PREFIX, parseCookies, clearCookie, setCookie, sendJson, normalizeUsername,
  validUsername, hashPassword, verifyPassword, safeUser, createSession, getSession,
  getCsrf, requireCsrf, isAdminUsername, isAdminAccount
} = require('../lib/auth');
const crypto = require('crypto');
const { ensureUserRpgState } = require('../lib/rpg');

async function ensureDefaultAdmin(redis) {
  try {
    const envAdminPass = String(process.env.ADMIN_DEFAULT_PASSWORD || '').trim();
    const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    const existing = parseUserRecord(await redis.get(`${USER_PREFIX}admin`));
    if (existing) {
      let dirty = false;
      if (existing.xp === 9999 && existing.weekly_xp === 1200) {
        existing.xp = 0;
        existing.weekly_xp = 0;
        if (existing.streak === 30) existing.streak = 1;
        existing.badges = ['Quản Trị Viên Tối Cao', 'Sáng Lập Phúc K9'];
        dirty = true;
      }
      if (envAdminPass.length >= 8 && envAdminPass !== 'admin123' && verifyPassword('admin123', existing)) {
        const { salt, hash } = hashPassword(envAdminPass);
        existing.salt = salt;
        existing.password_hash = hash;
        dirty = true;
      }
      if (dirty) {
        await redis.set(`${USER_PREFIX}admin`, existing);
      }
      return existing;
    }

    // In production (Vercel), NEVER seed @admin with a predictable hardcoded password.
    if (isProd && (envAdminPass.length < 8 || envAdminPass === 'admin123')) {
      console.warn('[security] ADMIN_DEFAULT_PASSWORD is not configured strongly in production; default @admin account not auto-seeded.');
      return null;
    }

    const seedPassword = envAdminPass || 'admin123';
    const { salt, hash } = hashPassword(seedPassword);
    const now = new Date();
    const nowIso = now.toISOString();
    const wk = vnWeekKey(now);
    const adminAcc = {
      username: 'admin',
      display_name: 'Quản Trị Viên Phúc K9',
      role: 'admin',
      is_admin: true,
      salt,
      password_hash: hash,
      created_at: nowIso,
      last_active: nowIso,
      streak: 1,
      xp: 0,
      weekly_xp: 0,
      week_key: wk,
      badges: ['Quản Trị Viên Tối Cao', 'Sáng Lập Phúc K9'],
      progress: { done: {}, resume: null, notes: {} },
      settings: { preferred_grade: '2K9', school: 'Hệ Sinh Thái Học Cùng Phúc K9' },
      google: { linked: false, email: null },
      avatar_data: null,
      avatar_url: null
    };
    await redis.set(`${USER_PREFIX}admin`, adminAcc);
    try { await redis.sadd('phuc:users:index', 'admin'); } catch {}
    return adminAcc;
  } catch {
    return null;
  }
}

function getClientIp(req) {
  const fwd = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const realIp = String(req?.headers?.['x-real-ip'] || '').trim();
  const raw = fwd || realIp || req?.socket?.remoteAddress || 'local';
  return raw.replace(/[^a-zA-Z0-9:._-]/g, '').slice(0, 64) || 'local';
}

function hasWeakDefaultAdminPassword(user) {
  return Boolean(user && isAdminAccount(user) && verifyPassword('admin123', user));
}

function dayKey(v) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function vnWeekKey(d = new Date()) {
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  const date = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function updateStreak(user, now = new Date()) {
  const old = Math.max(1, Number(user.streak || 1));
  if (!user.last_active) return 1;
  const prev = new Date(user.last_active);
  if (Number.isNaN(prev.getTime())) return 1;
  const a = dayKey(prev), b = dayKey(now);
  if (!a || !b || a === b) return old;
  const start = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((today - start) / 86400000);
  return diff === 1 ? old + 1 : diff > 1 ? 1 : old;
}

function parseUserRecord(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function ensureWeeklyState(user, now = new Date()) {
  const wk = vnWeekKey(now);
  if (user.week_key !== wk) {
    user.week_key = wk;
    user.weekly_xp = 0;
  }
  if (!Array.isArray(user.badges) || !user.badges.length) {
    user.badges = ['Thành Viên K9'];
  }
  return user;
}

async function touchUser(redis, user) {
  const now = new Date();
  const next = updateStreak(user, now);
  const wk = vnWeekKey(now);
  let dirty = false;
  if (Number(user.streak || 1) !== next || !user.last_active || dayKey(user.last_active) !== dayKey(now)) {
    user.streak = next;
    user.last_active = now.toISOString();
    dirty = true;
  }
  if (user.week_key !== wk) {
    user.week_key = wk;
    user.weekly_xp = 0;
    dirty = true;
  }
  if (dirty) {
    await redis.set(`${USER_PREFIX}${user.username}`, user);
    try { await redis.sadd('phuc:users:index', user.username); } catch {}
  }
  return user;
}

function safeReturnTo(v) {
  try {
    const u = new URL(String(v || '/'));
    if (u.origin === new URL(process.env.APP_ORIGIN || 'https://thanhphuc.vercel.app').origin) return u.href;
  } catch {}
  return process.env.APP_ORIGIN || 'https://thanhphuc.vercel.app/';
}

async function googleLinkStart(req, res, redis, session) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return sendJson(res, 503, { ok: false, message: 'Google OAuth chưa được cấu hình. Thêm GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET và GOOGLE_REDIRECT_URI trên Vercel.' });
  if (!session) return sendJson(res, 401, { ok: false, message: 'Hãy đăng nhập trước khi liên kết Google.' });
  const redirect = process.env.GOOGLE_REDIRECT_URI;
  if (!redirect) return sendJson(res, 503, { ok: false, message: 'Thiếu GOOGLE_REDIRECT_URI trên Vercel.' });
  const state = crypto.randomBytes(24).toString('hex');
  await redis.set(`phuc:google-state:${state}`, { username: session.username, created_at: Date.now(), return_to: safeReturnTo(req.query?.return_to) }, { ex: 600 });
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile', state, access_type: 'online', prompt: 'select_account' });
  res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  res.end();
}

async function googleCallback(req, res, redis) {
  const code = String(req.query?.code || '');
  const state = String(req.query?.state || '');
  if (!code || !state) return sendJson(res, 400, { ok: false, message: 'Google callback thiếu code/state.' });
  const rec = await redis.get(`phuc:google-state:${state}`);
  if (!rec) return sendJson(res, 400, { ok: false, message: 'Liên kết Google đã hết hạn. Hãy thử lại.' });
  await redis.del(`phuc:google-state:${state}`);
  const clientId = process.env.GOOGLE_CLIENT_ID, clientSecret = process.env.GOOGLE_CLIENT_SECRET, redirect = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirect) return sendJson(res, 503, { ok: false, message: 'Google OAuth chưa được cấu hình đầy đủ.' });
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, grant_type: 'authorization_code' })
  });
  if (!tokenResp.ok) throw new Error('Google token exchange failed');
  const tok = await tokenResp.json();
  const profileResp = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tok.access_token}` } });
  if (!profileResp.ok) throw new Error('Google userinfo failed');
  const gp = await profileResp.json();
  const user = await redis.get(`${USER_PREFIX}${rec.username}`);
  if (!user) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy tài khoản.' });
  user.google = { linked: true, sub: String(gp.sub || ''), email: String(gp.email || '').slice(0, 180), picture: String(gp.picture || '').slice(0, 600) };
  if (!user.avatar_url && gp.picture) user.avatar_url = String(gp.picture).slice(0, 600);
  user.last_active = new Date().toISOString();
  await redis.set(`${USER_PREFIX}${user.username}`, user);
  const to = safeReturnTo(rec.return_to);
  res.writeHead(302, { Location: to + (to.includes('?') ? '&' : '?') + 'google_linked=1' });
  res.end();
}

module.exports = async function handler(req, res) {
  try {
    const action = String(req.query?.action || 'me').toLowerCase();
    const redis = getRedis();
    await ensureDefaultAdmin(redis);
    const session = await getSession(req);
    const csrf = session?.csrf || await getCsrf(req, res);
    if (action === 'google-link' && req.method === 'GET') return await googleLinkStart(req, res, redis, session);
    if (action === 'google-callback' && req.method === 'GET') return await googleCallback(req, res, redis);

    if (action === 'me' && req.method === 'GET') {
      if (!session) return sendJson(res, 200, { ok: true, authenticated: false, user: null, csrf, is_admin: false });
      setCookie(res, 'phuc_csrf', session.csrf || csrf, { httpOnly: false, maxAge: 60 * 60 * 24 * 30 });
      const user = parseUserRecord(await redis.get(`${USER_PREFIX}${session.username}`));
      if (!user) return sendJson(res, 200, { ok: true, authenticated: false, user: null, csrf, is_admin: false });
      const fresh = await touchUser(redis, user);
      const isAdm = isAdminAccount(fresh);
      return sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: safeUser(fresh),
        csrf: session.csrf || csrf,
        is_admin: isAdm,
        weak_password_warning: isAdm && hasWeakDefaultAdminPassword(fresh)
      });
    }

    if (!['register', 'login', 'forgot-password', 'save-state', 'save-profile', 'change-password', 'logout'].includes(action)) {
      return sendJson(res, 400, { ok: false, message: 'Hành động không hợp lệ.' });
    }
    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, message: 'API này chỉ nhận POST cho action này.' });
    if (!['register', 'login', 'forgot-password'].includes(action) && !requireCsrf(req, session, csrf)) {
      return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    }

    if (action === 'register') {
      const username = normalizeUsername(body.username);
      const displayName = String(body.display_name || '').trim();
      const password = String(body.password || '');
      const preferredGrade = ['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(String(body.preferred_grade || '').toUpperCase())
        ? String(body.preferred_grade).toUpperCase()
        : '2K9';
      const school = String(body.school || '').trim().slice(0, 80);
      const recoveryEmail = String(body.recovery_email || '').trim().toLowerCase().slice(0, 120);
      const recoveryPin = String(body.recovery_pin || '').trim();
      if (!validUsername(username)) return sendJson(res, 422, { ok: false, message: 'Tên đăng nhập chỉ gồm chữ, số, dấu chấm, gạch ngang (3–40 ký tự).' });
      if (['guest', 'khach', 'khach_k9', 'anonymous', 'k9-guest'].includes(username)) return sendJson(res, 422, { ok: false, message: 'Tên đăng nhập này được dành riêng cho hệ thống. Hãy chọn tên khác!' });
      if (isAdminUsername(username)) {
        return sendJson(res, 403, { ok: false, message: 'Tên đăng nhập này thuộc quyền Quản trị viên hệ thống, không thể tự đăng ký công khai.' });
      }
      if (displayName.length < 2 || displayName.length > 80) return sendJson(res, 422, { ok: false, message: 'Họ và tên cần từ 2 đến 80 ký tự.' });
      if (password.length < 6 || password.length > 128) return sendJson(res, 422, { ok: false, message: 'Mật khẩu cần từ 6 đến 128 ký tự.' });
      if (recoveryPin && (recoveryPin.length < 4 || recoveryPin.length > 32)) {
        return sendJson(res, 422, { ok: false, message: 'Mã bảo mật khôi phục cần từ 4 đến 32 ký tự.' });
      }
      const { salt, hash } = hashPassword(password);
      const recPair = recoveryPin ? hashPassword(recoveryPin) : null;
      const now = new Date();
      const nowIso = now.toISOString();
      const wk = vnWeekKey(now);
      const user = {
        username,
        display_name: displayName,
        role: 'student',
        is_admin: false,
        salt,
        password_hash: hash,
        recovery_salt: recPair ? recPair.salt : null,
        recovery_hash: recPair ? recPair.hash : null,
        created_at: nowIso,
        last_active: nowIso,
        streak: 1,
        xp: 100,
        weekly_xp: 100,
        week_key: wk,
        badges: ['Tân Binh K9'],
        progress: { done: {}, resume: null, notes: {} },
        settings: { preferred_grade: preferredGrade, school, recovery_email: recoveryEmail || '' },
        google: { linked: false, email: null },
        avatar_data: null,
        avatar_url: null
      };
      ensureUserRpgState(user, now);
      const created = await redis.set(`${USER_PREFIX}${username}`, user, { nx: true });
      if (!created) return sendJson(res, 409, { ok: false, message: 'Tên đăng nhập đã tồn tại.' });
      try { await redis.sadd('phuc:users:index', username); } catch {}
      try { await redis.srem?.('phuc:users:deleted', username); } catch {}
      await createSession(res, username, csrf);
      return sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: safeUser(user),
        csrf,
        is_admin: false,
        message: 'Tạo tài khoản thành công! Bạn được tặng +100 XP khởi đầu và đã có mặt trên Bảng Xếp Hạng.'
      });
    }

    if (action === 'login') {
      const username = normalizeUsername(body.username);
      const password = String(body.password || '');
      const clientIp = getClientIp(req);
      const failKey = `phuc:auth:fail:${clientIp}:${username || '_'}`;
      const fails = Number(await redis.get(failKey).catch(() => 0) || 0);
      if (fails >= 10) {
        return sendJson(res, 429, {
          ok: false,
          message: 'Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 15 phút.',
          csrf
        });
      }

      const user = parseUserRecord(await redis.get(`${USER_PREFIX}${username}`));
      if (!user || !verifyPassword(password, user)) {
        try {
          await redis.incr(failKey);
          await redis.expire(failKey, 900);
        } catch {}
        return sendJson(res, 401, { ok: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.', csrf });
      }
      try { await redis.del(failKey); } catch {}
      const now = new Date();
      user.streak = updateStreak(user, now);
      user.last_active = now.toISOString();
      ensureWeeklyState(user, now);
      const isAdm = isAdminAccount(user);
      if (!isAdm && (typeof user.xp !== 'number' || Number.isNaN(user.xp))) user.xp = 100;
      ensureUserRpgState(user, now);
      await redis.set(`${USER_PREFIX}${username}`, user);
      try { await redis.sadd('phuc:users:index', username); } catch {}
      await createSession(res, username, csrf);
      const weakWarn = isAdm && hasWeakDefaultAdminPassword(user);
      return sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: safeUser(user),
        csrf,
        is_admin: isAdm,
        weak_password_warning: weakWarn,
        message: isAdm ? 'Đăng nhập quyền Quản Trị Viên (Admin) thành công!' : 'Đăng nhập thành công.'
      });
    }

    if (action === 'forgot-password') {
      const username = normalizeUsername(body.username);
      const recoveryInput = String(body.recovery_input || '').trim();
      const recoveryPin = String(body.recovery_pin || recoveryInput || '').trim();
      const recoveryEmail = String(body.recovery_email || recoveryInput || '').trim().toLowerCase();
      const newPass = String(body.new_password || '');
      const confirmPass = Object.prototype.hasOwnProperty.call(body, 'confirm_password')
        ? String(body.confirm_password || '')
        : newPass;
      const clientIp = getClientIp(req);
      const failKey = `phuc:auth:fail:${clientIp}:${username || '_'}`;
      const fails = Number(await redis.get(failKey).catch(() => 0) || 0);
      if (fails >= 10) {
        return sendJson(res, 429, {
          ok: false,
          message: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút.',
          csrf
        });
      }
      if (!username || (!recoveryPin && !recoveryEmail) || newPass.length < 6 || newPass.length > 128) {
        return sendJson(res, 422, { ok: false, message: 'Vui lòng nhập đầy đủ Tên đăng nhập, Mã PIN / Gmail khôi phục và Mật khẩu mới (tối thiểu 6 ký tự).', csrf });
      }
      if (newPass !== confirmPass) {
        return sendJson(res, 422, { ok: false, message: 'Xác nhận mật khẩu mới chưa khớp.', csrf });
      }
      const user = parseUserRecord(await redis.get(`${USER_PREFIX}${username}`));
      const savedEmail = String(user?.settings?.recovery_email || '').trim().toLowerCase();
      const hasPin = Boolean(user?.recovery_hash && user?.recovery_salt);
      if (!user || isAdminAccount(user) || (!hasPin && !savedEmail)) {
        try { await redis.incr(failKey); await redis.expire(failKey, 900); } catch {}
        return sendJson(res, 403, {
          ok: false,
          message: 'Tài khoản chưa cài đặt Mã PIN / Gmail khôi phục hoặc thông tin không đúng. Hãy liên hệ Admin để được cấp lại mật khẩu.',
          csrf
        });
      }
      const pinMatched = hasPin && recoveryPin
        ? verifyPassword(recoveryPin, { salt: user.recovery_salt, password_hash: user.recovery_hash })
        : false;
      const emailMatched = savedEmail && recoveryEmail && recoveryEmail.includes('@')
        ? recoveryEmail === savedEmail
        : false;
      if (!pinMatched && !emailMatched) {
        try { await redis.incr(failKey); await redis.expire(failKey, 900); } catch {}
        return sendJson(res, 403, { ok: false, message: 'Mã PIN khôi phục hoặc Gmail khôi phục không khớp.', csrf });
      }
      try { await redis.del(failKey); } catch {}
      const { salt, hash } = hashPassword(newPass);
      user.salt = salt;
      user.password_hash = hash;
      user.last_active = new Date().toISOString();
      await redis.set(`${USER_PREFIX}${username}`, user);
      await createSession(res, username, csrf);
      return sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: safeUser(user),
        csrf,
        is_admin: false,
        message: 'Khôi phục mật khẩu thành công! Đã tự động đăng nhập.'
      });
    }

    if (action === 'save-profile') {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Phiên đăng nhập đã hết.', csrf });
      const user = parseUserRecord(await redis.get(`${USER_PREFIX}${session.username}`));
      if (!user) return sendJson(res, 401, { ok: false, message: 'Không tìm thấy tài khoản.', csrf });
      const displayName = String(body.display_name ?? user.display_name ?? '').trim();
      const preferred = String(body.preferred_grade ?? user.settings?.preferred_grade ?? '2K9').toUpperCase();
      const school = String(body.school ?? user.settings?.school ?? '').trim().slice(0, 80);
      const bio = String(body.bio ?? user.settings?.bio ?? '').trim().slice(0, 120);
      const recoveryEmail = Object.prototype.hasOwnProperty.call(body, 'recovery_email')
        ? String(body.recovery_email || '').trim().toLowerCase().slice(0, 120)
        : String(user.settings?.recovery_email || '');
      const recoveryPin = String(body.recovery_pin || '').trim();
      if (displayName.length < 2 || displayName.length > 80) return sendJson(res, 422, { ok: false, message: 'Tên hiển thị cần từ 2 đến 80 ký tự.', csrf });
      if (!['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(preferred)) return sendJson(res, 422, { ok: false, message: 'Khối ưu tiên không hợp lệ.', csrf });
      if (recoveryPin && (recoveryPin.length < 4 || recoveryPin.length > 32)) {
        return sendJson(res, 422, { ok: false, message: 'Mã bảo mật khôi phục cần từ 4 đến 32 ký tự.', csrf });
      }
      if (recoveryPin) {
        const recPair = hashPassword(recoveryPin);
        user.recovery_salt = recPair.salt;
        user.recovery_hash = recPair.hash;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'avatar_data')) {
        const a = String(body.avatar_data || '');
        if (a && (!/^data:image\/(jpeg|png|webp);base64,/.test(a) || a.length > 260000)) {
          return sendJson(res, 422, { ok: false, message: 'Ảnh đại diện không hợp lệ hoặc quá lớn.', csrf });
        }
        user.avatar_data = a || null;
      }
      user.display_name = displayName;
      user.settings = { ...(user.settings || {}), preferred_grade: preferred, school, bio, recovery_email: recoveryEmail };
      user.last_active = new Date().toISOString();
      await redis.set(`${USER_PREFIX}${session.username}`, user);
      try { await redis.sadd('phuc:users:index', session.username); } catch {}
      return sendJson(res, 200, { ok: true, user: safeUser(user), csrf: session.csrf || csrf, is_admin: isAdminAccount(user), message: 'Đã lưu cài đặt tài khoản.' });
    }

    if (action === 'change-password') {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Phiên đăng nhập đã hết.', csrf });
      const user = parseUserRecord(await redis.get(`${USER_PREFIX}${session.username}`));
      if (!user) return sendJson(res, 401, { ok: false, message: 'Không tìm thấy tài khoản.', csrf });
      const currentPass = String(body.current_password || '');
      const newPass = String(body.new_password || '');
      const confirmPass = Object.prototype.hasOwnProperty.call(body, 'confirm_password')
        ? String(body.confirm_password || '')
        : newPass;
      if (!verifyPassword(currentPass, user)) {
        return sendJson(res, 401, { ok: false, message: 'Mật khẩu hiện tại không đúng.', csrf });
      }
      if (newPass.length < 6 || newPass.length > 128) {
        return sendJson(res, 422, { ok: false, message: 'Mật khẩu mới cần từ 6 đến 128 ký tự.', csrf });
      }
      if (newPass !== confirmPass) {
        return sendJson(res, 422, { ok: false, message: 'Mật khẩu xác nhận không khớp.', csrf });
      }
      const { salt, hash } = hashPassword(newPass);
      user.salt = salt;
      user.password_hash = hash;
      user.last_active = new Date().toISOString();
      await redis.set(`${USER_PREFIX}${session.username}`, user);
      return sendJson(res, 200, { ok: true, csrf: session.csrf || csrf, message: 'Đổi mật khẩu thành công!' });
    }

    if (action === 'save-state') {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Phiên đăng nhập đã hết.', csrf });
      const user = parseUserRecord(await redis.get(`${USER_PREFIX}${session.username}`));
      if (!user) return sendJson(res, 401, { ok: false, message: 'Không tìm thấy tài khoản.', csrf });
      const now = new Date();
      user.streak = updateStreak(user, now);
      user.last_active = now.toISOString();
      ensureWeeklyState(user, now);

      const prevDone = user.progress?.done && typeof user.progress.done === 'object' ? user.progress.done : {};
      const nextDone = body.done && typeof body.done === 'object' ? body.done : prevDone;

      user.progress = {
        done: nextDone,
        resume: body.resume && typeof body.resume === 'object' ? body.resume : (user.progress?.resume || null),
        notes: body.notes && typeof body.notes === 'object' ? body.notes : (user.progress?.notes || {})
      };
      await redis.set(`${USER_PREFIX}${session.username}`, user);
      try { await redis.sadd('phuc:users:index', session.username); } catch {}
      return sendJson(res, 200, { ok: true, user: safeUser(user), csrf: session.csrf || csrf, is_admin: isAdminAccount(user) });
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
    return sendJson(res, status, { ok: false, message: status === 503 ? err.message : 'Lỗi máy chủ xác thực.' });
  }
};
