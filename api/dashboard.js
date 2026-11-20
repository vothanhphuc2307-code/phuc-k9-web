const { getRedis } = require('../lib/redis');
const {
  USER_PREFIX, SUPER_ADMIN_USERNAME, BANNED_USERS_SET,
  getSession, getCsrf, requireCsrf, sendJson, sendAdminGuardError, parseCookies, setCookie,
  hashPassword, verifyPassword, safeUser, normalizeUsername,
  isSuperAdminUsername, isSuperAdminAccount,
  isAdminUsername, isAdminAccount,
  getBanRecord, banUserPermanently, unbanUserAccount, clearAdminWarnings, recordAdminViolation,
  rejectIfBanned, requireAdminOrBanIntruder, getClientIp, getRequestVisitorId
} = require('../lib/auth');
const crypto = require('crypto');
const {
  bxhEngine,
  CATALOG,
  RANK_TIERS,
  vnWeekKey: rpgWeekKey,
  ensureUserRpgState,
  buildPublicRpgSnapshot,
  applyRewardMultipliers,
  performCheckin,
  claimDailyMission,
  buyCatalogItem,
  redeemShopShards,
  equipCatalogItem,
  convertCurrency,
  recordSrsAnswer,
  resolveWrongQuestion,
  toggleExamBookmark,
  openPeriodicCell
} = require('../lib/rpg');
const arena = require('../lib/arena');

const GUEST_USERNAMES = new Set(['guest', 'khach', 'khách', 'anonymous', 'k9-guest', 'khach_k9']);
function isGuestUsername(name) {
  const n = normalizeUsername(name);
  return !n || GUEST_USERNAMES.has(n);
}

async function loadJourneyLeaders(redis, grade = '2K9') {
  const wk = rpgWeekKey();
  const safeGrade = ['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(String(grade || '').toUpperCase())
    ? String(grade).toUpperCase()
    : '2K9';
  try {
    const [raw, bannedRaw] = await Promise.all([
      redis.zrange(`phuc:rpg:journey_week:${wk}:${safeGrade}`, 0, 14, { rev: true, withScores: true }).catch(() => []),
      redis.smembers(BANNED_USERS_SET).catch(() => [])
    ]);
    const bannedSet = new Set((bannedRaw || []).map(x => normalizeUsername(x)).filter(Boolean));
    const pairs = parseZrangePairs(raw);
    const out = [];
    for (const pair of pairs) {
      const uname = normalizeUsername(pair.name || '');
      const score = Number(pair.count || 0);
      if (!uname || isAdminUsername(uname) || isGuestUsername(uname) || bannedSet.has(uname)) continue;
      let meta = await redis.get(`phuc:rpg:journey_meta:${uname}`).catch(() => null);
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch { meta = null; }
      }
      // Safe-by-Default R2: Mặc định TẮT/ẨN ghim cá nhân trên bản đồ vùng cho 2K12 (hoặc học viên tắt show_island_flag_pin / bật anonymous_bxh)
      const hidePin = safeGrade === '2K12'
        ? (meta?.show_island_flag_pin !== true)
        : (meta?.show_island_flag_pin === false || Boolean(meta?.anonymous_bxh));
      const pubSbd = meta?.public_sbd || meta?.sbd || '';
      const safePinSbd = hidePin ? (meta?.anonymous_bxh ? pubSbd : '') : pubSbd;
      out.push({
        rank: out.length + 1,
        username: hidePin ? '' : uname,
        sbd: safePinSbd,
        hide_pin_identity: hidePin,
        display_name: hidePin ? (meta?.anonymous_bxh && pubSbd ? `Học viên #${pubSbd}` : `Học viên ẩn ghim (${safeGrade} Safe)`) : (meta?.display_name || uname),
        grade: meta?.grade || safeGrade,
        outfit_icon: hidePin ? '🛡️' : (meta?.outfit_icon || '🧑‍🎓'),
        outfit_id: hidePin ? 'outfit-scholar' : (meta?.outfit_id || 'outfit-scholar'),
        frame_class: meta?.frame_class || 'pk9-frame-bronze',
        aura_class: meta?.aura_class || 'pk9-aura-spark',
        best_score: score,
        islands_cleared: Number(meta?.islands_cleared || 0),
        stars_total: Number(meta?.stars_total || 0),
        has_flag: out.length === 0
      });
    }
    return { week_key: wk, grade: safeGrade, leaders: out };
  } catch {
    return { week_key: wk, grade: safeGrade, leaders: [] };
  }
}

const ATTEMPTS_KEY = 'phuc:exam-attempts';
const MAX_ATTEMPTS = 5000;

async function isSessionAdmin(redis, session) {
  if (!session?.username) return false;
  const uName = normalizeUsername(session.username);
  try {
    const u = await redis.get(`${USER_PREFIX}${uName}`);
    const obj = typeof u === 'string' ? JSON.parse(u) : u;
    if (!obj && isSuperAdminUsername(uName)) return true;
    return Boolean(obj && !obj.banned && isAdminAccount(obj));
  } catch {
    return isSuperAdminUsername(uName);
  }
}
function clean(s, max = 140) {
  return String(s || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}
function gradeLabel(subject, fallback = '2K9') {
  const s = String(subject || '');
  if (s.startsWith('k11') || s.includes('2K11')) return '2K11';
  if (s.startsWith('g10') || s.includes('2K12')) return '2K12';
  return fallback || '2K9';
}
function normScore(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.max(0, Math.min(10, Math.round(x * 100) / 100)) : 0;
}
function levelInfo(xp) {
  const total = Math.max(0, Number(xp || 0));
  const level = Math.floor(total / 100) + 1;
  return { level, into: total % 100, next: 100, percent: Math.min(100, total % 100) };
}
function examXp(score) {
  const s = normScore(score);
  let bonus = 0;
  if (s >= 9.5) bonus = 80;
  else if (s >= 9) bonus = 60;
  else if (s >= 8) bonus = 45;
  else if (s >= 7) bonus = 30;
  else if (s >= 5) bonus = 15;
  return 60 + bonus;
}
function computeBadges(user, stats) {
  const set = new Set(Array.isArray(user?.badges) ? user.badges : []);
  set.add('Thành Viên K9');
  const xp = Number(user?.xp || 0);
  const best = Number(stats?.bestScore || 0);
  const attempts = Number(stats?.attempts || 0);
  const streak = Number(user?.streak || 1);
  if (best >= 9.0) set.add('Thợ Săn 9+');
  if (best >= 9.5) set.add('Thủ Khoa Luyện Đề');
  if (attempts >= 5) set.add('Chiến Thần Luyện Đề');
  if (streak >= 7) set.add('Chuỗi 7 Ngày Lửa');
  if (xp >= 1000) set.add('Học Bá K9');
  return Array.from(set).slice(0, 6);
}
async function getUser(redis, username) {
  try {
    return safeParseObj(await redis.get(`${USER_PREFIX}${normalizeUsername(username)}`));
  } catch {
    return null;
  }
}
function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function vnDayKey(d = new Date()) {
  const x = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${String(x.getUTCDate()).padStart(2, '0')}`;
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
function isWithinCurrentWeek(isoStr, now = new Date()) {
  if (!isoStr) return false;
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return false;
  return vnWeekKey(d) === vnWeekKey(now);
}
function visitorCookieOptions(req, maxAge = 60 * 60 * 24 * 365) {
  const isHttps = Boolean(
    process.env.VERCEL
    || String(req?.headers?.['x-forwarded-proto'] || '').includes('https')
  );
  return { httpOnly: false, maxAge, sameSite: 'lax', secure: isHttps, path: '/' };
}
function validVisitorId(v) {
  const s = String(v || '').trim();
  return /^[a-f0-9-]{20,80}$/i.test(s) || /^v_[a-z0-9_-]{8,60}$/i.test(s);
}
function safeParseObj(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(String(val)); } catch { return null; }
}
function parseZrangePairs(raw) {
  if (!Array.isArray(raw) || !raw.length) return [];
  const out = [];
  if (typeof raw[0] === 'object' && raw[0] !== null && 'member' in raw[0]) {
    for (const item of raw) {
      out.push({ name: String(item.member || ''), count: Number(item.score || 0) });
    }
  } else {
    for (let i = 0; i < raw.length; i += 2) {
      const name = String(raw[i] ?? '');
      const count = Number(raw[i + 1] ?? 0);
      if (name) out.push({ name, count });
    }
  }
  return out;
}
function parseClientAgent(req, body = {}) {
  const ua = String(req?.headers?.['user-agent'] || '');
  const isBot = /(bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptimerobot|vercel-screenshot|facebookexternalhit|facebot|twitterbot|telegrambot|discordbot|curl\/|wget\/|python-requests|go-http-client)/i.test(ua);
  const mobileHint = Boolean(body?.mobile);
  const platformHint = String(body?.platform_hint || '');
  const touchPoints = Number(body?.touch_points || 0);
  const screenStr = clean(body?.screen || '', 24);
  const screenWidth = Number((screenStr.split('x')[0]) || 0);
  const pwa = Boolean(body?.pwa);

  let device_type = 'desktop';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    device_type = 'tablet';
  } else if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry/i.test(ua) || mobileHint || (platformHint === 'MacIntel' && touchPoints > 1 && screenWidth > 0 && screenWidth <= 1024)) {
    device_type = 'mobile';
  }

  let os = 'Khác';
  if (/iPhone|iPad|iPod/i.test(ua) || (platformHint === 'MacIntel' && touchPoints > 1)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux|X11|CrOS/i.test(ua)) os = 'Linux';

  let browser = 'Khác';
  if (pwa) browser = 'PWA App';
  else if (/Zalo/i.test(ua)) browser = 'Zalo';
  else if (/Barcelona|Threads|Instagram/i.test(ua)) browser = 'Threads / IG';
  else if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) browser = 'Facebook / Messenger';
  else if (/TikTok|BytedanceWebview|Musical_ly/i.test(ua)) browser = 'TikTok';
  else if (/coc_coc_browser/i.test(ua)) browser = 'Cốc Cốc';
  else if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/SamsungBrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';

  const rawRef = clean(body?.ref || '', 240);
  let refHost = 'direct';
  if (rawRef && /^https?:\/\//i.test(rawRef)) {
    try {
      const u = new URL(rawRef);
      const reqHost = String(req?.headers?.host || '').split(':')[0].toLowerCase();
      const h = u.hostname.replace(/^www\./i, '').toLowerCase();
      if (h && h !== reqHost) refHost = h;
    } catch {}
  } else if (rawRef && !rawRef.includes('/')) {
    refHost = rawRef;
  }

  const country = clean(req?.headers?.['x-vercel-ip-country'] || '', 12) || 'VN';
  let city = '';
  try {
    city = clean(decodeURIComponent(String(req?.headers?.['x-vercel-ip-city'] || '')), 60);
  } catch {
    city = clean(req?.headers?.['x-vercel-ip-city'] || '', 60);
  }

  return { isBot, device_type, os, browser, pwa, screen: screenStr, refHost, country, city };
}

async function scanKeys(redis, matchPattern, cap = 600) {
  const keys = [];
  let cursor = 0;
  const seenCursors = new Set();
  try {
    do {
      seenCursors.add(String(cursor));
      const scan = await redis.scan(cursor, { match: matchPattern, count: 150 });
      cursor = scan?.[0] ?? '0';
      const batch = Array.isArray(scan?.[1]) ? scan[1] : [];
      for (const k of batch) {
        keys.push(k);
        if (keys.length >= cap) return keys;
      }
    } while (String(cursor) !== '0' && !seenCursors.has(String(cursor)));
  } catch {}
  return keys;
}

async function collectOnlineSessions(redis) {
  const keys = await scanKeys(redis, 'phuc:visitors:online:*', 400);
  if (!keys.length) return [];
  const rawList = await Promise.all(keys.map(k => redis.get(k).catch(() => null)));
  const nowMs = Date.now();
  const out = [];
  for (let i = 0; i < keys.length; i++) {
    const obj = safeParseObj(rawList[i]);
    if (obj && Number(obj.ts || 0) > nowMs - 130 * 1000) {
      out.push(obj);
    } else if (rawList[i] && !obj) {
      out.push({
        vid_short: String(keys[i]).split(':').pop().slice(0, 8),
        device_type: 'desktop',
        os: 'Khác',
        browser: 'Khác',
        active_tab: 'home',
        ts: Number(rawList[i]) || nowMs
      });
    }
  }
  return out.sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0));
}

async function trackVisitor(req, res, redis, session = null) {
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  const agent = parseClientAgent(req, body);
  if (agent.isBot) {
    return { ignored: true, reason: 'bot' };
  }

  const cookies = parseCookies(req);
  const cookieVid = String(cookies.phuc_visitor || '').trim();
  const bodyVid = String(body?.visitor_id || '').trim();
  let vid = validVisitorId(cookieVid) ? cookieVid : (validVisitorId(bodyVid) ? bodyVid : '');
  if (!vid) {
    vid = crypto.randomUUID();
  }
  if (cookieVid !== vid) {
    setCookie(res, 'phuc_visitor', vid, visitorCookieOptions(req));
  }

  const rawIp = String(req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '0.0.0.0').split(',')[0].trim();
  const fpSource = session?.username
    ? `user:${session.username}`
    : `${rawIp}|${agent.os}|${agent.device_type}|${agent.screen || 'na'}`;
  const fpId = crypto.createHash('sha256').update(fpSource).digest('hex').slice(0, 24);

  const day = vnDayKey();
  const month = day.slice(0, 7);
  const nowIso = new Date().toISOString();
  const rawEv = String(body?.event || 'pageview').toLowerCase();
  const event = rawEv === 'heartbeat' ? 'heartbeat' : rawEv === 'tab' ? 'tab' : 'pageview';
  const requestedTab = clean(body?.tab || 'home', 40) || 'home';
  const pathName = clean(body?.path || '/', 220) || '/';
  const sessionId = clean(body?.session_id || '', 64);

  let activeTab = requestedTab;
  let banDetected = null;
  let warnDetected = null;
  if (session?.username) {
    const existingBan = await getBanRecord(redis, session.username, '');
    if (existingBan) {
      banDetected = existingBan;
      activeTab = 'blocked';
    } else if (requestedTab === 'admin' || pathName.includes('admin')) {
      const adminOk = await isSessionAdmin(redis, session);
      if (!adminOk && !isSuperAdminUsername(session.username)) {
        activeTab = 'home';
        const viol = await recordAdminViolation(redis, session.username, {
          reason: 'Xâm nhập trái phép khu vực Quản trị (Admin Pro)',
          visitorId: vid,
          ip: rawIp,
          source: 'track-visitor:admin'
        });
        if (viol.banned) {
          banDetected = viol;
          activeTab = 'blocked';
        } else if (viol.warning) {
          warnDetected = viol;
        }
      }
    }
  } else if (requestedTab === 'admin') {
    activeTab = 'home';
  }
  if (banDetected) {
    try { await redis.del(`phuc:visitors:online:${vid}`); } catch {}
    return { vid, agent, banned: true, ban_reason: banDetected.ban_reason || banDetected.reason || 'Tài khoản bị khóa vĩnh viễn.' };
  }
  if (warnDetected) {
    return {
      vid,
      agent,
      banned: false,
      warning: true,
      warning_count: Number(warnDetected.warning_count || 1),
      strikes_remaining: Number(warnDetected.strikes_remaining ?? 1),
      warning_title: warnDetected.warning_title || '',
      message: warnDetected.message || 'Cảnh báo truy cập Admin trái phép.'
    };
  }

  try {
    await redis.sadd('phuc:visitors:all', vid);
    await redis.sadd(`phuc:visitors:day:${day}`, vid);
    await redis.expire?.(`phuc:visitors:day:${day}`, 60 * 60 * 24 * 120);
    await redis.sadd(`phuc:visitors:month:${month}`, vid);
    await redis.expire?.(`phuc:visitors:month:${month}`, 60 * 60 * 24 * 400);

    await redis.sadd('phuc:visitors:fp:all', fpId);
    await redis.sadd(`phuc:visitors:fp:day:${day}`, fpId);
    await redis.expire?.(`phuc:visitors:fp:day:${day}`, 60 * 60 * 24 * 120);

    await redis.sadd(`phuc:visitors:devall:${agent.device_type}`, vid);
    await redis.sadd(`phuc:visitors:devday:${day}:${agent.device_type}`, vid);
    await redis.expire?.(`phuc:visitors:devday:${day}:${agent.device_type}`, 60 * 60 * 24 * 120);
    await redis.sadd(`phuc:visitors:osall:${agent.os}`, vid);
    await redis.sadd(`phuc:visitors:browserall:${agent.browser}`, vid);
    if (agent.pwa) await redis.sadd('phuc:visitors:pwa', vid);

    if (sessionId.length >= 8 && event !== 'heartbeat') {
      await redis.sadd(`phuc:sessions:day:${day}`, sessionId);
      await redis.expire?.(`phuc:sessions:day:${day}`, 60 * 60 * 24 * 120);
    }

    if (event === 'pageview' || event === 'tab') {
      try { await redis.incr('phuc:pageviews:all'); } catch {}
      try { await redis.incr(`phuc:pageviews:day:${day}`); } catch {}
      try { await redis.expire?.(`phuc:pageviews:day:${day}`, 60 * 60 * 24 * 120); } catch {}
      try { await redis.zincrby('phuc:analytics:tab:all', 1, activeTab); } catch {}
      try { await redis.zincrby(`phuc:analytics:tab:${day}`, 1, activeTab); } catch {}
      try { await redis.zincrby(`phuc:analytics:path:${day}`, 1, pathName); } catch {}
      try { await redis.expire?.(`phuc:analytics:tab:${day}`, 60 * 60 * 24 * 120); } catch {}
      try { await redis.expire?.(`phuc:analytics:path:${day}`, 60 * 60 * 24 * 120); } catch {}
    }

    if (event === 'pageview') {
      try { await redis.zincrby('phuc:analytics:ref:all', 1, agent.refHost); } catch {}
      try { await redis.zincrby(`phuc:analytics:ref:${day}`, 1, agent.refHost); } catch {}
      try { await redis.zincrby(`phuc:analytics:device:${day}`, 1, agent.device_type); } catch {}
      try { await redis.zincrby(`phuc:analytics:os:${day}`, 1, agent.os); } catch {}
      try { await redis.zincrby(`phuc:analytics:browser:${day}`, 1, agent.browser); } catch {}
      try { await redis.expire?.(`phuc:analytics:ref:${day}`, 60 * 60 * 24 * 120); } catch {}
      try { await redis.expire?.(`phuc:analytics:device:${day}`, 60 * 60 * 24 * 120); } catch {}
      try { await redis.expire?.(`phuc:analytics:os:${day}`, 60 * 60 * 24 * 120); } catch {}
      try { await redis.expire?.(`phuc:analytics:browser:${day}`, 60 * 60 * 24 * 120); } catch {}
    }

    const metaKey = `phuc:visitors:meta:${vid}`;
    const prevMeta = safeParseObj(await redis.get(metaKey).catch(() => null)) || {};
    const updatedMeta = {
      vid_short: vid.slice(0, 8),
      device_type: agent.device_type,
      os: agent.os,
      browser: agent.browser,
      screen: agent.screen || prevMeta.screen || '',
      pwa: agent.pwa || Boolean(prevMeta.pwa),
      country: agent.country || prevMeta.country || 'VN',
      city: agent.city || prevMeta.city || '',
      username: session?.username || prevMeta.username || null,
      active_tab: activeTab,
      last_ref: agent.refHost !== 'direct' ? agent.refHost : (prevMeta.last_ref || 'direct'),
      visits: Number(prevMeta.visits || 0) + (event === 'pageview' ? 1 : 0),
      pageviews: Number(prevMeta.pageviews || 0) + (event === 'heartbeat' ? 0 : 1),
      first_seen: prevMeta.first_seen || nowIso,
      last_seen: nowIso
    };
    try { await redis.set(metaKey, updatedMeta, { ex: 60 * 60 * 24 * 180 }); } catch {}

    if (event === 'pageview') {
      try {
        await redis.lpush('phuc:visitors:recent_ids', vid);
        await redis.ltrim('phuc:visitors:recent_ids', 0, 299);
      } catch {}
    }

    const onlinePayload = {
      vid_short: vid.slice(0, 8),
      device_type: agent.device_type,
      os: agent.os,
      browser: agent.browser,
      screen: agent.screen || '',
      pwa: agent.pwa,
      active_tab: activeTab,
      username: session?.username || null,
      country: agent.country || 'VN',
      ts: Date.now()
    };
    try { await redis.set(`phuc:visitors:online:${vid}`, onlinePayload, { ex: 120 }); } catch {}
  } catch (e) {
    console.error('visitor-track', e);
  }
  return { vid, agent };
}

async function uniqueWindow(redis, days, keyPrefix = 'phuc:visitors:day:') {
  const ids = new Set();
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = `${keyPrefix}${vnDayKey(d)}`;
    try {
      const vals = await redis.smembers(key);
      if (Array.isArray(vals)) for (const v of vals) ids.add(String(v));
    } catch {
      break;
    }
  }
  return ids.size;
}

async function collectTrafficSnapshot(redis, { detailed = false } = {}) {
  const nowDay = vnDayKey();
  const safeScard = k => redis.scard(k).then(v => Number(v) || 0).catch(() => 0);
  const safeGetNum = k => redis.get(k).then(v => Number(v) || 0).catch(() => 0);

  const [
    visitorsAll, visitorsToday, visitors7d, visitors30d,
    pageviewsAll, pageviewsToday,
    estimatedPeople, estimatedPeopleToday, sessionsToday,
    devMobileAll, devTabletAll, devDesktopAll, pwaAll,
    devMobileToday, devTabletToday, devDesktopToday,
    onlineSessions
  ] = await Promise.all([
    safeScard('phuc:visitors:all'),
    safeScard(`phuc:visitors:day:${nowDay}`),
    uniqueWindow(redis, 7),
    uniqueWindow(redis, 30),
    safeGetNum('phuc:pageviews:all'),
    safeGetNum(`phuc:pageviews:day:${nowDay}`),
    safeScard('phuc:visitors:fp:all'),
    safeScard(`phuc:visitors:fp:day:${nowDay}`),
    safeScard(`phuc:sessions:day:${nowDay}`),
    safeScard('phuc:visitors:devall:mobile'),
    safeScard('phuc:visitors:devall:tablet'),
    safeScard('phuc:visitors:devall:desktop'),
    safeScard('phuc:visitors:pwa'),
    safeScard(`phuc:visitors:devday:${nowDay}:mobile`),
    safeScard(`phuc:visitors:devday:${nowDay}:tablet`),
    safeScard(`phuc:visitors:devday:${nowDay}:desktop`),
    collectOnlineSessions(redis)
  ]);

  let returningToday = 0, newToday = 0;
  try {
    const todayIds = new Set((await redis.smembers(`phuc:visitors:day:${nowDay}`) || []).map(String));
    if (todayIds.size > 0) {
      const olderSets = await Promise.all(
        Array.from({ length: 60 }, (_, idx) => {
          const d = new Date(Date.now() - (idx + 1) * 86400000);
          return redis.smembers(`phuc:visitors:day:${vnDayKey(d)}`).catch(() => []);
        })
      );
      const older = new Set();
      for (const vals of olderSets) {
        if (Array.isArray(vals)) for (const v of vals) older.add(String(v));
      }
      for (const id of todayIds) {
        if (older.has(id)) returningToday++; else newToday++;
      }
    }
  } catch {}
  const returnRate = visitorsToday ? Math.round((returningToday / visitorsToday) * 100) : 0;

  const onlineByDevice = { mobile: 0, tablet: 0, desktop: 0 };
  for (const s of onlineSessions) {
    const dt = s?.device_type === 'tablet' ? 'tablet' : s?.device_type === 'mobile' ? 'mobile' : 'desktop';
    onlineByDevice[dt]++;
  }

  const out = {
    visitorsAll,
    visitorsToday,
    visitors7d,
    visitors30d,
    pageviewsAll,
    pageviewsToday,
    estimatedPeople: estimatedPeople || visitorsAll,
    estimatedPeopleToday: estimatedPeopleToday || visitorsToday,
    sessionsToday,
    returningToday,
    newToday,
    returnRate,
    online: onlineSessions.length,
    onlineByDevice,
    onlineSessions: detailed ? onlineSessions.slice(0, 60) : [],
    devices: {
      mobile: devMobileAll,
      tablet: devTabletAll,
      desktop: devDesktopAll,
      pwa: pwaAll
    },
    devicesToday: {
      mobile: devMobileToday,
      tablet: devTabletToday,
      desktop: devDesktopToday
    }
  };

  if (!detailed) return out;

  async function countSetPrefix(prefix) {
    const keys = await scanKeys(redis, `${prefix}*`, 50);
    if (!keys.length) return [];
    const counts = await Promise.all(keys.map(k => safeScard(k)));
    return keys
      .map((k, idx) => ({ name: k.slice(prefix.length), count: counts[idx] }))
      .filter(x => x.name && x.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  const [osBreakdown, browserBreakdown, rawTabs, rawRefs, recentRawIds] = await Promise.all([
    countSetPrefix('phuc:visitors:osall:'),
    countSetPrefix('phuc:visitors:browserall:'),
    redis.zrange('phuc:analytics:tab:all', 0, 14, { rev: true, withScores: true }).catch(() => []),
    redis.zrange('phuc:analytics:ref:all', 0, 14, { rev: true, withScores: true }).catch(() => []),
    redis.lrange('phuc:visitors:recent_ids', 0, 140).catch(() => [])
  ]);

  const seenRecent = new Set();
  const uniqueRecentIds = [];
  for (const rawId of (recentRawIds || [])) {
    const id = String(rawId || '').trim();
    if (!id || seenRecent.has(id)) continue;
    seenRecent.add(id);
    uniqueRecentIds.push(id);
    if (uniqueRecentIds.length >= 40) break;
  }

  let recentDevices = [];
  if (uniqueRecentIds.length) {
    const metas = await Promise.all(uniqueRecentIds.map(id => redis.get(`phuc:visitors:meta:${id}`).catch(() => null)));
    recentDevices = metas.map(m => safeParseObj(m)).filter(Boolean);
  }

  return {
    ...out,
    osBreakdown,
    browserBreakdown,
    topTabs: parseZrangePairs(rawTabs),
    topReferrers: parseZrangePairs(rawRefs),
    recentDevices
  };
}

async function listAttempts(redis) {
  let raw = [];
  for (const cap of [MAX_ATTEMPTS - 1, 999, 299]) {
    try {
      raw = await redis.lrange(ATTEMPTS_KEY, 0, cap);
      break;
    } catch {
      raw = [];
    }
  }
  return (raw || []).map(safeParseObj).filter(Boolean);
}

async function collectAllUsers(redis, extraUsernames = []) {
  const map = new Map();
  const keys = await scanKeys(redis, `${USER_PREFIX}*`, 1500);
  if (keys.length) {
    const vals = await Promise.all(keys.map(k => redis.get(k).catch(() => null)));
    for (const u of vals) {
      const obj = safeParseObj(u);
      if (obj && obj.username) map.set(normalizeUsername(obj.username), obj);
    }
  }
  const indexedSet = new Set();
  try {
    const indexed = await redis.smembers('phuc:users:index');
    if (Array.isArray(indexed)) {
      for (const uname of indexed) {
        const norm = normalizeUsername(uname);
        if (norm) indexedSet.add(norm);
      }
    }
  } catch {}
  for (const uname of extraUsernames || []) {
    const norm = normalizeUsername(uname);
    if (norm && !isGuestUsername(norm)) indexedSet.add(norm);
  }
  const missing = [...indexedSet].filter(uname => uname && !map.has(uname));
  if (missing.length) {
    const vals = await Promise.all(missing.map(uname => redis.get(`${USER_PREFIX}${uname}`).catch(() => null)));
    for (const u of vals) {
      const obj = safeParseObj(u);
      if (obj && obj.username) map.set(normalizeUsername(obj.username), obj);
    }
  }
  return Array.from(map.values());
}

async function listAllAttempts(redis, dbUsers = [], baseAttempts = null) {
  const attempts = Array.isArray(baseAttempts) ? baseAttempts.slice() : await listAttempts(redis);
  const seenAttemptIds = new Set();
  for (const a of attempts) {
    const aid = String(a?.attempt_id || a?.attemptId || '').trim();
    if (aid) seenAttemptIds.add(`${normalizeUsername(a?.username)}:${aid}`);
  }
  if (!Array.isArray(dbUsers) || !dbUsers.length) return attempts;

  // Reconcile per-user phuc:exam:history:<username> so any exam submitted via /api/exams
  // where a secondary network call was interrupted is still 100% counted on BXH & user XP
  const nonAdminUsers = dbUsers.filter(u => u?.username && !isGuestUsername(u.username));
  if (!nonAdminUsers.length) return attempts;

  try {
    const histLists = await Promise.all(
      nonAdminUsers.map(u => redis.get(`phuc:exam:history:${normalizeUsername(u.username)}`).catch(() => null))
    );
    const now = new Date();
    const currentWeek = vnWeekKey(now);

    for (let i = 0; i < nonAdminUsers.length; i++) {
      const u = nonAdminUsers[i];
      const normU = normalizeUsername(u.username);
      const isAdm = isAdminAccount(u) || isAdminUsername(normU);
      const hist = safeParseObj(histLists[i]);
      if (!Array.isArray(hist) || !hist.length) continue;

      let userModified = false;
      for (const h of hist) {
        if (!h || typeof h !== 'object') continue;
        const attId = clean(h.attemptId || h.attempt_id || '', 160);
        if (!attId) continue;
        const compositeKey = `${normU}:${attId}`;
        if (seenAttemptIds.has(compositeKey)) continue;
        seenAttemptIds.add(compositeKey);

        const createdIso = h.created_at
          || (h.submittedAt ? new Date(Number(h.submittedAt)).toISOString() : (u.last_active || now.toISOString()));
        const sc = normScore(h.score);
        const recAttempt = {
          attempt_id: attId,
          username: normU,
          display_name: clean(u.display_name || normU, 80),
          exam_id: clean(h.examId || h.exam_id || 'exam', 100),
          title: clean(h.title || 'Đề luyện thi Phúc K9', 180),
          subject: clean(h.subject || 'Toán', 40),
          grade: clean(h.grade || u.settings?.preferred_grade || '2K9', 20),
          score: sc,
          correct: Number(h.correct || 0),
          total_questions: Number(h.total_questions || h.total || 0),
          created_at: createdIso
        };
        attempts.push(recAttempt);

        // Self-heal ATTEMPTS_KEY & user XP if this attempt was never rewarded
        try {
          const xpKey = `phuc:xp:exam:${normU}:${attId}`;
          const earnedXp = isAdm ? 0 : examXp(sc);
          const granted = !!(await redis.set(xpKey, JSON.stringify({
            xp_earned: earnedXp,
            gold_earned: 0,
            diamonds_earned: 0,
            recorded_by: 'reconciled'
          }), { nx: true, ex: 60 * 60 * 24 * 365 }));
          if (granted) {
            await redis.lpush(ATTEMPTS_KEY, JSON.stringify(recAttempt));
            if (!isAdm) {
              if (u.week_key !== currentWeek) {
                u.week_key = currentWeek;
                u.weekly_xp = 0;
              }
              u.xp = Math.max(100, Number(u.xp || 0)) + earnedXp;
              if (isWithinCurrentWeek(createdIso, now)) {
                u.weekly_xp = Math.max(0, Number(u.weekly_xp || 0)) + earnedXp;
              }
              u.exam_xp = Math.max(0, Number(u.exam_xp || 0)) + earnedXp;
              userModified = true;
            }
          }
        } catch {}
      }
      if (userModified) {
        try {
          await redis.set(`${USER_PREFIX}${normU}`, u);
        } catch {}
      }
    }
  } catch {}

  return attempts;
}

async function handleRpgRequest(redis, req, res, session, action) {
  if (action === 'rpg-state' && req.method === 'GET') {
    const rawGrade = String(req.query?.grade || '2K9').toUpperCase();
    const grade = ['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(rawGrade) ? rawGrade : '2K9';
    let userRpg = null;
    if (session?.username && !isGuestUsername(session.username)) {
      const u = await getUser(redis, session.username);
      if (u) {
        const prevWk = u.rpg?.bxh?.week_key;
        const curWk = rpgWeekKey();
        if (prevWk && prevWk !== curWk) {
          const allForSettle = await collectAllUsers(redis, [session.username]);
          await bxhEngine.settleFinishedWeeks(redis, allForSettle, new Date(), { userPrefix: USER_PREFIX, isAdminAccount });
          const refreshedU = await getUser(redis, session.username);
          userRpg = buildPublicRpgSnapshot(refreshedU || u);
        } else {
          userRpg = buildPublicRpgSnapshot(u);
        }
      }
    }
    const journey = userRpg
      ? await loadJourneyLeaders(redis, grade)
      : { week_key: rpgWeekKey(), grade, locked: true, auth_required: true, leaders: [] };
    return sendJson(res, 200, {
      ok: true,
      catalog: CATALOG,
      tiers: RANK_TIERS,
      user_rpg: userRpg,
      journey
    });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, message: 'Phương thức không hợp lệ cho RPG API.' });
  }
  if (!session?.username || isGuestUsername(session.username)) {
    return sendJson(res, 401, { ok: false, auth_required: true, message: 'Tài khoản Khách chưa mở khóa. Vui lòng đăng nhập hoặc đăng ký để tham gia và đồng bộ phần thưởng!' });
  }
  const csrf = session.csrf || await getCsrf(req, res);
  if (!requireCsrf(req, session, csrf)) {
    return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }

  if (action !== 'rpg-state') {
    const ban = await rejectIfBanned(redis, req, res, session.username);
    if (ban) {
      return sendJson(res, 403, { ok: false, banned: true, auth_revoked: true, ban_reason: ban.reason, message: 'Tài khoản đã bị khóa vĩnh viễn.' });
    }
  }
  const u = await getUser(redis, session.username);
  if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy tài khoản.' });
  const isAdm = isAdminAccount(u);
  ensureUserRpgState(u);

  const sub = action.startsWith('rpg-') ? action.slice(4) : String(body.sub_action || req.query?.sub_action || '').toLowerCase();
  let out = null;

  if (sub === 'checkin') {
    out = performCheckin(u, isAdm);
  } else if (sub === 'claim-mission') {
    out = claimDailyMission(u, clean(body.mission_id || '', 40), isAdm);
  } else if (sub === 'buy') {
    out = buyCatalogItem(u, body.item_id);
  } else if (sub === 'redeem-shards') {
    out = redeemShopShards(u, body.item_id);
  } else if (sub === 'equip') {
    out = equipCatalogItem(u, body.item_id, clean(body.unequip || '', 20));
  } else if (sub === 'convert') {
    out = convertCurrency(u, clean(body.direction || '', 30), body.amount);
  } else if (sub === 'bookmark') {
    out = toggleExamBookmark(u, body);
  } else if (sub === 'wrong-resolve') {
    out = resolveWrongQuestion(u, clean(body.id || '', 120), body.correct !== false, isAdm);
  } else if (sub === 'periodic-open') {
    out = openPeriodicCell(u, { mode: clean(body.mode || 'random', 20), z: body.z });
  } else if (sub === 'practice-finish') {
    const mode = body.mode === 'srs' ? 'srs' : 'practice';
    const results = Array.isArray(body.results) ? body.results.slice(0, 60) : [];
    let correctCount = 0;
    const blockedToday = new Set(u.rpg.bxh?.daily_caps?.srs_blocked_ids_today || []);
    let eligibleSrsQuestions = 0;
    for (const item of results) {
      const ok = Boolean(item?.correct);
      if (ok) correctCount += 1;
      if (item?.id) {
        if (!blockedToday.has(String(item.id))) eligibleSrsQuestions += 1;
        recordSrsAnswer(u, item.id, ok, {
          topic: item.topic || '',
          subject: item.subject || ''
        });
      }
    }
    const total = Math.max(1, results.length);
    let dxhEarned = 0;
    if (mode === 'srs') {
      u.rpg.daily.srs_count = Number(u.rpg.daily.srs_count || 0) + total;
      // Phiên Sổ Ôn SRS: +15 ĐXH / phiên (trần 3 phiên/ngày = 45 ĐXH, không tính thẻ vừa sai Micro-Check cùng ngày)
      if (!isAdm && eligibleSrsQuestions > 0 && u.rpg.bxh.daily_caps.srs_sessions_today < 3) {
        u.rpg.bxh.daily_caps.srs_sessions_today += 1;
        dxhEarned = bxhEngine.grantWeeklyDxh(u, 15, { source: 'srs_session' }).grantedDxh;
      }
    } else {
      u.rpg.daily.practice_count = Number(u.rpg.daily.practice_count || 0) + 1;
    }
    u.rpg.questions_conquered = Number(u.rpg.questions_conquered || 0) + correctCount;
    u.rpg.bxh.weekly_stats.correct_week = Number(u.rpg.bxh.weekly_stats.correct_week || 0) + correctCount;
    u.rpg.bxh.weekly_stats.questions_week = Number(u.rpg.bxh.weekly_stats.questions_week || 0) + total;
    const baseGold = Math.min(120, 10 + correctCount * 6);
    const baseXp = Math.min(65, 5 + correctCount * 3);
    const granted = applyRewardMultipliers(u, baseGold, baseXp, 0, isAdm);
    out = {
      ok: true,
      mode,
      correct: correctCount,
      total,
      granted,
      dxh_earned: dxhEarned,
      message: mode === 'srs'
        ? `📒 Đã ôn ${total} câu Sổ Ôn Tập (Đúng ${correctCount}/${total}): +${granted.gold} Vàng${granted.xp ? ` · +${granted.xp} EXP` : ''}${dxhEarned ? ` · +${dxhEarned} ĐXH Tuần` : ''}!`
        : `⚡ Hoàn thành lượt Luyện Nhiệm Vụ (${correctCount}/${total} câu): +${granted.gold} Vàng${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
    };
  } else if (sub === 'journey-submit') {
    const islandId = clean(body.island_id || 'island-toan', 60);
    const correct = Math.max(0, Math.min(50, Math.round(Number(body.correct || 0))));
    const total = Math.max(1, Math.min(50, Math.round(Number(body.total || 5))));
    const timeSec = Math.max(1, Math.min(3600, Math.round(Number(body.time_sec || 60))));
    if (Array.isArray(body.results)) {
      for (const item of body.results.slice(0, 60)) {
        if (item?.id) {
          recordSrsAnswer(u, item.id, Boolean(item?.correct), {
            topic: item.topic || '',
            subject: item.subject || ''
          });
        }
      }
    }
    u.rpg.questions_conquered = Number(u.rpg.questions_conquered || 0) + correct;
    const ratio = correct / total;
    const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.4 ? 1 : 0;
    const speedBonus = correct > 0 ? Math.max(0, Math.round(120 / Math.max(5, timeSec))) : 0;
    const score = Math.round(ratio * 1000 + stars * 120 + speedBonus);
    const prev = u.rpg.journey[islandId] || { stars: 0, best_score: 0, plays: 0 };
    u.rpg.journey[islandId] = {
      stars: Math.max(Number(prev.stars || 0), stars),
      best_score: Math.max(Number(prev.best_score || 0), score),
      plays: Number(prev.plays || 0) + 1,
      last_played: new Date().toISOString()
    };
    const extraXp = total > 5 ? Math.min(35, Math.round(Math.max(0, correct - 5) * 1.5)) : 0;
    const granted = applyRewardMultipliers(u, 15 + stars * 10 + correct * 3, 10 + stars * 6 + extraXp, stars === 3 && prev.stars < 3 ? 1 : 0, isAdm);

    const wk = rpgWeekKey();
    const grade = ['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(String(u.settings?.preferred_grade || '').toUpperCase())
      ? String(u.settings.preferred_grade).toUpperCase()
      : '2K9';
    if (!isAdm) {
      try {
        const zKey = `phuc:rpg:journey_week:${wk}:${grade}`;
        const curBest = Number(await redis.zscore(zKey, u.username).catch(() => 0)) || 0;
        if (score > curBest) await redis.zadd(zKey, { score, member: u.username });
        const snap = buildPublicRpgSnapshot(u);
        const islands = Object.values(u.rpg.journey || {});
        const meta = {
          display_name: u.display_name || u.username,
          sbd: u.rpg.sbd,
          public_sbd: u.rpg.privacy?.anonymous_bxh ? u.rpg.anon_sbd : u.rpg.sbd,
          show_island_flag_pin: u.rpg.privacy?.show_island_flag_pin,
          anonymous_bxh: Boolean(u.rpg.privacy?.anonymous_bxh),
          grade,
          outfit_icon: snap.equipped_details?.outfit?.icon || '🧑‍🎓',
          outfit_id: snap.equipped_details?.outfit?.id || 'outfit-scholar',
          frame_class: snap.equipped_details?.frame?.cssClass || 'pk9-frame-bronze',
          aura_class: snap.equipped_details?.aura?.cssClass || '',
          islands_cleared: islands.filter(x => Number(x?.stars || 0) > 0).length,
          stars_total: islands.reduce((s, x) => s + Number(x?.stars || 0), 0)
        };
        await redis.set(`phuc:rpg:journey_meta:${u.username}`, meta, { ex: 60 * 60 * 24 * 60 });
      } catch {}
    }
    const journey = await loadJourneyLeaders(redis, grade);
    out = {
      ok: true,
      island_id: islandId,
      stars,
      score,
      granted,
      journey,
      message: `🏝️ Chinh phục ${islandId}: Đạt ${stars}⭐ (${score} điểm) · +${granted.gold} Vàng${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
    };
  } else if (sub === 'claim-weekly-chest') {
    const chestId = clean(body.chest_id || '', 24);
    const chestDef = bxhEngine.WEEKLY_MILESTONE_CHESTS.find(c => c.id === chestId);
    if (!chestDef) {
      out = { ok: false, status: 404, message: 'Không tìm thấy Rương Mốc Tuần này.' };
    } else if (u.rpg.bxh.chests_claimed[chestId]) {
      out = { ok: false, status: 409, message: 'Bạn đã mở Rương Mốc Tuần này rồi!' };
    } else if (Number(u.rpg.bxh.dxh_week || 0) < chestDef.targetDxh) {
      out = {
        ok: false,
        status: 400,
        message: `Cần đạt ${chestDef.targetDxh} ĐXH Tuần để mở "${chestDef.name}" (hiện có ${u.rpg.bxh.dxh_week || 0} ĐXH).`
      };
    } else {
      u.rpg.bxh.chests_claimed[chestId] = new Date().toISOString();
      u.rpg.gold += chestDef.gold;
      u.rpg.diamonds += chestDef.diamonds;
      u.rpg.periodic_tickets = Number(u.rpg.periodic_tickets || 0) + chestDef.iupac_tickets;
      u.rpg.shop_shards = Number(u.rpg.shop_shards || 0) + chestDef.shop_shards;
      if (chestDef.gold_charm > 0) u.rpg.consumables.gold_charm += chestDef.gold_charm * 5;
      if (chestDef.xp_boost > 0) u.rpg.consumables.xp_boost += chestDef.xp_boost * 3;
      if (chestDef.badge_id) {
        u.rpg.bxh.badge_counters[chestDef.badge_id] = Number(u.rpg.bxh.badge_counters[chestDef.badge_id] || 0) + 1;
      }
      // Phượng Hoàng Trở Lại (Badge #19): mở Rương Mốc 2 (550 ĐXH) sau khi từng nghỉ >= 7 ngày (chống cộng đúp trong cùng tuần)
      const curWeekKey = u.rpg.bxh.week_key;
      const wasAbsent7d = Number(u.rpg.bxh.hibernation?.zero_weeks || 0) >= 1 || Boolean(u.rpg.bxh.hibernation?.returned_after_7d);
      if (chestId === 'chest_2' && wasAbsent7d && u.rpg.bxh.hibernation?.phoenix_awarded_week !== curWeekKey) {
        u.rpg.bxh.badge_counters['badge-phoenix-return'] = Number(u.rpg.bxh.badge_counters['badge-phoenix-return'] || 0) + 1;
        u.rpg.bxh.hibernation.phoenix_awarded_week = curWeekKey;
        u.rpg.bxh.hibernation.zero_weeks = 0;
        u.rpg.bxh.hibernation.returned_after_7d = false;
      }
      bxhEngine.syncUserBadgesAndShowcase(u);
      out = {
        ok: true,
        chest: chestDef,
        message: `🎁 Đã mở "${chestDef.name}": Nhận +${chestDef.gold} 🪙${chestDef.diamonds ? ` · +${chestDef.diamonds} 💎` : ''}${chestDef.iupac_tickets ? ` · +${chestDef.iupac_tickets} 🎫 Vé IUPAC` : ''}${chestDef.shop_shards ? ` · +${chestDef.shop_shards} 🧩 Mảnh 3D` : ''}!`
      };
    }
  } else if (sub === 'set-primary-grade') {
    const nextGrade = bxhEngine.normalizeGrade(body.grade || '2K9');
    if (u.rpg.bxh.primary_grade_locked && u.rpg.bxh.primary_grade !== nextGrade) {
      out = {
        ok: false,
        status: 409,
        message: `Hệ Chính Tuần này đã khóa ở hệ ${u.rpg.bxh.primary_grade} sau hoạt động tính ĐXH đầu tiên. Bạn có thể đổi Hệ Chính vào 00:00 Thứ Hai tuần tới!`
      };
    } else {
      u.rpg.bxh.primary_grade = nextGrade;
      u.settings = { ...(u.settings || {}), preferred_grade: nextGrade };
      out = {
        ok: true,
        primary_grade: nextGrade,
        division_tier: u.rpg.bxh.division_by_grade[nextGrade] || 'bronze',
        message: `🎯 Đã xác nhận Hệ Chính Tuần BXH: ${nextGrade} (Hạng Đấu: ${u.rpg.bxh.division_by_grade[nextGrade] || 'bronze'}).`
      };
    }
  } else if (sub === 'showcase-save') {
    const sc = u.rpg.showcase;
    const badges = u.rpg.badges_24 || [];
    const unlockedIds = new Set(badges.filter(x => x.unlocked).map(x => x.id));

    if (Object.prototype.hasOwnProperty.call(body, 'motto')) {
      const mVal = clean(body.motto || '', 90);
      const vCheck = bxhEngine.validateProactiveContent(mVal, 'Khẩu hiệu mục tiêu');
      if (!vCheck.ok) {
        return sendJson(res, 422, { ok: false, message: vCheck.message, rpg: buildPublicRpgSnapshot(u) });
      }
      u.rpg.motto = vCheck.clean;
    }

    if (body.hero_badge !== undefined) {
      const hb = String(body.hero_badge || '').trim();
      if (!hb) sc.hero_badge = null;
      else if (unlockedIds.has(hb)) sc.hero_badge = hb;
    }
    if (Array.isArray(body.showcase_badges)) {
      sc.showcase_badges = body.showcase_badges
        .map(id => String(id || '').trim())
        .filter((id, idx, arr) => id && unlockedIds.has(id) && arr.indexOf(id) === idx)
        .slice(0, sc.unlocked_slots);
    }
    if (body.featured_iupac !== undefined) {
      const z = Math.round(Number(body.featured_iupac || 0));
      if ((u.rpg.periodic_unlocked || [1, 6, 8]).includes(z)) {
        sc.featured_iupac = z;
      }
    }
    if (Array.isArray(body.milestone_ids)) {
      const avail = bxhEngine.buildAvailableMilestones(u);
      const picked = body.milestone_ids
        .map(id => avail.find(m => m.id === String(id)))
        .filter(Boolean)
        .slice(0, 3);
      if (picked.length > 0) sc.milestone_cards = picked;
    }
    if (body.refresh_milestones) {
      const avail = bxhEngine.buildAvailableMilestones(u);
      sc.milestone_cards = (sc.milestone_cards || []).map(old => avail.find(m => m.id === old.id) || old);
    }
    if (body.cardbg && (u.rpg.inventory || []).includes(body.cardbg)) {
      u.rpg.equipped.cardbg = body.cardbg;
    }
    if (body.showcase_frame) {
      const sf = String(body.showcase_frame).trim();
      const inv = u.rpg.inventory || [];
      const isLegend = Number(u.xp || 0) >= 13000 || Object.values(u.rpg.bxh?.division_by_grade || {}).includes('legend');
      const allowedFrame =
        sf === 'default' ||
        (sf === 'crystal' && (inv.includes('showcase-frame-crystal') || inv.includes('crystal'))) ||
        (sf === 'nebula' && (inv.includes('showcase-frame-nebula') || inv.includes('nebula'))) ||
        (sf === 'legend_gold' && (isLegend || inv.includes('legend_gold')));
      if (allowedFrame) {
        sc.showcase_frame = sf;
      }
    }
    sc.active_preset = 'custom';
    bxhEngine.syncUserBadgesAndShowcase(u);
    out = {
      ok: true,
      showcase: u.rpg.showcase,
      message: '🏆 Đã lưu cấu hình Tủ Kính Thành Tựu & đồng bộ lên Thẻ Học Viên .PNG!'
    };
  } else if (sub === 'showcase-preset') {
    out = bxhEngine.applySmartPreset(u, clean(body.preset_id || '', 40));
  } else if (sub === 'privacy-save') {
    const pv = u.rpg.privacy;
    if (['public_all', 'province_grade', 'hide_all'].includes(body.school_visibility)) {
      pv.school_visibility = body.school_visibility;
    }
    if (typeof body.show_island_flag_pin === 'boolean') {
      pv.show_island_flag_pin = body.show_island_flag_pin;
    }
    if (['everyone', 'friends_only', 'none'].includes(body.allow_1v1_invites)) {
      pv.allow_1v1_invites = body.allow_1v1_invites;
    }
    if (['everyone', 'friends_only'].includes(body.allow_pomodoro_costudy)) {
      pv.allow_pomodoro_costudy = body.allow_pomodoro_costudy;
    }
    if (typeof body.anonymous_bxh === 'boolean') {
      pv.anonymous_bxh = body.anonymous_bxh;
    }
    out = {
      ok: true,
      privacy: pv,
      message: pv.anonymous_bxh
        ? `🛡️ Đã bật Chế độ Ẩn danh BXH (Hiển thị: Học viên #${u.rpg.anon_sbd} • Đã khóa link ?card=${u.username})!`
        : '🛡️ Đã lưu cài đặt Quyền riêng tư & An toàn học đường!'
    };
  } else if (sub === 'micro-cheer') {
    const targetU = normalizeUsername(body.target_username || '');
    const targetSbd = clean(body.target_sbd || '', 40).toUpperCase();
    let targetUser = targetU ? await getUser(redis, targetU) : null;
    if (!targetUser && targetSbd) {
      const allUsers = await collectAllUsers(redis);
      targetUser = allUsers.find(cand =>
        String(cand?.rpg?.sbd || '').toUpperCase() === targetSbd ||
        String(cand?.rpg?.anon_sbd || '').toUpperCase() === targetSbd
      ) || null;
    }
    if (!targetUser) {
      out = { ok: false, status: 404, message: 'Không tìm thấy hồ sơ học viên để tặng Ngọn Lửa.' };
    } else if (normalizeUsername(targetUser.username) === normalizeUsername(u.username)) {
      out = { ok: false, status: 400, message: 'Bạn không thể tự tặng Ngọn Lửa cho chính mình!' };
    } else {
      ensureUserRpgState(targetUser);
      const tNorm = normalizeUsername(targetUser.username);
      const myNorm = normalizeUsername(u.username);
      if (u.rpg.privacy.blocked_users.includes(tNorm) || targetUser.rpg.privacy.blocked_users.includes(myNorm)) {
        out = { ok: false, status: 403, message: 'Không thể tương tác với học viên trong danh sách chặn.' };
      } else if (Number(u.rpg.bxh.daily_caps.dxh_today || 0) < 40 && !isAdm) {
        out = { ok: false, status: 400, message: 'Bạn cần hoàn thành Ngày Học Hợp Lệ hôm nay (>= 40 ĐXH) trước khi tặng Ngọn Lửa cổ vũ bạn bè!' };
      } else if (u.rpg.bxh.daily_caps.flames_sent_today >= 5) {
        out = { ok: false, status: 429, message: 'Bạn đã tặng đủ trần 5 Ngọn Lửa trong ngày hôm nay.' };
      } else if ((u.rpg.bxh.daily_caps.flames_targets_today || []).includes(tNorm)) {
        out = { ok: false, status: 409, message: 'Hôm nay bạn đã tặng Ngọn Lửa cho học viên này rồi (tối đa 1 lần/ngày/hồ sơ).' };
      } else if (targetUser.rpg.bxh.daily_caps.flames_received_today >= 15) {
        out = { ok: false, status: 429, message: 'Học viên này đã nhận tối đa 15 Ngọn Lửa/ngày hôm nay.' };
      } else {
        const msgIdx = Math.max(0, Math.min(bxhEngine.CHEER_PRESET_MESSAGES.length - 1, Number(body.preset_index || 0)));
        const presetMsg = bxhEngine.CHEER_PRESET_MESSAGES[msgIdx];
        u.rpg.bxh.daily_caps.flames_sent_today += 1;
        u.rpg.bxh.daily_caps.flames_targets_today.push(tNorm);

        targetUser.rpg.bxh.daily_caps.flames_received_today += 1;
        targetUser.rpg.gold = Number(targetUser.rpg.gold || 0) + 1; // +1 Vàng (không nhân Lõi x8 Vàng)
        targetUser.rpg.social.cheer_score = Number(targetUser.rpg.social.cheer_score || 0) + 1;
        targetUser.rpg.social.recent_cheers.unshift({
          from: u.rpg.privacy.anonymous_bxh ? u.rpg.anon_sbd : u.username,
          from_name: u.rpg.privacy.anonymous_bxh ? `Học viên #${u.rpg.anon_sbd}` : (u.display_name || u.username),
          message: presetMsg,
          at: new Date().toISOString()
        });
        targetUser.rpg.social.recent_cheers = targetUser.rpg.social.recent_cheers.slice(0, 15);
        await redis.set(`${USER_PREFIX}${tNorm}`, targetUser);

        let senderXpBonus = 0;
        if (!u.rpg.bxh.daily_caps.cheer_xp_claimed_today && !isAdm) {
          u.rpg.bxh.daily_caps.cheer_xp_claimed_today = true;
          u.xp = Number(u.xp || 100) + 2;
          senderXpBonus = 2;
        }
        out = {
          ok: true,
          target_cheer_score: targetUser.rpg.social.cheer_score,
          preset_message: presetMsg,
          sender_xp_bonus: senderXpBonus,
          message: `🔥 Đã gửi Ngọn Lửa cổ vũ: "${presetMsg}" (Người nhận +1 🪙 & +1 Điểm Cổ Vũ${senderXpBonus ? ` · Bạn +${senderXpBonus} EXP` : ''})!`
        };
      }
    }
  } else if (sub === 'micro-rival') {
    const targetU = normalizeUsername(body.target_username || '');
    const myNorm = normalizeUsername(u.username);
    if (!targetU || targetU === myNorm) {
      out = { ok: false, status: 400, message: 'Không thể tự ghim chính mình làm Rival.' };
    } else if (u.rpg.privacy.blocked_users.includes(targetU)) {
      out = { ok: false, status: 403, message: 'Học viên này đang nằm trong danh sách chặn.' };
    } else {
      const targetUser = await getUser(redis, targetU);
      const targetBlockedMe = Boolean(targetUser?.rpg?.privacy?.blocked_users?.includes(myNorm));
      if (targetBlockedMe) {
        out = { ok: false, status: 403, message: 'Không thể ghim Rival với học viên đã chặn tương tác.' };
      } else {
        const list = u.rpg.social.rivals || [];
        const idx = list.indexOf(targetU);
        if (idx >= 0) {
          list.splice(idx, 1);
          u.rpg.social.rivals = list;
          out = { ok: true, pinned: false, rivals: list, message: `📌 Đã bỏ ghim @${targetU} khỏi danh sách Đối Thủ Mục Tiêu.` };
        } else if (list.length >= 3) {
          out = { ok: false, status: 400, message: 'Bạn chỉ có thể ghim tối đa 3 Rival cùng lúc. Hãy bỏ ghim 1 người trước nhé!' };
        } else {
          list.push(targetU);
          u.rpg.social.rivals = list;
          out = { ok: true, pinned: true, rivals: list, message: `📌 Đã ghim @${targetU} vào Đối Thủ Mục Tiêu (Rival Pin) để theo dõi khoảng cách ĐXH Tuần!` };
        }
      }
    }
  } else if (sub === 'micro-challenge-1v1') {
    const targetU = normalizeUsername(body.target_username || '');
    const targetUser = targetU ? await getUser(redis, targetU) : null;
    if (!targetUser) {
      out = { ok: false, status: 404, message: 'Không tìm thấy học viên để gửi lời mời thách đấu 1v1.' };
    } else if (targetU === normalizeUsername(u.username)) {
      out = { ok: false, status: 400, message: 'Không thể tự thách đấu chính mình.' };
    } else {
      ensureUserRpgState(targetUser);
      const myNorm = normalizeUsername(u.username);
      const sameSquad = Boolean(
        u.rpg.social?.squad_code &&
        targetUser.rpg.social?.squad_code &&
        u.rpg.social.squad_code === targetUser.rpg.social.squad_code
      );
      const isSavedFriendOrRival = (targetUser.rpg.social?.rivals || []).includes(myNorm) || sameSquad;
      const allowMode = targetUser.rpg.privacy?.allow_1v1_invites || 'everyone';
      if (u.rpg.privacy.blocked_users.includes(targetU) || targetUser.rpg.privacy.blocked_users.includes(myNorm)) {
        out = { ok: false, status: 403, message: 'Không thể gửi lời mời 1v1 cho học viên trong danh sách chặn.' };
      } else if (Number(targetUser.rpg.social?.pomodoro_active_until || 0) > Date.now()) {
        out = { ok: false, status: 409, message: '🍅 Học viên này đang trong phiên tập trung Pomodoro 9+ (Chế độ Không Làm Phiền). Hãy gửi lời mời sau khi phiên học kết thúc nhé!' };
      } else if (allowMode === 'none' || (allowMode === 'friends_only' && !isSavedFriendOrRival)) {
        out = { ok: false, status: 403, message: 'Học viên này đang bật chế độ hạn chế nhận lời mời Đấu Trường 1v1 từ người lạ (Safe-by-Default).' };
      } else if (!isSavedFriendOrRival && Number(targetUser.rpg.bxh.daily_caps.stranger_1v1_invites_today || 0) >= 5) {
        out = { ok: false, status: 429, message: 'Học viên này đã nhận tối đa 5 lời mời thách đấu từ người lạ trong ngày hôm nay.' };
      } else {
        const cdKey = `phuc:duel:cd:${myNorm}:${targetU}`;
        const onCooldown = await redis.get(cdKey).catch(() => null);
        if (onCooldown) {
          out = { ok: false, status: 429, message: 'Bạn vừa gửi lời mời thách đấu cho học viên này. Vui lòng chờ 10 phút giữa 2 lần mời cùng 1 người!' };
        } else {
          await redis.set(cdKey, '1', { ex: 600 });
          const subject = clean(body.subject || 'Toán', 40);
          const room = await arena.createDuelRoom(redis, u, {
            subject,
            count: 5,
            title: `⚔️ Khiêu chiến 1v1: ${u.display_name || u.username} vs ${targetUser.display_name || targetUser.username}`
          });
          if (!isSavedFriendOrRival) {
            targetUser.rpg.bxh.daily_caps.stranger_1v1_invites_today = Number(targetUser.rpg.bxh.daily_caps.stranger_1v1_invites_today || 0) + 1;
          }
          targetUser.rpg.social.duel_inbox.unshift({
            id: `inv-${Date.now()}`,
            from: myNorm,
            from_name: u.display_name || myNorm,
            subject,
            room_code: room.code,
            created_at: new Date().toISOString(),
            expires_at: Date.now() + 24 * 3600 * 1000
          });
          targetUser.rpg.social.duel_inbox = targetUser.rpg.social.duel_inbox.slice(0, 20);
          await redis.set(`${USER_PREFIX}${targetU}`, targetUser);
          out = {
            ok: true,
            room_code: room.code,
            subject,
            message: `⚔️ Đã tạo phòng Khiêu Chiến 1v1 (Mã: ${room.code}) và gửi Thư Khiêu Chiến 24h tới @${targetU}!`
          };
        }
      }
    }
  } else if (sub === 'micro-block') {
    const targetU = normalizeUsername(body.target_username || '');
    if (!targetU || targetU === normalizeUsername(u.username)) {
      out = { ok: false, status: 400, message: 'Tài khoản cần chặn không hợp lệ.' };
    } else {
      const list = u.rpg.privacy.blocked_users || [];
      const idx = list.indexOf(targetU);
      if (idx >= 0) {
        list.splice(idx, 1);
        u.rpg.privacy.blocked_users = list;
        out = { ok: true, blocked: false, blocked_users: list, message: `Đã bỏ chặn học viên @${targetU}.` };
      } else {
        list.push(targetU);
        u.rpg.privacy.blocked_users = list;
        u.rpg.social.rivals = (u.rpg.social.rivals || []).filter(x => x !== targetU);
        // Gỡ bỏ Rival 2 chiều khỏi danh sách của đối phương (Khóa trọn vẹn 5 kênh R2 Mục 5.5)
        try {
          const myNorm = normalizeUsername(u.username);
          const targetObj = await getUser(redis, targetU);
          if (targetObj?.rpg?.social && Array.isArray(targetObj.rpg.social.rivals) && targetObj.rpg.social.rivals.includes(myNorm)) {
            targetObj.rpg.social.rivals = targetObj.rpg.social.rivals.filter(x => x !== myNorm);
            await redis.set(`${USER_PREFIX}${targetU}`, targetObj);
          }
        } catch {}
        out = {
          ok: true,
          blocked: true,
          blocked_users: list,
          message: `🚫 Đã chặn @${targetU} trên toàn bộ 5 kênh (Lời mời 1v1, Ngọn Lửa, Pomodoro Cộng Hưởng, Rival Pin & Study Squad).`
        };
      }
    }
  } else if (sub === 'micro-report') {
    const targetSbd = clean(body.target_sbd || body.target_username || '', 60);
    const reason = clean(body.reason || 'Hồ sơ có dấu hiệu vi phạm quy tắc học đường', 300);
    const reportItem = {
      id: `fb-rep-${Date.now()}`,
      category: 'other',
      category_label: '🚩 Báo cáo Hồ sơ Học viên (R2)',
      rating: 5,
      sender_name: u.display_name || u.username,
      username: u.username,
      contact: '',
      message: `[Báo cáo hồ sơ ${targetSbd}]: ${reason}`,
      page_context: `Public Profile ${targetSbd}`,
      device_hint: 'R2 Profile Guard',
      status: 'new',
      created_at: new Date().toISOString(),
      created_label: new Date().toLocaleDateString('vi-VN')
    };
    try {
      await redis.lpush('phuc:feedbacks', JSON.stringify(reportItem));
      await redis.ltrim('phuc:feedbacks', 0, 299);
    } catch {}
    out = { ok: true, message: '🛡️ Đã gửi báo cáo hồ sơ tới bộ phận Kiểm duyệt Học đường Phúc K9!' };
  } else if (sub === 'pomodoro-start') {
    const durationMin = Number(body.duration_min || body.minutes) === 50 ? 50 : 25;
    const coStudy = Boolean(body.co_study);
    const statusTag = clean(body.status_tag || '📝 Đang giải đề 2018', 60);
    u.rpg.social.pomodoro_active_until = Date.now() + durationMin * 60 * 1000;
    u.rpg.social.pomodoro_mode = coStudy ? 'costudy' : 'solo';
    u.rpg.social.pomodoro_status_tag = statusTag;
    out = {
      ok: true,
      duration_min: durationMin,
      co_study: coStudy,
      status_tag: statusTag,
      pomodoro_active_until: u.rpg.social.pomodoro_active_until,
      message: `🍅 Đã kích hoạt phiên Pomodoro ${durationMin}p (${coStudy ? 'Bàn Học Cộng Hưởng +15% Vàng & EXP' : 'Chế độ Solo Yên Tĩnh'}) — Tạm bật Không Làm Phiền 1v1!`
    };
  } else if (sub === 'pomodoro-complete') {
    const durationMin = Number(body.duration_min || body.minutes) === 50 ? 50 : 25;
    const examActive = Boolean(body.exam_active);
    const idleSec = Math.max(0, Number(body.idle_sec || 0));
    const checkinNote = clean(body.checkin_note || '', 240);
    const coStudy = Boolean(body.co_study);
    const statusTag = clean(body.status_tag || '📝 Đang giải đề 2018', 60);
    u.rpg.social.pomodoro_active_until = 0;

    // Quality Gate R1/R5 cho Bàn Học Pomodoro 9+
    if (examActive) {
      out = {
        ok: false,
        status: 400,
        message: 'Không tính ĐXH Pomodoro khi chạy song song trong lúc đang mở bài thi có đồng hồ (Chống ăn điểm kép).'
      };
    } else if (idleSec > 180) {
      out = {
        ok: false,
        status: 400,
        message: 'Phiên Pomodoro bị tạm ngưng quá 3 phút liên tục (Idle > 3p) — đã lưu giờ cá nhân nhưng tính 0 ĐXH Tuần.'
      };
    } else if (checkinNote.length < 15) {
      out = {
        ok: false,
        status: 422,
        message: 'Vui lòng nhập ghi chú Check-in cuối phiên tối thiểu 15 ký tự có nghĩa (VD: "Đã ôn xong 20 công thức Este & giải 5 câu tích phân") để xác thực phiên Pomodoro!'
      };
    } else {
      u.rpg.social.pomodoro_total_mins = Number(u.rpg.social.pomodoro_total_mins || 0) + durationMin;
      const curMinsToday = Number(u.rpg.bxh.daily_caps.pomodoro_mins_today || 0);
      let dxhEarned = 0;

      if (curMinsToday + durationMin <= 150 && !isAdm) {
        u.rpg.bxh.daily_caps.pomodoro_mins_today = curMinsToday + durationMin;
        u.rpg.bxh.weekly_stats.pomodoro_verified_mins_week = Number(u.rpg.bxh.weekly_stats.pomodoro_verified_mins_week || 0) + durationMin;
        u.rpg.bxh.weekly_stats.pomodoro_sessions_week = Number(u.rpg.bxh.weekly_stats.pomodoro_sessions_week || 0) + 1;
        const rawDxh = durationMin === 50 ? 42 : 20;
        dxhEarned = bxhEngine.grantWeeklyDxh(u, rawDxh, { source: 'pomodoro_9plus' }).grantedDxh;
      }

      const baseGold = durationMin === 50 ? 40 : 20;
      const baseXp = durationMin === 50 ? 40 : 20;
      const coMult = coStudy ? 1.15 : 1.0; // +15% Vàng & EXP khi học chung Pomodoro Cộng Hưởng (không tăng trần ĐXH)
      const granted = applyRewardMultipliers(
        u,
        Math.round(baseGold * coMult),
        Math.round(baseXp * coMult),
        0,
        isAdm
      );

      if (coStudy) {
        u.rpg.social.costudy_sessions = Number(u.rpg.social.costudy_sessions || 0) + 1;
      }

      // Mở khóa Rương Tân Binh (R4 QR Referral) nếu hoàn thành Pomodoro >=25p & đạt Ngày Hợp Lệ >= 40 ĐXH
      if (u.rpg.social.referral) {
        u.rpg.social.referral.has_qualifying_exam_or_pomo = true;
        const hasValidDay = Number(u.rpg.bxh.daily_caps.dxh_today || 0) >= 40 || (Array.isArray(u.rpg.bxh.valid_days_week) && u.rpg.bxh.valid_days_week.length > 0);
        if (hasValidDay && u.rpg.social.referral.referred_by && !u.rpg.social.referral.rookie_chest_unlocked) {
          u.rpg.social.referral.rookie_chest_unlocked = true;
        }
      }

      bxhEngine.syncUserBadgesAndShowcase(u);
      out = {
        ok: true,
        duration_min: durationMin,
        co_study: coStudy,
        status_tag: statusTag,
        dxh_earned: dxhEarned,
        dxh_granted: dxhEarned,
        granted,
        pomodoro_mins_today: u.rpg.bxh.daily_caps.pomodoro_mins_today,
        message: `🍅 Hoàn thành Pomodoro ${durationMin}p${coStudy ? ' Cộng Hưởng (+15% Vàng & EXP)' : ''}: +${granted.gold} 🪙 · +${granted.xp} EXP${dxhEarned ? ` · +${dxhEarned} ĐXH Tuần` : ' (Đã chạm trần 150p Pomodoro/ngày)'}!`
      };
    }
  } else if (sub === 'ai-vision-verify') {
    const passed2Variants = body.passed_variants !== false;
    if (!passed2Variants) {
      out = { ok: false, status: 400, message: 'Bạn cần giải đúng 2 câu biến thể kiểm chứng hiểu bài ngay sau lời giải AI để nhận +15 ĐXH Tuần.' };
    } else if (u.rpg.bxh.daily_caps.ai_vision_today >= 3) {
      out = { ok: false, status: 429, message: 'Bạn đã nhận tối đa 3 lượt ĐXH từ Trợ Lý AI Phúc K9 hôm nay (45 ĐXH/ngày).' };
    } else {
      u.rpg.bxh.daily_caps.ai_vision_today += 1;
      u.rpg.social.ai_vision_solved = Number(u.rpg.social.ai_vision_solved || 0) + 1;
      const dxhEarned = isAdm ? 0 : bxhEngine.grantWeeklyDxh(u, 15, { source: 'ai_vision_2variants' }).grantedDxh;
      const granted = applyRewardMultipliers(u, 15, 15, 0, isAdm);
      bxhEngine.syncUserBadgesAndShowcase(u);
      out = {
        ok: true,
        dxh_earned: dxhEarned,
        dxh_granted: dxhEarned,
        granted,
        ai_vision_today: u.rpg.bxh.daily_caps.ai_vision_today,
        message: `🤖 Đã giải đúng 2 câu biến thể cùng AI Phúc K9: +${dxhEarned} ĐXH Tuần · +${granted.gold} 🪙 · +${granted.xp} EXP!`
      };
    }
  } else if (sub === 'claim-rookie-chest') {
    const refInfo = u.rpg.social.referral || {};
    const hasValidDay = Number(u.rpg.bxh.daily_caps.dxh_today || 0) >= 40 || (Array.isArray(u.rpg.bxh.valid_days_week) && u.rpg.bxh.valid_days_week.length > 0);
    const hasQualifyingActivity = Boolean(
      refInfo.has_qualifying_exam_or_pomo ||
      Number(u.rpg.bxh?.weekly_stats?.pomodoro_sessions_week || 0) > 0 ||
      (Array.isArray(u.rpg.bxh?.weekly_stats?.std_exam_scores) && u.rpg.bxh.weekly_stats.std_exam_scores.some(s => Number(s?.score || 0) >= 5.0))
    );
    if (!refInfo.referred_by) {
      out = { ok: false, status: 400, message: 'Tài khoản của bạn không có mã giới thiệu Tân Binh từ Thẻ QR.' };
    } else if (refInfo.rookie_chest_claimed) {
      out = { ok: false, status: 409, message: 'Bạn đã mở Rương Tân Binh 9+ trước đó rồi!' };
    } else if (!refInfo.rookie_chest_unlocked || !hasValidDay || !hasQualifyingActivity) {
      out = {
        ok: false,
        status: 400,
        message: 'Để chống nick ảo, Rương Tân Binh 9+ chỉ mở khóa sau khi bạn hoàn thành 1 Ngày Hợp Lệ (>= 40 ĐXH) kèm tối thiểu 1 đề thi (>= 5.0đ) HOẶC 1 phiên Pomodoro 25p xác thực!'
      };
    } else {
      refInfo.rookie_chest_unlocked = true;
      refInfo.rookie_chest_claimed = true;
      u.rpg.gold += 100;
      u.rpg.consumables.xp_boost = Number(u.rpg.consumables.xp_boost || 0) + 3;
      u.rpg.periodic_tickets = Number(u.rpg.periodic_tickets || 0) + 1;

      // Cộng thưởng cho người giới thiệu A (+50 🪙 Vàng, tối đa 5 bạn/tuần & +1 Badge Đại Sứ Phúc K9 tối đa 30/mùa)
      // Kiểm tra chống clone cùng IP / thiết bị
      const refRaw = String(refInfo.referred_by || '').trim();
      let refUser = await getUser(redis, refRaw);
      if (!refUser) {
        const allUsers = await collectAllUsers(redis);
        refUser = allUsers.find(cand =>
          String(cand?.rpg?.sbd || '').toUpperCase() === refRaw.toUpperCase() ||
          String(cand?.rpg?.anon_sbd || '').toUpperCase() === refRaw.toUpperCase()
        ) || null;
      }
      if (refUser && normalizeUsername(refUser.username) !== normalizeUsername(u.username)) {
        ensureUserRpgState(refUser);
        const rSoc = refUser.rpg.social;
        if (!Array.isArray(rSoc.referral.verified_ips)) rSoc.referral.verified_ips = [];
        const signupIp = String(refInfo.signup_ip || '').trim();
        const refIp = String(rSoc.referral.signup_ip || '').trim();
        const sameIpCount = signupIp ? rSoc.referral.verified_ips.filter(ip => ip === signupIp).length : 0;
        const isCloneIp = Boolean(signupIp && ((refIp && signupIp === refIp) || sameIpCount >= 2));
        const alreadyListed = (rSoc.referral.verified_referrals || []).includes(u.username);
        if (!alreadyListed && !isCloneIp) {
          rSoc.referral.verified_referrals.push(u.username);
          if (signupIp) rSoc.referral.verified_ips.push(signupIp);
          if (Number(rSoc.referral.week_ref_count || 0) < 5) {
            rSoc.referral.week_ref_count = Number(rSoc.referral.week_ref_count || 0) + 1;
            refUser.rpg.gold = Number(refUser.rpg.gold || 0) + 50;
          }
          if (Number(rSoc.referral.season_ref_count || 0) < 30) {
            rSoc.referral.season_ref_count = Number(rSoc.referral.season_ref_count || 0) + 1;
            refUser.rpg.bxh.badge_counters['badge-ambassador-k9'] = rSoc.referral.season_ref_count;
          }
          bxhEngine.syncUserBadgesAndShowcase(refUser);
          await redis.set(`${USER_PREFIX}${normalizeUsername(refUser.username)}`, refUser);
        }
      }
      bxhEngine.syncUserBadgesAndShowcase(u);
      out = {
        ok: true,
        message: '🎁 Mở khóa Rương Tân Binh 9+ thành công: Nhận +100 🪙 Vàng · +1 🚀 Vé Nhân Đôi EXP (3 lượt) · +1 🎫 Vé mở ô IUPAC!'
      };
    }
  } else if (sub === 'squad-action') {
    const mode = clean(body.mode || 'create', 24);
    const wk = rpgWeekKey();
    const myNorm = normalizeUsername(u.username);
    const myGrade = u.rpg.bxh.primary_grade || '2K9';

    if (isAdm || isGuestUsername(myNorm)) {
      out = { ok: false, status: 403, message: 'Hệ thống chặn tài khoản Admin và K9-GUEST tham gia Study Squad để đảm bảo công bằng tuyệt đối!' };
    } else if (mode === 'create') {
      if (!bxhEngine.isBeforeTuesdayEndVn()) {
        out = { ok: false, status: 409, message: 'Đội hình Study Squad đã khóa cứng sau 23:59 Thứ Ba (chống nhảy đội cuối tuần). Hãy lập nhóm đầu tuần tới nhé!' };
      } else {
        const squadCode = `SQ-${myGrade}-${Math.floor(1000 + Math.random() * 9000)}`;
        const squadName = clean(body.name || `Biệt Đội 9+ ${myGrade}`, 50);
        const squadObj = {
          code: squadCode,
          name: squadName,
          week_key: wk,
          grade: myGrade,
          leader: myNorm,
          members: [myNorm],
          bonus_claimed_by: [],
          created_at: new Date().toISOString()
        };
        await redis.set(`phuc:rpg:squad:${wk}:${squadCode}`, squadObj, { ex: 60 * 60 * 24 * 14 });
        u.rpg.social.squad_code = squadCode;
        out = {
          ok: true,
          squad: squadObj,
          message: `🚩 Đã lập Study Squad "${squadName}" (Mã nhóm: ${squadCode} • Hệ ${myGrade})! Hãy gửi mã này cho 1–3 bạn cùng Hệ trước 23:59 Thứ Ba.`
        };
      }
    } else if (mode === 'join') {
      const code = clean(body.code || '', 30).toUpperCase();
      const rawSq = await redis.get(`phuc:rpg:squad:${wk}:${code}`).catch(() => null);
      const squadObj = safeParseObj(rawSq);
      if (!squadObj) {
        out = { ok: false, status: 404, message: 'Không tìm thấy Mã nhóm Study Squad này trong tuần hiện tại.' };
      } else if (!bxhEngine.isBeforeTuesdayEndVn() && !squadObj.members.includes(myNorm)) {
        out = { ok: false, status: 409, message: 'Đội hình Study Squad đã khóa cứng sau 23:59 Thứ Ba!' };
      } else if (squadObj.grade !== myGrade) {
        out = { ok: false, status: 400, message: `Study Squad này thuộc Hệ ${squadObj.grade}, khác Hệ Chính Tuần (${myGrade}) của bạn.` };
      } else if (squadObj.members.some(m => u.rpg.privacy.blocked_users.includes(m))) {
        out = { ok: false, status: 403, message: 'Không thể tham gia nhóm có học viên nằm trong danh sách chặn.' };
      } else if (!squadObj.members.includes(myNorm) && squadObj.members.length >= 4) {
        out = { ok: false, status: 409, message: 'Study Squad này đã đủ tối đa 4/4 thành viên!' };
      } else {
        // Kiểm tra chặn 2 chiều: từ chối nếu bất kỳ thành viên nào trong Squad đã chặn người xin gia nhập
        const existingMembers = await Promise.all(squadObj.members.map(m => m === myNorm ? u : getUser(redis, m)));
        const blockedByMember = existingMembers.some(mObj => Array.isArray(mObj?.rpg?.privacy?.blocked_users) && mObj.rpg.privacy.blocked_users.includes(myNorm));
        if (blockedByMember) {
          out = { ok: false, status: 403, message: 'Không thể tham gia Study Squad do có thành viên đang chặn tương tác với bạn.' };
        } else {
          if (!squadObj.members.includes(myNorm)) squadObj.members.push(myNorm);
          await redis.set(`phuc:rpg:squad:${wk}:${code}`, squadObj, { ex: 60 * 60 * 24 * 14 });
          u.rpg.social.squad_code = code;
          out = {
            ok: true,
            squad: squadObj,
            message: `🤝 Đã gia nhập Study Squad "${squadObj.name}" (${squadObj.members.length}/4 bạn • Hệ ${myGrade})!`
          };
        }
      }
    } else if (mode === 'claim-bonus') {
      const code = clean(u.rpg.social.squad_code || body.code || '', 30).toUpperCase();
      const squadObj = safeParseObj(await redis.get(`phuc:rpg:squad:${wk}:${code}`).catch(() => null));
      if (!squadObj || !squadObj.members.includes(myNorm)) {
        out = { ok: false, status: 404, message: 'Bạn chưa tham gia Study Squad nào trong tuần này.' };
      } else if (squadObj.members.length < 2) {
        out = { ok: false, status: 400, message: 'Study Squad cần tối thiểu 2–4 thành viên cùng Hệ để nhận thưởng nhóm.' };
      } else if ((squadObj.bonus_claimed_by || []).includes(myNorm)) {
        out = { ok: false, status: 409, message: 'Bạn đã nhận thưởng Study Squad của tuần này rồi!' };
      } else {
        const memObjs = await Promise.all(squadObj.members.map(m => m === myNorm ? u : getUser(redis, m)));
        const allReached550 = memObjs.every(mObj => {
          if (!mObj) return false;
          ensureUserRpgState(mObj);
          return Number(mObj.rpg?.bxh?.dxh_week || 0) >= 550;
        });
        if (!allReached550) {
          out = {
            ok: false,
            status: 400,
            message: 'Cần 100% thành viên trong Study Squad đạt tối thiểu Rương Mốc 2 (>= 550 ĐXH Tuần) để mở thưởng +15% Vàng Rương Tuần!'
          };
        } else {
          // +15% Vàng tính trực tiếp trên tổng Vàng gốc của 4 Rương Mốc Cá Nhân đã đạt (tối đa +72 🪙 trên 480 🪙)
          const myDxh = Number(u.rpg.bxh.dxh_week || 0);
          const chestsBaseGold = bxhEngine.WEEKLY_MILESTONE_CHESTS
            .filter(c => myDxh >= c.targetDxh)
            .reduce((s, c) => s + c.gold, 0);
          const bonusGold = Math.min(72, Math.round(chestsBaseGold * 0.15));
          u.rpg.gold += bonusGold;
          u.rpg.bxh.badge_counters['badge-squad-leader'] = Number(u.rpg.bxh.badge_counters['badge-squad-leader'] || 0) + 1;
          squadObj.bonus_claimed_by = [...(squadObj.bonus_claimed_by || []), myNorm];
          await redis.set(`phuc:rpg:squad:${wk}:${code}`, squadObj, { ex: 60 * 60 * 24 * 14 });
          bxhEngine.syncUserBadgesAndShowcase(u);
          out = {
            ok: true,
            bonus_gold: bonusGold,
            squad: squadObj,
            message: `🚩 100% thành viên Study Squad đạt >= 550 ĐXH: Nhận +${bonusGold} 🪙 (+15% Vàng Rương Mốc) & +1 tiến độ Badge "Kéo Nhóm Cùng Tiến"!`
          };
        }
      }
    } else {
      out = { ok: false, status: 400, message: 'Thao tác Study Squad không hợp lệ.' };
    }
  } else if (sub === 'settings') {
    if (body.paper_theme && ['paper-white', 'paper-ivory', 'paper-softgray'].includes(body.paper_theme)) {
      u.rpg.paper_theme = body.paper_theme;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'motto')) {
      const rawMotto = clean(body.motto || '', 90);
      const mottoCheck = bxhEngine.validateProactiveContent(rawMotto, 'Khẩu hiệu mục tiêu');
      if (!mottoCheck.ok) {
        return sendJson(res, 422, { ok: false, message: mottoCheck.message, rpg: buildPublicRpgSnapshot(u) });
      }
      u.rpg.motto = mottoCheck.clean;
    }
    if (body.flashcard_update && typeof body.flashcard_update === 'object') {
      const fk = clean(body.flashcard_update.key || '', 80);
      if (fk) {
        const cur = u.rpg.flashcards_state[fk] || {};
        if (['new', 'learning', 'mastered'].includes(body.flashcard_update.status)) {
          cur.status = body.flashcard_update.status;
        }
        if (typeof body.flashcard_update.star === 'boolean') {
          cur.star = body.flashcard_update.star;
        }
        cur.updatedAt = new Date().toISOString();
        u.rpg.flashcards_state[fk] = cur;
      }
    }
    if (body.reminder && typeof body.reminder === 'object') {
      const remTime = String(body.reminder.time || u.rpg.reminder?.time || '20:30');
      u.rpg.reminder = {
        enabled: Boolean(body.reminder.enabled),
        time: /^\d{2}:\d{2}$/.test(remTime) ? remTime : '20:30'
      };
    }
    out = { ok: true, message: 'Đã đồng bộ cài đặt học tập & giao diện!' };
  } else {
    return sendJson(res, 404, { ok: false, message: 'RPG action không tồn tại.' });
  }

  if (!out?.ok) {
    return sendJson(res, out?.status || 400, { ok: false, message: out?.message || 'Thao tác thất bại.', rpg: buildPublicRpgSnapshot(u) });
  }

  u.last_active = new Date().toISOString();
  await redis.set(`${USER_PREFIX}${session.username}`, u);
  try { await redis.sadd('phuc:users:index', session.username); } catch {}
  return sendJson(res, 200, {
    ...out,
    xp: Number(u.xp || 0),
    weekly_xp: Number(u.weekly_xp || 0),
    rpg: buildPublicRpgSnapshot(u)
  });
}

module.exports = async function handler(req, res) {
  try {
    const action = String(req.query?.action || 'overview').toLowerCase();
    const redis = getRedis();
    const session = await getSession(req);

    if (action === 'track-visitor' && (req.method === 'POST' || req.method === 'GET')) {
      const tracked = await trackVisitor(req, res, redis, session);
      if (tracked?.banned) {
        await rejectIfBanned(redis, req, res, session?.username || '');
        return sendJson(res, 403, {
          ok: false,
          banned: true,
          auth_revoked: true,
          warning: false,
          ban_reason: tracked.ban_reason || 'Tài khoản đã bị khóa vĩnh viễn.',
          message: '🚫 Tài khoản bị khóa vĩnh viễn do tái phạm xâm nhập khu vực Admin!'
        });
      }
      if (tracked?.warning) {
        return sendJson(res, 403, {
          ok: false,
          banned: false,
          auth_revoked: false,
          warning: true,
          warning_count: Number(tracked.warning_count || 1),
          strikes_remaining: Number(tracked.strikes_remaining ?? 1),
          warning_title: tracked.warning_title || '⚠️ CẢNH BÁO BẢO MẬT (LẦN DUY NHẤT 1/1)',
          message: tracked.message || 'Cảnh báo lần 1: không được phép mở Admin!'
        });
      }
      if (tracked?.ignored) {
        return sendJson(res, 200, { ok: true, ignored: true, reason: tracked.reason });
      }
      return sendJson(res, 200, {
        ok: true,
        visitor_id: tracked?.vid || '',
        device_type: tracked?.agent?.device_type || 'desktop',
        os: tracked?.agent?.os || 'Khác',
        browser: tracked?.agent?.browser || 'Khác'
      });
    }

    if (action === 'leaderboard' && req.method === 'GET') {
      const now = new Date();
      const currentWeek = vnWeekKey(now);
      const normSessionUser = session?.username ? normalizeUsername(session.username) : '';
      if (normSessionUser && !isGuestUsername(normSessionUser)) {
        const lbBan = await rejectIfBanned(redis, req, res, normSessionUser);
        if (lbBan) {
          return sendJson(res, 403, { ok: false, banned: true, auth_revoked: true, ban_reason: lbBan.reason, locked: true, leaderboard: [], weekly_leaderboard: [], exam_leaderboard: [], message: 'Tài khoản đã bị khóa vĩnh viễn.' });
        }
      }
      const sessionUserObj = (!normSessionUser || isGuestUsername(normSessionUser))
        ? null
        : await getUser(redis, normSessionUser);
      if (!sessionUserObj) {
        return sendJson(res, 401, {
          ok: false,
          locked: true,
          auth_required: true,
          server_time: now.toISOString(),
          week_key: currentWeek,
          leaderboard: [],
          weekly_leaderboard: [],
          exam_leaderboard: [],
          my_rank: null,
          message: 'Tài khoản Khách không được đua Bảng Xếp Hạng. Vui lòng đăng nhập hoặc đăng ký tài khoản để mở khóa!'
        });
      }

      const [rawAttempts, deletedRaw, bannedRaw] = await Promise.all([
        listAttempts(redis),
        redis.smembers('phuc:users:deleted').catch(() => []),
        redis.smembers(BANNED_USERS_SET).catch(() => [])
      ]);
      const extraUsernames = [
        normSessionUser,
        ...rawAttempts.map(a => a?.username).filter(Boolean)
      ];
      const dbUsers = await collectAllUsers(redis, extraUsernames);
      // Tự động chốt sổ nguyên tử (Idempotent) cho tuần trước (Lớp 1 + Lớp 2 Top 100 & 4 Phó Bảng) TRƯỚC khi rollover
      const settledInfo = await bxhEngine.settleFinishedWeeks(redis, dbUsers, now, { userPrefix: USER_PREFIX, isAdminAccount });
      if (settledInfo.settledUsers > 0) {
        const refreshedViewer = dbUsers.find(u => normalizeUsername(u?.username) === normSessionUser);
        if (refreshedViewer) Object.assign(sessionUserObj, refreshedViewer);
      }
      const attempts = await listAllAttempts(redis, dbUsers, rawAttempts);
      const deletedSet = new Set((deletedRaw || []).map(x => normalizeUsername(x)).filter(Boolean));
      const bannedSet = new Set((bannedRaw || []).map(x => normalizeUsername(x)).filter(Boolean));
      const stats = new Map();

      for (const a of attempts) {
        const u = normalizeUsername(a.username);
        if (!u || isGuestUsername(u) || deletedSet.has(u) || bannedSet.has(u)) continue;
        const cur = stats.get(u) || {
          username: u,
          display_name: clean(a.display_name, 50) || u,
          attempts: 0,
          weeklyAttempts: 0,
          totalScore: 0,
          weeklyTotalScore: 0,
          bestScore: 0,
          weeklyBestScore: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          totalExamXp: 0,
          weeklyExamXp: 0,
          updatedAt: a.created_at || ''
        };
        const sc = normScore(a.score);
        const exXp = examXp(sc);
        cur.attempts += 1;
        cur.totalScore += sc;
        cur.bestScore = Math.max(cur.bestScore, sc);
        cur.totalCorrect += Number(a.correct || 0);
        cur.totalQuestions += Number(a.total_questions || 0);
        cur.totalExamXp += exXp;
        if (isWithinCurrentWeek(a.created_at, now)) {
          cur.weeklyAttempts += 1;
          cur.weeklyTotalScore += sc;
          cur.weeklyBestScore = Math.max(cur.weeklyBestScore, sc);
          cur.weeklyExamXp += exXp;
        }
        if ((a.created_at || '') > cur.updatedAt) cur.updatedAt = a.created_at;
        stats.set(u, cur);
      }

      const rowsByUsername = new Map();
      const excludedUsernames = new Set(deletedSet);

      for (const u of dbUsers) {
        const normU = normalizeUsername(u.username);
        if (!normU || deletedSet.has(normU) || u.banned || bannedSet.has(normU)) {
          if (normU) excludedUsernames.add(normU);
          continue;
        }
        if (isAdminAccount(u)) {
          excludedUsernames.add(normU);
          continue;
        }
        const x = stats.get(normU) || {
          username: normU,
          display_name: u.display_name || normU,
          attempts: 0,
          weeklyAttempts: 0,
          totalScore: 0,
          weeklyTotalScore: 0,
          bestScore: 0,
          weeklyBestScore: 0,
          totalCorrect: 0,
          totalQuestions: 0,
          totalExamXp: 0,
          weeklyExamXp: 0,
          updatedAt: u.last_active || u.created_at || ''
        };
        const doneCount = u.progress?.done && typeof u.progress.done === 'object'
          ? Object.values(u.progress.done).filter(Boolean).length
          : 0;
        const fcMap = u.rpg?.flashcards_state && typeof u.rpg.flashcards_state === 'object'
          ? u.rpg.flashcards_state
          : {};
        const masteredFlashcards = Object.values(fcMap).filter(s => s && s.status === 'mastered').length;
        const questionsConquered = Math.max(
          Number(u.rpg?.questions_conquered || 0),
          Number(x.totalCorrect || 0)
        );
        const baseXp = Math.max(0, Number(u.xp || 0));
        const wkXp = u.week_key === currentWeek
          ? Math.max(0, Number(u.weekly_xp || 0), Number(x.weeklyExamXp || 0))
          : Number(x.weeklyExamXp || 0);
        const li = levelInfo(baseXp);
        const accuracy = x.totalQuestions ? Math.round((x.totalCorrect / x.totalQuestions) * 100) : 0;
        const avgScore = x.attempts ? Math.round((x.totalScore / x.attempts) * 100) / 100 : 0;

        const rpgSnap = buildPublicRpgSnapshot(u);
        const bxh = rpgSnap.bxh || {};
        const pv = rpgSnap.privacy || {};
        const soc = rpgSnap.social || {};
        const isAnon = Boolean(pv.anonymous_bxh);
        const primaryGrade = bxhEngine.normalizeGrade(bxh.primary_grade || u.settings?.preferred_grade || '2K9');
        const divisionTierId = bxh.division_by_grade?.[primaryGrade] || 'bronze';
        const divisionTierObj = bxhEngine.DIVISION_MAP.get(divisionTierId) || bxhEngine.DIVISION_TIERS[0];

        // Đồng bộ ĐXH Tuần: nếu học viên có hoạt động trước khi nâng cấp chưa ghi dxh_week, quy đổi công bằng từ hoạt động thực
        let dxhWeek = Math.max(0, Number(bxh.dxh_week || 0));
        if (dxhWeek === 0 && (x.weeklyExamXp > 0 || wkXp > 100)) {
          dxhWeek = Math.min(750, Math.round(Number(x.weeklyExamXp || (wkXp - 100)) * 0.85));
        }

        const hasTrackedStdScores = Array.isArray(bxh.weekly_stats?.std_exam_scores);
        const stdScores = hasTrackedStdScores ? bxh.weekly_stats.std_exam_scores : [];
        const stdCountWeek = hasTrackedStdScores ? stdScores.length : x.weeklyAttempts;
        const stdAvgWeek = hasTrackedStdScores
          ? (stdScores.length ? Math.round((stdScores.reduce((s, it) => s + Number(it.score || 0), 0) / stdScores.length) * 100) / 100 : 0)
          : (x.weeklyAttempts ? Math.round((x.weeklyTotalScore / x.weeklyAttempts) * 100) / 100 : 0);
        const top8StdSum = hasTrackedStdScores
          ? Math.round(stdScores.slice().sort((a, b) => b.score - a.score).slice(0, 8).reduce((s, it) => s + Number(it.score || 0), 0) * 100) / 100
          : Math.round(x.weeklyTotalScore * 100) / 100;

        const validDaysCount = Array.isArray(bxh.valid_days_week) && bxh.valid_days_week.length
          ? bxh.valid_days_week.length
          : (dxhWeek >= 40 ? 1 : 0);
        const wkQ = Number(bxh.weekly_stats?.questions_week || x.totalQuestions || 0);
        const wkC = Number(bxh.weekly_stats?.correct_week || x.totalCorrect || 0);
        const weeklyAccuracy = wkQ > 0 ? Math.round((wkC / wkQ) * 100) : accuracy;

        // Quyền hiển thị Trường / Lớp theo R2 3 mức Safe-by-Default
        const rawSchool = u.settings?.school || '';
        const visibleSchool = bxhEngine.formatVisibleSchool(rawSchool, primaryGrade, pv.school_visibility, isAnon);

        const heroBadgeObj = (rpgSnap.badges_24 || []).find(bd => bd.id === rpgSnap.showcase?.hero_badge) || (rpgSnap.badges_24 || []).find(bd => bd.unlocked) || null;
        const unlockedBadges24 = (rpgSnap.badges_24 || []).filter(bd => bd.unlocked);

        // Điểm Phó Bảng #1 (Đấu Trường 9+ & 1v1): tham gia >= 1 kỳ Đấu Trường 9+ HOẶC hoàn thành >= 3 trận 1v1 hợp lệ
        const duelEloGain = Math.max(0, Number(bxh.weekly_stats?.duel_1v1_elo || 1000) - 1000);
        const arena9PlusScore = (bxh.weekly_stats?.contest_9plus_done ? 120 + Number(bxh.weekly_stats?.contest_9plus_bonus || 0) : 0)
          + Number(bxh.weekly_stats?.duel_1v1_wins || 0) * 45
          + duelEloGain;
        const arena9PlusEligible = Boolean(bxh.weekly_stats?.contest_9plus_done) || Number(bxh.weekly_stats?.duel_1v1_matches || 0) >= 3;

        // Điểm Phó Bảng #2 (Săn Đề GDPT 2018: Top 8 đề chuẩn khác nhau, điều kiện >= 3 đề chuẩn & TB >= 6.5)
        const exam2018Eligible = stdCountWeek >= 3 && stdAvgWeek >= 6.5;

        // Điểm Phó Bảng #3 (Pomodoro 9+ & Chăm Chỉ: >= 6 phiên Pomodoro >= 150 phút VÀ >= 3 ngày hoàn thành 4/4 NV)
        const pomoMinsWeek = Number(bxh.weekly_stats?.pomodoro_verified_mins_week || 0);
        const pomoSessWeek = Number(bxh.weekly_stats?.pomodoro_sessions_week || 0);
        const days4of4Week = Number(bxh.weekly_stats?.daily_4of4_days_week || 0);
        const pomoDisciplineScore = pomoMinsWeek + days4of4Week * 50;
        const pomoDisciplineEligible = pomoSessWeek >= 6 && pomoMinsWeek >= 150 && days4of4Week >= 3;

        // Điểm Phó Bảng #4 (Bứt Phá Tuần: (ĐXH tuần này - mẫu_số) / mẫu_số * accuracy, mẫu_số = max(TB_2_tuần_trước, 300))
        // Loại trừ học viên vừa quay lại từ trạng thái Ngủ Đông (0 ĐXH trong 2 tuần liền trước / đang làm Nhiệm Vụ Hồi Sinh)
        const prev2 = (bxh.prev_weeks_dxh || []).slice(0, 2);
        const avgPrev2 = prev2.length
          ? prev2.reduce((s, it) => s + Number(it.dxh || 0), 0) / prev2.length
          : 0;
        const wasHibernating2Weeks = Boolean(bxh.hibernation?.revival_active) || (prev2.length >= 2 && prev2.every(it => Number(it.dxh || 0) === 0));
        const surgeDenom = Math.max(avgPrev2, 300);
        const realAccuracyFactor = wkQ > 0 ? weeklyAccuracy : (x.attempts > 0 ? accuracy : 0);
        const surgeGrowthPct = dxhWeek > surgeDenom && realAccuracyFactor > 0
          ? Math.round(((dxhWeek - surgeDenom) / surgeDenom) * realAccuracyFactor)
          : 0;
        const weeklySurgeEligible = dxhWeek >= 400 && !wasHibernating2Weeks && realAccuracyFactor > 0;

        rowsByUsername.set(normU, {
          username: normU,
          public_username: isAnon ? `anon_${rpgSnap.anon_sbd}` : normU,
          sbd: isAnon ? (rpgSnap.anon_sbd || rpgSnap.sbd) : (rpgSnap.sbd || `K9-${normU}`),
          real_sbd: rpgSnap.sbd,
          anon_sbd: rpgSnap.anon_sbd,
          is_anonymous: isAnon,
          allow_pomodoro_costudy: pv.allow_pomodoro_costudy || (primaryGrade === '2K12' ? 'friends_only' : 'everyone'),
          _blocked_users: Array.isArray(pv.blocked_users) ? pv.blocked_users : [],
          display_name: isAnon ? `Học viên #${rpgSnap.anon_sbd}` : (u.display_name || x.display_name || normU),
          school: visibleSchool,
          grade: primaryGrade,
          primary_grade: primaryGrade,
          division_tier_id: divisionTierId,
          division_tier_name: divisionTierObj.name,
          division_tier_icon: divisionTierObj.icon,
          cohort: bxh.cohort || 'new_return',
          joined_after_sat18: Boolean(bxh.joined_after_sat18),
          rank_shield_active: Boolean(bxh.rank_shield_active),
          avatar_data: isAnon ? null : (u.avatar_data || u.avatar_url || null),
          xp: baseXp,
          weeklyXp: wkXp,
          dxh_week: dxhWeek,
          dxh_today: Number(bxh.daily_caps?.dxh_today || 0),
          dxh_reached_at: bxh.dxh_reached_at || u.last_active || u.created_at || '',
          first_valid_day_at: bxh.first_valid_day_at || u.created_at || '',
          valid_days_count: validDaysCount,
          std_exams_week_count: stdCountWeek,
          std_exams_week_avg: stdAvgWeek,
          top8_std_exams_sum: top8StdSum,
          weekly_accuracy: weeklyAccuracy,
          arena_9plus_score: arena9PlusScore,
          arena_9plus_eligible: arena9PlusEligible,
          exam_2018_eligible: exam2018Eligible,
          pomo_discipline_score: pomoDisciplineScore,
          pomo_discipline_eligible: pomoDisciplineEligible,
          pomo_mins_week: pomoMinsWeek,
          pomo_hours_total: Number(((soc.pomodoro_total_mins || 0) / 60).toFixed(1)),
          days_4of4_week: days4of4Week,
          surge_growth_pct: surgeGrowthPct,
          weekly_surge_eligible: weeklySurgeEligible,
          level: li.level,
          streak: Math.max(1, Number(bxh.streak_real || u.streak || 1)),
          max_streak: Math.max(1, Number(bxh.max_streak_real || u.streak || 1)),
          xpToNext: li.next - li.into,
          attempts: x.attempts,
          weeklyAttempts: x.weeklyAttempts,
          bestScore: x.bestScore,
          weeklyBestScore: x.weeklyBestScore,
          avgScore,
          accuracy,
          lessonsDone: doneCount,
          masteredFlashcards,
          questionsConquered,
          periodicUnlocked: Number(rpgSnap.periodic?.unlocked_count || 3),
          cheerScore: Number(soc.cheer_score || 0),
          badges: computeBadges({ ...u, xp: baseXp }, x),
          hero_badge: heroBadgeObj ? {
            id: heroBadgeObj.id,
            name: heroBadgeObj.name,
            icon: heroBadgeObj.icon,
            count: heroBadgeObj.count,
            tierName: heroBadgeObj.tierName,
            tierIcon: heroBadgeObj.tierIcon,
            hasWeeklyFx: heroBadgeObj.hasWeeklyFx
          } : null,
          badges_24_unlocked: unlockedBadges24.slice(0, 6).map(bd => ({
            id: bd.id,
            name: bd.name,
            icon: bd.icon,
            count: bd.count,
            tierName: bd.tierName,
            tierIcon: bd.tierIcon
          })),
          rpg_tier: rpgSnap.tier?.name || 'Bậc Đồng',
          rpg_frame: rpgSnap.equipped_details?.frame?.cssClass || 'pk9-frame-bronze',
          rpg_aura: rpgSnap.equipped_details?.aura?.cssClass || '',
          rpg_title: rpgSnap.equipped_details?.title?.name || '',
          rpg_pet: rpgSnap.equipped_details?.pet?.icon || '',
          rpg_pet_id: rpgSnap.equipped_details?.pet?.id || '',
          rpg_outfit: rpgSnap.equipped_details?.outfit?.icon || '',
          rpg_outfit_id: rpgSnap.equipped_details?.outfit?.id || 'outfit-scholar',
          rpg_cardbg: rpgSnap.equipped_details?.cardbg?.cssClass || 'pk9-cardbg-ocean',
          isRegisteredUser: true,
          created_at: u.created_at || '',
          updatedAt: x.updatedAt || u.last_active || u.created_at || ''
        });
      }

      // Registered accounts only — unauthenticated/guest or deleted accounts never enter BXH
      const allRows = Array.from(rowsByUsername.values());

      // Bộ lọc Hệ đào tạo & Hạng Đấu (5 Hệ x 6 Hạng)
      ensureUserRpgState(sessionUserObj, now);
      const viewerNorm = normalizeUsername(sessionUserObj.username);
      const viewerRow = rowsByUsername.get(viewerNorm) || null;
      const requestedGrade = req.query?.grade
        ? bxhEngine.normalizeGrade(req.query.grade)
        : (viewerRow?.primary_grade || bxhEngine.normalizeGrade(sessionUserObj.rpg?.bxh?.primary_grade || sessionUserObj.settings?.preferred_grade || '2K9'));
      const requestedDivision = req.query?.division && bxhEngine.DIVISION_MAP.has(String(req.query.division).toLowerCase())
        ? String(req.query.division).toLowerCase()
        : (sessionUserObj.rpg?.bxh?.division_by_grade?.[requestedGrade] || 'bronze');

      // TẦNG 1: BXH BẢNG ĐẤU 30 NGƯỜI (Cùng Hệ + Cùng Hạng Đấu + Nhóm Cohort Mức Độ Chăm Chỉ, xếp theo Tie-Breaker 5 bậc)
      // Loại trừ tài khoản ở Bảng Khởi Động Cuối Tuần (joined_after_sat18) khỏi Bục Podium Tầng 1 để đồng bộ 100% với chốt sổ Thứ Hai
      const gradeRows = allRows.filter(r => r.primary_grade === requestedGrade);
      const rawDivisionCandidates = gradeRows
        .filter(r => !r.joined_after_sat18 && r.division_tier_id === requestedDivision && (r.dxh_week > 0 || r.username === viewerNorm || gradeRows.length <= 30));

      // Nếu bảng có > 30 người, ưu tiên gom theo Cohort (diligent / medium / new_return) trước rồi mới chia cụm 30 người
      const viewerCohort = viewerRow?.cohort || sessionUserObj.rpg?.bxh?.cohort || 'new_return';
      let divisionCandidates = rawDivisionCandidates.slice().sort(bxhEngine.compareWeeklyTieBreaker);
      if (rawDivisionCandidates.length > 30) {
        const sameCohort = rawDivisionCandidates.filter(r => r.cohort === viewerCohort);
        if (sameCohort.length >= 6) {
          divisionCandidates = sameCohort.sort(bxhEngine.compareWeeklyTieBreaker);
        }
      }

      // Chia bảng 30 người theo Cohort (luôn ưu tiên bảng chứa học viên đang xem)
      let myDivisionGroup = divisionCandidates.slice(0, 30);
      if (divisionCandidates.length > 30 && viewerRow && viewerRow.primary_grade === requestedGrade && viewerRow.division_tier_id === requestedDivision) {
        const vIdx = divisionCandidates.findIndex(r => r.username === viewerNorm);
        if (vIdx >= 0) {
          const groupIndex = Math.floor(vIdx / 30);
          myDivisionGroup = divisionCandidates.slice(groupIndex * 30, (groupIndex + 1) * 30);
        }
      }
      const totalInDivision = myDivisionGroup.length;
      const tier1DivisionRows = myDivisionGroup.map((row, idx) => {
        const rk = idx + 1;
        const standing = bxhEngine.evaluateDivisionStanding(rk, totalInDivision, requestedDivision, row.dxh_week, row.rank_shield_active);
        const reward = bxhEngine.computeDivisionReward(requestedDivision, rk, row.dxh_week, totalInDivision);
        return { ...row, rank: rk, standing, expected_reward: reward };
      });

      // TẦNG 2: BXH TOÀN HỆ TOP 100 (Tuần theo ĐXH + Tích Lũy theo EXP)
      const sortedGradeWeekly = gradeRows.slice().sort(bxhEngine.compareWeeklyTieBreaker);
      const tier2WeeklyTop100 = sortedGradeWeekly.slice(0, 100).map((row, idx) => ({ ...row, rank: idx + 1 }));
      const sortedGradeAllTime = gradeRows.slice().sort((a, b) => b.xp - a.xp || b.bestScore - a.bestScore || b.attempts - a.attempts || b.streak - a.streak);
      const tier2AllTimeTop100 = sortedGradeAllTime.slice(0, 100).map((row, idx) => ({ ...row, rank: idx + 1 }));

      // TẦNG 3: 4 PHÓ BẢNG CHUYÊN ĐỀ TUẦN (Tuân thủ điều kiện chuẩn R1 Mục 2.3)
      const sub1Cand = gradeRows.filter(r => r.arena_9plus_eligible);
      const sub1Pool = sub1Cand.length > 0 ? sub1Cand : gradeRows.filter(r => r.arena_9plus_score > 0);
      const sub1Arena = sub1Pool
        .sort((a, b) => (b.arena_9plus_eligible ? 1 : 0) - (a.arena_9plus_eligible ? 1 : 0) || b.arena_9plus_score - a.arena_9plus_score || bxhEngine.compareWeeklyTieBreaker(a, b))
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1, sub_metric: `${row.arena_9plus_score} điểm chiến tích` }));

      const sub2Cand = gradeRows.filter(r => r.exam_2018_eligible);
      const sub2Pool = sub2Cand.length > 0 ? sub2Cand : gradeRows.filter(r => r.std_exams_week_count >= 1 && r.std_exams_week_avg >= 6.5);
      const sub2Exam2018 = sub2Pool
        .sort((a, b) => (b.exam_2018_eligible ? 1 : 0) - (a.exam_2018_eligible ? 1 : 0) || b.top8_std_exams_sum - a.top8_std_exams_sum || b.std_exams_week_avg - a.std_exams_week_avg)
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1, sub_metric: `Top 8 đề: ${row.top8_std_exams_sum.toFixed(1)}đ (TB ${row.std_exams_week_avg.toFixed(2)}đ • ${row.std_exams_week_count} đề)` }));

      const sub3Cand = gradeRows.filter(r => r.pomo_discipline_eligible);
      const sub3Pool = sub3Cand.length > 0 ? sub3Cand : gradeRows.filter(r => r.pomo_discipline_score > 0);
      const sub3Pomodoro = sub3Pool
        .sort((a, b) => (b.pomo_discipline_eligible ? 1 : 0) - (a.pomo_discipline_eligible ? 1 : 0) || b.pomo_discipline_score - a.pomo_discipline_score || b.streak - a.streak || bxhEngine.compareWeeklyTieBreaker(a, b))
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1, sub_metric: `${row.pomo_mins_week}p Pomodoro • ${row.days_4of4_week} ngày 4/4 NV` }));

      const sub4Cand = gradeRows.filter(r => r.weekly_surge_eligible && r.surge_growth_pct > 0);
      const sub4Pool = sub4Cand.length > 0 ? sub4Cand : gradeRows.filter(r => r.weekly_surge_eligible);
      const sub4Surge = sub4Pool
        .sort((a, b) => b.surge_growth_pct - a.surge_growth_pct || bxhEngine.compareWeeklyTieBreaker(a, b))
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1, sub_metric: `+${row.surge_growth_pct}% Bứt phá (${row.dxh_week} ĐXH • CX ${row.weekly_accuracy}%)` }));

      // Legacy 3 arrays preserved for 100% compatibility
      const sortedTop = allRows
        .slice()
        .sort((a, b) => b.xp - a.xp || b.bestScore - a.bestScore || b.attempts - a.attempts || b.streak - a.streak);
      const topLeaderboard = sortedTop
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      const sortedWeekly = allRows
        .slice()
        .sort(bxhEngine.compareWeeklyTieBreaker);
      const weeklyLeaderboard = sortedWeekly
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      const sortedExam = allRows
        .slice()
        .filter(r => r.attempts > 0 || r.bestScore > 0)
        .sort((a, b) => b.bestScore - a.bestScore || b.avgScore - a.avgScore || b.attempts - a.attempts || b.xp - a.xp);
      const examLeaderboard = sortedExam
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      let myRank = null;
      let myBxhStatus = null;
      if (session?.username) {
        const u = normalizeUsername(session.username);
        const isSessionAdm = excludedUsernames.has(u) || isAdminUsername(u);
        const topIdx = isSessionAdm ? -1 : sortedTop.findIndex(r => r.username === u);
        const wkIdx = isSessionAdm ? -1 : sortedWeekly.findIndex(r => r.username === u);
        const exIdx = isSessionAdm ? -1 : sortedExam.findIndex(r => r.username === u);
        const divIdx = isSessionAdm ? -1 : tier1DivisionRows.findIndex(r => r.username === u);
        const sysWkIdx = isSessionAdm ? -1 : sortedGradeWeekly.findIndex(r => r.username === u);
        myRank = {
          username: u,
          is_admin: isSessionAdm,
          excluded_from_leaderboard: isSessionAdm,
          topRank: topIdx >= 0 ? topIdx + 1 : null,
          weeklyRank: wkIdx >= 0 ? wkIdx + 1 : null,
          examRank: exIdx >= 0 ? exIdx + 1 : null,
          divisionRank: divIdx >= 0 ? divIdx + 1 : null,
          systemWeeklyRank: sysWkIdx >= 0 ? sysWkIdx + 1 : null,
          entry: isSessionAdm ? null : (rowsByUsername.get(u) || null)
        };

        // Rival Pin & Nhắc Nhở "Đuổi Bắt Top Trên" (R4 Loop 2 — Chặn 2 chiều trên cả pinned & auto_above)
        const myDxh = Number(viewerRow?.dxh_week || sessionUserObj.rpg?.bxh?.dxh_week || 0);
        const myBlockedSet = new Set(sessionUserObj.rpg?.privacy?.blocked_users || []);
        const isMutuallyBlocked = rowObj => !rowObj || myBlockedSet.has(rowObj.username) || (Array.isArray(rowObj._blocked_users) && rowObj._blocked_users.includes(u));
        const pinnedRivalNames = (sessionUserObj.rpg?.social?.rivals || []).filter(rv => !myBlockedSet.has(rv));
        const rivalsHud = [];
        for (const rName of pinnedRivalNames) {
          const rRow = rowsByUsername.get(rName);
          if (rRow && !isMutuallyBlocked(rRow)) {
            const gap = rRow.dxh_week - myDxh;
            rivalsHud.push({
              type: 'pinned',
              username: rRow.is_anonymous ? '' : rRow.username,
              sbd: rRow.sbd,
              display_name: rRow.display_name,
              dxh_week: rRow.dxh_week,
              gap,
              overtaken: gap < 0,
              nudge: gap > 0
                ? bxhEngine.buildActionableDxhNudge(rRow.display_name, gap)
                : `🎉 Bạn đang dẫn trước Đối thủ ${rRow.display_name} ${Math.abs(gap)} ĐXH Tuần — giữ vững phong độ nhé!`
            });
          }
        }
        // Tự động chọn 1-2 người đứng ngay trên bạn trong Bảng Đấu 30 người (loại trừ người đã chặn 2 chiều)
        if (divIdx > 0) {
          for (let up = Math.max(0, divIdx - 2); up < divIdx; up++) {
            const aboveRow = tier1DivisionRows[up];
            if (aboveRow && !isMutuallyBlocked(aboveRow) && !rivalsHud.some(x => x.sbd === aboveRow.sbd)) {
              const gap = Math.max(5, aboveRow.dxh_week - myDxh);
              rivalsHud.push({
                type: 'auto_above',
                username: aboveRow.is_anonymous ? '' : aboveRow.username,
                sbd: aboveRow.sbd,
                display_name: aboveRow.display_name,
                rank: aboveRow.rank,
                dxh_week: aboveRow.dxh_week,
                gap,
                overtaken: false,
                nudge: bxhEngine.buildActionableDxhNudge(`${aboveRow.display_name} (Hạng #${aboveRow.rank})`, gap)
              });
            }
          }
        }

        // Study Squad hiện tại
        let squadDetail = null;
        const sqCode = sessionUserObj.rpg?.social?.squad_code;
        if (sqCode) {
          const sqRaw = safeParseObj(await redis.get(`phuc:rpg:squad:${currentWeek}:${sqCode}`).catch(() => null));
          if (sqRaw) {
            squadDetail = {
              ...sqRaw,
              member_details: (sqRaw.members || []).map(m => {
                const mRow = rowsByUsername.get(m);
                return {
                  username: m,
                  display_name: mRow?.display_name || m,
                  dxh_week: Number(mRow?.dxh_week || 0),
                  reached_550: Number(mRow?.dxh_week || 0) >= 550
                };
              })
            };
          }
        }

        const myDivEntry = divIdx >= 0 ? tier1DivisionRows[divIdx] : null;
        if (!isSessionAdm && !settledInfo?.inProgress && sessionUserObj?.rpg?.bxh && divIdx >= 0) {
          const curRank = divIdx + 1;
          let shouldPersistViewerBxh = false;
          if (sessionUserObj.rpg.bxh.current_division_rank !== curRank || sessionUserObj.rpg.bxh.current_division_total !== totalInDivision) {
            sessionUserObj.rpg.bxh.current_division_rank = curRank;
            sessionUserObj.rpg.bxh.current_division_total = totalInDivision;
            shouldPersistViewerBxh = true;
          }
          // Lưu thứ hạng Thứ Năm (hoặc đầu tuần Thứ Hai - Thứ Năm) để xét Badge Chiến Thần Ngược Dòng (hạng 21-30 lên Top 10)
          const vnDow = new Date(now.getTime() + 7 * 3600 * 1000).getUTCDay();
          if (vnDow >= 1 && vnDow <= 4 && (!sessionUserObj.rpg.bxh.thursday_rank || curRank > sessionUserObj.rpg.bxh.thursday_rank)) {
            sessionUserObj.rpg.bxh.thursday_rank = curRank;
            shouldPersistViewerBxh = true;
          }
          // Ghi nhận Overtake Moment (Khoảnh khắc vượt mặt Rival)
          const overtakenList = rivalsHud.filter(r => r.overtaken).map(r => r.display_name);
          if (overtakenList.length > 0) {
            sessionUserObj.rpg.social.overtake_alerts = overtakenList;
          }
          if (shouldPersistViewerBxh) {
            await redis.set(`${USER_PREFIX}${u}`, sessionUserObj).catch(() => {});
          }
        }
        myBxhStatus = {
          dxh_week: myDxh,
          dxh_today: Number(sessionUserObj.rpg?.bxh?.daily_caps?.dxh_today || 0),
          daily_cap: bxhEngine.getGlobalDailyDxhCap(now),
          is_weekend_surge: bxhEngine.isWeekendVn(now),
          primary_grade: sessionUserObj.rpg?.bxh?.primary_grade || '2K9',
          primary_grade_locked: Boolean(sessionUserObj.rpg?.bxh?.primary_grade_locked),
          division_by_grade: sessionUserObj.rpg?.bxh?.division_by_grade || {},
          division_tier_id: requestedDivision,
          division_rank: divIdx >= 0 ? divIdx + 1 : null,
          division_total: totalInDivision,
          standing: myDivEntry?.standing || { zone: 'safe', label: '🛡️ Trụ hạng an toàn' },
          expected_reward: myDivEntry?.expected_reward || null,
          last_weekly_settlement: sessionUserObj.rpg?.bxh?.last_weekly_settlement || null,
          rank_shield_count: Number(sessionUserObj.rpg?.bxh?.rank_shield_count || 0),
          rank_shield_active: Boolean(sessionUserObj.rpg?.bxh?.rank_shield_active),
          hibernation: sessionUserObj.rpg?.bxh?.hibernation || null,
          chests: bxhEngine.WEEKLY_MILESTONE_CHESTS.map(c => ({
            ...c,
            unlocked: myDxh >= c.targetDxh,
            claimed: Boolean(sessionUserObj.rpg?.bxh?.chests_claimed?.[c.id]),
            progressPct: Math.min(100, Math.round((myDxh / c.targetDxh) * 100))
          })),
          rivals_hud: rivalsHud,
          duel_inbox: (sessionUserObj.rpg?.social?.duel_inbox || []).filter(inv => Number(inv?.expires_at || 0) > now.getTime()),
          study_squad: squadDetail
        };
      }

      // Ẩn tuyệt đối username gốc & real_sbd cho tài khoản bật "Ẩn danh BXH" (trừ chính chủ) để ngăn đối chiếu ngược qua DevTools/API
      const sanitizeRowForViewer = row => {
        if (!row) return row;
        const { _blocked_users, real_sbd, ...rest } = row;
        const isSelfRow = row.username === viewerNorm;
        const blockedByPeer = Array.isArray(_blocked_users) && _blocked_users.includes(viewerNorm);
        const outRow = {
          ...rest,
          blocked_by_peer: blockedByPeer,
          is_self: isSelfRow
        };
        if (row.is_anonymous && !isSelfRow) {
          outRow.username = `anon_${row.anon_sbd || row.sbd}`;
        }
        return outRow;
      };
      const sanitizeList = list => (Array.isArray(list) ? list.map(sanitizeRowForViewer) : []);
      if (myRank && myRank.entry) {
        myRank.entry = sanitizeRowForViewer(myRank.entry);
      }

      return sendJson(res, 200, {
        ok: true,
        locked: false,
        server_time: now.toISOString(),
        week_key: currentWeek,
        active_grade: requestedGrade,
        active_division: requestedDivision,
        grades_5: bxhEngine.GRADES_5,
        division_tiers: bxhEngine.DIVISION_TIERS,
        division_reward_table: bxhEngine.DIVISION_REWARD_TABLE,
        weekly_chests_def: bxhEngine.WEEKLY_MILESTONE_CHESTS,
        sub_leaderboards_def: bxhEngine.SUB_LEADERBOARDS_DEF,
        badges_24_def: bxhEngine.BADGES_24,
        total_students: allRows.length,
        total_in_grade: gradeRows.length,
        tier1_division: {
          grade: requestedGrade,
          division_tier_id: requestedDivision,
          total_members: totalInDivision,
          max_capacity: 30,
          is_after_sat18_lock: bxhEngine.isAfterSaturday18Vn(now),
          rows: sanitizeList(tier1DivisionRows)
        },
        tier2_system_top100: {
          grade: requestedGrade,
          weekly_top100: sanitizeList(tier2WeeklyTop100),
          alltime_top100: sanitizeList(tier2AllTimeTop100)
        },
        tier3_sub_leaderboards: {
          arena_9plus: sanitizeList(sub1Arena),
          exam_gdpt2018: sanitizeList(sub2Exam2018),
          pomodoro_discipline: sanitizeList(sub3Pomodoro),
          weekly_surge: sanitizeList(sub4Surge)
        },
        my_bxh_status: myBxhStatus,
        leaderboard: sanitizeList(topLeaderboard),
        weekly_leaderboard: sanitizeList(weeklyLeaderboard),
        exam_leaderboard: sanitizeList(examLeaderboard),
        my_rank: myRank
      });
    }

    // Endpoint chốt sổ tuần chủ động (Admin hoặc Vercel Cron Thứ Hai 00:05 UTC+7)
    if (action === 'settle-week' && (req.method === 'POST' || req.method === 'GET')) {
      const cronSecret = String(process.env.CRON_SECRET || '').trim();
      const authHeader = String(req.headers?.authorization || '');
      let isValidCron = false;
      if (cronSecret) {
        const expectedBuf = Buffer.from(`Bearer ${cronSecret}`);
        const actualBuf = Buffer.from(authHeader);
        if (actualBuf.length === expectedBuf.length) {
          isValidCron = crypto.timingSafeEqual(actualBuf, expectedBuf);
        }
      }
      if (!isValidCron) {
        const guard = await requireAdminOrBanIntruder(redis, req, res, session, { source: 'dashboard:settle-week' });
        if (!guard.ok) return sendAdminGuardError(res, guard);
      }
      const allUsers = await collectAllUsers(redis);
      const result = await bxhEngine.settleFinishedWeeks(redis, allUsers, new Date(), { userPrefix: USER_PREFIX, isAdminAccount });
      return sendJson(res, 200, {
        ok: true,
        ...result,
        message: result.settledUsers > 0
          ? `✅ Đã chốt sổ tuần ${result.settledWeeks.join(', ')} và phát quà Lớp 1 + Lớp 2 cho ${result.settledUsers} học viên!`
          : 'Không có tuần cũ nào cần chốt sổ.'
      });
    }

    if (action === 'record-exam' && req.method === 'POST') {
      if (!session?.username || isGuestUsername(session.username)) {
        return sendJson(res, 401, { ok: false, auth_required: true, message: 'Hãy đăng nhập hoặc đăng ký tài khoản để lưu kết quả và đua BXH!' });
      }
      const csrf = session.csrf || await getCsrf(req, res);
      if (!requireCsrf(req, session, csrf)) return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }

      const normUser = normalizeUsername(session.username);
      const exBan = await rejectIfBanned(redis, req, res, normUser);
      if (exBan) return sendJson(res, 403, { ok: false, banned: true, auth_revoked: true, ban_reason: exBan.reason, message: 'Tài khoản đã bị khóa vĩnh viễn.' });
      const uProfile = await getUser(redis, normUser);
      if (!uProfile) {
        return sendJson(res, 401, { ok: false, auth_required: true, message: 'Tài khoản không hợp lệ hoặc chưa đăng ký. Vui lòng đăng nhập lại!' });
      }

      const attemptId = clean(body.attempt_id, 160);
      let storedAttempt = null;
      if (attemptId) {
        try {
          storedAttempt = await redis.get(`phuc:exam:attempt:${attemptId}`);
          if (typeof storedAttempt === 'string') storedAttempt = JSON.parse(storedAttempt);
        } catch {
          storedAttempt = null;
        }
      }
      const score = storedAttempt?.result
        ? normScore(storedAttempt.result.score)
        : normScore(body.score);
      const subject = clean(storedAttempt?.exam?.subject || body.subject || 'Toán', 40);
      const examId = clean(storedAttempt?.exam?.id || storedAttempt?.examId || body.exam_id || 'exam', 100);
      const title = clean(storedAttempt?.exam?.title || body.title || 'Đề luyện thi Phúc K9', 180);
      const grade = clean(storedAttempt?.exam?.grade || body.grade || gradeLabel(subject, uProfile?.settings?.preferred_grade), 20);
      const correct = storedAttempt?.result
        ? Number(storedAttempt.result.correct || 0)
        : Number(body.correct || 0) || 0;
      const totalQuestions = storedAttempt?.result
        ? Number(storedAttempt.result.total || 0)
        : (Number(body.total_questions || body.total || 0) || 20);
      const sections = storedAttempt?.result?.sections || (body.sections && typeof body.sections === 'object' ? body.sections : {});
      const topicStats = Array.isArray(storedAttempt?.result?.topicStats) ? storedAttempt.result.topicStats : [];
      const rawReview = Array.isArray(body.review) ? body.review.slice(0, 40) : [];
      const review = rawReview.map(item => ({
        id: clean(item?.id || '', 80),
        topic: clean(item?.topic || '', 80),
        status: clean(item?.status || (item?.correct ? 'correct' : 'wrong'), 16),
        correct: Boolean(item?.correct || item?.status === 'correct')
      }));

      const attempt = {
        attempt_id: attemptId || `att-${Date.now()}`,
        username: normUser,
        display_name: clean(uProfile?.display_name || body.display_name || normUser, 80),
        exam_id: examId,
        title,
        subject,
        grade,
        score,
        correct,
        total_questions: totalQuestions,
        created_at: new Date().toISOString(),
        sections,
        topicStats,
        review
      };

      const baseKey = attemptId
        ? `phuc:xp:exam:${normUser}:${attemptId}`
        : `phuc:xp:exam:${normUser}:${crypto.createHash('sha1').update(JSON.stringify({ examId, score, correct, total: totalQuestions })).digest('hex')}`;

      let xpEarned = 0, goldEarned = 0, diamondsEarned = 0, dxhEarned = 0, dxhNote = '', duplicate = false;
      try {
        const u = uProfile || await getUser(redis, normUser);
        const isAdm = isAdminAccount(u) || isAdminUsername(normUser);
        const candidateXp = isAdm ? 0 : examXp(score);
        const granted = !!(await redis.set(baseKey, JSON.stringify({
          xp_earned: candidateXp,
          gold_earned: 0,
          diamonds_earned: 0,
          dxh_earned: 0,
          dxh_note: '',
          recorded_by: 'record-exam'
        }), { nx: true, ex: 60 * 60 * 24 * 365 }));
        if (granted) {
          await redis.lpush(ATTEMPTS_KEY, JSON.stringify(attempt));
          try { await redis.ltrim(ATTEMPTS_KEY, 0, MAX_ATTEMPTS - 1); } catch {}
          xpEarned = candidateXp;
          if (u) {
            const rpg = ensureUserRpgState(u);
            rpg.daily.exam_count = Number(rpg.daily.exam_count || 0) + 1;
            rpg.questions_conquered = Number(rpg.questions_conquered || 0) + Math.max(0, correct);
            const eco = applyRewardMultipliers(u, 25 + Math.round(score * 3), 0, score >= 8 ? 2 : 1, isAdm);
            goldEarned = eco.gold;
            diamondsEarned = eco.diamonds;
            const srsList = Array.isArray(storedAttempt?.result?.review) ? storedAttempt.result.review : review;
            for (const item of (srsList || []).slice(0, 40)) {
              if (item?.id) {
                recordSrsAnswer(u, item.id, Boolean(item.status === 'correct' || item.correct === true), {
                  topic: item.topic || '',
                  subject
                });
              }
            }
            if (!isAdm) {
              const wk = vnWeekKey();
              if (u.week_key !== wk) {
                u.week_key = wk;
                u.weekly_xp = 0;
              }
              u.xp = Math.max(100, Number(u.xp || 0)) + xpEarned;
              u.weekly_xp = Math.max(0, Number(u.weekly_xp || 0)) + xpEarned;
              u.exam_xp = Math.max(0, Number(u.exam_xp || 0)) + xpEarned;
              u.streak = Math.max(1, Number(u.streak || 1));
              u.badges = computeBadges(u, { bestScore: score, attempts: 1 });
              const dxhRes = bxhEngine.recordExamDxhAndStats(
                u,
                {
                  id: examId,
                  title,
                  grade,
                  duration: storedAttempt?.exam?.duration || body.duration || body.duration_min || 50,
                  source: storedAttempt?.exam?.source || ''
                },
                {
                  score,
                  correct,
                  total: totalQuestions || 20,
                  answered: storedAttempt?.result?.answered ?? body.answered ?? (totalQuestions || 20),
                  elapsed_sec: (storedAttempt && Number.isFinite(Number(storedAttempt.startedAt)))
                    ? Math.max(0, Math.round((Number(storedAttempt.submittedAt || Date.now()) - Number(storedAttempt.startedAt)) / 1000))
                    : body.elapsed_sec
                }
              );
              dxhEarned = Number(dxhRes?.dxhGranted || 0);
              if (dxhRes?.message) dxhNote = dxhRes.message;
            }
            u.last_active = new Date().toISOString();
            await redis.set(`${USER_PREFIX}${normUser}`, u);
            try { await redis.sadd('phuc:users:index', normUser); } catch {}
            await redis.set(baseKey, JSON.stringify({
              xp_earned: xpEarned,
              gold_earned: goldEarned,
              diamonds_earned: diamondsEarned,
              dxh_earned: dxhEarned,
              dxh_note: dxhNote,
              recorded_by: 'record-exam'
            }), { ex: 60 * 60 * 24 * 365 });
          }
        } else {
          const prevGrant = safeParseObj(await redis.get(baseKey).catch(() => null));
          if (prevGrant && prevGrant.recorded_by === 'exams') {
            xpEarned = Number(prevGrant.xp_earned || 0);
            goldEarned = Number(prevGrant.gold_earned || 0);
            diamondsEarned = Number(prevGrant.diamonds_earned || 0);
            dxhEarned = Number(prevGrant.dxh_earned || 0);
            dxhNote = String(prevGrant.dxh_note || '');
            duplicate = false;
            await redis.set(baseKey, JSON.stringify({
              ...prevGrant,
              recorded_by: 'both'
            }), { ex: 60 * 60 * 24 * 365 });
          } else {
            duplicate = true;
          }
        }
      } catch (e) {
        console.warn('exam-xp', e?.message);
      }

      const u = await getUser(redis, normUser);
      const xpTotal = Math.max(0, Number(u?.xp || 0));
      const weeklyXp = Math.max(0, Number(u?.weekly_xp || 0));
      const li = levelInfo(xpTotal);
      return sendJson(res, 200, {
        ok: true,
        saved: true,
        score,
        xp_earned: xpEarned,
        gold_earned: goldEarned,
        diamonds_earned: diamondsEarned,
        dxh_earned: dxhEarned,
        dxh_note: dxhNote,
        xp_total: xpTotal,
        weekly_xp: weeklyXp,
        level: li.level,
        rpg: u ? buildPublicRpgSnapshot(u) : null,
        duplicate
      });
    }

    if (action === 'record-study' && req.method === 'POST') {
      if (!session?.username || isGuestUsername(session.username)) {
        return sendJson(res, 401, { ok: false, auth_required: true, message: 'Tài khoản Khách không thể tích XP lên BXH. Hãy đăng nhập hoặc đăng ký!' });
      }
      const csrf = session.csrf || await getCsrf(req, res);
      if (!requireCsrf(req, session, csrf)) return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }
      const studyType = clean(body.type || 'lesson', 40);
      const itemId = clean(body.item_id || body.lesson_id || `study-${Date.now()}`, 120);
      const xpReward = studyType === 'flashcard' ? 20 : studyType === 'quiz' ? 30 : 25;
      const normUser = normalizeUsername(session.username);
      const studyBan = await rejectIfBanned(redis, req, res, normUser);
      if (studyBan) return sendJson(res, 403, { ok: false, banned: true, auth_revoked: true, ban_reason: studyBan.reason, message: 'Tài khoản đã bị khóa vĩnh viễn.' });
      const key = `phuc:xp:study:${normUser}:${studyType}:${itemId}`;
      let xpEarned = 0, goldEarned = 0, duplicate = false;
      const u = await getUser(redis, normUser);
      if (!u) return sendJson(res, 401, { ok: false, auth_required: true, message: 'Không tìm thấy tài khoản.' });
      const isAdm = isAdminAccount(u);
      const wk = vnWeekKey();
      if (u.week_key !== wk) {
        u.week_key = wk;
        u.weekly_xp = 0;
      }
      const rpg = ensureUserRpgState(u);
      let stateMutated = false;
      const caps = rpg.bxh.daily_caps;

      // Kiểm tra Quality Gate Flashcard TRƯỚC khi đánh dấu mastered hay đốt khóa NX 180 ngày (chống view_sec=0 & sai Micro-Check)
      if (studyType === 'flashcard' && itemId) {
        const viewSec = (body.view_sec !== undefined && body.view_sec !== null && body.view_sec !== '')
          ? Number(body.view_sec)
          : 6;
        if (body.micro_check_failed) {
          if (!Array.isArray(caps.srs_blocked_ids_today)) caps.srs_blocked_ids_today = [];
          if (!caps.srs_blocked_ids_today.includes(itemId)) caps.srs_blocked_ids_today.push(itemId);
          recordSrsAnswer(u, itemId, false, { topic: body.topic || 'Flashcard 3D', subject: body.subject || 'Tổng hợp' });
          u.last_active = new Date().toISOString();
          await redis.set(`${USER_PREFIX}${normUser}`, u);
          const liFail = levelInfo(u.xp);
          return sendJson(res, 200, {
            ok: true,
            xp_earned: 0,
            dxh_earned: 0,
            dxh_note: 'Thẻ sai Micro-Check đã chuyển vào Sổ Ôn SRS (tính ĐXH SRS từ ngày mai).',
            gold_earned: 0,
            xp_total: Number(u.xp || 0),
            weekly_xp: Number(u.weekly_xp || 0),
            level: liFail.level,
            rpg: buildPublicRpgSnapshot(u),
            duplicate: false
          });
        }
        if (!Number.isFinite(viewSec) || viewSec < 6) {
          const liShort = levelInfo(u.xp);
          return sendJson(res, 200, {
            ok: true,
            xp_earned: 0,
            dxh_earned: 0,
            dxh_note: 'Cần xem thẻ tối thiểu 6 giây (lật đủ 2 mặt) để ghi nhận điểm học thật.',
            gold_earned: 0,
            xp_total: Number(u.xp || 0),
            weekly_xp: Number(u.weekly_xp || 0),
            level: liShort.level,
            rpg: buildPublicRpgSnapshot(u),
            duplicate: false
          });
        }
      }

      if (studyType === 'lesson' && itemId && body.mark_done !== false) {
        u.progress = u.progress && typeof u.progress === 'object' ? u.progress : { done: {}, resume: null, notes: {} };
        u.progress.done = u.progress.done && typeof u.progress.done === 'object' ? u.progress.done : {};
        if (!u.progress.done[itemId]) {
          u.progress.done[itemId] = true;
          stateMutated = true;
        }
      } else if (studyType === 'flashcard' && itemId) {
        const curFc = rpg.flashcards_state[itemId] || {};
        if (curFc.status !== 'mastered') {
          curFc.status = 'mastered';
          curFc.updatedAt = new Date().toISOString();
          rpg.flashcards_state[itemId] = curFc;
          stateMutated = true;
        }
      }
      const granted = !!(await redis.set(key, '1', { nx: true, ex: 60 * 60 * 24 * 180 }));
      let dxhEarned = 0;
      let dxhNote = '';
      if (granted) {
        rpg.daily.study_count = Number(rpg.daily.study_count || 0) + 1;
        if (studyType === 'flashcard') {
          // R5 Mục 1 Dòng 1: Thẻ 1-20: +8 ĐXH, 20 EXP, 15 Vàng; Thẻ 21-40: 0 ĐXH, 5 EXP, 0 Vàng; Thẻ >40: 0 ĐXH, 0 EXP, 0 Vàng
          caps.flashcards_total_today = Number(caps.flashcards_total_today || caps.flashcards_today || 0) + 1;
          const fcOrd = caps.flashcards_total_today;
          if (fcOrd <= 20 && caps.flashcards_today < 20) {
            caps.flashcards_today += 1;
            xpEarned = isAdm ? 0 : 20;
            goldEarned = applyRewardMultipliers(u, 15, 0, 0, isAdm).gold;
            if (!isAdm) {
              const dRes = bxhEngine.grantWeeklyDxh(u, 8, { source: 'flashcard_3d' });
              dxhEarned = dRes.grantedDxh;
              if (dRes.capped) dxhNote = `Đã chạm trần tổng ${dRes.dailyCap} ĐXH/ngày.`;
            }
          } else if (fcOrd <= 40) {
            xpEarned = isAdm ? 0 : 5;
            goldEarned = 0;
            dxhNote = 'Đã qua 20 thẻ nhận ĐXH hôm nay (thẻ 21–40 nhận +5 EXP).';
          } else {
            xpEarned = 0;
            goldEarned = 0;
            dxhNote = 'Đã đạt trần 40 thẻ Flashcards/ngày.';
          }
        } else if (studyType === 'pdf') {
          // R5 Mục 1 Dòng 3: Đọc >= 80% số trang, qua câu kiểm tra & lưu ghi chú tóm tắt ngắn
          const readRatioOk = Number(body.read_ratio ?? 1) >= 0.8;
          const quizPassed = body.checkpoint_failed !== true && Number(body.checkpoint_attempts ?? 1) <= 2;
          const hasMeaningfulNote = body.note_saved !== false;
          xpEarned = isAdm ? 0 : xpReward;
          goldEarned = applyRewardMultipliers(u, 15, 0, 0, isAdm).gold;
          if (!isAdm && caps.pdfs_today < 3 && readRatioOk && quizPassed && hasMeaningfulNote) {
            caps.pdfs_today += 1;
            rpg.bxh.badge_counters['badge-video-pdf-scholar'] = Number(rpg.bxh.badge_counters['badge-video-pdf-scholar'] || 0) + 1;
            dxhEarned = bxhEngine.grantWeeklyDxh(u, 10, { source: 'pdf_pro' }).grantedDxh;
          } else if (!isAdm && caps.pdfs_today >= 3) {
            dxhNote = 'Đã đạt trần 3 tài liệu PDF Pro nhận ĐXH hôm nay.';
          } else if (!isAdm && (!readRatioOk || !quizPassed || !hasMeaningfulNote)) {
            dxhNote = 'Cần đọc >= 80% trang PDF và lưu ghi chú tóm tắt để nhận +10 ĐXH Tuần.';
          }
        } else {
          // R5 Mục 1 Dòng 2: Video bài giảng: xem thực >= 80% thời lượng ở tốc độ <= 2.0x (tab không bị ẩn/tắt tiếng), trả lời đúng câu checkpoint tối đa 2 lần thử
          const watchRatioOk = Number(body.watch_ratio ?? 1) >= 0.8;
          const speedOk = Number(body.playback_rate ?? 1) <= 2.0;
          const tabActiveOk = !body.tab_hidden && !body.muted_background;
          const checkpointOk = body.checkpoint_failed !== true && Number(body.checkpoint_attempts ?? 1) <= 2;
          const rawVideoMin = (body.duration_min !== undefined && body.duration_min !== null && body.duration_min !== '')
            ? Number(body.duration_min)
            : 10;
          const isShortVideo = rawVideoMin < 5;
          xpEarned = isAdm ? 0 : xpReward;
          goldEarned = applyRewardMultipliers(u, 15, 0, 0, isAdm).gold;
          if (!isAdm && caps.videos_today < 6 && watchRatioOk && speedOk && tabActiveOk && checkpointOk) {
            if (isShortVideo) {
              caps.short_video_half = Number(caps.short_video_half || 0) + 1;
              if (caps.short_video_half >= 2) {
                caps.short_video_half = 0;
                caps.videos_today += 1;
                dxhEarned = bxhEngine.grantWeeklyDxh(u, 25, { source: 'video_lecture' }).grantedDxh;
              } else {
                dxhNote = 'Video ngắn (< 5p): cần thêm 1 video ngắn nữa để tính 1 lượt (+25 ĐXH).';
              }
            } else {
              caps.videos_today += 1;
              dxhEarned = bxhEngine.grantWeeklyDxh(u, 25, { source: 'video_lecture' }).grantedDxh;
            }
          } else if (!isAdm && caps.videos_today >= 6) {
            dxhNote = 'Đã đạt trần 6 Video nhận ĐXH hôm nay.';
          } else if (!isAdm && (!watchRatioOk || !speedOk || !tabActiveOk || !checkpointOk)) {
            dxhNote = 'Video chưa đạt điều kiện Quality Gate (xem >=80%, tốc độ <=2.0x, không ẩn tab/tắt tiếng, đúng Checkpoint).';
          }
        }
        if (!isAdm && xpEarned > 0) {
          u.xp = Math.max(100, Number(u.xp || 0)) + xpEarned;
          u.weekly_xp = Math.max(0, Number(u.weekly_xp || 0)) + xpEarned;
          u.study_xp = Math.max(0, Number(u.study_xp || 0)) + xpEarned;
        }
        u.last_active = new Date().toISOString();
        await redis.set(`${USER_PREFIX}${normUser}`, u);
        try { await redis.sadd('phuc:users:index', normUser); } catch {}
      } else {
        duplicate = true;
        if (stateMutated) {
          u.last_active = new Date().toISOString();
          await redis.set(`${USER_PREFIX}${normUser}`, u);
          try { await redis.sadd('phuc:users:index', normUser); } catch {}
        }
      }
      const li = levelInfo(u.xp);
      return sendJson(res, 200, {
        ok: true,
        xp_earned: xpEarned,
        dxh_earned: dxhEarned,
        dxh_note: dxhNote,
        gold_earned: goldEarned,
        xp_total: Number(u.xp || 0),
        weekly_xp: Number(u.weekly_xp || 0),
        level: li.level,
        rpg: buildPublicRpgSnapshot(u),
        duplicate
      });
    }

    if (action === 'my-results' && req.method === 'GET') {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Chưa đăng nhập.' });
      const normU = normalizeUsername(session.username);
      const uObj = await getUser(redis, normU);
      const allAtts = await listAllAttempts(redis, uObj ? [uObj] : []);
      const attempts = allAtts
        .filter(a => normalizeUsername(a.username) === normU)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 50);
      return sendJson(res, 200, { ok: true, attempts });
    }

    if (action === 'security-intrusion' && req.method === 'POST') {
      const cookies = parseCookies(req);
      const vid = getRequestVisitorId(req) || String(cookies.phuc_visitor || '').trim();
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }
      const detail = clean(body.detail || body.source || 'DevTools Admin Tamper', 160);
      if (!session?.username) {
        return sendJson(res, 403, { ok: false, banned: false, warning: false, auth_required: true, message: 'Yêu cầu đăng nhập đúng tài khoản quản trị @phucadmin.' });
      }
      if (await isSessionAdmin(redis, session)) {
        return sendJson(res, 200, { ok: true, admin: true });
      }
      const viol = await recordAdminViolation(redis, session.username, {
        reason: `Giả mạo / xâm nhập giao diện Admin (${detail})`,
        source: `client:${detail}`,
        visitorId: vid,
        ip: getClientIp(req)
      });
      if (viol.banned) {
        await rejectIfBanned(redis, req, res, session.username);
      }
      return sendAdminGuardError(res, viol);
    }

    if (action === 'overview' && req.method === 'GET') {
      const guard = await requireAdminOrBanIntruder(redis, req, res, session, { source: 'dashboard:overview' });
      if (!guard.ok) return sendAdminGuardError(res, guard);
      const allUsers = await collectAllUsers(redis);
      const start = todayStart();
      const users = allUsers.length;
      const activeToday = allUsers.filter(u => u?.last_active && new Date(u.last_active).getTime() >= start).length;
      let uploads = 0;
      try { uploads = Number(await redis.llen('phuc:student-library')) || 0; } catch {}
      const [attempts, snap] = await Promise.all([
        listAttempts(redis),
        collectTrafficSnapshot(redis, { detailed: false })
      ]);
      return sendJson(res, 200, {
        ok: true,
        stats: {
          users,
          uploads,
          exam_attempts: attempts.length,
          today: activeToday,
          unique_visitors: snap.visitorsAll,
          estimated_people: snap.estimatedPeople,
          unique_today: snap.visitorsToday,
          unique_7d: snap.visitors7d,
          unique_30d: snap.visitors30d,
          pageviews_all: snap.pageviewsAll,
          pageviews_today: snap.pageviewsToday,
          sessions_today: snap.sessionsToday,
          online: snap.online,
          online_by_device: snap.onlineByDevice,
          devices: snap.devices,
          devices_today: snap.devicesToday,
          returning_today: snap.returningToday,
          new_today: snap.newToday,
          return_rate: snap.returnRate
        }
      });
    }

    if (action === 'admin-detail' && req.method === 'GET') {
      const guard = await requireAdminOrBanIntruder(redis, req, res, session, { source: 'dashboard:admin-detail' });
      if (!guard.ok) return sendAdminGuardError(res, guard);
      const [allUsers, attempts, snap, bannedRaw] = await Promise.all([
        collectAllUsers(redis),
        listAttempts(redis),
        collectTrafficSnapshot(redis, { detailed: true }),
        redis.smembers(BANNED_USERS_SET).catch(() => [])
      ]);
      const bannedSet = new Set((bannedRaw || []).map(x => normalizeUsername(x)).filter(Boolean));
      const start = todayStart();
      const now = new Date();
      const currentWeek = vnWeekKey(now);

      const dailySeries = await Promise.all(
        Array.from({ length: 14 }, (_, idx) => {
          const i = 13 - idx;
          const d = new Date(now.getTime() - i * 86400000);
          const dKey = vnDayKey(d);
          return Promise.all([
            redis.scard(`phuc:visitors:day:${dKey}`).catch(() => 0),
            redis.get(`phuc:pageviews:day:${dKey}`).catch(() => 0),
            redis.scard(`phuc:visitors:devday:${dKey}:mobile`).catch(() => 0),
            redis.scard(`phuc:visitors:devday:${dKey}:desktop`).catch(() => 0),
            redis.scard(`phuc:visitors:devday:${dKey}:tablet`).catch(() => 0)
          ]).then(([vis, pv, mob, desk, tab]) => ({
            date: dKey,
            label: dKey.slice(5).replace('-', '/'),
            visitors: Number(vis) || 0,
            pageviews: Number(pv) || 0,
            mobile_visitors: Number(mob) || 0,
            desktop_visitors: Number(desk) || 0,
            tablet_visitors: Number(tab) || 0,
            attempts: attempts.filter(a => String(a.created_at || '').startsWith(dKey)).length,
            signups: allUsers.filter(u => String(u.created_at || '').startsWith(dKey)).length
          }));
        })
      );

      const attemptStatsByUser = new Map();
      const subjectDistribution = {};
      const scoreBuckets = { '9_10': 0, '8_9': 0, '7_8': 0, '5_7': 0, 'under_5': 0 };
      let totalScoreAll = 0;

      for (const a of attempts) {
        const sc = normScore(a.score);
        totalScoreAll += sc;
        if (sc >= 9) scoreBuckets['9_10']++;
        else if (sc >= 8) scoreBuckets['8_9']++;
        else if (sc >= 7) scoreBuckets['7_8']++;
        else if (sc >= 5) scoreBuckets['5_7']++;
        else scoreBuckets['under_5']++;

        const subj = clean(a.subject || 'Toán', 40);
        if (!subjectDistribution[subj]) subjectDistribution[subj] = { count: 0, totalScore: 0, bestScore: 0 };
        subjectDistribution[subj].count++;
        subjectDistribution[subj].totalScore += sc;
        subjectDistribution[subj].bestScore = Math.max(subjectDistribution[subj].bestScore, sc);

        if (a.username) {
          const st = attemptStatsByUser.get(a.username) || { count: 0, best: 0, sum: 0, lastExamAt: '' };
          st.count++;
          st.best = Math.max(st.best, sc);
          st.sum += sc;
          if ((a.created_at || '') > st.lastExamAt) st.lastExamAt = a.created_at || '';
          attemptStatsByUser.set(a.username, st);
        }
      }

      const gradeDistribution = { '2K9': 0, '2K8': 0, 'DGNL': 0, '2K11': 0, '2K12': 0 };
      let totalLessonsCompleted = 0;
      let totalNotesSaved = 0;
      let totalXpSystem = 0;

      const enrichedUsers = allUsers.map(u => {
        const doneMap = u.progress?.done && typeof u.progress.done === 'object' ? u.progress.done : {};
        const notesMap = u.progress?.notes && typeof u.progress.notes === 'object' ? u.progress.notes : {};
        const doneCount = Object.values(doneMap).filter(Boolean).length;
        const notesCount = Object.values(notesMap).filter(v => String(v || '').trim().length > 0).length;
        const g = String(u.settings?.preferred_grade || '2K9').toUpperCase();
        if (gradeDistribution[g] !== undefined) gradeDistribution[g]++;
        else gradeDistribution['2K9']++;

        totalLessonsCompleted += doneCount;
        totalNotesSaved += notesCount;
        const xp = Math.max(0, Number(u.xp || 0));
        totalXpSystem += xp;

        const ast = attemptStatsByUser.get(u.username) || { count: 0, best: 0, sum: 0, lastExamAt: '' };
        const li = levelInfo(xp);
        const normU = normalizeUsername(u.username);
        const isAdmUser = isAdminAccount(u);
        const isSuperUser = isSuperAdminAccount(u);
        const isBannedUser = !isSuperAdminUsername(normU) && Boolean(u.banned || bannedSet.has(normU));
        return {
          username: u.username,
          display_name: u.display_name || u.username,
          role: isAdmUser ? 'admin' : (u.role === 'vip' ? 'vip' : 'student'),
          is_admin: isAdmUser,
          is_super_admin: isSuperUser,
          admin_granted_by: u.admin_granted_by || '',
          banned: isBannedUser,
          ban_reason: isBannedUser ? String(u.ban_reason || 'Vi phạm bảo mật hệ thống') : '',
          banned_at: isBannedUser ? String(u.banned_at || '') : '',
          banned_by: isBannedUser ? String(u.banned_by || '') : '',
          admin_warnings: Math.max(0, Number(u.admin_warnings || 0)),
          last_admin_warning_at: String(u.last_admin_warning_at || ''),
          last_admin_warning_reason: String(u.last_admin_warning_reason || ''),
          is_vip: Boolean(u.is_vip || u.role === 'vip' || isAdmUser),
          school: u.settings?.school || '',
          grade: g,
          xp,
          weekly_xp: u.week_key === currentWeek ? Math.max(0, Number(u.weekly_xp || 0)) : 0,
          level: li.level,
          streak: Math.max(1, Number(u.streak || 1)),
          lessons_done: doneCount,
          notes_count: notesCount,
          resume: u.progress?.resume || null,
          exam_attempts: ast.count,
          best_score: ast.best,
          avg_score: ast.count ? Math.round((ast.sum / ast.count) * 100) / 100 : 0,
          badges: Array.isArray(u.badges) ? u.badges : ['Thành Viên K9'],
          created_at: u.created_at || '',
          last_active: u.last_active || ''
        };
      }).sort((a, b) => String(b.last_active || '').localeCompare(String(a.last_active || '')) || b.xp - a.xp);

      let announcement = null;
      try {
        announcement = safeParseObj(await redis.get('phuc:system:announcement'));
      } catch { announcement = null; }

      let customKhoaChui = [];
      try {
        const rawKc = await redis.lrange('phuc:khoa-chui:items', 0, 199);
        customKhoaChui = (rawKc || []).map(safeParseObj).filter(Boolean);
      } catch { customKhoaChui = []; }

      let auditLogs = [];
      try {
        const rawLogs = await redis.lrange('phuc:admin:audit', 0, 99);
        auditLogs = (rawLogs || []).map(safeParseObj).filter(Boolean);
      } catch { auditLogs = []; }

      let feedbacks = [];
      try {
        const rawFb = await redis.lrange('phuc:feedbacks', 0, 199);
        feedbacks = (rawFb || []).map(safeParseObj).filter(Boolean);
      } catch { feedbacks = []; }

      const activeTodayCount = allUsers.filter(u => u?.last_active && new Date(u.last_active).getTime() >= start).length;
      const avgExamScore = attempts.length ? Math.round((totalScoreAll / attempts.length) * 100) / 100 : 0;
      const defaultAdminRec = allUsers.find(u => normalizeUsername(u?.username) === SUPER_ADMIN_USERNAME);
      const curAdminRec = allUsers.find(u => normalizeUsername(u?.username) === normalizeUsername(session.username));
      const weakAdminPassword = Boolean(
        (defaultAdminRec && verifyPassword('admin123', defaultAdminRec)) ||
        (curAdminRec && verifyPassword('admin123', curAdminRec))
      );

      let storedAiKeys = {};
      try {
        storedAiKeys = safeParseObj(await redis.get('phuc:system:ai-keys')) || {};
      } catch { storedAiKeys = {}; }
      const aiKeyMeta = id => {
        const envName = ({ gemini: 'GEMINI_API_KEY', groq: 'GROQ_API_KEY', mistral: 'MISTRAL_API_KEY', openrouter: 'OPENROUTER_API_KEY', nvidia: 'NVIDIA_API_KEY', openai: 'OPENAI_API_KEY' })[id];
        const envVal = String((envName && process.env[envName]) || '').trim();
        const dbVal = String(storedAiKeys?.[id] || '').trim();
        const activeVal = envVal || dbVal;
        return {
          configured: activeVal.length > 8,
          source: envVal.length > 8 ? 'env' : (dbVal.length > 8 ? 'vault' : 'none'),
          masked: activeVal.length > 8 ? `${activeVal.slice(0, 4)}...${activeVal.slice(-4)}` : ''
        };
      };

      return sendJson(res, 200, {
        ok: true,
        viewer_username: normalizeUsername(session.username),
        viewer_is_super_admin: Boolean(guard.isSuperAdmin),
        super_admin_username: SUPER_ADMIN_USERNAME,
        server_time: now.toISOString(),
        week_key: currentWeek,
        storage_mode: redis.__isMemoryFallback ? 'Memory Fallback (Local Dev)' : 'Upstash Redis Cloud',
        weak_admin_password: weakAdminPassword,
        ai_keys_status: {
          gemini: aiKeyMeta('gemini'),
          groq: aiKeyMeta('groq'),
          mistral: aiKeyMeta('mistral'),
          nvidia: aiKeyMeta('nvidia'),
          openrouter: aiKeyMeta('openrouter'),
          openai: aiKeyMeta('openai')
        },
        kpis: {
          total_users: allUsers.length,
          banned_users: enrichedUsers.filter(u => u.banned).length,
          active_today: activeTodayCount,
          online_now: snap.online,
          unique_visitors: snap.visitorsAll,
          estimated_people: snap.estimatedPeople,
          estimated_people_today: snap.estimatedPeopleToday,
          visitors_today: snap.visitorsToday,
          visitors_7d: snap.visitors7d,
          visitors_30d: snap.visitors30d,
          pageviews_all: snap.pageviewsAll,
          pageviews_today: snap.pageviewsToday,
          sessions_today: snap.sessionsToday,
          returning_today: snap.returningToday,
          new_today: snap.newToday,
          return_rate: snap.returnRate,
          total_attempts: attempts.length,
          avg_exam_score: avgExamScore,
          total_lessons_done: totalLessonsCompleted,
          total_notes_saved: totalNotesSaved,
          total_xp_system: totalXpSystem
        },
        traffic: {
          online_now: snap.online,
          online_by_device: snap.onlineByDevice,
          online_sessions: snap.onlineSessions,
          devices: snap.devices,
          devices_today: snap.devicesToday,
          os_breakdown: snap.osBreakdown,
          browser_breakdown: snap.browserBreakdown,
          top_tabs: snap.topTabs,
          top_referrers: snap.topReferrers,
          recent_devices: snap.recentDevices
        },
        distributions: {
          grades: gradeDistribution,
          scores: scoreBuckets,
          subjects: Object.entries(subjectDistribution).map(([subject, d]) => ({
            subject,
            count: d.count,
            avgScore: d.count ? Math.round((d.totalScore / d.count) * 100) / 100 : 0,
            bestScore: d.bestScore
          }))
        },
        daily_series: dailySeries,
        users: enrichedUsers,
        recent_attempts: attempts.slice(0, 100),
        announcement,
        custom_khoa_chui: customKhoaChui,
        audit_logs: auditLogs,
        feedbacks
      });
    }

    if (action === 'admin-action' && req.method === 'POST') {
      const guard = await requireAdminOrBanIntruder(redis, req, res, session, { source: 'dashboard:admin-action' });
      if (!guard.ok) return sendAdminGuardError(res, guard);
      const isCallerSuperAdmin = Boolean(guard.isSuperAdmin);
      const csrf = session.csrf || await getCsrf(req, res);
      if (!requireCsrf(req, session, csrf)) {
        return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
      }
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }
      const subAction = String(body.sub_action || '').toLowerCase();
      const targetUsername = normalizeUsername(body.username || '');

      async function logAdminAudit(eventTitle, detail) {
        try {
          const nowIso = new Date().toISOString();
          await redis.lpush('phuc:admin:audit', JSON.stringify({
            id: `aud-${Date.now()}`,
            admin: session.username,
            actor: session.username,
            event: eventTitle,
            detail,
            at: nowIso,
            created_at: nowIso
          }));
          await redis.ltrim('phuc:admin:audit', 0, 99);
        } catch {}
      }

      if (subAction === 'grant-xp') {
        const u = await getUser(redis, targetUsername);
        if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy học viên.' });
        if (isSuperAdminUsername(targetUsername) && !isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ @phucadmin mới được thao tác tài khoản chủ.' });
        }
        const delta = Math.round(Number(body.amount || 0));
        const wk = vnWeekKey();
        if (u.week_key !== wk) {
          u.week_key = wk;
          u.weekly_xp = 0;
        }
        u.xp = Math.max(0, Math.round(Number(u.xp || 0) + delta));
        u.weekly_xp = Math.max(0, Math.round(Number(u.weekly_xp || 0) + delta));
        await redis.set(`${USER_PREFIX}${targetUsername}`, u);
        try { await redis.sadd('phuc:users:index', targetUsername); } catch {}
        await logAdminAudit('Cập nhật XP', `${delta >= 0 ? '+' : ''}${delta} XP cho @${targetUsername}`);
        return sendJson(res, 200, { ok: true, message: `Đã cập nhật ${delta >= 0 ? '+' : ''}${delta} XP cho học viên @${targetUsername}.`, user: safeUser(u) });
      }

      if (subAction === 'set-role') {
        if (!isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ tài khoản chủ @phucadmin mới có quyền Phân quyền hệ thống!' });
        }
        if (isSuperAdminUsername(targetUsername)) {
          return sendJson(res, 400, { ok: false, message: 'Không thể hạ cấp hoặc đổi vai trò tài khoản Super Admin @phucadmin.' });
        }
        const u = await getUser(redis, targetUsername);
        if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy học viên.' });
        const newRole = String(body.role || 'student').toLowerCase();
        if (!['student', 'vip', 'admin'].includes(newRole)) {
          return sendJson(res, 422, { ok: false, message: 'Vai trò phân quyền không hợp lệ (chỉ student / vip / admin).' });
        }
        u.role = newRole;
        u.is_admin = newRole === 'admin';
        u.is_vip = newRole === 'vip' || newRole === 'admin';
        if (newRole === 'admin') {
          u.admin_granted_by = SUPER_ADMIN_USERNAME;
          u.admin_granted_at = new Date().toISOString();
          u.banned = false;
          u.ban_reason = '';
          u.admin_warnings = 0;
          await clearAdminWarnings(redis, targetUsername);
        } else {
          delete u.admin_granted_by;
          delete u.admin_granted_at;
        }
        const badgeSet = new Set(Array.isArray(u.badges) ? u.badges : ['Thành Viên K9']);
        if (newRole === 'admin') {
          badgeSet.add('Quản Trị Viên K9');
        } else {
          badgeSet.delete('Quản Trị Viên K9');
          badgeSet.delete('Quản Trị Viên Tối Cao');
        }
        if (newRole === 'vip') badgeSet.add('Học Viên VIP Pro');
        else if (newRole === 'student') badgeSet.delete('Học Viên VIP Pro');
        u.badges = Array.from(badgeSet);
        await redis.set(`${USER_PREFIX}${targetUsername}`, u);
        await logAdminAudit('🛡️ Phân quyền tài khoản', `@${targetUsername} → ${newRole.toUpperCase()} (bởi @${session.username})`);
        return sendJson(res, 200, { ok: true, message: `Đã phân quyền cho @${targetUsername} → ${newRole.toUpperCase()}.`, user: safeUser(u) });
      }

      if (subAction === 'ban-user') {
        if (!isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ tài khoản chủ @phucadmin mới có quyền Ban vĩnh viễn người dùng!' });
        }
        if (!targetUsername || isSuperAdminUsername(targetUsername)) {
          return sendJson(res, 400, { ok: false, message: 'Không thể ban tài khoản Super Admin @phucadmin.' });
        }
        const reason = clean(body.reason || 'Vi phạm quy định hoặc xâm nhập trái phép', 220);
        const banRes = await banUserPermanently(redis, targetUsername, {
          reason,
          bannedBy: session.username
        });
        const fresh = await getUser(redis, targetUsername);
        return sendJson(res, 200, {
          ok: true,
          message: `Đã khóa (Ban) vĩnh viễn tài khoản @${targetUsername}.`,
          ban: banRes?.ban || null,
          user: fresh ? safeUser(fresh) : null
        });
      }

      if (subAction === 'unban-user') {
        if (!isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ tài khoản chủ @phucadmin mới có quyền Gỡ Ban!' });
        }
        if (!targetUsername) return sendJson(res, 422, { ok: false, message: 'Thiếu username cần gỡ ban.' });
        await unbanUserAccount(redis, targetUsername, { unbannedBy: session.username });
        const fresh = await getUser(redis, targetUsername);
        return sendJson(res, 200, {
          ok: true,
          message: `Đã mở khóa (Gỡ Ban) cho tài khoản @${targetUsername}.`,
          user: fresh ? safeUser(fresh) : null
        });
      }

      if (subAction === 'clear-warnings') {
        if (!isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ @phucadmin mới có quyền xóa cảnh báo.' });
        }
        if (!targetUsername) return sendJson(res, 422, { ok: false, message: 'Thiếu username cần xóa cảnh báo.' });
        await clearAdminWarnings(redis, targetUsername);
        await logAdminAudit('✅ Xóa cảnh báo', `@${session.username} đã xóa cảnh báo vi phạm của @${targetUsername}`);
        const fresh = await getUser(redis, targetUsername);
        return sendJson(res, 200, {
          ok: true,
          message: `Đã xóa cảnh báo bảo mật cho @${targetUsername}.`,
          user: fresh ? safeUser(fresh) : null
        });
      }

      if (subAction === 'reset-password') {
        const u = await getUser(redis, targetUsername);
        if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy học viên.' });
        if ((isSuperAdminUsername(targetUsername) || isAdminAccount(u)) && !isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ @phucadmin mới được đặt lại mật khẩu cho Quản trị viên.' });
        }
        const newPass = String(body.new_password || '').trim();
        if (newPass.length < 6 || newPass.length > 128) {
          return sendJson(res, 422, { ok: false, message: 'Vui lòng nhập mật khẩu mới rõ ràng (6–128 ký tự).' });
        }
        const { salt, hash } = hashPassword(newPass);
        u.salt = salt;
        u.password_hash = hash;
        await redis.set(`${USER_PREFIX}${targetUsername}`, u);
        await logAdminAudit('Đặt lại mật khẩu', `Đặt lại mật khẩu cho @${targetUsername}`);
        return sendJson(res, 200, { ok: true, message: `Đã đặt lại mật khẩu cho @${targetUsername} thành công.` });
      }

      if (subAction === 'create-user') {
        const uname = targetUsername.replace(/[^a-z0-9._-]/g, '');
        const disp = clean(body.display_name || uname, 80);
        const pass = String(body.password || '123456');
        const grade = ['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(String(body.grade || '').toUpperCase()) ? String(body.grade).toUpperCase() : '2K9';
        const school = clean(body.school || 'THPT Chuyên Phúc K9', 80);
        const rawRole = String(body.role || 'student').toLowerCase();
        const role = ['student', 'vip', 'admin'].includes(rawRole) ? rawRole : 'student';
        if (role === 'admin' && !isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ tài khoản chủ @phucadmin mới có quyền tạo tài khoản Admin.' });
        }
        if (isSuperAdminUsername(uname)) {
          return sendJson(res, 400, { ok: false, message: 'Tên tài khoản @phucadmin được hệ thống giữ riêng.' });
        }
        const xp = role === 'admin' ? Math.max(0, Number(body.xp ?? 0)) : Math.max(100, Number(body.xp || 200));
        if (!uname || uname.length < 3) return sendJson(res, 422, { ok: false, message: 'Username cần ít nhất 3 ký tự.' });
        const existing = await getUser(redis, uname);
        if (existing) return sendJson(res, 409, { ok: false, message: 'Tài khoản này đã tồn tại.' });
        const { salt, hash } = hashPassword(pass);
        const nowIso = new Date().toISOString();
        const newUser = {
          username: uname,
          display_name: disp,
          role,
          is_admin: role === 'admin',
          is_vip: role === 'vip' || role === 'admin',
          ...(role === 'admin' ? { admin_granted_by: SUPER_ADMIN_USERNAME, admin_granted_at: nowIso } : {}),
          salt,
          password_hash: hash,
          created_at: nowIso,
          last_active: nowIso,
          streak: 1,
          xp,
          weekly_xp: xp,
          week_key: vnWeekKey(),
          badges: role === 'admin' ? ['Quản Trị Viên K9'] : role === 'vip' ? ['Học Viên VIP Pro'] : ['Tân Binh K9'],
          progress: { done: {}, resume: null, notes: {} },
          settings: { preferred_grade: grade, school },
          google: { linked: false, email: null }
        };
        await redis.set(`${USER_PREFIX}${uname}`, newUser);
        try { await redis.sadd('phuc:users:index', uname); } catch {}
        try { await redis.srem?.('phuc:users:deleted', uname); } catch {}
        await logAdminAudit('Tạo tài khoản mới', `Tạo @${uname} (${disp}) • ${xp} XP`);
        return sendJson(res, 200, { ok: true, message: `Đã tạo tài khoản @${uname} thành công!`, user: safeUser(newUser) });
      }

      if (subAction === 'delete-user') {
        if (!isCallerSuperAdmin) {
          return sendJson(res, 403, { ok: false, message: 'Chỉ tài khoản chủ @phucadmin mới được xóa tài khoản.' });
        }
        if (targetUsername === normalizeUsername(session.username) || isSuperAdminUsername(targetUsername)) {
          return sendJson(res, 400, { ok: false, message: 'Không thể tự xóa tài khoản Super Admin @phucadmin.' });
        }
        await redis.del(`${USER_PREFIX}${targetUsername}`);
        try {
          await redis.srem?.('phuc:users:index', targetUsername);
          await redis.sadd('phuc:users:deleted', targetUsername);
        } catch {}
        await logAdminAudit('Xóa tài khoản', `Đã xóa tài khoản @${targetUsername}`);
        return sendJson(res, 200, { ok: true, message: `Đã xóa tài khoản @${targetUsername}.` });
      }

      if (subAction === 'set-announcement') {
        const text = clean(body.text || '', 500);
        const active = Boolean(body.active && text);
        const link = clean(body.link || '', 240);
        const payload = { text, active, link, updated_by: session.username, updated_at: new Date().toISOString() };
        await redis.set('phuc:system:announcement', payload);
        await logAdminAudit('Cập nhật thông báo hệ thống', active ? text : 'Tắt thông báo');
        return sendJson(res, 200, { ok: true, message: active ? 'Đã phát thông báo toàn hệ thống!' : 'Đã tắt thanh thông báo hệ thống.', announcement: payload });
      }

      if (subAction === 'add-khoa-chui') {
        const title = clean(body.title || '', 160);
        const teacher = clean(body.teacher || 'Tổng hợp Phúc K9', 100);
        const subject = clean(body.subject || 'Toán 12', 50);
        const url = clean(body.url || '', 400);
        const tag = clean(body.tag || 'VIP 2026', 40);
        if (!title || !url) return sendJson(res, 422, { ok: false, message: 'Vui lòng nhập tên khóa học và đường dẫn.' });
        const item = {
          id: `kc-${Date.now()}`,
          title,
          teacher,
          subject,
          url,
          tag,
          created_by: session.username,
          created_at: new Date().toISOString()
        };
        await redis.lpush('phuc:khoa-chui:items', JSON.stringify(item));
        await logAdminAudit('Thêm Khóa Chui Tham Khảo', `${title} (${subject})`);
        return sendJson(res, 200, { ok: true, message: 'Đã thêm khóa học mới vào mục Khóa Chui Tham Khảo!', item });
      }

      if (subAction === 'delete-khoa-chui') {
        const targetId = clean(body.id || '', 80);
        if (!targetId) return sendJson(res, 422, { ok: false, message: 'Thiếu ID khóa học cần xóa.' });
        const rawKc = await redis.lrange('phuc:khoa-chui:items', 0, 299).catch(() => []);
        const items = (rawKc || []).map(safeParseObj).filter(Boolean);
        const kept = items.filter(it => String(it.id || '') !== targetId);
        if (kept.length === items.length) {
          return sendJson(res, 404, { ok: false, message: 'Không tìm thấy khóa học tùy chỉnh này.' });
        }
        await redis.del('phuc:khoa-chui:items');
        for (let idx = kept.length - 1; idx >= 0; idx--) {
          await redis.lpush('phuc:khoa-chui:items', JSON.stringify(kept[idx]));
        }
        await logAdminAudit('Xóa Khóa Chui Tùy Chỉnh', `ID ${targetId}`);
        return sendJson(res, 200, { ok: true, message: 'Đã xóa khóa học khỏi danh sách.', remaining: kept.length });
      }

      if (subAction === 'feedback-status') {
        const targetId = clean(body.id || '', 80);
        const nextStatus = ['new', 'read', 'resolved'].includes(String(body.status || '').trim())
          ? String(body.status).trim()
          : 'resolved';
        const adminNote = clean(body.admin_note || '', 300);
        if (!targetId) return sendJson(res, 422, { ok: false, message: 'Thiếu ID feedback.' });
        const rawFb = await redis.lrange('phuc:feedbacks', 0, 299).catch(() => []);
        const items = (rawFb || []).map(safeParseObj).filter(Boolean);
        let updated = null;
        for (const it of items) {
          if (String(it.id || '') === targetId) {
            it.status = nextStatus;
            if (body.admin_note !== undefined) it.admin_note = adminNote;
            it.updated_at = new Date().toISOString();
            it.handled_by = session.username;
            updated = it;
            break;
          }
        }
        if (!updated) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy góp ý này.' });
        await redis.del('phuc:feedbacks');
        for (let idx = items.length - 1; idx >= 0; idx--) {
          await redis.lpush('phuc:feedbacks', JSON.stringify(items[idx]));
        }
        await logAdminAudit('Cập nhật trạng thái Feedback', `${targetId} -> ${nextStatus}`);
        return sendJson(res, 200, { ok: true, message: nextStatus === 'resolved' ? 'Đã đánh dấu xử lý xong góp ý!' : 'Đã cập nhật trạng thái góp ý.', item: updated });
      }

      if (subAction === 'feedback-delete') {
        const targetId = clean(body.id || '', 80);
        if (!targetId) return sendJson(res, 422, { ok: false, message: 'Thiếu ID feedback cần xóa.' });
        const rawFb = await redis.lrange('phuc:feedbacks', 0, 299).catch(() => []);
        const items = (rawFb || []).map(safeParseObj).filter(Boolean);
        const kept = items.filter(it => String(it.id || '') !== targetId);
        if (kept.length === items.length) {
          return sendJson(res, 404, { ok: false, message: 'Không tìm thấy góp ý cần xóa.' });
        }
        await redis.del('phuc:feedbacks');
        for (let idx = kept.length - 1; idx >= 0; idx--) {
          await redis.lpush('phuc:feedbacks', JSON.stringify(kept[idx]));
        }
        await logAdminAudit('Xóa Feedback', `ID ${targetId}`);
        return sendJson(res, 200, { ok: true, message: 'Đã xóa góp ý khỏi hộp thư.', remaining: kept.length });
      }

      if (subAction === 'set-ai-keys') {
        let curKeys = {};
        try {
          curKeys = safeParseObj(await redis.get('phuc:system:ai-keys')) || {};
        } catch { curKeys = {}; }
        const allowed = ['gemini', 'groq', 'mistral', 'nvidia', 'openrouter', 'openai'];
        const updatedProviders = [];
        for (const p of allowed) {
          if (body[`clear_${p}`]) {
            delete curKeys[p];
            updatedProviders.push(`-${p}`);
          } else {
            const val = clean(body[p] || '', 260);
            if (val.length >= 10) {
              curKeys[p] = val;
              updatedProviders.push(p);
            }
          }
        }
        await redis.set('phuc:system:ai-keys', curKeys);
        await logAdminAudit('Cấu hình AI Keys hệ thống', updatedProviders.length ? updatedProviders.join(', ') : 'Giữ nguyên');
        return sendJson(res, 200, { ok: true, message: '✅ Đã lưu API Key AI vào hệ thống — toàn bộ học sinh dùng được ngay!', updated: updatedProviders });
      }

      return sendJson(res, 400, { ok: false, message: 'Sub-action quản trị không hợp lệ.' });
    }

    if (action === 'rpg' || action.startsWith('rpg-')) {
      return await handleRpgRequest(redis, req, res, session, action);
    }

    if (action === 'student-card' && req.method === 'GET') {
      const rawUser = clean(req.query?.u || req.query?.username || req.query?.card || req.query?.code || '', 60);
      const rawSbd = clean(req.query?.sbd || '', 40).toUpperCase();
      const normU = normalizeUsername(rawUser);
      const fallbackName = clean(req.query?.n || req.query?.name || 'Học Viên Phúc K9', 80);
      const rawGrade = String(req.query?.g || req.query?.grade || '2K9').toUpperCase();
      const fallbackGrade = ['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(rawGrade) ? rawGrade : '2K9';
      const fallbackSchool = clean(req.query?.school || 'Hệ Sinh Thái Học Cùng Phúc K9', 90);
      const queriedBySbd = Boolean(
        (rawSbd && (rawSbd.startsWith('K9-') || rawSbd.startsWith('PK9-'))) ||
        (rawUser && (rawUser.toUpperCase().startsWith('K9-') || rawUser.toUpperCase().startsWith('PK9-')))
      );
      const targetSbdLookup = (rawSbd || rawUser || '').toUpperCase();

      let u = null;
      const deletedRaw = await redis.smembers('phuc:users:deleted').catch(() => []);
      const deletedSet = new Set((deletedRaw || []).map(x => normalizeUsername(x)).filter(Boolean));

      if (normU && !isGuestUsername(normU) && !queriedBySbd && !deletedSet.has(normU)) {
        u = await getUser(redis, normU);
      }
      if (!u && targetSbdLookup && (targetSbdLookup.startsWith('K9-') || targetSbdLookup.startsWith('PK9-'))) {
        try {
          const allUsers = await collectAllUsers(redis);
          u = allUsers.find(cand => {
            if (!cand || deletedSet.has(normalizeUsername(cand.username))) return false;
            ensureUserRpgState(cand);
            const cSbd = String(cand?.rpg?.sbd || '').toUpperCase();
            const cAnon = String(cand?.rpg?.anon_sbd || '').toUpperCase();
            return cSbd === targetSbdLookup || cAnon === targetSbdLookup;
          }) || null;
        } catch {}
      }

      if (u && !u.banned) {
        const banRec = await getBanRecord(redis, u.username, '');
        if (!banRec) {
          const rpgSnap = buildPublicRpgSnapshot(u);
          const pv = rpgSnap.privacy || {};
          const bxh = rpgSnap.bxh || {};
          const soc = rpgSnap.social || {};
          const viewerNorm = session?.username ? normalizeUsername(session.username) : '';
          const isSelf = viewerNorm && viewerNorm === normalizeUsername(u.username);

          // Quy tắc R2 Chế độ "Ẩn Danh BXH": Vô hiệu hóa hoàn toàn phân giải ?card=<username> khi bật Ẩn danh (trừ chính chủ)
          if (pv.anonymous_bxh && !isSelf) {
            const passedExactAnonSbd = targetSbdLookup === String(rpgSnap.anon_sbd || '').toUpperCase();
            if (!passedExactAnonSbd) {
              return sendJson(res, 200, {
                ok: true,
                verified: false,
                anonymous_locked: true,
                issuer: 'HỌC CÙNG PHÚC K9',
                card_title: 'HỒ SƠ ĐANG BẬT CHẾ ĐỘ ẨN DANH BXH',
                message: 'Hồ sơ đã chuyển sang chế độ Ẩn danh — vui lòng truy cập bằng Public SBD mới để bảo vệ quyền riêng tư học viên.'
              });
            }
          }

          const isAdm = isAdminAccount(u);
          const baseXp = isAdm ? 0 : Math.max(100, Number(u.xp || 100));
          const li = levelInfo(baseXp);
          const grade = bxhEngine.normalizeGrade(bxh.primary_grade || u.settings?.preferred_grade || '2K9');
          const divTierId = bxh.division_by_grade?.[grade] || 'bronze';
          const divTierObj = bxhEngine.DIVISION_MAP.get(divTierId) || bxhEngine.DIVISION_TIERS[0];

          // Tính 8 Chỉ Số Học Tập Xác Thực (Tầng 4 R2)
          const allAtts = await listAttempts(redis);
          const userAtts = allAtts.filter(a => normalizeUsername(a.username) === normalizeUsername(u.username));
          const examsSolved = Math.max(userAtts.length, Number(rpgSnap.daily?.exam_count || 0));
          const rec10 = Array.isArray(soc.std_exams_recent_10) && soc.std_exams_recent_10.length
            ? soc.std_exams_recent_10
            : userAtts.slice(0, 10);
          const avg10StdScore = rec10.length >= 3
            ? Number((rec10.reduce((s, x) => s + Number(x.score || 0), 0) / rec10.length).toFixed(2))
            : null;
          const bestExamScore = userAtts.length
            ? Math.max(...userAtts.map(x => Number(x.score || 0)))
            : (rec10.length ? Math.max(...rec10.map(x => Number(x.score || 0))) : 0);
          const fcMap = u.rpg?.flashcards_state && typeof u.rpg.flashcards_state === 'object' ? u.rpg.flashcards_state : {};
          const masteredFc = Object.values(fcMap).filter(s => s && s.status === 'mastered').length;
          const islandsObj = u.rpg?.journey || {};
          const islandsCleared = Object.values(islandsObj).filter(x => Number(x?.stars || 0) > 0).length;
          const islandsStars = Object.values(islandsObj).reduce((s, x) => s + Number(x?.stars || 0), 0);
          const pomoHours = Number(((soc.pomodoro_total_mins || 0) / 60).toFixed(1));
          const duelWins = Number(soc.duel_1v1_total_wins || 0);
          const duelMatches = Number(soc.duel_1v1_total_matches || 0);
          const duelWinRate = duelMatches > 0 ? Math.round((duelWins / duelMatches) * 100) : 0;

          const verifiedMetrics8 = {
            streak: Math.max(1, Number(bxh.streak_real || u.streak || 1)),
            max_streak: Math.max(1, Number(bxh.max_streak_real || u.streak || 1)),
            xp: baseXp,
            dxh_week: Number(bxh.dxh_week || 0),
            division_tier_name: divTierObj.name,
            division_tier_icon: divTierObj.icon,
            exams_solved: examsSolved,
            best_exam_score: bestExamScore,
            avg_10_std_exams: avg10StdScore,
            avg_10_std_label: avg10StdScore !== null ? `${avg10StdScore.toFixed(2)}đ (10 đề gần)` : 'Đang tích lũy (<3 đề chuẩn)',
            duel_1v1_wins: duelWins,
            duel_1v1_matches: duelMatches,
            duel_1v1_winrate: duelWinRate,
            pomodoro_hours: pomoHours,
            flashcards_mastered: masteredFc,
            islands_cleared: islandsCleared,
            islands_stars: islandsStars,
            island_flags_total: Number(soc.island_flags_total || 0)
          };

          // Dữ liệu So sánh 1-chạm với người đang xem (R2 Micro-Action #3)
          let comparison = null;
          if (viewerNorm && !isGuestUsername(viewerNorm) && !isSelf) {
            const viewerUser = await getUser(redis, viewerNorm);
            if (viewerUser) {
              ensureUserRpgState(viewerUser);
              const vAtts = allAtts.filter(a => normalizeUsername(a.username) === viewerNorm);
              const vRec10 = Array.isArray(viewerUser.rpg?.social?.std_exams_recent_10) && viewerUser.rpg.social.std_exams_recent_10.length
                ? viewerUser.rpg.social.std_exams_recent_10
                : vAtts.slice(0, 10);
              const vAvg10 = vRec10.length >= 3
                ? Number((vRec10.reduce((s, x) => s + Number(x.score || 0), 0) / vRec10.length).toFixed(2))
                : null;
              const vFcMap = viewerUser.rpg?.flashcards_state || {};
              const vMasteredFc = Object.values(vFcMap).filter(s => s && s.status === 'mastered').length;
              const vIslands = viewerUser.rpg?.journey || {};
              const vDxh = Number(viewerUser.rpg?.bxh?.dxh_week || 0);
              const targetDxh = Number(bxh.dxh_week || 0);
              const gapDxh = targetDxh - vDxh;
              const targetPublicName = pv.anonymous_bxh ? `Học viên #${rpgSnap.anon_sbd}` : (u.display_name || u.username);

              comparison = {
                viewer_name: viewerUser.display_name || viewerUser.username,
                viewer_metrics: {
                  streak: Math.max(1, Number(viewerUser.rpg?.bxh?.streak_real || viewerUser.streak || 1)),
                  xp: Math.max(100, Number(viewerUser.xp || 100)),
                  dxh_week: vDxh,
                  exams_solved: vAtts.length,
                  avg_10_std_exams: vAvg10,
                  duel_1v1_wins: Number(viewerUser.rpg?.social?.duel_1v1_total_wins || 0),
                  pomodoro_hours: Number(((viewerUser.rpg?.social?.pomodoro_total_mins || 0) / 60).toFixed(1)),
                  flashcards_mastered: vMasteredFc,
                  islands_cleared: Object.values(vIslands).filter(x => Number(x?.stars || 0) > 0).length
                },
                gap_dxh: gapDxh,
                is_pinned_rival: (viewerUser.rpg?.social?.rivals || []).includes(normalizeUsername(u.username)),
                is_blocked: (viewerUser.rpg?.privacy?.blocked_users || []).includes(normalizeUsername(u.username)),
                actionable_nudge: gapDxh > 0
                  ? bxhEngine.buildActionableDxhNudge(targetPublicName, gapDxh)
                  : `🎉 Bạn đang dẫn trước ${targetPublicName} ${Math.abs(gapDxh)} ĐXH Tuần — làm thêm 1 đề chuẩn GDPT 2018 để nới rộng khoảng cách!`
              };
            }
          }

          const isAnonPublic = Boolean(pv.anonymous_bxh && !isSelf);
          const visibleSchool = bxhEngine.formatVisibleSchool(
            u.settings?.school || '',
            grade,
            pv.school_visibility,
            isAnonPublic
          );

          const badges24Map = new Map((rpgSnap.badges_24 || []).map(bd => [bd.id, bd]));
          const heroBadgeDetail = rpgSnap.showcase?.hero_badge ? badges24Map.get(rpgSnap.showcase.hero_badge) || null : null;
          const showcaseBadgesDetails = (rpgSnap.showcase?.showcase_badges || [])
            .map(id => badges24Map.get(id))
            .filter(Boolean);

          return sendJson(res, 200, {
            ok: true,
            verified: true,
            is_self: Boolean(isSelf),
            issuer: 'HỌC CÙNG PHÚC K9',
            card_title: 'THẺ HỌC VIÊN ĐIỆN TỬ CHÍNH THỨC • STUDENT ID',
            verified_at: new Date().toISOString(),
            cheer_presets: bxhEngine.CHEER_PRESET_MESSAGES,
            card: {
              username: isAnonPublic ? `anon_${rpgSnap.anon_sbd}` : normalizeUsername(u.username),
              display_name: isAnonPublic ? `Học viên #${rpgSnap.anon_sbd}` : (u.display_name || u.username),
              sbd: isAnonPublic ? rpgSnap.anon_sbd : (rpgSnap.sbd || rawSbd || 'K9-STUDENT'),
              anon_sbd: rpgSnap.anon_sbd,
              is_anonymous: isAnonPublic,
              grade,
              school: visibleSchool,
              role: isAdm ? 'admin' : u.is_vip || u.role === 'vip' ? 'vip' : 'student',
              is_vip: Boolean(u.is_vip || u.role === 'vip' || isAdm),
              is_admin: isAdm,
              xp: baseXp,
              dxh_week: Number(bxh.dxh_week || 0),
              division_tier: divTierObj,
              level: li.level,
              streak: verifiedMetrics8.streak,
              max_streak: verifiedMetrics8.max_streak,
              cheer_score: Number(soc.cheer_score || 0),
              recent_cheers: (soc.recent_cheers || []).slice(0, 5),
              tier: rpgSnap.tier || { id: 'bronze', name: 'Bậc Đồng', icon: '🥉' },
              temp_title: rpgSnap.temp_title || null,
              equipped_details: rpgSnap.equipped_details || {},
              periodic_unlocked: Number(rpgSnap.periodic?.unlocked_count || 3),
              periodic_unlocked_list: rpgSnap.periodic?.unlocked || [1, 6, 8],
              questions_conquered: Number(rpgSnap.questions_conquered || 0),
              // Tự động ẩn Khẩu hiệu mục tiêu khi bật Ẩn danh BXH (tránh lộ tên lớp/trường)
              motto: isAnonPublic ? '' : (rpgSnap.motto || 'Mỗi ngày tiến bộ 1% cùng Phúc K9!'),
              badges: computeBadges({ ...u, xp: baseXp }, {}),
              showcase: {
                ...(rpgSnap.showcase || {}),
                hero_badge_detail: heroBadgeDetail,
                showcase_badges_details: showcaseBadgesDetails
              },
              verified_metrics_8: verifiedMetrics8,
              exam_countdown: rpgSnap.exam_countdown,
              privacy_summary: {
                allow_1v1_invites: pv.allow_1v1_invites || 'everyone',
                school_visibility: pv.school_visibility || 'province_grade'
              },
              created_at: u.created_at || ''
            },
            comparison
          });
        }
      }

      return sendJson(res, 200, {
        ok: true,
        verified: false,
        is_guest_preview: true,
        issuer: 'HỌC CÙNG PHÚC K9',
        card_title: 'THẺ HỌC VIÊN ĐIỆN TỬ (BẢN TRẢI NGHIỆM)',
        verified_at: new Date().toISOString(),
        card: {
          username: normU || 'khach_k9',
          display_name: fallbackName,
          sbd: rawSbd || 'K9-GUEST',
          grade: fallbackGrade,
          school: fallbackSchool,
          role: 'guest',
          is_vip: false,
          is_admin: false,
          xp: 100,
          level: 1,
          streak: 1,
          tier: { id: 'bronze', name: 'Bậc Đồng', icon: '🥉' },
          equipped_details: {
            outfit: { id: 'outfit-scholar', name: 'Áo Blouse Thủ Khoa', icon: '🧑‍🎓' },
            frame: { id: 'frame-bronze', name: 'Khung Tân Binh Đồng', icon: '🥉', cssClass: 'pk9-frame-bronze' },
            aura: { id: 'aura-none', name: 'Khí Tức Khởi Nguyên', icon: '✨', cssClass: 'pk9-aura-spark' },
            title: { id: 'title-tanbinh', name: 'Tân Binh Bứt Phá', icon: '⚡' },
            pet: null,
            cardbg: { id: 'cardbg-ocean', name: 'Thẻ Đại Dương', icon: '🌊', cssClass: 'pk9-cardbg-ocean' }
          },
          periodic_unlocked: 3,
          questions_conquered: 0,
          motto: 'Mỗi ngày tiến bộ 1% cùng Phúc K9!',
          badges: ['Học Viên K9'],
          created_at: new Date().toISOString()
        }
      });
    }

    if (action === 'public-config' && req.method === 'GET') {
      let announcement = null;
      let customKhoaChui = [];
      try {
        announcement = await redis.get('phuc:system:announcement');
        if (typeof announcement === 'string') announcement = JSON.parse(announcement);
      } catch {}
      try {
        const rawKc = await redis.lrange('phuc:khoa-chui:items', 0, 199);
        customKhoaChui = (rawKc || []).map(x => typeof x === 'string' ? JSON.parse(x) : x).filter(Boolean);
      } catch {}
      return sendJson(res, 200, { ok: true, announcement, custom_khoa_chui: customKhoaChui });
    }

    return sendJson(res, 400, { ok: false, message: 'Hành động không hợp lệ.' });
  } catch (err) {
    console.error('dashboard-api', err);
    return sendJson(res, 500, { ok: false, message: 'Không thể xử lý dashboard.' });
  }
};
