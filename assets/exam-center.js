/* ============================================================================
 * HỌC CÙNG PHÚC K9 — REAL-SOURCE EXAM PRACTICE & AUTOMATED GRADING ENGINE
 * Supports: GDPT 2018 3-Part Grading (MCQ, Progressive True/False, Short Answer)
 * ============================================================================ */
(function (window, document) {
  'use strict';

  const SUBJECT_MAP = {
    math: 'Toán',
    physics: 'Vật lí',
    chemistry: 'Hóa học',
    biology: 'Sinh học',
    english: 'Tiếng Anh',
    history: 'Lịch sử',
    dgnl: 'ĐGNL'
  };

  function subjLabel(s) {
    const raw = String(s || '').trim();
    return SUBJECT_MAP[raw.toLowerCase()] || raw || 'Tổng hợp';
  }

  const STATE = {
    view: 'catalog', // 'catalog' | 'sources' | 'bookmarks' | 'wrong-bank' | 'diagnostics' | 'arena' | 'taking' | 'result'
    subjectFilter: 'ALL',
    statusFilter: 'ALL', // 'ALL' | 'todo' | 'done'
    paperTheme: (() => {
      try {
        const p = localStorage.getItem('pk9_paper_theme');
        if (['paper-white', 'paper-ivory', 'paper-softgray'].includes(p)) return p;
      } catch {}
      return 'paper-ivory';
    })(),
    searchQuery: '',
    exams: [],
    doneExamIds: new Set(),
    activeExam: null,
    activeContestId: null,
    attemptId: null,
    answers: {},
    flagged: {},
    splitPdf: false,
    focusSingleQ: (() => {
      try {
        return localStorage.getItem('pk9_exam_single_q') === '1';
      } catch {
        return false;
      }
    })(),
    currentQIdx: 0,
    paletteDrawerOpen: false,
    sectionLockMode: false,
    sectionsPlan: [],
    activeSectionIdx: 0,
    sectionRemainingSec: 0,
    serverSaveTimer: null,
    startedAt: 0,
    remainingSec: 0,
    timerId: null,
    lastResult: null,
    xpAwarded: 0,
    goldAwarded: 0,
    diamondsAwarded: 0,
    contests: [],
    openDuels: [],
    contestCountdownTimer: null,
    contestLbData: null,
    duelRoom: null,
    duelStage: 'lobby', // 'lobby' | 'playing' | 'result'
    duelAnswers: {},
    duelElapsedSec: 0,
    duelTimerId: null,
    duelPollId: null,
    duelSubject: 'Tất cả',
    duelCount: 5,
    duelLastReward: null
  };

  function getWrongBankList() {
    const srv = window.PK9_RPG_STATE?.wrong_bank?.items;
    if (Array.isArray(srv)) return srv.filter(x => x && !x.resolved);
    try {
      const local = JSON.parse(localStorage.getItem('pk9_wrong_bank_local') || '[]');
      return Array.isArray(local) ? local.filter(x => x && !x.resolved) : [];
    } catch {
      return [];
    }
  }

  function getTopicStatsList() {
    const srv = window.PK9_RPG_STATE?.topic_stats;
    if (Array.isArray(srv) && srv.length) return srv;
    try {
      const local = JSON.parse(localStorage.getItem('pk9_topic_stats_local') || '{}');
      return Object.values(local || {}).filter(Boolean).sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0));
    } catch {
      return [];
    }
  }

  function recordLocalDiagnostics(exam, graded) {
    if (!exam || !graded) return;
    const nowIso = new Date().toISOString();
    const subject = subjLabel(exam.subject);
    const qById = new Map((exam.questions || []).map(q => [String(q.id), q]));

    try {
      const statsMap = JSON.parse(localStorage.getItem('pk9_topic_stats_local') || '{}') || {};
      for (const ts of (graded.topicStats || [])) {
        const topic = String(ts.topic || '').trim();
        if (!topic) continue;
        const k = `${subject}::${topic}`;
        const prev = statsMap[k] || { key: k, subject, topic, total: 0, correct: 0, earnedPts: 0, maxPts: 0, accuracy: 0 };
        const earnedPts = Number((Number(prev.earnedPts || 0) + Number(ts.earnedPts || 0)).toFixed(2));
        const maxPts = Number((Number(prev.maxPts || 0) + Number(ts.maxPts || 0)).toFixed(2));
        statsMap[k] = {
          key: k,
          subject,
          topic,
          total: Number(prev.total || 0) + Number(ts.count || ts.total || 0),
          correct: Number(prev.correct || 0) + Number(ts.correct || 0),
          earnedPts,
          maxPts,
          accuracy: maxPts > 0 ? Math.round((earnedPts / maxPts) * 100) : 0,
          lastAt: nowIso
        };
      }
      localStorage.setItem('pk9_topic_stats_local', JSON.stringify(statsMap));
    } catch {}

    try {
      const bank = JSON.parse(localStorage.getItem('pk9_wrong_bank_local') || '[]') || [];
      for (const rv of (graded.review || [])) {
        const qId = String(rv.id || '');
        if (!qId) continue;
        const ok = rv.status === 'correct' || rv.correct === true;
        const idx = bank.findIndex(x => String(x.id) === qId);
        if (ok) {
          if (idx >= 0) bank[idx].resolved = true;
          continue;
        }
        const srcQ = qById.get(qId) || {};
        const item = {
          id: qId,
          examId: exam.id,
          examTitle: exam.title,
          subject,
          section: rv.section || srcQ.section || 'I',
          number: rv.number || srcQ.number || 0,
          topic: rv.topic || srcQ.topic || 'Tổng hợp',
          type: rv.type || srcQ.type || 'mcq',
          text: rv.text || srcQ.text || '',
          options: srcQ.options || rv.options,
          statements: srcQ.statements,
          answer: srcQ.answer !== undefined ? srcQ.answer : rv.correctAnswer,
          acceptedAnswers: srcQ.acceptedAnswers,
          explanation: rv.explanation || srcQ.explanation || '',
          userAnswer: rv.userAnswer ?? null,
          wrongCount: idx >= 0 ? Number(bank[idx].wrongCount || 1) + 1 : 1,
          resolved: false,
          lastWrongAt: nowIso
        };
        if (idx >= 0) bank.splice(idx, 1);
        bank.unshift(item);
      }
      localStorage.setItem('pk9_wrong_bank_local', JSON.stringify(bank.slice(0, 120)));
    } catch {}
  }

  function findRecommendedLesson(subject, topicName) {
    const catalog = Array.isArray(window.PK9_CATALOG) ? window.PK9_CATALOG : [];
    const tokens = String(topicName || '').toLowerCase().split(/[\s,;&/-]+/).filter(w => w.length >= 2);
    const subjLow = String(subject || '').toLowerCase();
    let best = null;
    let bestScore = -1;

    for (const course of catalog) {
      const cText = `${course.name || ''} ${course.shortName || ''} ${course.id || ''}`.toLowerCase();
      const subjBonus = cText.includes(subjLow) || (subjLow.includes('toán') && cText.includes('toán')) ? 3 : 0;
      for (const ch of (course.chapters || [])) {
        for (const t of (ch.topics || [])) {
          const hay = `${ch.title || ''} ${t.title || ''} ${t.desc || ''}`.toLowerCase();
          let score = subjBonus;
          for (const tk of tokens) {
            if (hay.includes(tk)) score += 2;
          }
          if (score > bestScore && score >= 4) {
            bestScore = score;
            best = { courseId: course.id, courseName: course.shortName || course.name, topicId: t.id, topicTitle: t.title };
          }
        }
      }
    }
    return best;
  }

  function getBookmarksList() {
    const serverBm = window.PK9_RPG_STATE?.bookmarks;
    if (Array.isArray(serverBm)) return serverBm;
    try {
      const local = JSON.parse(localStorage.getItem('pk9_rpg_bookmarks') || '[]');
      return Array.isArray(local) ? local : [];
    } catch {
      return [];
    }
  }

  function isQuestionBookmarked(qId) {
    return getBookmarksList().some(b => String(b.id) === String(qId));
  }

  function getActivePaperTheme() {
    const srv = window.PK9_RPG_STATE?.paper_theme;
    if (['paper-white', 'paper-ivory', 'paper-softgray'].includes(srv)) return srv;
    return STATE.paperTheme || 'paper-ivory';
  }

  async function syncPaperTheme(theme) {
    if (!['paper-white', 'paper-ivory', 'paper-softgray'].includes(theme)) return;
    STATE.paperTheme = theme;
    try { localStorage.setItem('pk9_paper_theme', theme); } catch {}
    if (window.PK9_RPG_STATE) window.PK9_RPG_STATE.paper_theme = theme;
    document.querySelectorAll('.pk9-exam-room').forEach(el => {
      el.classList.remove('paper-white', 'paper-ivory', 'paper-softgray');
      el.classList.add(theme);
    });
    document.querySelectorAll('[data-paper-theme]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-paper-theme') === theme);
    });
    try {
      const resp = await fetch('/api/dashboard?action=rpg-settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ paper_theme: theme })
      });
      if (resp.ok) {
        const d = await resp.json();
        if (d?.rpg && typeof window.PK9_APPLY_RPG_UPDATE === 'function') window.PK9_APPLY_RPG_UPDATE(d.rpg);
      }
    } catch {}
  }

  async function toggleQuestionBookmark(qId, btnEl = null) {
    const ex = STATE.activeExam;
    const q = ex?.questions?.find(item => String(item.id) === String(qId));
    const existing = getBookmarksList().find(b => String(b.id) === String(qId));
    const payload = q ? {
      id: String(q.id),
      examId: ex?.id || '',
      examTitle: ex?.title || '',
      subject: subjLabel(ex?.subject || ''),
      topic: q.topic || '',
      type: normalizeQuestionType(q),
      number: q.number || 0,
      text: q.text || q.prompt || ''
    } : (existing || { id: String(qId) });

    // Optimistic local update
    try {
      const cur = getBookmarksList().slice();
      const idx = cur.findIndex(b => String(b.id) === String(qId));
      const nowSaved = idx < 0;
      if (nowSaved) cur.unshift({ ...payload, savedAt: new Date().toISOString() });
      else cur.splice(idx, 1);
      localStorage.setItem('pk9_rpg_bookmarks', JSON.stringify(cur.slice(0, 150)));
      if (window.PK9_RPG_STATE) window.PK9_RPG_STATE.bookmarks = cur.slice(0, 150);
      if (btnEl) btnEl.textContent = nowSaved ? '📌 Đã lưu' : '📌 Lưu câu';
      if (window.PK9_TOAST) window.PK9_TOAST(nowSaved ? '📌 Đã lưu câu hỏi để ôn lại sau!' : 'Đã bỏ lưu câu hỏi.', 'info');
    } catch {}

    try {
      const resp = await fetch('/api/dashboard?action=rpg-bookmark', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const d = await resp.json();
        if (d?.rpg && typeof window.PK9_APPLY_RPG_UPDATE === 'function') window.PK9_APPLY_RPG_UPDATE(d.rpg);
      }
    } catch {}
    if (STATE.view === 'bookmarks') renderExamCenter();
  }

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function getCsrfToken() {
    const m = document.cookie.match(/(?:^|;\s*)phuc_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : (window.PK9_AUTH?.csrf || '');
  }

  const PENDING_TYPESET_ELS = new Set();
  function typesetMath(el) {
    const target = el || document.body;
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      try {
        if (typeof window.MathJax.typesetClear === 'function' && target) {
          window.MathJax.typesetClear([target]);
        }
      } catch {}
      window.MathJax.typesetPromise(target ? [target] : undefined).catch(() => {});
    } else if (target) {
      PENDING_TYPESET_ELS.add(target);
    }
  }
  window.addEventListener('pk9-mathjax-ready', () => {
    PENDING_TYPESET_ELS.forEach(el => typesetMath(el));
    PENDING_TYPESET_ELS.clear();
  });

  function getDirectDownloadUrl(rawUrl) {
    const raw = String(rawUrl || '').trim();
    if (!raw) return '';
    const fileMatch = raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/)
      || raw.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([A-Za-z0-9_-]+)/);
    if (fileMatch) return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
    return raw;
  }

  function isDownloadableSourceUrl(rawUrl) {
    const raw = String(rawUrl || '').trim().toLowerCase();
    return /\.pdf($|\?)/i.test(raw)
      || raw.includes('drive.google.com/file/d/')
      || raw.includes('drive.google.com/open?')
      || raw.includes('drive.google.com/uc?');
  }

  function normShortAnswer(val) {
    let s = String(val ?? '').trim().toLowerCase();
    s = s.replace(/,/g, '.').replace(/\s+/g, '').replace(/%$/, '');
    return s;
  }

  function normalizeQuestionType(q) {
    const t = String(q?.type || '').toLowerCase();
    if (t === 'mcq' || t === 'single_choice') return 'mcq';
    if (t === 'truefalse' || t === 'true_false_group') return 'truefalse';
    return 'short';
  }

  // Client-side GDPT 2018 grader (matches api/exams.js 100%)
  function gradeExamLocally(exam, answers) {
    let raw = 0, max = 0, correctCount = 0;
    const sections = {};
    const topicMap = {};
    const review = [];

    for (const q of exam.questions || []) {
      const qType = normalizeQuestionType(q);
      const sec = q.section || (qType === 'mcq' ? 'I' : qType === 'truefalse' ? 'II' : 'III');
      sections[sec] = sections[sec] || { earned: 0, max: 0, count: 0 };
      const topicName = q.topic || `Phần ${sec}`;
      topicMap[topicName] = topicMap[topicName] || { topic: topicName, earnedPts: 0, maxPts: 0, count: 0 };

      const uAns = answers[q.id];
      let earned = 0;
      const qMax = Number(q.points || (qType === 'truefalse' ? 1 : qType === 'short' ? 0.5 : 0.25));
      max += qMax;
      sections[sec].max += qMax;
      sections[sec].count += 1;
      topicMap[topicName].maxPts += qMax;
      topicMap[topicName].count += 1;

      const promptText = q.text || q.prompt || '';

      if (qType === 'mcq') {
        const ok = String(uAns || '').toUpperCase() === String(q.answer || '').toUpperCase();
        earned = ok ? qMax : 0;
        if (ok) correctCount += 1;
        review.push({
          id: q.id, number: q.number, section: sec, type: 'mcq', topic: topicName,
          text: promptText, options: q.options,
          status: ok ? 'correct' : 'wrong',
          correct: ok, earned, max: qMax, userAnswer: uAns ?? null,
          correctAnswer: q.answer, explanation: q.explanation || '', sourcePage: q.sourcePage || null
        });
      } else if (qType === 'truefalse') {
        const uArr = Array.isArray(uAns) ? uAns : [];
        let hit = 0;
        const stDetails = (q.statements || []).map((st, idx) => {
          const got = uArr[idx];
          const exp = Boolean(st.answer);
          const ok = typeof got === 'boolean' && got === exp;
          if (ok) hit += 1;
          return { text: st.text, user: got ?? null, answer: exp, correct: ok };
        });
        const table = [0, 0.1, 0.25, 0.5, 1.0];
        earned = (table[hit] ?? 0) * qMax;
        if (hit === 4) correctCount += 1;
        review.push({
          id: q.id, number: q.number, section: sec, type: 'truefalse', topic: topicName,
          text: promptText, statements: stDetails,
          status: hit === 4 ? 'correct' : hit > 0 ? 'partial' : 'wrong',
          correct: hit === 4, hitCount: hit, earned, max: qMax,
          userAnswer: uArr, explanation: q.explanation || '', sourcePage: q.sourcePage || null
        });
      } else {
        const accepted = Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length
          ? q.acceptedAnswers
          : Array.isArray(q.accepted) && q.accepted.length
          ? q.accepted
          : [q.answer];
        const normU = normShortAnswer(uAns);
        const ok = normU !== '' && accepted.some(a => {
          const na = normShortAnswer(a);
          if (na === normU) return true;
          const nu = Number(normU), nExp = Number(na);
          return Number.isFinite(nu) && Number.isFinite(nExp) && Math.abs(nu - nExp) <= 1e-6;
        });
        earned = ok ? qMax : 0;
        if (ok) correctCount += 1;
        review.push({
          id: q.id, number: q.number, section: sec, type: 'short', topic: topicName,
          text: promptText,
          status: ok ? 'correct' : 'wrong',
          correct: ok, earned, max: qMax, userAnswer: uAns ?? '',
          correctAnswer: accepted[0], explanation: q.explanation || '', sourcePage: q.sourcePage || null
        });
      }

      raw += earned;
      sections[sec].earned = Math.round((sections[sec].earned + earned) * 1000) / 1000;
      topicMap[topicName].earnedPts = Math.round((topicMap[topicName].earnedPts + earned) * 1000) / 1000;
    }

    const score10 = max > 0 ? Math.round((raw / max) * 10 * 100) / 100 : 0;
    const topicStats = Object.values(topicMap).map(t => ({
      ...t,
      accuracy: t.maxPts > 0 ? Math.round((t.earnedPts / t.maxPts) * 100) : 0
    }));

    return {
      score: score10,
      rawScore: Math.round(raw * 100) / 100,
      maxScore: Math.round(max * 100) / 100,
      correct: correctCount,
      total: (exam.questions || []).length,
      sections,
      topicStats,
      review
    };
  }

  async function loadExamCatalog() {
    const seedList = Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS : [];
    const byId = new Map();
    for (const s of seedList) {
      byId.set(s.id, {
        ...s,
        questionCount: Array.isArray(s.questions) ? s.questions.length : Number(s.questionCount || 0)
      });
    }
    try {
      const resp = await fetch('/api/exams?action=list', { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data?.exams)) {
          for (const ex of data.exams) {
            const localSeed = byId.get(ex.id);
            byId.set(ex.id, { ...(localSeed || {}), ...ex, questions: localSeed?.questions || ex.questions });
          }
        }
      }
    } catch {}
    STATE.exams = Array.from(byId.values());
    const done = new Set();
    try {
      const hist = JSON.parse(localStorage.getItem('pk9_exam_history') || '[]');
      for (const h of hist) if (h?.examId) done.add(String(h.examId));
    } catch {}
      try {
        const hResp = await fetch('/api/exams?action=history', { credentials: 'include' });
        if (hResp.ok) {
          const hData = await hResp.json();
          for (const a of (hData?.attempts || hData?.history || [])) {
            if (a?.examId || a?.exam_id) done.add(String(a.examId || a.exam_id));
          }
        }
      } catch {}
      STATE.doneExamIds = done;
      loadArenaLobbyData();
      if (typeof window.PK9_SYNC_ECOSYSTEM_STATS === 'function') {
        window.PK9_SYNC_ECOSYSTEM_STATS();
      }
    }

  async function loadArenaLobbyData() {
    try {
      const resp = await fetch('/api/exams?action=arena-list', { credentials: 'include' });
      if (resp.ok) {
        const d = await resp.json();
        if (Array.isArray(d?.contests)) STATE.contests = d.contests;
        if (Array.isArray(d?.open_duels)) STATE.openDuels = d.open_duels;
        if (STATE.view === 'catalog' || STATE.view === 'arena') {
          updateContestBannerDOM();
        }
      }
    } catch {}
  }

  function findFullSeedExam(examId) {
    const seedList = Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS : [];
    return seedList.find(x => x.id === examId) || STATE.exams.find(x => x.id === examId) || null;
  }

  function isQuestionAnswered(q, ans) {
    if (ans === undefined || ans === null) return false;
    const qType = normalizeQuestionType(q);
    if (qType === 'mcq' || qType === 'short') return String(ans).trim() !== '';
    if (qType === 'truefalse') {
      return Array.isArray(ans) && ans.some(v => typeof v === 'boolean');
    }
    return false;
  }

  function formatClock(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  function stopTimer() {
    if (STATE.timerId) {
      clearInterval(STATE.timerId);
      STATE.timerId = null;
    }
  }

  function readExamDraft(examId) {
    try {
      const raw = localStorage.getItem(`pk9_exam_draft_${examId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed._v === 2 && parsed.answers && typeof parsed.answers === 'object') {
        return {
          answers: parsed.answers,
          flagged: parsed.flagged && typeof parsed.flagged === 'object' ? parsed.flagged : {},
          remainingSec: Number(parsed.remainingSec || 0),
          attemptId: parsed.attemptId || null,
          currentQIdx: Number(parsed.currentQIdx || 0)
        };
      }
      return {
        answers: parsed,
        flagged: {},
        remainingSec: 0,
        attemptId: null,
        currentQIdx: 0
      };
    } catch {
      return null;
    }
  }

  function hasSavedDraft(examId) {
    const d = readExamDraft(examId);
    if (!d || !d.answers) return false;
    return Object.keys(d.answers).some(k => {
      const v = d.answers[k];
      if (Array.isArray(v)) return v.some(x => typeof x === 'boolean');
      return String(v ?? '').trim() !== '';
    });
  }

  function persistLocalDraftNow() {
    if (!STATE.activeExam) return;
    try {
      localStorage.setItem(`pk9_exam_draft_${STATE.activeExam.id}`, JSON.stringify({
        _v: 2,
        answers: STATE.answers,
        flagged: STATE.flagged,
        remainingSec: STATE.remainingSec,
        attemptId: STATE.attemptId,
        currentQIdx: STATE.currentQIdx,
        savedAt: Date.now()
      }));
    } catch {}
  }

  function computeExamSectionsPlan(ex) {
    if (!ex || !Array.isArray(ex.questions) || !ex.questions.length) return [];
    const totalSec = Math.max(300, Number(ex.duration || ex.durationMinutes || 50) * 60);
    if (Array.isArray(ex.sectionsMeta) && ex.sectionsMeta.length > 1) {
      return ex.sectionsMeta.map(m => ({
        id: String(m.id || 'I'),
        label: String(m.label || `Phần ${m.id || 'I'}`),
        durationSec: Math.max(60, Math.round(Number(m.durationMin || 15) * 60))
      }));
    }
    const order = [];
    const seen = new Set();
    for (const q of ex.questions) {
      const secId = String(q.section || (normalizeQuestionType(q) === 'truefalse' ? 'II' : normalizeQuestionType(q) === 'short' ? 'III' : 'I'));
      if (!seen.has(secId)) { seen.add(secId); order.push(secId); }
    }
    if (order.length <= 1) return [];
    const counts = order.map(id => ex.questions.filter(q => String(q.section || 'I') === id).length);
    const totalQ = counts.reduce((s, n) => s + n, 0) || 1;
    const labels = {
      I: 'Phần I • Trắc nghiệm ABCD',
      II: 'Phần II • Đúng / Sai',
      III: 'Phần III • Trả lời ngắn'
    };
    return order.map((id, idx) => ({
      id,
      label: labels[id] || `Phần ${id}`,
      durationSec: Math.max(120, Math.round((counts[idx] / totalQ) * totalSec))
    }));
  }

  function advanceLockedSection(auto = false) {
    if (!STATE.sectionLockMode || !STATE.sectionsPlan.length) return;
    if (STATE.activeSectionIdx < STATE.sectionsPlan.length - 1) {
      if (!auto && typeof window.confirm === 'function') {
        const curLabel = STATE.sectionsPlan[STATE.activeSectionIdx]?.label || 'phần hiện tại';
        if (!window.confirm(`Xác nhận khóa "${curLabel}" và chuyển sang phần tiếp theo? Sau khi chuyển bạn sẽ không quay lại sửa phần trước được nữa.`)) {
          return;
        }
      }
      STATE.activeSectionIdx += 1;
      const nextSec = STATE.sectionsPlan[STATE.activeSectionIdx];
      STATE.sectionRemainingSec = nextSec.durationSec;
      const firstQIdx = (STATE.activeExam?.questions || []).findIndex(q => String(q.section || 'I') === nextSec.id);
      if (firstQIdx >= 0) STATE.currentQIdx = firstQIdx;
      renderExamCenter();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.PK9_TOAST) window.PK9_TOAST(`⏱ Đã chuyển sang ${nextSec.label}!`, 'info');
    } else {
      submitActiveExam(true);
    }
  }

  function startTimer() {
    stopTimer();
    STATE.timerId = setInterval(() => {
      if (STATE.view !== 'taking') {
        stopTimer();
        return;
      }
      STATE.remainingSec = Math.max(0, STATE.remainingSec - 1);
      if (STATE.sectionLockMode && STATE.sectionsPlan.length) {
        STATE.sectionRemainingSec = Math.max(0, STATE.sectionRemainingSec - 1);
        const secTimerEl = document.getElementById('pk9-sec-timer');
        if (secTimerEl) secTimerEl.textContent = formatClock(STATE.sectionRemainingSec);
        if (STATE.sectionRemainingSec === 0) {
          advanceLockedSection(true);
          return;
        }
      }
      if (STATE.remainingSec % 5 === 0) persistLocalDraftNow();
      const timerEl = document.getElementById('pk9-exam-timer');
      if (timerEl) {
        timerEl.textContent = `⏱ ${formatClock(STATE.remainingSec)}`;
        if (STATE.remainingSec <= 300) timerEl.classList.add('warning');
      }
      if (STATE.remainingSec === 0) {
        stopTimer();
        submitActiveExam(true);
      }
    }, 1000);
  }

  async function startExamById(examId, openSplitPdf = false, contestId = null) {
    let fullExam = findFullSeedExam(examId);
    const draft = readExamDraft(examId);
    let attemptId = draft?.attemptId || `local-${examId}-${Date.now()}`;

    try {
      const resp = await fetch('/api/exams?action=start', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({ id: examId, exam_id: examId })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.ok && data.exam) {
          const seedCopy = findFullSeedExam(examId);
          fullExam = {
            ...(seedCopy || {}),
            ...data.exam,
            questions: (data.exam.questions || []).map((q, i) => ({
              ...(seedCopy?.questions?.[i] || {}),
              ...q
            }))
          };
          attemptId = data.attemptId || data.attempt_id || attemptId;
        }
      }
    } catch {}

    if (!fullExam) {
      if (window.PK9_TOAST) window.PK9_TOAST('Không tìm thấy dữ liệu đề thi này.', 'error');
      return;
    }

    const defaultSec = Number(fullExam.duration || fullExam.durationMinutes || 50) * 60;
    const restoredSec = (draft && draft.remainingSec > 30 && draft.remainingSec <= defaultSec)
      ? draft.remainingSec
      : defaultSec;
    const hadProgress = hasSavedDraft(examId);

    const pdfPath = fullExam.sourceFile || fullExam.pdfUrl || '';
    const plan = computeExamSectionsPlan(fullExam);
    const autoDgnlLock = Array.isArray(fullExam.sectionsMeta) && fullExam.sectionsMeta.length > 1;

    STATE.activeExam = fullExam;
    STATE.activeContestId = contestId || null;
    STATE.attemptId = attemptId;
    STATE.answers = draft?.answers || {};
    STATE.flagged = draft?.flagged || {};
    STATE.currentQIdx = Math.max(0, Math.min((fullExam.questions || []).length - 1, Number(draft?.currentQIdx || 0)));
    STATE.paletteDrawerOpen = false;
    STATE.splitPdf = Boolean(openSplitPdf && pdfPath);
    STATE.sectionsPlan = plan;
    STATE.sectionLockMode = autoDgnlLock;
    STATE.activeSectionIdx = 0;
    STATE.sectionRemainingSec = plan[0]?.durationSec || defaultSec;
    STATE.startedAt = Date.now();
    STATE.remainingSec = restoredSec;
    STATE.view = 'taking';
    persistLocalDraftNow();
    renderExamCenter();
    startTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (hadProgress && window.PK9_TOAST) {
      window.PK9_TOAST('🔄 Đã khôi phục bài làm dở, câu đánh dấu & thời gian còn lại!', 'info');
    }
  }

  function startWrongPracticeExam(items) {
    const src = (Array.isArray(items) && items.length ? items : getWrongBankList()).slice(0, 25);
    if (!src.length) {
      if (window.PK9_TOAST) window.PK9_TOAST('Tuyệt vời! Bạn chưa có câu sai nào tồn đọng.', 'success');
      return;
    }
    const questions = src.map((it, idx) => ({
      id: it.id,
      section: it.section || 'I',
      type: it.type || 'mcq',
      number: idx + 1,
      topic: it.topic || 'Tổng hợp',
      text: it.text,
      options: it.options,
      statements: it.statements,
      answer: it.answer,
      acceptedAnswers: it.acceptedAnswers,
      explanation: it.explanation
    }));
    const customExam = {
      id: `pk9-wrong-practice-${Date.now()}`,
      isCustomWrongPractice: true,
      title: `Ôn Tập ${questions.length} Câu Từng Làm Sai (Đề Riêng Của Bạn)`,
      subject: STATE.subjectFilter !== 'ALL' ? STATE.subjectFilter : 'Tổng hợp',
      source: 'Ngân hàng Câu Sai Học Cùng Phúc K9',
      duration: Math.max(10, questions.length * 3),
      questions
    };
    STATE.activeExam = customExam;
    STATE.activeContestId = null;
    STATE.attemptId = customExam.id;
    STATE.answers = {};
    STATE.flagged = {};
    STATE.currentQIdx = 0;
    STATE.paletteDrawerOpen = false;
    STATE.splitPdf = false;
    STATE.sectionsPlan = [];
    STATE.sectionLockMode = false;
    STATE.startedAt = Date.now();
    STATE.remainingSec = customExam.duration * 60;
    STATE.view = 'taking';
    renderExamCenter();
    startTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function resolveWrongItem(qId, isCorrect = true, silent = false) {
    try {
      const bank = JSON.parse(localStorage.getItem('pk9_wrong_bank_local') || '[]') || [];
      const item = bank.find(x => String(x.id) === String(qId));
      if (item) item.resolved = Boolean(isCorrect);
      localStorage.setItem('pk9_wrong_bank_local', JSON.stringify(bank));
    } catch {}

    const user = typeof window.PK9_GET_USER === 'function' ? window.PK9_GET_USER() : null;
    if (user) {
      try {
        const resp = await fetch('/api/dashboard?action=rpg-wrong-resolve', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({ id: qId, correct: Boolean(isCorrect) })
        });
        if (resp.ok) {
          const d = await resp.json();
          if (d?.rpg && typeof window.PK9_APPLY_RPG_UPDATE === 'function') {
            window.PK9_APPLY_RPG_UPDATE(d.rpg, { xp: d.xp, weekly_xp: d.weekly_xp });
          }
          if (!silent && d?.message && window.PK9_TOAST) window.PK9_TOAST(d.message, 'success');
        }
      } catch {}
    } else if (!silent && window.PK9_TOAST) {
      window.PK9_TOAST('✅ Đã chuyển câu hỏi này ra khỏi danh sách câu sai!', 'success');
    }
    if (!silent && STATE.view === 'wrong-bank') updateCatalogDynamicDOM();
  }

  function saveDraftDebounced() {
    if (!STATE.activeExam || STATE.activeExam.isCustomWrongPractice) return;
    persistLocalDraftNow();
    if (STATE.serverSaveTimer) clearTimeout(STATE.serverSaveTimer);
    STATE.serverSaveTimer = setTimeout(() => {
      if (STATE.view !== 'taking' || !STATE.activeExam || !STATE.attemptId || String(STATE.attemptId).startsWith('local-')) return;
      fetch('/api/exams?action=save', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({
          attemptId: STATE.attemptId,
          attempt_id: STATE.attemptId,
          answers: STATE.answers
        })
      }).catch(() => {});
    }, 3500);
  }

  async function submitActiveExam(autoSubmitted = false) {
    if (!STATE.activeExam) return;
    if (!autoSubmitted) {
      const totalQ = (STATE.activeExam.questions || []).length;
      const doneQ = (STATE.activeExam.questions || []).filter(q => isQuestionAnswered(q, STATE.answers[q.id])).length;
      if (doneQ < totalQ) {
        const ok = window.confirm(`Bạn đã làm ${doneQ}/${totalQ} câu. Bạn có chắc chắn muốn nộp bài và chấm điểm ngay không?`);
        if (!ok) return;
      }
    }

    stopTimer();
    window.PK9_EXAM_TOOLS?.closeCalc?.();
    window.PK9_EXAM_TOOLS?.closeScratchpad?.();

    const isCustomWrong = Boolean(STATE.activeExam.isCustomWrongPractice);
    const seedExam = isCustomWrong ? STATE.activeExam : (findFullSeedExam(STATE.activeExam.id) || STATE.activeExam);
    let graded = gradeExamLocally(seedExam, STATE.answers);
    let xpEarned = 0;
    let goldEarned = 0;
    let diamondsEarned = 0;

    if (isCustomWrong) {
      let resolvedNow = 0;
      for (const r of (graded.review || [])) {
        if (r.status === 'correct' || r.correct === true) {
          resolvedNow += 1;
          await resolveWrongItem(r.id, true, true);
        }
      }
      STATE.lastResult = graded;
      STATE.xpAwarded = resolvedNow * 5;
      STATE.goldAwarded = resolvedNow * 8;
      STATE.diamondsAwarded = 0;
      STATE.view = 'result';
      renderExamCenter();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.PK9_TOAST) {
        window.PK9_TOAST(`🔥 Đã ôn xong ${graded.total} câu sai: Đúng ${graded.correct}/${graded.total} (làm chủ ${resolvedNow} câu)!`, 'success');
      }
      return;
    }

    try {
      const resp = await fetch('/api/exams?action=submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken()
        },
        body: JSON.stringify({
          attemptId: STATE.attemptId,
          attempt_id: STATE.attemptId,
          examId: STATE.activeExam.id,
          exam_id: STATE.activeExam.id,
          contestId: STATE.activeContestId || '',
          answers: STATE.answers
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.ok && data.result) {
          graded = data.result;
        }
        if (Number(data?.xp_earned) > 0) xpEarned = Number(data.xp_earned);
        if (Number(data?.gold_earned) > 0) goldEarned = Number(data.gold_earned);
        if (Number(data?.diamonds_earned) > 0) diamondsEarned = Number(data.diamonds_earned);
        if (data?.rpg && typeof window.PK9_APPLY_RPG_UPDATE === 'function') {
          window.PK9_APPLY_RPG_UPDATE(data.rpg, { xp: data.xp_total, weekly_xp: data.weekly_xp });
        }
      }
    } catch {}

    // Record to dashboard & leaderboard only for logged-in accounts (guests cannot compete on BXH)
    const loggedInUser = typeof window.PK9_GET_USER === 'function' ? window.PK9_GET_USER() : null;
    if (loggedInUser) {
      try {
        const recResp = await fetch('/api/dashboard?action=record-exam', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': getCsrfToken()
          },
          body: JSON.stringify({
            attempt_id: STATE.attemptId,
            exam_id: STATE.activeExam.id,
            title: STATE.activeExam.title,
            subject: subjLabel(STATE.activeExam.subject),
            grade: STATE.activeExam.program?.toUpperCase() || '2K9',
            score: graded.score,
            correct: graded.correct,
            total_questions: graded.total,
            review: (graded.review || []).slice(0, 40).map(r => ({
              id: r.id, topic: r.topic || '', correct: Boolean(r.correct || r.status === 'correct'), status: r.status
            }))
          })
        });
        if (recResp.ok) {
          const recData = await recResp.json();
          if (Number(recData?.xp_earned) > 0) xpEarned = Number(recData.xp_earned);
          if (Number(recData?.gold_earned) > 0) goldEarned = Number(recData.gold_earned);
          if (Number(recData?.diamonds_earned) > 0) diamondsEarned = Number(recData.diamonds_earned);
          if (recData?.rpg && typeof window.PK9_APPLY_RPG_UPDATE === 'function') {
            window.PK9_APPLY_RPG_UPDATE(recData.rpg, { xp: recData.xp_total, weekly_xp: recData.weekly_xp });
          }
        }
      } catch {}
      try {
        if (typeof window.PK9_REFRESH_AUTH_AND_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_AUTH_AND_LEADERBOARD();
        }
      } catch {}
    }

    recordLocalDiagnostics(STATE.activeExam, graded);
    STATE.doneExamIds.add(String(STATE.activeExam.id));

    try {
      localStorage.removeItem(`pk9_exam_draft_${STATE.activeExam.id}`);
      const hist = JSON.parse(localStorage.getItem('pk9_exam_history') || '[]');
      hist.unshift({
        examId: STATE.activeExam.id,
        title: STATE.activeExam.title,
        subject: subjLabel(STATE.activeExam.subject),
        score: graded.score,
        correct: graded.correct,
        total: graded.total,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('pk9_exam_history', JSON.stringify(hist.slice(0, 30)));
    } catch {}

    STATE.lastResult = graded;
    STATE.xpAwarded = xpEarned;
    STATE.goldAwarded = goldEarned;
    STATE.diamondsAwarded = diamondsEarned;
    STATE.activeContestId = null;
    STATE.view = 'result';
    renderExamCenter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.PK9_TOAST) {
      const rewardStr = [
        xpEarned ? `+${xpEarned} XP` : '',
        goldEarned ? `+${goldEarned} Vàng` : '',
        diamondsEarned ? `+${diamondsEarned} 💎` : ''
      ].filter(Boolean).join(' · ');
      window.PK9_TOAST(`Đã chấm bài hoàn tất: ${Number(graded.score || 0).toFixed(2)}/10 điểm!${rewardStr ? ` (${rewardStr})` : ''}`, 'success');
    }
  }

  function buildCatalogDynamicHtml() {
    const q = STATE.searchQuery.trim().toLowerCase();
    const bookmarks = getBookmarksList();
    const doneIds = STATE.doneExamIds;
    const sourcesList = Array.isArray(window.PK9_EXAM_SOURCES) ? window.PK9_EXAM_SOURCES : [];
    const refDocs = Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27 : [];

    const filteredBySubjAndQ = STATE.exams.filter(ex => {
      const sName = subjLabel(ex.subject);
      if (STATE.subjectFilter !== 'ALL' && sName !== STATE.subjectFilter) return false;
      if (!q) return true;
      return `${ex.title} ${sName} ${ex.source || ex.sourceOrg || ''} ${ex.periodLabel || ''}`.toLowerCase().includes(q);
    });
    const todoCount = filteredBySubjAndQ.filter(ex => !doneIds.has(String(ex.id))).length;
    const doneCount = filteredBySubjAndQ.filter(ex => doneIds.has(String(ex.id))).length;
    const filtered = filteredBySubjAndQ.filter(ex => {
      const isDone = doneIds.has(String(ex.id));
      if (STATE.statusFilter === 'todo' && isDone) return false;
      if (STATE.statusFilter === 'done' && !isDone) return false;
      return true;
    });

    return `
      ${STATE.view === 'catalog' ? `
        <div class="pk9-exam-status-bar">
          <button type="button" class="pk9-exam-chip ${STATE.statusFilter === 'ALL' ? 'active' : ''}" data-exam-status="ALL">
            📋 Tất cả (${filteredBySubjAndQ.length})
          </button>
          <button type="button" class="pk9-exam-chip ${STATE.statusFilter === 'todo' ? 'active' : ''}" data-exam-status="todo">
            ⚡ Chưa làm (${todoCount})
          </button>
          <button type="button" class="pk9-exam-chip ${STATE.statusFilter === 'done' ? 'active' : ''}" data-exam-status="done">
            ✅ Đã làm (${doneCount})
          </button>
        </div>
      ` : ''}

      ${STATE.view === 'sources' ? renderVerifiedSourcesSection(sourcesList, refDocs, q)
        : STATE.view === 'bookmarks' ? renderBookmarksSection(bookmarks, q)
        : STATE.view === 'wrong-bank' ? renderWrongBankSection(q)
        : STATE.view === 'diagnostics' ? renderDiagnosticsSection()
        : STATE.view === 'arena' ? renderArenaSection()
        : `
        <div class="pk9-exam-grid">
          ${filtered.length ? filtered.map(ex => {
            const qCount = ex.questionCount || (ex.questions ? ex.questions.length : 22);
            const sName = subjLabel(ex.subject);
            const pdfPath = ex.sourceFile || ex.pdfUrl || '';
            const duration = ex.duration || ex.durationMinutes || 50;
            const isDone = doneIds.has(String(ex.id));
            const hasDraft = hasSavedDraft(ex.id);
            return `
              <article class="pk9-exam-card">
                <div>
                  <div class="pk9-exam-card-badges">
                    <span class="pk9-badge pk9-badge-subj">📘 ${esc(sName)} • Khối ${esc(ex.grade || '12')}</span>
                    ${hasDraft ? `<span class="pk9-badge pk9-badge-draft">⏳ Đang làm dở</span>` : ''}
                    <span class="pk9-badge pk9-badge-verified">${isDone ? '✅ Đã làm' : '✓ Nguồn thật đã kiểm duyệt'}</span>
                  </div>
                  <h4>${esc(ex.title)}</h4>
                  <div class="pk9-exam-origin">
                    🏛️ <b>Nguồn đề:</b> ${esc(ex.source || ex.sourceOrg || 'Bộ GD&ĐT / Sở GD&ĐT')}
                  </div>
                  <div class="pk9-exam-meta-row">
                    <span>⏱ ${esc(duration)} phút</span>
                    <span>•</span>
                    <span>📝 ${qCount} câu hỏi (3 phần)</span>
                    <span>•</span>
                    <span>🎯 Thang 10đ + Giải chi tiết</span>
                  </div>
                </div>
                <div class="pk9-exam-actions">
                  <button type="button" class="pk9-btn-exam-primary" data-start-exam="${esc(ex.id)}">
                    ${hasDraft ? '⏳ Tiếp tục làm bài dở' : isDone ? '🔄 Làm lại & Nâng điểm' : '⚡ Vào phòng thi & Chấm điểm'}
                  </button>
                  ${pdfPath ? `
                    <button type="button" class="pk9-btn-exam-ghost" data-start-split="${esc(ex.id)}" title="Làm bài song song với file PDF gốc">
                      📄 Thi kèm PDF
                    </button>
                    <a href="${esc(getDirectDownloadUrl(pdfPath))}" download target="_blank" rel="noopener" class="pk9-btn-exam-ghost" title="Tải đề PDF về máy">
                      ⬇️ Tải PDF
                    </a>
                  ` : ''}
                </div>
              </article>
            `;
          }).join('') : `
            <div style="grid-column:1/-1;padding:2rem;text-align:center;background:var(--pk9-surface);border-radius:1rem;border:1px dashed var(--pk9-border);color:var(--pk9-text-muted);">
              Không có đề thi phù hợp bộ lọc hiện tại. Thử chuyển sang <b>Tất cả môn</b> hoặc <b>Chưa làm / Đã làm</b> nhé!
            </div>
          `}
        </div>
      `}
    `;
  }

  function formatRemainDuration(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d} ngày ${String(h).padStart(2, '0')}g:${String(m).padStart(2, '0')}p`;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function buildContestBannerHtml() {
    const contests = Array.isArray(STATE.contests) ? STATE.contests : [];
    const active = contests.find(c => c.status === 'live') || contests.find(c => c.status === 'upcoming') || contests[0];
    if (!active) return '';
    const now = Date.now();
    const sMs = new Date(active.startAt).getTime();
    const eMs = new Date(active.endAt).getTime();
    const status = now < sMs ? 'upcoming' : now <= eMs ? 'live' : 'ended';
    const remMs = status === 'upcoming' ? (sMs - now) : status === 'live' ? (eMs - now) : 0;
    const badgeLabel = status === 'live'
      ? `🔴 ĐANG MỞ THI THỬ • CÒN ${formatRemainDuration(remMs)}`
      : status === 'upcoming'
      ? `⏳ SẮP MỞ ĐỀ • SAU ${formatRemainDuration(remMs)}`
      : '🏁 ĐỢT THI ĐÃ ĐÓNG • XEM BẢNG XẾP HẠNG';

    return `
      <div class="pk9-contest-banner">
        <div style="flex:1 1 320px;min-width:0;">
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.4rem;">
            <span class="pk9-contest-badge ${status}" id="pk9-contest-countdown" data-contest-start="${esc(active.startAt)}" data-contest-end="${esc(active.endAt)}">${badgeLabel}</span>
            ${Number(active.rewardDiamonds || 0) > 0 ? `<span class="pk9-badge" style="background:rgba(212,175,55,0.22);color:#fde047;border:1px solid rgba(212,175,55,0.45);">💎 Top thưởng +${Number(active.rewardDiamonds)} KC</span>` : ''}
          </div>
          <h3 style="margin:0 0 0.25rem;font-size:1.1rem;font-weight:900;color:#ffffff;">${esc(active.title)}</h3>
          <div style="font-size:0.81rem;color:#cbd5e1;">Đề thi chuẩn: <b>${esc(active.examTitle || active.examId)}</b></div>
        </div>
        <div style="display:flex;gap:0.55rem;flex-wrap:wrap;align-items:center;">
          ${status === 'live' ? `
            <button type="button" class="pk9-btn-exam-primary" data-start-contest="${esc(active.id)}" data-contest-exam="${esc(active.examId)}">
              ⚡ Vào Thi Đợt Này
            </button>
          ` : ''}
          <button type="button" class="pk9-btn-exam-ghost" data-open-contest-lb="${esc(active.id)}" style="background:rgba(255,255,255,0.12);color:#fff;border-color:rgba(255,255,255,0.28);">
            🏆 BXH Đợt Thi
          </button>
        </div>
      </div>
    `;
  }

  function updateContestBannerDOM() {
    const slot = document.getElementById('pk9-contest-banner-slot');
    if (slot) slot.innerHTML = buildContestBannerHtml();
    if (STATE.contestCountdownTimer) clearInterval(STATE.contestCountdownTimer);
    if (document.getElementById('pk9-contest-countdown')) {
      STATE.contestCountdownTimer = setInterval(() => {
        const el = document.getElementById('pk9-contest-countdown');
        if (!el) {
          clearInterval(STATE.contestCountdownTimer);
          STATE.contestCountdownTimer = null;
          return;
        }
        const sMs = new Date(el.getAttribute('data-contest-start') || 0).getTime();
        const eMs = new Date(el.getAttribute('data-contest-end') || 0).getTime();
        const now = Date.now();
        if (now < sMs) el.textContent = `⏳ SẮP MỞ ĐỀ • SAU ${formatRemainDuration(sMs - now)}`;
        else if (now <= eMs) el.textContent = `🔴 ĐANG MỞ THI THỬ • CÒN ${formatRemainDuration(eMs - now)}`;
        else el.textContent = '🏁 ĐỢT THI ĐÃ ĐÓNG • XEM BẢNG XẾP HẠNG';
      }, 1000);
    }
  }

  function updateCatalogDynamicDOM() {
    const dyn = document.getElementById('pk9-exam-dynamic-body');
    if (dyn) {
      dyn.innerHTML = buildCatalogDynamicHtml();
      typesetMath(dyn);
    } else {
      renderExamCenter();
    }
  }

  function renderCatalogView(root) {
    const subjects = ['ALL', 'Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Lịch sử', 'ĐGNL'];
    const bookmarks = getBookmarksList();
    const wrongList = getWrongBankList();

    let hist = [];
    try { hist = JSON.parse(localStorage.getItem('pk9_exam_history') || '[]'); } catch {}
    const bestLocal = hist.length ? Math.max(...hist.map(h => Number(h.score || 0))).toFixed(2) : '—';

    const sourcesList = Array.isArray(window.PK9_EXAM_SOURCES) ? window.PK9_EXAM_SOURCES : [];
    const refDocs = Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27 : [];

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <div style="display:inline-flex;align-items:center;gap:0.45rem;padding:0.3rem 0.8rem;border-radius:999px;background:rgba(56,189,248,0.18);border:1px solid rgba(56,189,248,0.35);font-size:0.76rem;font-weight:800;margin-bottom:0.75rem;">
                <span>🏛️ KHO LUYỆN ĐỀ NGUỒN GỐC THẬT • CHUẨN GDPT 2018</span>
              </div>
              <h2 style="font-size:1.65rem;font-weight:900;margin:0 0 0.55rem;line-height:1.25;">
                Phòng Thi Ảo & Hệ Thống Chấm Điểm Tự Động Phúc K9
              </h2>
              <p style="margin:0;color:rgba(255,255,255,0.86);font-size:0.92rem;line-height:1.6;">
                Tích hợp đề thi thật từ các Sở GD&ĐT (Lâm Đồng, Điện Biên, Hà Nội, Nghệ An...), THPT Ngô Gia Tự, Bộ GD&ĐT và ĐGNL HSA/V-ACT. Hỗ trợ Ngân hàng Câu Sai, Chẩn đoán Điểm Yếu, Đấu Trường 1v1, Bảng Nháp & Máy Tính Khoa Học!
              </p>
            </div>
            <div class="pk9-exam-kpis">
              <div class="pk9-exam-kpi">
                <strong>${STATE.exams.length} Đề</strong>
                <span>Tương tác chấm điểm tự động</span>
              </div>
              <div class="pk9-exam-kpi">
                <strong>${sourcesList.length + refDocs.length}+</strong>
                <span>Đề gốc Sở/Bộ & PDF đối chiếu</span>
              </div>
              <div class="pk9-exam-kpi">
                <strong>${hist.length} Lượt</strong>
                <span>Đề bạn đã hoàn thành</span>
              </div>
              <div class="pk9-exam-kpi">
                <strong>${bestLocal}</strong>
                <span>Điểm cao nhất của bạn</span>
              </div>
            </div>
          </div>
        </div>

        <div id="pk9-contest-banner-slot">${buildContestBannerHtml()}</div>

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            ${subjects.map(sub => `
              <button type="button" class="pk9-exam-chip ${STATE.subjectFilter === sub && STATE.view === 'catalog' ? 'active' : ''}" data-exam-subj="${esc(sub)}">
                ${sub === 'ALL' ? '🔥 Tất cả môn' : esc(sub)}
              </button>
            `).join('')}
            <button type="button" class="pk9-exam-chip ${STATE.view === 'wrong-bank' ? 'active' : ''}" data-exam-view="wrong-bank">
              ❌ Câu sai (${wrongList.length})
            </button>
            <button type="button" class="pk9-exam-chip ${STATE.view === 'diagnostics' ? 'active' : ''}" data-exam-view="diagnostics">
              📊 Điểm yếu & Gợi ý
            </button>
            <button type="button" class="pk9-exam-chip ${STATE.view === 'arena' ? 'active' : ''}" data-exam-view="arena">
              ⚔️ Đấu Trường 1v1
            </button>
            <button type="button" class="pk9-exam-chip ${STATE.view === 'bookmarks' ? 'active' : ''}" data-exam-view="bookmarks">
              📌 Câu đã lưu (${bookmarks.length})
            </button>
            <button type="button" class="pk9-exam-chip ${STATE.view === 'sources' ? 'active' : ''}" data-exam-view="sources">
              📚 Đề gốc Sở/Bộ (${sourcesList.length + refDocs.length})
            </button>
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-exam-search-input" placeholder="Tìm tên đề, Sở GD&ĐT, mã đề..." value="${esc(STATE.searchQuery)}" />
          </div>
        </div>

        <div id="pk9-exam-dynamic-body">
          ${buildCatalogDynamicHtml()}
        </div>

        ${STATE.contestLbData ? renderContestLbModalHtml(STATE.contestLbData) : ''}
      </div>
    `;
    updateContestBannerDOM();
    typesetMath(root);
  }

  function renderContestLbModalHtml(data) {
    const contest = data?.contest || {};
    const entries = Array.isArray(data?.entries) ? data.entries : [];
    return `
      <div class="pk9-palette-drawer-backdrop open" id="pk9-contest-lb-modal" data-close-contest-lb="1">
        <div class="pk9-palette-drawer" style="max-width:600px;" onclick="event.stopPropagation()">
          <div class="pk9-palette-drawer-head">
            <div>
              <div style="font-weight:900;font-size:1rem;">🏆 BXH Đợt Thi: ${esc(contest.title || 'Kỳ Thi Thử Toàn Hệ Thống')}</div>
              <div style="font-size:0.76rem;color:var(--pk9-text-muted,#64748b);">Xếp hạng theo Điểm cao nhất → Thời gian làm bài nhanh nhất</div>
            </div>
            <button type="button" class="pk9-btn-exam-ghost" data-close-contest-lb="1" style="padding:0.3rem 0.65rem;">✕ Đóng</button>
          </div>
          ${entries.length ? `
            <div style="display:flex;flex-direction:column;gap:0.45rem;">
              ${entries.slice(0, 30).map((r, i) => `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.65rem;padding:0.6rem 0.85rem;border-radius:0.8rem;background:var(--pk9-surface-2,#f8fafc);border:1px solid var(--pk9-border,#e2e8f0);">
                  <div style="display:flex;align-items:center;gap:0.6rem;min-width:0;">
                    <span style="font-weight:900;font-size:0.95rem;width:28px;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                    <div style="min-width:0;">
                      <div style="font-weight:800;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(r.displayName || r.username)}</div>
                      <div style="font-size:0.74rem;color:var(--pk9-text-muted,#64748b);">Đúng ${r.correct}/${r.total} câu • Thời gian ${formatClock(r.timeSec || 60)}</div>
                    </div>
                  </div>
                  <div style="font-weight:900;font-size:1.05rem;color:#2563eb;">${Number(r.score || 0).toFixed(2)}đ</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="padding:2rem 1rem;text-align:center;color:var(--pk9-text-muted,#64748b);font-size:0.88rem;">
              Chưa có thí sinh nào nộp bài trong đợt thi này. Hãy là người đầu tiên ghi tên lên Top 1!
            </div>
          `}
        </div>
      </div>
    `;
  }

  function renderWrongBankSection(q) {
    const allWrong = getWrongBankList();
    const list = allWrong.filter(item => {
      if (STATE.subjectFilter !== 'ALL' && subjLabel(item.subject) !== STATE.subjectFilter) return false;
      if (!q) return true;
      return `${item.text || ''} ${item.topic || ''} ${item.subject || ''} ${item.examTitle || ''}`.toLowerCase().includes(q);
    });

    if (!allWrong.length) {
      return `
        <div style="padding:2.3rem 1.5rem;text-align:center;background:var(--pk9-surface);border-radius:1.15rem;border:1px dashed var(--pk9-border);">
          <div style="font-size:2.2rem;margin-bottom:0.4rem;">🎉</div>
          <div style="font-weight:900;font-size:1.05rem;margin-bottom:0.25rem;">Ngân Hàng Câu Sai đang sạch bóng!</div>
          <div style="font-size:0.86rem;color:var(--pk9-text-muted);max-width:480px;margin:0 auto;">
            Mỗi khi bạn nộp một đề trong Phòng Luyện Đề, bất kỳ câu nào làm sai hoặc thiếu ý sẽ tự động gom về đây để bạn luyện lại riêng cho tới khi thuộc lòng.
          </div>
        </div>
      `;
    }

    return `
      <div class="pk9-diag-card" style="display:flex;align-items:center;justify-content:space-between;gap:0.85rem;flex-wrap:wrap;">
        <div>
          <h4 style="margin:0 0 0.25rem;font-size:1.02rem;font-weight:900;">❌ Ngân Hàng "Câu Sai Của Riêng Tôi" (${list.length} câu cần vá)</h4>
          <p style="margin:0;font-size:0.83rem;color:var(--pk9-text-muted);">Hệ thống tự gom câu sai từ các đề thi Sở/Bộ. Làm đúng lại sẽ được cộng <b>+8 🪙 Vàng & +5 ⚡ EXP</b> mỗi câu!</p>
        </div>
        <button type="button" class="pk9-btn-exam-primary" data-practice-wrong-all="1" ${list.length ? '' : 'disabled'}>
          ⚡ Luyện lại ${Math.min(25, list.length)} câu sai ngay
        </button>
      </div>

      <div class="pk9-exam-grid">
        ${list.map(it => {
          const recLesson = findRecommendedLesson(it.subject, it.topic);
          return `
            <article class="pk9-exam-card">
              <div>
                <div class="pk9-exam-card-badges">
                  <span class="pk9-badge pk9-badge-subj">📘 ${esc(subjLabel(it.subject))}</span>
                  ${it.topic ? `<span class="pk9-badge pk9-badge-verified">📌 ${esc(it.topic)}</span>` : ''}
                  <span class="pk9-badge pk9-badge-draft">Sai ${Number(it.wrongCount || 1)} lần</span>
                </div>
                <div style="font-size:0.88rem;font-weight:700;line-height:1.5;margin:0.45rem 0 0.55rem;">${esc(it.text || 'Câu hỏi đã lưu')}</div>
                ${it.explanation ? `<div style="font-size:0.78rem;color:var(--pk9-text-muted);background:var(--pk9-surface-2);padding:0.5rem 0.65rem;border-radius:0.65rem;margin-bottom:0.55rem;">💡 ${esc(it.explanation)}</div>` : ''}
                ${it.examTitle ? `<div class="pk9-exam-origin">📄 Nguồn: ${esc(it.examTitle)} (Câu ${esc(it.number || '?')})</div>` : ''}
              </div>
              <div class="pk9-exam-actions">
                <button type="button" class="pk9-btn-exam-primary" data-resolve-wrong="${esc(it.id)}">✓ Đã nắm vững (+8🪙)</button>
                ${recLesson ? `
                  <button type="button" class="pk9-btn-exam-ghost" data-jump-rec-course="${esc(recLesson.courseId)}" data-jump-rec-topic="${esc(recLesson.topicId)}" title="Mở bài giảng liên quan">
                    🎬 Ôn bài giảng
                  </button>
                ` : ''}
                <button type="button" class="pk9-btn-exam-ghost" data-ask-ai-question="${esc(`Giải thích chi tiết và chỉ lỗi hay sai cho câu ${subjLabel(it.subject)} (${it.topic || ''}): ${it.text || ''}`)}">
                  🤖 Hỏi AI
                </button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderDiagnosticsSection() {
    const stats = getTopicStatsList();
    if (!stats.length) {
      return `
        <div style="padding:2.3rem 1.5rem;text-align:center;background:var(--pk9-surface);border-radius:1.15rem;border:1px dashed var(--pk9-border);">
          <div style="font-size:2.2rem;margin-bottom:0.4rem;">📊</div>
          <div style="font-weight:900;font-size:1.05rem;margin-bottom:0.25rem;">Chưa có dữ liệu Chẩn đoán Năng lực</div>
          <div style="font-size:0.86rem;color:var(--pk9-text-muted);max-width:480px;margin:0 auto;">
            Hãy hoàn thành ít nhất 1 đề thi bất kỳ trong Kho Luyện Đề — hệ thống sẽ tự vẽ biểu đồ độ chính xác từng chuyên đề và đề xuất video cần ôn ngay!
          </div>
        </div>
      `;
    }
    const weakTopics = stats.filter(s => Number(s.accuracy || 0) < 75);
    return `
      <div class="pk9-diag-card">
        <h4 style="margin:0 0 0.35rem;font-size:1.05rem;font-weight:900;">📊 Bản Đồ Chẩn Đoán Chuyên Đề Mạnh / Yếu (Tích Lũy Toàn Bộ Đề)</h4>
        <p style="margin:0 0 0.9rem;font-size:0.83rem;color:var(--pk9-text-muted);">
          Sắp xếp từ chuyên đề yếu nhất lên đầu (${weakTopics.length} chuyên đề dưới 75% cần ưu tiên vá lỗ hổng).
        </p>
        <div>
          ${stats.map(t => {
            const pct = Math.max(0, Math.min(100, Number(t.accuracy || 0)));
            const color = pct >= 80 ? '#10b981' : pct >= 55 ? '#f59e0b' : '#ef4444';
            const rec = findRecommendedLesson(t.subject, t.topic);
            return `
              <div class="pk9-diag-row">
                <div>
                  <div style="font-weight:800;font-size:0.88rem;">${esc(t.topic)}</div>
                  <div style="font-size:0.74rem;color:var(--pk9-text-muted);">${esc(subjLabel(t.subject))} • Đúng ${t.correct || 0}/${t.total || 0} câu</div>
                </div>
                <div class="pk9-topic-track" style="height:0.62rem;">
                  <div class="pk9-topic-fill" style="width:${Math.max(4, pct)}%;background:${color};"></div>
                </div>
                <div style="font-weight:900;font-size:0.9rem;color:${color};min-width:58px;text-align:right;">${pct}%</div>
                <div>
                  ${rec ? `
                    <button type="button" class="pk9-btn-exam-ghost" data-jump-rec-course="${esc(rec.courseId)}" data-jump-rec-topic="${esc(rec.topicId)}" style="padding:0.32rem 0.7rem;font-size:0.76rem;">
                      🎬 Học: ${esc(rec.courseName)}
                    </button>
                  ` : `<span style="font-size:0.74rem;color:var(--pk9-text-muted);">${pct >= 80 ? '✅ Vững vàng' : '📌 Ôn câu sai'}</span>`}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function stopDuelTimers() {
    if (STATE.duelTimerId) { clearInterval(STATE.duelTimerId); STATE.duelTimerId = null; }
    if (STATE.duelPollId) { clearInterval(STATE.duelPollId); STATE.duelPollId = null; }
  }

  function startDuelTimers() {
    stopDuelTimers();
    if (STATE.duelStage === 'playing' && STATE.duelRoom) {
      STATE.duelTimerId = setInterval(() => {
        if (STATE.view !== 'arena' || STATE.duelStage !== 'playing') { stopDuelTimers(); return; }
        STATE.duelElapsedSec += 1;
        const cEl = document.getElementById('pk9-duel-clock');
        if (cEl) cEl.textContent = formatClock(STATE.duelElapsedSec);
      }, 1000);
    }
    if (STATE.duelRoom && STATE.duelRoom.status !== 'finished') {
      STATE.duelPollId = setInterval(async () => {
        if (STATE.view !== 'arena' || !STATE.duelRoom?.code) { stopDuelTimers(); return; }
        try {
          const resp = await fetch(`/api/exams?action=duel-state&code=${encodeURIComponent(STATE.duelRoom.code)}`, { credentials: 'include' });
          if (resp.ok) {
            const d = await resp.json();
            if (d?.ok && d.room) {
              const prevStatus = STATE.duelRoom.status;
              const prevLen = (STATE.duelRoom.players || []).length;
              STATE.duelRoom = d.room;
              if (STATE.duelStage === 'result' && (d.room.status !== prevStatus || (d.room.players || []).length !== prevLen)) {
                updateCatalogDynamicDOM();
                if (d.room.status === 'finished') stopDuelTimers();
              }
            }
          }
        } catch {}
      }, 3000);
    }
  }

  function renderArenaSection() {
    const loggedUser = typeof window.PK9_GET_USER === 'function' ? window.PK9_GET_USER() : null;
    const myUname = String(loggedUser?.username || '').toLowerCase();

    if (STATE.duelRoom && (STATE.duelStage === 'playing' || STATE.duelStage === 'result')) {
      const room = STATE.duelRoom;
      const players = room.players || [];
      const me = players.find(p => String(p.username).toLowerCase() === myUname) || players[0] || {};
      const opp = players.find(p => String(p.username).toLowerCase() !== myUname) || null;
      const qs = room.questions || [];
      const doneCnt = qs.filter(q => Number.isInteger(STATE.duelAnswers[q.id])).length;
      const shareUrl = `${window.location.origin}/?duel=${encodeURIComponent(room.code)}`;

      if (STATE.duelStage === 'result' || me.status === 'submitted') {
        const bothDone = room.status === 'finished';
        return `
          <div class="pk9-arena-vs-card">
            <div>
              <div style="font-size:0.72rem;font-weight:800;color:#38bdf8;">BẠN • ${room.winner?.username === me.username ? '👑 NGƯỜI THẮNG' : ''}</div>
              <div style="font-size:1.15rem;font-weight:900;margin:0.15rem 0;">${esc(me.displayName || me.username || 'Bạn')}</div>
              <div style="font-size:0.88rem;color:#fde047;font-weight:800;">
                ${me.score ?? 0} điểm • Đúng ${me.correct ?? 0}/${qs.length} (${formatClock(me.timeSec || 0)})
              </div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:1.5rem;font-weight:900;color:#f59e0b;">⚔️ VS</div>
              <div style="font-size:0.74rem;color:#cbd5e1;">Mã phòng: <b>${esc(room.code)}</b></div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.72rem;font-weight:800;color:#38bdf8;">ĐỐI THỦ • ${opp && room.winner?.username === opp.username ? '👑 NGƯỜI THẮNG' : ''}</div>
              <div style="font-size:1.15rem;font-weight:900;margin:0.15rem 0;">${opp ? esc(opp.displayName || opp.username) : '⏳ Đang chờ bạn bè vào...'}</div>
              <div style="font-size:0.88rem;color:#e2e8f0;font-weight:700;">
                ${!opp ? `Gửi mã ${esc(room.code)} để đối thủ vào đấu` : opp.status === 'submitted' ? `${opp.score} điểm • Đúng ${opp.correct}/${qs.length} (${formatClock(opp.timeSec || 0)})` : '⏳ Đối thủ đang làm bài...'}
              </div>
            </div>
          </div>

          <div class="pk9-diag-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.65rem;">
            <div>
              <b>${bothDone ? (room.winner?.type === 'draw' ? '🤝 Hai đấu thủ hòa điểm!' : `🏆 Chiến thắng thuộc về ${esc(room.winner?.displayName || '')}!`) : '📡 Đang tự động cập nhật kết quả đối thủ mỗi 3 giây...'}</b>
              ${STATE.duelLastReward ? `<div style="font-size:0.8rem;color:#10b981;font-weight:800;margin-top:0.2rem;">🎁 Phần thưởng đã nhận: +${STATE.duelLastReward.gold || 0} 🪙 Vàng · +${STATE.duelLastReward.xp || 0} ⚡ EXP</div>` : ''}
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
              <button type="button" class="pk9-btn-exam-ghost" data-copy-duel-link="${esc(shareUrl)}">📋 Chép Link Mời (${esc(room.code)})</button>
              <button type="button" class="pk9-btn-exam-primary" data-duel-back-lobby="1">⚔️ Về Sảnh Đấu Trường</button>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            ${qs.map((q, idx) => {
              const picked = STATE.duelAnswers[q.id];
              const isOk = picked === q.correct;
              return `
                <div class="pk9-review-card ${isOk ? 'correct' : 'wrong'}">
                  <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
                    <b>Câu ${idx + 1} • ${esc(q.subject)}</b>
                    <span class="pk9-badge ${isOk ? 'pk9-badge-verified' : 'pk9-badge-hot'}">${isOk ? '✓ Chính xác' : '✗ Chưa đúng'}</span>
                  </div>
                  <div style="font-size:0.9rem;margin-bottom:0.45rem;">${esc(q.question)}</div>
                  <div style="font-size:0.82rem;">Bạn chọn: <b>${picked >= 0 ? esc(q.options?.[picked] || '') : 'Trống'}</b> • Đáp án đúng: <b style="color:#10b981;">${esc(q.options?.[q.correct] || '')}</b></div>
                  ${q.solution ? `<div class="pk9-exp-box">💡 ${esc(q.solution)}</div>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      return `
        <div class="pk9-exam-sticky-bar" style="position:sticky;top:var(--pk9-topbar-h,52px);z-index:20;margin-bottom:1rem;">
          <div>
            <div style="font-size:0.74rem;font-weight:800;color:#2563eb;">⚔️ PHÒNG THÁCH ĐẤU 1v1 • MÃ: ${esc(room.code)}</div>
            <div style="font-weight:900;font-size:0.96rem;">${esc(room.title)} (${doneCnt}/${qs.length} câu)</div>
          </div>
          <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
            <span class="pk9-timer-pill" id="pk9-duel-clock">${formatClock(STATE.duelElapsedSec)}</span>
            <button type="button" class="pk9-btn-exam-ghost" data-copy-duel-link="${esc(shareUrl)}">📋 Link mời</button>
            <button type="button" class="pk9-btn-exam-primary" data-duel-submit="1">✅ Nộp bài Đấu</button>
            <button type="button" class="pk9-btn-exam-ghost" data-duel-back-lobby="1">✕ Rời</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.85rem;">
          ${qs.map((q, idx) => {
            const picked = STATE.duelAnswers[q.id];
            const letters = ['A', 'B', 'C', 'D'];
            return `
              <div class="pk9-q-card ${Number.isInteger(picked) ? 'answered' : ''}">
                <div class="pk9-q-num" style="margin-bottom:0.45rem;"><span>Câu ${idx + 1}/${qs.length} • ${esc(q.subject)}</span><span class="pk9-q-topic-tag">${esc(q.topic)}</span></div>
                <div class="pk9-q-prompt">${esc(q.question)}</div>
                <div class="pk9-mcq-list">
                  ${(q.options || []).map((opt, oIdx) => `
                    <div class="pk9-mcq-opt ${picked === oIdx ? 'selected' : ''}" data-duel-pick="${esc(q.id)}" data-duel-opt="${oIdx}">
                      <span class="pk9-mcq-letter">${letters[oIdx]}</span>
                      <div style="flex:1;">${esc(opt)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    const duelSubjs = ['Tất cả', 'Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Lịch sử', 'ĐGNL'];
    return `
      <div class="pk9-arena-grid">
        <div class="pk9-arena-box">
          <h4 style="margin:0 0 0.45rem;font-size:1.02rem;font-weight:900;">⚔️ Tạo Phòng Thách Đấu 1v1 Mới</h4>
          <p style="margin:0 0 0.85rem;font-size:0.82rem;color:var(--pk9-text-muted);">Chọn môn & số câu, hệ thống sinh mã phòng + link mời gửi bạn bè. Thắng trận thưởng <b>+40 🪙 Vàng & +35 ⚡ EXP</b>!</p>
          ${!loggedUser ? `<div style="margin-bottom:0.75rem;padding:0.55rem 0.75rem;border-radius:0.75rem;background:rgba(245,158,11,0.12);font-size:0.8rem;font-weight:700;color:#b45309;">🔒 Hãy <button type="button" class="pk9-admin-btn-xs" data-open-auth="login">Đăng nhập</button> để tạo và đấu 1v1 cùng bạn bè.</div>` : ''}
          <div style="font-size:0.76rem;font-weight:800;margin-bottom:0.3rem;color:var(--pk9-text-muted);">MÔN THI ĐẤU:</div>
          <div class="pk9-exam-tabs" style="margin-bottom:0.7rem;">
            ${duelSubjs.map(s => `<button type="button" class="pk9-exam-chip ${STATE.duelSubject === s ? 'active' : ''}" data-duel-subj="${esc(s)}">${esc(s)}</button>`).join('')}
          </div>
          <div style="font-size:0.76rem;font-weight:800;margin-bottom:0.3rem;color:var(--pk9-text-muted);">SỐ CÂU ĐẤU NHANH:</div>
          <div class="pk9-exam-tabs" style="margin-bottom:0.9rem;">
            ${[5, 10].map(n => `<button type="button" class="pk9-exam-chip ${STATE.duelCount === n ? 'active' : ''}" data-duel-count="${n}">${n} câu tốc độ</button>`).join('')}
          </div>
          <button type="button" class="pk9-btn-exam-primary" data-duel-create="1" style="width:100%;">🚀 Tạo Phòng & Lấy Mã Mời</button>
        </div>

        <div class="pk9-arena-box">
          <h4 style="margin:0 0 0.45rem;font-size:1.02rem;font-weight:900;">🔑 Nhập Mã Phòng Hoặc Vào Sảnh Đang Chờ</h4>
          <p style="margin:0 0 0.75rem;font-size:0.82rem;color:var(--pk9-text-muted);">Dán mã 6 ký tự (VD: K9A7F2) bạn bè gửi hoặc chọn phòng đang mở bên dưới.</p>
          <form id="pk9-duel-join-form" style="display:flex;gap:0.5rem;margin-bottom:0.9rem;">
            <input type="text" id="pk9-duel-code-input" class="pk9-input" maxlength="12" placeholder="Nhập mã phòng (VD: K9XXXX)..." style="margin:0;text-transform:uppercase;font-weight:800;" required />
            <button type="submit" class="pk9-btn-exam-primary" style="flex-shrink:0;">⚔️ Vào Đấu</button>
          </form>
          <div style="font-size:0.76rem;font-weight:800;margin-bottom:0.45rem;color:var(--pk9-text-muted);">PHÒNG THÁCH ĐẤU ĐANG MỞ (${(STATE.openDuels || []).length}):</div>
          <div style="display:flex;flex-direction:column;gap:0.45rem;max-height:220px;overflow-y:auto;">
            ${(STATE.openDuels || []).length ? STATE.openDuels.map(r => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.55rem 0.75rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
                <div style="min-width:0;">
                  <div style="font-weight:800;font-size:0.84rem;">${esc(r.title)} <span class="pk9-badge pk9-badge-code">${esc(r.code)}</span></div>
                  <div style="font-size:0.74rem;color:var(--pk9-text-muted);">Chủ phòng: ${esc(r.hostName)} • ${r.playerCount || 1}/2 đấu thủ</div>
                </div>
                <button type="button" class="pk9-admin-btn-xs" data-duel-join-code="${esc(r.code)}" ${r.playerCount >= 2 ? 'disabled' : ''}>
                  ${r.playerCount >= 2 ? (r.status === 'finished' ? '🏁 Đã xong' : 'Đủ người') : '⚔️ Thách đấu'}
                </button>
              </div>
            `).join('') : `<div style="font-size:0.82rem;color:var(--pk9-text-muted);padding:0.75rem 0;">Chưa có phòng nào mở — hãy bấm Tạo Phòng bên trái để khởi xướng kèo 1v1!</div>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderBookmarksSection(bookmarks, q) {
    const list = (bookmarks || []).filter(b => {
      if (!q) return true;
      return `${b.text || ''} ${b.topic || ''} ${b.subject || ''} ${b.examTitle || ''}`.toLowerCase().includes(q);
    });
    if (!list.length) {
      return `
        <div style="padding:2.2rem 1.5rem;text-align:center;background:var(--pk9-surface);border-radius:1.15rem;border:1px dashed var(--pk9-border);">
          <div style="font-size:2rem;margin-bottom:0.4rem;">📌</div>
          <div style="font-weight:800;font-size:1rem;margin-bottom:0.25rem;">Chưa có câu hỏi nào được lưu</div>
          <div style="font-size:0.84rem;color:var(--pk9-text-muted);max-width:460px;margin:0 auto;">
            Trong lúc làm đề thi, hãy bấm nút <b>📌 Lưu câu</b> ở những câu hay hoặc câu khó để gom lại ôn tập tại đây!
          </div>
        </div>
      `;
    }
    return `
      <div class="pk9-exam-grid">
        ${list.map(b => `
          <article class="pk9-exam-card">
            <div>
              <div class="pk9-exam-card-badges">
                <span class="pk9-badge pk9-badge-subj">📘 ${esc(b.subject || 'Tổng hợp')}</span>
                ${b.topic ? `<span class="pk9-badge pk9-badge-verified">📌 ${esc(b.topic)}</span>` : ''}
              </div>
              <div style="font-size:0.86rem;font-weight:700;line-height:1.5;color:var(--pk9-text);margin:0.4rem 0 0.65rem;">
                ${esc(b.text || 'Câu hỏi đã lưu')}
              </div>
              ${b.examTitle ? `<div class="pk9-exam-origin">📄 Đề: ${esc(b.examTitle)} (Câu ${esc(b.number || '?')})</div>` : ''}
            </div>
            <div class="pk9-exam-actions">
              ${b.examId ? `
                <button type="button" class="pk9-btn-exam-primary" data-start-exam="${esc(b.examId)}">
                  ⚡ Mở đề thi chứa câu này
                </button>
              ` : ''}
              <button type="button" class="pk9-btn-exam-ghost" data-bookmark-q="${esc(b.id)}">
                🗑️ Bỏ lưu
              </button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderVerifiedSourcesSection(sourcesList, refDocs, q) {
    const combined = [
      ...sourcesList.map(s => ({
        title: s.title,
        subject: s.subject,
        grade: s.grade || '2K9',
        source: s.source,
        format: s.format || 'Đề chuẩn GDPT 2018',
        url: s.url,
        interactiveExamId: s.interactiveExamId
      })),
      ...refDocs.map(d => ({
        title: d.title,
        subject: d.subject || 'Tổng hợp',
        grade: d.grade || '2K9',
        source: d.source || 'Sở GD&ĐT / Loigiaihay',
        format: d.kind || 'Đề thi & Lời giải PDF',
        url: d.url,
        interactiveExamId: d.subject?.includes('Toán') ? 'exam-toan-lam-dong-2026-lan1'
          : d.subject?.includes('Sinh') ? 'exam-sinh-dien-bien-2026-0401'
          : d.subject?.includes('Anh') ? 'exam-tienganh-globalsuccess-2026'
          : 'exam-vatli-quocgia-2026'
      }))
    ].filter(item => {
      if (STATE.subjectFilter !== 'ALL' && !String(item.subject).toLowerCase().includes(STATE.subjectFilter.toLowerCase())) return false;
      if (!q) return true;
      return `${item.title} ${item.subject} ${item.source}`.toLowerCase().includes(q);
    });

    return `
      <div class="pk9-exam-grid">
        ${combined.map(item => `
          <article class="pk9-exam-card">
            <div>
              <div class="pk9-exam-card-badges">
                <span class="pk9-badge pk9-badge-subj">${esc(item.subject)} • ${esc(item.grade)}</span>
                <span class="pk9-badge pk9-badge-verified">🏛️ ${esc(item.source)}</span>
              </div>
              <h4>${esc(item.title)}</h4>
              <div class="pk9-exam-origin">Định dạng: ${esc(item.format)}</div>
            </div>
            <div class="pk9-exam-actions">
              ${item.interactiveExamId ? `
                <button type="button" class="pk9-btn-exam-primary" data-start-exam="${esc(item.interactiveExamId)}">
                  ⚡ Làm đề tương tác
                </button>
              ` : ''}
              ${isDownloadableSourceUrl(item.url) ? `
                <a href="${esc(getDirectDownloadUrl(item.url))}" download target="_blank" rel="noopener" class="pk9-btn-exam-ghost">
                  ⬇️ Tải PDF
                </a>
              ` : ''}
              <a href="${esc(item.url)}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost">
                🔗 Mở nguồn ↗
              </a>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderTakingView(root) {
    const ex = STATE.activeExam;
    const questions = ex.questions || [];
    const answeredCount = questions.filter(q => isQuestionAnswered(q, STATE.answers[q.id])).length;
    const pdfPath = ex.sourceFile || ex.pdfUrl || '';
    const hasSectionPlan = Array.isArray(STATE.sectionsPlan) && STATE.sectionsPlan.length > 1;
    const activeSec = (STATE.sectionLockMode && hasSectionPlan)
      ? (STATE.sectionsPlan[STATE.activeSectionIdx] || STATE.sectionsPlan[0])
      : null;

    const visibleQuestions = activeSec
      ? questions.filter(q => String(q.section || 'I') === String(activeSec.id))
      : questions;

    const p1 = visibleQuestions.filter(q => normalizeQuestionType(q) === 'mcq');
    const p2 = visibleQuestions.filter(q => normalizeQuestionType(q) === 'truefalse');
    const p3 = visibleQuestions.filter(q => normalizeQuestionType(q) === 'short');

    let curIdx = Math.max(0, Math.min(questions.length - 1, Number(STATE.currentQIdx) || 0));
    if (activeSec && questions[curIdx] && String(questions[curIdx].section || 'I') !== String(activeSec.id)) {
      const matchIdx = questions.findIndex(q => String(q.section || 'I') === String(activeSec.id));
      if (matchIdx >= 0) curIdx = matchIdx;
    }
    STATE.currentQIdx = curIdx;
    const curQ = questions[curIdx] || null;

    const paperTheme = getActivePaperTheme();
    root.innerHTML = `
      <div class="pk9-exam-room ${esc(paperTheme)}">
        <div class="pk9-exam-sticky-bar">
          <div class="pk9-exam-sticky-head">
            <div class="pk9-exam-sticky-org">
              🏛️ ${esc(ex.source || ex.sourceOrg || 'Đề thi chính thức')} • ${esc(subjLabel(ex.subject))}
            </div>
            <div class="pk9-exam-sticky-title">
              ${esc(ex.title)}
            </div>
          </div>
          <div class="pk9-exam-sticky-controls">
            <span class="pk9-timer-pill" id="pk9-exam-timer">⏱ ${formatClock(STATE.remainingSec)}</span>
            <span class="pk9-exam-progress-pill">
              <span class="pk9-hide-mob-xs">Đã làm: </span><b id="pk9-exam-progress-text">${answeredCount}/${questions.length}</b>
            </span>
            <button type="button" class="pk9-btn-exam-ghost" data-exam-tool-calc="1" title="Bật máy tính khoa học Casio" style="padding:0.28rem 0.58rem;font-size:0.74rem;">
              🧮 <span class="pk9-hide-mob-xs">Máy tính</span>
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-exam-tool-pad="${esc(ex.id)}" title="Bật bảng nháp vẽ tay" style="padding:0.28rem 0.58rem;font-size:0.74rem;">
              ✏️ <span class="pk9-hide-mob-xs">Nháp</span>
            </button>
            ${hasSectionPlan ? `
              <button type="button" class="pk9-btn-exam-ghost" data-toggle-section-lock="1" title="Chế độ ĐGNL chia phần khóa giờ riêng" style="padding:0.28rem 0.58rem;font-size:0.74rem;${STATE.sectionLockMode ? 'border-color:#0284c7;color:#0284c7;font-weight:900;' : ''}">
                ${STATE.sectionLockMode ? '🔒 Chia phần ĐGNL' : '🔓 Chia phần'}
              </button>
            ` : ''}
            <div class="pk9-paper-switch" role="group" aria-label="Nền giấy làm bài">
              <button type="button" class="pk9-paper-btn ${paperTheme === 'paper-white' ? 'active' : ''}" data-paper-theme="paper-white" title="Nền giấy trắng">⬜ Trắng</button>
              <button type="button" class="pk9-paper-btn ${paperTheme === 'paper-ivory' ? 'active' : ''}" data-paper-theme="paper-ivory" title="Nền giấy ngà dịu mắt">📜 Ngà</button>
              <button type="button" class="pk9-paper-btn ${paperTheme === 'paper-softgray' ? 'active' : ''}" data-paper-theme="paper-softgray" title="Nền giấy xám dịu">🌫️ Xám</button>
            </div>
            <button type="button" class="pk9-btn-exam-ghost pk9-exam-mode-btn" data-toggle-single-q="1" title="Chuyển chế độ Từng câu / Tất cả câu">
              ${STATE.focusSingleQ ? '📜 Tất cả' : '📱 Từng câu'}
            </button>
            <button type="button" class="pk9-btn-exam-ghost pk9-exam-palette-btn" data-toggle-palette-drawer="1" title="Mở bản đồ câu hỏi">
              🧭 Bản đồ
            </button>
            ${pdfPath ? `
              <button type="button" class="pk9-btn-exam-ghost pk9-exam-pdf-btn" data-toggle-split-pdf="1">
                ${STATE.splitPdf ? '📐 Ẩn PDF' : '📄 PDF'}
              </button>
            ` : ''}
            <button type="button" class="pk9-btn-exam-primary pk9-exam-submit-btn" data-submit-exam="1">
              ✅ Nộp bài<span class="pk9-hide-mob-xs"> & Chấm điểm</span>
            </button>
            <button type="button" class="pk9-btn-exam-ghost pk9-exam-exit-btn" data-exit-exam="1">
              ✕<span class="pk9-hide-mob-xs"> Thoát</span>
            </button>
          </div>
        </div>

        ${activeSec ? `
          <div class="pk9-section-lock-bar">
            <div>
              <div style="font-size:0.74rem;font-weight:900;color:#0284c7;">🎯 CHẾ ĐỘ ĐGNL KHÓA GIỜ TỪNG PHẦN (${STATE.activeSectionIdx + 1}/${STATE.sectionsPlan.length})</div>
              <div style="font-weight:900;font-size:0.96rem;">${esc(activeSec.label)} (${visibleQuestions.length} câu đang mở)</div>
            </div>
            <div style="display:flex;align-items:center;gap:0.55rem;flex-wrap:wrap;">
              <span class="pk9-timer-pill" style="background:rgba(14,165,233,0.16);color:#0369a1;border-color:rgba(14,165,233,0.4);">
                ⏱ Giờ phần này: <b id="pk9-sec-timer">${formatClock(STATE.sectionRemainingSec)}</b>
              </span>
              ${STATE.activeSectionIdx < STATE.sectionsPlan.length - 1 ? `
                <button type="button" class="pk9-btn-exam-primary" data-advance-section="1" style="padding:0.4rem 0.85rem;font-size:0.8rem;">
                  ⏭️ Khóa phần này & Qua phần tiếp →
                </button>
              ` : `
                <button type="button" class="pk9-btn-exam-primary" data-submit-exam="1" style="padding:0.4rem 0.85rem;font-size:0.8rem;">
                  ✅ Nộp bài (Phần cuối)
                </button>
              `}
            </div>
          </div>
        ` : ''}

        <div class="pk9-exam-workspace ${STATE.splitPdf && pdfPath ? 'with-pdf' : ''}">
          ${STATE.splitPdf && pdfPath ? `
            <div class="pk9-exam-pdf-pane">
              <div class="pk9-exam-pdf-head">
                <div class="pk9-exam-pdf-title-wrap">
                  <img src="/assets/phuc-k9-favicon.png" alt="" class="pk9-exam-pdf-crest" />
                  <span class="pk9-exam-pdf-title">📄 Đề PDF (${esc(ex.source || 'Sở/Bộ')})</span>
                </div>
                <div class="pk9-exam-pdf-tools">
                  <button type="button" class="pk9-exam-pdf-mini-btn accent" data-open-inapp-url="${esc(pdfPath)}" data-open-inapp-title="${esc(ex.title || 'Đề thi PDF gốc')}" data-open-inapp-sub="${esc(ex.source || 'Học Cùng Phúc K9')}">🔍 Toàn màn hình</button>
                  <a href="${esc(getDirectDownloadUrl(pdfPath))}" download target="_blank" rel="noopener" class="pk9-exam-pdf-mini-btn">⬇️ Tải</a>
                  <a href="${esc(pdfPath)}" target="_blank" rel="noopener" class="pk9-exam-pdf-mini-btn">↗️ Mở gốc</a>
                  <button type="button" class="pk9-exam-pdf-mini-btn close" data-toggle-split-pdf="1" aria-label="Ẩn PDF">✕</button>
                </div>
              </div>
              <div class="pk9-exam-pdf-stage">
                <iframe src="${esc(pdfPath)}" title="Đề PDF gốc"></iframe>
              </div>
            </div>
          ` : ''}

          <div class="pk9-exam-questions-col">
            ${STATE.focusSingleQ && curQ ? `
              <div class="pk9-single-q-nav">
                <button type="button" class="pk9-btn-exam-ghost" data-step-q="-1" ${curIdx === 0 ? 'disabled style="opacity:0.45;pointer-events:none;"' : ''}>
                  ← Câu trước
                </button>
                <button type="button" class="pk9-btn-exam-ghost" data-toggle-palette-drawer="1" style="font-weight:900;">
                  🧭 Câu ${curIdx + 1}/${questions.length} (Phần ${esc(curQ.section || 'I')})
                </button>
                ${curIdx < questions.length - 1 ? `
                  <button type="button" class="pk9-btn-exam-primary" data-step-q="1">
                    Câu tiếp →
                  </button>
                ` : `
                  <button type="button" class="pk9-btn-exam-primary" data-submit-exam="1">
                    ✅ Nộp bài
                  </button>
                `}
              </div>
              ${renderQuestionCard(curQ, curIdx + 1)}
              <div class="pk9-single-q-nav" style="margin-top:0.25rem;">
                <button type="button" class="pk9-btn-exam-ghost" data-step-q="-1" ${curIdx === 0 ? 'disabled style="opacity:0.45;pointer-events:none;"' : ''}>
                  ← Câu trước
                </button>
                <button type="button" class="pk9-btn-exam-ghost" data-toggle-single-q="1">
                  📜 Xem toàn bộ ${visibleQuestions.length} câu
                </button>
                ${curIdx < questions.length - 1 ? `
                  <button type="button" class="pk9-btn-exam-primary" data-step-q="1">
                    Câu tiếp →
                  </button>
                ` : `
                  <button type="button" class="pk9-btn-exam-primary" data-submit-exam="1">
                    ✅ Nộp bài
                  </button>
                `}
              </div>
            ` : `
              ${p1.length ? `
                <div class="pk9-section-banner">
                  <h4>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (${p1.length} câu)</h4>
                  <p>Mỗi câu hỏi thí sinh chỉ chọn một phương án A, B, C hoặc D.</p>
                </div>
                ${p1.map((q, idx) => renderQuestionCard(q, idx + 1)).join('')}
              ` : ''}

              ${p2.length ? `
                <div class="pk9-section-banner">
                  <h4>PHẦN II. Câu trắc nghiệm Đúng / Sai (${p2.length} câu — Thang điểm lũy tiến Bộ GD&ĐT)</h4>
                  <p>Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn Đúng hoặc Sai. (Đúng 1 ý: 0,1đ • 2 ý: 0,25đ • 3 ý: 0,5đ • 4 ý: 1,0đ).</p>
                </div>
                ${p2.map((q, idx) => renderQuestionCard(q, idx + 1)).join('')}
              ` : ''}

              ${p3.length ? `
                <div class="pk9-section-banner">
                  <h4>PHẦN III. Câu trắc nghiệm trả lời ngắn (${p3.length} câu)</h4>
                  <p>Thí sinh tính toán và điền kết quả số (dùng dấu phẩy hoặc dấu chấm cho số thập phân).</p>
                </div>
                ${p3.map((q, idx) => renderQuestionCard(q, idx + 1)).join('')}
              ` : ''}
            `}
          </div>

          ${!(STATE.splitPdf && pdfPath) ? `
            <aside class="pk9-exam-palette">
              <div style="font-weight:800;font-size:0.92rem;color:var(--pk9-text,#0f172a);">
                🧭 Bản đồ câu hỏi
              </div>
              <div style="font-size:0.76rem;color:var(--pk9-text-muted,#64748b);margin-top:0.2rem;">
                ${activeSec ? `Đang khóa làm ${esc(activeSec.id)} — các phần khác tạm khóa.` : 'Nhấn vào số câu để cuộn nhanh tới câu hỏi đó.'}
              </div>
              <div class="pk9-palette-grid" id="pk9-palette-grid">
                ${questions.map((q, idx) => {
                  const done = isQuestionAnswered(q, STATE.answers[q.id]);
                  const flag = Boolean(STATE.flagged[q.id]);
                  const isCur = STATE.focusSingleQ && idx === curIdx;
                  const locked = activeSec && String(q.section || 'I') !== String(activeSec.id);
                  return `
                    <button type="button" class="pk9-palette-btn ${done ? 'answered' : ''} ${flag ? 'flagged' : ''} ${isCur ? 'current' : ''}" data-jump-q="${esc(q.id)}" data-jump-idx="${idx}" ${locked ? 'disabled style="opacity:0.35;cursor:not-allowed;" title="Phần này đang khóa"' : ''}>
                      ${idx + 1}
                    </button>
                  `;
                }).join('')}
              </div>
              <div style="margin-top:1rem;padding-top:0.85rem;border-top:1px dashed var(--pk9-border,#e2e8f0);display:flex;flex-direction:column;gap:0.5rem;">
                <button type="button" class="pk9-btn-exam-primary" data-submit-exam="1" style="width:100%;">
                  ✅ Nộp bài & Chấm điểm ngay
                </button>
              </div>
            </aside>
          ` : ''}
        </div>

        <div class="pk9-palette-drawer-backdrop ${STATE.paletteDrawerOpen ? 'open' : ''}" id="pk9-exam-palette-drawer" data-close-palette-drawer="1">
          <div class="pk9-palette-drawer" onclick="event.stopPropagation()">
            <div class="pk9-palette-drawer-head">
              <div>
                <div style="font-weight:900;font-size:0.98rem;">🧭 Bản đồ câu hỏi (<span id="pk9-drawer-progress-text">${answeredCount}/${questions.length}</span> đã làm)</div>
                <div style="font-size:0.76rem;color:var(--pk9-text-muted,#64748b);">Chạm số câu để chuyển nhanh • 🟩 Đã làm • 🟧 Đánh dấu</div>
              </div>
              <button type="button" class="pk9-btn-exam-ghost" data-close-palette-drawer="1" style="padding:0.3rem 0.65rem;">✕ Đóng</button>
            </div>
            <div class="pk9-palette-grid" id="pk9-palette-drawer-grid">
              ${questions.map((q, idx) => {
                const done = isQuestionAnswered(q, STATE.answers[q.id]);
                const flag = Boolean(STATE.flagged[q.id]);
                const isCur = STATE.focusSingleQ && idx === curIdx;
                const locked = activeSec && String(q.section || 'I') !== String(activeSec.id);
                return `
                  <button type="button" class="pk9-palette-btn ${done ? 'answered' : ''} ${flag ? 'flagged' : ''} ${isCur ? 'current' : ''}" data-jump-q="${esc(q.id)}" data-jump-idx="${idx}" ${locked ? 'disabled style="opacity:0.35;cursor:not-allowed;"' : ''}>
                    ${idx + 1}
                  </button>
                `;
              }).join('')}
            </div>
            <div style="margin-top:0.9rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
              <button type="button" class="pk9-btn-exam-ghost" data-toggle-single-q="1" style="flex:1;">
                ${STATE.focusSingleQ ? '📜 Xem tất cả câu' : '📱 Chế độ Từng câu'}
              </button>
              <button type="button" class="pk9-btn-exam-primary" data-submit-exam="1" style="flex:1;">
                ✅ Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    typesetMath(root);
  }

  function renderQuestionCard(q, displayIndex) {
    const ans = STATE.answers[q.id];
    const done = isQuestionAnswered(q, ans);
    const flagged = Boolean(STATE.flagged[q.id]);
    const qType = normalizeQuestionType(q);
    const promptText = q.text || q.prompt || '';

    let bodyHtml = '';
    if (qType === 'mcq') {
      const letters = ['A', 'B', 'C', 'D'];
      bodyHtml = `
        <div class="pk9-mcq-list">
          ${(q.options || []).map((opt, idx) => {
            const key = typeof opt === 'object' && opt !== null ? (opt.key || letters[idx]) : letters[idx];
            const text = typeof opt === 'object' && opt !== null ? opt.text : String(opt);
            const selected = String(ans || '').toUpperCase() === String(key).toUpperCase();
            return `
              <div class="pk9-mcq-opt ${selected ? 'selected' : ''}" data-pick-mcq="${esc(q.id)}" data-mcq-key="${esc(key)}">
                <span class="pk9-mcq-letter">${esc(key)}</span>
                <div style="flex:1;">${esc(text)}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (qType === 'truefalse') {
      const curArr = Array.isArray(ans) ? ans : [null, null, null, null];
      const letters = ['a', 'b', 'c', 'd'];
      bodyHtml = `
        <div class="pk9-tf-list">
          ${(q.statements || []).map((st, idx) => {
            const val = curArr[idx];
            const label = st.key || letters[idx] || String(idx + 1);
            return `
              <div class="pk9-tf-row">
                <div class="pk9-tf-text"><b>${esc(label)})</b> ${esc(st.text)}</div>
                <div class="pk9-tf-toggle">
                  <button type="button" class="pk9-tf-btn ${val === true ? 'active-true' : ''}" data-pick-tf="${esc(q.id)}" data-tf-idx="${idx}" data-tf-val="true">Đúng</button>
                  <button type="button" class="pk9-tf-btn ${val === false ? 'active-false' : ''}" data-pick-tf="${esc(q.id)}" data-tf-idx="${idx}" data-tf-val="false">Sai</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="pk9-short-wrap">
          <input type="text" class="pk9-short-input" data-short-q="${esc(q.id)}" placeholder="Nhập đáp số (VD: 12,5 hoặc -3)" value="${esc(ans ?? '')}" />
          <span style="font-size:0.8rem;color:var(--pk9-text-muted,#64748b);">Chấp nhận cả dấu chấm (.) và dấu phẩy (,) thập phân</span>
        </div>
      `;
    }

    const bookmarked = isQuestionBookmarked(q.id);
    return `
      <div class="pk9-q-card ${done ? 'answered' : ''}" id="pk9-q-${esc(q.id)}">
        <div class="pk9-q-header">
          <div class="pk9-q-num">
            <span>Câu ${q.number || displayIndex} (Phần ${esc(q.section || 'I')})</span>
            ${q.topic ? `<span class="pk9-q-topic-tag">📌 ${esc(q.topic)}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
            <button type="button" class="pk9-btn-exam-ghost" data-bookmark-q="${esc(q.id)}" style="padding:0.28rem 0.65rem;font-size:0.75rem;">
              ${bookmarked ? '📌 Đã lưu' : '📌 Lưu câu'}
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-flag-q="${esc(q.id)}" style="padding:0.28rem 0.65rem;font-size:0.75rem;">
              ${flagged ? '🚩 Đã đánh dấu' : '🏳️ Đánh dấu'}
            </button>
          </div>
        </div>
        <div class="pk9-q-prompt">${esc(promptText)}</div>
        ${bodyHtml}
      </div>
    `;
  }

  function renderResultView(root) {
    const ex = STATE.activeExam;
    const res = STATE.lastResult;
    if (!ex || !res) {
      STATE.view = 'catalog';
      return renderCatalogView(root);
    }

    const gradeComment = res.score >= 9
      ? '🏆 Xuất sắc! Phong độ Thủ khoa 9+!'
      : res.score >= 8
      ? '🔥 Rất tốt! Bạn đã nắm chắc kiến thức trọng tâm & vận dụng.'
      : res.score >= 6.5
      ? '💪 Khá tốt! Hãy xem kỹ lời giải các câu sai để bứt phá lên 8+.'
      : '📚 Cần củng cố thêm lý thuyết ở các chuyên đề bên dưới.';

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-result-banner">
          <div class="pk9-score-circle">
            <strong>${Number(res.score || 0).toFixed(2)}</strong>
            <span>Thang 10đ</span>
          </div>
          <div>
            <div style="font-size:0.8rem;font-weight:800;color:#38bdf8;text-transform:uppercase;margin-bottom:0.3rem;">
              KẾT QUẢ CHẤM THI TỰ ĐỘNG • ${esc(ex.source || subjLabel(ex.subject))}
            </div>
            <h3 style="font-size:1.4rem;font-weight:900;margin:0 0 0.4rem;">${esc(ex.title)}</h3>
            <p style="margin:0 0 0.75rem;color:rgba(255,255,255,0.88);font-size:0.92rem;">
              ${gradeComment} • Trả lời đúng hoàn toàn: <b>${res.correct}/${res.total} câu</b> (Điểm thô: ${res.rawScore}/${res.maxScore})
            </p>
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;">
              ${STATE.xpAwarded > 0
                ? `<span class="pk9-badge" style="background:#10b981;color:#fff;">⚡ +${STATE.xpAwarded} XP đã cộng vào BXH Tuần & Top</span>`
                : (typeof window.PK9_GET_USER === 'function' && window.PK9_GET_USER())
                ? `<span class="pk9-badge" style="background:rgba(255,255,255,0.16);color:#fff;">✓ Đã chấm điểm & lưu vào hồ sơ cá nhân</span>`
                : `<span class="pk9-badge" style="background:rgba(245,158,11,0.25);color:#fde68a;border:1px solid rgba(251,191,36,0.45);">🔒 Chế độ Khách — Điểm không tính lên BXH</span><button type="button" class="pk9-btn-exam-primary" data-open-auth="register" style="padding:0.32rem 0.75rem;font-size:0.78rem;">✨ Đăng ký lưu điểm & mở BXH</button>`}
              ${STATE.goldAwarded > 0 ? `<span class="pk9-badge" style="background:#f59e0b;color:#fff;">🪙 +${STATE.goldAwarded} Vàng</span>` : ''}
              ${STATE.diamondsAwarded > 0 ? `<span class="pk9-badge" style="background:#6366f1;color:#fff;">💎 +${STATE.diamondsAwarded} Kim cương</span>` : ''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.55rem;">
            <button type="button" class="pk9-btn-exam-primary" data-download-cert="1">
              🏅 Tải Phiếu Báo Điểm (.PNG)
            </button>
            ${(res.review || []).some(rv => rv.status !== 'correct' && !rv.correct) ? `
              <button type="button" class="pk9-btn-exam-ghost" data-practice-wrong-recent="1" style="background:rgba(239,68,68,0.22);color:#fecaca;border-color:rgba(248,113,113,0.45);">
                ❌ Ôn lại ${(res.review || []).filter(rv => rv.status !== 'correct' && !rv.correct).length} câu sai
              </button>
            ` : ''}
            <button type="button" class="pk9-btn-exam-ghost" data-retry-exam="${esc(ex.id)}" style="background:rgba(255,255,255,0.12);color:#fff;border-color:rgba(255,255,255,0.25);">
              🔄 Làm lại đề này
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-back-catalog="1" style="background:rgba(255,255,255,0.12);color:#fff;border-color:rgba(255,255,255,0.25);">
              ← Về kho luyện đề
            </button>
          </div>
        </div>

        ${Array.isArray(res.topicStats) && res.topicStats.length ? `
          <div class="pk9-topic-breakdown">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.85rem;">
              <h4 style="margin:0;font-size:1.02rem;font-weight:800;">
                📊 Phân tích năng lực theo Chuyên đề (Chẩn đoán điểm mạnh / điểm yếu)
              </h4>
              <button type="button" class="pk9-btn-exam-ghost" data-open-diagnostics="1" style="padding:0.32rem 0.7rem;font-size:0.78rem;">
                📈 Xem biểu đồ tích lũy & Gợi ý bài giảng
              </button>
            </div>
            ${res.topicStats.map(t => {
              const pct = Number(t.accuracy ?? t.percent ?? 0);
              const earned = Number(t.earnedPts ?? t.earned ?? 0).toFixed(2);
              const maxPts = Number(t.maxPts ?? t.max ?? 0).toFixed(2);
              const rec = pct < 75 ? findRecommendedLesson(subjLabel(ex.subject), t.topic) : null;
              return `
                <div class="pk9-topic-bar-row">
                  <div style="font-weight:700;color:var(--pk9-text,#0f172a);">
                    ${esc(t.topic)}
                    ${rec ? ` <button type="button" class="pk9-admin-btn-xs" data-jump-rec-course="${esc(rec.courseId)}" data-jump-rec-topic="${esc(rec.topicId)}" style="margin-left:0.35rem;">🎬 Ôn video</button>` : ''}
                  </div>
                  <div class="pk9-topic-track">
                    <div class="pk9-topic-fill" style="width:${Math.max(4, pct)}%;"></div>
                  </div>
                  <div style="font-weight:800;text-align:right;color:${pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'};">
                    ${pct}% (${earned}/${maxPts}đ)
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <div>
          <h4 style="margin:0 0 0.85rem;font-size:1.08rem;font-weight:900;">
            📝 Đáp án chuẩn & Lời giải chi tiết từng câu
          </h4>
          ${(res.review || []).map((r, idx) => {
            const isOk = r.status === 'correct' || r.correct === true;
            const isPartial = r.status === 'partial' || (!isOk && Number(r.earned || 0) > 0);
            const statusClass = isOk ? 'correct' : isPartial ? 'partial' : 'wrong';
            const statusBadge = isOk
              ? `<span class="pk9-badge" style="background:rgba(16,185,129,0.15);color:#047857;">✓ Chính xác (+${r.earned}đ)</span>`
              : isPartial
              ? `<span class="pk9-badge" style="background:rgba(245,158,11,0.16);color:#b45309;">◐ Đúng một phần (+${r.earned}đ)</span>`
              : `<span class="pk9-badge" style="background:rgba(239,68,68,0.15);color:#b91c1c;">✗ Chưa đúng (0đ)</span>`;

            let ansCompare = '';
            if (r.type === 'mcq' || r.type === 'single_choice') {
              ansCompare = `
                <div style="font-size:0.86rem;margin-top:0.5rem;">
                  Bạn chọn: <b>${esc(r.userAnswer || 'Chưa chọn')}</b> • Đáp án đúng: <b style="color:#10b981;">${esc(r.correctAnswer ?? r.answer)}</b>
                </div>
              `;
            } else if (r.type === 'short' || r.type === 'short_answer') {
              ansCompare = `
                <div style="font-size:0.86rem;margin-top:0.5rem;">
                  Bạn điền: <b>${esc(r.userAnswer !== '' && r.userAnswer !== null ? r.userAnswer : 'Chưa điền')}</b> • Đáp số chuẩn: <b style="color:#10b981;">${esc(r.correctAnswer ?? r.answer)}</b>
                </div>
              `;
            } else if (Array.isArray(r.statements)) {
              const letters = ['a', 'b', 'c', 'd'];
              ansCompare = `
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.45rem;margin-top:0.6rem;">
                  ${r.statements.map((st, sIdx) => `
                    <div style="padding:0.45rem 0.7rem;border-radius:0.65rem;background:var(--pk9-surface-2,#f8fafc);border:1px solid ${st.correct ? '#10b981' : '#fca5a5'};font-size:0.81rem;">
                      <b>Ý ${letters[sIdx]}):</b> Bạn chọn <b>${st.user === true ? 'Đúng' : st.user === false ? 'Sai' : 'Trống'}</b>
                      → Chuẩn: <b style="color:#10b981;">${st.answer ? 'Đúng' : 'Sai'}</b>
                    </div>
                  `).join('')}
                </div>
              `;
            }

            return `
              <div class="pk9-review-card ${statusClass}">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.45rem;flex-wrap:wrap;">
                  <div style="font-weight:800;color:#2563eb;">
                    Câu ${r.number || idx + 1} (Phần ${esc(r.section || 'I')}) ${r.topic ? `• <span style="color:var(--pk9-text-muted,#64748b);font-weight:600;">${esc(r.topic)}</span>` : ''}
                  </div>
                  <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
                    ${statusBadge}
                    ${!isOk ? `<button type="button" class="pk9-admin-btn-xs" data-ask-ai-question="${esc(`Giải thích chi tiết từng bước câu ${subjLabel(ex.subject)} (${r.topic || ''}) sau đây và chỉ rõ vì sao đáp án đúng lại như vậy:\n${r.text || r.prompt || ''}`)}">🤖 Nhờ AI giải</button>` : ''}
                  </div>
                </div>
                <div style="font-size:0.93rem;line-height:1.6;white-space:pre-line;">${esc(r.text || r.prompt || '')}</div>
                ${ansCompare}
                ${r.explanation ? `
                  <div class="pk9-exp-box">
                    <b>💡 Lời giải & Phân tích chi tiết:</b><br/>
                    <span style="white-space:pre-line;">${esc(r.explanation)}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    typesetMath(root);
  }

  function updateTakingProgressUI() {
    if (!STATE.activeExam) return;
    const questions = STATE.activeExam.questions || [];
    const answeredCount = questions.filter(q => isQuestionAnswered(q, STATE.answers[q.id])).length;
    const progEl = document.getElementById('pk9-exam-progress-text');
    if (progEl) progEl.textContent = `${answeredCount}/${questions.length}`;
    const drawerProgEl = document.getElementById('pk9-drawer-progress-text');
    if (drawerProgEl) drawerProgEl.textContent = `${answeredCount}/${questions.length}`;

    ['pk9-palette-grid', 'pk9-palette-drawer-grid'].forEach(gridId => {
      const palette = document.getElementById(gridId);
      if (palette) {
        palette.querySelectorAll('[data-jump-q]').forEach(btn => {
          const qId = btn.getAttribute('data-jump-q');
          const qObj = questions.find(x => x.id === qId);
          if (qObj) {
            btn.classList.toggle('answered', isQuestionAnswered(qObj, STATE.answers[qId]));
            btn.classList.toggle('flagged', Boolean(STATE.flagged[qId]));
          }
        });
      }
    });
  }

  function renderExamCenter() {
    const root = document.getElementById('exam-center-root');
    if (!root) return;
    if (STATE.view === 'taking' && STATE.activeExam) {
      renderTakingView(root);
    } else if (STATE.view === 'result' && STATE.lastResult) {
      renderResultView(root);
    } else {
      renderCatalogView(root);
    }
  }

  function bindExamEvents() {
    document.addEventListener('click', e => {
      const subjBtn = e.target.closest('[data-exam-subj]');
      if (subjBtn) {
        STATE.subjectFilter = subjBtn.getAttribute('data-exam-subj') || 'ALL';
        STATE.view = 'catalog';
        renderExamCenter();
        return;
      }

      const statusBtn = e.target.closest('[data-exam-status]');
      if (statusBtn) {
        STATE.statusFilter = statusBtn.getAttribute('data-exam-status') || 'ALL';
        STATE.view = 'catalog';
        updateCatalogDynamicDOM();
        return;
      }

      const paperBtn = e.target.closest('[data-paper-theme]');
      if (paperBtn) {
        syncPaperTheme(paperBtn.getAttribute('data-paper-theme'));
        return;
      }

      const bookmarkBtn = e.target.closest('[data-bookmark-q]');
      if (bookmarkBtn) {
        toggleQuestionBookmark(bookmarkBtn.getAttribute('data-bookmark-q'), bookmarkBtn);
        return;
      }

      const viewBtn = e.target.closest('[data-exam-view]');
      if (viewBtn) {
        const nextView = viewBtn.getAttribute('data-exam-view') || 'sources';
        STATE.view = STATE.view === nextView ? 'catalog' : nextView;
        renderExamCenter();
        return;
      }

      const startBtn = e.target.closest('[data-start-exam]');
      if (startBtn) {
        startExamById(startBtn.getAttribute('data-start-exam'), false);
        return;
      }

      const splitBtn = e.target.closest('[data-start-split]');
      if (splitBtn) {
        startExamById(splitBtn.getAttribute('data-start-split'), true);
        return;
      }

      const toggleSplit = e.target.closest('[data-toggle-split-pdf]');
      if (toggleSplit) {
        STATE.splitPdf = !STATE.splitPdf;
        renderExamCenter();
        return;
      }

      const togglePaletteBtn = e.target.closest('[data-toggle-palette-drawer]');
      if (togglePaletteBtn) {
        STATE.paletteDrawerOpen = !STATE.paletteDrawerOpen;
        const drawer = document.getElementById('pk9-exam-palette-drawer');
        if (drawer) drawer.classList.toggle('open', STATE.paletteDrawerOpen);
        return;
      }

      const closePaletteBtn = e.target.closest('[data-close-palette-drawer]');
      if (closePaletteBtn) {
        STATE.paletteDrawerOpen = false;
        const drawer = document.getElementById('pk9-exam-palette-drawer');
        if (drawer) drawer.classList.remove('open');
        return;
      }

      const toggleSingleQBtn = e.target.closest('[data-toggle-single-q]');
      if (toggleSingleQBtn) {
        STATE.focusSingleQ = !STATE.focusSingleQ;
        STATE.paletteDrawerOpen = false;
        saveDraftDebounced();
        renderExamCenter();
        return;
      }

      const stepQBtn = e.target.closest('[data-step-q]');
      if (stepQBtn && STATE.activeExam) {
        const delta = Number(stepQBtn.getAttribute('data-step-q') || 0);
        const qs = STATE.activeExam.questions || [];
        let minIdx = 0;
        let maxIdx = Math.max(0, qs.length - 1);
        if (STATE.sectionLockMode && STATE.sectionsPlan.length) {
          const activeSec = STATE.sectionsPlan[STATE.activeSectionIdx];
          const secIndices = [];
          qs.forEach((q, idx) => {
            if (activeSec && String(q.section || 'I') === String(activeSec.id)) secIndices.push(idx);
          });
          if (secIndices.length) {
            minIdx = secIndices[0];
            maxIdx = secIndices[secIndices.length - 1];
          }
        }
        STATE.currentQIdx = Math.max(minIdx, Math.min(maxIdx, (STATE.currentQIdx || minIdx) + delta));
        saveDraftDebounced();
        renderExamCenter();
        return;
      }

      const pickMcq = e.target.closest('[data-pick-mcq]');
      if (pickMcq) {
        const qId = pickMcq.getAttribute('data-pick-mcq');
        const key = pickMcq.getAttribute('data-mcq-key');
        STATE.answers[qId] = key;
        saveDraftDebounced();
        const card = document.getElementById(`pk9-q-${qId}`);
        if (card) {
          card.classList.add('answered');
          card.querySelectorAll('[data-pick-mcq]').forEach(el => {
            el.classList.toggle('selected', el.getAttribute('data-mcq-key') === key);
          });
        }
        updateTakingProgressUI();
        return;
      }

      const pickTf = e.target.closest('[data-pick-tf]');
      if (pickTf) {
        const qId = pickTf.getAttribute('data-pick-tf');
        const tfIdx = Number(pickTf.getAttribute('data-tf-idx'));
        const tfVal = pickTf.getAttribute('data-tf-val') === 'true';
        if (!Array.isArray(STATE.answers[qId])) {
          STATE.answers[qId] = [null, null, null, null];
        }
        STATE.answers[qId][tfIdx] = tfVal;
        saveDraftDebounced();
        const row = pickTf.closest('.pk9-tf-row');
        if (row) {
          row.querySelectorAll('[data-pick-tf]').forEach(btn => {
            const isTrueBtn = btn.getAttribute('data-tf-val') === 'true';
            btn.classList.toggle('active-true', isTrueBtn && tfVal === true);
            btn.classList.toggle('active-false', !isTrueBtn && tfVal === false);
          });
        }
        const card = document.getElementById(`pk9-q-${qId}`);
        if (card) card.classList.add('answered');
        updateTakingProgressUI();
        return;
      }

      const flagBtn = e.target.closest('[data-flag-q]');
      if (flagBtn) {
        const qId = flagBtn.getAttribute('data-flag-q');
        STATE.flagged[qId] = !STATE.flagged[qId];
        flagBtn.textContent = STATE.flagged[qId] ? '🚩 Đã đánh dấu' : '🏳️ Đánh dấu';
        saveDraftDebounced();
        updateTakingProgressUI();
        return;
      }

      const jumpBtn = e.target.closest('[data-jump-q]');
      if (jumpBtn) {
        const qId = jumpBtn.getAttribute('data-jump-q');
        const qIdx = Number(jumpBtn.getAttribute('data-jump-idx'));
        if (Number.isFinite(qIdx) && qIdx >= 0) {
          STATE.currentQIdx = qIdx;
        } else if (STATE.activeExam?.questions) {
          const foundIdx = STATE.activeExam.questions.findIndex(x => x.id === qId);
          if (foundIdx >= 0) STATE.currentQIdx = foundIdx;
        }
        STATE.paletteDrawerOpen = false;
        const drawer = document.getElementById('pk9-exam-palette-drawer');
        if (drawer) drawer.classList.remove('open');
        if (STATE.focusSingleQ) {
          saveDraftDebounced();
          renderExamCenter();
          return;
        }
        const target = document.getElementById(`pk9-q-${qId}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const submitBtn = e.target.closest('[data-submit-exam]');
      if (submitBtn) {
        STATE.paletteDrawerOpen = false;
        submitActiveExam(false);
        return;
      }

      const exitBtn = e.target.closest('[data-exit-exam]');
      if (exitBtn) {
        persistLocalDraftNow();
        stopTimer();
        window.PK9_EXAM_TOOLS?.closeCalc?.();
        window.PK9_EXAM_TOOLS?.closeScratchpad?.();
        STATE.paletteDrawerOpen = false;
        STATE.view = 'catalog';
        renderExamCenter();
        if (window.PK9_TOAST) {
          window.PK9_TOAST('Đã lưu tự động tiến độ & thời gian làm bài để bạn tiếp tục sau!', 'info');
        }
        return;
      }

      if (e.target.closest('[data-exam-tool-calc]')) {
        window.PK9_EXAM_TOOLS?.toggleCalc?.();
        return;
      }
      const padBtn = e.target.closest('[data-exam-tool-pad]');
      if (padBtn) {
        window.PK9_EXAM_TOOLS?.toggleScratchpad?.(padBtn.getAttribute('data-exam-tool-pad') || 'default');
        return;
      }
      if (e.target.closest('[data-toggle-section-lock]')) {
        if (!STATE.sectionsPlan.length && STATE.activeExam) {
          STATE.sectionsPlan = computeExamSectionsPlan(STATE.activeExam);
        }
        STATE.sectionLockMode = !STATE.sectionLockMode;
        if (STATE.sectionLockMode && STATE.sectionsPlan.length) {
          STATE.activeSectionIdx = 0;
          STATE.sectionRemainingSec = STATE.sectionsPlan[0].durationSec;
          if (window.PK9_TOAST) window.PK9_TOAST('🔒 Đã bật chế độ ĐGNL khóa giờ từng phần!', 'info');
        }
        renderExamCenter();
        return;
      }
      if (e.target.closest('[data-advance-section]')) {
        advanceLockedSection(false);
        return;
      }
      if (e.target.closest('[data-download-cert]') && STATE.activeExam && STATE.lastResult) {
        const u = window.PK9_GET_USER ? window.PK9_GET_USER() : null;
        const rpg = window.PK9_RPG_STATE || {};
        window.PK9_EXAM_TOOLS?.downloadCertificate?.({
          studentName: u?.display_name || u?.username || 'Học Viên Phúc K9',
          sbd: rpg.sbd || 'K9-GUEST',
          subject: subjLabel(STATE.activeExam.subject),
          examId: STATE.activeExam.id,
          examTitle: STATE.activeExam.title,
          score: STATE.lastResult.score,
          rawScore: STATE.lastResult.rawScore,
          maxScore: STATE.lastResult.maxScore,
          correct: STATE.lastResult.correct,
          total: STATE.lastResult.total,
          topicStats: STATE.lastResult.topicStats
        });
        return;
      }
      if (e.target.closest('[data-open-diagnostics]')) {
        STATE.view = 'diagnostics';
        renderExamCenter();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (e.target.closest('[data-practice-wrong-all]')) {
        const list = getWrongBankList().filter(it => STATE.subjectFilter === 'ALL' || subjLabel(it.subject) === STATE.subjectFilter);
        startWrongPracticeExam(list);
        return;
      }
      if (e.target.closest('[data-practice-wrong-recent]') && STATE.activeExam && STATE.lastResult) {
        const wrongIds = new Set((STATE.lastResult.review || []).filter(r => r.status !== 'correct' && !r.correct).map(r => String(r.id)));
        const items = (STATE.activeExam.questions || []).filter(q => wrongIds.has(String(q.id))).map(q => ({
          ...q,
          subject: subjLabel(STATE.activeExam.subject)
        }));
        startWrongPracticeExam(items);
        return;
      }
      const resolveBtn = e.target.closest('[data-resolve-wrong]');
      if (resolveBtn) {
        resolveWrongItem(resolveBtn.getAttribute('data-resolve-wrong'), true, false);
        return;
      }
      const recCourseBtn = e.target.closest('[data-jump-rec-course]');
      if (recCourseBtn && typeof window.switchTab === 'function') {
        window.switchTab('lectures', {
          courseId: recCourseBtn.getAttribute('data-jump-rec-course'),
          topicId: recCourseBtn.getAttribute('data-jump-rec-topic')
        });
        return;
      }
      const askAiBtn = e.target.closest('[data-ask-ai-question]');
      if (askAiBtn && typeof window.PK9_ASK_AI === 'function') {
        window.PK9_ASK_AI(askAiBtn.getAttribute('data-ask-ai-question') || '');
        return;
      }
      const startContestBtn = e.target.closest('[data-start-contest]');
      if (startContestBtn) {
        const cid = startContestBtn.getAttribute('data-start-contest');
        const exId = startContestBtn.getAttribute('data-contest-exam');
        startExamById(exId, false, cid);
        return;
      }
      const openContestLbBtn = e.target.closest('[data-open-contest-lb]');
      if (openContestLbBtn) {
        const cid = openContestLbBtn.getAttribute('data-open-contest-lb');
        fetch(`/api/exams?action=contest-lb&id=${encodeURIComponent(cid)}`, { credentials: 'include' })
          .then(r => r.json())
          .then(d => {
            if (d?.ok) {
              STATE.contestLbData = d;
              renderExamCenter();
            }
          })
          .catch(() => {});
        return;
      }
      if (e.target.closest('[data-close-contest-lb]')) {
        STATE.contestLbData = null;
        renderExamCenter();
        return;
      }
      const duelSubjBtn = e.target.closest('[data-duel-subj]');
      if (duelSubjBtn) {
        STATE.duelSubject = duelSubjBtn.getAttribute('data-duel-subj') || 'Tất cả';
        updateCatalogDynamicDOM();
        return;
      }
      const duelCountBtn = e.target.closest('[data-duel-count]');
      if (duelCountBtn) {
        STATE.duelCount = Number(duelCountBtn.getAttribute('data-duel-count') || 5);
        updateCatalogDynamicDOM();
        return;
      }
      if (e.target.closest('[data-duel-create]')) {
        const u = window.PK9_GET_USER ? window.PK9_GET_USER() : null;
        if (!u) {
          if (typeof window.PK9_OPEN_AUTH === 'function') window.PK9_OPEN_AUTH('login');
          return;
        }
        fetch('/api/exams?action=duel-create', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({ subject: STATE.duelSubject, count: STATE.duelCount })
        })
          .then(r => r.json())
          .then(d => {
            if (d?.ok && d.room) {
              STATE.duelRoom = d.room;
              STATE.duelAnswers = {};
              STATE.duelElapsedSec = 0;
              STATE.duelLastReward = null;
              STATE.duelStage = 'playing';
              updateCatalogDynamicDOM();
              startDuelTimers();
              loadArenaLobbyData();
              if (window.PK9_TOAST) window.PK9_TOAST(`⚔️ Đã tạo phòng đấu ${d.code}! Gửi link cho bạn bè cùng thi!`, 'success');
            } else if (window.PK9_TOAST) {
              window.PK9_TOAST(d?.message || 'Không tạo được phòng đấu.', 'error');
            }
          })
          .catch(() => {});
        return;
      }
      const duelJoinBtn = e.target.closest('[data-duel-join-code]');
      if (duelJoinBtn) {
        joinDuelRoomClient(duelJoinBtn.getAttribute('data-duel-join-code'));
        return;
      }
      const duelPick = e.target.closest('[data-duel-pick]');
      if (duelPick && STATE.duelRoom) {
        const qId = duelPick.getAttribute('data-duel-pick');
        const oIdx = Number(duelPick.getAttribute('data-duel-opt'));
        STATE.duelAnswers[qId] = oIdx;
        updateCatalogDynamicDOM();
        return;
      }
      if (e.target.closest('[data-duel-submit]') && STATE.duelRoom) {
        fetch('/api/exams?action=duel-submit', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
          body: JSON.stringify({ code: STATE.duelRoom.code, answers: STATE.duelAnswers, time_sec: STATE.duelElapsedSec })
        })
          .then(r => r.json())
          .then(d => {
            if (d?.ok && d.room) {
              STATE.duelRoom = d.room;
              STATE.duelLastReward = d.reward || null;
              STATE.duelStage = 'result';
              if (d.rpg && typeof window.PK9_APPLY_RPG_UPDATE === 'function') {
                window.PK9_APPLY_RPG_UPDATE(d.rpg, { xp: d.xp, weekly_xp: d.weekly_xp });
              }
              updateCatalogDynamicDOM();
              startDuelTimers();
              loadArenaLobbyData();
            } else if (window.PK9_TOAST) {
              window.PK9_TOAST(d?.message || 'Không nộp được bài đấu.', 'error');
            }
          })
          .catch(() => {});
        return;
      }
      if (e.target.closest('[data-duel-back-lobby]')) {
        stopDuelTimers();
        STATE.duelRoom = null;
        STATE.duelStage = 'lobby';
        STATE.duelLastReward = null;
        updateCatalogDynamicDOM();
        loadArenaLobbyData();
        return;
      }
      const copyDuelBtn = e.target.closest('[data-copy-duel-link]');
      if (copyDuelBtn) {
        const u = copyDuelBtn.getAttribute('data-copy-duel-link') || '';
        try { navigator.clipboard?.writeText(u); } catch {}
        if (window.PK9_TOAST) window.PK9_TOAST(`📋 Đã chép link phòng thách đấu: ${u}`, 'success');
        return;
      }

      const retryBtn = e.target.closest('[data-retry-exam]');
      if (retryBtn) {
        const exId = retryBtn.getAttribute('data-retry-exam');
        try { localStorage.removeItem(`pk9_exam_draft_${exId}`); } catch {}
        startExamById(exId, false);
        return;
      }

      const backBtn = e.target.closest('[data-back-catalog]');
      if (backBtn) {
        STATE.view = 'catalog';
        renderExamCenter();
        return;
      }
    });

    document.addEventListener('input', e => {
      if (e.target && e.target.id === 'pk9-exam-search-input') {
        STATE.searchQuery = e.target.value || '';
        updateCatalogDynamicDOM();
        return;
      }

      const shortInput = e.target.closest('[data-short-q]');
      if (shortInput) {
        const qId = shortInput.getAttribute('data-short-q');
        STATE.answers[qId] = shortInput.value;
        saveDraftDebounced();
        const card = document.getElementById(`pk9-q-${qId}`);
        if (card) card.classList.toggle('answered', shortInput.value.trim() !== '');
        updateTakingProgressUI();
      }
    });

    window.addEventListener('beforeunload', () => {
      if (STATE.view === 'taking' && STATE.activeExam) {
        persistLocalDraftNow();
      }
    });

    document.addEventListener('submit', e => {
      if (e.target && e.target.id === 'pk9-duel-join-form') {
        e.preventDefault();
        const code = document.getElementById('pk9-duel-code-input')?.value || '';
        joinDuelRoomClient(code);
      }
    });
  }

  async function joinDuelRoomClient(codeRaw) {
    const code = String(codeRaw || '').trim().toUpperCase();
    if (!code) return;
    const u = window.PK9_GET_USER ? window.PK9_GET_USER() : null;
    if (!u) {
      if (typeof window.PK9_OPEN_AUTH === 'function') window.PK9_OPEN_AUTH('login');
      if (window.PK9_TOAST) window.PK9_TOAST('🔑 Hãy đăng nhập để vào phòng thách đấu 1v1!', 'info');
      return;
    }
    try {
      const resp = await fetch('/api/exams?action=duel-join', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ code })
      });
      const d = await resp.json().catch(() => ({}));
      if (resp.ok && d?.ok && d.room) {
        STATE.view = 'arena';
        STATE.duelRoom = d.room;
        STATE.duelAnswers = {};
        STATE.duelElapsedSec = 0;
        STATE.duelLastReward = null;
        const myRow = (d.room.players || []).find(p => String(p.username).toLowerCase() === String(u.username || '').toLowerCase());
        STATE.duelStage = myRow?.status === 'submitted' ? 'result' : 'playing';
        renderExamCenter();
        startDuelTimers();
        loadArenaLobbyData();
      } else if (window.PK9_TOAST) {
        window.PK9_TOAST(d?.message || 'Không vào được phòng đấu.', 'error');
      }
    } catch {}
  }

  async function initExamCenter() {
    await loadExamCatalog();
    renderExamCenter();
  }

  window.PK9_EXAM_CENTER = {
    init: initExamCenter,
    render: renderExamCenter,
    startExamById,
    openDuelByCode(code) {
      STATE.view = 'arena';
      renderExamCenter();
      if (code) joinDuelRoomClient(code);
    },
    openWrongBank() {
      STATE.view = 'wrong-bank';
      renderExamCenter();
    },
    openArena() {
      STATE.view = 'arena';
      renderExamCenter();
      loadArenaLobbyData();
    },
    loadArenaLobbyData,
    getStats() {
      const sourcesList = Array.isArray(window.PK9_EXAM_SOURCES) ? window.PK9_EXAM_SOURCES : [];
      const refDocs = Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27 : [];
      const interactiveCount = STATE.exams.length || (Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS.length : 0);
      return {
        interactiveCount,
        sourceCount: sourcesList.length + refDocs.length
      };
    },
    isTakingExam() {
      return STATE.view === 'taking' && Boolean(STATE.activeExam);
    },
    persistDraft: persistLocalDraftNow,
    async reloadCatalog() {
      await loadExamCatalog();
      renderExamCenter();
    },
    filterBySubject(sub) {
      STATE.subjectFilter = sub || 'ALL';
      STATE.view = 'catalog';
      renderExamCenter();
    }
  };

  bindExamEvents();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initExamCenter);
  } else {
    initExamCenter();
  }
})(window, document);
