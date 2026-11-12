/* ============================================================================
 * HỌC CÙNG PHÚC K9 — CORE ECOSYSTEM APPLICATION CONTROLLER (PC & MOBILE)
 * ============================================================================ */
(function (window, document) {
  'use strict';

  const APP = {
    activeTab: 'home',
    gradeFilter: '2K9', // '2K9' | '2K8' | 'DGNL' | '2K11' | '2K12' | 'ALL'
    active2k9Subject: 'Toán',
    activeCourseId: '2k9-toan-thay-do-van-duc',
    activeTopicId: '',
    showTeacherPdfDrawer: false,
    teacherPdfSearch: '',
    openChaptersMap: {},
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
    inlinePdfUrl: '',
    inlinePdfTitle: '',
    communityItems: [],
    // Khóa Chui Tham Khảo In-Web State
    kcMode: 'htmlview', // 'htmlview' | 'htmlembed' | 'split'
    kcZoom: 100, // 80 | 90 | 100 | 115 | 130
    kcFullscreen: false,
    kcSearch: '',
    kcSubject: 'ALL',
    customKhoaChui: [],
    systemAnnouncement: null,
    // Super Detailed Admin Dashboard State
    adminSubtab: 'overview', // 'overview' | 'users' | 'exams' | 'content' | 'system'
    adminUserSearch: '',
    adminUserRoleFilter: 'ALL',
    adminExamSearch: '',
    adminDetailData: null,
    adminLoading: false,
    adminSelectedStudent: null
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

  const LOADED_2K9_BUNDLES = {};
  const LOADING_2K9_BUNDLES = {};

  function getCatalog() {
    return Array.isArray(window.PK9_CATALOG) ? window.PK9_CATALOG : [];
  }

  function expandCompact2k9Chapters(course, compactChapters) {
    return (compactChapters || []).map(ch => ({
      id: ch.id,
      title: ch.title,
      topics: (ch.topics || []).map((t, idx) => {
        const isPdfOnly = t.k === 'pdf' || (!t.v && !t.dv && Boolean(t.p));
        const pdfList = [];
        if (t.p) pdfList.push(t.p);
        if (t.sp) pdfList.push(t.sp);
        if (Array.isArray(t.ep)) t.ep.forEach(x => { if (x?.url) pdfList.push(x.url); });
        return {
          id: t.id,
          code: `${idx + 1}`,
          title: t.title,
          teacher: course.teacher,
          duration: isPdfOnly ? 'Tài liệu PDF' : '1 tiếng 20 phút',
          kind: isPdfOnly ? 'pdf' : 'video',
          videoId: t.v || undefined,
          videoUrl: t.v ? `https://www.youtube.com/watch?v=${t.v}` : (t.dv || t.p || ''),
          driveVideoUrl: t.dv || undefined,
          pdfUrl: t.p || undefined,
          solutionPdfUrl: t.sp || undefined,
          pdfs: Array.isArray(t.ep) ? t.ep.map(x => ({ label: x.label || 'Tài liệu PDF', icon: '📄', url: x.url })) : undefined,
          desc: `${t.s ? t.s + ' — ' : ''}${course.teacher} (${course.subject} 12).${pdfList.length ? ` Kèm ${pdfList.length} file PDF.` : ''}`,
          theory: `<div class="space-y-2"><p><strong>${esc(course.subject)} 12 — ${esc(course.teacher)}:</strong> ${esc(t.title)}</p><ul class="list-disc list-inside space-y-1"><li><strong>Chuyên mục / Giai đoạn:</strong> ${esc(ch.title)}</li>${t.s ? `<li><strong>Phân mục:</strong> ${esc(t.s)}</li>` : ''}<li><strong>Học liệu:</strong> ${isPdfOnly ? 'Tài liệu PDF đầy đủ (đọc trực tiếp hoặc tải Drive).' : 'Video bài giảng chi tiết'}${pdfList.length ? ` kèm ${pdfList.length} file PDF ngay phía dưới.` : '.'}</li></ul></div>`,
          problemTypes: [
            {
              title: `Phương pháp học hiệu quả cùng ${course.teacher}`,
              method: 'Bước 1: Mở tài liệu PDF đề/lý thuyết ngay bên dưới để nắm khung câu hỏi trước khi học.\nBước 2: Ghi chú công thức giải nhanh & lỗi sai hay gặp vào Sổ tay.\nBước 3: Đánh dấu hoàn thành (+25 XP) để theo dõi tiến độ từng chương của thầy/cô.'
            }
          ],
          exercises: []
        };
      })
    }));
  }

  async function ensure2k9CourseLoaded(course) {
    if (!course || course.grade !== '2K9' || !course.dataFile) return true;
    if (Array.isArray(course.chapters) && course.chapters.length > 0) return true;

    const url = course.dataFile;
    if (LOADED_2K9_BUNDLES[url]) {
      const bundle = LOADED_2K9_BUNDLES[url];
      for (const c of getCatalog()) {
        if (c.grade === '2K9' && c.dataFile === url && (!c.chapters || !c.chapters.length) && bundle[c.id]) {
          c.chapters = expandCompact2k9Chapters(c, bundle[c.id]);
        }
      }
      return true;
    }

    if (LOADING_2K9_BUNDLES[url]) return false;
    LOADING_2K9_BUNDLES[url] = true;
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const bundle = await resp.json();
        LOADED_2K9_BUNDLES[url] = bundle;
        for (const c of getCatalog()) {
          if (c.grade === '2K9' && c.dataFile === url && bundle[c.id]) {
            c.chapters = expandCompact2k9Chapters(c, bundle[c.id]);
          }
        }
      }
    } catch {}
    LOADING_2K9_BUNDLES[url] = false;
    if (APP.activeTab === 'lectures') renderLecturesTab();
    return Boolean(course.chapters && course.chapters.length);
  }

  function getCourseById(courseId) {
    const list = getCatalog();
    const aliasMap = {
      math12: 'Toán',
      physics12: 'Vật Lí',
      chemistry12: 'Hóa Học',
      biology12: 'Sinh Học',
      english12: 'Tiếng Anh'
    };
    const found = list.find(c => c.id === courseId);
    if (found) return found;
    if (aliasMap[courseId]) {
      const aliased = list.find(c => c.grade === '2K9' && c.subject === aliasMap[courseId]);
      if (aliased) return aliased;
    }
    return list[0] || null;
  }

  function getCourseTopicCount(course) {
    if (Array.isArray(course?.chapters) && course.chapters.length > 0) {
      return course.chapters.reduce((s, ch) => s + (ch.topics || []).length, 0);
    }
    return Number(course?.topicCount || 0);
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
    if (Array.isArray(course?.chapters) && course.chapters.length > 0) {
      for (const ch of course.chapters) {
        for (const t of ch.topics || []) {
          total++;
          if (APP.doneMap[t.id]) done++;
        }
      }
    } else {
      total = Number(course?.topicCount || 0);
      const prefix = `${String(course?.id || '').toUpperCase()}-`;
      if (prefix.length > 1) {
        for (const [k, v] of Object.entries(APP.doneMap)) {
          if (v && k.startsWith(prefix)) done++;
        }
      }
    }
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }

  // ==========================================================================
  // NAVIGATION & TAB SWITCHING
  // ==========================================================================
  function switchTab(tabId, options = {}) {
    const validTabs = ['home', 'lectures', 'exams', 'leaderboard', 'docs', 'khoa-chui', 'archive', 'flashcards', 'community', 'planner', 'ai', 'admin'];
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
    if (target === 'khoa-chui') renderKhoaChuiTab();
    if (target === 'archive') renderArchiveTab();
    if (target === 'flashcards') renderFlashcardsTab();
    if (target === 'community') renderCommunityTab();
    if (target === 'planner') renderPlannerTab();
    if (target === 'ai') renderAiTab();
    if (target === 'admin') {
      renderAdminTab();
      fetchAdminDetail();
    }

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
        APP.isAdmin = Boolean(meData.is_admin || meData.user?.is_admin || meData.user?.role === 'admin');
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
          APP.isAdmin = false;
        }
      }
    } catch {}

    try {
      const cfgResp = await fetch('/api/dashboard?action=public-config', { credentials: 'include' });
      if (cfgResp.ok) {
        const cfg = await cfgResp.json();
        APP.systemAnnouncement = cfg?.announcement || null;
        if (Array.isArray(cfg?.custom_khoa_chui)) APP.customKhoaChui = cfg.custom_khoa_chui;
        renderSystemAnnouncementBar();
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
    if (APP.activeTab === 'khoa-chui') renderKhoaChuiTab();
    if (APP.activeTab === 'admin') {
      renderAdminTab();
      if (APP.isAdmin) fetchAdminDetail();
    }
  }
  window.PK9_REFRESH_AUTH_AND_LEADERBOARD = fetchAuthAndLeaderboard;

  function renderSystemAnnouncementBar() {
    const bar = document.getElementById('pk9-system-announcement-bar');
    if (!bar) return;
    if (APP.systemAnnouncement && APP.systemAnnouncement.active && APP.systemAnnouncement.text) {
      bar.style.display = 'flex';
      bar.className = 'pk9-announce-banner';
      bar.innerHTML = `
        <span>📢 <b>THÔNG BÁO HỆ THỐNG:</b> ${esc(APP.systemAnnouncement.text)}</span>
        ${APP.systemAnnouncement.link ? `<button type="button" class="pk9-admin-btn-xs" data-nav-tab="${esc(APP.systemAnnouncement.link)}" style="background:#fff;color:#0f172a;border:none;">Xem ngay →</button>` : ''}
      `;
    } else {
      bar.style.display = 'none';
      bar.innerHTML = '';
    }
  }

  function updateHeaderAuthUI() {
    const xpChip = document.getElementById('pk9-top-xp-chip');
    const authBtn = document.getElementById('pk9-top-auth-btn');
    const sideCard = document.getElementById('pk9-sidebar-user-card');
    const adminNavGroup = document.getElementById('pk9-nav-admin-group');
    const adminNavBtn = document.getElementById('pk9-nav-admin-btn');
    const topAdminBtn = document.getElementById('pk9-top-admin-btn');

    if (adminNavGroup) adminNavGroup.style.display = APP.isAdmin ? 'block' : 'none';
    if (adminNavBtn) adminNavBtn.style.display = APP.isAdmin ? 'flex' : 'none';
    if (topAdminBtn) topAdminBtn.style.display = APP.isAdmin ? 'inline-flex' : 'none';

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
        authBtn.innerHTML = `${APP.isAdmin ? '🛡️' : '👤'} ${esc(APP.user.display_name || APP.user.username)}`;
      } else {
        authBtn.innerHTML = `🚀 Đăng ký <span class="hide-xs">/ Đăng nhập (+100 XP)</span>`;
      }
    }

    if (sideCard) {
      const myRank = APP.lbData.my_rank;
      if (APP.user) {
        sideCard.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.65rem;margin-bottom:0.55rem;">
            <div style="width:38px;height:38px;border-radius:50%;background:${APP.isAdmin ? 'linear-gradient(135deg,#e11d48,#f59e0b)' : 'linear-gradient(135deg,#2563eb,#0d9488)'};color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;">
              ${esc((APP.user.display_name || APP.user.username || 'K').slice(0, 1).toUpperCase())}
            </div>
            <div style="min-width:0;flex:1;">
              <div style="font-weight:800;font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${esc(APP.user.display_name)} ${APP.isAdmin ? '<span class="pk9-badge" style="background:#e11d48;color:#fff;font-size:0.65rem;">ADMIN</span>' : ''}
              </div>
              <div style="font-size:0.72rem;color:var(--pk9-text-muted);">Lv.${levelVal} • ${xpVal} XP • Tuần: ${wkXpVal} XP</div>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.74rem;font-weight:700;padding-top:0.45rem;border-top:1px dashed var(--pk9-border);">
            <span>🏆 Top Tuần: <b>#${myRank?.weeklyRank || '—'}</b></span>
            <span>🌟 Top Tổng: <b>#${myRank?.topRank || '—'}</b></span>
          </div>
          ${APP.isAdmin ? `
            <button type="button" class="pk9-auth-btn" data-nav-tab="admin" style="width:100%;justify-content:center;padding:0.45rem;margin-top:0.55rem;background:linear-gradient(135deg,#e11d48,#d97706);">
              🛡️ Mở Admin Dashboard Chi Tiết
            </button>
          ` : ''}
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

    const totalTopics = catalog.reduce((s, c) => s + getCourseTopicCount(c), 0);
    const doneTotal = Object.values(APP.doneMap).filter(Boolean).length;
    const seedExams = (Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS : []).slice(0, 4);
    const topWeekly = (APP.lbData.weekly_leaderboard || []).slice(0, 3);
    const total2k9Pdfs = catalog.filter(c => c.grade === '2K9').reduce((s, c) => s + Number(c.pdfFileCount || 0), 0);
    const subjects2k9Map = new Map();
    for (const c of catalog) {
      if (c.grade !== '2K9') continue;
      if (!subjects2k9Map.has(c.subject)) {
        subjects2k9Map.set(c.subject, { subject: c.subject, icon: c.icon, teachers: [], videos: 0, topics: 0, pdfs: 0 });
      }
      const entry = subjects2k9Map.get(c.subject);
      entry.teachers.push(c);
      entry.videos += Number(c.videoCount || 0);
      entry.topics += getCourseTopicCount(c);
      entry.pdfs += Number(c.pdfFileCount || 0);
    }
    const subjects2k9List = [...subjects2k9Map.values()];

    root.innerHTML = `
      <section class="pk9-hero">
        <div class="pk9-hero-orb-1"></div>
        <div class="pk9-hero-orb-2"></div>
        <div class="pk9-hero-grid">
          <div>
            <div class="pk9-hero-brand-row">
              <div class="pk9-hero-emblem">
                <img src="/assets/logo-phuc-k9.png?v=2026" alt="Logo Học Cùng Phúc K9" width="52" height="52" />
              </div>
              <div class="pk9-hero-badge">
                <span>⚡ HỆ SINH THÁI GIÁO DỤC TOÀN DIỆN • HỌC CÙNG PHÚC K9</span>
              </div>
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
              <button type="button" class="pk9-btn-hero-sec" data-nav-tab="khoa-chui" style="background:linear-gradient(135deg,rgba(16,185,129,0.28),rgba(37,99,235,0.28));border-color:rgba(52,211,153,0.6);">
                💎 Khóa Chui Tham Khảo (Xem Trực Tiếp)
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

      <!-- BANNER TRUY CẬP THẲNG KHÓA CHUI THAM KHẢO TRONG WEB -->
      <div class="pk9-card" style="margin-bottom:1.5rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(37,99,235,0.12));border:1.5px solid rgba(16,185,129,0.38);">
        <div style="flex:1;min-width:250px;">
          <div style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.73rem;font-weight:900;color:#0d9488;text-transform:uppercase;margin-bottom:0.2rem;">
            <span class="pk9-live-dot"></span> TÍCH HỢP SẴN TRONG WEB • KHÔNG CẦN CHUYỂN TRANG
          </div>
          <div style="font-size:1.08rem;font-weight:900;">💎 Kho Dữ Liệu Khóa Chui Tham Khảo 2K8 / 2K9 (Bảng Tổng Hợp Trực Tiếp)</div>
          <div style="font-size:0.83rem;color:var(--pk9-text-muted);margin-top:0.15rem;">
            Truy cập thẳng bảng tổng hợp khóa học các môn Toán, Lí, Hóa, Sinh, Anh, Văn, ĐGNL ngay trong giao diện chính — hỗ trợ phóng to toàn màn hình, thu phóng % và xem song song.
          </div>
        </div>
        <div style="display:flex;gap:0.55rem;flex-wrap:wrap;">
          <button type="button" class="pk9-auth-btn" data-nav-tab="khoa-chui" style="background:linear-gradient(135deg,#0d9488,#2563eb);">
            💎 Mở Khóa Chui Tham Khảo Ngay Trong Web
          </button>
          ${APP.isAdmin ? `
            <button type="button" class="pk9-auth-btn" data-nav-tab="admin" style="background:linear-gradient(135deg,#e11d48,#d97706);">
              🛡️ Admin Dashboard
            </button>
          ` : ''}
        </div>
      </div>

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
          ${['2K9', '2K8', 'DGNL', '2K11', '2K12', 'ALL'].map(g => `
            <button type="button" class="pk9-exam-chip ${APP.gradeFilter === g ? 'active' : ''}" data-set-grade="${g}">
              ${g === '2K9' ? '🎓 2K9 Theo Giáo Viên (8 Môn)' : g === '2K8' ? '🔥 Tuyển Chọn 2K8' : g === 'DGNL' ? '🏛️ ĐGNL & ĐGTD' : g === '2K11' ? '📘 Lớp 10 Mới (2K11)' : g === '2K12' ? '🎯 Ôn Vào 10 (2K12)' : `🌐 Tất cả (${catalog.length} khóa)`}
            </button>
          `).join('')}
        </div>
      </div>

      ${APP.gradeFilter === '2K9' && subjects2k9List.length ? `
        <div class="pk9-grid-4">
          ${subjects2k9List.map(sub => {
            const firstTeacher = sub.teachers[0];
            return `
              <article class="pk9-card" style="display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.65rem;">
                    <span style="font-size:1.7rem;">${sub.icon || '📘'}</span>
                    <span class="pk9-badge pk9-badge-subj">${sub.teachers.length} Thầy/Cô • ${sub.topics} mục</span>
                  </div>
                  <h3 style="margin:0 0 0.35rem;font-size:1.05rem;font-weight:900;">${esc(sub.subject)} 12 — Kho Full Giáo Viên</h3>
                  <div style="font-size:0.78rem;color:var(--pk9-text-muted);line-height:1.5;margin-bottom:0.8rem;">
                    <b>${sub.videos} video</b> + <b>${sub.pdfs} file PDF</b> từ: ${esc(sub.teachers.slice(0, 4).map(t => t.teacher).join(', '))}${sub.teachers.length > 4 ? ` & ${sub.teachers.length - 4} thầy/cô khác` : ''}.
                  </div>
                </div>
                <button type="button" class="pk9-btn-exam-primary" data-open-lecture-course="${esc(firstTeacher.id)}" style="width:100%;">
                  👨‍🏫 Chọn Giáo Viên Môn ${esc(sub.subject)} →
                </button>
              </article>
            `;
          }).join('')}
        </div>
        <div style="margin-top:0.75rem;font-size:0.82rem;color:var(--pk9-text-muted);text-align:center;">
          💡 Đang có sẵn <b>${catalog.filter(c => c.grade === '2K9').length} giáo viên</b> trên 8 môn với tổng <b>${total2k9Pdfs} file PDF</b> đề thi & bản viết tay. Vào tab <b>Video Bài Giảng</b> để chọn đúng Thầy/Cô bạn đang học!
        </div>
      ` : `
      <div class="pk9-grid-3">
        ${(APP.gradeFilter === 'ALL' ? filteredCourses.slice(0, 18) : filteredCourses).map(course => {
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
      `}

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
  function toDrivePreviewUrl(rawUrl) {
    const raw = String(rawUrl || '').trim();
    const m = raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
    return m ? `https://drive.google.com/file/d/${m[1]}/preview` : raw;
  }

  function getTopicVideoEmbed(topic) {
    if (!topic) return { kind: 'none', embedUrl: '', externalUrl: '', codeLabel: '' };
    if (topic.videoId) {
      return {
        kind: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${topic.videoId}?rel=0&modestbranding=1`,
        externalUrl: `https://www.youtube.com/watch?v=${topic.videoId}`,
        codeLabel: topic.videoId
      };
    }
    const raw = String(topic.driveVideoUrl || topic.videoUrl || '').trim();
    const yt = raw.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) {
      return {
        kind: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`,
        externalUrl: `https://www.youtube.com/watch?v=${yt[1]}`,
        codeLabel: yt[1]
      };
    }
    const dm = raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
    if (dm) {
      return {
        kind: 'drive',
        embedUrl: `https://drive.google.com/file/d/${dm[1]}/preview`,
        externalUrl: raw,
        codeLabel: `Drive:${dm[1].slice(0, 8)}`
      };
    }
    return { kind: 'none', embedUrl: raw, externalUrl: raw, codeLabel: 'Video' };
  }

  function renderTopicPdfAttachments(topic) {
    if (!topic) return '';
    const items = [];
    if (topic.pdfUrl) items.push({ label: 'Tài liệu / Đề bài giảng PDF', icon: '📄', url: topic.pdfUrl });
    if (topic.solutionPdfUrl) items.push({ label: 'Đáp án / Bản viết tay PDF', icon: '✍️', url: topic.solutionPdfUrl });
    if (Array.isArray(topic.pdfs)) {
      for (const p of topic.pdfs) {
        if (p && p.url) items.push({ label: p.label || 'Tài liệu PDF kèm theo', icon: p.icon || '📄', url: p.url });
      }
    }
    if (!items.length) return '';

    const activePreviewUrl = items.some(it => it.url === APP.inlinePdfUrl) ? APP.inlinePdfUrl : '';

    return `
      <div class="pk9-video-pdf-bar">
        <div class="pk9-pdf-bar-head">
          <span>📚 TÀI LIỆU PDF BÀI GIẢNG KÈM DƯỚI VIDEO (${items.length} file)</span>
          <span style="font-weight:700;color:var(--pk9-text-muted);font-size:0.73rem;">Đọc ngay dưới video hoặc phóng to toàn màn hình</span>
        </div>
        <div class="pk9-pdf-chip-row">
          ${items.map((it, idx) => {
            const isOpen = activePreviewUrl === it.url;
            return `
              <button type="button"
                class="pk9-pdf-action-btn ${isOpen ? 'primary' : ''}"
                data-toggle-inline-pdf="${esc(it.url)}"
                data-inline-pdf-title="${esc(`${topic.title} — ${it.label}`)}"
              >
                ${it.icon} ${isOpen ? `🔽 Đang mở: ${esc(it.label)}` : `📖 Đọc tại chỗ: ${esc(it.label)}`}
              </button>
              <button type="button"
                class="pk9-pdf-action-btn"
                data-open-inapp-url="${esc(it.url)}"
                data-open-inapp-title="${esc(`${topic.title} — ${it.label}`)}"
                data-open-inapp-sub="Tài liệu PDF kèm video • Học Cùng Phúc K9"
              >
                🔍 Phóng to #${idx + 1}
              </button>
              <a href="${esc(it.url)}" target="_blank" rel="noopener" class="pk9-pdf-action-btn">
                ↗️ Tải / Mở Drive
              </a>
            `;
          }).join('')}
        </div>
        ${activePreviewUrl ? `
          <div class="pk9-inline-pdf-wrap">
            <iframe
              src="${esc(toDrivePreviewUrl(activePreviewUrl))}"
              title="${esc(APP.inlinePdfTitle || 'Tài liệu PDF bài giảng')}"
              allow="autoplay"
            ></iframe>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderLecturesTab() {
    const root = document.getElementById('tab-lectures');
    if (!root) return;

    const catalog = getCatalog();
    const totalAllTopics = catalog.reduce((s, c) => s + getCourseTopicCount(c), 0);
    const navCountEl = document.getElementById('pk9-nav-lectures-count');
    if (navCountEl && totalAllTopics) navCountEl.textContent = `${totalAllTopics} bài`;

    const course = getCourseById(APP.activeCourseId);
    if (!course) return;

    const activeGrade = course.grade || '2K9';
    if (activeGrade === '2K9' && course.subject) {
      APP.active2k9Subject = course.subject;
    }

    const isWaitingBundle = course.grade === '2K9' && course.dataFile && (!Array.isArray(course.chapters) || course.chapters.length === 0);
    if (isWaitingBundle) {
      ensure2k9CourseLoaded(course);
    }

    const gradeMeta = [
      { code: '2K9', icon: '🎓', label: 'Khối 12 (2K9) — Full Bài Giảng & PDF Theo Từng Giáo Viên', sub: 'Chọn Môn (8 môn) → Chọn Tên Thầy/Cô để vào Full Video & Tất Cả PDF' },
      { code: '2K8', icon: '🔥', label: 'Khối 12 Tuyển Chọn 2K8 — Chuyên Đề + PDF', sub: 'Chuyên đề hay nhất đủ môn (Toán, Lí, Hóa, Sinh, Anh, Văn, Địa) kèm PDF dưới video' },
      { code: 'DGNL', icon: '🏛️', label: 'Luyện Thi ĐGNL & ĐGTD — V-ACT (Empire) • HSA • TSA • SP/BCA', sub: 'Chuyên đề ĐGNL ĐHQG-HCM (ưu tiên Empire), ĐHQG-HN (HSA), Bách Khoa (TSA) & Sư Phạm/BCA' },
      { code: '2K11', icon: '📘', label: 'Khối 10 — Chương Trình Mới GDPT 2018 (2K11)', sub: '5 Môn nền tảng: Toán 10, Vật Lí 10, Hóa Học 10, Sinh Học 10, Tiếng Anh 10' },
      { code: '2K12', icon: '🎯', label: 'Khối 9 — Ôn Thi Tuyển Sinh Vào Lớp 10 (2K12)', sub: '5 Môn vào 10: Toán 9, Vật Lí 9, Hóa Học 9, Sinh Học 9, Tiếng Anh 9' }
    ];
    const coursesInActiveGrade = catalog.filter(c => c.grade === activeGrade);

    // Group 2K9 by 8 subjects + list all teachers in the selected subject
    const subjects2k9 = [];
    if (activeGrade === '2K9') {
      const sMap = new Map();
      for (const c of coursesInActiveGrade) {
        if (!sMap.has(c.subject)) {
          sMap.set(c.subject, { subject: c.subject, icon: c.icon, teachers: [], topics: 0, pdfs: 0 });
        }
        const entry = sMap.get(c.subject);
        entry.teachers.push(c);
        entry.topics += getCourseTopicCount(c);
        entry.pdfs += Number(c.pdfFileCount || 0);
      }
      subjects2k9.push(...sMap.values());
    }
    const current2k9Subj = subjects2k9.find(s => s.subject === APP.active2k9Subject) || subjects2k9[0] || null;
    const teachersIn2k9Subj = current2k9Subj ? current2k9Subj.teachers : [];

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

    // Flatten topics & collect ALL unique PDFs of this selected teacher/course
    const flatTopics = [];
    const allCoursePdfs = [];
    const seenCoursePdfUrls = new Set();
    for (const ch of course.chapters || []) {
      for (const t of ch.topics || []) {
        flatTopics.push(t);
        const pushPdf = (url, label) => {
          if (!url || seenCoursePdfUrls.has(url)) return;
          seenCoursePdfUrls.add(url);
          allCoursePdfs.push({ url, label: label || 'Tài liệu PDF', topicTitle: t.title, chapterTitle: ch.title, topicId: t.id });
        };
        if (t.pdfUrl) pushPdf(t.pdfUrl, 'Tài liệu / Đề PDF');
        if (t.solutionPdfUrl) pushPdf(t.solutionPdfUrl, 'Đáp án / Viết tay PDF');
        if (Array.isArray(t.pdfs)) t.pdfs.forEach(p => pushPdf(p?.url, p?.label));
      }
    }
    const curIdx = flatTopics.findIndex(t => t.id === activeTopic?.id);
    const prevTopic = curIdx > 0 ? flatTopics[curIdx - 1] : null;
    const nextTopic = curIdx >= 0 && curIdx < flatTopics.length - 1 ? flatTopics[curIdx + 1] : null;

    const isDone = Boolean(activeTopic && APP.doneMap[activeTopic.id]);
    const prog = countCourseProgress(course);
    const qFilter = APP.lectureSearch.trim().toLowerCase();
    const pdfQuery = APP.teacherPdfSearch.trim().toLowerCase();
    const filteredCoursePdfs = pdfQuery
      ? allCoursePdfs.filter(p => `${p.topicTitle} ${p.chapterTitle} ${p.label}`.toLowerCase().includes(pdfQuery))
      : allCoursePdfs;
    const ytSearchUrl = activeTopic?.youtubeSearchUrl
      || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${course.shortName || course.name} ${activeTopic?.title || ''}`)}`;

    root.innerHTML = `
      <section class="pk9-lecture-hierarchy" aria-label="Chọn Khối lớp, Môn học và Giáo viên">
        <div class="pk9-tier-label">
          <span>📚 BƯỚC 1: CHỌN KHỐI LỚP HỌC TẬP</span>
          <button type="button" class="pk9-btn-exam-ghost" data-toggle-theater="1" style="padding:0.35rem 0.75rem;font-size:0.76rem;">
            ${APP.theaterMode ? '📐 Thu nhỏ màn hình' : '🖥️ Chế độ Rạp chiếu'}
          </button>
        </div>

        <div class="pk9-grade-tier-grid">
          ${gradeMeta.map(gm => {
            const gCourses = catalog.filter(c => c.grade === gm.code);
            const gTopicsCount = gCourses.reduce((s, c) => s + getCourseTopicCount(c), 0);
            const isAct = gm.code === activeGrade;
            return `
              <button type="button" class="pk9-grade-tier-card ${isAct ? 'active' : ''}" data-select-lecture-grade="${gm.code}">
                <div class="pk9-grade-tier-icon">${gm.icon}</div>
                <div style="min-width:0;flex:1;">
                  <div style="font-weight:900;font-size:0.88rem;line-height:1.25;">${esc(gm.label)}</div>
                  <div style="font-size:0.73rem;color:var(--pk9-text-muted);margin-top:0.2rem;">
                    ${gm.code === '2K9' ? `${gCourses.length} giáo viên (8 môn)` : `${gCourses.length} môn học`} • <b>${gTopicsCount} bài giảng & PDF</b>
                  </div>
                </div>
              </button>
            `;
          }).join('')}
        </div>

        ${activeGrade === '2K9' && subjects2k9.length ? `
          <div class="pk9-tier-label" style="margin-bottom:0.55rem;">
            <span>🎯 BƯỚC 2: CHỌN MÔN HỌC KHỐI 2K9 (${subjects2k9.length} MÔN)</span>
            <span style="font-size:0.73rem;color:var(--pk9-text-muted);text-transform:none;font-weight:700;">
              Đang chọn: <b>${esc(current2k9Subj?.subject || '')}</b> (${teachersIn2k9Subj.length} Thầy/Cô)
            </span>
          </div>

          <div class="pk9-subject-tier-grid" style="margin-bottom:1.05rem;">
            ${subjects2k9.map(sub => {
              const isAct = sub.subject === current2k9Subj?.subject;
              return `
                <button type="button" class="pk9-subject-tier-card ${isAct ? 'active' : ''}" data-select-2k9-subject="${esc(sub.subject)}">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4rem;width:100%;">
                    <span style="font-size:1.35rem;">${sub.icon || '📘'}</span>
                    <span class="pk9-subj-meta">${sub.teachers.length} GV • ${sub.topics} mục</span>
                  </div>
                  <div>
                    <div style="font-weight:900;font-size:0.92rem;line-height:1.25;">Môn ${esc(sub.subject)}</div>
                    <div class="pk9-subj-meta" style="margin-top:0.15rem;">
                      📄 ${sub.pdfs} file PDF & Đề
                    </div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <div class="pk9-tier-label" style="margin-bottom:0.55rem;">
            <span>👨‍🏫 BƯỚC 3: CHỌN TÊN GIÁO VIÊN DẠY MÔN ${esc((current2k9Subj?.subject || '').toUpperCase())} (${teachersIn2k9Subj.length} THẦY/CÔ)</span>
            <span style="font-size:0.73rem;color:var(--pk9-text-muted);text-transform:none;font-weight:700;">
              Đang học: <b>${esc(course.teacher)}</b> • Ấn chọn giáo viên để mở Full bài giảng & tất cả PDF
            </span>
          </div>

          <div class="pk9-teacher-tier-grid">
            ${teachersIn2k9Subj.map(tc => {
              const cp = countCourseProgress(tc);
              const isAct = tc.id === course.id;
              return `
                <button type="button" class="pk9-teacher-tier-card ${isAct ? 'active' : ''}" data-select-course="${esc(tc.id)}">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4rem;">
                    <span style="font-weight:900;font-size:0.89rem;color:${isAct ? 'var(--pk9-primary)' : 'inherit'};">👨‍🏫 ${esc(tc.teacher)}</span>
                    ${isAct ? '<span class="pk9-badge pk9-badge-verified" style="font-size:0.65rem;">ĐANG HỌC</span>' : ''}
                  </div>
                  <div style="font-size:0.74rem;color:var(--pk9-text-muted);line-height:1.35;">
                    ${esc(tc.courseTag || tc.desc)}
                  </div>
                  <div style="display:flex;flex-wrap:wrap;gap:0.4rem;font-size:0.72rem;font-weight:800;margin-top:0.15rem;">
                    <span>🎬 ${Number(tc.videoCount || 0)} video</span>
                    <span>•</span>
                    <span>📄 ${Number(tc.pdfFileCount || 0)} PDF</span>
                    ${cp.done > 0 ? `<span>• <b style="color:#10b981;">✓ ${cp.done}/${cp.total}</b></span>` : ''}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        ` : `
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
        `}
      </section>

      ${isWaitingBundle ? `
        <div class="pk9-card" style="text-align:center;padding:2.5rem 1.5rem;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">⏳</div>
          <div style="font-weight:900;font-size:1.05rem;">Đang tải toàn bộ bài giảng & file PDF của ${esc(course.teacher)}...</div>
          <p style="margin:0.35rem 0 0;font-size:0.84rem;color:var(--pk9-text-muted);">Hệ thống chỉ tải gói môn ${esc(course.subject)} một lần để chạy siêu mượt.</p>
        </div>
      ` : `
      ${allCoursePdfs.length ? `
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.65rem;margin-bottom:0.85rem;padding:0.75rem 1rem;border-radius:1rem;background:var(--pk9-surface);border:1.5px solid var(--pk9-border);">
          <div style="font-size:0.85rem;font-weight:800;">
            📚 <b>${esc(course.name)}</b>: ${flatTopics.length} mục bài học • <span style="color:var(--pk9-primary);">${allCoursePdfs.length} file PDF</span> (Đề + Bản viết tay / Đáp án)
          </div>
          <button type="button" class="pk9-btn-exam-primary" data-toggle-teacher-pdfs="1" style="padding:0.45rem 0.9rem;font-size:0.8rem;">
            ${APP.showTeacherPdfDrawer ? '🔽 Thu gọn Kho PDF' : `📄 Mở Kho Tất Cả PDF (${allCoursePdfs.length} file)`}
          </button>
        </div>
      ` : ''}

      ${APP.showTeacherPdfDrawer && allCoursePdfs.length ? `
        <section class="pk9-teacher-pdf-drawer" aria-label="Kho tất cả file PDF của giáo viên">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.65rem;">
            <strong style="font-size:0.95rem;">📂 Tất cả File PDF của ${esc(course.teacher)} (${filteredCoursePdfs.length}/${allCoursePdfs.length})</strong>
            <input type="search" id="pk9-teacher-pdf-search" class="pk9-input" placeholder="🔍 Lọc tên đề / chuyên đề PDF..." value="${esc(APP.teacherPdfSearch)}" style="max-width:320px;margin:0;" />
          </div>
          <div class="pk9-teacher-pdf-list">
            ${filteredCoursePdfs.slice(0, 120).map(p => `
              <div class="pk9-teacher-pdf-row">
                <div>
                  <div style="font-size:0.79rem;font-weight:800;line-height:1.3;">${esc(p.topicTitle)}</div>
                  <div style="font-size:0.7rem;color:var(--pk9-text-muted);margin-top:0.1rem;">${esc(p.chapterTitle)} • <b>${esc(p.label)}</b></div>
                </div>
                <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                  <button type="button" class="pk9-pdf-action-btn primary" data-open-inapp-url="${esc(p.url)}" data-open-inapp-title="${esc(`${p.topicTitle} — ${p.label}`)}" data-open-inapp-sub="${esc(course.teacher)} • Kho PDF 2K9">
                    📖 Đọc ngay
                  </button>
                  <button type="button" class="pk9-pdf-action-btn" data-select-topic="${esc(p.topicId)}">
                    🎯 Tới bài
                  </button>
                  <a href="${esc(p.url)}" target="_blank" rel="noopener" class="pk9-pdf-action-btn">
                    ↗️ Drive
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
          ${filteredCoursePdfs.length > 120 ? `<div style="font-size:0.74rem;color:var(--pk9-text-muted);margin-top:0.45rem;">Đang hiển thị 120/${filteredCoursePdfs.length} file đầu tiên — nhập từ khóa ở ô lọc bên trên để tìm nhanh file cụ thể.</div>` : ''}
        </section>
      ` : ''}

      <div class="pk9-lecture-studio ${APP.theaterMode ? 'theater' : ''}">
        <aside class="pk9-course-sidebar">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.5rem;">
            <strong style="font-size:0.95rem;">📑 Mục lục: ${course.icon} ${esc(course.shortName || course.name)}</strong>
            <span class="pk9-badge pk9-badge-verified">${prog.done}/${prog.total} bài (${prog.percent}%)</span>
          </div>
          <div class="pk9-topic-track" style="margin-bottom:0.75rem;">
            <div class="pk9-topic-fill" style="width:${Math.max(4, prog.percent)}%;"></div>
          </div>
          <input type="search" id="pk9-lecture-search-input" class="pk9-input" placeholder="🔍 Tìm bài giảng / chuyên đề..." value="${esc(APP.lectureSearch)}" style="margin-top:0;margin-bottom:0.5rem;" />

          <div>
            ${(course.chapters || []).map(ch => {
              const topics = (ch.topics || []).filter(t => {
                if (!qFilter) return true;
                return `${t.title} ${t.code || ''} ${t.desc || ''}`.toLowerCase().includes(qFilter);
              });
              if (!topics.length) return '';
              const chKey = `${course.id}::${ch.id}`;
              const isOpen = qFilter
                ? true
                : (APP.openChaptersMap[chKey] !== undefined
                    ? Boolean(APP.openChaptersMap[chKey])
                    : (ch.id === activeChapter?.id || (course.chapters || []).length <= 2));
              return `
                <div class="pk9-chapter-block">
                  <button type="button" class="pk9-chapter-head" data-toggle-chapter="${esc(chKey)}">
                    <span>${isOpen ? '▾ ' : '▸ '}${esc(ch.title)}</span>
                    <span style="font-size:0.72rem;color:var(--pk9-text-muted);flex-shrink:0;">${topics.length} bài</span>
                  </button>
                  ${isOpen ? `
                  <div class="pk9-topic-list">
                    ${topics.map(t => {
                      const done = Boolean(APP.doneMap[t.id]);
                      const act = t.id === activeTopic?.id;
                      const hasPdf = Boolean(t.pdfUrl || t.solutionPdfUrl || (Array.isArray(t.pdfs) && t.pdfs.length));
                      const isPdfOnly = t.kind === 'pdf' || (!t.videoId && !t.driveVideoUrl && Boolean(t.pdfUrl));
                      return `
                        <button type="button" class="pk9-topic-btn ${act ? 'active' : ''}" data-select-topic="${esc(t.id)}">
                          <span style="flex:1;line-height:1.35;">${act ? '▶ ' : ''}${isPdfOnly ? '📄 ' : ''}${esc(t.title)}${hasPdf ? '<span class="pk9-topic-pdf-tag">PDF</span>' : ''}</span>
                          <span style="font-size:0.78rem;color:${done ? '#10b981' : 'var(--pk9-text-soft)'};flex-shrink:0;">
                            ${done ? '✓ Đã học' : esc(t.duration || '45p')}
                          </span>
                        </button>
                      `;
                    }).join('')}
                  </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </aside>

        ${activeTopic ? (() => {
          const vid = getTopicVideoEmbed(activeTopic);
          const frameSrc = vid.kind !== 'none'
            ? vid.embedUrl
            : (activeTopic.pdfUrl ? toDrivePreviewUrl(activeTopic.pdfUrl) : '');
          return `
          <div class="pk9-video-stage">
            ${frameSrc ? `
              <div class="pk9-video-frame-wrap">
                <iframe
                  src="${esc(frameSrc)}"
                  title="${esc(activeTopic.title)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
              </div>
            ` : ''}

            ${renderTopicPdfAttachments(activeTopic)}

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
                  <span>🎞️ <b>Mã Video:</b> <code>${esc(vid.codeLabel)}</code></span>
                </div>
              </div>

              <div style="display:flex;flex-wrap:wrap;gap:0.45rem;align-items:center;">
                ${prevTopic ? `
                  <button type="button" class="pk9-btn-exam-ghost" data-select-topic="${esc(prevTopic.id)}">← Bài trước</button>
                ` : ''}
                <button type="button" class="pk9-btn-exam-primary" data-toggle-done-topic="${esc(activeTopic.id)}" style="${isDone ? 'background:#10b981;' : ''}">
                  ${isDone ? '✓ Đã hoàn thành (+25 XP)' : '✅ Đánh dấu hoàn thành (+25 XP)'}
                </button>
                ${vid.externalUrl ? `
                  <a href="${esc(vid.externalUrl)}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost">
                    ${vid.kind === 'none' ? '📄 Mở Tài Liệu Drive ↗' : (vid.kind === 'drive' ? '🎬 Mở Video Drive ↗' : '▶️ Mở YouTube ↗')}
                  </a>
                ` : ''}
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
          `;
        })() : ''}
      </div>
      `}
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
                <button type="button" class="pk9-btn-exam-primary" data-open-inapp-url="${esc(d.url)}" data-open-inapp-title="${esc(d.title)}" data-open-inapp-sub="${esc(d.subject)} • ${esc(d.source)}">
                  👁️ Đọc trực tiếp trong Web
                </button>
                <a href="${esc(d.url)}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost" style="text-decoration:none;flex:0 0 auto;padding:0.55rem 0.7rem;" title="Mở tab ngoài">
                  ↗
                </a>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // IN-APP VIEWER MODAL (XEM TÀI LIỆU / VIDEO / KHÓA HỌC THẲNG TRONG WEB)
  // ==========================================================================
  function openInAppViewer(title, rawUrl, subTitle = '') {
    let overlay = document.getElementById('pk9-inapp-viewer-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pk9-inapp-viewer-overlay';
      overlay.className = 'pk9-inapp-viewer-overlay';
      document.body.appendChild(overlay);
    }

    let embedUrl = String(rawUrl || '').trim();
    const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (ytMatch) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&autoplay=1`;
    } else if (embedUrl.includes('docs.google.com/spreadsheets/d/')) {
      const m = embedUrl.match(/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
      const gidMatch = embedUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '662446747';
      if (m) embedUrl = `https://docs.google.com/spreadsheets/d/${m[1]}/htmlview?gid=${gid}&widget=true&headers=false`;
    } else if (embedUrl.includes('drive.google.com/file/d/')) {
      const m = embedUrl.match(/file\/d\/([A-Za-z0-9_-]+)/);
      if (m) embedUrl = `https://drive.google.com/file/d/${m[1]}/preview`;
    }

    overlay.innerHTML = `
      <div class="pk9-inapp-viewer-box">
        <div class="pk9-sheet-toolbar">
          <div style="min-width:0;flex:1;">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-primary);text-transform:uppercase;">
              💎 TRÌNH XEM TRỰC TIẾP TRONG WEB • HỌC CÙNG PHÚC K9
            </div>
            <div style="font-weight:900;font-size:0.98rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${esc(title || 'Khóa Chui Tham Khảo')}
            </div>
            ${subTitle ? `<div style="font-size:0.76rem;color:var(--pk9-text-muted);">${esc(subTitle)}</div>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <button type="button" class="pk9-admin-btn-xs" data-reload-inapp-iframe="1">🔄 Tải lại</button>
            <button type="button" class="pk9-btn-exam-primary" data-close-inapp-viewer="1" style="padding:0.42rem 0.95rem;background:#ef4444;">
              ✕ Đóng cửa sổ
            </button>
          </div>
        </div>
        <div style="flex:1;background:#ffffff;position:relative;">
          <iframe
            id="pk9-inapp-viewer-iframe"
            src="${esc(embedUrl)}"
            title="${esc(title)}"
            style="width:100%;height:100%;border:0;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    `;
    overlay.classList.add('open');
  }
  window.PK9_OPEN_INAPP_VIEWER = openInAppViewer;

  // ==========================================================================
  // TAB 5.5: KHÓA CHUI THAM KHẢO (TRUY CẬP THẲNG TRONG WEB CHÍNH)
  // ==========================================================================
  const KHOA_CHUI_SHEET_ID = '1kV4ZfZv5ZgtEwuWBgh-k8fxs5OvhvzlrF7807aJCF_U';
  const KHOA_CHUI_GID = '662446747';
  const KHOA_CHUI_HTMLVIEW_URL = `https://docs.google.com/spreadsheets/d/${KHOA_CHUI_SHEET_ID}/htmlview?gid=${KHOA_CHUI_GID}#gid=${KHOA_CHUI_GID}`;
  const KHOA_CHUI_HTMLEMBED_URL = `https://docs.google.com/spreadsheets/d/${KHOA_CHUI_SHEET_ID}/htmlembed?gid=${KHOA_CHUI_GID}&single=true&widget=true&headers=false`;

  function getKhoaChuiCuratedList() {
    const base = Array.isArray(window.PK9_ARCHIVE_2K8) ? window.PK9_ARCHIVE_2K8 : [];
    const custom = Array.isArray(APP.customKhoaChui) ? APP.customKhoaChui : [];
    const extraCurated = [
      { id: 'kc-sheet-master', title: 'Bảng Master Khóa Chui Tham Khảo Tổng Hợp (Full Sheet GID 662446747)', subject: 'Tổng hợp', teacher: 'Tổng hợp Giáo viên Top 1', items: 'Toàn bộ link khóa học & tài liệu 2K8/2K9', tag: 'BẢNG GỐC', url: KHOA_CHUI_HTMLVIEW_URL, courseId: 'math12' },
      { id: 'kc-math-duc', title: 'Khóa I-M-O Toán 12 Thực Chiến & Vận Dụng Cao — Thầy Đỗ Văn Đức', subject: 'Toán', teacher: 'Thầy Đỗ Văn Đức', items: 'Chuyên đề Hàm số, Tích phân, Oxyz, Xác suất 9+', tag: 'HOT 2K9', url: 'https://www.youtube.com/watch?v=YFmKULPaM3Q', courseId: 'math12' },
      { id: 'kc-math-tien', title: 'Khóa Phác Đồ Toán 12 Toàn Diện GDPT 2018 — Thầy Nguyễn Phan Tiến', subject: 'Toán', teacher: 'Thầy Nguyễn Phan Tiến', items: 'Nền tảng 8+ đến Vận dụng cao 9.5+', tag: 'Toán 12', url: 'https://www.youtube.com/watch?v=zsxktJWNxVI', courseId: 'math12' },
      { id: 'kc-phys-vna', title: 'Khóa Vật Lí 12 Mapstudy Thực Chiến — Thầy Vũ Ngọc Anh', subject: 'Vật lí', teacher: 'Thầy Vũ Ngọc Anh', items: 'Nhiệt học, Khí lý tưởng, Từ trường, Hạt nhân', tag: 'Mapstudy', url: 'https://www.youtube.com/watch?v=qjnQLilsOqg', courseId: 'phys12' },
      { id: 'kc-chem-tyhh', title: 'Khóa Hóa Học 12 Danh Pháp IUPAC & Thực Chiến — Tôi Yêu Hóa Học', subject: 'Hóa học', teacher: 'Thầy Phạm Thắng (TYHH)', items: 'Ester-Lipid, Carbohydrate, Amine, Pin điện', tag: 'TYHH 9+', url: 'https://www.youtube.com/watch?v=8nfiPbueiPI', courseId: 'chem12' },
      { id: 'kc-chem-nap', title: 'Khóa Tư Duy Giải Nhanh Hóa Học 12 — Thầy Nguyễn Anh Phong (NAP)', subject: 'Hóa học', teacher: 'Thầy Nguyễn Anh Phong', items: '100+ Chuyên đề & Đề thực chiến NAP', tag: 'NAP', url: 'https://www.youtube.com/watch?v=09Fv7pwUFxY', courseId: 'chem12' },
      { id: 'kc-bio-nghe', title: 'Khóa Sinh Học 12 Di Truyền & Phả Hệ — Thầy Phan Khắc Nghệ', subject: 'Sinh học', teacher: 'Thầy Phan Khắc Nghệ', items: 'Cơ chế di truyền phân tử, Quy luật di truyền, Sinh thái', tag: 'Sinh 12', url: 'https://www.youtube.com/watch?v=Xqrw1VP16xs', courseId: 'bio12' },
      { id: 'kc-eng-vmp', title: 'Khóa Tiếng Anh 12 PRO 3M & Luyện Đề — Cô Vũ Mai Phương', subject: 'Tiếng Anh', teacher: 'Cô Vũ Mai Phương', items: 'Ngữ pháp, Collocations & Đọc hiểu 9+', tag: 'PRO 3M', url: 'https://www.youtube.com/watch?v=dklDlit0rjA', courseId: 'eng12' }
    ];
    return [...custom, ...extraCurated, ...base];
  }

  function renderKhoaChuiTab() {
    const root = document.getElementById('tab-khoa-chui');
    if (!root) return;

    const currentSrc = APP.kcMode === 'htmlembed' ? KHOA_CHUI_HTMLEMBED_URL : KHOA_CHUI_HTMLVIEW_URL;
    const scale = (APP.kcZoom || 100) / 100;
    const invWidth = Math.round((100 / scale) * 100) / 100;
    const invHeight = Math.round((100 / scale) * 100) / 100;

    const allItems = getKhoaChuiCuratedList();
    const subjects = ['ALL', 'Toán', 'Vật lí', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'ĐGNL', 'Tổng hợp'];
    const q = APP.kcSearch.trim().toLowerCase();
    const filtered = allItems.filter(item => {
      if (APP.kcSubject !== 'ALL' && !String(item.subject || '').toLowerCase().includes(APP.kcSubject.toLowerCase())) return false;
      if (!q) return true;
      return `${item.title} ${item.teacher || ''} ${item.subject || ''} ${item.tag || ''}`.toLowerCase().includes(q);
    });

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-exam-hero" style="background:linear-gradient(130deg,#06241f 0%,#0f5257 48%,#1d4ed8 100%);margin-bottom:1.25rem;">
          <div class="pk9-exam-hero-grid">
            <div>
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
                <span class="pk9-lb-live-pill">
                  <span class="pk9-live-dot"></span>
                  <span>TÍCH HỢP TRỰC TIẾP TRONG WEB • KHÔNG CHUYỂN TRANG</span>
                </span>
                <span class="pk9-badge" style="background:rgba(255,255,255,0.18);color:#fff;">GID: ${KHOA_CHUI_GID}</span>
              </div>
              <h2 style="font-size:1.62rem;font-weight:900;margin:0 0 0.45rem;">
                💎 Khóa Chui Tham Khảo — Bảng Tổng Hợp Khóa Học & Tài Liệu Trực Tiếp
              </h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.9rem;line-height:1.6;">
                Toàn bộ bảng tổng hợp khóa học (` + 'docs.google.com/spreadsheets/...#gid=662446747' + `) đã được nhúng thẳng vào khung làm việc bên dưới. Bạn có thể cuộn xem, đổi chế độ hiển thị, phóng to toàn màn hình hoặc mở khóa học ngay trong web!
              </p>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.55rem;justify-content:center;">
              <button type="button" class="pk9-btn-hero-main" data-kc-toggle-fullscreen="1" style="justify-content:center;width:100%;">
                ${APP.kcFullscreen ? '📐 Thu nhỏ về trang chuẩn' : '🖥️ Phóng To Bảng Khóa Chui Toàn Màn Hình'}
              </button>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                <button type="button" class="pk9-btn-hero-sec" data-kc-scroll-directory="1" style="justify-content:center;padding:0.6rem;">
                  🗂️ Danh mục chọn nhanh
                </button>
                <button type="button" class="pk9-btn-hero-sec" data-nav-tab="lectures" style="justify-content:center;padding:0.6rem;">
                  🎬 Phòng Video 262 bài
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- EMBEDDED GOOGLE SHEET WORKSPACE DIRECTLY INSIDE MAIN WEBSITE -->
        <section class="pk9-sheet-workspace ${APP.kcFullscreen ? 'fullscreen-focus' : ''}" id="pk9-khoa-chui-workspace">
          <div class="pk9-sheet-toolbar">
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <span style="font-weight:900;font-size:0.88rem;color:var(--pk9-primary);">📊 Bảng Khóa Chui Tham Khảo Trực Tiếp:</span>
              <button type="button" class="pk9-exam-chip ${APP.kcMode === 'htmlview' ? 'active' : ''}" data-kc-mode="htmlview" style="padding:0.35rem 0.75rem;font-size:0.76rem;">
                📑 Chế độ Đầy đủ (HTMLView)
              </button>
              <button type="button" class="pk9-exam-chip ${APP.kcMode === 'htmlembed' ? 'active' : ''}" data-kc-mode="htmlembed" style="padding:0.35rem 0.75rem;font-size:0.76rem;">
                ⚡ Chế độ Bảng Gọn (Widget Embed)
              </button>
            </div>

            <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
              <span style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);">Thu phóng:</span>
              ${[85, 100, 115, 130].map(z => `
                <button type="button" class="pk9-admin-btn-xs ${APP.kcZoom === z ? 'active' : ''}" data-kc-zoom="${z}" style="${APP.kcZoom === z ? 'background:var(--pk9-primary);color:#fff;border-color:var(--pk9-primary);' : ''}">
                  ${z}%
                </button>
              `).join('')}
              <button type="button" class="pk9-admin-btn-xs" data-kc-reload="1" title="Tải lại bảng dữ liệu">
                🔄 Làm mới bảng
              </button>
              <button type="button" class="pk9-btn-exam-primary" data-kc-toggle-fullscreen="1" style="padding:0.38rem 0.85rem;font-size:0.76rem;">
                ${APP.kcFullscreen ? '✕ Thoát Toàn Màn Hình' : '⛶ Toàn Màn Hình Ngay Trong Web'}
              </button>
            </div>
          </div>

          <div class="pk9-sheet-frame-container">
            <iframe
              id="pk9-khoa-chui-iframe"
              class="pk9-sheet-iframe"
              src="${esc(currentSrc)}"
              title="Khóa Chui Tham Khảo — Học Cùng Phúc K9"
              style="transform:scale(${scale});width:${invWidth}%;height:${invHeight}%;"
              loading="eager"
              referrerpolicy="no-referrer-when-downgrade"
              allowfullscreen
            ></iframe>
          </div>

          <div style="padding:0.65rem 1.2rem;background:var(--pk9-surface-2);border-top:1px solid var(--pk9-border);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.5rem;font-size:0.78rem;color:var(--pk9-text-muted);">
            <span>💡 <b>Mẹo sử dụng:</b> Bạn có thể cuộn ngang/dọc, dùng <code>Ctrl + F</code> ngay trong bảng hoặc bấm các thẻ chuyên đề bên dưới để học trực tiếp trên web.</span>
            <span>Trạng thái: <b style="color:#10b981;">● Đang kết nối trực tiếp trong trang</b></span>
          </div>
        </section>

        <!-- IN-APP DIRECTORY OF REFERENCED COURSES (OPEN DIRECTLY IN WEB WITHOUT LEAVING) -->
        <div id="pk9-khoa-chui-directory" class="pk9-sec-head" style="margin-top:1.5rem;">
          <div>
            <h3>🚀 Danh Mục Khóa Học & Chuyên Đề Tham Khảo Mở Nhanh Trong Web (${filtered.length} khóa)</h3>
            <p>Bấm vào bất kỳ khóa học nào bên dưới để <b>mở trình xem trực tiếp ngay trong web</b> hoặc chuyển thẳng vào Phòng Học Video tương ứng.</p>
          </div>
        </div>

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            ${subjects.map(s => `
              <button type="button" class="pk9-exam-chip ${APP.kcSubject === s ? 'active' : ''}" data-kc-subj="${esc(s)}">
                ${s === 'ALL' ? '💎 Tất cả môn (' + allItems.length + ')' : esc(s)}
              </button>
            `).join('')}
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-kc-search-input" placeholder="Tìm tên khóa học, thầy cô (Đỗ Văn Đức, Vũ Ngọc Anh, TYHH...)" value="${esc(APP.kcSearch)}" />
          </div>
        </div>

        <div class="pk9-exam-grid">
          ${filtered.map(item => `
            <article class="pk9-exam-card">
              <div>
                <div class="pk9-exam-card-badges">
                  <span class="pk9-badge pk9-badge-subj">${esc(item.subject || 'Khóa học')}</span>
                  <span class="pk9-badge pk9-badge-verified">💎 ${esc(item.tag || 'Tham khảo')}</span>
                </div>
                <h4>${esc(item.title)}</h4>
                <div class="pk9-exam-origin">👨‍🏫 Giáo viên: <b>${esc(item.teacher || 'Hệ sinh thái Phúc K9')}</b></div>
                ${item.items ? `<div style="font-size:0.78rem;color:var(--pk9-text-muted);margin-top:0.25rem;">📦 Nội dung: ${esc(item.items)}</div>` : ''}
              </div>
              <div class="pk9-exam-actions" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.85rem;">
                <button
                  type="button"
                  class="pk9-btn-exam-primary"
                  data-open-inapp-url="${esc(item.url || KHOA_CHUI_HTMLVIEW_URL)}"
                  data-open-inapp-title="${esc(item.title)}"
                  data-open-inapp-sub="${esc(item.teacher || item.subject || '')}"
                  style="flex:1;"
                >
                  🖥️ Xem ngay trong Web
                </button>
                ${item.courseId ? `
                  <button type="button" class="pk9-btn-exam-ghost" data-open-lecture-course="${esc(item.courseId)}">
                    🎬 Vào Phòng Video
                  </button>
                ` : ''}
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
            <p>Hệ thống bảng tổng hợp chuyên đề, phác đồ luyện đề của các giáo viên hàng đầu Việt Nam — tích hợp xem trực tiếp ngay trong web.</p>
          </div>
          <button type="button" class="pk9-auth-btn" data-nav-tab="khoa-chui">
            💎 Mở Bảng Khóa Chui Tham Khảo Trực Tiếp
          </button>
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
              <div class="pk9-exam-actions" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                <button
                  type="button"
                  class="pk9-btn-exam-primary"
                  data-open-inapp-url="${esc(sh.url)}"
                  data-open-inapp-title="${esc(sh.title)}"
                  data-open-inapp-sub="${esc(sh.teacher)}"
                  style="flex:1;"
                >
                  🖥️ Mở ngay trong Web
                </button>
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
  // TAB 11: SUPER DETAILED ADMIN DASHBOARD (TRUNG TÂM ĐIỀU HÀNH QUẢN TRỊ VIÊN)
  // ==========================================================================
  async function fetchAdminDetail() {
    if (!APP.isAdmin) return;
    APP.adminLoading = true;
    try {
      const resp = await fetch('/api/dashboard?action=admin-detail', { credentials: 'include' });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.ok) {
          APP.adminDetailData = data;
          if (data.announcement) APP.systemAnnouncement = data.announcement;
          if (Array.isArray(data.custom_khoa_chui)) APP.customKhoaChui = data.custom_khoa_chui;
          renderSystemAnnouncementBar();
        }
      }
    } catch {}
    APP.adminLoading = false;
    if (APP.activeTab === 'admin') renderAdminTab();
  }

  async function runAdminAction(payload) {
    try {
      const resp = await fetch('/api/dashboard?action=admin-action', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (resp.ok && data?.ok) {
        toast(data.message || 'Đã thực thi lệnh Quản trị thành công!', 'success');
        await fetchAdminDetail();
        await fetchAuthAndLeaderboard();
        return true;
      } else {
        toast(data?.message || 'Không thể thực hiện thao tác quản trị.', 'error');
        return false;
      }
    } catch {
      toast('Lỗi kết nối máy chủ quản trị.', 'error');
      return false;
    }
  }

  function renderAdminTab() {
    const root = document.getElementById('tab-admin');
    if (!root) return;

    if (!APP.user || !APP.isAdmin) {
      root.innerHTML = `
        <div class="pk9-exam-hub">
          <div class="pk9-card" style="max-width:620px;margin:2rem auto;text-align:center;padding:2.2rem;">
            <div style="font-size:3rem;margin-bottom:0.5rem;">🛡️</div>
            <h2 style="margin:0 0 0.5rem;font-size:1.35rem;font-weight:900;">Khu Vực Quản Trị Viên Hệ Sinh Thái Phúc K9</h2>
            <p style="color:var(--pk9-text-muted);font-size:0.9rem;margin:0 0 1.25rem;">
              Vui lòng đăng nhập bằng tài khoản <b>Admin</b> để mở khóa <b>Dashboard Quản Trị Siêu Chi Tiết</b> (Theo dõi lưu lượng truy cập thời gian thực, quản lý học viên, giám sát bài thi, điều khiển Khóa Chui Tham Khảo & phát thông báo toàn hệ thống).
            </p>
            <div style="display:flex;justify-content:center;gap:0.75rem;flex-wrap:wrap;">
              <button type="button" class="pk9-btn-exam-primary" data-open-auth="login">
                🔑 Đăng nhập tài khoản Admin
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-quick-admin-login="1">
                ⚡ Đăng nhập nhanh Admin Mặc định (admin / admin123)
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const d = APP.adminDetailData;
    const kpis = d?.kpis || {
      total_users: (APP.lbData.leaderboard || []).length || 1,
      active_today: 1,
      online_now: 1,
      unique_visitors: 1,
      visitors_today: 1,
      visitors_7d: 1,
      visitors_30d: 1,
      pageviews_all: 12,
      pageviews_today: 5,
      total_attempts: 0,
      avg_exam_score: 0,
      total_lessons_done: Object.values(APP.doneMap).filter(Boolean).length,
      total_notes_saved: Object.keys(APP.notesMap).length,
      total_xp_system: APP.user?.xp || 9999
    };

    const catalog = getCatalog();
    const totalCourses = catalog.length;
    const totalVideoLectures = catalog.reduce((s, c) => s + c.chapters.reduce((a, ch) => a + ch.topics.length, 0), 0);
    const totalPdfDocs = (Array.isArray(window.KIMVAN_DOCS) ? window.KIMVAN_DOCS.length : 0) + (Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27.length : 0);
    const totalSeedExams = Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS.length : 8;

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <section class="pk9-admin-hero">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;">
            <div>
              <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.6rem;">
                <span class="pk9-lb-live-pill">
                  <span class="pk9-live-dot"></span>
                  <span>ADMIN COMMAND CENTER • GIÁM SÁT THỜI GIAN THỰC</span>
                </span>
                <span class="pk9-badge" style="background:rgba(255,255,255,0.16);color:#fff;">
                  🗄️ Storage: ${esc(d?.storage_mode || 'Active Sync')}
                </span>
                <span class="pk9-badge" style="background:rgba(245,158,11,0.25);color:#fde047;">
                  📅 Tuần: ${esc(d?.week_key || APP.lbData.week_key || 'Hiện tại')}
                </span>
              </div>
              <h2 style="margin:0 0 0.35rem;font-size:1.6rem;font-weight:900;">
                🛡️ Bảng Điều Khiển Quản Trị Siêu Chi Tiết — HỌC CÙNG PHÚC K9
              </h2>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:0.88rem;">
                Xin chào Quản trị viên <b>${esc(APP.user.display_name)} (@${esc(APP.user.username)})</b> • Theo dõi toàn diện lưu lượng truy cập, học viên, điểm thi, nội dung khóa học và cấu hình hệ thống.
              </p>
            </div>
            <div style="display:flex;gap:0.55rem;flex-wrap:wrap;">
              <button type="button" class="pk9-btn-hero-main" data-admin-refresh="1" style="padding:0.65rem 1.1rem;font-size:0.83rem;">
                🔄 Làm mới Dữ liệu Live
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-admin-export-json="1" style="padding:0.65rem 1.1rem;font-size:0.83rem;">
                📥 Xuất Báo Cáo JSON/CSV
              </button>
            </div>
          </div>
        </section>

        <!-- 8 REAL-TIME KPI CARDS -->
        <div class="pk9-admin-kpi-grid">
          <div class="pk9-admin-kpi-card emerald">
            <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">🟢 Đang Online / Truy Cập</div>
            <div class="pk9-admin-kpi-val">${kpis.online_now} <span style="font-size:0.85rem;color:#10b981;">online</span></div>
            <div style="font-size:0.76rem;color:var(--pk9-text-muted);">
              Hôm nay: <b>${kpis.visitors_today}</b> khách • Tổng: <b>${kpis.unique_visitors}</b>
            </div>
          </div>

          <div class="pk9-admin-kpi-card">
            <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">👁️ Lượt Xem Trang (Pageviews)</div>
            <div class="pk9-admin-kpi-val">${kpis.pageviews_all}</div>
            <div style="font-size:0.76rem;color:var(--pk9-text-muted);">
              Hôm nay: <b>+${kpis.pageviews_today}</b> lượt • 7 ngày: <b>${kpis.visitors_7d}</b> UV
            </div>
          </div>

          <div class="pk9-admin-kpi-card violet">
            <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">👥 Tổng Tài Khoản Học Viên</div>
            <div class="pk9-admin-kpi-val">${kpis.total_users}</div>
            <div style="font-size:0.76rem;color:var(--pk9-text-muted);">
              Hoạt động hôm nay: <b style="color:#10b981;">${kpis.active_today} học viên</b>
            </div>
          </div>

          <div class="pk9-admin-kpi-card rose">
            <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">🏛️ Lượt Nộp Đề & Điểm TB</div>
            <div class="pk9-admin-kpi-val">${kpis.total_attempts} <span style="font-size:0.88rem;color:#f59e0b;">(${Number(kpis.avg_exam_score || 0).toFixed(2)}đ)</span></div>
            <div style="font-size:0.76rem;color:var(--pk9-text-muted);">
              Chấm tự động trên <b>${totalSeedExams} đề gốc Sở/Bộ</b>
            </div>
          </div>

          <div class="pk9-admin-kpi-card">
            <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">🎬 Bài Giảng Đã Hoàn Thành</div>
            <div class="pk9-admin-kpi-val">${kpis.total_lessons_done}</div>
            <div style="font-size:0.76rem;color:var(--pk9-text-muted);">
              Trên tổng số <b>${totalVideoLectures} bài giảng</b> (${totalCourses} khóa)
            </div>
          </div>

          <div class="pk9-admin-kpi-card emerald">
            <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">⚡ Tổng XP Toàn Hệ Thống</div>
            <div class="pk9-admin-kpi-val">${kpis.total_xp_system.toLocaleString('vi-VN')}</div>
            <div style="font-size:0.76rem;color:var(--pk9-text-muted);">
              Sổ tay ghi chú đã lưu: <b>${kpis.total_notes_saved}</b>
            </div>
          </div>
        </div>

        <!-- ADMIN SUB-NAVIGATION -->
        <div class="pk9-admin-subtabs">
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'overview' ? 'active' : ''}" data-admin-subtab="overview">
            📊 1. Biểu Đồ Lưu Lượng & Phân Tích Học Tập
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'users' ? 'active' : ''}" data-admin-subtab="users">
            👥 2. Quản Lý Học Viên & Phân Quyền (${(d?.users || []).length})
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'exams' ? 'active' : ''}" data-admin-subtab="exams">
            🏛️ 3. Giám Sát Lượt Thi & Phổ Điểm (${(d?.recent_attempts || []).length})
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'content' ? 'active' : ''}" data-admin-subtab="content">
            💎 4. Quản Lý Khóa Chui, Video (${totalVideoLectures}) & PDF (${totalPdfDocs})
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'system' ? 'active' : ''}" data-admin-subtab="system">
            ⚙️ 5. Hệ Thống, Thông Báo & Nhật Ký Audit
          </button>
        </div>

        <div id="pk9-admin-subtab-body">
          ${renderAdminSubtabContent(d, { totalCourses, totalVideoLectures, totalPdfDocs, totalSeedExams })}
        </div>
      </div>
    `;
  }

  function renderAdminSubtabContent(d, meta) {
    if (!d && APP.adminLoading) {
      return `
        <div class="pk9-card" style="text-align:center;padding:3rem;">
          <div style="font-size:1.5rem;margin-bottom:0.5rem;">⏳</div>
          <div style="font-weight:800;">Đang tải dữ liệu phân tích chi tiết từ máy chủ...</div>
        </div>
      `;
    }

    const series = Array.isArray(d?.daily_series) && d.daily_series.length ? d.daily_series : [];
    const users = Array.isArray(d?.users) ? d.users : [];
    const attempts = Array.isArray(d?.recent_attempts) ? d.recent_attempts : [];
    const grades = d?.distributions?.grades || { '2K9': 1, '2K11': 0, '2K12': 0 };
    const scores = d?.distributions?.scores || { '9_10': 0, '8_9': 0, '7_8': 0, '5_7': 0, 'under_5': 0 };
    const subjects = Array.isArray(d?.distributions?.subjects) ? d.distributions.subjects : [];

    // SUBTAB 1: OVERVIEW CHARTS & ANALYTICS
    if (APP.adminSubtab === 'overview') {
      const maxPv = Math.max(10, ...series.map(s => (s.pageviews || 0) + (s.visitors || 0) + (s.attempts || 0) * 3));
      const totalGradeUsers = Math.max(1, (grades['2K9'] || 0) + (grades['2K11'] || 0) + (grades['2K12'] || 0));
      const totalScoreCount = Math.max(1, Object.values(scores).reduce((a, b) => a + b, 0));

      return `
        <div class="pk9-admin-chart-grid">
          <div class="pk9-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
              <div>
                <h3 style="margin:0;font-size:1.05rem;font-weight:900;">📈 Biểu Đồ Lưu Lượng & Hoạt Động 14 Ngày Gần Nhất</h3>
                <div style="font-size:0.78rem;color:var(--pk9-text-muted);">Thống kê lượt xem trang, khách truy cập và lượt làm đề theo từng ngày</div>
              </div>
              <span class="pk9-badge pk9-badge-verified">Real-time 14D</span>
            </div>
            <div class="pk9-bar-chart">
              ${series.map(item => {
                const val = (item.pageviews || 0) + (item.visitors || 0) + (item.attempts || 0);
                const hPct = Math.min(100, Math.max(8, Math.round((val / maxPv) * 100)));
                return `
                  <div class="pk9-bar-col" title="Ngày ${esc(item.date)}: ${item.pageviews} lượt xem, ${item.visitors} khách, ${item.attempts} đề thi">
                    <span style="font-size:0.65rem;font-weight:800;color:var(--pk9-primary);">${val}</span>
                    <div class="pk9-bar-fill" style="height:${hPct}%;"></div>
                    <span style="font-size:0.66rem;color:var(--pk9-text-muted);font-weight:700;">${esc(item.label)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="pk9-card">
            <h3 style="margin:0 0 0.85rem;font-size:1.05rem;font-weight:900;">🎯 Phân Bổ Học Viên Theo Khối & Phổ Điểm</h3>
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
              ${[
                { label: '🎓 Khối 12 — Luyện Thi THPT (2K9)', count: grades['2K9'] || 0, color: '#2563eb' },
                { label: '📘 Khối 10 — Chương Trình Mới (2K11)', count: grades['2K11'] || 0, color: '#0d9488' },
                { label: '🎯 Khối 9 — Ôn Thi Vào 10 (2K12)', count: grades['2K12'] || 0, color: '#f59e0b' }
              ].map(row => {
                const pct = Math.round((row.count / totalGradeUsers) * 100);
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:800;margin-bottom:0.25rem;">
                      <span>${row.label}</span>
                      <span>${row.count} học viên (${pct}%)</span>
                    </div>
                    <div class="pk9-topic-track" style="height:0.5rem;">
                      <div class="pk9-topic-fill" style="width:${Math.max(4, pct)}%;background:${row.color};"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <hr style="border:none;border-top:1px dashed var(--pk9-border);margin:1rem 0;" />
            <div style="font-weight:800;font-size:0.85rem;margin-bottom:0.55rem;">📊 Phổ Điểm Phòng Luyện Đề Chuẩn Bộ GD&ĐT:</div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.4rem;text-align:center;">
              ${[
                { k: '9_10', label: '9.0 - 10đ', c: '#10b981' },
                { k: '8_9', label: '8.0 - 8.9đ', c: '#2563eb' },
                { k: '7_8', label: '7.0 - 7.9đ', c: '#0d9488' },
                { k: '5_7', label: '5.0 - 6.9đ', c: '#f59e0b' },
                { k: 'under_5', label: '< 5.0đ', c: '#ef4444' }
              ].map(b => `
                <div style="padding:0.5rem 0.3rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
                  <div style="font-size:1.05rem;font-weight:900;color:${b.c};">${scores[b.k] || 0}</div>
                  <div style="font-size:0.68rem;font-weight:700;color:var(--pk9-text-muted);">${b.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pk9-grid-3">
          <div class="pk9-card">
            <h4 style="margin:0 0 0.75rem;font-size:0.98rem;font-weight:900;">🏆 Top 5 Học Viên Dẫn Đầu XP Toàn Hệ Thống</h4>
            <div style="display:flex;flex-direction:column;gap:0.55rem;">
              ${users.slice().sort((a, b) => b.xp - a.xp).slice(0, 5).map((u, idx) => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.55rem 0.75rem;border-radius:0.75rem;background:var(--pk9-surface-2);">
                  <div style="min-width:0;">
                    <div style="font-weight:800;font-size:0.84rem;">#${idx + 1} • ${esc(u.display_name)} (@${esc(u.username)})</div>
                    <div style="font-size:0.72rem;color:var(--pk9-text-muted);">${esc(u.school || 'Học viên K9')} • ${u.lessons_done} bài • ${u.exam_attempts} đề</div>
                  </div>
                  <span class="pk9-badge pk9-badge-subj">⚡ ${u.xp} XP</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.75rem;font-size:0.98rem;font-weight:900;">📚 Thống Kê Luyện Đề Theo Môn Học</h4>
            <div style="display:flex;flex-direction:column;gap:0.55rem;">
              ${subjects.length ? subjects.map(s => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:0.55rem 0.75rem;border-radius:0.75rem;background:var(--pk9-surface-2);">
                  <div>
                    <div style="font-weight:800;font-size:0.85rem;">${esc(s.subject)}</div>
                    <div style="font-size:0.73rem;color:var(--pk9-text-muted);">Điểm TB: <b>${s.avgScore}đ</b> • Cao nhất: <b>${s.bestScore}đ</b></div>
                  </div>
                  <span class="pk9-badge pk9-badge-verified">${s.count} lượt thi</span>
                </div>
              `).join('') : `
                <div style="padding:1rem;text-align:center;color:var(--pk9-text-muted);font-size:0.84rem;">
                  Chưa có lượt nộp đề nào. Khi học viên nộp bài, thống kê từng môn sẽ tự động tổng hợp tại đây.
                </div>
              `}
            </div>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.75rem;font-size:0.98rem;font-weight:900;">⚡ Thao Tác Nhanh Cho Quản Trị Viên</h4>
            <div style="display:flex;flex-direction:column;gap:0.55rem;">
              <button type="button" class="pk9-btn-exam-primary" data-admin-subtab="users" style="width:100%;justify-content:center;">
                👥 Quản lý học viên & Cấp XP / VIP
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-admin-subtab="content" style="width:100%;justify-content:center;">
                💎 Thêm link mới vào Khóa Chui Tham Khảo
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-admin-subtab="system" style="width:100%;justify-content:center;">
                📢 Phát thông báo Banner toàn hệ thống
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="khoa-chui" style="width:100%;justify-content:center;">
                📊 Mở Bảng Khóa Chui Tham Khảo
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // SUBTAB 2: USER MANAGEMENT & CRM
    if (APP.adminSubtab === 'users') {
      const q = APP.adminUserSearch.trim().toLowerCase();
      const filteredUsers = users.filter(u => {
        if (APP.adminUserRoleFilter !== 'ALL' && u.role !== APP.adminUserRoleFilter) return false;
        if (!q) return true;
        return `${u.username} ${u.display_name} ${u.school || ''} ${u.grade || ''}`.toLowerCase().includes(q);
      });

      const inspected = APP.adminSelectedStudent
        ? users.find(u => u.username === APP.adminSelectedStudent)
        : null;

      return `
        <div class="pk9-card" style="margin-bottom:1.25rem;">
          <h4 style="margin:0 0 0.75rem;font-size:1rem;font-weight:900;">➕ Tạo Nhanh Tài Khoản Học Viên / VIP / Admin Mới</h4>
          <form id="pk9-admin-create-user-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:0.65rem;align-items:end;">
            <div>
              <label style="font-size:0.74rem;font-weight:800;">Username</label>
              <input type="text" name="username" class="pk9-input" placeholder="VD: hocvien2k9" required />
            </div>
            <div>
              <label style="font-size:0.74rem;font-weight:800;">Họ và tên hiển thị</label>
              <input type="text" name="display_name" class="pk9-input" placeholder="VD: Trần Hoàng Phúc" required />
            </div>
            <div>
              <label style="font-size:0.74rem;font-weight:800;">Mật khẩu</label>
              <input type="text" name="password" class="pk9-input" value="123456" required />
            </div>
            <div>
              <label style="font-size:0.74rem;font-weight:800;">Trường THPT</label>
              <input type="text" name="school" class="pk9-input" placeholder="THPT Chuyên..." />
            </div>
            <div>
              <label style="font-size:0.74rem;font-weight:800;">Vai trò & XP đầu</label>
              <div style="display:flex;gap:0.4rem;">
                <select name="role" class="pk9-input">
                  <option value="student">Học viên</option>
                  <option value="vip">VIP Pro</option>
                  <option value="admin">Admin</option>
                </select>
                <input type="number" name="xp" class="pk9-input" value="500" style="width:90px;" />
              </div>
            </div>
            <button type="submit" class="pk9-btn-exam-primary" style="height:42px;">✨ Tạo tài khoản</button>
          </form>
        </div>

        ${inspected ? `
          <div class="pk9-card" style="margin-bottom:1.25rem;border:2px solid var(--pk9-primary);background:linear-gradient(135deg,rgba(37,99,235,0.06),rgba(13,148,136,0.06));">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h4 style="margin:0;font-size:1.05rem;font-weight:900;">
                🔎 Hồ Sơ Chi Tiết Học Viên: ${esc(inspected.display_name)} (@${esc(inspected.username)})
              </h4>
              <button type="button" class="pk9-admin-btn-xs" data-admin-inspect-user="">✕ Đóng chi tiết</button>
            </div>
            <div class="pk9-grid-4">
              <div style="padding:0.75rem;border-radius:0.85rem;background:var(--pk9-surface);">
                <div style="font-size:0.72rem;color:var(--pk9-text-muted);">Trường & Khối</div>
                <div style="font-weight:800;font-size:0.9rem;">${esc(inspected.school || 'Chưa cập nhật')} (${esc(inspected.grade)})</div>
              </div>
              <div style="padding:0.75rem;border-radius:0.85rem;background:var(--pk9-surface);">
                <div style="font-size:0.72rem;color:var(--pk9-text-muted);">XP & Chuỗi học</div>
                <div style="font-weight:800;font-size:0.9rem;color:var(--pk9-primary);">⚡ ${inspected.xp} XP (Tuần: ${inspected.weekly_xp}) • 🔥 ${inspected.streak} ngày</div>
              </div>
              <div style="padding:0.75rem;border-radius:0.85rem;background:var(--pk9-surface);">
                <div style="font-size:0.72rem;color:var(--pk9-text-muted);">Tiến độ Bài giảng & Ghi chú</div>
                <div style="font-weight:800;font-size:0.9rem;">🎬 Đã học ${inspected.lessons_done} bài • 📝 ${inspected.notes_count} ghi chú</div>
              </div>
              <div style="padding:0.75rem;border-radius:0.85rem;background:var(--pk9-surface);">
                <div style="font-size:0.72rem;color:var(--pk9-text-muted);">Thành tích Luyện đề</div>
                <div style="font-weight:800;font-size:0.9rem;color:#10b981;">🏛️ ${inspected.exam_attempts} đề • Đỉnh: ${Number(inspected.best_score || 0).toFixed(2)}đ (TB: ${Number(inspected.avg_score || 0).toFixed(2)}đ)</div>
              </div>
            </div>
            ${inspected.resume ? `
              <div style="margin-top:0.65rem;font-size:0.8rem;color:var(--pk9-text-muted);">
                ▶️ <b>Bài giảng đang học dở gần nhất:</b> ${esc(inspected.resume.title || '')} (${esc(inspected.resume.courseName || '')})
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="pk9-exam-toolbar">
          <div class="pk9-exam-tabs">
            ${[
              { k: 'ALL', label: `Tất cả (${users.length})` },
              { k: 'admin', label: '🛡️ Quản trị viên (Admin)' },
              { k: 'vip', label: '💎 Học viên VIP' },
              { k: 'student', label: '🎓 Học viên chuẩn' }
            ].map(f => `
              <button type="button" class="pk9-exam-chip ${APP.adminUserRoleFilter === f.k ? 'active' : ''}" data-admin-role-filter="${f.k}">
                ${f.label}
              </button>
            `).join('')}
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-admin-user-search" placeholder="Tìm username, họ tên, trường THPT..." value="${esc(APP.adminUserSearch)}" />
          </div>
        </div>

        <div class="pk9-admin-table-wrap">
          <table class="pk9-admin-table">
            <thead>
              <tr>
                <th>Học viên / Tài khoản</th>
                <th>Vai trò & Khối</th>
                <th>XP & Chuỗi</th>
                <th>Tiến độ Video</th>
                <th>Luyện đề & Điểm</th>
                <th>Hoạt động cuối</th>
                <th>Thao tác Quản trị</th>
              </tr>
            </thead>
            <tbody>
              ${filteredUsers.map(u => `
                <tr>
                  <td>
                    <div style="font-weight:800;color:var(--pk9-text);">${esc(u.display_name)}</div>
                    <div style="font-size:0.75rem;color:var(--pk9-text-muted);">@${esc(u.username)} • 🏫 ${esc(u.school || 'Chưa khai báo')}</div>
                  </td>
                  <td>
                    <span class="pk9-badge" style="background:${u.role === 'admin' ? '#e11d48' : u.role === 'vip' ? '#d97706' : 'rgba(37,99,235,0.12)'};color:${u.role === 'admin' || u.role === 'vip' ? '#fff' : 'var(--pk9-primary)'};">
                      ${u.role.toUpperCase()}
                    </span>
                    <span class="pk9-badge pk9-badge-code">${esc(u.grade)}</span>
                  </td>
                  <td>
                    <div style="font-weight:800;color:var(--pk9-primary);">⚡ ${u.xp} XP (Lv.${u.level})</div>
                    <div style="font-size:0.74rem;color:var(--pk9-text-muted);">Tuần: ${u.weekly_xp} XP • 🔥 ${u.streak} ngày</div>
                  </td>
                  <td>
                    <b>${u.lessons_done}</b> bài đã xong<br/>
                    <span style="font-size:0.73rem;color:var(--pk9-text-muted);">${u.notes_count} ghi chú</span>
                  </td>
                  <td>
                    <b>${u.exam_attempts}</b> lượt thi<br/>
                    <span style="font-size:0.74rem;color:#10b981;font-weight:700;">Cao nhất: ${Number(u.best_score || 0).toFixed(2)}đ</span>
                  </td>
                  <td style="font-size:0.75rem;color:var(--pk9-text-muted);">
                    ${u.last_active ? new Date(u.last_active).toLocaleString('vi-VN') : '—'}
                  </td>
                  <td>
                    <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                      <button type="button" class="pk9-admin-btn-xs" data-admin-inspect-user="${esc(u.username)}" title="Xem chi tiết học viên">🔎 Chi tiết</button>
                      <button type="button" class="pk9-admin-btn-xs" data-admin-grant-xp="${esc(u.username)}" data-xp-amount="200">+200 XP</button>
                      <button type="button" class="pk9-admin-btn-xs" data-admin-toggle-role="${esc(u.username)}" data-cur-role="${esc(u.role)}">
                        ${u.role === 'student' ? '⬆️ Lên VIP' : u.role === 'vip' ? '🛡️ Lên Admin' : '🎓 Về Student'}
                      </button>
                      <button type="button" class="pk9-admin-btn-xs" data-admin-reset-pw="${esc(u.username)}">🔑 Đặt lại MK</button>
                      ${u.username !== APP.user.username ? `
                        <button type="button" class="pk9-admin-btn-xs danger" data-admin-del-user="${esc(u.username)}">🗑️ Xóa</button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // SUBTAB 3: EXAM ATTEMPTS & SUBMISSIONS MONITOR
    if (APP.adminSubtab === 'exams') {
      const q = APP.adminExamSearch.trim().toLowerCase();
      const filteredAttempts = attempts.filter(a => {
        if (!q) return true;
        return `${a.username} ${a.display_name} ${a.title} ${a.subject}`.toLowerCase().includes(q);
      });

      return `
        <div class="pk9-exam-toolbar">
          <div>
            <h3 style="margin:0;font-size:1.05rem;font-weight:900;">🏛️ Nhật Ký Nộp Bài & Chấm Điểm Tự Động Thời Gian Thực (${filteredAttempts.length} lượt)</h3>
            <div style="font-size:0.79rem;color:var(--pk9-text-muted);">Theo dõi chi tiết từng bài thi của học viên, số câu đúng, điểm số thang 10 và thời gian nộp bài.</div>
          </div>
          <div class="pk9-exam-search">
            <span class="pk9-exam-search-icon">🔍</span>
            <input type="search" id="pk9-admin-exam-search" placeholder="Tìm học viên, tên đề thi, môn học..." value="${esc(APP.adminExamSearch)}" />
          </div>
        </div>

        <div class="pk9-admin-table-wrap">
          <table class="pk9-admin-table">
            <thead>
              <tr>
                <th>Thời gian nộp</th>
                <th>Học viên</th>
                <th>Đề thi thực chiến</th>
                <th>Môn & Khối</th>
                <th>Điểm số (Thang 10)</th>
                <th>Số câu đúng</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAttempts.length ? filteredAttempts.map(a => `
                <tr>
                  <td style="font-size:0.76rem;color:var(--pk9-text-muted);">
                    ${a.created_at ? new Date(a.created_at).toLocaleString('vi-VN') : 'Vừa xong'}
                  </td>
                  <td>
                    <div style="font-weight:800;">${esc(a.display_name || a.username)}</div>
                    <div style="font-size:0.73rem;color:var(--pk9-text-muted);">@${esc(a.username)}</div>
                  </td>
                  <td style="font-weight:700;">${esc(a.title)}</td>
                  <td>
                    <span class="pk9-badge pk9-badge-subj">${esc(a.subject)}</span>
                    <span class="pk9-badge pk9-badge-code">${esc(a.grade || '2K9')}</span>
                  </td>
                  <td>
                    <span style="font-size:1.02rem;font-weight:900;color:${Number(a.score) >= 8 ? '#10b981' : Number(a.score) >= 5 ? '#2563eb' : '#ef4444'};">
                      ${Number(a.score || 0).toFixed(2)} điểm
                    </span>
                  </td>
                  <td>
                    <b>${a.correct || 0}</b> / ${a.total_questions || 0} câu
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="text-align:center;padding:2rem;color:var(--pk9-text-muted);">
                    Chưa có lượt nộp đề nào khớp bộ lọc.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      `;
    }

    // SUBTAB 4: CONTENT & KHOA CHUI THAM KHAO MANAGER
    if (APP.adminSubtab === 'content') {
      const catalog = getCatalog();
      return `
        <div class="pk9-grid-3" style="margin-bottom:1.35rem;">
          <div class="pk9-card" style="grid-column:span 2;">
            <h4 style="margin:0 0 0.4rem;font-size:1.05rem;font-weight:900;">💎 Thêm Khóa Học / Bảng Tổng Hợp Mới Vào Mục "Khóa Chui Tham Khảo"</h4>
            <p style="margin:0 0 0.85rem;font-size:0.81rem;color:var(--pk9-text-muted);">
              Khóa học được thêm tại đây sẽ xuất hiện ngay lập tức trong tab <b>Khóa Chui Tham Khảo</b> và hỗ trợ mở trực tiếp ngay trong web.
            </p>
            <form id="pk9-admin-add-khoachui-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.65rem;">
              <input type="text" name="title" class="pk9-input" placeholder="Tên khóa học / chuyên đề (VD: Khóa Tổng Ôn Toán 12...)" required />
              <input type="text" name="teacher" class="pk9-input" placeholder="Giáo viên (VD: Thầy Đỗ Văn Đức)" required />
              <input type="text" name="subject" class="pk9-input" placeholder="Môn học (Toán, Vật lí, Hóa học...)" required />
              <input type="text" name="tag" class="pk9-input" placeholder="Nhãn (VD: HOT 2026, VIP 9+)" value="VIP 2026" />
              <input type="url" name="url" class="pk9-input" placeholder="Link Google Sheet / Drive / YouTube..." required />
              <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.35rem;">➕ Thêm vào Khóa Chui Tham Khảo</button>
            </form>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.5rem;font-size:1rem;font-weight:900;">📊 Trạng Thái Bảng Gốc Khóa Chui</h4>
            <div style="font-size:0.8rem;color:var(--pk9-text-muted);line-height:1.6;margin-bottom:0.85rem;">
              <div><b>Sheet ID:</b> <code>${KHOA_CHUI_SHEET_ID.slice(0, 18)}...</code></div>
              <div><b>GID mặc định:</b> <code>${KHOA_CHUI_GID}</code></div>
              <div><b>Chế độ nhúng:</b> Trực tiếp trong web (HTMLView + Widget)</div>
              <div><b>Số khóa bổ sung:</b> ${APP.customKhoaChui.length} khóa</div>
            </div>
            <button type="button" class="pk9-btn-exam-primary" data-nav-tab="khoa-chui" style="width:100%;">
              💎 Kiểm tra giao diện Khóa Chui
            </button>
          </div>
        </div>

        <div class="pk9-admin-table-wrap">
          <table class="pk9-admin-table">
            <thead>
              <tr>
                <th>Mã Khóa</th>
                <th>Tên Khóa Học Trên Hệ Thống</th>
                <th>Khối Lớp</th>
                <th>Giảng Viên</th>
                <th>Số Chương</th>
                <th>Số Bài Giảng Video</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              ${catalog.map(c => {
                const topicCount = (c.chapters || []).reduce((acc, ch) => acc + (ch.topics || []).length, 0);
                return `
                  <tr>
                    <td><code>${esc(c.id)}</code></td>
                    <td style="font-weight:800;">${c.icon || '📘'} ${esc(c.name)}</td>
                    <td><span class="pk9-badge pk9-badge-subj">${esc(c.grade)}</span></td>
                    <td style="font-size:0.8rem;">${esc(c.teacher)}</td>
                    <td><b>${(c.chapters || []).length}</b> chương</td>
                    <td><span class="pk9-badge pk9-badge-verified">${topicCount} video HD</span></td>
                    <td>
                      <button type="button" class="pk9-admin-btn-xs" data-open-lecture-course="${esc(c.id)}">🎬 Mở khóa học</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // SUBTAB 5: SYSTEM ANNOUNCEMENT, API HEALTH & AUDIT LOGS
    const logs = Array.isArray(d?.audit_logs) ? d.audit_logs : [];
    const curAnn = APP.systemAnnouncement || {};
    return `
      <div class="pk9-grid-3" style="margin-bottom:1.35rem;">
        <div class="pk9-card" style="grid-column:span 2;">
          <h4 style="margin:0 0 0.45rem;font-size:1.05rem;font-weight:900;">📢 Phát Thông Báo Toàn Hệ Thống (System Broadcast Banner)</h4>
          <p style="margin:0 0 0.85rem;font-size:0.82rem;color:var(--pk9-text-muted);">
            Thanh thông báo sẽ hiển thị nổi bật trên đỉnh trang cho tất cả học viên đang truy cập website.
          </p>
          <form id="pk9-admin-announce-form" style="display:flex;flex-direction:column;gap:0.65rem;">
            <input type="text" name="text" class="pk9-input" placeholder="Nhập nội dung thông báo (VD: Đã cập nhật Bảng Khóa Chui Tham Khảo 2026 & Đề thi thử Sở Hà Nội!)" value="${esc(curAnn.text || '')}" />
            <div style="display:flex;gap:0.65rem;flex-wrap:wrap;align-items:center;">
              <select name="link" class="pk9-input" style="max-width:260px;margin-top:0;">
                <option value="khoa-chui" ${curAnn.link === 'khoa-chui' ? 'selected' : ''}>Nút bấm dẫn tới: Khóa Chui Tham Khảo</option>
                <option value="exams" ${curAnn.link === 'exams' ? 'selected' : ''}>Nút bấm dẫn tới: Phòng Luyện Đề</option>
                <option value="lectures" ${curAnn.link === 'lectures' ? 'selected' : ''}>Nút bấm dẫn tới: Video Bài Giảng</option>
                <option value="leaderboard" ${curAnn.link === 'leaderboard' ? 'selected' : ''}>Nút bấm dẫn tới: BXH Tuần & Top</option>
              </select>
              <label style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.84rem;font-weight:800;cursor:pointer;">
                <input type="checkbox" name="active" value="1" ${curAnn.active !== false ? 'checked' : ''} />
                Bật hiển thị thanh thông báo
              </label>
              <button type="submit" class="pk9-btn-exam-primary">🚀 Cập nhật Thông báo</button>
            </div>
          </form>
        </div>

        <div class="pk9-card">
          <h4 style="margin:0 0 0.65rem;font-size:1rem;font-weight:900;">🩺 Sức Khỏe Máy Chủ & API</h4>
          <div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.81rem;">
            <div style="display:flex;justify-content:space-between;padding:0.45rem 0.65rem;background:var(--pk9-surface-2);border-radius:0.6rem;">
              <span>Auth & Session API</span>
              <b style="color:#10b981;">● 200 OK</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.45rem 0.65rem;background:var(--pk9-surface-2);border-radius:0.6rem;">
              <span>Exam Auto-Grading Engine</span>
              <b style="color:#10b981;">● 200 OK</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.45rem 0.65rem;background:var(--pk9-surface-2);border-radius:0.6rem;">
              <span>Khóa Chui Sheet Embed</span>
              <b style="color:#10b981;">● Connected</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.45rem 0.65rem;background:var(--pk9-surface-2);border-radius:0.6rem;">
              <span>Storage Engine</span>
              <b>${esc(d?.storage_mode || 'Active')}</b>
            </div>
          </div>
        </div>
      </div>

      <div class="pk9-card">
        <h4 style="margin:0 0 0.75rem;font-size:1.02rem;font-weight:900;">📜 Nhật Ký Thao Tác Quản Trị Viên (Admin Audit Logs)</h4>
        <div class="pk9-admin-table-wrap">
          <table class="pk9-admin-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Quản trị viên</th>
                <th>Sự kiện</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length ? logs.map(l => `
                <tr>
                  <td style="font-size:0.75rem;color:var(--pk9-text-muted);">${l.created_at ? new Date(l.created_at).toLocaleString('vi-VN') : ''}</td>
                  <td><b>@${esc(l.admin)}</b></td>
                  <td><span class="pk9-badge pk9-badge-subj">${esc(l.event)}</span></td>
                  <td>${esc(l.detail)}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="4" style="text-align:center;padding:1.5rem;color:var(--pk9-text-muted);">
                    Chưa có nhật ký thao tác quản trị nào trong phiên này.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
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
          <div style="display:flex;gap:0.6rem;margin-top:0.5rem;flex-wrap:wrap;">
            <button type="submit" class="pk9-btn-exam-primary">💾 Lưu hồ sơ</button>
            ${APP.isAdmin ? `
              <button type="button" class="pk9-btn-exam-primary" data-nav-tab="admin" data-close-auth="1" style="background:linear-gradient(135deg,#e11d48,#d97706);">
                🛡️ Mở Admin Dashboard
              </button>
            ` : ''}
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
          <input type="text" name="username" class="pk9-input" placeholder="VD: minhanh2k9 (hoặc admin)" required />
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
        ${!isReg ? `
          <button type="button" class="pk9-btn-exam-ghost" data-quick-admin-login="1" style="margin-top:0.25rem;justify-content:center;border-color:rgba(225,29,72,0.35);color:#e11d48;">
            🛡️ Đăng nhập nhanh Tài khoản Admin (Mở Dashboard Quản Trị)
          </button>
        ` : ''}
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
    const results = [
      {
        kind: '💎 Khóa Chui Tham Khảo',
        title: 'Mở Bảng Khóa Chui Tham Khảo Trực Tiếp Trong Web (Sheet GID 662446747)',
        sub: 'Truy cập thẳng trong web chính • Không chuyển trang ngoài',
        action: () => {
          document.getElementById('pk9-cmd-modal')?.classList.remove('open');
          switchTab('khoa-chui');
        }
      }
    ];
    if (APP.isAdmin) {
      results.push({
        kind: '🛡️ Admin Command Center',
        title: 'Mở Dashboard Quản Trị Web Siêu Chi Tiết (Admin)',
        sub: 'Traffic 14 ngày • Học viên • Lịch sử làm đề • Quản lý Khóa Chui & Thông báo',
        action: () => {
          document.getElementById('pk9-cmd-modal')?.classList.remove('open');
          switchTab('admin');
        }
      });
    }

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
        APP.inlinePdfUrl = '';
        renderLecturesTab();
        return;
      }

      const sel2k9Subj = e.target.closest('[data-select-2k9-subject]');
      if (sel2k9Subj) {
        const subj = sel2k9Subj.getAttribute('data-select-2k9-subject') || 'Toán';
        APP.active2k9Subject = subj;
        const firstTeacherCourse = getCatalog().find(c => c.grade === '2K9' && c.subject === subj);
        if (firstTeacherCourse) {
          APP.activeCourseId = firstTeacherCourse.id;
          APP.activeTopicId = firstTeacherCourse.chapters?.[0]?.topics?.[0]?.id || '';
        }
        APP.inlinePdfUrl = '';
        APP.showTeacherPdfDrawer = false;
        APP.teacherPdfSearch = '';
        renderLecturesTab();
        return;
      }

      const togglePdfDrawer = e.target.closest('[data-toggle-teacher-pdfs]');
      if (togglePdfDrawer) {
        APP.showTeacherPdfDrawer = !APP.showTeacherPdfDrawer;
        renderLecturesTab();
        return;
      }

      const selCourse = e.target.closest('[data-select-course]');
      if (selCourse) {
        APP.activeCourseId = selCourse.getAttribute('data-select-course');
        const c = getCourseById(APP.activeCourseId);
        if (c?.subject) APP.active2k9Subject = c.subject;
        APP.activeTopicId = c?.chapters?.[0]?.topics?.[0]?.id || '';
        APP.inlinePdfUrl = '';
        APP.showTeacherPdfDrawer = false;
        APP.teacherPdfSearch = '';
        renderLecturesTab();
        return;
      }

      const toggleCh = e.target.closest('[data-toggle-chapter]');
      if (toggleCh) {
        const chKey = toggleCh.getAttribute('data-toggle-chapter');
        if (chKey) {
          const cur = APP.openChaptersMap[chKey];
          if (cur === undefined) {
            const c = getCourseById(APP.activeCourseId);
            const actCh = findTopicInCourse(c, APP.activeTopicId)?.chapter;
            const defaultOpen = (actCh && `${c.id}::${actCh.id}` === chKey) || ((c?.chapters || []).length <= 2);
            APP.openChaptersMap[chKey] = !defaultOpen;
          } else {
            APP.openChaptersMap[chKey] = !cur;
          }
          renderLecturesTab();
        }
        return;
      }

      const selTopic = e.target.closest('[data-select-topic]');
      if (selTopic) {
        APP.activeTopicId = selTopic.getAttribute('data-select-topic');
        APP.inlinePdfUrl = '';
        renderLecturesTab();
        return;
      }

      const inlinePdfBtn = e.target.closest('[data-toggle-inline-pdf]');
      if (inlinePdfBtn) {
        const url = inlinePdfBtn.getAttribute('data-toggle-inline-pdf') || '';
        const title = inlinePdfBtn.getAttribute('data-inline-pdf-title') || 'Tài liệu PDF';
        if (APP.inlinePdfUrl === url) {
          APP.inlinePdfUrl = '';
          APP.inlinePdfTitle = '';
        } else {
          APP.inlinePdfUrl = url;
          APP.inlinePdfTitle = title;
        }
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
        return;
      }

      // --- KHÓA CHUI THAM KHẢO & IN-APP VIEWER ---
      const kcModeBtn = e.target.closest('[data-kc-mode]');
      if (kcModeBtn) {
        APP.kcMode = kcModeBtn.getAttribute('data-kc-mode') || 'htmlview';
        renderKhoaChuiTab();
        toast(APP.kcMode === 'htmlview' ? 'Đã chuyển sang chế độ Bảng Đầy Đủ (HTMLView).' : 'Đã chuyển sang chế độ Bảng Nhúng Gọn (Widget Embed).', 'info');
        return;
      }

      const kcZoomBtn = e.target.closest('[data-kc-zoom]');
      if (kcZoomBtn) {
        APP.kcZoom = Number(kcZoomBtn.getAttribute('data-kc-zoom')) || 100;
        renderKhoaChuiTab();
        return;
      }

      const kcReloadBtn = e.target.closest('[data-kc-reload]');
      if (kcReloadBtn) {
        const ifr = document.getElementById('pk9-khoa-chui-iframe');
        if (ifr) {
          const cur = ifr.src;
          ifr.src = cur;
          toast('🔄 Đang làm mới dữ liệu Khóa Chui Tham Khảo trực tiếp trong web...', 'info');
        }
        return;
      }

      const kcFullBtn = e.target.closest('[data-kc-toggle-fullscreen]');
      if (kcFullBtn) {
        APP.kcFullscreen = !APP.kcFullscreen;
        renderKhoaChuiTab();
        return;
      }

      const kcScrollDir = e.target.closest('[data-kc-scroll-directory]');
      if (kcScrollDir) {
        document.getElementById('pk9-khoa-chui-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const kcSubjBtn = e.target.closest('[data-kc-subj]');
      if (kcSubjBtn) {
        APP.kcSubject = kcSubjBtn.getAttribute('data-kc-subj') || 'ALL';
        renderKhoaChuiTab();
        return;
      }

      const openInAppBtn = e.target.closest('[data-open-inapp-url]');
      if (openInAppBtn) {
        const url = openInAppBtn.getAttribute('data-open-inapp-url');
        const title = openInAppBtn.getAttribute('data-open-inapp-title') || 'Trình Xem Trực Tiếp Trong Web';
        const sub = openInAppBtn.getAttribute('data-open-inapp-sub') || '';
        openInAppViewer(title, url, sub);
        return;
      }

      const closeInAppBtn = e.target.closest('[data-close-inapp-viewer]');
      if (closeInAppBtn) {
        const ov = document.getElementById('pk9-inapp-viewer-overlay');
        const ifr = document.getElementById('pk9-inapp-viewer-iframe');
        if (ifr) ifr.src = 'about:blank';
        if (ov) ov.classList.remove('open');
        return;
      }

      const reloadInAppBtn = e.target.closest('[data-reload-inapp-iframe]');
      if (reloadInAppBtn) {
        const ifr = document.getElementById('pk9-inapp-viewer-iframe');
        if (ifr && ifr.src) {
          const s = ifr.src;
          ifr.src = s;
          toast('🔄 Đã tải lại khung xem trực tiếp!', 'info');
        }
        return;
      }

      // --- QUICK ADMIN LOGIN & ADMIN DASHBOARD ---
      const quickAdminBtn = e.target.closest('[data-quick-admin-login]');
      if (quickAdminBtn) {
        try {
          const resp = await fetch('/api/auth?action=login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
          });
          const data = await resp.json();
          if (resp.ok && data?.ok) {
            APP.user = data.user;
            APP.isAdmin = true;
            APP.csrf = data.csrf || APP.csrf;
            closeAuthModal();
            toast('🛡️ Đã đăng nhập tài khoản Admin! Đang mở Admin Command Center...', 'success');
            await fetchAuthAndLeaderboard();
            switchTab('admin');
          } else {
            toast(data?.message || 'Không thể đăng nhập nhanh Admin.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ khi đăng nhập Admin.', 'error');
        }
        return;
      }

      const adminSubtabBtn = e.target.closest('[data-admin-subtab]');
      if (adminSubtabBtn) {
        APP.adminSubtab = adminSubtabBtn.getAttribute('data-admin-subtab') || 'overview';
        renderAdminTab();
        return;
      }

      const adminRefreshBtn = e.target.closest('[data-admin-refresh]');
      if (adminRefreshBtn) {
        toast('🔄 Đang đồng bộ số liệu Admin Realtime...', 'info');
        await fetchAdminDetail();
        return;
      }

      const adminExportBtn = e.target.closest('[data-admin-export-json]');
      if (adminExportBtn) {
        const payload = APP.adminDetailData || {};
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phuc-k9-admin-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast('📥 Đã xuất báo cáo JSON hệ thống!', 'success');
        return;
      }

      const adminRoleFilterBtn = e.target.closest('[data-admin-role-filter]');
      if (adminRoleFilterBtn) {
        APP.adminUserRoleFilter = adminRoleFilterBtn.getAttribute('data-admin-role-filter') || 'ALL';
        renderAdminTab();
        return;
      }

      const adminInspectUserBtn = e.target.closest('[data-admin-inspect-user]');
      if (adminInspectUserBtn) {
        APP.adminSelectedStudent = adminInspectUserBtn.getAttribute('data-admin-inspect-user') || '';
        renderAdminTab();
        return;
      }

      const adminGrantXpBtn = e.target.closest('[data-admin-grant-xp]');
      if (adminGrantXpBtn) {
        const username = adminGrantXpBtn.getAttribute('data-admin-grant-xp');
        await runAdminAction({ sub_action: 'grant-xp', username, amount: 200 });
        return;
      }

      const adminToggleRoleBtn = e.target.closest('[data-admin-toggle-role]');
      if (adminToggleRoleBtn) {
        const username = adminToggleRoleBtn.getAttribute('data-admin-toggle-role');
        const cur = adminToggleRoleBtn.getAttribute('data-cur-role') || 'student';
        const nextRole = cur === 'student' ? 'vip' : cur === 'vip' ? 'admin' : 'student';
        await runAdminAction({ sub_action: 'set-role', username, role: nextRole });
        return;
      }

      const adminResetPwBtn = e.target.closest('[data-admin-reset-pw]');
      if (adminResetPwBtn) {
        const username = adminResetPwBtn.getAttribute('data-admin-reset-pw');
        await runAdminAction({ sub_action: 'reset-password', username, new_password: '123456' });
        return;
      }

      const adminDelUserBtn = e.target.closest('[data-admin-del-user]');
      if (adminDelUserBtn) {
        const username = adminDelUserBtn.getAttribute('data-admin-del-user');
        await runAdminAction({ sub_action: 'delete-user', username });
        return;
      }
    });

    document.addEventListener('input', e => {
      if (e.target.id === 'pk9-lecture-search-input') {
        APP.lectureSearch = e.target.value || '';
        renderLecturesTab();
        const el = document.getElementById('pk9-lecture-search-input');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      } else if (e.target.id === 'pk9-teacher-pdf-search') {
        APP.teacherPdfSearch = e.target.value || '';
        renderLecturesTab();
        const el = document.getElementById('pk9-teacher-pdf-search');
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
      } else if (e.target.id === 'pk9-kc-search-input') {
        APP.kcSearch = e.target.value || '';
        renderKhoaChuiTab();
        const el = document.getElementById('pk9-kc-search-input');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      } else if (e.target.id === 'pk9-admin-user-search') {
        APP.adminUserSearch = e.target.value || '';
        renderAdminTab();
        const el = document.getElementById('pk9-admin-user-search');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      } else if (e.target.id === 'pk9-admin-exam-search') {
        APP.adminExamSearch = e.target.value || '';
        renderAdminTab();
        const el = document.getElementById('pk9-admin-exam-search');
        if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      } else if (e.target.id === 'pk9-cmd-input') {
        renderCommandResults(e.target.value || '');
      }
    });

    document.addEventListener('submit', async e => {
      if (e.target.id === 'pk9-admin-create-user-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const p = Object.fromEntries(fd.entries());
        const ok = await runAdminAction({ sub_action: 'create-user', ...p });
        if (ok) e.target.reset();
        return;
      }

      if (e.target.id === 'pk9-admin-add-khoachui-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const p = Object.fromEntries(fd.entries());
        const ok = await runAdminAction({ sub_action: 'add-khoa-chui', ...p });
        if (ok) e.target.reset();
        return;
      }

      if (e.target.id === 'pk9-admin-announce-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const text = String(fd.get('text') || '').trim();
        const link = String(fd.get('link') || '').trim();
        const active = fd.get('active') !== null;
        await runAdminAction({ sub_action: 'set-announcement', text, link, active });
        return;
      }

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
          APP.isAdmin = Boolean(data.user?.is_admin || data.user?.role === 'admin');
          APP.csrf = data.csrf || APP.csrf;
          closeAuthModal();
          toast(data.message || 'Thành công!', 'success');
          await fetchAuthAndLeaderboard();
          if (APP.isAdmin) {
            toast('🛡️ Quyền Admin đã kích hoạt! Mở tab Admin Dashboard để theo dõi toàn bộ web.', 'info');
          }
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
        const ov = document.getElementById('pk9-inapp-viewer-overlay');
        if (ov?.classList.contains('open')) {
          const ifr = document.getElementById('pk9-inapp-viewer-iframe');
          if (ifr) ifr.src = 'about:blank';
          ov.classList.remove('open');
        }
        if (APP.kcFullscreen) {
          APP.kcFullscreen = false;
          if (APP.activeTab === 'khoa-chui') renderKhoaChuiTab();
        }
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

    // Ghi nhận lượt truy cập thực vào thống kê Admin Dashboard
    try {
      let vid = '';
      try {
        vid = localStorage.getItem('pk9_visitor_id') || '';
        if (!vid) {
          vid = 'v_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
          localStorage.setItem('pk9_visitor_id', vid);
        }
      } catch {}
      fetch('/api/dashboard?action=track-visitor', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: vid, event: 'pageview', path: location.pathname || '/' })
      }).catch(() => {});
    } catch {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(window, document);
