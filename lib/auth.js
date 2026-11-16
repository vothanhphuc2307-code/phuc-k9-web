const crypto = require('node:crypto');
const { getRedis } = require('./redis');
const { buildPublicRpgSnapshot } = require('./rpg');

const SESSION_TTL = 60 * 60 * 24 * 30;
const SESSION_COOKIE = 'phuc_session';
const CSRF_COOKIE = 'phuc_csrf';
const USER_PREFIX = 'phuc:user:';
const SESSION_PREFIX = 'phuc:session:';

function jsonCookie(value, { httpOnly = false, maxAge = 0 } = {}) {
  const parts = [
    `${value ? '' : ''}`,
    'Path=/',
    'SameSite=Lax'
  ];
  if (httpOnly) parts.push('HttpOnly');
  if (maxAge > 0) parts.push(`Max-Age=${maxAge}`);
  if (process.env.VERCEL === '1') parts.push('Secure');
  return parts.filter(Boolean).join('; ');
}

function parseCookies(req) {
  const raw = req.headers?.cookie || '';
  const out = {};
  for (const piece of raw.split(';')) {
    const i = piece.indexOf('=');
    if (i < 0) continue;
    const k = piece.slice(0, i).trim();
    const v = piece.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function setCookie(res, name, value, options = {}) {
  const serialized = `${name}=${encodeURIComponent(value)}; ${jsonCookie(value, options).replace(/^;\s*/, '')}`;
  const previous = res.getHeader?.('Set-Cookie');
  const list = Array.isArray(previous) ? previous.slice() : previous ? [previous] : [];
  list.push(serialized);
  res.setHeader('Set-Cookie', list);
}

function clearCookie(res, name) {
  const parts = [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'SameSite=Lax'
  ];
  if (process.env.VERCEL === '1') parts.push('Secure');
  res.setHeader('Set-Cookie', [parts.join('; ')]);
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
}

const SUPER_ADMIN_USERNAME = 'phucadmin';
const BANNED_USERS_SET = 'phuc:users:banned';
const BANNED_USER_PREFIX = 'phuc:ban:user:';
const BANNED_VISITOR_PREFIX = 'phuc:ban:visitor:';
const WARN_USER_PREFIX = 'phuc:warn:user:';
const WARN_VISITOR_PREFIX = 'phuc:warn:visitor:';
const RESERVED_ADMIN_DEFAULTS = [
  'phucadmin',
  'admin',
  'administrator',
  'superadmin',
  'root',
  'system',
  'moderator',
  'phuck9',
  'thanhphuc',
  'phuck9admin',
];

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function getClientIp(req) {
  const fwd = req?.headers?.['x-forwarded-for'] || req?.headers?.['x-real-ip'] || req?.socket?.remoteAddress || '';
  return String(fwd).split(',')[0].trim().slice(0, 80);
}

function getRequestVisitorId(req) {
  return String(
    req?.headers?.['x-pk9-visitor'] ||
    req?.body?.visitor_id ||
    req?.query?.visitor_id ||
    ''
  ).trim().slice(0, 96);
}

function clearAuthCookies(res) {
  if (!res?.setHeader) return;
  const expired = 'Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  const list = [
    `${SESSION_COOKIE}=; ${expired}; HttpOnly${secure}`,
    `${CSRF_COOKIE}=; ${expired}${secure}`,
  ];
  res.setHeader('Set-Cookie', list);
}

async function revokeRequestSession(req, res, redisClient = null) {
  try {
    const cookies = parseCookies(req || {});
    const token = cookies[SESSION_COOKIE];
    if (token) {
      const r = redisClient || getRedis();
      await r.del(`${SESSION_PREFIX}${token}`);
    }
  } catch {}
  clearAuthCookies(res);
}

function isSuperAdminUsername(username) {
  return normalizeUsername(username) === SUPER_ADMIN_USERNAME;
}

function isSuperAdminAccount(user) {
  return Boolean(user && !user.banned && isSuperAdminUsername(user.username));
}

function isReservedAdminUsername(username) {
  const u = normalizeUsername(username);
  if (!u) return false;
  const raw = String(process.env.ADMIN_USERNAME || process.env.ADMINUSER || '')
    .split(',')
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...RESERVED_ADMIN_DEFAULTS, ...raw]).has(u);
}

function isAdminUsername(username) {
  return isSuperAdminUsername(username);
}

function isAdminAccount(user) {
  if (!user || user.banned) return false;
  const u = normalizeUsername(user.username);
  if (u === SUPER_ADMIN_USERNAME) return true;
  return Boolean(
    user.is_admin === true &&
    user.role === 'admin' &&
    normalizeUsername(user.admin_granted_by) === SUPER_ADMIN_USERNAME
  );
}

async function appendSecurityAudit(redisClient, { event, detail, actor = 'security-guard' }) {
  try {
    const r = redisClient || getRedis();
    const nowIso = new Date().toISOString();
    const who = String(actor || 'security-guard').slice(0, 48);
    await r.lpush('phuc:admin:audit', JSON.stringify({
      id: `sec-${Date.now()}`,
      admin: who,
      actor: who,
      at: nowIso,
      created_at: nowIso,
      event: String(event || 'Bảo mật hệ thống').slice(0, 80),
      detail: String(detail || '').slice(0, 260),
    }));
    await r.ltrim('phuc:admin:audit', 0, 99);
  } catch {}
}

async function getBanRecord(redisClient, username = '', visitorId = '') {
  const r = redisClient || getRedis();
  const u = normalizeUsername(username);
  if (u && isSuperAdminUsername(u)) return null;
  if (u) {
    try {
      const rawBan = await r.get(`${BANNED_USER_PREFIX}${u}`);
      if (rawBan) {
        const parsed = typeof rawBan === 'string' ? JSON.parse(rawBan) : rawBan;
        if (parsed && parsed.banned) return parsed;
      }
    } catch {}
    try {
      const members = await r.smembers(BANNED_USERS_SET);
      if (Array.isArray(members) && members.includes(u)) {
        return {
          banned: true,
          username: u,
          reason: 'Tài khoản đã bị khóa vĩnh viễn do vi phạm bảo mật hệ thống.',
          banned_at: '',
          banned_by: 'system',
        };
      }
    } catch {}
  }
  const vid = String(visitorId || '').trim();
  if (vid) {
    try {
      const vBan = await r.get(`${BANNED_VISITOR_PREFIX}${vid}`);
      if (vBan) {
        const parsed = typeof vBan === 'string' ? JSON.parse(vBan) : vBan;
        if (parsed && parsed.banned) return parsed;
      }
    } catch {}
  }
  return null;
}

async function banUserPermanently(redisClient, username, opts = {}) {
  const r = redisClient || getRedis();
  const u = normalizeUsername(username);
  if (!u || isSuperAdminUsername(u)) {
    return { ok: false, protected: true };
  }
  const nowIso = new Date().toISOString();
  const reason = String(opts.reason || 'Truy cập trái phép khu vực Quản trị (Admin Dashboard)').slice(0, 240);
  const bannedBy = String(opts.bannedBy || 'security-guard').slice(0, 48);
  const visitorId = String(opts.visitorId || '').trim().slice(0, 96);
  const ip = String(opts.ip || '').trim().slice(0, 80);

  let userObj = null;
  try {
    const raw = await r.get(`${USER_PREFIX}${u}`);
    userObj = typeof raw === 'string' ? JSON.parse(raw) : (raw && typeof raw === 'object' ? { ...raw } : null);
  } catch {}
  if (userObj) {
    userObj.banned = true;
    userObj.ban_reason = reason;
    userObj.banned_at = nowIso;
    userObj.banned_by = bannedBy;
    userObj.is_admin = false;
    if (userObj.role === 'admin') userObj.role = 'student';
    delete userObj.admin_granted_by;
    delete userObj.admin_granted_at;
    await r.set(`${USER_PREFIX}${u}`, userObj);
  }

  const banRecord = {
    banned: true,
    username: u,
    reason,
    banned_at: nowIso,
    banned_by: bannedBy,
    visitor_id: visitorId || undefined,
    ip: ip || undefined,
  };
  await r.set(`${BANNED_USER_PREFIX}${u}`, banRecord);
  await r.sadd(BANNED_USERS_SET, u);
  if (visitorId) {
    await r.set(`${BANNED_VISITOR_PREFIX}${visitorId}`, {
      banned: true,
      username: u,
      reason,
      banned_at: nowIso,
      banned_by: bannedBy,
    });
  }
  await appendSecurityAudit(r, {
    actor: bannedBy,
    event: '🚨 Ban vĩnh viễn tài khoản',
    detail: `@${u} — ${reason}${ip ? ` • IP ${ip}` : ''}${visitorId ? ` • TB ${visitorId.slice(0, 12)}` : ''}`,
  });
  return { ok: true, ban: banRecord };
}

async function unbanUserAccount(redisClient, username, opts = {}) {
  const r = redisClient || getRedis();
  const u = normalizeUsername(username);
  if (!u) return { ok: false };
  const actor = String(opts.unbannedBy || SUPER_ADMIN_USERNAME).slice(0, 48);
  let oldBan = null;
  try {
    const rawBan = await r.get(`${BANNED_USER_PREFIX}${u}`);
    oldBan = typeof rawBan === 'string' ? JSON.parse(rawBan) : rawBan;
  } catch {}
  await r.del(`${BANNED_USER_PREFIX}${u}`);
  await r.srem(BANNED_USERS_SET, u);
  if (oldBan?.visitor_id) {
    await r.del(`${BANNED_VISITOR_PREFIX}${oldBan.visitor_id}`);
  }
  await clearAdminWarnings(r, u, oldBan?.visitor_id || '');
  try {
    const raw = await r.get(`${USER_PREFIX}${u}`);
    const userObj = typeof raw === 'string' ? JSON.parse(raw) : (raw && typeof raw === 'object' ? { ...raw } : null);
    if (userObj) {
      userObj.banned = false;
      userObj.ban_reason = '';
      userObj.banned_at = '';
      userObj.admin_warnings = 0;
      userObj.last_admin_warning_at = '';
      userObj.last_admin_warning_reason = '';
      userObj.unbanned_at = new Date().toISOString();
      userObj.unbanned_by = actor;
      await r.set(`${USER_PREFIX}${u}`, userObj);
    }
  } catch {}
  await appendSecurityAudit(r, {
    actor,
    event: '✅ Gỡ Ban tài khoản',
    detail: `@${u} đã được @${actor} mở khóa quyền truy cập & reset cảnh báo`,
  });
  return { ok: true };
}

async function getAdminWarningRecord(redisClient, username = '', visitorId = '') {
  const r = redisClient || getRedis();
  const u = normalizeUsername(username);
  if (u && isSuperAdminUsername(u)) return null;
  if (u) {
    try {
      const raw = await r.get(`${WARN_USER_PREFIX}${u}`);
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && Number(parsed.count || 0) > 0) return parsed;
      }
    } catch {}
  }
  const vid = String(visitorId || '').trim();
  if (vid && !u) {
    try {
      const rawV = await r.get(`${WARN_VISITOR_PREFIX}${vid}`);
      if (rawV) {
        const parsed = typeof rawV === 'string' ? JSON.parse(rawV) : rawV;
        if (parsed && Number(parsed.count || 0) > 0) return parsed;
      }
    } catch {}
  }
  return null;
}

async function clearAdminWarnings(redisClient, username = '', visitorId = '') {
  const r = redisClient || getRedis();
  const u = normalizeUsername(username);
  const vid = String(visitorId || '').trim();
  let storedVid = '';
  if (u) {
    try {
      const rawWarn = await r.get(`${WARN_USER_PREFIX}${u}`);
      const parsedWarn = typeof rawWarn === 'string' ? JSON.parse(rawWarn) : rawWarn;
      if (parsedWarn?.visitor_id) storedVid = String(parsedWarn.visitor_id).trim();
    } catch {}
    try { await r.del(`${WARN_USER_PREFIX}${u}`); } catch {}
    try {
      const raw = await r.get(`${USER_PREFIX}${u}`);
      const userObj = typeof raw === 'string' ? JSON.parse(raw) : (raw && typeof raw === 'object' ? { ...raw } : null);
      if (userObj && (Number(userObj.admin_warnings || 0) > 0 || userObj.last_admin_warning_at)) {
        userObj.admin_warnings = 0;
        userObj.last_admin_warning_at = '';
        userObj.last_admin_warning_reason = '';
        await r.set(`${USER_PREFIX}${u}`, userObj);
      }
    } catch {}
  }
  const targetVid = vid || storedVid;
  if (targetVid) {
    try { await r.del(`${WARN_VISITOR_PREFIX}${targetVid}`); } catch {}
  }
  return { ok: true };
}

async function recordAdminViolation(redisClient, username = '', opts = {}) {
  const r = redisClient || getRedis();
  const u = normalizeUsername(username);
  if (u && isSuperAdminUsername(u)) {
    return { ok: false, protected: true, banned: false, warning: false };
  }
  const visitorId = String(opts.visitorId || '').trim().slice(0, 96);
  const ip = String(opts.ip || '').trim().slice(0, 80);
  const source = String(opts.source || 'admin-api').slice(0, 80);
  const reason = String(opts.reason || `Truy cập trái phép khu vực Quản trị (${source})`).slice(0, 220);

  const existingBan = await getBanRecord(r, u, visitorId);
  if (existingBan) {
    return {
      ok: false,
      status: 403,
      banned: true,
      already_banned: true,
      auth_revoked: true,
      warning: false,
      warning_count: 2,
      strikes_remaining: 0,
      ban_reason: existingBan.reason || 'Tài khoản đã bị khóa vĩnh viễn.',
      ban: existingBan,
      message: '🚫 TÀI KHOẢN ĐÃ BỊ BAN VĨNH VIỄN khỏi hệ thống!',
    };
  }

  let userObj = null;
  if (u) {
    try {
      const raw = await r.get(`${USER_PREFIX}${u}`);
      userObj = typeof raw === 'string' ? JSON.parse(raw) : (raw && typeof raw === 'object' ? { ...raw } : null);
    } catch {}
  }
  if (userObj?.banned) {
    return {
      ok: false,
      status: 403,
      banned: true,
      already_banned: true,
      auth_revoked: true,
      warning: false,
      warning_count: Math.max(2, Number(userObj.admin_warnings || 2)),
      strikes_remaining: 0,
      ban_reason: userObj.ban_reason || 'Tài khoản đã bị khóa vĩnh viễn.',
      message: '🚫 TÀI KHOẢN ĐÃ BỊ BAN VĨNH VIỄN khỏi hệ thống!',
    };
  }

  const warnRec = await getAdminWarningRecord(r, u, visitorId);
  const prevCount = Math.max(Number(warnRec?.count || 0), Number(userObj?.admin_warnings || 0));
  const nowIso = new Date().toISOString();

  // Lần đầu tiên: chỉ CẢNH BÁO 1 lần duy nhất, KHÔNG ban vội
  if (prevCount === 0) {
    const firstWarn = {
      count: 1,
      username: u || '',
      visitor_id: visitorId || '',
      ip: ip || '',
      last_source: source,
      reason,
      first_at: nowIso,
      last_at: nowIso,
    };
    if (u) {
      await r.set(`${WARN_USER_PREFIX}${u}`, firstWarn);
      if (userObj) {
        userObj.admin_warnings = 1;
        userObj.last_admin_warning_at = nowIso;
        userObj.last_admin_warning_reason = reason;
        await r.set(`${USER_PREFIX}${u}`, userObj);
      }
    } else if (visitorId) {
      await r.set(`${WARN_VISITOR_PREFIX}${visitorId}`, firstWarn);
    }
    await appendSecurityAudit(r, {
      actor: 'security-guard',
      event: '⚠️ Cảnh báo lần 1 (Xâm nhập Admin)',
      detail: `${u ? `@${u}` : `Thiết bị ${visitorId.slice(0, 8)}`} — ${reason}. Đã cảnh báo lần 1/1 (tái phạm lần sau sẽ BAN vĩnh viễn).`,
    });
    return {
      ok: false,
      status: 403,
      banned: false,
      auth_revoked: false,
      warning: true,
      warning_count: 1,
      max_warnings: 1,
      strikes_remaining: 1,
      warning_title: '⚠️ CẢNH BÁO BẢO MẬT — LẦN DUY NHẤT (1/1)',
      message: 'Phát hiện thao tác mở/can thiệp khu vực Admin dù tài khoản không có quyền Quản trị! Hệ thống chỉ CẢNH BÁO 1 LẦN DUY NHẤT (chưa khóa tài khoản). Nếu tái phạm thêm 1 lần nữa, tài khoản & thiết bị sẽ bị BAN VĨNH VIỄN ngay lập tức!',
    };
  }

  // Từ lần thứ 2 trở đi: BAN VĨNH VIỄN
  const nextCount = prevCount + 1;
  if (u) {
    if (userObj) {
      userObj.admin_warnings = nextCount;
      userObj.last_admin_warning_at = nowIso;
      userObj.last_admin_warning_reason = reason;
      await r.set(`${USER_PREFIX}${u}`, userObj);
    }
    await r.set(`${WARN_USER_PREFIX}${u}`, {
      count: nextCount,
      username: u,
      visitor_id: visitorId || warnRec?.visitor_id || '',
      ip: ip || warnRec?.ip || '',
      last_source: source,
      reason,
      first_at: warnRec?.first_at || nowIso,
      last_at: nowIso,
    });
    const banRes = await banUserPermanently(r, u, {
      reason: `Tái phạm xâm nhập Admin sau khi đã bị cảnh báo (Lần ${nextCount}): ${reason}`,
      bannedBy: 'security-guard',
      visitorId,
      ip,
    });
    return {
      ok: false,
      status: 403,
      banned: true,
      auth_revoked: true,
      warning: false,
      warning_count: nextCount,
      strikes_remaining: 0,
      ban_reason: banRes?.ban?.reason || reason,
      ban: banRes?.ban || null,
      message: '🚫 TÀI KHOẢN ĐÃ BỊ BAN VĨNH VIỄN: Bạn đã cố tình tái phạm truy cập trái phép khu vực Quản trị sau lần cảnh báo duy nhất!',
    };
  }

  // Trường hợp khách (chưa đăng nhập) cố spam/tái phạm với visitorId
  return {
    ok: false,
    status: 401,
    banned: false,
    warning: true,
    warning_count: 1,
    strikes_remaining: 1,
    message: 'Khu vực Admin chỉ dành cho tài khoản Super Admin @phucadmin.',
  };
}

async function rejectIfBanned(redisClient, req, res, username = '') {
  const r = redisClient || getRedis();
  const u = normalizeUsername(username);
  if (u && isSuperAdminUsername(u)) return null;
  const visitorId = getRequestVisitorId(req);
  const banRec = await getBanRecord(r, u, visitorId);
  let userBannedRec = null;
  if (!banRec && u) {
    try {
      const raw = await r.get(`${USER_PREFIX}${u}`);
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (parsed && parsed.banned) {
        userBannedRec = {
          banned: true,
          username: u,
          reason: parsed.ban_reason || 'Tài khoản đã bị khóa vĩnh viễn.',
          banned_at: parsed.banned_at || '',
          banned_by: parsed.banned_by || 'system',
        };
      }
    } catch {}
  }
  const activeBan = banRec || userBannedRec;
  if (!activeBan) return null;
  await revokeRequestSession(req, res, r);
  return activeBan;
}

async function requireAdminOrBanIntruder(redisClient, req, res, session, opts = {}) {
  const r = redisClient || getRedis();
  const source = String(opts.source || 'admin-api');
  const autoBan = opts.autoBan !== false;
  if (!session || !session.username) {
    return {
      ok: false,
      status: 401,
      banned: false,
      message: 'Chỉ tài khoản Super Admin @phucadmin mới có quyền truy cập khu vực quản trị.',
    };
  }
  const uName = normalizeUsername(session.username);
  let user = null;
  try {
    const raw = await r.get(`${USER_PREFIX}${uName}`);
    user = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {}
  if (!user && isSuperAdminUsername(uName)) {
    return {
      ok: true,
      user: { username: SUPER_ADMIN_USERNAME, role: 'admin', is_admin: true, is_super_admin: true },
      isSuperAdmin: true,
    };
  }
  const priorBan = await getBanRecord(r, uName, '');
  if (user && !priorBan && isAdminAccount(user)) {
    return {
      ok: true,
      user,
      isSuperAdmin: isSuperAdminAccount(user),
    };
  }
  if (priorBan) {
    await revokeRequestSession(req, res, r);
    return {
      ok: false,
      status: 403,
      banned: true,
      auth_revoked: true,
      warning: false,
      warning_count: 2,
      strikes_remaining: 0,
      ban_reason: priorBan.reason || 'Tài khoản đã bị khóa vĩnh viễn.',
      message: '🚫 Tài khoản của bạn đã bị khóa vĩnh viễn khỏi hệ thống!',
    };
  }
  if (autoBan && !isSuperAdminUsername(uName)) {
    const viol = await recordAdminViolation(r, uName, {
      reason: `Truy cập trái phép khu vực Quản trị (${source})`,
      source,
      visitorId: getRequestVisitorId(req),
      ip: getClientIp(req),
    });
    if (viol.banned) {
      await revokeRequestSession(req, res, r);
    }
    return viol;
  }
  return {
    ok: false,
    status: 403,
    banned: false,
    auth_revoked: false,
    warning: false,
    message: 'Chỉ tài khoản Super Admin @phucadmin mới có quyền truy cập khu vực quản trị.',
  };
}

function sendAdminGuardError(res, guard, extra = {}) {
  return sendJson(res, guard?.status || 403, {
    ok: false,
    banned: Boolean(guard?.banned),
    auth_revoked: Boolean(guard?.auth_revoked),
    warning: Boolean(guard?.warning),
    warning_count: Number(guard?.warning_count || 0),
    strikes_remaining: Number(guard?.strikes_remaining ?? 0),
    warning_title: guard?.warning_title || '',
    ban_reason: guard?.ban_reason || '',
    message: guard?.message || 'Chỉ tài khoản Super Admin @phucadmin mới có quyền truy cập khu vực quản trị.',
    ...extra,
  });
}

function validUsername(username) {
  return /^[a-zA-Z0-9._-]{3,40}$/.test(username);
}

function hashPassword(password, saltHex = null) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(password), salt, 64);
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

function verifyPassword(password, record) {
  try {
    const salt = Buffer.from(record.salt, 'hex');
    const expected = Buffer.from(record.password_hash, 'hex');
    const actual = crypto.scryptSync(String(password), salt, expected.length);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function safeUser(user) {
  if (!user) return null;
  const copy = { ...user };
  const hasRecovery = Boolean(copy.recovery_hash && copy.recovery_salt);
  delete copy.password_hash;
  delete copy.salt;
  delete copy.recovery_hash;
  delete copy.recovery_salt;
  copy.has_recovery = hasRecovery;
  const adminFlag = isAdminAccount(copy);
  const superFlag = isSuperAdminAccount(copy);
  copy.is_admin = adminFlag;
  copy.is_super_admin = superFlag;
  if (!adminFlag && copy.role === 'admin') {
    copy.role = 'student';
  }
  copy.banned = Boolean(copy.banned);
  copy.ban_reason = copy.banned ? String(copy.ban_reason || '') : '';
  copy.banned_at = copy.banned ? String(copy.banned_at || '') : '';
  copy.admin_warnings = Math.max(0, Number(copy.admin_warnings || 0));
  copy.last_admin_warning_at = String(copy.last_admin_warning_at || '');
  copy.rpg = buildPublicRpgSnapshot(copy);
  return copy;
}

async function createSession(res, username, csrfFromClient = '') {
  const redis = getRedis();
  const token = crypto.randomBytes(32).toString('hex');
  const csrf = csrfFromClient || crypto.randomBytes(24).toString('hex');
  const session = { username, csrf, created_at: new Date().toISOString() };
  await redis.set(`${SESSION_PREFIX}${token}`, session, { ex: SESSION_TTL });
  setCookie(res, SESSION_COOKIE, token, { httpOnly: true, maxAge: SESSION_TTL });
  setCookie(res, CSRF_COOKIE, csrf, { httpOnly: false, maxAge: SESSION_TTL });
  return { token, csrf };
}

async function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  const redis = getRedis();
  let session = await redis.get(`${SESSION_PREFIX}${token}`);
  if (!session) return null;
  if (typeof session === 'string') {
    try { session = JSON.parse(session); } catch { return null; }
  }
  if (!session?.username) return null;
  return { token, ...session };
}

async function getCsrf(req, res) {
  const cookies = parseCookies(req);
  if (cookies[CSRF_COOKIE]) return cookies[CSRF_COOKIE];
  const csrf = crypto.randomBytes(24).toString('hex');
  setCookie(res, CSRF_COOKIE, csrf, { httpOnly: false, maxAge: SESSION_TTL });
  return csrf;
}

function requireCsrf(req, sessionOrNull, allowAnonymousCsrf) {
  const header = String(req.headers?.['x-csrf-token'] || '');
  const cookies = parseCookies(req);
  const expected = sessionOrNull?.csrf || cookies[CSRF_COOKIE] || allowAnonymousCsrf || '';
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function getUserByUsername(username) {
  const redis = getRedis();
  let user = await redis.get(`${USER_PREFIX}${normalizeUsername(username)}`);
  if (typeof user === 'string') {
    try { user = JSON.parse(user); } catch { return null; }
  }
  return user || null;
}

module.exports = {
  SESSION_TTL,
  SESSION_COOKIE,
  CSRF_COOKIE,
  USER_PREFIX,
  SESSION_PREFIX,
  SUPER_ADMIN_USERNAME,
  BANNED_USERS_SET,
  BANNED_USER_PREFIX,
  BANNED_VISITOR_PREFIX,
  WARN_USER_PREFIX,
  WARN_VISITOR_PREFIX,
  parseCookies,
  setCookie,
  clearCookie,
  clearAuthCookies,
  revokeRequestSession,
  sendJson,
  sendAdminGuardError,
  normalizeUsername,
  getClientIp,
  getRequestVisitorId,
  validUsername,
  hashPassword,
  verifyPassword,
  safeUser,
  createSession,
  getSession,
  getCsrf,
  requireCsrf,
  getUserByUsername,
  isSuperAdminUsername,
  isSuperAdminAccount,
  isReservedAdminUsername,
  isAdminUsername,
  isAdminAccount,
  appendSecurityAudit,
  getBanRecord,
  banUserPermanently,
  unbanUserAccount,
  getAdminWarningRecord,
  clearAdminWarnings,
  recordAdminViolation,
  rejectIfBanned,
  requireAdminOrBanIntruder
};
