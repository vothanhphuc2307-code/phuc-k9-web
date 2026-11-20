'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const SEED_EXAMS = require('./seed-exams');
const { USER_PREFIX, normalizeUsername, isAdminAccount } = require('./auth');
const { vnWeekKey, applyRewardMultipliers, ensureUserRpgState, bxhEngine } = require('./rpg');

const DUEL_OPEN_KEY = 'phuc:duel:open';
const CONTESTS_KEY = 'phuc:contest:list';
const CONTEST_INIT_KEY = 'phuc:contest:init';

let CACHED_POOL = null;

function mapCourseSubjectLabel(course) {
  const txt = `${course?.id || ''} ${course?.name || ''} ${course?.shortName || ''}`.toLowerCase();
  if (txt.includes('toán')) return 'Toán';
  if (txt.includes('vật lí') || txt.includes('vật lý') || txt.includes('vat')) return 'Vật lí';
  if (txt.includes('hóa') || txt.includes('hoa')) return 'Hóa học';
  if (txt.includes('sinh')) return 'Sinh học';
  if (txt.includes('anh') || txt.includes('english')) return 'Tiếng Anh';
  if (txt.includes('sử') || txt.includes('lich')) return 'Lịch sử';
  if (txt.includes('địa') || txt.includes('dia')) return 'Địa lí';
  if (txt.includes('đgnl') || txt.includes('dgnl') || txt.includes('v-act') || txt.includes('hsa')) return 'ĐGNL';
  return 'Tổng hợp';
}

function mapExamSubjectLabel(raw) {
  const s = String(raw || '').toLowerCase();
  if (s === 'math' || s.includes('toán')) return 'Toán';
  if (s === 'physics' || s.includes('vật')) return 'Vật lí';
  if (s === 'chemistry' || s.includes('hóa')) return 'Hóa học';
  if (s === 'biology' || s.includes('sinh')) return 'Sinh học';
  if (s === 'english' || s.includes('anh')) return 'Tiếng Anh';
  if (s === 'history' || s.includes('sử')) return 'Lịch sử';
  if (s === 'dgnl' || s.includes('đgnl')) return 'ĐGNL';
  return raw || 'Tổng hợp';
}

function loadArenaQuestionPool() {
  if (Array.isArray(CACHED_POOL) && CACHED_POOL.length) return CACHED_POOL;
  const pool = [];
  const seen = new Set();

  // 1. Seed official interactive exams (MCQ)
  for (const ex of (SEED_EXAMS || [])) {
    const subj = ex.examType === 'dgnl' ? 'ĐGNL' : mapExamSubjectLabel(ex.subject);
    for (const q of (ex.questions || [])) {
      if (String(q.type || '').toLowerCase() !== 'mcq') continue;
      if (!Array.isArray(q.options) || q.options.length < 2) continue;
      const ansIdx = ['A', 'B', 'C', 'D'].indexOf(String(q.answer || '').trim().toUpperCase());
      if (ansIdx < 0 || ansIdx >= q.options.length) continue;
      const id = String(q.id || `seed-${pool.length}`);
      if (seen.has(id)) continue;
      seen.add(id);
      pool.push({
        id,
        subject: subj,
        topic: String(q.topic || ex.title || 'Tổng hợp').slice(0, 80),
        question: String(q.text || q.prompt || '').slice(0, 900),
        options: q.options.slice(0, 4).map(o => (typeof o === 'object' && o !== null ? String(o.text || '') : String(o))),
        correct: ansIdx,
        solution: String(q.explanation || '').slice(0, 900)
      });
    }
  }

  // 2. Curriculum exercises in assets/pk9-curriculum.js
  try {
    const curPath = path.join(__dirname, '..', 'assets', 'pk9-curriculum.js');
    if (fs.existsSync(curPath)) {
      const src = fs.readFileSync(curPath, 'utf8');
      const sandbox = { window: {} };
      vm.runInNewContext(src, sandbox, { timeout: 1500 });
      const catalog = Array.isArray(sandbox.window.PK9_CATALOG) ? sandbox.window.PK9_CATALOG : [];
      for (const course of catalog) {
        const subj = mapCourseSubjectLabel(course);
        for (const ch of (course.chapters || [])) {
          for (const t of (ch.topics || [])) {
            for (const ex of (t.exercises || [])) {
              if (!Array.isArray(ex.options) || ex.options.length < 2) continue;
              const ansIdx = Number(ex.correct);
              if (!Number.isInteger(ansIdx) || ansIdx < 0 || ansIdx >= ex.options.length) continue;
              const id = `cur_${course.id}_${t.id}_${ex.id || pool.length}`;
              if (seen.has(id)) continue;
              seen.add(id);
              pool.push({
                id,
                subject: subj,
                topic: String(t.title || ch.title || course.shortName || subj).slice(0, 80),
                question: String(ex.question || '').slice(0, 900),
                options: ex.options.slice(0, 4).map(String),
                correct: ansIdx,
                solution: String(ex.solution || '').slice(0, 900)
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('arena-pool-curriculum', err?.message);
  }

  CACHED_POOL = pool;
  return CACHED_POOL;
}

function parseJsonSafe(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'K9';
  for (let i = 0; i < 4; i++) out += chars[crypto.randomInt(0, chars.length)];
  return out;
}

function sanitizeRoomPublic(room, viewerUsername = '') {
  if (!room) return null;
  const playersArr = Object.values(room.players || {});
  const bothDone = playersArr.length >= 2 && playersArr.every(p => p.status === 'submitted');
  const normViewer = normalizeUsername(viewerUsername);
  const viewerDone = normViewer && room.players?.[normViewer]?.status === 'submitted';

  return {
    code: room.code,
    title: room.title,
    subject: room.subject,
    count: room.count,
    status: room.status,
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    host: room.host,
    hostName: room.hostName,
    winner: room.winner || null,
    players: playersArr.map(p => ({
      username: p.username,
      displayName: p.displayName,
      status: p.status,
      score: (p.status === 'submitted' && (bothDone || p.username === normViewer)) ? p.score : null,
      correct: (p.status === 'submitted' && (bothDone || p.username === normViewer)) ? p.correct : null,
      timeSec: (p.status === 'submitted' && (bothDone || p.username === normViewer)) ? p.timeSec : null,
      submittedAt: p.submittedAt || null
    })),
    questions: (room.questions || []).map(q => ({
      id: q.id,
      subject: q.subject,
      topic: q.topic,
      question: q.question,
      options: q.options,
      ...(viewerDone ? { correct: q.correct, solution: q.solution } : {})
    }))
  };
}

async function listOpenDuels(redis) {
  try {
    const codes = (await redis.lrange(DUEL_OPEN_KEY, 0, 24)) || [];
    if (!codes.length) return [];
    const rooms = await Promise.all(codes.map(c => redis.get(`phuc:duel:room:${String(c).toUpperCase()}`).catch(() => null)));
    const now = Date.now();
    const out = [];
    const seen = new Set();
    for (const raw of rooms) {
      const r = parseJsonSafe(raw);
      if (!r || !r.code || seen.has(r.code) || Number(r.expiresAt || 0) < now) continue;
      seen.add(r.code);
      const players = Object.values(r.players || {});
      out.push({
        code: r.code,
        title: r.title,
        subject: r.subject,
        count: r.count,
        status: r.status,
        host: r.host || '',
        hostName: r.hostName || r.host,
        playerCount: players.length,
        players: players.map(p => ({ username: p.username, displayName: p.displayName, status: p.status, score: p.status === 'submitted' ? p.score : null })),
        winner: r.winner || null,
        createdAt: r.createdAt
      });
    }
    return out.slice(0, 12);
  } catch {
    return [];
  }
}

async function createDuelRoom(redis, userObj, opts = {}) {
  const pool = loadArenaQuestionPool();
  const subject = String(opts.subject || 'Tất cả').trim().slice(0, 40) || 'Tất cả';
  const count = [5, 10].includes(Number(opts.count)) ? Number(opts.count) : 5;
  let candidates = subject === 'Tất cả' || subject === 'ALL'
    ? pool.slice()
    : pool.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
  if (candidates.length < count) candidates = pool.slice();

  // Fisher-Yates shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const picked = candidates.slice(0, count);

  let code = genRoomCode();
  for (let t = 0; t < 4; t++) {
    const exists = await redis.get(`phuc:duel:room:${code}`).catch(() => null);
    if (!exists) break;
    code = genRoomCode();
  }

  const now = Date.now();
  const uname = normalizeUsername(userObj.username);
  const dname = String(userObj.display_name || uname).slice(0, 60);
  const room = {
    code,
    title: String(opts.title || `Thách đấu ${subject} (${count} câu)`).trim().slice(0, 100),
    subject,
    count: picked.length,
    status: 'open',
    createdAt: now,
    expiresAt: now + 48 * 3600 * 1000,
    host: uname,
    hostName: dname,
    winner: null,
    players: {
      [uname]: {
        username: uname,
        displayName: dname,
        joinedAt: now,
        status: 'playing',
        answers: {},
        score: 0,
        correct: 0,
        timeSec: 0
      }
    },
    questions: picked
  };

  await redis.set(`phuc:duel:room:${code}`, JSON.stringify(room), { ex: 60 * 60 * 48 });
  try {
    await redis.lpush(DUEL_OPEN_KEY, code);
    await redis.ltrim(DUEL_OPEN_KEY, 0, 29);
  } catch {}
  return room;
}

async function joinDuelRoom(redis, codeRaw, userObj) {
  const code = String(codeRaw || '').trim().toUpperCase().slice(0, 12);
  if (!code) return { ok: false, status: 400, message: 'Vui lòng nhập mã phòng đấu.' };
  const room = parseJsonSafe(await redis.get(`phuc:duel:room:${code}`).catch(() => null));
  if (!room || Number(room.expiresAt || 0) < Date.now()) {
    return { ok: false, status: 404, message: 'Phòng thách đấu không tồn tại hoặc đã hết hạn.' };
  }

  const uname = normalizeUsername(userObj.username);
  const dname = String(userObj.display_name || uname).slice(0, 60);
  if (!room.players[uname]) {
    if (Object.keys(room.players || {}).length >= 2) {
      return { ok: false, status: 409, message: 'Phòng đấu 1v1 này đã đủ 2 đấu thủ rồi!' };
    }
    room.players[uname] = {
      username: uname,
      displayName: dname,
      joinedAt: Date.now(),
      status: 'playing',
      answers: {},
      score: 0,
      correct: 0,
      timeSec: 0
    };
  }
  const pCount = Object.keys(room.players).length;
  if (room.status === 'open' && pCount >= 2) room.status = 'active';
  await redis.set(`phuc:duel:room:${code}`, JSON.stringify(room), { ex: 60 * 60 * 48 });
  return { ok: true, room };
}

async function submitDuelRoom(redis, codeRaw, userObj, rawAnswers = {}, timeSecRaw = 60) {
  const code = String(codeRaw || '').trim().toUpperCase().slice(0, 12);
  const room = parseJsonSafe(await redis.get(`phuc:duel:room:${code}`).catch(() => null));
  if (!room) return { ok: false, status: 404, message: 'Không tìm thấy phòng thách đấu.' };

  const uname = normalizeUsername(userObj.username);
  if (!room.players[uname]) {
    if (Object.keys(room.players).length >= 2) {
      return { ok: false, status: 409, message: 'Phòng đấu này đã đủ 2 người chơi.' };
    }
    room.players[uname] = {
      username: uname,
      displayName: String(userObj.display_name || uname).slice(0, 60),
      joinedAt: Date.now(),
      status: 'playing'
    };
  }

  const player = room.players[uname];
  if (player.status === 'submitted') {
    return { ok: true, already: true, room, reward: player.rewards || { gold: 0, xp: 0 } };
  }

  const rawTimeSec = timeSecRaw !== undefined && timeSecRaw !== null && timeSecRaw !== '' ? Number(timeSecRaw) : 60;
  const timeSec = Math.max(3, Math.min(1800, Math.round(Number.isFinite(rawTimeSec) ? rawTimeSec : 60)));
  let correct = 0;
  const cleanAns = {};
  for (const q of (room.questions || [])) {
    const picked = rawAnswers?.[q.id];
    const pickedIdx = picked === null || picked === undefined || picked === '' ? -1 : Number(picked);
    if (Number.isInteger(pickedIdx) && pickedIdx >= 0 && pickedIdx < 4) {
      cleanAns[q.id] = pickedIdx;
      if (pickedIdx === Number(q.correct)) correct += 1;
    }
  }
  const speedBonus = correct > 0 ? Math.max(0, Math.round(120 / Math.max(8, timeSec))) : 0;
  const score = correct * 100 + speedBonus;

  player.status = 'submitted';
  player.answers = cleanAns;
  player.correct = correct;
  player.score = score;
  player.timeSec = timeSec;
  player.submittedAt = Date.now();

  // Grant participation reward immediately (atomic per player + room)
  const isAdm = isAdminAccount(userObj);
  let myReward = { gold: 0, xp: 0, dxh: 0, early_quit_strike: 0 };
  const baseKey = `phuc:xp:duel:base:${code}:${uname}`;
  const gotBase = !!(await redis.set(baseKey, '1', { nx: true, ex: 60 * 60 * 24 * 60 }));
  if (gotBase) {
    const r = applyRewardMultipliers(userObj, 12 + correct * 2, 10 + correct, 0, isAdm);
    myReward.gold = r.gold;
    myReward.xp = r.xp;
  }

  // R5 Mục 1 Dòng 6: Thoát sớm < 15 giây ghi nhận NGAY khi nộp (không chờ đối thủ) -> 3 lần khóa nhận ĐXH 1v1 48h
  if (!isAdm && timeSec < 15 && !player.earlyQuitRecorded) {
    ensureUserRpgState(userObj);
    const bxhSelf = userObj.rpg.bxh;
    bxhSelf.weekly_stats.early_quit_1v1_count = Number(bxhSelf.weekly_stats.early_quit_1v1_count || 0) + 1;
    if (bxhSelf.weekly_stats.early_quit_1v1_count >= 3) {
      bxhSelf.weekly_stats.duel_1v1_locked_until = Date.now() + 48 * 3600 * 1000;
    }
    player.earlyQuitRecorded = true;
    myReward.early_quit_strike = bxhSelf.weekly_stats.early_quit_1v1_count;
  }

  const playersList = Object.values(room.players);
  if (playersList.length >= 2 && playersList.every(p => p.status === 'submitted')) {
    room.status = 'finished';
    const [p1, p2] = playersList.slice(0, 2);
    let winType = 'draw';
    let winUname = null;
    if (p1.score > p2.score || (p1.score === p2.score && p1.timeSec < p2.timeSec)) {
      winType = 'win';
      winUname = p1.username;
    } else if (p2.score > p1.score || (p2.score === p1.score && p2.timeSec < p1.timeSec)) {
      winType = 'win';
      winUname = p2.username;
    }
    room.winner = {
      type: winType,
      username: winUname,
      displayName: winUname ? room.players[winUname]?.displayName : 'Hòa nhau',
      decidedAt: Date.now()
    };

    // Grant winner / draw / serious loss bonus & BXH ĐXH Tuần atomically to BOTH players (with 7-day anti-win-trading)
    const oppObjs = {
      [p1.username]: p1.username === uname ? userObj : parseJsonSafe(await redis.get(`${USER_PREFIX}${p1.username}`).catch(() => null)),
      [p2.username]: p2.username === uname ? userObj : parseJsonSafe(await redis.get(`${USER_PREFIX}${p2.username}`).catch(() => null))
    };
    const nowMs = Date.now();
    const totalQuestionsInRoom = Math.max(1, (room.questions || []).length);

    // Ensure state and snapshot pre-match Elo BEFORE mutating either player (fixes Underdog >=200 Elo gap check!)
    const preMatchElo = {};
    for (const p of [p1, p2]) {
      const uObj = oppObjs[p.username];
      if (uObj) {
        ensureUserRpgState(uObj);
        preMatchElo[p.username] = Number(uObj.rpg?.bxh?.weekly_stats?.duel_1v1_elo || 1000);
      } else {
        preMatchElo[p.username] = 1000;
      }
    }

    for (const p of [p1, p2]) {
      const other = p.username === p1.username ? p2 : p1;
      const uObj = oppObjs[p.username];
      if (!uObj) continue;

      const winKey = `phuc:xp:duel:win:${code}:${p.username}`;
      const isWinner = winType === 'win' && winUname === p.username;
      const isDraw = winType === 'draw';
      const granted = !!(await redis.set(winKey, '1', { nx: true, ex: 60 * 60 * 24 * 60 }));
      if (!granted) continue;

      const pIsAdm = isAdminAccount(uObj);
      if (isWinner || isDraw) {
        const bonusGold = isWinner ? 28 : 13;
        const bonusXp = isWinner ? 25 : 15;
        const r = applyRewardMultipliers(uObj, bonusGold, bonusXp, 0, pIsAdm);
        if (p.username === uname) {
          myReward.gold += r.gold;
          myReward.xp += r.xp;
        }
      }

      // R1/R5 Quality Gate & Anti-Win-Trading cho Đấu Trường 1v1
      const answeredCount = Object.keys(p.answers || {}).length;
      const answeredRatio = answeredCount / totalQuestionsInRoom;
      const pTimeSec = Number(p.timeSec || 60);
      const seriousPlay = pTimeSec >= 60 && answeredRatio >= 0.6;
      const bxh = uObj.rpg.bxh;
      const soc = uObj.rpg.social;
      soc.duel_1v1_total_matches = Number(soc.duel_1v1_total_matches || 0) + 1;
      if (isWinner) soc.duel_1v1_total_wins = Number(soc.duel_1v1_total_wins || 0) + 1;

      // R5 Mục 1 Dòng 6: Thoát sớm < 15 giây (chỉ cộng nếu chưa ghi nhận ở bước nộp bài trước đó)
      if (!pIsAdm && pTimeSec < 15 && !p.earlyQuitRecorded) {
        bxh.weekly_stats.early_quit_1v1_count = Number(bxh.weekly_stats.early_quit_1v1_count || 0) + 1;
        if (bxh.weekly_stats.early_quit_1v1_count >= 3) {
          bxh.weekly_stats.duel_1v1_locked_until = nowMs + 48 * 3600 * 1000;
        }
        p.earlyQuitRecorded = true;
        if (p.username === uname) {
          myReward.early_quit_strike = bxh.weekly_stats.early_quit_1v1_count;
        }
      }

      const lastMetMs = Number(bxh.weekly_stats.duel_recent_opponents?.[other.username] || 0);
      const metWithin7Days = lastMetMs > 0 && (nowMs - lastMetMs) < 7 * 86400000;
      const pairCountWeek = Number(bxh.weekly_stats.duel_pair_week_count?.[other.username] || 0);
      const isLocked48h = Number(bxh.weekly_stats.duel_1v1_locked_until || 0) > nowMs;

      bxh.weekly_stats.duel_recent_opponents[other.username] = nowMs;
      bxh.weekly_stats.duel_pair_week_count[other.username] = pairCountWeek + 1;

      if (seriousPlay && !pIsAdm && !isLocked48h) {
        // Elo, Thắng 1v1 hợp lệ cho Phó Bảng #1, Chuỗi thắng Chiến Thần & Underdog CHỈ tính nếu chưa gặp đối thủ này trong 7 ngày gần nhất
        if (!metWithin7Days) {
          bxh.weekly_stats.duel_1v1_matches = Number(bxh.weekly_stats.duel_1v1_matches || 0) + 1;
          if (isWinner) bxh.weekly_stats.duel_1v1_wins = Number(bxh.weekly_stats.duel_1v1_wins || 0) + 1;
          const myElo = Number(preMatchElo[p.username] || 1000);
          const oppElo = Number(preMatchElo[other.username] || 1000);
          if (isWinner) {
            bxh.weekly_stats.duel_1v1_elo = myElo + 24;
            bxh.weekly_stats.duel_1v1_streak = Number(bxh.weekly_stats.duel_1v1_streak || 0) + 1;
            if ([3, 5, 10].includes(bxh.weekly_stats.duel_1v1_streak)) {
              bxh.badge_counters['badge-arena-warlord'] = Number(bxh.badge_counters['badge-arena-warlord'] || 0) + 1;
            }
            if (oppElo - myElo >= 200) {
              bxh.badge_counters['badge-underdog'] = Number(bxh.badge_counters['badge-underdog'] || 0) + 1;
            }
          } else if (isDraw) {
            bxh.weekly_stats.duel_1v1_streak = 0;
          } else {
            bxh.weekly_stats.duel_1v1_elo = Math.max(800, myElo - 16);
            bxh.weekly_stats.duel_1v1_streak = 0;
          }
        }

        // Cộng ĐXH 1v1: Thắng +45, Hòa +25, Thua nghiêm túc +15 (Trần 5 trận/ngày & tối đa 2 trận/cặp/tuần)
        if (bxh.daily_caps.duel_1v1_today < 5 && pairCountWeek < 2) {
          bxh.daily_caps.duel_1v1_today += 1;
          const rawDxh = isWinner ? 45 : isDraw ? 25 : 15;
          const dxhOut = bxhEngine.grantWeeklyDxh(uObj, rawDxh, { source: 'duel_1v1' });
          if (p.username === uname) {
            myReward.dxh = dxhOut.grantedDxh;
          }
        }
      }

      if (p.username !== uname) {
        uObj.last_active = new Date().toISOString();
        await redis.set(`${USER_PREFIX}${p.username}`, uObj);
      }
    }
  }

  player.rewards = myReward;
  userObj.last_active = new Date().toISOString();
  await redis.set(`${USER_PREFIX}${uname}`, userObj);
  await redis.set(`phuc:duel:room:${code}`, JSON.stringify(room), { ex: 60 * 60 * 48 });

  return { ok: true, already: false, room, reward: myReward };
}

function getCurrentVnWeekWindow() {
  const vnNow = Date.now() + 7 * 3600 * 1000;
  const d = new Date(vnNow);
  const dow = (d.getUTCDay() + 6) % 7; // Mon = 0 .. Sun = 6
  const startVn = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow, 0, 0, 0);
  const endVn = startVn + 7 * 86400000 - 1000;
  return {
    weekKey: vnWeekKey(),
    startAt: new Date(startVn - 7 * 3600 * 1000).toISOString(),
    endAt: new Date(endVn - 7 * 3600 * 1000).toISOString()
  };
}

function contestStatus(c) {
  const now = Date.now();
  const s = new Date(c.startAt).getTime();
  const e = new Date(c.endAt).getTime();
  if (now < s) return 'upcoming';
  if (now <= e) return 'live';
  return 'ended';
}

async function listContests(redis) {
  let list = parseJsonSafe(await redis.get(CONTESTS_KEY).catch(() => null));
  const initialized = await redis.get(CONTEST_INIT_KEY).catch(() => null);
  if (!Array.isArray(list) && !initialized) {
    const win = getCurrentVnWeekWindow();
    list = [
      {
        id: `contest-${win.weekKey.toLowerCase()}`,
        title: `🏆 Kỳ Thi Thử Toàn Hệ Thống (${win.weekKey}) — Đấu Trường 9+`,
        examId: 'exam-toan-lam-dong-2026-lan1',
        examTitle: 'Toán 12 • Đề khảo sát chất lượng THPT Sở GD&ĐT Lâm Đồng 2026 – Lần 1',
        startAt: win.startAt,
        endAt: win.endAt,
        rewardDiamonds: 5,
        rewardBadge: 'Thủ Khoa Đợt Thi',
        lockAnswersWhileLive: false,
        createdBy: 'system'
      }
    ];
    try {
      await redis.set(CONTESTS_KEY, JSON.stringify(list));
      await redis.set(CONTEST_INIT_KEY, '1');
    } catch {}
  }
  const items = Array.isArray(list) ? list : [];
  return items.map(c => ({ ...c, status: contestStatus(c) }));
}

async function saveContest(redis, payload = {}, adminUsername = 'admin') {
  const title = String(payload.title || '').trim().slice(0, 140);
  const examId = String(payload.examId || '').trim().slice(0, 100);
  if (title.length < 3 || !examId) {
    return { ok: false, status: 400, message: 'Cần nhập tên kỳ thi (≥ 3 ký tự) và chọn đề thi.' };
  }
  const startMs = new Date(payload.startAt || Date.now()).getTime();
  const endMs = new Date(payload.endAt || Date.now() + 72 * 3600 * 1000).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return { ok: false, status: 400, message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' };
  }
  const list = (parseJsonSafe(await redis.get(CONTESTS_KEY).catch(() => null)) || []).filter(Boolean);
  const id = String(payload.id || `contest-${Date.now().toString(36)}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
  const rec = {
    id,
    title,
    examId,
    examTitle: String(payload.examTitle || '').slice(0, 160),
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    rewardDiamonds: Math.max(0, Math.min(50, Math.round(Number(payload.rewardDiamonds || 5)))),
    rewardBadge: String(payload.rewardBadge || 'Chiến Thần Kỳ Thi').slice(0, 60),
    lockAnswersWhileLive: Boolean(payload.lockAnswersWhileLive),
    createdBy: adminUsername,
    updatedAt: new Date().toISOString()
  };
  const idx = list.findIndex(x => x.id === id);
  if (idx >= 0) list[idx] = rec;
  else list.unshift(rec);

  await redis.set(CONTESTS_KEY, JSON.stringify(list.slice(0, 20)));
  await redis.set(CONTEST_INIT_KEY, '1');
  return { ok: true, contest: { ...rec, status: contestStatus(rec) } };
}

async function deleteContest(redis, idRaw) {
  const id = String(idRaw || '').trim();
  const list = (parseJsonSafe(await redis.get(CONTESTS_KEY).catch(() => null)) || []).filter(c => c && c.id !== id);
  await redis.set(CONTESTS_KEY, JSON.stringify(list));
  await redis.set(CONTEST_INIT_KEY, '1');
  return { ok: true, count: list.length };
}

async function recordContestSubmission(redis, contestId, userObj, result, timeSec = 0, opts = {}) {
  if (!contestId || !userObj?.username) return { entries: [], dxhGranted: 0, pctBonus: 0 };
  const lbKey = `phuc:contest:lb:${contestId}`;
  const list = parseJsonSafe(await redis.get(lbKey).catch(() => null)) || [];
  const uname = normalizeUsername(userObj.username);
  const entry = {
    username: uname,
    displayName: String(userObj.display_name || uname).slice(0, 60),
    score: Number(result?.score || 0),
    correct: Number(result?.correct || 0),
    total: Number(result?.total || 0),
    timeSec: Math.max(1, Math.round(Number(timeSec || 60))),
    submittedAt: new Date().toISOString()
  };
  const idx = list.findIndex(x => x.username === uname);
  if (idx >= 0) {
    const prev = list[idx];
    if (entry.score > prev.score || (entry.score === prev.score && entry.timeSec < prev.timeSec)) {
      list[idx] = entry;
    }
  } else {
    list.push(entry);
  }
  list.sort((a, b) => b.score - a.score || a.timeSec - b.timeSec);
  const capped = list.slice(0, 100);
  await redis.set(lbKey, JSON.stringify(capped), { ex: 60 * 60 * 24 * 90 });

  // Cộng ĐXH Đấu Trường 9+: +120 ĐXH hoàn thành (trong trần ngày) + 30 -> 250 ĐXH thưởng phân vị (1 lần/tuần, ngoài trần ngày)
  // Yêu cầu vượt qua Quality Gate để chống nộp trắng 1 giây ăn +150 ĐXH
  let dxhGranted = 0;
  let pctBonus = 0;
  const passedGate = opts.passedQualityGate !== false;
  if (!isAdminAccount(userObj) && passedGate) {
    ensureUserRpgState(userObj);
    const bxh = userObj.rpg.bxh;
    if (!bxh.weekly_stats.contest_9plus_done) {
      bxh.weekly_stats.contest_9plus_done = true;
      const baseGrant = bxhEngine.grantWeeklyDxh(userObj, 120, { source: 'contest_9plus_complete', bypassDailyCap: false });
      const sc = Math.max(0, Math.min(10, Number(result?.score || 0)));
      pctBonus = sc >= 9.0 ? 250 : sc >= 8.0 ? 180 : sc >= 7.0 ? 120 : sc >= 5.0 ? 70 : 30;
      bxh.weekly_stats.contest_9plus_bonus = pctBonus;
      const bonusGrant = bxhEngine.grantWeeklyDxh(userObj, pctBonus, { source: 'contest_9plus_percentile', bypassDailyCap: true });
      dxhGranted = Number(baseGrant?.grantedDxh || 0) + Number(bonusGrant?.grantedDxh || 0);
    }
  }

  return { entries: capped, dxhGranted, pctBonus };
}

async function getContestLeaderboard(redis, contestId) {
  const lbKey = `phuc:contest:lb:${String(contestId || '').trim()}`;
  const list = parseJsonSafe(await redis.get(lbKey).catch(() => null)) || [];
  return Array.isArray(list) ? list : [];
}

module.exports = {
  loadArenaQuestionPool,
  sanitizeRoomPublic,
  listOpenDuels,
  createDuelRoom,
  joinDuelRoom,
  submitDuelRoom,
  listContests,
  saveContest,
  deleteContest,
  recordContestSubmission,
  getContestLeaderboard
};
