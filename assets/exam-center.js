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
    view: 'catalog', // 'catalog' | 'sources' | 'taking' | 'result'
    subjectFilter: 'ALL',
    searchQuery: '',
    exams: [],
    activeExam: null,
    attemptId: null,
    answers: {},
    flagged: {},
    splitPdf: false,
    startedAt: 0,
    remainingSec: 0,
    timerId: null,
    lastResult: null,
    xpAwarded: 0
  };

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function getCsrfToken() {
    const m = document.cookie.match(/(?:^|;\s*)phuc_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : (window.PK9_AUTH?.csrf || '');
  }

  function typesetMath(el) {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise(el ? [el] : undefined).catch(() => {});
    }
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

  function startTimer() {
    stopTimer();
    STATE.timerId = setInterval(() => {
      if (STATE.view !== 'taking') {
        stopTimer();
        return;
      }
      STATE.remainingSec = Math.max(0, STATE.remainingSec - 1);
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

  async function startExamById(examId, openSplitPdf = false) {
    let fullExam = findFullSeedExam(examId);
    let attemptId = `local-${examId}-${Date.now()}`;

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

    let savedAnswers = {};
    try {
      const rawDraft = localStorage.getItem(`pk9_exam_draft_${examId}`);
      if (rawDraft) savedAnswers = JSON.parse(rawDraft) || {};
    } catch {}

    const pdfPath = fullExam.sourceFile || fullExam.pdfUrl || '';
    STATE.activeExam = fullExam;
    STATE.attemptId = attemptId;
    STATE.answers = savedAnswers;
    STATE.flagged = {};
    STATE.splitPdf = Boolean(openSplitPdf && pdfPath);
    STATE.startedAt = Date.now();
    STATE.remainingSec = Number(fullExam.duration || fullExam.durationMinutes || 50) * 60;
    STATE.view = 'taking';
    renderExamCenter();
    startTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function saveDraftDebounced() {
    if (!STATE.activeExam) return;
    try {
      localStorage.setItem(`pk9_exam_draft_${STATE.activeExam.id}`, JSON.stringify(STATE.answers));
    } catch {}
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
    const seedExam = findFullSeedExam(STATE.activeExam.id) || STATE.activeExam;
    let graded = gradeExamLocally(seedExam, STATE.answers);
    let xpEarned = 0;

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
          answers: STATE.answers
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.ok && data.result) {
          graded = data.result;
        }
      }
    } catch {}

    // Record to dashboard & leaderboard
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
          total_questions: graded.total
        })
      });
      if (recResp.ok) {
        const recData = await recResp.json();
        xpEarned = Number(recData?.xp_earned || 0);
        if (typeof window.PK9_REFRESH_AUTH_AND_LEADERBOARD === 'function') {
          window.PK9_REFRESH_AUTH_AND_LEADERBOARD();
        }
      }
    } catch {}

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
    STATE.view = 'result';
    renderExamCenter();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.PK9_TOAST) {
      window.PK9_TOAST(`Đã chấm bài hoàn tất: ${Number(graded.score || 0).toFixed(2)}/10 điểm!${xpEarned ? ` (+${xpEarned} XP vào BXH)` : ''}`, 'success');
    }
  }

  function renderCatalogView(root) {
    const subjects = ['ALL', 'Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Lịch sử', 'ĐGNL'];
    const q = STATE.searchQuery.trim().toLowerCase();
    const filtered = STATE.exams.filter(ex => {
      const sName = subjLabel(ex.subject);
      if (STATE.subjectFilter !== 'ALL' && sName !== STATE.subjectFilter) return false;
      if (!q) return true;
      return `${ex.title} ${sName} ${ex.source || ex.sourceOrg || ''} ${ex.periodLabel || ''}`.toLowerCase().includes(q);
    });

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
                Tích hợp đề thi thật từ các Sở GD&ĐT (Lâm Đồng, Điện Biên, Hà Nội, Nghệ An...), THPT Ngô Gia Tự, Bộ GD&ĐT và ĐGNL HSA/V-ACT. Hệ thống chấm chuẩn 3 phần (Trắc nghiệm ABCD • Đúng/Sai lũy tiến 0.1→1.0đ • Trả lời ngắn), phân tích điểm yếu theo chuyên đề và cộng XP trực tiếp vào <b>BXH Hàng Tuần & BXH Top Học Viên</b>.
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

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            ${subjects.map(sub => `
              <button type="button" class="pk9-exam-chip ${STATE.subjectFilter === sub && STATE.view === 'catalog' ? 'active' : ''}" data-exam-subj="${esc(sub)}">
                ${sub === 'ALL' ? '🔥 Tất cả môn' : esc(sub)}
              </button>
            `).join('')}
            <button type="button" class="pk9-exam-chip ${STATE.view === 'sources' ? 'active' : ''}" data-exam-view="sources">
              📚 Kho Đề Gốc Sở / Bộ (${sourcesList.length + refDocs.length})
            </button>
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-exam-search-input" placeholder="Tìm tên đề, Sở GD&ĐT, mã đề..." value="${esc(STATE.searchQuery)}" />
          </div>
        </div>

        ${STATE.view === 'sources' ? renderVerifiedSourcesSection(sourcesList, refDocs, q) : `
          <div class="pk9-exam-grid">
            ${filtered.map(ex => {
              const qCount = ex.questionCount || (ex.questions ? ex.questions.length : 22);
              const sName = subjLabel(ex.subject);
              const pdfPath = ex.sourceFile || ex.pdfUrl || '';
              const duration = ex.duration || ex.durationMinutes || 50;
              return `
                <article class="pk9-exam-card">
                  <div>
                    <div class="pk9-exam-card-badges">
                      <span class="pk9-badge pk9-badge-subj">📘 ${esc(sName)} • Khối ${esc(ex.grade || '12')}</span>
                      <span class="pk9-badge pk9-badge-verified">✓ Nguồn thật đã kiểm duyệt</span>
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
                      ⚡ Vào phòng thi & Chấm điểm
                    </button>
                    ${pdfPath ? `
                      <button type="button" class="pk9-btn-exam-ghost" data-start-split="${esc(ex.id)}" title="Làm bài song song với file PDF gốc">
                        📄 Thi kèm PDF
                      </button>
                    ` : ''}
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        `}
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
              <a href="${esc(item.url)}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost">
                🔗 Mở nguồn đề gốc ↗
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

    const p1 = questions.filter(q => normalizeQuestionType(q) === 'mcq');
    const p2 = questions.filter(q => normalizeQuestionType(q) === 'truefalse');
    const p3 = questions.filter(q => normalizeQuestionType(q) === 'short');

    root.innerHTML = `
      <div class="pk9-exam-room">
        <div class="pk9-exam-sticky-bar">
          <div>
            <div style="font-size:0.76rem;font-weight:800;color:#2563eb;text-transform:uppercase;">
              🏛️ ${esc(ex.source || ex.sourceOrg || 'Đề thi chính thức')} • ${esc(subjLabel(ex.subject))}
            </div>
            <div style="font-size:1.02rem;font-weight:900;color:var(--pk9-text,#0f172a);">
              ${esc(ex.title)}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.65rem;flex-wrap:wrap;">
            <span class="pk9-timer-pill" id="pk9-exam-timer">⏱ ${formatClock(STATE.remainingSec)}</span>
            <span style="font-size:0.84rem;font-weight:800;padding:0.45rem 0.85rem;border-radius:999px;background:var(--pk9-surface-2,#f1f5f9);">
              Đã làm: <b id="pk9-exam-progress-text">${answeredCount}/${questions.length}</b>
            </span>
            ${pdfPath ? `
              <button type="button" class="pk9-btn-exam-ghost" data-toggle-split-pdf="1">
                ${STATE.splitPdf ? '📐 Ẩn khung PDF' : '📄 Mở khung PDF gốc'}
              </button>
            ` : ''}
            <button type="button" class="pk9-btn-exam-primary" data-submit-exam="1">
              ✅ Nộp bài & Chấm điểm
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-exit-exam="1">
              ✕ Thoát
            </button>
          </div>
        </div>

        <div class="pk9-exam-workspace ${STATE.splitPdf && pdfPath ? 'with-pdf' : ''}">
          ${STATE.splitPdf && pdfPath ? `
            <div class="pk9-exam-pdf-pane">
              <div style="padding:0.65rem 1rem;background:#0f172a;color:#fff;font-size:0.8rem;font-weight:700;display:flex;justify-content:space-between;align-items:center;">
                <span>📄 Đề gốc đối chiếu (${esc(ex.source || '')})</span>
                <a href="${esc(pdfPath)}" target="_blank" rel="noopener" style="color:#38bdf8;text-decoration:none;">Mở tab mới ↗</a>
              </div>
              <iframe src="${esc(pdfPath)}" title="Đề PDF gốc"></iframe>
            </div>
          ` : ''}

          <div class="pk9-exam-questions-col">
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
          </div>

          ${!(STATE.splitPdf && pdfPath) ? `
            <aside class="pk9-exam-palette">
              <div style="font-weight:800;font-size:0.92rem;color:var(--pk9-text,#0f172a);">
                🧭 Bản đồ câu hỏi
              </div>
              <div style="font-size:0.76rem;color:var(--pk9-text-muted,#64748b);margin-top:0.2rem;">
                Nhấn vào số câu để cuộn nhanh tới câu hỏi đó.
              </div>
              <div class="pk9-palette-grid" id="pk9-palette-grid">
                ${questions.map((q, idx) => {
                  const done = isQuestionAnswered(q, STATE.answers[q.id]);
                  const flag = Boolean(STATE.flagged[q.id]);
                  return `
                    <button type="button" class="pk9-palette-btn ${done ? 'answered' : ''} ${flag ? 'flagged' : ''}" data-jump-q="${esc(q.id)}">
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

    return `
      <div class="pk9-q-card ${done ? 'answered' : ''}" id="pk9-q-${esc(q.id)}">
        <div class="pk9-q-header">
          <div class="pk9-q-num">
            <span>Câu ${q.number || displayIndex} (Phần ${esc(q.section || 'I')})</span>
            ${q.topic ? `<span class="pk9-q-topic-tag">📌 ${esc(q.topic)}</span>` : ''}
          </div>
          <button type="button" class="pk9-btn-exam-ghost" data-flag-q="${esc(q.id)}" style="padding:0.28rem 0.65rem;font-size:0.75rem;">
            ${flagged ? '🚩 Đã đánh dấu' : '🏳️ Đánh dấu'}
          </button>
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
            <div style="display:flex;flex-wrap:wrap;gap:0.5rem;">
              ${STATE.xpAwarded > 0 ? `<span class="pk9-badge" style="background:#10b981;color:#fff;">⚡ +${STATE.xpAwarded} XP đã cộng vào BXH Tuần & Top</span>` : `<span class="pk9-badge" style="background:rgba(255,255,255,0.16);color:#fff;">💡 Đăng nhập tài khoản để lưu điểm lên BXH Tuần & Top</span>`}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.55rem;">
            <button type="button" class="pk9-btn-exam-primary" data-retry-exam="${esc(ex.id)}">
              🔄 Làm lại đề này
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-back-catalog="1" style="background:rgba(255,255,255,0.12);color:#fff;border-color:rgba(255,255,255,0.25);">
              ← Về kho luyện đề
            </button>
          </div>
        </div>

        ${Array.isArray(res.topicStats) && res.topicStats.length ? `
          <div class="pk9-topic-breakdown">
            <h4 style="margin:0 0 0.85rem;font-size:1.02rem;font-weight:800;">
              📊 Phân tích năng lực theo Chuyên đề (Chẩn đoán điểm mạnh / điểm yếu)
            </h4>
            ${res.topicStats.map(t => {
              const pct = Number(t.accuracy ?? t.percent ?? 0);
              const earned = Number(t.earnedPts ?? t.earned ?? 0).toFixed(2);
              const maxPts = Number(t.maxPts ?? t.max ?? 0).toFixed(2);
              return `
                <div class="pk9-topic-bar-row">
                  <div style="font-weight:700;color:var(--pk9-text,#0f172a);">${esc(t.topic)}</div>
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
                <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.45rem;">
                  <div style="font-weight:800;color:#2563eb;">
                    Câu ${r.number || idx + 1} (Phần ${esc(r.section || 'I')}) ${r.topic ? `• <span style="color:var(--pk9-text-muted,#64748b);font-weight:600;">${esc(r.topic)}</span>` : ''}
                  </div>
                  ${statusBadge}
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
    const palette = document.getElementById('pk9-palette-grid');
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
        if (STATE.view !== 'sources') STATE.view = 'catalog';
        renderExamCenter();
        return;
      }

      const viewBtn = e.target.closest('[data-exam-view]');
      if (viewBtn) {
        STATE.view = STATE.view === 'sources' ? 'catalog' : 'sources';
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
        updateTakingProgressUI();
        return;
      }

      const jumpBtn = e.target.closest('[data-jump-q]');
      if (jumpBtn) {
        const qId = jumpBtn.getAttribute('data-jump-q');
        const target = document.getElementById(`pk9-q-${qId}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const submitBtn = e.target.closest('[data-submit-exam]');
      if (submitBtn) {
        submitActiveExam(false);
        return;
      }

      const exitBtn = e.target.closest('[data-exit-exam]');
      if (exitBtn) {
        stopTimer();
        STATE.view = 'catalog';
        renderExamCenter();
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
        renderExamCenter();
        const input = document.getElementById('pk9-exam-search-input');
        if (input) {
          input.focus();
          input.setSelectionRange(input.value.length, input.value.length);
        }
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
  }

  async function initExamCenter() {
    await loadExamCatalog();
    renderExamCenter();
  }

  window.PK9_EXAM_CENTER = {
    init: initExamCenter,
    render: renderExamCenter,
    startExamById,
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
