const { getRedis } = require('../lib/redis');
const { getSession, sendJson } = require('../lib/auth');
const { normalizeScoring, questionNeedsReview, validateExamStructure } = require('../lib/exam-utils');
const SEED = require('../lib/seed-exams');
const crypto = require('crypto');

const ADMIN_ENV = 'ADMIN_USERNAME';
const key = (...p) => 'phuc:exam:' + p.join(':');
const clean = (v, max = 400) => String(v ?? '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, max);

function admins() {
  return String(process.env[ADMIN_ENV] || process.env.ADMINUSER || '')
    .split(',')
    .map(x => x.trim().toLowerCase())
    .filter(Boolean);
}
function isAdmin(u) {
  return admins().includes(String(u || '').trim().toLowerCase());
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
  e.program = e.program || (String(e.grade || '') === '12' ? '2k9' : '');
  e.subject = e.subject || 'other';
  e.year = e.year || '2026';
  e.examType = e.examType || 'other';
  e.examPeriod = e.examPeriod || '';
  e.semester = e.semester || '';
  e.examSession = e.examSession || '';
  e.originUrl = e.originUrl || '';
  e.periodLabel = e.periodLabel || ([e.examType, e.semester, e.year].filter(Boolean).join(' • ') || 'Kỳ thi chuẩn cấu trúc');
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
        detail.push({ index: i, text: item.text, userChoice: v, expected: !!item.answer, correct: one });
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

    review.push({
      id: q.id,
      number: q.number,
      section: q.section,
      type: q.type,
      topic: q.topic || '',
      text: q.text,
      options: q.type === 'mcq' ? q.options : undefined,
      userAnswer: a ?? null,
      points: Number(pts.toFixed(2)),
      maxPoints: Number(maxPts.toFixed(2)),
      correct: ok,
      correctAnswer: q.type === 'mcq'
        ? q.answer
        : q.type === 'short'
        ? (q.acceptedAnswers || [q.answer])
        : (q.statements || []).map(s => !!s.answer),
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
        if (!session || !isAdmin(session.username)) return sendJson(res, 403, { ok: false, message: 'Chỉ admin.' });
        const ids = new Set(SEED.map(x => x.id));
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
              reviewCount: (x.questions || []).filter(questionNeedsReview).length,
              updatedAt: x.updatedAt || x.createdAt || null
            });
          }
        }
        out.sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));
        return sendJson(res, 200, { ok: true, exams: out });
      }

      if (action === 'admin-get') {
        if (!session || !isAdmin(session.username)) return sendJson(res, 403, { ok: false, message: 'Chỉ admin.' });
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
    if (['admin-import', 'publish', 'unpublish'].includes(action)) {
      if (!session) return sendJson(res, 401, { ok: false, message: 'Hãy đăng nhập tài khoản quản trị.' });
      if (!csrfOk(req, session)) return sendJson(res, 403, { ok: false, message: 'CSRF không hợp lệ.' });
      if (!isAdmin(session.username)) return sendJson(res, 403, { ok: false, message: 'Chỉ admin.' });

      if (action === 'admin-import') {
        let e = body.exam;
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
        e.published = false;
        e.updatedAt = Date.now();
        e.updatedBy = session.username;
        await r.set(key('def', e.id), JSON.stringify(e));
        try { await r.sadd('phuc:exam:index', e.id); } catch {}
        return sendJson(res, 200, { ok: true, message: 'Đã lưu đề ở trạng thái nháp.', exam: adminExam(e) });
      }

      if (action === 'publish') {
        const e = await getExam(r, clean(body.id, 200));
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
        return sendJson(res, 200, { ok: true, exam: publicExam(e) });
      }

      if (action === 'unpublish') {
        const e = await getExam(r, clean(body.id, 200));
        if (!e) return sendJson(res, 404, { ok: false, message: 'Không tìm thấy đề.' });
        e.published = false;
        e.updatedAt = Date.now();
        e.updatedBy = session.username;
        await r.set(key('def', e.id), JSON.stringify(e));
        return sendJson(res, 200, { ok: true, message: 'Đã chuyển đề về trạng thái nháp.' });
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

      if (session?.username) {
        const histKey = key('history', session.username);
        const hist = (await redisJsonGet(r, histKey)) || [];
        hist.unshift({
          attemptId: a.id,
          examId: a.exam.id,
          title: a.exam.title,
          subject: a.exam.subject,
          score: result.score,
          rawScore: result.rawScore,
          maxScore: result.maxScore,
          correct: result.correct,
          total: result.total,
          submittedAt: a.submittedAt,
          expired: !!a.expired
        });
        await r.set(histKey, JSON.stringify(hist.slice(0, 100)));
      }
      return sendJson(res, 200, { ok: true, result, expired });
    }

    return sendJson(res, 400, { ok: false, message: 'Action không hợp lệ.' });
  } catch (err) {
    console.error('EXAMS', err);
    return sendJson(res, 500, { ok: false, message: err.message || 'Lỗi máy chủ.' });
  }
}

module.exports = handler;
