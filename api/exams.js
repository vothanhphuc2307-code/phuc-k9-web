const { getRedis } = require('../lib/redis');
const { USER_PREFIX, getSession, sendJson, normalizeUsername, isAdminUsername, isAdminAccount, getUserByUsername } = require('../lib/auth');
const { normalizeScoring, questionNeedsReview, validateExamStructure } = require('../lib/exam-utils');
const {
  vnWeekKey,
  ensureUserRpgState,
  buildPublicRpgSnapshot,
  applyRewardMultipliers,
  recordSrsAnswer
} = require('../lib/rpg');
const SEED = require('../lib/seed-exams');
const crypto = require('crypto');

const ATTEMPTS_KEY = 'phuc:exam-attempts';
const MAX_ATTEMPTS = 5000;
const GUEST_SET = new Set(['guest', 'khach', 'khách', 'anonymous', 'k9-guest', 'khach_k9']);
function isGuestName(name) {
  const n = normalizeUsername(name);
  return !n || GUEST_SET.has(n);
}
function calcExamXp(score) {
  const s = Math.max(0, Math.min(10, Number(score) || 0));
  let bonus = 0;
  if (s >= 9.5) bonus = 80;
  else if (s >= 9) bonus = 60;
  else if (s >= 8) bonus = 45;
  else if (s >= 7) bonus = 30;
  else if (s >= 5) bonus = 15;
  return 60 + bonus;
}
function computeExamBadges(user, bestScore, attempts) {
  const set = new Set(Array.isArray(user?.badges) ? user.badges : []);
  set.add('Thành Viên K9');
  const xp = Number(user?.xp || 0);
  const streak = Number(user?.streak || 1);
  if (bestScore >= 9.0) set.add('Thợ Săn 9+');
  if (bestScore >= 9.5) set.add('Thủ Khoa Luyện Đề');
  if (attempts >= 5) set.add('Chiến Thần Luyện Đề');
  if (streak >= 7) set.add('Chuỗi 7 Ngày Lửa');
  if (xp >= 1000) set.add('Học Bá K9');
  return Array.from(set).slice(0, 6);
}

const key = (...p) => 'phuc:exam:' + p.join(':');
const clean = (v, max = 400) => String(v ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);

async function isAdminSession(session) {
  if (!session?.username) return false;
  if (isAdminUsername(session.username)) return true;
  const u = await getUserByUsername(session.username);
  return isAdminAccount(u);
}
function csrfOk(req, session) {
  return !session || String(req.headers['x-csrf-token'] || '') === String(session.csrf || '');
}
function parseBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string' && req.body.trim()) {
    try { return Promise.resolve(JSON.parse(req.body)); } catch { return Promise.reject(new Error('JSON không hợp lệ')); }
  }
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => {
      s += c;
      if (s.length > 3e6) reject(new Error('Payload quá lớn'));
    });
    req.on('end', () => {
      try { resolve(s ? JSON.parse(s) : {}); } catch { reject(new Error('JSON không hợp lệ')); }
    });
    req.on('error', reject);
  });
}
async function redisJsonGet(r, k) {
  let x = await r.get(k);
  if (typeof x === 'string') {
    try { x = JSON.parse(x); } catch { x = null; }
  }
  return x || null;
}

function normalizeExamMeta(e) {
  e = JSON.parse(JSON.stringify(e || {}));
  e.program = e.program || (String(e.grade || '') === '12' || String(e.grade || '').toUpperCase() === '2K9' ? '2k9' : '');
  e.subject = e.subject || 'other';
  e.year = e.year || '2026';
  e.examType = e.examType || 'other';
  e.examPeriod = e.examPeriod || '';
  e.semester = e.semester || '';
  e.examSession = e.examSession || '';
  e.originUrl = e.originUrl || '';
  e.source = e.source || e.sourceOrg || '';
  if (e.duration === undefined && e.durationMin !== undefined) {
    e.duration = Number(e.durationMin) || 50;
  }
  e.periodLabel = e.periodLabel || ([e.examType, e.semester, e.year].filter(Boolean).join(' • ') || 'Kỳ thi chuẩn cấu trúc');
  if (Array.isArray(e.questions)) {
    e.questions = e.questions.map((q, idx) => {
      if (!q || typeof q !== 'object') return q;
      const nq = { ...q };
      if (!nq.text && nq.prompt) nq.text = String(nq.prompt);
      if (!nq.number) nq.number = idx + 1;
      if (nq.type === 'true_false') nq.type = 'truefalse';
      if (nq.type === 'short_answer') nq.type = 'short';
      if (!nq.section) {
        const p = Number(nq.part);
        nq.section = p === 2 || nq.type === 'truefalse' ? 'II' : p === 3 || nq.type === 'short' ? 'III' : 'I';
      }
      if (nq.type === 'mcq') {
        if (!Array.isArray(nq.options) && Array.isArray(nq.choices)) nq.options = nq.choices;
        if (typeof nq.answer === 'number' && nq.answer >= 0 && nq.answer < 26) {
          nq.answer = String.fromCharCode(65 + nq.answer);
        }
      }
      if (nq.type === 'short' && Array.isArray(nq.answer)) {
        nq.acceptedAnswers = nq.answer.map(String);
        nq.answer = String(nq.answer[0] ?? '');
      }
      return nq;
    });
  }
  e.scoring = normalizeScoring(e);
  return e;
}

function publicExam(e) {
  e = normalizeExamMeta(e);
  return {
    id: e.id,
    title: e.title,
    subject: e.subject,
    grade: e.grade,
    program: e.program,
    year: e.year,
    examType: e.examType,
    examPeriod: e.examPeriod,
    semester: e.semester,
    examSession: e.examSession,
    periodLabel: e.periodLabel,
    source: e.source,
    sourceFile: e.sourceFile,
    originUrl: e.originUrl,
    duration: e.duration,
    scoring: e.scoring,
    questionCount: (e.questions || []).length,
    questions: (e.questions || []).map(q => {
      const x = {
        id: q.id,
        section: q.section,
        type: q.type,
        number: q.number,
        topic: q.topic || '',
        text: q.text,
        sourcePage: q.sourcePage,
        imageUrl: q.imageUrl,
        imageAlt: q.imageAlt,
        table: q.table,
        reviewRequired: !!q.reviewRequired
      };
      if (q.type === 'mcq') x.options = q.options;
      if (q.type === 'truefalse') x.statements = (q.statements || []).map(s => ({ text: s.text }));
      if (q.type === 'short') x.input = true;
      return x;
    })
  };
}

function adminExam(e) {
  return e;
}

function norm(v) {
  let s = String(v ?? '').trim().toLowerCase();
  s = s.replace(/,/g, '.').replace(/\s+/g, '').replace(/%$/, '');
  s = s.replace(/(km|m|j|kg|nghìn?đồng|đồng|k|v|mev|l|g|gam)$/i, '');
  return s;
}

function eqShort(user, q) {
  const u = norm(user);
  const vals = (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length ? q.acceptedAnswers : [q.answer]).map(norm);
  if (vals.includes(u)) return true;
  if (!u) return false;
  const un = Number(u);
  if (Number.isFinite(un)) {
    return vals.some(v => {
      const n = Number(v);
      return Number.isFinite(n) && Math.abs(un - n) <= 1e-6;
    });
  }
  return false;
}

function sanitizeAnswers(exam, answers) {
  const src = answers && typeof answers === 'object' && !Array.isArray(answers) ? answers : {};
  const out = {};
  for (const q of exam.questions || []) {
    if (!Object.prototype.hasOwnProperty.call(src, q.id)) continue;
    const a = src[q.id];
    if (q.type === 'mcq') {
      const v = String(a ?? '').trim().toUpperCase();
      if (/^[A-Z]$/.test(v)) out[q.id] = v;
    } else if (q.type === 'truefalse') {
      const arr = Array.isArray(a) ? a : [];
      out[q.id] = arr.slice(0, Array.isArray(q.statements) ? q.statements.length : 0).map(v =>
        v === true || v === 'true' || v === 1 || v === '1'
          ? true
          : v === false || v === 'false' || v === 0 || v === '0'
          ? false
          : null
      );
    } else if (q.type === 'short') {
      const v = String(a ?? '').trim();
      if (v.length <= 200) out[q.id] = v;
    }
  }
  return out;
}

function maxRawScore(exam) {
  const sc = normalizeScoring(exam);
  let max = 0;
  for (const q of exam.questions || []) {
    if (q.type === 'mcq') max += Number(sc.mcq ?? 0.25);
    else if (q.type === 'truefalse') {
      const arr = Array.isArray(sc.tf) ? sc.tf : [0, 0.1, 0.25, 0.5, 1];
      max += Number(arr[arr.length - 1] || 0);
    } else if (q.type === 'short') max += Number(sc.short ?? 0.25);
  }
  return Number(max.toFixed(4));
}

function countAnswered(exam, answers) {
  let n = 0;
  for (const q of exam.questions || []) {
    const a = answers?.[q.id];
    if (q.type === 'truefalse') {
      if (Array.isArray(a) && a.some(v => v === true || v === false)) n++;
    } else if (String(a ?? '').trim()) {
      n++;
    }
  }
  return n;
}

function grade(exam, answers) {
  answers = sanitizeAnswers(exam, answers);
  let score = 0, correct = 0, total = 0;
  const review = [];
  const topicMap = new Map();
  const sc = normalizeScoring(exam);

  for (const q of exam.questions || []) {
    total++;
    const a = answers?.[q.id];
    let pts = 0, ok = false, detail = null, maxPts = 0;

    if (q.type === 'mcq') {
      maxPts = Number(sc.mcq ?? 0.25);
      ok = String(a ?? '') === String(q.answer);
      if (ok) pts = maxPts;
    } else if (q.type === 'truefalse') {
      const tfScale = Array.isArray(sc.tf) ? sc.tf : [0, 0.1, 0.25, 0.5, 1];
      maxPts = Number(tfScale[tfScale.length - 1] || 1);
      const arr = Array.isArray(a) ? a : [];
      let c = 0;
      detail = [];
      for (let i = 0; i < (q.statements || []).length; i++) {
        const got = arr[i];
        const yes = got === true || got === 'true' || got === 1 || got === '1';
        const no = got === false || got === 'false' || got === 0 || got === '0';
        const v = yes ? true : no ? false : null;
        const item = q.statements[i];
        const one = v !== null && v === !!item.answer;
        if (one) c++;
        detail.push({
          index: i,
          text: item.text,
          user: v,
          answer: !!item.answer,
          userChoice: v,
          expected: !!item.answer,
          correct: one
        });
      }
      pts = Number(tfScale[Math.min(c, tfScale.length - 1)] || 0);
      ok = c === (q.statements || []).length;
    } else if (q.type === 'short') {
      maxPts = Number(sc.short ?? 0.25);
      ok = eqShort(a, q);
      if (ok) pts = maxPts;
    }

    score += pts;
    if (ok) correct++;

    const topicName = q.topic || `Phần ${q.section || 'I'}`;
    const tStat = topicMap.get(topicName) || { topic: topicName, total: 0, correct: 0, earnedPts: 0, maxPts: 0 };
    tStat.total += 1;
    if (ok) tStat.correct += 1;
    tStat.earnedPts = Number((tStat.earnedPts + pts).toFixed(2));
    tStat.maxPts = Number((tStat.maxPts + maxPts).toFixed(2));
    topicMap.set(topicName, tStat);

    const earnedNum = Number(pts.toFixed(2));
    const maxNum = Number(maxPts.toFixed(2));
    review.push({
      id: q.id,
      number: q.number,
      section: q.section,
      type: q.type,
      topic: q.topic || '',
      text: q.text,
      options: q.type === 'mcq' ? q.options : undefined,
      userAnswer: a ?? null,
      earned: earnedNum,
      max: maxNum,
      points: earnedNum,
      maxPoints: maxNum,
      status: ok ? 'correct' : earnedNum > 0 ? 'partial' : 'wrong',
      correct: ok,
      correctAnswer: q.type === 'mcq'
        ? q.answer
        : q.type === 'short'
        ? (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length ? q.acceptedAnswers[0] : q.answer)
        : (q.statements || []).map(s => !!s.answer),
      acceptedAnswers: q.type === 'short' ? (q.acceptedAnswers || [q.answer]) : undefined,
      statements: detail,
      explanation: q.explanation || '',
      sourcePage: q.sourcePage,
      reviewRequired: !!q.reviewRequired
    });
  }

  const rawScore = Number(score.toFixed(2));
  const maxScore = maxRawScore(exam);
  const score10 = maxScore > 0 ? Number(((rawScore / maxScore) * 10).toFixed(2)) : 0;
  const answered = countAnswered(exam, answers);
  const topicStats = [...topicMap.values()].map(t => ({
    ...t,
    accuracy: t.maxPts > 0 ? Math.round((t.earnedPts / t.maxPts) * 100) : 0
  }));

  return {
    score: score10,
    rawScore,
    maxScore,
    correct,
    total,
    answered,
    unanswered: Math.max(0, total - answered),
    topicStats,
    review
  };
}

async function getExam(r, id) {
  let e = await redisJsonGet(r, key('def', id));
  if (e) return normalizeExamMeta(e);
  const seed = SEED.find(x => x.id === id) || null;
  return seed ? normalizeExamMeta(seed) : null;
}

async function handler(req, res) {
  try {
    const u = new URL(req.url || '/', 'http://localhost');
    const action = req.query?.action || u.searchParams.get('action') || 'list';
    const r = getRedis();

    if (req.method === 'GET') {
      if (action === 'list') {
        const ids = new Set(SEED.map(x => x.id));
        try {
          for (const id of (await r.smembers('phuc:exam:index')) || []) ids.add(String(id));
        } catch {}
        const out = [];
        for (const id of ids) {
          const x = await getExam(r, id);
          if (x && x.published !== false) out.push(publicExam(x));
        }
        return sendJson(res, 200, { ok: true, exams: out });
      }

      const session = await getSession(req);
      const id = clean(u.searchParams.get('id'), 200);

      if (action === 'get') {
        const e = await getExam(r, id);
        if (!e || e.published === false) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy đề.' });
        return sendJson(res, 200, { ok: true, exam: publicExam(e) });
      }

      if (action === 'resume') {
        const attemptId = clean(u.searchParams.get('attempt'), 200);
        const a = await redisJsonGet(r, key('attempt', attemptId));
        const currentUser = session?.username || 'guest';
        if (!a || (a.username !== 'guest' && a.username !== currentUser)) {
          return sendJson(res, 404, { ok: false, message: 'Không tìm thấy lượt thi đang mở.' });
        }
        if (a.submitted) {
          return sendJson(res, 200, {
            ok: true,
            attemptId: a.id,
            submitted: true,
            result: a.result,
            exam: publicExam(a.exam),
            submittedAt: a.submittedAt
          });
        }
        return sendJson(res, 200, {
          ok: true,
          attemptId: a.id,
          submitted: false,
          exam: publicExam(a.exam),
          savedAnswers: a.savedAnswers || {},
          startedAt: a.startedAt,
          expiresAt: a.expiresAt
        });
      }

      if (action === 'admin-list') {
        if (!(await isAdminSession(session))) return sendJson(res, 403, { ok: false, message: 'Chỉ admin.' });
        const seedIdSet = new Set(SEED.map(x => x.id));
        const ids = new Set(seedIdSet);
        try {
          for (const id of (await r.smembers('phuc:exam:index')) || []) ids.add(String(id));
        } catch {}
        const out = [];
        for (const id of ids) {
          const x = await getExam(r, id);
          if (x) {
            out.push({
              id: x.id,
              title: x.title,
              program: x.program,
              subject: x.subject,
              grade: x.grade,
              year: x.year,
              examType: x.examType,
              periodLabel: x.periodLabel,
              source: x.source,
              sourceFile: x.sourceFile,
              originUrl: x.originUrl,
              sourceId: x.sourceId,
              duration: x.duration,
              questionCount: (x.questions || []).length,
              published: x.published !== false,
              isSeed: seedIdSet.has(x.id),
              reviewCount: (x.questions || []).filter(questionNeedsReview).length,
              updatedAt: x.updatedAt || x.createdAt || null
            });
          }
        }
        out.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        return sendJson(res, 200, { ok: true, exams: out });
      }

      if (action === 'admin-get') {
        if (!(await isAdminSession(session))) return sendJson(res, 403, { ok: false, message: 'Chỉ admin.' });
        const e = await getExam(r, id);
        if (!e) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy đề.' });
        return sendJson(res, 200, { ok: true, exam: adminExam(e) });
      }

      if (action === 'history') {
        if (!session) return sendJson(res, 200, { ok: true, history: [] });
        const idx = await redisJsonGet(r, key('history', session.username));
        return sendJson(res, 200, { ok: true, history: Array.isArray(idx) ? idx : [] });
      }

      if (action === 'result') {
        const attemptId = clean(u.searchParams.get('attempt'), 200);
        const a = await redisJsonGet(r, key('attempt', attemptId));
        const currentUser = session?.username || 'guest';
        if (!a || (a.username !== 'guest' && a.username !== currentUser) || !a.submitted) {
          return sendJson(res, 404, { ok: false, message: 'Không tìm thấy kết quả.' });
        }
        return sendJson(res, 200, { ok: true, result: a.result, exam: publicExam(a.exam), submittedAt: a.submittedAt });
      }

      if (action === 'source') {
        const e = await getExam(r, id);
        if (!e) return sendJson(res, 404, { ok: false });
        return sendJson(res, 200, { ok: true, sourceFile: e.sourceFile, originUrl: e.originUrl });
      }

      return sendJson(res, 400, { ok: false, message: 'Action không hợp lệ.' });
    }

    if (req.method !== 'POST') return sendJson(res, 405, { ok: false, message: 'Method không được hỗ trợ.' });
    const session = await getSession(req);
    const body = await parseBody(req);

    // Admin actions require authenticated admin + CSRF
    if (['admin-import', 'publish', 'unpublish', 'delete'].includes(action)) {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Hãy đăng nhập tài khoản quản trị.' });
      if (!csrfOk(req, session)) return sendJson(res, 403, { ok: false, message: 'CSRF không hợp lệ.' });
      if (!(await isAdminSession(session))) return sendJson(res, 403, { ok: false, message: 'Chỉ admin.' });

      if (action === 'admin-import') {
        let e = normalizeExamMeta(body.exam);
        const structErr = validateExamStructure(e);
        if (structErr) return sendJson(res, 400, { ok: false, message: structErr });
        const existing = await getExam(r, clean(e.id, 200));
        e = { ...(existing || {}), ...e };
        e = normalizeExamMeta(e);
        e.id = clean(e.id, 200);
        e.title = clean(e.title, 300);
        e.source = clean(e.source, 300);
        e.sourceFile = clean(e.sourceFile || existing?.sourceFile, 300);
        e.originUrl = clean(e.originUrl || existing?.originUrl, 300);
        e.sourceId = clean(e.sourceId || existing?.sourceId, 120);
        e.program = clean(e.program, 40);
        e.subject = clean(e.subject, 40);
        e.grade = clean(e.grade, 20);
        e.year = clean(e.year, 20);
        e.examType = clean(e.examType, 60);
        e.examPeriod = clean(e.examPeriod, 80);
        e.semester = clean(e.semester, 40);
        e.examSession = clean(e.examSession, 80);
        e.periodLabel = clean(e.periodLabel, 120);
        const needs = (e.questions || []).filter(questionNeedsReview);
        const wantPub = Boolean(body.publish_now) && needs.length === 0;
        e.published = wantPub;
        if (wantPub) e.publishedAt = Date.now();
        e.updatedAt = Date.now();
        e.updatedBy = session.username;
        await r.set(key('def', e.id), JSON.stringify(e));
        try { await r.sadd('phuc:exam:index', e.id); } catch {}
        return sendJson(res, 200, {
          ok: true,
          exam_id: e.id,
          published: e.published,
          message: wantPub ? 'Đã nhập và xuất bản đề thi thành công!' : 'Đã lưu đề ở trạng thái nháp.',
          exam: adminExam(e)
        });
      }

      if (action === 'publish') {
        const e = await getExam(r, clean(body.id || body.exam_id, 200));
        if (!e) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy đề.' });
        const needs = (e.questions || []).filter(questionNeedsReview);
        if (needs.length) {
          return sendJson(res, 409, {
            ok: false,
            message: `Còn ${needs.length} câu cần rà soát đáp án trước khi xuất bản.`,
            questionIds: needs.map(q => q.id)
          });
        }
        e.published = true;
        e.publishedAt = Date.now();
        e.updatedBy = session.username;
        await r.set(key('def', e.id), JSON.stringify(e));
        try { await r.sadd('phuc:exam:index', e.id); } catch {}
        return sendJson(res, 200, { ok: true, message: 'Đã xuất bản đề thi.', exam: publicExam(e) });
      }

      if (action === 'unpublish') {
        const e = await getExam(r, clean(body.id || body.exam_id, 200));
        if (!e) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy đề.' });
        e.published = false;
        e.updatedAt = Date.now();
        e.updatedBy = session.username;
        await r.set(key('def', e.id), JSON.stringify(e));
        return sendJson(res, 200, { ok: true, message: 'Đã chuyển đề về trạng thái nháp.' });
      }

      if (action === 'delete') {
        const targetId = clean(body.id || body.exam_id, 200);
        if (!targetId) return sendJson(res, 400, { ok: false, message: 'Thiếu mã đề.' });
        await r.del(key('def', targetId));
        try { if (typeof r.srem === 'function') await r.srem('phuc:exam:index', targetId); } catch {}
        return sendJson(res, 200, { ok: true, message: 'Đã xóa bản lưu đề tùy chỉnh.' });
      }
    }

    const currentUser = session?.username || 'guest';

    if (action === 'start') {
      const e = await getExam(r, clean(body.id || body.exam_id, 200));
      if (!e || e.published === false) return sendJson(res, 404, { ok: false, message: 'Đề chưa được phát hành.' });
      const attemptId = crypto.randomUUID();
      const now = Date.now();
      const a = {
        id: attemptId,
        username: currentUser,
        exam: e,
        startedAt: now,
        expiresAt: now + Number(e.duration || 60) * 60000,
        savedAnswers: {},
        submitted: false
      };
      await r.set(key('attempt', attemptId), JSON.stringify(a), { ex: 60 * 60 * 24 * 30 });
      return sendJson(res, 200, {
        ok: true,
        attemptId,
        attempt_id: attemptId,
        exam: publicExam(e),
        startedAt: now,
        expiresAt: a.expiresAt,
        guest: currentUser === 'guest'
      });
    }

    if (action === 'save') {
      const a = await redisJsonGet(r, key('attempt', clean(body.attemptId || body.attempt_id, 200)));
      if (!a || (a.username !== 'guest' && a.username !== currentUser) || a.submitted) {
        return sendJson(res, 404, { ok: false, message: 'Phòng thi không còn hợp lệ.' });
      }
      if (Date.now() > Number(a.expiresAt || 0)) {
        return sendJson(res, 409, { ok: false, message: 'Đã hết giờ làm bài. Hãy nộp bài để chấm phần đã lưu.' });
      }
      a.savedAnswers = sanitizeAnswers(a.exam, body.answers);
      a.lastSavedAt = Date.now();
      await r.set(key('attempt', a.id), JSON.stringify(a), { ex: 60 * 60 * 24 * 30 });
      return sendJson(res, 200, { ok: true, savedAt: a.lastSavedAt });
    }

    if (action === 'submit' || action === 'finish') {
      const attId = clean(body.attemptId || body.attempt_id, 200);
      const exId = clean(body.examId || body.exam_id, 200);
      let a = await redisJsonGet(r, key('attempt', attId));
      // Fallback: if attempt expired from memory/serverless instance, grade directly against exam definition
      if (!a && exId) {
        const e = await getExam(r, exId);
        if (e) {
          a = {
            id: attId || crypto.randomUUID(),
            username: currentUser,
            exam: e,
            startedAt: Date.now() - 60000,
            expiresAt: Date.now() + 60000,
            savedAnswers: {},
            submitted: false
          };
        }
      }
      if (!a || (a.username !== 'guest' && a.username !== currentUser)) {
        return sendJson(res, 404, { ok: false, message: 'Phòng thi không còn hợp lệ.' });
      }
      if (a.submitted && a.result) {
        return sendJson(res, 200, { ok: true, result: a.result, expired: !!a.expired });
      }
      const expired = Date.now() > Number(a.expiresAt || 0);
      const answers = sanitizeAnswers(
        a.exam,
        body.answers && typeof body.answers === 'object' ? body.answers : (a.savedAnswers || {})
      );
      const result = grade(a.exam, answers);
      a.savedAnswers = answers;
      a.submitted = true;
      a.expired = expired;
      a.submittedAt = Date.now();
      a.result = result;
      await r.set(key('attempt', a.id), JSON.stringify(a), { ex: 60 * 60 * 24 * 30 });

      let xpEarned = 0, goldEarned = 0, diamondsEarned = 0, xpTotal = 0, weeklyXp = 0, rpgSnap = null;
      const normUser = session?.username ? normalizeUsername(session.username) : '';

      if (normUser && !isGuestName(normUser)) {
        const nowIso = new Date(a.submittedAt).toISOString();
        const histKey = key('history', normUser);
        const hist = (await redisJsonGet(r, histKey)) || [];
        const histFiltered = Array.isArray(hist)
          ? hist.filter(h => String(h?.attemptId || h?.attempt_id || '') !== String(a.id))
          : [];
        histFiltered.unshift({
          attemptId: a.id,
          attempt_id: a.id,
          examId: a.exam.id,
          exam_id: a.exam.id,
          title: a.exam.title,
          subject: a.exam.subject,
          grade: a.exam.grade || (a.exam.program ? String(a.exam.program).toUpperCase() : '2K9'),
          score: result.score,
          rawScore: result.rawScore,
          maxScore: result.maxScore,
          correct: result.correct,
          total: result.total,
          total_questions: result.total,
          submittedAt: a.submittedAt,
          created_at: nowIso,
          expired: !!a.expired
        });
        await r.set(histKey, JSON.stringify(histFiltered.slice(0, 100)));

        // Atomically record to phuc:exam-attempts & award XP/Gold/Diamonds/SRS on submit
        // so leaderboard & user XP are ALWAYS updated even if the secondary record-exam request fails
        try {
          const uProfile = await redisJsonGet(r, `${USER_PREFIX}${normUser}`);
          if (uProfile) {
            const baseKey = `phuc:xp:exam:${normUser}:${a.id}`;
            const isAdm = isAdminAccount(uProfile) || isAdminUsername(normUser);
            const candidateXp = isAdm ? 0 : calcExamXp(result.score);
            const granted = !!(await r.set(baseKey, JSON.stringify({
              xp_earned: candidateXp,
              gold_earned: 0,
              diamonds_earned: 0,
              recorded_by: 'exams'
            }), { nx: true, ex: 60 * 60 * 24 * 365 }));

            if (granted) {
              const attemptRecord = {
                attempt_id: a.id,
                username: normUser,
                display_name: clean(uProfile.display_name || normUser, 80),
                exam_id: clean(a.exam.id || 'exam', 100),
                title: clean(a.exam.title || 'Đề luyện thi Phúc K9', 180),
                subject: clean(a.exam.subject || 'Toán', 40),
                grade: clean(a.exam.grade || uProfile.settings?.preferred_grade || '2K9', 20),
                score: Number(result.score || 0),
                correct: Number(result.correct || 0),
                total_questions: Number(result.total || 0),
                created_at: nowIso,
                sections: result.sections || {},
                topicStats: Array.isArray(result.topicStats) ? result.topicStats : [],
                review: Array.isArray(result.review) ? result.review.slice(0, 40).map(item => ({
                  id: clean(item?.id || '', 80),
                  topic: clean(item?.topic || '', 80),
                  status: clean(item?.status || (item?.correct ? 'correct' : 'wrong'), 16),
                  correct: Boolean(item?.correct || item?.status === 'correct')
                })) : []
              };
              await r.lpush(ATTEMPTS_KEY, JSON.stringify(attemptRecord));
              try { await r.ltrim(ATTEMPTS_KEY, 0, MAX_ATTEMPTS - 1); } catch {}

              xpEarned = candidateXp;
              const rpg = ensureUserRpgState(uProfile);
              rpg.daily.exam_count = Number(rpg.daily.exam_count || 0) + 1;
              rpg.questions_conquered = Number(rpg.questions_conquered || 0) + Math.max(0, Number(result.correct || 0));
              const eco = applyRewardMultipliers(uProfile, 25 + Math.round(Number(result.score || 0) * 3), 0, Number(result.score || 0) >= 8 ? 2 : 1, isAdm);
              goldEarned = eco.gold;
              diamondsEarned = eco.diamonds;
              for (const item of (result.review || []).slice(0, 40)) {
                if (item?.id) {
                  recordSrsAnswer(uProfile, item.id, Boolean(item.status === 'correct' || item.correct === true), {
                    topic: item.topic || '',
                    subject: a.exam.subject || 'Toán'
                  });
                }
              }
              if (!isAdm) {
                const wk = vnWeekKey();
                if (uProfile.week_key !== wk) {
                  uProfile.week_key = wk;
                  uProfile.weekly_xp = 0;
                }
                uProfile.xp = Math.max(100, Number(uProfile.xp || 0)) + xpEarned;
                uProfile.weekly_xp = Math.max(0, Number(uProfile.weekly_xp || 0)) + xpEarned;
                uProfile.exam_xp = Math.max(0, Number(uProfile.exam_xp || 0)) + xpEarned;
                uProfile.streak = Math.max(1, Number(uProfile.streak || 1));
                uProfile.badges = computeExamBadges(uProfile, Number(result.score || 0), histFiltered.length);
              }
              uProfile.last_active = nowIso;
              await r.set(`${USER_PREFIX}${normUser}`, uProfile);
              try { await r.sadd('phuc:users:index', normUser); } catch {}
              await r.set(baseKey, JSON.stringify({
                xp_earned: xpEarned,
                gold_earned: goldEarned,
                diamonds_earned: diamondsEarned,
                recorded_by: 'exams'
              }), { ex: 60 * 60 * 24 * 365 });
            }
            xpTotal = Math.max(0, Number(uProfile.xp || 0));
            weeklyXp = Math.max(0, Number(uProfile.weekly_xp || 0));
            rpgSnap = buildPublicRpgSnapshot(uProfile);
          }
        } catch (syncErr) {
          console.warn('exam-submit-sync', syncErr?.message);
        }
      }
      return sendJson(res, 200, {
        ok: true,
        result,
        expired,
        xp_earned: xpEarned,
        gold_earned: goldEarned,
        diamonds_earned: diamondsEarned,
        xp_total: xpTotal,
        weekly_xp: weeklyXp,
        rpg: rpgSnap
      });
    }

    return sendJson(res, 400, { ok: false, message: 'Action không hợp lệ.' });
  } catch (err) {
    console.error('EXAMS', err);
    return sendJson(res, 500, { ok: false, message: err.message || 'Lỗi máy chủ.' });
  }
}

module.exports = handler;
