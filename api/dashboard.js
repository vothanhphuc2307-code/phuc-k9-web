const { getRedis } = require('../lib/redis');
const { USER_PREFIX, getSession, getCsrf, requireCsrf, sendJson, parseCookies, setCookie } = require('../lib/auth');
const crypto = require('crypto');

const ATTEMPTS_KEY = 'phuc:exam-attempts';
const MAX_ATTEMPTS = 5000;

function isAdmin(username) {
  return String(process.env.ADMIN_USERNAME || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(String(username || '').trim().toLowerCase());
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
  try { return await redis.get(`${USER_PREFIX}${username}`); } catch { return null; }
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
function visitorCookieOptions(maxAge = 60 * 60 * 24 * 365) {
  return { httpOnly: false, maxAge, sameSite: 'lax', secure: true, path: '/' };
}
function validVisitorId(v) {
  return /^[a-f0-9-]{24,80}$/i.test(String(v || ''));
}

async function trackVisitor(req, res, redis) {
  const cookies = parseCookies(req);
  let vid = String(cookies.phuc_visitor || '');
  if (!validVisitorId(vid)) {
    vid = crypto.randomUUID();
    setCookie(res, 'phuc_visitor', vid, visitorCookieOptions());
  }
  const day = vnDayKey();
  const month = day.slice(0, 7);
  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
  }
  const event = String(body?.event || 'pageview').toLowerCase() === 'heartbeat' ? 'heartbeat' : 'pageview';
  try {
    await redis.sadd('phuc:visitors:all', vid);
    await redis.sadd(`phuc:visitors:day:${day}`, vid);
    await redis.expire?.(`phuc:visitors:day:${day}`, 60 * 60 * 24 * 90);
    await redis.sadd(`phuc:visitors:month:${month}`, vid);
    await redis.expire?.(`phuc:visitors:month:${month}`, 60 * 60 * 24 * 400);
    if (event === 'pageview') {
      try { await redis.incr('phuc:pageviews:all'); } catch {}
      try { await redis.incr(`phuc:pageviews:day:${day}`); } catch {}
      try { await redis.expire?.(`phuc:pageviews:day:${day}`, 60 * 60 * 24 * 90); } catch {}
      const path = clean(body?.path || '/', 220) || '/';
      const source = clean(body?.ref || '', 220) || 'direct';
      const device = body?.mobile ? 'mobile' : 'desktop';
      try { await redis.zincrby(`phuc:analytics:path:${day}`, 1, path); } catch {}
      try { await redis.zincrby(`phuc:analytics:ref:${day}`, 1, source); } catch {}
      try { await redis.zincrby(`phuc:analytics:device:${day}`, 1, device); } catch {}
      try { await redis.expire?.(`phuc:analytics:path:${day}`, 60 * 60 * 24 * 90); } catch {}
      try { await redis.expire?.(`phuc:analytics:ref:${day}`, 60 * 60 * 24 * 90); } catch {}
      try { await redis.expire?.(`phuc:analytics:device:${day}`, 60 * 60 * 24 * 90); } catch {}
    }
    try { await redis.set(`phuc:visitors:online:${vid}`, String(Date.now()), { ex: 60 * 5 }); } catch {}
  } catch (e) {
    console.error('visitor-track', e);
  }
  return vid;
}

async function uniqueWindow(redis, days) {
  const ids = new Set();
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = `phuc:visitors:day:${vnDayKey(d)}`;
    try {
      const vals = await redis.smembers(key);
      if (Array.isArray(vals)) for (const v of vals) ids.add(String(v));
    } catch {
      break;
    }
  }
  return ids.size;
}

async function listAttempts(redis) {
  let raw = [];
  try { raw = await redis.lrange(ATTEMPTS_KEY, 0, MAX_ATTEMPTS - 1); } catch { raw = []; }
  return raw.map(x => { try { return typeof x === 'string' ? JSON.parse(x) : x; } catch { return null; } }).filter(Boolean);
}

async function collectAllUsers(redis) {
  const map = new Map();
  let cursor = 0;
  try {
    do {
      const scan = await redis.scan(cursor, { match: `${USER_PREFIX}*`, count: 100 });
      cursor = Number(scan?.[0] ?? 0);
      const keys = Array.isArray(scan?.[1]) ? scan[1] : [];
      if (keys.length) {
        const vals = await Promise.all(keys.map(k => redis.get(k).catch(() => null)));
        for (const u of vals) {
          if (u && u.username) map.set(u.username, u);
        }
      }
    } while (cursor !== 0);
  } catch {}
  try {
    const indexed = await redis.smembers('phuc:users:index');
    if (Array.isArray(indexed)) {
      const missing = indexed.filter(uname => uname && !map.has(uname));
      if (missing.length) {
        const vals = await Promise.all(missing.map(uname => redis.get(`${USER_PREFIX}${uname}`).catch(() => null)));
        for (const u of vals) {
          if (u && u.username) map.set(u.username, u);
        }
      }
    }
  } catch {}
  return Array.from(map.values());
}

module.exports = async function handler(req, res) {
  try {
    const action = String(req.query?.action || 'overview').toLowerCase();
    const redis = getRedis();
    const session = await getSession(req);

    if (action === 'track-visitor' && (req.method === 'POST' || req.method === 'GET')) {
      await trackVisitor(req, res, redis);
      return sendJson(res, 204, { ok: true });
    }

    if (action === 'leaderboard' && req.method === 'GET') {
      const now = new Date();
      const currentWeek = vnWeekKey(now);
      const attempts = await listAttempts(redis);
      const stats = new Map();

      for (const a of attempts) {
        const u = a.username;
        if (!u) continue;
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

      const dbUsers = await collectAllUsers(redis);
      const rowsByUsername = new Map();

      for (const u of dbUsers) {
        const x = stats.get(u.username) || {
          username: u.username,
          display_name: u.display_name || u.username,
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

        rowsByUsername.set(u.username, {
          username: u.username,
          display_name: u.display_name || x.display_name || u.username,
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
          isRegisteredUser: true,
          updatedAt: x.updatedAt || u.last_active || u.created_at || ''
        });
      }

      // Include any real exam attempts from users whose profile wasn't in collectAllUsers
      for (const [uname, x] of stats.entries()) {
        if (rowsByUsername.has(uname)) continue;
        const xp = x.attempts * 60;
        const li = levelInfo(xp);
        rowsByUsername.set(uname, {
          username: uname,
          display_name: x.display_name || uname,
          school: '',
          grade: '2K9',
          avatar_data: null,
          xp,
          weeklyXp: x.weeklyAttempts * 60,
          level: li.level,
          streak: 1,
          xpToNext: li.next - li.into,
          attempts: x.attempts,
          weeklyAttempts: x.weeklyAttempts,
          bestScore: x.bestScore,
          weeklyBestScore: x.weeklyBestScore,
          avgScore: x.attempts ? Math.round((x.totalScore / x.attempts) * 100) / 100 : 0,
          accuracy: x.totalQuestions ? Math.round((x.totalCorrect / x.totalQuestions) * 100) : 0,
          lessonsDone: 0,
          badges: ['Thành Viên K9'],
          isRegisteredUser: true,
          updatedAt: x.updatedAt
        });
      }

      const allRows = Array.from(rowsByUsername.values());

      const topLeaderboard = allRows
        .slice()
        .sort((a, b) => b.xp - a.xp || b.bestScore - a.bestScore || b.attempts - a.attempts || b.streak - a.streak)
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      const weeklyLeaderboard = allRows
        .slice()
        .sort((a, b) => b.weeklyXp - a.weeklyXp || b.weeklyBestScore - a.weeklyBestScore || b.weeklyAttempts - a.weeklyAttempts || b.xp - a.xp)
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      const examLeaderboard = allRows
        .slice()
        .filter(r => r.attempts > 0 || r.bestScore > 0)
        .sort((a, b) => b.bestScore - a.bestScore || b.avgScore - a.avgScore || b.attempts - a.attempts || b.xp - a.xp)
        .slice(0, 50)
        .map((row, idx) => ({ ...row, rank: idx + 1 }));

      let myRank = null;
      if (session?.username) {
        const u = session.username;
        const topIdx = topLeaderboard.findIndex(r => r.username === u);
        const wkIdx = weeklyLeaderboard.findIndex(r => r.username === u);
        const exIdx = examLeaderboard.findIndex(r => r.username === u);
        myRank = {
          username: u,
          topRank: topIdx >= 0 ? topIdx + 1 : null,
          weeklyRank: wkIdx >= 0 ? wkIdx + 1 : null,
          examRank: exIdx >= 0 ? exIdx + 1 : null,
          entry: rowsByUsername.get(u) || null
        };
      }

      return sendJson(res, 200, {
        ok: true,
        week_key: currentWeek,
        leaderboard: topLeaderboard,
        weekly_leaderboard: weeklyLeaderboard,
        exam_leaderboard: examLeaderboard,
        my_rank: myRank
      });
    }

    if (action === 'record-exam' && req.method === 'POST') {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Hãy đăng nhập để lưu kết quả và vào bảng xếp hạng.' });
      const csrf = session.csrf || await getCsrf(req, res);
      if (!requireCsrf(req, session, csrf)) return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
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

      const uProfile = await getUser(redis, session.username);
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
      const review = Array.isArray(body.review) ? body.review.slice(0, 60) : [];

      const attempt = {
        attempt_id: attemptId || `att-${Date.now()}`,
        username: session.username,
        display_name: clean(uProfile?.display_name || body.display_name || session.username, 80),
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
        ? `phuc:xp:exam:${session.username}:${attemptId}`
        : `phuc:xp:exam:${session.username}:${crypto.createHash('sha1').update(JSON.stringify({ examId, score, correct, total: totalQuestions })).digest('hex')}`;

      let xpEarned = 0, duplicate = false;
      try {
        const granted = !!(await redis.set(baseKey, '1', { nx: true, ex: 60 * 60 * 24 * 365 }));
        if (granted) {
          await redis.lpush(ATTEMPTS_KEY, JSON.stringify(attempt));
          try { await redis.ltrim(ATTEMPTS_KEY, 0, MAX_ATTEMPTS - 1); } catch {}
          xpEarned = examXp(score);
          const u = uProfile || await getUser(redis, session.username);
          if (u) {
            const wk = vnWeekKey();
            if (u.week_key !== wk) {
              u.week_key = wk;
              u.weekly_xp = 0;
            }
            u.xp = Math.max(100, Number(u.xp || 0)) + xpEarned;
            u.weekly_xp = Math.max(0, Number(u.weekly_xp || 0)) + xpEarned;
            u.exam_xp = Math.max(0, Number(u.exam_xp || 0)) + xpEarned;
            u.streak = Math.max(1, Number(u.streak || 1));
            u.last_active = new Date().toISOString();
            u.badges = computeBadges(u, { bestScore: score, attempts: 1 });
            await redis.set(`${USER_PREFIX}${session.username}`, u);
            try { await redis.sadd('phuc:users:index', session.username); } catch {}
          }
        } else {
          duplicate = true;
        }
      } catch (e) {
        console.warn('exam-xp', e?.message);
      }

      const u = await getUser(redis, session.username);
      const xpTotal = Math.max(0, Number(u?.xp || 0));
      const weeklyXp = Math.max(0, Number(u?.weekly_xp || 0));
      const li = levelInfo(xpTotal);
      return sendJson(res, 200, {
        ok: true,
        saved: true,
        score,
        xp_earned: xpEarned,
        xp_total: xpTotal,
        weekly_xp: weeklyXp,
        level: li.level,
        duplicate
      });
    }

    if (action === 'record-study' && req.method === 'POST') {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Hãy đăng nhập để tích lũy XP học tập.' });
      const csrf = session.csrf || await getCsrf(req, res);
      if (!requireCsrf(req, session, csrf)) return sendJson(res, 403, { ok: false, message: 'CSRF token không hợp lệ.', csrf });
      let body = req.body || {};
      if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      }
      const studyType = clean(body.type || 'lesson', 40);
      const itemId = clean(body.item_id || body.lesson_id || `study-${Date.now()}`, 120);
      const xpReward = studyType === 'flashcard' ? 20 : studyType === 'quiz' ? 30 : 25;
      const key = `phuc:xp:study:${session.username}:${studyType}:${itemId}`;
      let xpEarned = 0, duplicate = false;
      const u = await getUser(redis, session.username);
      if (!u) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy tài khoản.' });
      const granted = !!(await redis.set(key, '1', { nx: true, ex: 60 * 60 * 24 * 180 }));
      if (granted) {
        xpEarned = xpReward;
        const wk = vnWeekKey();
        if (u.week_key !== wk) {
          u.week_key = wk;
          u.weekly_xp = 0;
        }
        u.xp = Math.max(100, Number(u.xp || 0)) + xpEarned;
        u.weekly_xp = Math.max(0, Number(u.weekly_xp || 0)) + xpEarned;
        u.study_xp = Math.max(0, Number(u.study_xp || 0)) + xpEarned;
        u.last_active = new Date().toISOString();
        await redis.set(`${USER_PREFIX}${session.username}`, u);
        try { await redis.sadd('phuc:users:index', session.username); } catch {}
      } else {
        duplicate = true;
      }
      const li = levelInfo(u.xp);
      return sendJson(res, 200, {
        ok: true,
        xp_earned: xpEarned,
        xp_total: Number(u.xp || 0),
        weekly_xp: Number(u.weekly_xp || 0),
        level: li.level,
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
      if (!session || !isAdmin(session.username)) return sendJson(res, 403, { ok: false, message: 'Không có quyền quản trị.' });
      const allUsers = await collectAllUsers(redis);
      const start = todayStart();
      const users = allUsers.length;
      const activeToday = allUsers.filter(u => u?.last_active && new Date(u.last_active).getTime() >= start).length;
      let uploads = 0;
      try { uploads = Number(await redis.llen('phuc:student-library')) || 0; } catch {}
      const attempts = await listAttempts(redis);
      let visitorsAll = 0, visitorsToday = 0, visitors7d = 0, visitors30d = 0, pageviewsAll = 0, pageviewsToday = 0, online = 0;
      try { visitorsAll = Number(await redis.scard('phuc:visitors:all')) || 0; } catch {}
      try { visitorsToday = Number(await redis.scard(`phuc:visitors:day:${vnDayKey()}`)) || 0; } catch {}
      try { visitors7d = await uniqueWindow(redis, 7); } catch {}
      try { visitors30d = await uniqueWindow(redis, 30); } catch {}
      try { pageviewsAll = Number(await redis.get('phuc:pageviews:all')) || 0; } catch {}
      try { pageviewsToday = Number(await redis.get(`phuc:pageviews:day:${vnDayKey()}`)) || 0; } catch {}
      try { const scan = await redis.scan(0, { match: 'phuc:visitors:online:*', count: 200 }); online = Array.isArray(scan?.[1]) ? scan[1].length : 0; } catch {}
      const nowDay = vnDayKey();
      let returningToday = 0, newToday = 0;
      try {
        const todayIds = new Set((await redis.smembers(`phuc:visitors:day:${nowDay}`) || []).map(String));
        const older = new Set();
        for (let i = 1; i < 90; i++) {
          const d = new Date(Date.now() - i * 86400000);
          const vals = await redis.smembers(`phuc:visitors:day:${vnDayKey(d)}`);
          if (Array.isArray(vals)) for (const v of vals) older.add(String(v));
        }
        for (const id of todayIds) { if (older.has(id)) returningToday++; else newToday++; }
      } catch {}
      const returnRate = visitorsToday ? Math.round((returningToday / visitorsToday) * 100) : 0;
      return sendJson(res, 200, {
        ok: true,
        stats: {
          users,
          uploads,
          exam_attempts: attempts.length,
          today: activeToday,
          unique_visitors: visitorsAll,
          unique_today: visitorsToday,
          unique_7d: visitors7d,
          unique_30d: visitors30d,
          pageviews_all: pageviewsAll,
          pageviews_today: pageviewsToday,
          online,
          returning_today: returningToday,
          new_today: newToday,
          return_rate: returnRate
        }
      });
    }

    return sendJson(res, 400, { ok: false, message: 'Hành động không hợp lệ.' });
  } catch (err) {
    console.error('dashboard-api', err);
    return sendJson(res, 500, { ok: false, message: 'Không thể xử lý dashboard.' });
  }
};
