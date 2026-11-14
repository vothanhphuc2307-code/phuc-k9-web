const { getRedis } = require('../lib/redis');
const {
  USER_PREFIX, getSession, getCsrf, requireCsrf, sendJson, parseCookies, setCookie,
  hashPassword, verifyPassword, safeUser, normalizeUsername, isAdminUsername, isAdminAccount
} = require('../lib/auth');
const crypto = require('crypto');
const {
  CATALOG,
  RANK_TIERS,
  vnWeekKey: rpgWeekKey,
  ensureUserRpgState,
  buildPublicRpgSnapshot,
  applyRewardMultipliers,
  performCheckin,
  claimDailyMission,
  buyCatalogItem,
  equipCatalogItem,
  convertCurrency,
  recordSrsAnswer,
  toggleExamBookmark,
  openPeriodicCell
} = require('../lib/rpg');

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
    const raw = await redis.zrange(`phuc:rpg:journey_week:${wk}:${safeGrade}`, 0, 14, { rev: true, withScores: true }).catch(() => []);
    const pairs = parseZrangePairs(raw);
    const out = [];
    for (const pair of pairs) {
      const uname = normalizeUsername(pair.name || '');
      const score = Number(pair.count || 0);
      if (!uname || isAdminUsername(uname) || isGuestUsername(uname)) continue;
      let meta = await redis.get(`phuc:rpg:journey_meta:${uname}`).catch(() => null);
      if (typeof meta === 'string') {
        try { meta = JSON.parse(meta); } catch { meta = null; }
      }
      out.push({
        rank: out.length + 1,
        username: uname,
        display_name: meta?.display_name || uname,
        grade: meta?.grade || safeGrade,
        outfit_icon: meta?.outfit_icon || '🧑‍🎓',
        frame_class: meta?.frame_class || 'pk9-frame-bronze',
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
  if (isAdminUsername(session.username)) return true;
  try {
    const u = await redis.get(`${USER_PREFIX}${session.username}`);
    const obj = typeof u === 'string' ? JSON.parse(u) : u;
    return isAdminAccount(obj);
  } catch {
    return false;
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
  try {
    do {
      const scan = await redis.scan(cursor, { match: matchPattern, count: 150 });
      cursor = Number(scan?.[0] ?? 0);
      const batch = Array.isArray(scan?.[1]) ? scan[1] : [];
      for (const k of batch) {
        keys.push(k);
        if (keys.length >= cap) return keys;
      }
    } while (cursor !== 0);
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
  const activeTab = clean(body?.tab || 'home', 40) || 'home';
  const pathName = clean(body?.path || '/', 220) || '/';
  const sessionId = clean(body?.session_id || '', 64);

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

async function collectAllUsers(redis) {
  const map = new Map();
  const keys = await scanKeys(redis, `${USER_PREFIX}*`, 1500);
  if (keys.length) {
    const vals = await Promise.all(keys.map(k => redis.get(k).catch(() => null)));
    for (const u of vals) {
      const obj = safeParseObj(u);
      if (obj && obj.username) map.set(obj.username, obj);
    }
  }
  try {
    const indexed = await redis.smembers('phuc:users:index');
    if (Array.isArray(indexed)) {
      const missing = indexed.filter(uname => uname && !map.has(uname));
      if (missing.length) {
        const vals = await Promise.all(missing.map(uname => redis.get(`${USER_PREFIX}${uname}`).catch(() => null)));
        for (const u of vals) {
          const obj = safeParseObj(u);
          if (obj && obj.username) map.set(obj.username, obj);
        }
      }
    }
  } catch {}
  return Array.from(map.values());
}

async function handleRpgRequest(redis, req, res, session, action) {
  if (action === 'rpg-state' && req.method === 'GET') {
    const rawGrade = String(req.query?.grade || '2K9').toUpperCase();
    const grade = ['2K9', '2K8', 'DGNL', '2K11', '2K12'].includes(rawGrade) ? rawGrade : '2K9';
    let userRpg = null;
    if (session?.username && !isGuestUsername(session.username)) {
      const u = await getUser(redis, session.username);
      if (u) userRpg = buildPublicRpgSnapshot(u);
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

  const u = await getUser(redis, session.username);
  if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy tài khoản.' });
  const isAdm = isAdminAccount(u) || isAdminUsername(session.username);
  ensureUserRpgState(u);

  const sub = action.slice(4);
  let out = null;

  if (sub === 'checkin') {
    out = performCheckin(u, isAdm);
  } else if (sub === 'claim-mission') {
    out = claimDailyMission(u, clean(body.mission_id || '', 40), isAdm);
  } else if (sub === 'buy') {
    out = buyCatalogItem(u, body.item_id);
  } else if (sub === 'equip') {
    out = equipCatalogItem(u, body.item_id, clean(body.unequip || '', 20));
  } else if (sub === 'convert') {
    out = convertCurrency(u, clean(body.direction || '', 30), body.amount);
  } else if (sub === 'bookmark') {
    out = toggleExamBookmark(u, body);
  } else if (sub === 'periodic-open') {
    out = openPeriodicCell(u, { mode: clean(body.mode || 'random', 20), z: body.z });
  } else if (sub === 'practice-finish') {
    const mode = body.mode === 'srs' ? 'srs' : 'practice';
    const results = Array.isArray(body.results) ? body.results.slice(0, 40) : [];
    let correctCount = 0;
    for (const item of results) {
      const ok = Boolean(item?.correct);
      if (ok) correctCount += 1;
      if (item?.id) {
        recordSrsAnswer(u, item.id, ok, {
          topic: item.topic || '',
          subject: item.subject || ''
        });
      }
    }
    const total = Math.max(1, results.length);
    if (mode === 'srs') {
      u.rpg.daily.srs_count = Number(u.rpg.daily.srs_count || 0) + total;
    } else {
      u.rpg.daily.practice_count = Number(u.rpg.daily.practice_count || 0) + 1;
    }
    u.rpg.questions_conquered = Number(u.rpg.questions_conquered || 0) + correctCount;
    const baseGold = Math.min(80, 10 + correctCount * 6);
    const baseXp = Math.min(45, 5 + correctCount * 3);
    const granted = applyRewardMultipliers(u, baseGold, baseXp, 0, isAdm);
    out = {
      ok: true,
      mode,
      correct: correctCount,
      total,
      granted,
      message: mode === 'srs'
        ? `📒 Đã ôn ${total} câu Sổ Ôn Tập (Đúng ${correctCount}/${total}): +${granted.gold} Vàng${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
        : `⚡ Hoàn thành lượt Luyện Nhiệm Vụ (${correctCount}/${total} câu): +${granted.gold} Vàng${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
    };
  } else if (sub === 'journey-submit') {
    const islandId = clean(body.island_id || 'island-toan', 60);
    const correct = Math.max(0, Math.min(50, Math.round(Number(body.correct || 0))));
    const total = Math.max(1, Math.min(50, Math.round(Number(body.total || 5))));
    const timeSec = Math.max(1, Math.min(3600, Math.round(Number(body.time_sec || 60))));
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
    const granted = applyRewardMultipliers(u, 15 + stars * 10 + correct * 3, 10 + stars * 6, stars === 3 && prev.stars < 3 ? 1 : 0, isAdm);

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
          grade,
          outfit_icon: snap.equipped_details?.outfit?.icon || '🧑‍🎓',
          frame_class: snap.equipped_details?.frame?.cssClass || 'pk9-frame-bronze',
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
  } else if (sub === 'settings') {
    if (body.paper_theme && ['paper-white', 'paper-ivory', 'paper-softgray'].includes(body.paper_theme)) {
      u.rpg.paper_theme = body.paper_theme;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'motto')) {
      u.rpg.motto = clean(body.motto || '', 90);
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

      const [attempts, dbUsers, deletedRaw] = await Promise.all([
        listAttempts(redis),
        collectAllUsers(redis),
        redis.smembers('phuc:users:deleted').catch(() => [])
      ]);
      const deletedSet = new Set((deletedRaw || []).map(x => normalizeUsername(x)).filter(Boolean));
      const stats = new Map();

      for (const a of attempts) {
        const u = normalizeUsername(a.username);
        if (!u || isGuestUsername(u) || deletedSet.has(u)) continue;
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
          updatedAt: a.created_at || ''
        };
        const sc = normScore(a.score);
        cur.attempts += 1;
        cur.totalScore += sc;
        cur.bestScore = Math.max(cur.bestScore, sc);
        cur.totalCorrect += Number(a.correct || 0);
        cur.totalQuestions += Number(a.total_questions || 0);
        if (isWithinCurrentWeek(a.created_at, now)) {
          cur.weeklyAttempts += 1;
          cur.weeklyTotalScore += sc;
          cur.weeklyBestScore = Math.max(cur.weeklyBestScore, sc);
        }
        if ((a.created_at || '') > cur.updatedAt) cur.updatedAt = a.created_at;
        stats.set(u, cur);
      }

      const rowsByUsername = new Map();
      const excludedUsernames = new Set(deletedSet);

      for (const u of dbUsers) {
        const normU = normalizeUsername(u.username);
        if (!normU || deletedSet.has(normU)) continue;
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
          updatedAt: u.last_active || u.created_at || ''
        };
        const doneCount = u.progress?.done && typeof u.progress.done === 'object'
          ? Object.values(u.progress.done).filter(Boolean).length
          : 0;
        const baseXp = Math.max(0, Number(u.xp || 0));
        const wkXp = u.week_key === currentWeek
          ? Math.max(0, Number(u.weekly_xp || 0))
          : 0;
        const li = levelInfo(baseXp);
        const accuracy = x.totalQuestions ? Math.round((x.totalCorrect / x.totalQuestions) * 100) : 0;
        const avgScore = x.attempts ? Math.round((x.totalScore / x.attempts) * 100) / 100 : 0;

        const rpgSnap = buildPublicRpgSnapshot(u);

        rowsByUsername.set(normU, {
          username: normU,
          display_name: u.display_name || x.display_name || normU,
          school: u.settings?.school || '',
          grade: u.settings?.preferred_grade || '2K9',
          avatar_data: u.avatar_data || u.avatar_url || null,
          xp: baseXp,
          weeklyXp: wkXp,
          level: li.level,
          streak: Math.max(1, Number(u.streak || 1)),
          xpToNext: li.next - li.into,
          attempts: x.attempts,
          weeklyAttempts: x.weeklyAttempts,
          bestScore: x.bestScore,
          weeklyBestScore: x.weeklyBestScore,
          avgScore,
          accuracy,
          lessonsDone: doneCount,
          badges: computeBadges({ ...u, xp: baseXp }, x),
          rpg_tier: rpgSnap.tier?.name || 'Bậc Đồng',
          rpg_frame: rpgSnap.equipped_details?.frame?.cssClass || 'pk9-frame-bronze',
          rpg_title: rpgSnap.equipped_details?.title?.name || '',
          rpg_pet: rpgSnap.equipped_details?.pet?.icon || '',
          rpg_outfit: rpgSnap.equipped_details?.outfit?.icon || '',
          isRegisteredUser: true,
          updatedAt: x.updatedAt || u.last_active || u.created_at || ''
        });
      }

      // Registered accounts only — unauthenticated/guest or deleted accounts never enter BXH
      const allRows = Array.from(rowsByUsername.values());

      const sortedTop = allRows
        .slice()
        .sort((a, b) => b.xp - a.xp || b.bestScore - a.bestScore || b.attempts - a.attempts || b.streak - a.streak);
      const topLeaderboard = sortedTop
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      const sortedWeekly = allRows
        .slice()
        .sort((a, b) => b.weeklyXp - a.weeklyXp || b.weeklyBestScore - a.weeklyBestScore || b.weeklyAttempts - a.weeklyAttempts || b.xp - a.xp);
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
      if (session?.username) {
        const u = normalizeUsername(session.username);
        const isSessionAdm = excludedUsernames.has(u) || isAdminUsername(u);
        const topIdx = isSessionAdm ? -1 : sortedTop.findIndex(r => r.username === u);
        const wkIdx = isSessionAdm ? -1 : sortedWeekly.findIndex(r => r.username === u);
        const exIdx = isSessionAdm ? -1 : sortedExam.findIndex(r => r.username === u);
        myRank = {
          username: u,
          is_admin: isSessionAdm,
          excluded_from_leaderboard: isSessionAdm,
          topRank: topIdx >= 0 ? topIdx + 1 : null,
          weeklyRank: wkIdx >= 0 ? wkIdx + 1 : null,
          examRank: exIdx >= 0 ? exIdx + 1 : null,
          entry: isSessionAdm ? null : (rowsByUsername.get(u) || null)
        };
      }

      return sendJson(res, 200, {
        ok: true,
        locked: false,
        server_time: now.toISOString(),
        week_key: currentWeek,
        total_students: allRows.length,
        leaderboard: topLeaderboard,
        weekly_leaderboard: weeklyLeaderboard,
        exam_leaderboard: examLeaderboard,
        my_rank: myRank
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
        : Number(body.total_questions || 0) || 0;
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

      let xpEarned = 0, goldEarned = 0, diamondsEarned = 0, duplicate = false;
      try {
        const granted = !!(await redis.set(baseKey, '1', { nx: true, ex: 60 * 60 * 24 * 365 }));
        if (granted) {
          await redis.lpush(ATTEMPTS_KEY, JSON.stringify(attempt));
          try { await redis.ltrim(ATTEMPTS_KEY, 0, MAX_ATTEMPTS - 1); } catch {}
          const u = uProfile || await getUser(redis, normUser);
          const isAdm = isAdminAccount(u) || isAdminUsername(normUser);
          xpEarned = isAdm ? 0 : examXp(score);
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
            }
            u.last_active = new Date().toISOString();
            await redis.set(`${USER_PREFIX}${normUser}`, u);
            try { await redis.sadd('phuc:users:index', normUser); } catch {}
          }
        } else {
          duplicate = true;
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
      const key = `phuc:xp:study:${normUser}:${studyType}:${itemId}`;
      let xpEarned = 0, goldEarned = 0, duplicate = false;
      const u = await getUser(redis, normUser);
      if (!u) return sendJson(res, 401, { ok: false, auth_required: true, message: 'Không tìm thấy tài khoản.' });
      const isAdm = isAdminAccount(u) || isAdminUsername(normUser);
      const wk = vnWeekKey();
      if (u.week_key !== wk) {
        u.week_key = wk;
        u.weekly_xp = 0;
      }
      const granted = !!(await redis.set(key, '1', { nx: true, ex: 60 * 60 * 24 * 180 }));
      if (granted) {
        xpEarned = isAdm ? 0 : xpReward;
        const rpg = ensureUserRpgState(u);
        rpg.daily.study_count = Number(rpg.daily.study_count || 0) + 1;
        goldEarned = applyRewardMultipliers(u, 15, 0, 0, isAdm).gold;
        if (!isAdm) {
          u.xp = Math.max(100, Number(u.xp || 0)) + xpEarned;
          u.weekly_xp = Math.max(0, Number(u.weekly_xp || 0)) + xpEarned;
          u.study_xp = Math.max(0, Number(u.study_xp || 0)) + xpEarned;
        }
        u.last_active = new Date().toISOString();
        await redis.set(`${USER_PREFIX}${normUser}`, u);
        try { await redis.sadd('phuc:users:index', normUser); } catch {}
      } else {
        duplicate = true;
      }
      const li = levelInfo(u.xp);
      return sendJson(res, 200, {
        ok: true,
        xp_earned: xpEarned,
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
      const attempts = (await listAttempts(redis))
        .filter(a => a.username === session.username)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 50);
      return sendJson(res, 200, { ok: true, attempts });
    }

    if (action === 'overview' && req.method === 'GET') {
      if (!session || !(await isSessionAdmin(redis, session))) return sendJson(res, 403, { ok: false, message: 'Không có quyền quản trị.' });
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
      if (!session || !(await isSessionAdmin(redis, session))) {
        return sendJson(res, 403, { ok: false, message: 'Chỉ tài khoản Quản Trị Viên (Admin) mới có quyền truy cập Trung tâm điều hành.' });
      }
      const [allUsers, attempts, snap] = await Promise.all([
        collectAllUsers(redis),
        listAttempts(redis),
        collectTrafficSnapshot(redis, { detailed: true })
      ]);
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
        return {
          username: u.username,
          display_name: u.display_name || u.username,
          role: isAdminAccount(u) ? 'admin' : (u.role || 'student'),
          is_vip: Boolean(u.is_vip || u.role === 'vip' || isAdminAccount(u)),
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

      const activeTodayCount = allUsers.filter(u => u?.last_active && new Date(u.last_active).getTime() >= start).length;
      const avgExamScore = attempts.length ? Math.round((totalScoreAll / attempts.length) * 100) / 100 : 0;
      const defaultAdminRec = allUsers.find(u => normalizeUsername(u?.username) === 'admin');
      const curAdminRec = allUsers.find(u => normalizeUsername(u?.username) === normalizeUsername(session.username));
      const weakAdminPassword = Boolean(
        (defaultAdminRec && verifyPassword('admin123', defaultAdminRec)) ||
        (curAdminRec && verifyPassword('admin123', curAdminRec))
      );

      return sendJson(res, 200, {
        ok: true,
        server_time: now.toISOString(),
        week_key: currentWeek,
        storage_mode: redis.__isMemoryFallback ? 'Memory Fallback (Local Dev)' : 'Upstash Redis Cloud',
        weak_admin_password: weakAdminPassword,
        kpis: {
          total_users: allUsers.length,
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
        audit_logs: auditLogs
      });
    }

    if (action === 'admin-action' && req.method === 'POST') {
      if (!session || !(await isSessionAdmin(redis, session))) {
        return sendJson(res, 403, { ok: false, message: 'Không có quyền quản trị.' });
      }
      const csrf = session.csrf || await getCsrf(req, res);
      if (!requireCsrf(req, session, csrf)) {
        return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
      }
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }
      const subAction = String(body.sub_action || '').toLowerCase();
      const targetUsername = String(body.username || '').trim().toLowerCase();

      async function logAdminAudit(eventTitle, detail) {
        try {
          await redis.lpush('phuc:admin:audit', JSON.stringify({
            id: `aud-${Date.now()}`,
            admin: session.username,
            event: eventTitle,
            detail,
            created_at: new Date().toISOString()
          }));
          await redis.ltrim('phuc:admin:audit', 0, 99);
        } catch {}
      }

      if (subAction === 'grant-xp') {
        const u = await getUser(redis, targetUsername);
        if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy học viên.' });
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
        const u = await getUser(redis, targetUsername);
        if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy học viên.' });
        const newRole = String(body.role || 'student').toLowerCase();
        u.role = newRole;
        u.is_admin = newRole === 'admin';
        u.is_vip = newRole === 'vip' || newRole === 'admin';
        const badgeSet = new Set(Array.isArray(u.badges) ? u.badges : ['Thành Viên K9']);
        if (newRole === 'admin') badgeSet.add('Quản Trị Viên K9');
        if (newRole === 'vip') badgeSet.add('Học Viên VIP Pro');
        u.badges = Array.from(badgeSet);
        await redis.set(`${USER_PREFIX}${targetUsername}`, u);
        await logAdminAudit('Phân quyền tài khoản', `@${targetUsername} → ${newRole.toUpperCase()}`);
        return sendJson(res, 200, { ok: true, message: `Đã chuyển vai trò của @${targetUsername} thành ${newRole.toUpperCase()}.`, user: safeUser(u) });
      }

      if (subAction === 'reset-password') {
        const u = await getUser(redis, targetUsername);
        if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy học viên.' });
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
        const role = String(body.role || 'student').toLowerCase();
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
        if (targetUsername === session.username) {
          return sendJson(res, 400, { ok: false, message: 'Không thể tự xóa tài khoản Admin đang đăng nhập.' });
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

      return sendJson(res, 400, { ok: false, message: 'Sub-action quản trị không hợp lệ.' });
    }

    if (action.startsWith('rpg-')) {
      return await handleRpgRequest(redis, req, res, session, action);
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
