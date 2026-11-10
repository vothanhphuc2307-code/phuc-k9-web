/* ============================================================================
 * HỌC CÙNG PHÚC K9 — CORE ECOSYSTEM APPLICATION CONTROLLER (PC & MOBILE)
 * ============================================================================ */
(function (window, document) {
  'use strict';

  const APP = {
    activeTab: 'home',
    gradeFilter: '2K9', // '2K9' | '2K11' | '2K12' | 'ALL'
    activeCourseId: 'math12',
    activeTopicId: 'M12-1.1',
    studySubtab: 'theory', // 'theory' | 'types' | 'quiz' | 'notes'
    theaterMode: false,
    lectureSearch: '',
    quizAnswers: {},
    lbMode: 'weekly', // 'weekly' | 'top' | 'exam'
    lbSearch: '',
    lbData: {
      week_key: '',
      leaderboard: [],
      weekly_leaderboard: [],
      exam_leaderboard: [],
      my_rank: null
    },
    docSearch: '',
    docSubject: 'ALL',
    fcDeckIdx: 0,
    fcCardIdx: 0,
    fcFlipped: false,
    pomoSec: 25 * 60,
    pomoRunning: false,
    pomoTimer: null,
    pomoMode: 25,
    user: null,
    csrf: '',
    isAdmin: false,
    doneMap: {},
    notesMap: {},
    resumeItem: null,
    communityItems: []
  };

  window.PK9_AUTH = APP;

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function toast(msg, type = 'info') {
    let stack = document.getElementById('pk9-toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'pk9-toast-stack';
      stack.className = 'pk9-toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = `pk9-toast ${type}`;
    el.textContent = msg;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }, 3400);
  }
  window.PK9_TOAST = toast;

  function typeset(el) {
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      window.MathJax.typesetPromise(el ? [el] : undefined).catch(() => {});
    }
  }

  function loadLocalProgress() {
    try {
      APP.doneMap = JSON.parse(localStorage.getItem('pk9_done_map') || '{}') || {};
      APP.notesMap = JSON.parse(localStorage.getItem('pk9_notes_map') || '{}') || {};
      APP.resumeItem = JSON.parse(localStorage.getItem('pk9_resume_item') || 'null');
    } catch {
      APP.doneMap = {};
      APP.notesMap = {};
      APP.resumeItem = null;
    }
  }

  function saveLocalProgress() {
    try {
      localStorage.setItem('pk9_done_map', JSON.stringify(APP.doneMap));
      localStorage.setItem('pk9_notes_map', JSON.stringify(APP.notesMap));
      if (APP.resumeItem) localStorage.setItem('pk9_resume_item', JSON.stringify(APP.resumeItem));
    } catch {}
  }

  async function syncProgressToServer() {
    saveLocalProgress();
    if (!APP.user) return;
    try {
      const resp = await fetch('/api/auth?action=save-state', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': APP.csrf
        },
        body: JSON.stringify({
          done: APP.doneMap,
          notes: APP.notesMap,
          resume: APP.resumeItem
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.user) {
          APP.user = data.user;
          updateHeaderAuthUI();
        }
      }
    } catch {}
  }

  function getCatalog() {
    return Array.isArray(window.PK9_CATALOG) ? window.PK9_CATALOG : [];
  }

  function getCourseById(courseId) {
    const list = getCatalog();
    return list.find(c => c.id === courseId) || list[0] || null;
  }

  function findTopicInCourse(course, topicId) {
    if (!course) return null;
    for (const ch of course.chapters || []) {
      for (const t of ch.topics || []) {
        if (t.id === topicId) return { chapter: ch, topic: t };
      }
    }
    const firstCh = course.chapters?.[0];
    const firstTopic = firstCh?.topics?.[0];
    return firstTopic ? { chapter: firstCh, topic: firstTopic } : null;
  }

  function countCourseProgress(course) {
    let total = 0, done = 0;
    for (const ch of course?.chapters || []) {
      for (const t of ch.topics || []) {
        total++;
        if (APP.doneMap[t.id]) done++;
      }
    }
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  // ==========================================================================
  // NAVIGATION & TAB SWITCHING
  // ==========================================================================
  function switchTab(tabId, options = {}) {
    const validTabs = ['home', 'lectures', 'exams', 'leaderboard', 'docs', 'archive', 'flashcards', 'community', 'planner', 'ai'];
    const target = validTabs.includes(tabId) ? tabId : 'home';
    APP.activeTab = target;

    if (options.courseId) {
      APP.activeCourseId = options.courseId;
      const c = getCourseById(options.courseId);
      if (c && !options.topicId) {
        APP.activeTopicId = c.chapters?.[0]?.topics?.[0]?.id || APP.activeTopicId;
      }
    }
    if (options.topicId) {
      APP.activeTopicId = options.topicId;
    }

    document.querySelectorAll('.pk9-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${target}`);
    });
    document.querySelectorAll('[data-nav-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-nav-tab') === target);
    });

    const sidebar = document.getElementById('pk9-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    document.getElementById('pk9-sidebar-backdrop')?.classList.remove('open');

    if (target === 'home') renderHomeTab();
    if (target === 'lectures') renderLecturesTab();
    if (target === 'exams' && window.PK9_EXAM_CENTER) window.PK9_EXAM_CENTER.render();
    if (target === 'leaderboard') renderLeaderboardTab();
    if (target === 'docs') renderDocsTab();
    if (target === 'archive') renderArchiveTab();
    if (target === 'flashcards') renderFlashcardsTab();
    if (target === 'community') renderCommunityTab();
    if (target === 'planner') renderPlannerTab();
    if (target === 'ai') renderAiTab();

    if (!options.keepScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  window.switchTab = switchTab;

  // ==========================================================================
  // AUTH & LEADERBOARD FETCHING
  // ==========================================================================
  async function fetchAuthAndLeaderboard() {
    try {
      const meResp = await fetch('/api/auth?action=me', { credentials: 'include' });
      if (meResp.ok) {
        const meData = await meResp.json();
        APP.csrf = meData.csrf || APP.csrf;
        APP.isAdmin = Boolean(meData.is_admin);
        if (meData.authenticated && meData.user) {
          APP.user = meData.user;
          if (meData.user.progress?.done) {
            APP.doneMap = { ...APP.doneMap, ...meData.user.progress.done };
          }
          if (meData.user.progress?.notes) {
            APP.notesMap = { ...APP.notesMap, ...meData.user.progress.notes };
          }
          saveLocalProgress();
        } else {
          APP.user = null;
        }
      }
    } catch {}

    try {
      const lbResp = await fetch('/api/dashboard?action=leaderboard', { credentials: 'include' });
      if (lbResp.ok) {
        const lbJson = await lbResp.json();
        if (lbJson?.ok) {
          APP.lbData = {
            week_key: lbJson.week_key || '',
            leaderboard: Array.isArray(lbJson.leaderboard) ? lbJson.leaderboard : [],
            weekly_leaderboard: Array.isArray(lbJson.weekly_leaderboard) ? lbJson.weekly_leaderboard : [],
            exam_leaderboard: Array.isArray(lbJson.exam_leaderboard) ? lbJson.exam_leaderboard : [],
            my_rank: lbJson.my_rank || null
          };
        }
      }
    } catch {}

    updateHeaderAuthUI();
    if (APP.activeTab === 'home') renderHomeTab();
    if (APP.activeTab === 'leaderboard') renderLeaderboardTab();
  }
  window.PK9_REFRESH_AUTH_AND_LEADERBOARD = fetchAuthAndLeaderboard;

  function updateHeaderAuthUI() {
    const xpChip = document.getElementById('pk9-top-xp-chip');
    const authBtn = document.getElementById('pk9-top-auth-btn');
    const sideCard = document.getElementById('pk9-sidebar-user-card');

    const doneCount = Object.values(APP.doneMap).filter(Boolean).length;
    const xpVal = APP.user ? Math.max(100, Number(APP.user.xp || 100)) : doneCount * 20;
    const wkXpVal = APP.user ? Math.max(50, Number(APP.user.weekly_xp || 50)) : doneCount * 20;
    const levelVal = Math.floor(xpVal / 100) + 1;
    const streakVal = APP.user ? Math.max(1, Number(APP.user.streak || 1)) : 1;

    if (xpChip) {
      xpChip.innerHTML = `<span class="hide-xs">🔥 Chuỗi ${streakVal} ngày • </span>⚡ <b>${xpVal} XP</b> <span class="hide-xs">(Lv.${levelVal})</span>`;
    }

    if (authBtn) {
      if (APP.user) {
        authBtn.innerHTML = `👤 ${esc(APP.user.display_name || APP.user.username)}`;
      } else {
        authBtn.innerHTML = `🚀 Đăng ký <span class="hide-xs">/ Đăng nhập (+100 XP)</span>`;
      }
    }

    if (sideCard) {
      const myRank = APP.lbData.my_rank;
      if (APP.user) {
        sideCard.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.65rem;margin-bottom:0.55rem;">
            <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0d9488);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;">
              ${esc((APP.user.display_name || APP.user.username || 'K').slice(0, 1).toUpperCase())}
            </div>
            <div style="min-width:0;flex:1;">
              <div style="font-weight:800;font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(APP.user.display_name)}</div>
              <div style="font-size:0.72rem;color:var(--pk9-text-muted);">Lv.${levelVal} • ${xpVal} XP • Tuần: ${wkXpVal} XP</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.74rem;font-weight:700;padding-top:0.45rem;border-top:1px dashed var(--pk9-border);">
            <span>🏆 Top Tuần: <b>#${myRank?.weeklyRank || '—'}</b></span>
            <span>🌟 Top Tổng: <b>#${myRank?.topRank || '—'}</b></span>
          </div>
        `;
      } else {
        sideCard.innerHTML = `
          <div style="font-weight:800;font-size:0.83rem;margin-bottom:0.3rem;">🏆 Đua Top Học Viên K9</div>
          <div style="font-size:0.75rem;color:var(--pk9-text-muted);margin-bottom:0.65rem;">
            Đăng ký tài khoản miễn phí để nhận <b>+100 XP</b> khởi đầu và ghi danh lên <b>BXH Hàng Tuần & BXH Top</b>!
          </div>
          <button type="button" class="pk9-auth-btn" data-open-auth="register" style="width:100%;justify-content:center;padding:0.48rem;">
            ✨ Tạo tài khoản ngay
          </button>
        `;
      }
    }
  }

  // ==========================================================================
  // TAB 1: HOME ECOSYSTEM DASHBOARD
  // ==========================================================================
  function renderHomeTab() {
    const root = document.getElementById('tab-home');
    if (!root) return;

    const catalog = getCatalog();
    const filteredCourses = APP.gradeFilter === 'ALL'
      ? catalog
      : catalog.filter(c => c.grade === APP.gradeFilter);

    const totalTopics = catalog.reduce((s, c) => s + c.chapters.reduce((a, ch) => a + ch.topics.length, 0), 0);
    const doneTotal = Object.values(APP.doneMap).filter(Boolean).length;
    const seedExams = (Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS : []).slice(0, 4);
    const topWeekly = (APP.lbData.weekly_leaderboard || []).slice(0, 3);

    root.innerHTML = `
      <section class="pk9-hero">
        <div class="pk9-hero-orb-1"></div>
        <div class="pk9-hero-orb-2"></div>
        <div class="pk9-hero-grid">
          <div>
            <div class="pk9-hero-badge">
              <span>⚡ HỆ SINH THÁI GIÁO DỤC TOÀN DIỆN • HỌC CÙNG PHÚC K9</span>
            </div>
            <h1>
              Bứt Phá Điểm Số 9+ Cùng<br/>
              <span>HỌC CÙNG PHÚC K9</span>
            </h1>
            <p>
              Nền tảng học tập thế hệ mới tích hợp <b>${totalTopics}+ Video bài giảng đa môn</b> (Toán, Lí, Hóa, Sinh, Anh, Khối 10 & Ôn vào 10), <b>Phòng luyện đề nguồn gốc thật Sở/Bộ chấm điểm tự động</b> và <b>Bảng xếp hạng Hàng Tuần & Top Học Viên</b>.
            </p>
            <div class="pk9-hero-ctas">
              <button type="button" class="pk9-btn-hero-main" data-nav-tab="lectures">
                🎬 Vào Phòng Học Video (${totalTopics} bài)
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-nav-tab="exams">
                🏛️ Luyện Đề Nguồn Thật & Chấm Điểm
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-nav-tab="leaderboard">
                🏆 BXH Tuần & BXH Top Học Viên
              </button>
            </div>
          </div>
          <div class="pk9-hero-stats-card">
            <div class="pk9-stat-box">
              <strong>${catalog.length} Khóa</strong>
              <span>${totalTopics} bài giảng Video HD & Lý thuyết</span>
            </div>
            <div class="pk9-stat-box">
              <strong>8 Đề Chuẩn</strong>
              <span>Chấm tự động 3 phần + 30+ đề gốc Sở/Bộ</span>
            </div>
            <div class="pk9-stat-box">
              <strong>84+ PDF</strong>
              <span>Ebook thực chiến & Đề trường chuyên</span>
            </div>
            <div class="pk9-stat-box">
              <strong>${doneTotal} Bài</strong>
              <span>Bạn đã hoàn thành trên hệ thống</span>
            </div>
          </div>
        </div>
      </section>

      ${APP.resumeItem ? `
        <div class="pk9-card" style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;background:linear-gradient(135deg,rgba(37,99,235,0.08),rgba(13,148,136,0.08));border-color:rgba(37,99,235,0.3);">
          <div>
            <div style="font-size:0.74rem;font-weight:800;color:var(--pk9-primary);text-transform:uppercase;">▶️ Tiếp tục bài học gần nhất</div>
            <div style="font-size:1.02rem;font-weight:900;margin-top:0.15rem;">${esc(APP.resumeItem.title)}</div>
            <div style="font-size:0.81rem;color:var(--pk9-text-muted);">${esc(APP.resumeItem.courseName)} • ${esc(APP.resumeItem.teacher || '')}</div>
          </div>
          <button type="button" class="pk9-auth-btn" data-open-lecture-course="${esc(APP.resumeItem.courseId)}" data-open-lecture-topic="${esc(APP.resumeItem.topicId)}">
            ▶️ Học tiếp bài này
          </button>
        </div>
      ` : ''}

      <div class="pk9-sec-head">
        <div>
          <h2>🎬 Hệ Thống Video Bài Giảng Đa Môn (${APP.gradeFilter === 'ALL' ? 'Tất cả khối' : `Khối ${APP.gradeFilter}`})</h2>
          <p>Chọn môn học để xem video bài giảng, lý thuyết công thức, các dạng toán và làm bài tập tự luyện có chấm điểm.</p>
        </div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          ${['2K9', '2K11', '2K12', 'ALL'].map(g => `
            <button type="button" class="pk9-exam-chip ${APP.gradeFilter === g ? 'active' : ''}" data-set-grade="${g}">
              ${g === '2K9' ? '🎓 Lớp 12 (2K9)' : g === '2K11' ? '📘 Lớp 10 Mới (2K11)' : g === '2K12' ? '🎯 Ôn Vào 10 (2K12)' : '🌐 Tất cả (16 khóa)'}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="pk9-grid-3">
        ${filteredCourses.map(course => {
          const prog = countCourseProgress(course);
          return `
            <article class="pk9-card" style="display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.75rem;">
                  <span style="font-size:1.75rem;">${course.icon || '📘'}</span>
                  <span class="pk9-badge pk9-badge-subj">${esc(course.grade)} • ${prog.total} bài giảng</span>
                </div>
                <h3 style="margin:0 0 0.4rem;font-size:1.08rem;font-weight:900;">${esc(course.name)}</h3>
                <div style="font-size:0.79rem;font-weight:700;color:var(--pk9-primary);margin-bottom:0.5rem;">
                  👨‍🏫 ${esc(course.teacher)}
                </div>
                <p style="margin:0 0 0.9rem;font-size:0.84rem;color:var(--pk9-text-muted);">
                  ${esc(course.desc)}
                </p>
              </div>
              <div>
                <div style="display:flex;justify-content:space-between;font-size:0.76rem;font-weight:800;margin-bottom:0.35rem;">
                  <span>Tiến độ hoàn thành</span>
                  <span style="color:var(--pk9-primary);">${prog.done}/${prog.total} bài (${prog.percent}%)</span>
                </div>
                <div class="pk9-topic-track" style="margin-bottom:0.9rem;">
                  <div class="pk9-topic-fill" style="width:${Math.max(3, prog.percent)}%;"></div>
                </div>
                <button type="button" class="pk9-btn-exam-primary" data-open-lecture-course="${esc(course.id)}" style="width:100%;">
                  🎬 Mở khóa học Video
                </button>
              </div>
            </article>
          `;
        }).join('')}
      </div>

      <div class="pk9-sec-head">
        <div>
          <h2>🏛️ Đề Thi Thật Nổi Bật — Chấm Điểm Tự Động Chuẩn Bộ GD&ĐT</h2>
          <p>Đề thi có nguồn gốc rõ ràng từ các Sở GD&ĐT, trường THPT và Bộ GD&ĐT kèm đáp án và lời giải chi tiết.</p>
        </div>
        <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="exams">
          Xem toàn bộ kho luyện đề →
        </button>
      </div>

      <div class="pk9-grid-4">
        ${seedExams.map(ex => `
          <article class="pk9-card" style="display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;gap:0.35rem;flex-wrap:wrap;margin-bottom:0.6rem;">
                <span class="pk9-badge pk9-badge-subj">${esc(ex.subject)}</span>
                <span class="pk9-badge pk9-badge-verified">✓ ${esc(ex.sourceOrg || 'Sở GD&ĐT')}</span>
              </div>
              <h4 style="margin:0 0 0.45rem;font-size:0.98rem;font-weight:800;">${esc(ex.title)}</h4>
              <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin-bottom:0.85rem;">
                ⏱ ${ex.durationMinutes || 50} phút • 📝 ${(ex.questions || []).length} câu • Thang 10đ
              </div>
            </div>
            <button type="button" class="pk9-btn-exam-primary" data-quick-start-exam="${esc(ex.id)}" style="width:100%;">
              ⚡ Vào thi & Chấm điểm
            </button>
          </article>
        `).join('')}
      </div>

      <div class="pk9-sec-head">
        <div>
          <h2>🏆 Bảng Xếp Hạng Đua Top Hàng Tuần & Top Học Viên Phúc K9</h2>
          <p>Đăng ký tài khoản học viên để lưu điểm luyện đề, nhận XP mỗi ngày và tranh ngôi Thủ khoa Tuần.</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${!APP.user ? `
            <button type="button" class="pk9-auth-btn" data-open-auth="register">
              ✨ Đăng ký tài khoản lên BXH (+100 XP)
            </button>
          ` : ''}
          <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="leaderboard">
            Xem đầy đủ BXH Tuần & Top →
          </button>
        </div>
      </div>

      ${topWeekly.length ? `
        <div class="pk9-lb-podium">
          ${[topWeekly[1], topWeekly[0], topWeekly[2]].filter(Boolean).map(row => {
            const r = row.rank;
            const crown = r === 1 ? '👑' : r === 2 ? '🥈' : '🥉';
            return `
              <div class="pk9-podium-card rank-${r}">
                <div class="pk9-podium-crown">${crown}</div>
                <div class="pk9-lb-avatar">${esc((row.display_name || 'K').slice(0, 1).toUpperCase())}</div>
                <div style="font-weight:900;font-size:1.02rem;">Hạng #${r} • ${esc(row.display_name)}</div>
                <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin:0.2rem 0 0.65rem;">🏫 ${esc(row.school || 'Học viên đã đăng ký')}</div>
                <div style="display:flex;justify-content:center;gap:0.45rem;flex-wrap:wrap;">
                  <span class="pk9-badge pk9-badge-subj">🔥 +${row.weeklyXp} XP Tuần</span>
                  <span class="pk9-badge pk9-badge-verified">🎯 Đỉnh: ${Number(row.bestScore || 0).toFixed(2)}đ</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="pk9-card" style="text-align:center;padding:2rem;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">🏆</div>
          <div style="font-weight:900;font-size:1.05rem;margin-bottom:0.35rem;">Chưa có học viên nào ghi danh trên Bảng Xếp Hạng</div>
          <p style="margin:0 0 1rem;font-size:0.86rem;color:var(--pk9-text-muted);">
            Bảng xếp hạng chỉ hiển thị dữ liệu thật 100% từ các tài khoản học viên đã đăng ký và làm đề trên web. Hãy đăng ký ngay để chiếm vị trí Top #1!
          </p>
          <button type="button" class="pk9-auth-btn" data-open-auth="register">
            🚀 Đăng ký tài khoản chiếm Top #1 ngay
          </button>
        </div>
      `}
    `;
  }

  // ==========================================================================
  // ==========================================================================
  // TAB 2: MULTI-SUBJECT VIDEO LECTURE STUDIO (2-TIER: GRADE -> SUBJECT)
  // ==========================================================================
  function renderLecturesTab() {
    const root = document.getElementById('tab-lectures');
    if (!root) return;

    const catalog = getCatalog();
    const course = getCourseById(APP.activeCourseId);
    if (!course) return;

    const activeGrade = course.grade || '2K9';
    const gradeMeta = [
      { code: '2K9', icon: '🎓', label: 'Khối 12 — Luyện Thi THPT Quốc Gia (2K9)', sub: '5 Môn thi THPT: Toán 12, Vật Lí 12, Hóa Học 12, Sinh Học 12, Tiếng Anh 12' },
      { code: '2K11', icon: '📘', label: 'Khối 10 — Chương Trình Mới GDPT 2018 (2K11)', sub: '5 Môn nền tảng: Toán 10, Vật Lí 10, Hóa Học 10, Sinh Học 10, Tiếng Anh 10' },
      { code: '2K12', icon: '🎯', label: 'Khối 9 — Ôn Thi Tuyển Sinh Vào Lớp 10 (2K12)', sub: '5 Môn vào 10: Toán 9, Ngữ Văn 9, Tiếng Anh 9, KHTN 9, Lịch Sử & Địa Lí 9' }
    ];
    const coursesInActiveGrade = catalog.filter(c => c.grade === activeGrade);

    const found = findTopicInCourse(course, APP.activeTopicId);
    const activeChapter = found?.chapter;
    const activeTopic = found?.topic;
    if (activeTopic) {
      APP.activeTopicId = activeTopic.id;
      APP.resumeItem = {
        courseId: course.id,
        courseName: course.shortName || course.name,
        topicId: activeTopic.id,
        title: activeTopic.title,
        teacher: activeTopic.teacher
      };
      saveLocalProgress();
    }

    // Flatten topics in course for Prev / Next buttons
    const flatTopics = [];
    for (const ch of course.chapters || []) {
      for (const t of ch.topics || []) flatTopics.push(t);
    }
    const curIdx = flatTopics.findIndex(t => t.id === activeTopic?.id);
    const prevTopic = curIdx > 0 ? flatTopics[curIdx - 1] : null;
    const nextTopic = curIdx >= 0 && curIdx < flatTopics.length - 1 ? flatTopics[curIdx + 1] : null;

    const isDone = Boolean(activeTopic && APP.doneMap[activeTopic.id]);
    const prog = countCourseProgress(course);
    const qFilter = APP.lectureSearch.trim().toLowerCase();
    const ytSearchUrl = activeTopic?.youtubeSearchUrl
      || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${course.shortName || course.name} ${activeTopic?.title || ''}`)}`;

    root.innerHTML = `
      <!-- 2-TIER COURSE SELECTOR: BƯỚC 1 (CHỌN KHỐI LỚP) -> BƯỚC 2 (CHỌN MÔN HỌC) -->
      <section class="pk9-lecture-hierarchy" aria-label="Chọn Khối lớp và Môn học">
        <div class="pk9-tier-label">
          <span>📚 BƯỚC 1: CHỌN KHỐI LỚP HỌC TẬP</span>
          <button type="button" class="pk9-btn-exam-ghost" data-toggle-theater="1" style="padding:0.35rem 0.75rem;font-size:0.76rem;">
            ${APP.theaterMode ? '📐 Thu nhỏ màn hình' : '🖥️ Chế độ Rạp chiếu'}
          </button>
        </div>

        <div class="pk9-grade-tier-grid">
          ${gradeMeta.map(gm => {
            const gCourses = catalog.filter(c => c.grade === gm.code);
            const gTopicsCount = gCourses.reduce((s, c) => s + c.chapters.reduce((a, ch) => a + ch.topics.length, 0), 0);
            const isAct = gm.code === activeGrade;
            return `
              <button type="button" class="pk9-grade-tier-card ${isAct ? 'active' : ''}" data-select-lecture-grade="${gm.code}">
                <div class="pk9-grade-tier-icon">${gm.icon}</div>
                <div style="min-width:0;flex:1;">
                  <div style="font-weight:900;font-size:0.88rem;line-height:1.25;">${esc(gm.label)}</div>
                  <div style="font-size:0.73rem;color:var(--pk9-text-muted);margin-top:0.2rem;">
                    ${gCourses.length} môn học • <b>${gTopicsCount} video bài giảng</b>
                  </div>
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <div class="pk9-tier-label" style="margin-bottom:0.55rem;">
          <span>🎯 BƯỚC 2: CHỌN MÔN HỌC THUỘC KHỐI ${esc(activeGrade)} (${coursesInActiveGrade.length} MÔN)</span>
          <span style="font-size:0.73rem;color:var(--pk9-text-muted);text-transform:none;font-weight:700;">
            Đang học: <b>${esc(course.name)}</b>
          </span>
        </div>

        <div class="pk9-subject-tier-grid">
          ${coursesInActiveGrade.map(c => {
            const cp = countCourseProgress(c);
            const isAct = c.id === course.id;
            return `
              <button type="button" class="pk9-subject-tier-card ${isAct ? 'active' : ''}" data-select-course="${esc(c.id)}">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4rem;width:100%;">
                  <span style="font-size:1.35rem;">${c.icon || '📘'}</span>
                  <span class="pk9-subj-meta">${cp.done}/${cp.total} bài (${cp.percent}%)</span>
                </div>
                <div>
                  <div style="font-weight:900;font-size:0.88rem;line-height:1.25;">${esc(c.shortName || c.name)}</div>
                  <div class="pk9-subj-meta" style="margin-top:0.15rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    👨‍🏫 ${esc(c.teacher)}
                  </div>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </section>

      <div class="pk9-lecture-studio ${APP.theaterMode ? 'theater' : ''}">
        <aside class="pk9-course-sidebar">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.5rem;">
            <strong style="font-size:0.95rem;">📑 Mục lục: ${course.icon} ${esc(course.shortName || course.name)}</strong>
            <span class="pk9-badge pk9-badge-verified">${prog.done}/${prog.total} bài (${prog.percent}%)</span>
          </div>
          <div class="pk9-topic-track" style="margin-bottom:0.75rem;">
            <div class="pk9-topic-fill" style="width:${Math.max(4, prog.percent)}%;"></div>
          </div>
          <input type="search" id="pk9-lecture-search-input" class="pk9-input" placeholder="🔍 Tìm bài giảng trong môn ${esc(course.shortName || course.name)}..." value="${esc(APP.lectureSearch)}" style="margin-top:0;margin-bottom:0.5rem;" />

          <div>
            ${(course.chapters || []).map(ch => {
              const topics = (ch.topics || []).filter(t => {
                if (!qFilter) return true;
                return `${t.title} ${t.code || ''} ${t.desc || ''}`.toLowerCase().includes(qFilter);
              });
              if (!topics.length) return '';
              return `
                <div class="pk9-chapter-block">
                  <div class="pk9-chapter-head">
                    <span>${esc(ch.title)}</span>
                    <span style="font-size:0.72rem;color:var(--pk9-text-muted);">${topics.length} bài</span>
                  </div>
                  <div class="pk9-topic-list">
                    ${topics.map(t => {
                      const done = Boolean(APP.doneMap[t.id]);
                      const act = t.id === activeTopic?.id;
                      return `
                        <button type="button" class="pk9-topic-btn ${act ? 'active' : ''}" data-select-topic="${esc(t.id)}">
                          <span style="flex:1;line-height:1.35;">${act ? '▶ ' : ''}${esc(t.title)}</span>
                          <span style="font-size:0.78rem;color:${done ? '#10b981' : 'var(--pk9-text-soft)'};flex-shrink:0;">
                            ${done ? '✓ Đã học' : esc(t.duration || '45p')}
                          </span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </aside>

        ${activeTopic ? `
          <div class="pk9-video-stage">
            <div class="pk9-video-frame-wrap">
              <iframe
                src="https://www.youtube-nocookie.com/embed/${esc(activeTopic.videoId)}?rel=0&modestbranding=1"
                title="${esc(activeTopic.title)}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>

            <div class="pk9-video-info-bar">
              <div style="flex:1;min-width:220px;">
                <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-primary);text-transform:uppercase;">
                  Khối ${esc(course.grade)} • ${esc(course.name)} • ${esc(activeChapter?.title || '')}
                </div>
                <h2 style="margin:0.2rem 0 0.35rem;font-size:1.18rem;font-weight:900;">
                  ${esc(activeTopic.title)}
                </h2>
                <div style="font-size:0.81rem;color:var(--pk9-text-muted);display:flex;flex-wrap:wrap;gap:0.75rem;">
                  <span>👨‍🏫 <b>Giảng viên:</b> ${esc(activeTopic.teacher)}</span>
                  <span>⏱ <b>Thời lượng:</b> ${esc(activeTopic.duration || '50 phút')}</span>
                  <span>🎞️ <b>Mã Video:</b> <code>${esc(activeTopic.videoId)}</code></span>
                </div>
              </div>

              <div style="display:flex;flex-wrap:wrap;gap:0.45rem;align-items:center;">
                ${prevTopic ? `
                  <button type="button" class="pk9-btn-exam-ghost" data-select-topic="${esc(prevTopic.id)}">← Bài trước</button>
                ` : ''}
                <button type="button" class="pk9-btn-exam-primary" data-toggle-done-topic="${esc(activeTopic.id)}" style="${isDone ? 'background:#10b981;' : ''}">
                  ${isDone ? '✓ Đã hoàn thành (+25 XP)' : '✅ Đánh dấu hoàn thành (+25 XP)'}
                </button>
                <a href="https://www.youtube.com/watch?v=${esc(activeTopic.videoId)}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost">
                  ▶️ Mở YouTube ↗
                </a>
                <a href="${esc(ytSearchUrl)}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost" title="Tìm thêm bài giảng cùng chủ đề trên YouTube">
                  🔎 Tìm thêm trên YouTube ↗
                </a>
                ${nextTopic ? `
                  <button type="button" class="pk9-btn-exam-ghost" data-select-topic="${esc(nextTopic.id)}">Bài tiếp →</button>
                ` : ''}
              </div>
            </div>

            <div class="pk9-study-subtabs">
              <button type="button" class="pk9-study-subtab ${APP.studySubtab === 'theory' ? 'active' : ''}" data-study-subtab="theory">
                📖 Lý thuyết & Công thức
              </button>
              <button type="button" class="pk9-study-subtab ${APP.studySubtab === 'types' ? 'active' : ''}" data-study-subtab="types">
                🧩 Các dạng bài (${(activeTopic.problemTypes || []).length})
              </button>
              <button type="button" class="pk9-study-subtab ${APP.studySubtab === 'quiz' ? 'active' : ''}" data-study-subtab="quiz">
                ✍️ Bài tập tự luyện (${(activeTopic.exercises || []).length})
              </button>
              <button type="button" class="pk9-study-subtab ${APP.studySubtab === 'notes' ? 'active' : ''}" data-study-subtab="notes">
                📝 Sổ tay ghi chú
              </button>
            </div>

            <div class="pk9-study-body" id="pk9-study-body">
              ${renderTopicSubtabContent(activeTopic)}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    typeset(root);
  }

  function renderTopicSubtabContent(topic) {
    if (APP.studySubtab === 'theory') {
      return `
        <div style="font-size:0.95rem;line-height:1.75;">
          ${topic.desc ? `<div style="padding:0.9rem 1.1rem;border-radius:0.9rem;background:var(--pk9-surface-2);border-left:4px solid var(--pk9-primary);margin-bottom:1.1rem;font-weight:600;">📌 <b>Tóm tắt trọng tâm:</b> ${esc(topic.desc)}</div>` : ''}
          <div>${topic.theory || '<p>Xem kỹ video bài giảng và ghi chú các công thức cốt lõi.</p>'}</div>
        </div>
      `;
    }

    if (APP.studySubtab === 'types') {
      const types = topic.problemTypes || [];
      if (!types.length) {
        return `<p style="color:var(--pk9-text-muted);">Chuyên đề này tích hợp phương pháp giải trực tiếp trong tab Lý thuyết và Video bài giảng.</p>`;
      }
      return `
        <div style="display:flex;flex-direction:column;gap:0.9rem;">
          ${types.map(tp => `
            <div style="padding:1.1rem 1.25rem;border-radius:1.1rem;border:1px solid var(--pk9-border);background:var(--pk9-surface-2);">
              <h4 style="margin:0 0 0.45rem;font-size:0.98rem;font-weight:800;color:var(--pk9-primary);">${esc(tp.title)}</h4>
              <div style="font-size:0.9rem;line-height:1.65;white-space:pre-line;"><b>Phương pháp giải:</b> ${esc(tp.method)}</div>
              ${tp.example ? `<div style="margin-top:0.6rem;padding:0.75rem 0.95rem;border-radius:0.75rem;background:var(--pk9-surface);border:1px dashed var(--pk9-border);font-size:0.87rem;white-space:pre-line;"><b>💡 Ví dụ / Lưu ý:</b> ${esc(tp.example)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    if (APP.studySubtab === 'quiz') {
      const exList = topic.exercises || [];
      if (!exList.length) {
        return `<p style="color:var(--pk9-text-muted);">Hãy chuyển sang mục <b>Kho Luyện Đề & Chấm Điểm</b> để làm đề thi thực chiến cho chuyên đề này.</p>`;
      }
      return `
        <div style="display:flex;flex-direction:column;gap:1rem;">
          ${exList.map((ex, idx) => {
            const qKey = `${topic.id}_ex_${idx}`;
            const picked = APP.quizAnswers[qKey];
            const hasAnswered = typeof picked === 'number';
            return `
              <div class="pk9-q-card" style="margin-bottom:0;">
                <div style="font-weight:800;color:var(--pk9-primary);margin-bottom:0.5rem;">Câu hỏi thực hành ${idx + 1}</div>
                <div style="font-size:0.94rem;font-weight:600;margin-bottom:0.85rem;">${esc(ex.question)}</div>
                <div class="pk9-mcq-list">
                  ${(ex.options || []).map((optText, oIdx) => {
                    const letter = ['A', 'B', 'C', 'D'][oIdx] || String(oIdx + 1);
                    let borderStyle = '';
                    if (hasAnswered) {
                      if (oIdx === ex.correct) borderStyle = 'border-color:#10b981;background:rgba(16,185,129,0.12);font-weight:800;';
                      else if (oIdx === picked && picked !== ex.correct) borderStyle = 'border-color:#ef4444;background:rgba(239,68,68,0.1);';
                    }
                    return `
                      <div class="pk9-mcq-opt ${picked === oIdx ? 'selected' : ''}" style="${borderStyle}" data-topic-quiz="${esc(qKey)}" data-topic-opt="${oIdx}">
                        <span class="pk9-mcq-letter">${letter}</span>
                        <div>${esc(optText)}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
                ${hasAnswered ? `
                  <div class="pk9-exp-box">
                    <b style="color:${picked === ex.correct ? '#10b981' : '#ef4444'};">
                      ${picked === ex.correct ? '✓ Chính xác!' : `✗ Chưa đúng — Đáp án đúng là ${['A', 'B', 'C', 'D'][ex.correct]}`}
                    </b><br/>
                    <span>${esc(ex.solution)}</span>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (APP.studySubtab === 'notes') {
      const savedNote = APP.notesMap[topic.id] || '';
      return `
        <div>
          <label style="font-weight:800;font-size:0.9rem;display:block;margin-bottom:0.5rem;">
            📝 Ghi chú cá nhân cho bài "${esc(topic.title)}" (Tự động lưu trên trình duyệt & đồng bộ đám mây khi đăng nhập)
          </label>
          <textarea id="pk9-topic-note-area" class="pk9-input" rows="7" placeholder="Ghi lại công thức quan trọng, mốc thời gian video hoặc lỗi sai cần tránh...">${esc(savedNote)}</textarea>
          <div style="margin-top:0.75rem;display:flex;justify-content:flex-end;">
            <button type="button" class="pk9-btn-exam-primary" data-save-note="${esc(topic.id)}">
              💾 Lưu ghi chú
            </button>
          </div>
        </div>
      `;
    }
    return '';
  }

  // ==========================================================================
  // TAB 4: WEEKLY & ALL-TIME TOP LEADERBOARD
  // ==========================================================================
  function renderLeaderboardTab() {
    const root = document.getElementById('tab-leaderboard');
    if (!root) return;

    const list = APP.lbMode === 'weekly'
      ? APP.lbData.weekly_leaderboard
      : APP.lbMode === 'exam'
      ? APP.lbData.exam_leaderboard
      : APP.lbData.leaderboard;

    const q = APP.lbSearch.trim().toLowerCase();
    const filtered = (list || []).filter(r => {
      if (!q) return true;
      return `${r.display_name} ${r.username} ${r.school || ''} ${r.grade || ''}`.toLowerCase().includes(q);
    });

    const top3 = (list || []).slice(0, 3);
    const myRank = APP.lbData.my_rank;
    const maxMetric = Math.max(100, ...(list || []).map(x => Number(APP.lbMode === 'weekly' ? x.weeklyXp : x.xp) || 100));
    const podiumSlots = [
      { rank: 2, row: top3.find(x => x.rank === 2) || null, crown: '🥈', title: 'Á Quân #2' },
      { rank: 1, row: top3.find(x => x.rank === 1) || null, crown: '👑', title: 'Thủ Khoa #1' },
      { rank: 3, row: top3.find(x => x.rank === 3) || null, crown: '🥉', title: 'Quý Quân #3' }
    ];

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;margin-bottom:0.8rem;">
                <div style="display:inline-flex;align-items:center;gap:0.45rem;padding:0.32rem 0.85rem;border-radius:999px;background:rgba(245,158,11,0.22);border:1px solid rgba(245,158,11,0.45);font-size:0.75rem;font-weight:800;">
                  <span>🏆 ĐẤU TRƯỜNG BẢNG VÀNG PHÚC K9 • ${esc(APP.lbData.week_key || 'Tuần này')}</span>
                </div>
                <div class="pk9-lb-live-pill">
                  <span class="pk9-live-dot"></span>
                  <span>100% Dữ liệu thật từ Học viên đăng ký</span>
                </div>
              </div>
              <h2 style="font-size:1.65rem;font-weight:900;margin:0 0 0.5rem;">
                Bảng Xếp Hạng Hàng Tuần & Top Học Viên Toàn Hệ Thống
              </h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.92rem;line-height:1.6;">
                Mỗi khi bạn <b>đăng ký tài khoản (+100 XP)</b>, <b>hoàn thành bài giảng video (+25 XP)</b> hoặc <b>nộp bài thi tại Phòng Luyện Đề (+60 → +140 XP)</b>, điểm số và thứ hạng của bạn được cập nhật trực tiếp theo thời gian thực!
              </p>
            </div>
            <div>
              ${APP.user ? `
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.2rem;">
                  <div style="font-size:0.76rem;font-weight:800;color:#fde047;text-transform:uppercase;">🌟 THỨ HẠNG THẬT CỦA BẠN</div>
                  <div style="font-size:1.15rem;font-weight:900;margin:0.25rem 0 0.75rem;">👤 ${esc(APP.user.display_name)} (@${esc(APP.user.username)})</div>
                  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.55rem;text-align:center;">
                    <div style="background:rgba(15,23,42,0.45);padding:0.6rem;border-radius:0.8rem;">
                      <strong style="display:block;font-size:1.2rem;color:#38bdf8;">#${myRank?.weeklyRank || '—'}</strong>
                      <span style="font-size:0.72rem;">BXH Tuần</span>
                    </div>
                    <div style="background:rgba(15,23,42,0.45);padding:0.6rem;border-radius:0.8rem;">
                      <strong style="display:block;font-size:1.2rem;color:#34d399;">#${myRank?.topRank || '—'}</strong>
                      <span style="font-size:0.72rem;">BXH Top</span>
                    </div>
                    <div style="background:rgba(15,23,42,0.45);padding:0.6rem;border-radius:0.8rem;">
                      <strong style="display:block;font-size:1.2rem;color:#fbbf24;">${APP.user.xp || 100} XP</strong>
                      <span style="font-size:0.72rem;">Tổng XP</span>
                    </div>
                  </div>
                </div>
              ` : `
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.25rem;text-align:center;">
                  <div style="font-size:1.05rem;font-weight:900;margin-bottom:0.4rem;">🚀 Ghi Danh Lên Bảng Xếp Hạng Thật!</div>
                  <p style="margin:0 0 0.9rem;font-size:0.84rem;color:rgba(255,255,255,0.86);">
                    Đăng ký tài khoản miễn phí trong 10 giây để nhận ngay <b>+100 XP</b> khởi đầu và xuất hiện tức thì trên BXH Hàng Tuần & BXH Top!
                  </p>
                  <button type="button" class="pk9-btn-hero-main" data-open-auth="register" style="width:100%;justify-content:center;">
                    ✨ Đăng Ký Tài Khoản & Lên BXH Ngay
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            <button type="button" class="pk9-exam-chip ${APP.lbMode === 'weekly' ? 'active' : ''}" data-lb-mode="weekly">
              🔥 BXH Hàng Tuần (${(APP.lbData.weekly_leaderboard || []).length} học viên)
            </button>
            <button type="button" class="pk9-exam-chip ${APP.lbMode === 'top' ? 'active' : ''}" data-lb-mode="top">
              🏆 BXH Top Học Viên (${(APP.lbData.leaderboard || []).length} học viên)
            </button>
            <button type="button" class="pk9-exam-chip ${APP.lbMode === 'exam' ? 'active' : ''}" data-lb-mode="exam">
              🎯 BXH Cao Thủ Luyện Đề (${(APP.lbData.exam_leaderboard || []).length})
            </button>
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-lb-search-input" placeholder="Tìm học viên, trường THPT..." value="${esc(APP.lbSearch)}" />
          </div>
        </div>

        <!-- 3-SLOT ANIMATED PODIUM STAGE (100% REAL ACCOUNTS + VACANT CHALLENGER SLOTS) -->
        <div class="pk9-lb-podium">
          ${podiumSlots.map(slot => {
            const r = slot.rank;
            const row = slot.row;
            if (!row) {
              return `
                <div class="pk9-podium-card rank-${r} vacant">
                  <div class="pk9-podium-crown">${slot.crown}</div>
                  <div class="pk9-lb-avatar" style="background:var(--pk9-surface-2);color:var(--pk9-text-muted);box-shadow:none;border:2px dashed var(--pk9-border);">?</div>
                  <div style="font-weight:900;font-size:1.02rem;">${slot.title} • Đang chờ chủ nhân</div>
                  <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin:0.35rem 0 0.85rem;">
                    Vị trí Hạng #${r} đang bỏ trống. Đăng ký tài khoản hoặc làm đề ngay để chiếm vị trí này!
                  </div>
                  <button type="button" class="pk9-btn-exam-ghost" data-open-auth="register" style="padding:0.45rem 0.9rem;font-size:0.78rem;">
                    ⚡ Chiếm Hạng #${r} ngay
                  </button>
                </div>
              `;
            }
            const mainMetric = APP.lbMode === 'weekly'
              ? `🔥 ${row.weeklyXp} XP Tuần`
              : APP.lbMode === 'exam'
              ? `🎯 Đỉnh: ${Number(row.bestScore || 0).toFixed(2)}đ`
              : `⚡ ${row.xp} XP (Lv.${row.level})`;
            return `
              <div class="pk9-podium-card rank-${r}">
                <div class="pk9-podium-crown">${slot.crown}</div>
                <div class="pk9-lb-avatar">${esc((row.display_name || 'K').slice(0, 1).toUpperCase())}</div>
                <div style="font-weight:900;font-size:1.06rem;">${slot.title} • ${esc(row.display_name)}</div>
                <div style="font-size:0.79rem;color:var(--pk9-text-muted);margin:0.2rem 0 0.65rem;">
                  🏫 ${esc(row.school || 'Học viên đã đăng ký')} • Khối ${esc(row.grade || '2K9')}
                </div>
                <div style="display:flex;justify-content:center;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem;">
                  <span class="pk9-badge pk9-badge-subj">${mainMetric}</span>
                  <span class="pk9-badge pk9-badge-verified">📝 ${row.attempts || 0} đề • Cao nhất ${Number(row.bestScore || 0).toFixed(2)}đ</span>
                </div>
                <div style="display:flex;justify-content:center;gap:0.35rem;flex-wrap:wrap;">
                  ${(row.badges || []).slice(0, 2).map(b => `<span class="pk9-badge pk9-badge-code">🏅 ${esc(b)}</span>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="pk9-lb-table-wrap">
          <div class="pk9-lb-row" style="background:var(--pk9-surface-2);font-weight:800;font-size:0.78rem;color:var(--pk9-text-muted);text-transform:uppercase;">
            <div>Hạng</div>
            <div>Học viên & Trường</div>
            <div>${APP.lbMode === 'weekly' ? 'XP Tuần Này' : 'Tổng XP & Level'}</div>
            <div class="hide-mob">Thành tích Luyện đề</div>
            <div class="hide-mob">Chuỗi & Huy hiệu</div>
          </div>
          ${filtered.length ? filtered.map((row, idx) => {
            const isMe = APP.user && row.username === APP.user.username;
            const rankBadge = row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`;
            const curVal = Number(APP.lbMode === 'weekly' ? row.weeklyXp : row.xp) || 100;
            const pct = Math.min(100, Math.max(12, Math.round((curVal / maxMetric) * 100)));
            return `
              <div class="pk9-lb-row ${isMe ? 'me' : ''}" style="animation-delay:${Math.min(idx * 0.05, 0.4)}s;">
                <div style="font-weight:900;font-size:0.95rem;color:${row.rank <= 3 ? '#d97706' : 'var(--pk9-text)'};">
                  ${rankBadge}
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem;min-width:0;">
                  <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0d9488);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 6px 14px -4px rgba(37,99,235,0.45);">
                    ${esc((row.display_name || 'K').slice(0, 1).toUpperCase())}
                  </div>
                  <div style="min-width:0;">
                    <div style="font-weight:800;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      ${esc(row.display_name)} (@${esc(row.username)}) ${isMe ? '<span class="pk9-badge pk9-badge-subj">Bạn</span>' : ''}
                    </div>
                    <div style="font-size:0.76rem;color:var(--pk9-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      🏫 ${esc(row.school || 'Học viên đã đăng ký')} • Khối ${esc(row.grade || '2K9')}
                    </div>
                  </div>
                </div>
                <div>
                  <div style="font-weight:800;color:var(--pk9-primary);font-size:0.86rem;">
                    ${APP.lbMode === 'weekly'
                      ? `🔥 ${row.weeklyXp} XP Tuần`
                      : `⚡ ${row.xp} XP <span style="font-size:0.74rem;color:var(--pk9-text-muted);">(Lv.${row.level})</span>`}
                  </div>
                  <div class="pk9-topic-track" style="height:0.38rem;margin-top:0.28rem;">
                    <div class="pk9-topic-fill" style="width:${pct}%;"></div>
                  </div>
                </div>
                <div class="hide-mob" style="font-size:0.83rem;">
                  🎯 Đỉnh: <b>${Number(row.bestScore || 0).toFixed(2)}đ</b> • ${row.attempts || 0} đề
                </div>
                <div class="hide-mob" style="font-size:0.8rem;">
                  🔥 ${row.streak || 1} ngày • <span class="pk9-badge pk9-badge-code">${esc((row.badges || ['Thành Viên K9'])[0])}</span>
                </div>
              </div>
            `;
          }).join('') : `
            <div style="padding:2.2rem 1.5rem;text-align:center;color:var(--pk9-text-muted);font-size:0.9rem;">
              Chưa có học viên thật nào ghi nhận ở mục này. Hãy đăng ký tài khoản hoặc hoàn thành 1 đề thi để xuất hiện đầu tiên!
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 5: PDF PRO LIBRARY (84+ DOCUMENTS)
  // ==========================================================================
  function renderDocsTab() {
    const root = document.getElementById('tab-docs');
    if (!root) return;

    const kv = Array.isArray(window.KIMVAN_DOCS) ? window.KIMVAN_DOCS : [];
    const ref = Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27 : [];
    const allDocs = [
      ...ref.map((d, i) => ({ id: `ref-${i}`, title: d.title, subject: d.subject || 'Tổng hợp', kind: d.kind || 'Đề thi & Lời giải', source: d.source || 'Sở GD&ĐT', url: d.url })),
      ...kv.map((d, i) => ({ id: `kv-${i}`, title: d.title, subject: d.subject || 'Tổng hợp', kind: d.kind || 'Ebook / Tài liệu', source: 'Kho Tài Liệu Phúc K9', url: d.url }))
    ];

    const subjects = ['ALL', 'Toán 12', 'Vật lí 12', 'Hóa học 12', 'Sinh học 12', 'Tiếng Anh 12'];
    const q = APP.docSearch.trim().toLowerCase();
    const filtered = allDocs.filter(d => {
      if (APP.docSubject !== 'ALL' && !String(d.subject).toLowerCase().includes(APP.docSubject.replace(' 12', '').toLowerCase())) return false;
      if (!q) return true;
      return `${d.title} ${d.subject} ${d.kind} ${d.source}`.toLowerCase().includes(q);
    });

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>📚 Thư Viện Tài Liệu & Ebook PDF Pro (${allDocs.length} bộ tài liệu)</h2>
            <p>Tổng hợp Ebook thực chiến luyện đề, sổ tay công thức và bộ đề chính thức các trường THPT & Sở GD&ĐT.</p>
          </div>
        </div>

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            ${subjects.map(s => `
              <button type="button" class="pk9-exam-chip ${APP.docSubject === s ? 'active' : ''}" data-doc-subj="${esc(s)}">
                ${s === 'ALL' ? '📚 Tất cả (' + allDocs.length + ')' : esc(s)}
              </button>
            `).join('')}
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-doc-search-input" placeholder="Tìm tên Ebook, thầy cô, chuyên đề..." value="${esc(APP.docSearch)}" />
          </div>
        </div>

        <div class="pk9-exam-grid">
          ${filtered.map(d => `
            <article class="pk9-exam-card">
              <div>
                <div class="pk9-exam-card-badges">
                  <span class="pk9-badge pk9-badge-subj">${esc(d.subject)}</span>
                  <span class="pk9-badge pk9-badge-code">${esc(d.kind)}</span>
                </div>
                <h4>${esc(d.title)}</h4>
                <div class="pk9-exam-origin">🏛️ Nguồn: ${esc(d.source)}</div>
              </div>
              <div class="pk9-exam-actions">
                <a href="${esc(d.url)}" target="_blank" rel="noopener" class="pk9-btn-exam-primary" style="text-decoration:none;">
                  📖 Mở đọc / Tải tài liệu ↗
                </a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 6: 2K8 / 2K9 MASTER SHEETS ARCHIVE
  // ==========================================================================
  function renderArchiveTab() {
    const root = document.getElementById('tab-archive');
    if (!root) return;
    const sheets = Array.isArray(window.PK9_ARCHIVE_2K8) ? window.PK9_ARCHIVE_2K8 : [];

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>🗂️ Kho Tổng Ôn & Lộ Trình Master 2K8 / 2K9 (12 Kho Chuyên Sâu)</h2>
            <p>Hệ thống bảng tổng hợp chuyên đề, phác đồ luyện đề của các giáo viên hàng đầu Việt Nam.</p>
          </div>
        </div>
        <div class="pk9-exam-grid">
          ${sheets.map(sh => `
            <article class="pk9-exam-card">
              <div>
                <div class="pk9-exam-card-badges">
                  <span class="pk9-badge pk9-badge-subj">${esc(sh.subject)}</span>
                  <span class="pk9-badge pk9-badge-verified">🔥 ${esc(sh.tag)}</span>
                </div>
                <h4>${esc(sh.title)}</h4>
                <div class="pk9-exam-origin">👨‍🏫 Giáo viên: <b>${esc(sh.teacher)}</b> • 📦 Quy mô: ${esc(sh.items)}</div>
              </div>
              <div class="pk9-exam-actions">
                <a href="${esc(sh.url)}" target="_blank" rel="noopener" class="pk9-btn-exam-primary" style="text-decoration:none;">
                  🚀 Truy cập kho tài liệu ↗
                </a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 7: 3D INTERACTIVE FLASHCARDS
  // ==========================================================================
  function renderFlashcardsTab() {
    const root = document.getElementById('tab-flashcards');
    if (!root) return;
    const decks = Array.isArray(window.PK9_FLASHCARDS) ? window.PK9_FLASHCARDS : [];
    const deck = decks[APP.fcDeckIdx] || decks[0];
    if (!deck) return;
    const cards = deck.cards || [];
    const card = cards[APP.fcCardIdx % cards.length] || cards[0];

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>🃏 Flashcards 3D Phản Xạ Công Thức (${esc(deck.subject)})</h2>
            <p>Nhấn vào thẻ để lật 3D xem đáp án & công thức chuẩn. Hoàn thành bộ thẻ nhận ngay +20 XP.</p>
          </div>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            ${decks.map((d, idx) => `
              <button type="button" class="pk9-exam-chip ${idx === APP.fcDeckIdx ? 'active' : ''}" data-fc-deck="${idx}">
                ${d.icon} ${esc(d.subject)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="pk9-fc-scene" data-fc-flip="1">
          <div class="pk9-fc-card ${APP.fcFlipped ? 'flipped' : ''}" id="pk9-fc-card-el">
            <div class="pk9-fc-face pk9-fc-front">
              <span class="pk9-badge pk9-badge-subj" style="margin-bottom:0.85rem;">
                ${deck.icon} ${esc(deck.subject)} • Thẻ ${(APP.fcCardIdx % cards.length) + 1}/${cards.length} (Nhấn để lật)
              </span>
              <div style="font-size:1.18rem;font-weight:800;line-height:1.55;">${card.front}</div>
            </div>
            <div class="pk9-fc-face pk9-fc-back">
              <span class="pk9-badge" style="background:rgba(255,255,255,0.2);color:#fff;margin-bottom:0.85rem;">
                💡 Đáp án & Công thức chuẩn
              </span>
              <div style="font-size:1.12rem;font-weight:700;line-height:1.6;">${card.back}</div>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:center;gap:0.75rem;flex-wrap:wrap;">
          <button type="button" class="pk9-btn-exam-ghost" data-fc-prev="1">← Thẻ trước</button>
          <button type="button" class="pk9-btn-exam-ghost" data-fc-flip="1">🔄 Lật thẻ 3D</button>
          <button type="button" class="pk9-btn-exam-primary" data-fc-mastered="${esc(deck.id)}_${APP.fcCardIdx}" style="max-width:240px;">
            ✅ Đã thuộc thẻ này (+20 XP)
          </button>
          <button type="button" class="pk9-btn-exam-ghost" data-fc-next="1">Thẻ tiếp →</button>
        </div>
      </div>
    `;
    typeset(root);
  }

  // ==========================================================================
  // TAB 8: COMMUNITY LIBRARY (/api/community)
  // ==========================================================================
  async function loadCommunityItems() {
    try {
      const resp = await fetch('/api/community?action=list', { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data?.items)) APP.communityItems = data.items;
      }
    } catch {}
  }

  function renderCommunityTab() {
    const root = document.getElementById('tab-community');
    if (!root) return;

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>🤝 Thư Viện Cộng Đồng Học Viên Phúc K9</h2>
            <p>Nơi học sinh chia sẻ sơ đồ tư duy, ghi chú công thức và đề thi sưu tầm từ các trường THPT trên toàn quốc.</p>
          </div>
        </div>

        <div class="pk9-card">
          <h4 style="margin:0 0 0.75rem;font-size:1rem;font-weight:800;">📤 Đóng góp tài liệu / link đề thi cho cộng đồng K9</h4>
          <form id="pk9-community-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.75rem;">
            <input type="text" name="title" class="pk9-input" placeholder="Tên tài liệu / đề thi..." required />
            <input type="text" name="subject" class="pk9-input" placeholder="Môn học (VD: Toán 12, Sinh 12)" required />
            <input type="url" name="url" class="pk9-input" placeholder="Link Google Drive / PDF / OneDrive..." required />
            <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.35rem;">🚀 Chia sẻ lên Cộng đồng</button>
          </form>
        </div>

        <div class="pk9-exam-grid">
          ${APP.communityItems.length ? APP.communityItems.map(item => `
            <article class="pk9-exam-card">
              <div>
                <span class="pk9-badge pk9-badge-subj" style="margin-bottom:0.5rem;">${esc(item.subject || 'Tài liệu K9')}</span>
                <h4>${esc(item.title)}</h4>
                <div class="pk9-exam-origin">👤 Đóng góp bởi: ${esc(item.author || item.username || 'Học viên K9')}</div>
              </div>
              <a href="${esc(item.url || '#')}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost" style="margin-top:0.75rem;">
                🔗 Mở tài liệu chia sẻ ↗
              </a>
            </article>
          `).join('') : `
            <div class="pk9-card" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--pk9-text-muted);">
              Chưa có tài liệu cộng đồng nào được tải lên. Hãy là học viên đầu tiên chia sẻ tài liệu phía trên!
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 9: POMODORO DESK & STUDY PLANNER
  // ==========================================================================
  function renderPlannerTab() {
    const root = document.getElementById('tab-planner');
    if (!root) return;
    const m = Math.floor(APP.pomoSec / 60);
    const s = APP.pomoSec % 60;

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>⏱️ Bàn Học Tập Trung Pomodoro & Lộ Trình Về Đích 9+</h2>
            <p>Phương pháp học sâu 25 phút tập trung cao độ — 5 phút nghỉ ngơi giúp tối ưu hóa trí nhớ dài hạn.</p>
          </div>
        </div>

        <div class="pk9-grid-3">
          <div class="pk9-card" style="text-align:center;">
            <div style="display:flex;justify-content:center;gap:0.4rem;margin-bottom:1rem;">
              <button type="button" class="pk9-exam-chip ${APP.pomoMode === 25 ? 'active' : ''}" data-pomo-mode="25">🍅 Học sâu 25p</button>
              <button type="button" class="pk9-exam-chip ${APP.pomoMode === 50 ? 'active' : ''}" data-pomo-mode="50">🔥 Luyện đề 50p</button>
              <button type="button" class="pk9-exam-chip ${APP.pomoMode === 5 ? 'active' : ''}" data-pomo-mode="5">☕ Nghỉ 5p</button>
            </div>
            <div id="pk9-pomo-clock" style="font-size:3.4rem;font-weight:900;font-family:'JetBrains Mono',monospace;color:var(--pk9-primary);margin:0.5rem 0 1rem;">
              ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}
            </div>
            <div style="display:flex;justify-content:center;gap:0.6rem;">
              <button type="button" class="pk9-btn-exam-primary" data-pomo-toggle="1">
                ${APP.pomoRunning ? '⏸ Tạm dừng' : '▶️ Bắt đầu phiên học'}
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-pomo-reset="1">🔄 Đặt lại</button>
            </div>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.75rem;font-size:1.02rem;font-weight:800;">🎯 Phác đồ 3 Giai đoạn Chinh phục 9+</h4>
            <ul style="margin:0;padding-left:1.15rem;font-size:0.87rem;line-height:1.7;color:var(--pk9-text-muted);">
              <li><b>Giai đoạn 1 (Nền tảng 8+):</b> Hoàn thành 100% video bài giảng và câu hỏi trắc nghiệm từng chương.</li>
              <li><b>Giai đoạn 2 (Tổng ôn & Đúng/Sai):</b> Rèn kỹ năng xử lý 4 mệnh đề Đúng/Sai và điền đáp số trả lời ngắn.</li>
              <li><b>Giai đoạn 3 (Thực chiến Phòng thi):</b> Luyện tối thiểu 2 đề/tuần tại Phòng Thi Ảo Phúc K9 và kiểm tra bảng phân tích chuyên đề yếu.</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 10: AI TUTOR PHÚC K9 (/api/ai + SMART FALLBACK)
  // ==========================================================================
  function renderAiTab() {
    const root = document.getElementById('tab-ai');
    if (!root) return;

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>🤖 Trợ Lý AI Học Tập Phúc K9 (Giải Toán, Lí, Hóa, Sinh, Anh 24/7)</h2>
            <p>Đặt câu hỏi về công thức, phương pháp giải bài tập hoặc nhờ AI lập kế hoạch ôn thi cá nhân hóa.</p>
          </div>
        </div>

        <div class="pk9-card">
          <div id="pk9-ai-messages" style="min-height:260px;max-height:420px;overflow-y:auto;padding:1rem;border-radius:1rem;background:var(--pk9-surface-2);margin-bottom:1rem;display:flex;flex-direction:column;gap:0.75rem;">
            <div style="align-self:flex-start;max-width:85%;padding:0.85rem 1.1rem;border-radius:1rem;background:var(--pk9-surface);border:1px solid var(--pk9-border);font-size:0.9rem;">
              👋 Xin chào! Mình là <b>Trợ lý AI Học Cùng Phúc K9</b>. Bạn cần giải thích công thức Toán 12, Vật lí 12, Hóa học 12 (IUPAC), Sinh học 12 hay chiến thuật làm đề GDPT 2018? Hãy nhập câu hỏi bên dưới nhé!
            </div>
          </div>
          <form id="pk9-ai-form" style="display:flex;gap:0.65rem;">
            <input type="text" id="pk9-ai-input" class="pk9-input" style="margin-top:0;flex:1;" placeholder="Nhập câu hỏi bài tập hoặc công thức cần giải thích..." required />
            <button type="submit" class="pk9-btn-exam-primary" style="flex:0 0 auto;padding:0 1.35rem;">Gửi câu hỏi 🚀</button>
          </form>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // AUTH MODAL (LOGIN / REGISTER / PROFILE)
  // ==========================================================================
  function openAuthModal(defaultMode = 'register') {
    const modal = document.getElementById('pk9-auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    renderAuthModalContent(defaultMode);
  }

  function closeAuthModal() {
    const modal = document.getElementById('pk9-auth-modal');
    if (modal) modal.classList.remove('open');
  }

  function renderAuthModalContent(mode = 'register') {
    const box = document.getElementById('pk9-auth-modal-box');
    if (!box) return;

    if (APP.user && mode !== 'login' && mode !== 'register') {
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h3 style="margin:0;font-size:1.2rem;font-weight:900;">👤 Hồ Sơ Học Viên Phúc K9</h3>
          <button type="button" class="pk9-icon-btn" data-close-auth="1">✕</button>
        </div>
        <div style="padding:1rem;border-radius:1rem;background:var(--pk9-surface-2);margin-bottom:1rem;">
          <div style="font-weight:900;font-size:1.05rem;">${esc(APP.user.display_name)} (@${esc(APP.user.username)})</div>
          <div style="font-size:0.83rem;color:var(--pk9-text-muted);margin-top:0.2rem;">
            ⚡ Tổng XP: <b>${APP.user.xp || 100} XP</b> • 🔥 XP Tuần: <b>${APP.user.weekly_xp || 100} XP</b> • Chuỗi: <b>${APP.user.streak || 1} ngày</b>
          </div>
        </div>
        <form id="pk9-profile-form" style="display:flex;flex-direction:column;gap:0.75rem;">
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Họ và tên hiển thị trên BXH</label>
            <input type="text" name="display_name" class="pk9-input" value="${esc(APP.user.display_name || '')}" required />
          </div>
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Trường THPT / THCS</label>
            <input type="text" name="school" class="pk9-input" value="${esc(APP.user.settings?.school || '')}" placeholder="VD: THPT Chuyên Hà Nội - Amsterdam" />
          </div>
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Khối lớp ưu tiên</label>
            <select name="preferred_grade" class="pk9-input">
              <option value="2K9" ${APP.user.settings?.preferred_grade === '2K9' ? 'selected' : ''}>Lớp 12 — Luyện thi THPT (2K9)</option>
              <option value="2K11" ${APP.user.settings?.preferred_grade === '2K11' ? 'selected' : ''}>Lớp 10 Chương trình mới (2K11)</option>
              <option value="2K12" ${APP.user.settings?.preferred_grade === '2K12' ? 'selected' : ''}>Ôn thi vào lớp 10 (2K12)</option>
            </select>
          </div>
          <div style="display:flex;gap:0.6rem;margin-top:0.5rem;">
            <button type="submit" class="pk9-btn-exam-primary">💾 Lưu hồ sơ</button>
            <button type="button" class="pk9-btn-exam-ghost" data-logout-btn="1" style="color:#ef4444;">Đăng xuất</button>
          </div>
        </form>
      `;
      return;
    }

    const isReg = mode === 'register';
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 style="margin:0;font-size:1.22rem;font-weight:900;">
          ${isReg ? '🚀 Đăng Ký Tài Khoản Học Viên (+100 XP)' : '🔐 Đăng Nhập Hệ Sinh Thái Phúc K9'}
        </h3>
        <button type="button" class="pk9-icon-btn" data-close-auth="1">✕</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;background:var(--pk9-surface-2);padding:0.3rem;border-radius:0.8rem;margin-bottom:1rem;">
        <button type="button" class="pk9-grade-btn ${isReg ? 'active' : ''}" data-switch-auth-mode="register">✨ Đăng ký mới</button>
        <button type="button" class="pk9-grade-btn ${!isReg ? 'active' : ''}" data-switch-auth-mode="login">🔑 Đăng nhập</button>
      </div>

      <form id="pk9-auth-form" data-mode="${isReg ? 'register' : 'login'}" style="display:flex;flex-direction:column;gap:0.75rem;">
        <div>
          <label style="font-size:0.82rem;font-weight:700;">Tên đăng nhập (viết liền không dấu)</label>
          <input type="text" name="username" class="pk9-input" placeholder="VD: minhanh2k9" required />
        </div>
        ${isReg ? `
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Họ và tên hiển thị trên Bảng Xếp Hạng</label>
            <input type="text" name="display_name" class="pk9-input" placeholder="VD: Nguyễn Minh Anh" required />
          </div>
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Trường học (hiển thị trên BXH Tuần & Top)</label>
            <input type="text" name="school" class="pk9-input" placeholder="VD: THPT Chuyên Lê Hồng Phong" />
          </div>
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Khối lớp</label>
            <select name="preferred_grade" class="pk9-input">
              <option value="2K9">Khối 12 — Luyện thi THPT Quốc Gia (2K9)</option>
              <option value="2K11">Khối 10 — Chương trình mới (2K11)</option>
              <option value="2K12">Khối 9 — Ôn thi vào lớp 10 (2K12)</option>
            </select>
          </div>
        ` : ''}
        <div>
          <label style="font-size:0.82rem;font-weight:700;">Mật khẩu (tối thiểu 6 ký tự)</label>
          <input type="password" name="password" class="pk9-input" placeholder="••••••••" required />
        </div>
        <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.5rem;padding:0.8rem;">
          ${isReg ? '🎉 Hoàn tất Đăng ký & Nhận +100 XP Lên BXH' : '🚀 Đăng nhập ngay'}
        </button>
      </form>
    `;
  }

  // ==========================================================================
  // COMMAND PALETTE (CTRL + K)
  // ==========================================================================
  function openCommandPalette() {
    const modal = document.getElementById('pk9-cmd-modal');
    if (!modal) return;
    modal.classList.add('open');
    const input = document.getElementById('pk9-cmd-input');
    if (input) {
      input.value = '';
      renderCommandResults('');
      setTimeout(() => input.focus(), 50);
    }
  }

  function renderCommandResults(query) {
    const box = document.getElementById('pk9-cmd-results');
    if (!box) return;
    const q = String(query || '').trim().toLowerCase();
    const results = [];

    for (const c of getCatalog()) {
      for (const ch of c.chapters || []) {
        for (const t of ch.topics || []) {
          if (!q || `${t.title} ${c.name} ${t.teacher}`.toLowerCase().includes(q)) {
            results.push({
              kind: '🎬 Bài giảng Video',
              title: t.title,
              sub: `${c.shortName || c.name} • ${t.teacher}`,
              action: () => {
                document.getElementById('pk9-cmd-modal')?.classList.remove('open');
                switchTab('lectures', { courseId: c.id, topicId: t.id });
              }
            });
          }
          if (results.length >= 12) break;
        }
        if (results.length >= 12) break;
      }
      if (results.length >= 12) break;
    }

    for (const ex of window.PK9_SEED_EXAMS || []) {
      if (!q || `${ex.title} ${ex.subject} ${ex.sourceOrg}`.toLowerCase().includes(q)) {
        results.push({
          kind: '🏛️ Đề thi chấm điểm',
          title: ex.title,
          sub: `${ex.subject} • ${ex.sourceOrg}`,
          action: () => {
            document.getElementById('pk9-cmd-modal')?.classList.remove('open');
            switchTab('exams');
            if (window.PK9_EXAM_CENTER) window.PK9_EXAM_CENTER.startExamById(ex.id);
          }
        });
      }
    }

    window._pk9CmdActions = results.slice(0, 10);
    box.innerHTML = window._pk9CmdActions.map((item, idx) => `
      <button type="button" class="pk9-topic-btn" data-cmd-idx="${idx}" style="width:100%;padding:0.7rem 0.85rem;border-bottom:1px solid var(--pk9-border);">
        <div>
          <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-primary);">${esc(item.kind)}</div>
          <div style="font-weight:800;color:var(--pk9-text);">${esc(item.title)}</div>
          <div style="font-size:0.76rem;color:var(--pk9-text-muted);">${esc(item.sub)}</div>
        </div>
        <span>↵</span>
      </button>
    `).join('');
  }

  // ==========================================================================
  // GLOBAL EVENT DELEGATION
  // ==========================================================================
  function bindEvents() {
    document.addEventListener('click', async e => {
      const navBtn = e.target.closest('[data-nav-tab]');
      if (navBtn) {
        switchTab(navBtn.getAttribute('data-nav-tab'));
        return;
      }

      const gradeBtn = e.target.closest('[data-set-grade]');
      if (gradeBtn) {
        APP.gradeFilter = gradeBtn.getAttribute('data-set-grade') || '2K9';
        document.querySelectorAll('[data-set-grade]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-set-grade') === APP.gradeFilter);
        });
        if (APP.gradeFilter !== 'ALL') {
          const firstCourse = getCatalog().find(c => c.grade === APP.gradeFilter);
          if (firstCourse) {
            APP.activeCourseId = firstCourse.id;
            APP.activeTopicId = firstCourse.chapters?.[0]?.topics?.[0]?.id || '';
          }
        }
        if (APP.activeTab === 'home') renderHomeTab();
        if (APP.activeTab === 'lectures') renderLecturesTab();
        return;
      }

      const openCourseBtn = e.target.closest('[data-open-lecture-course]');
      if (openCourseBtn) {
        const cId = openCourseBtn.getAttribute('data-open-lecture-course');
        const tId = openCourseBtn.getAttribute('data-open-lecture-topic');
        switchTab('lectures', { courseId: cId, topicId: tId });
        return;
      }

      const quickExamBtn = e.target.closest('[data-quick-start-exam]');
      if (quickExamBtn) {
        const exId = quickExamBtn.getAttribute('data-quick-start-exam');
        switchTab('exams');
        if (window.PK9_EXAM_CENTER) window.PK9_EXAM_CENTER.startExamById(exId);
        return;
      }

      const selLectureGrade = e.target.closest('[data-select-lecture-grade]');
      if (selLectureGrade) {
        const gCode = selLectureGrade.getAttribute('data-select-lecture-grade') || '2K9';
        APP.gradeFilter = gCode;
        document.querySelectorAll('[data-set-grade]').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-set-grade') === gCode);
        });
        const firstCourse = getCatalog().find(c => c.grade === gCode);
        if (firstCourse) {
          APP.activeCourseId = firstCourse.id;
          APP.activeTopicId = firstCourse.chapters?.[0]?.topics?.[0]?.id || '';
        }
        renderLecturesTab();
        return;
      }

      const selCourse = e.target.closest('[data-select-course]');
      if (selCourse) {
        APP.activeCourseId = selCourse.getAttribute('data-select-course');
        const c = getCourseById(APP.activeCourseId);
        APP.activeTopicId = c?.chapters?.[0]?.topics?.[0]?.id || '';
        renderLecturesTab();
        return;
      }

      const selTopic = e.target.closest('[data-select-topic]');
      if (selTopic) {
        APP.activeTopicId = selTopic.getAttribute('data-select-topic');
        renderLecturesTab();
        return;
      }

      const subtabBtn = e.target.closest('[data-study-subtab]');
      if (subtabBtn) {
        APP.studySubtab = subtabBtn.getAttribute('data-study-subtab');
        renderLecturesTab();
        return;
      }

      const theaterBtn = e.target.closest('[data-toggle-theater]');
      if (theaterBtn) {
        APP.theaterMode = !APP.theaterMode;
        renderLecturesTab();
        return;
      }

      const doneBtn = e.target.closest('[data-toggle-done-topic]');
      if (doneBtn) {
        const tId = doneBtn.getAttribute('data-toggle-done-topic');
        APP.doneMap[tId] = !APP.doneMap[tId];
        await syncProgressToServer();
        if (APP.doneMap[tId]) {
          toast('🎉 Đã hoàn thành bài giảng! +25 XP tích lũy vào BXH.', 'success');
          if (APP.user) {
            try {
              await fetch('/api/dashboard?action=record-study', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
                body: JSON.stringify({ type: 'lesson', item_id: tId })
              });
              fetchAuthAndLeaderboard();
            } catch {}
          }
        }
        renderLecturesTab();
        updateHeaderAuthUI();
        return;
      }

      const quizOpt = e.target.closest('[data-topic-quiz]');
      if (quizOpt) {
        const qKey = quizOpt.getAttribute('data-topic-quiz');
        const oIdx = Number(quizOpt.getAttribute('data-topic-opt'));
        APP.quizAnswers[qKey] = oIdx;
        renderLecturesTab();
        return;
      }

      const saveNoteBtn = e.target.closest('[data-save-note]');
      if (saveNoteBtn) {
        const tId = saveNoteBtn.getAttribute('data-save-note');
        const area = document.getElementById('pk9-topic-note-area');
        if (area) {
          APP.notesMap[tId] = area.value;
          await syncProgressToServer();
          toast('💾 Đã lưu ghi chú bài giảng!', 'success');
        }
        return;
      }

      const lbModeBtn = e.target.closest('[data-lb-mode]');
      if (lbModeBtn) {
        APP.lbMode = lbModeBtn.getAttribute('data-lb-mode');
        renderLeaderboardTab();
        return;
      }

      const docSubjBtn = e.target.closest('[data-doc-subj]');
      if (docSubjBtn) {
        APP.docSubject = docSubjBtn.getAttribute('data-doc-subj');
        renderDocsTab();
        return;
      }

      const fcDeckBtn = e.target.closest('[data-fc-deck]');
      if (fcDeckBtn) {
        APP.fcDeckIdx = Number(fcDeckBtn.getAttribute('data-fc-deck'));
        APP.fcCardIdx = 0;
        APP.fcFlipped = false;
        renderFlashcardsTab();
        return;
      }

      const fcFlip = e.target.closest('[data-fc-flip]');
      if (fcFlip) {
        APP.fcFlipped = !APP.fcFlipped;
        const cardEl = document.getElementById('pk9-fc-card-el');
        if (cardEl) cardEl.classList.toggle('flipped', APP.fcFlipped);
        return;
      }

      const fcPrev = e.target.closest('[data-fc-prev]');
      if (fcPrev) {
        APP.fcCardIdx = Math.max(0, APP.fcCardIdx - 1);
        APP.fcFlipped = false;
        renderFlashcardsTab();
        return;
      }

      const fcNext = e.target.closest('[data-fc-next]');
      if (fcNext) {
        APP.fcCardIdx += 1;
        APP.fcFlipped = false;
        renderFlashcardsTab();
        return;
      }

      const fcMastered = e.target.closest('[data-fc-mastered]');
      if (fcMastered) {
        const itemId = fcMastered.getAttribute('data-fc-mastered');
        APP.fcCardIdx += 1;
        APP.fcFlipped = false;
        toast('⚡ Đã ghi nhớ thẻ công thức! (+20 XP)', 'success');
        if (APP.user) {
          try {
            await fetch('/api/dashboard?action=record-study', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
              body: JSON.stringify({ type: 'flashcard', item_id: itemId })
            });
            fetchAuthAndLeaderboard();
          } catch {}
        }
        renderFlashcardsTab();
        return;
      }

      const pomoModeBtn = e.target.closest('[data-pomo-mode]');
      if (pomoModeBtn) {
        const m = Number(pomoModeBtn.getAttribute('data-pomo-mode')) || 25;
        APP.pomoMode = m;
        APP.pomoSec = m * 60;
        APP.pomoRunning = false;
        if (APP.pomoTimer) clearInterval(APP.pomoTimer);
        renderPlannerTab();
        return;
      }

      const pomoToggle = e.target.closest('[data-pomo-toggle]');
      if (pomoToggle) {
        APP.pomoRunning = !APP.pomoRunning;
        if (APP.pomoRunning) {
          APP.pomoTimer = setInterval(() => {
            APP.pomoSec = Math.max(0, APP.pomoSec - 1);
            const clock = document.getElementById('pk9-pomo-clock');
            if (clock) {
              clock.textContent = `${String(Math.floor(APP.pomoSec / 60)).padStart(2, '0')}:${String(APP.pomoSec % 60).padStart(2, '0')}`;
            }
            if (APP.pomoSec === 0) {
              clearInterval(APP.pomoTimer);
              APP.pomoRunning = false;
              toast('🍅 Hoàn thành phiên tập trung Pomodoro!', 'success');
              renderPlannerTab();
            }
          }, 1000);
        } else if (APP.pomoTimer) {
          clearInterval(APP.pomoTimer);
        }
        renderPlannerTab();
        return;
      }

      const pomoReset = e.target.closest('[data-pomo-reset]');
      if (pomoReset) {
        APP.pomoRunning = false;
        if (APP.pomoTimer) clearInterval(APP.pomoTimer);
        APP.pomoSec = APP.pomoMode * 60;
        renderPlannerTab();
        return;
      }

      const openAuth = e.target.closest('[data-open-auth]');
      if (openAuth) {
        openAuthModal(openAuth.getAttribute('data-open-auth') || 'register');
        return;
      }

      const closeAuth = e.target.closest('[data-close-auth]');
      if (closeAuth) {
        closeAuthModal();
        return;
      }

      const switchAuthMode = e.target.closest('[data-switch-auth-mode]');
      if (switchAuthMode) {
        renderAuthModalContent(switchAuthMode.getAttribute('data-switch-auth-mode'));
        return;
      }

      const logoutBtn = e.target.closest('[data-logout-btn]');
      if (logoutBtn) {
        try {
          await fetch('/api/auth?action=logout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'x-csrf-token': APP.csrf }
          });
        } catch {}
        APP.user = null;
        closeAuthModal();
        toast('Đã đăng xuất tài khoản.', 'info');
        fetchAuthAndLeaderboard();
        return;
      }

      const themeBtn = e.target.closest('[data-toggle-theme]');
      if (themeBtn) {
        const isDark = document.documentElement.classList.toggle('dark');
        try { localStorage.setItem('pk9_theme', isDark ? 'dark' : 'light'); } catch {}
        themeBtn.textContent = isDark ? '☀️' : '🌙';
        return;
      }

      const mobMenuBtn = e.target.closest('[data-toggle-mobile-sidebar]');
      if (mobMenuBtn) {
        const sb = document.getElementById('pk9-sidebar');
        const bd = document.getElementById('pk9-sidebar-backdrop');
        const open = sb?.classList.toggle('mobile-open');
        if (bd) bd.classList.toggle('open', Boolean(open));
        return;
      }

      const closeMobMenu = e.target.closest('[data-close-mobile-sidebar]');
      if (closeMobMenu) {
        document.getElementById('pk9-sidebar')?.classList.remove('mobile-open');
        document.getElementById('pk9-sidebar-backdrop')?.classList.remove('open');
        return;
      }

      const cmdTrigger = e.target.closest('[data-open-cmd]');
      if (cmdTrigger) {
        openCommandPalette();
        return;
      }

      const closeCmd = e.target.closest('[data-close-cmd]');
      if (closeCmd) {
        document.getElementById('pk9-cmd-modal')?.classList.remove('open');
        return;
      }

      const cmdItem = e.target.closest('[data-cmd-idx]');
      if (cmdItem) {
        const idx = Number(cmdItem.getAttribute('data-cmd-idx'));
        const act = window._pk9CmdActions?.[idx];
        if (act && typeof act.action === 'function') act.action();
      }
    });

    document.addEventListener('input', e => {
      if (e.target.id === 'pk9-lecture-search-input') {
        APP.lectureSearch = e.target.value || '';
        renderLecturesTab();
        const el = document.getElementById('pk9-lecture-search-input');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      } else if (e.target.id === 'pk9-lb-search-input') {
        APP.lbSearch = e.target.value || '';
        renderLeaderboardTab();
        const el = document.getElementById('pk9-lb-search-input');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      } else if (e.target.id === 'pk9-doc-search-input') {
        APP.docSearch = e.target.value || '';
        renderDocsTab();
        const el = document.getElementById('pk9-doc-search-input');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      } else if (e.target.id === 'pk9-cmd-input') {
        renderCommandResults(e.target.value || '');
      }
    });

    document.addEventListener('submit', async e => {
      if (e.target.id === 'pk9-auth-form') {
        e.preventDefault();
        const form = e.target;
        const mode = form.getAttribute('data-mode') || 'register';
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        try {
          const resp = await fetch(`/api/auth?action=${mode}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify(payload)
          });
          const data = await resp.json();
          if (!resp.ok || !data?.ok) {
            toast(data?.message || 'Không thể xác thực tài khoản.', 'error');
            return;
          }
          APP.user = data.user;
          APP.csrf = data.csrf || APP.csrf;
          closeAuthModal();
          toast(data.message || 'Thành công!', 'success');
          await fetchAuthAndLeaderboard();
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
      }

      if (e.target.id === 'pk9-profile-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
          const resp = await fetch('/api/auth?action=save-profile', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify(payload)
          });
          const data = await resp.json();
          if (resp.ok && data?.ok) {
            APP.user = data.user;
            closeAuthModal();
            toast('Đã cập nhật hồ sơ & trường học trên BXH!', 'success');
            await fetchAuthAndLeaderboard();
          } else {
            toast(data?.message || 'Không thể lưu hồ sơ.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
      }

      if (e.target.id === 'pk9-community-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const item = Object.fromEntries(fd.entries());
        APP.communityItems.unshift({
          ...item,
          author: APP.user?.display_name || 'Học viên K9'
        });
        try {
          await fetch('/api/community?action=create', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify(item)
          });
        } catch {}
        toast('🎉 Đã chia sẻ tài liệu lên Thư viện Cộng đồng!', 'success');
        renderCommunityTab();
      }

      if (e.target.id === 'pk9-ai-form') {
        e.preventDefault();
        const input = document.getElementById('pk9-ai-input');
        const box = document.getElementById('pk9-ai-messages');
        const q = String(input?.value || '').trim();
        if (!q || !box) return;
        input.value = '';
        box.insertAdjacentHTML('beforeend', `
          <div style="align-self:flex-end;max-width:80%;padding:0.75rem 1rem;border-radius:1rem;background:var(--pk9-primary);color:#fff;font-size:0.9rem;font-weight:600;">
            ${esc(q)}
          </div>
        `);
        let reply = 'Để giải quyết câu hỏi này nhanh và chính xác nhất: (1) Xác định dạng bài trong mục Lý thuyết & Công thức của khóa học tương ứng; (2) Áp dụng công thức trọng tâm và kiểm tra điều kiện xác định; (3) Rèn phản xạ thêm tại Phòng Luyện Đề Nguồn Thật.';
        try {
          const resp = await fetch('/api/ai', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: q })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data?.reply || data?.answer || data?.text) {
              reply = data.reply || data.answer || data.text;
            }
          }
        } catch {}
        box.insertAdjacentHTML('beforeend', `
          <div style="align-self:flex-start;max-width:85%;padding:0.85rem 1.1rem;border-radius:1rem;background:var(--pk9-surface);border:1px solid var(--pk9-border);font-size:0.9rem;white-space:pre-line;">
            🤖 <b>Trợ lý AI Phúc K9:</b>\n${esc(reply)}
          </div>
        `);
        box.scrollTop = box.scrollHeight;
        typeset(box);
      }
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
      } else if (e.key === 'Escape') {
        closeAuthModal();
        document.getElementById('pk9-cmd-modal')?.classList.remove('open');
      }
    });
  }

  async function initApp() {
    try {
      const savedTheme = localStorage.getItem('pk9_theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch {}

    loadLocalProgress();
    bindEvents();
    renderHomeTab();
    updateHeaderAuthUI();
    await fetchAuthAndLeaderboard();
    loadCommunityItems();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(window, document);
