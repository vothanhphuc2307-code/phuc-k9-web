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
    teacherPickerSearch: '',
    openChaptersMap: {},
    studySubtab: 'theory', // 'theory' | 'types' | 'quiz' | 'notes'
    theaterMode: false,
    lectureSearch: '',
    quizAnswers: {},
    _suspendedLectureVideo: null,
    _lectureStartedKey: '',
    lbMode: 'weekly', // 'weekly' | 'top' | 'exam'
    lbSearch: '',
    lbFetchedAt: 0,
    lbLoading: false,
    lbData: {
      locked: true,
      week_key: '',
      total_students: 0,
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
    fcFilter: 'ALL', // 'ALL' | 'new' | 'learning' | 'mastered' | 'star'
    pomoSec: 25 * 60,
    pomoRunning: false,
    pomoTimer: null,
    pomoMode: 25,
    user: null,
    csrf: '',
    weakAdminPassword: false,
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
    adminSubtab: 'overview', // 'overview' | 'traffic' | 'users' | 'exams' | 'content' | 'system'
    adminUserSearch: '',
    adminUserRoleFilter: 'ALL',
    adminExamSearch: '',
    adminDeviceFilter: 'ALL',
    adminAutoLive: true,
    adminLiveTimer: null,
    adminDetailData: null,
    adminLoading: false,
    adminSelectedStudent: null,
    adminFeedbackFilter: 'ALL',
    // Feedback & Direct Contact State
    feedbackRating: 5,
    feedbackCategory: 'bug',
    feedbackContext: '',
    feedbackSubmitted: null,
    // Mobile UX & PWA Install State
    mobileSelectorsCollapsed: false,
    sidebarCollapsed: false,
    deferredInstallPrompt: null,
    isStandalone: false
  };

  let _serverAdminVerified = false;
  let _serverSuperAdminVerified = false;
  let _clientBanLock = null;
  let _intrusionReporting = false;
  let _intrusionBurstUntil = 0;
  let _adminDomGuardInstalled = false;

  function isClientVerifiedAdmin() {
    if (!_serverAdminVerified || !APP.user || APP.user.banned) return false;
    const uname = String(APP.user.username || '').trim().toLowerCase();
    if (uname === 'phucadmin') return true;
    return Boolean(
      APP.user.is_admin === true &&
      APP.user.role === 'admin' &&
      String(APP.user.admin_granted_by || '').trim().toLowerCase() === 'phucadmin'
    );
  }

  function isClientVerifiedSuperAdmin() {
    return Boolean(
      isClientVerifiedAdmin() &&
      _serverSuperAdminVerified &&
      String(APP.user?.username || '').trim().toLowerCase() === 'phucadmin'
    );
  }

  Object.defineProperty(APP, 'isAdmin', {
    get: () => isClientVerifiedAdmin(),
    set: () => {},
    enumerable: true,
    configurable: false
  });
  Object.defineProperty(APP, 'isSuperAdmin', {
    get: () => isClientVerifiedSuperAdmin(),
    set: () => {},
    enumerable: true,
    configurable: false
  });

  Object.defineProperty(window, 'PK9_AUTH', {
    value: Object.freeze({
      get csrf() { return APP.csrf || ''; },
      get isLoggedIn() { return Boolean(APP.user); },
      get username() { return APP.user?.username || ''; }
    }),
    writable: false,
    configurable: false
  });

  function renderBanOverlay(banInfo) {
    const info = banInfo || _clientBanLock;
    const existing = document.getElementById('pk9-ban-overlay');
    if (!info) {
      if (existing) existing.remove();
      return;
    }
    const el = existing || document.createElement('div');
    el.id = 'pk9-ban-overlay';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;';
    el.innerHTML = `
      <div style="max-width:480px;width:100%;background:var(--pk9-surface,#fff);color:var(--pk9-text,#0f172a);border-radius:1.25rem;padding:1.75rem;text-align:center;border:2px solid #ef4444;box-shadow:0 24px 60px rgba(0,0,0,0.45);">
        <div style="font-size:3rem;margin-bottom:0.5rem;">🚫</div>
        <h2 style="margin:0 0 0.5rem;font-size:1.25rem;font-weight:900;color:#dc2626;">TÀI KHOẢN ĐÃ BỊ KHÓA VĨNH VIỄN</h2>
        <p style="margin:0 0 0.85rem;font-size:0.9rem;line-height:1.5;">
          ${esc(info.reason || info.ban_reason || info.message || 'Hệ thống bảo mật đã khóa vĩnh viễn tài khoản do phát hiện hành vi truy cập trái phép khu vực Quản trị (Admin).')}
        </p>
        <div style="padding:0.65rem 0.85rem;border-radius:0.75rem;background:rgba(239,68,68,0.1);font-size:0.8rem;color:#b91c1c;margin-bottom:1.15rem;">
          🛡️ Chỉ tài khoản Super Admin <b>@phucadmin</b> mới có quyền xem xét mở khóa (Gỡ Ban).
        </div>
        <div style="display:flex;gap:0.55rem;justify-content:center;flex-wrap:wrap;">
          <button type="button" id="pk9-ban-switch-login" style="padding:0.65rem 1rem;border-radius:0.75rem;border:none;background:#2563eb;color:#fff;font-weight:800;cursor:pointer;font-size:0.85rem;">
            🔑 Đăng nhập tài khoản khác
          </button>
        </div>
      </div>
    `;
    if (!existing) document.body.appendChild(el);
    const loginSwitchBtn = el.querySelector('#pk9-ban-switch-login');
    if (loginSwitchBtn) {
      loginSwitchBtn.onclick = () => {
        el.remove();
        openAuthModal('login');
      };
    }
  }

  function handleBannedResponse(info = {}) {
    _serverAdminVerified = false;
    _serverSuperAdminVerified = false;
    APP.user = null;
    APP.weakAdminPassword = false;
    APP.adminDetailData = null;
    if (APP.adminLiveTimer) {
      clearInterval(APP.adminLiveTimer);
      APP.adminLiveTimer = null;
    }
    const adminPane = document.getElementById('tab-admin');
    if (adminPane) {
      adminPane.innerHTML = '';
      adminPane.classList.remove('active');
    }
    _clientBanLock = {
      banned: true,
      reason: info.ban_reason || info.reason || info.message || 'Truy cập trái phép khu vực Quản trị (Admin Dashboard).'
    };
    try { localStorage.setItem('pk9_ban_notice', JSON.stringify(_clientBanLock)); } catch {}
    updateHeaderAuthUI();
    renderBanOverlay(_clientBanLock);
  }

  function renderAdminWarningModal(warnInfo = {}) {
    const existing = document.getElementById('pk9-admin-warn-overlay');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'pk9-admin-warn-overlay';
    el.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(15,23,42,0.82);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;';
    el.innerHTML = `
      <div style="max-width:490px;width:100%;background:var(--pk9-surface,#fff);color:var(--pk9-text,#0f172a);border-radius:1.25rem;padding:1.65rem;text-align:center;border:2.5px solid #f59e0b;box-shadow:0 24px 60px rgba(0,0,0,0.4);">
        <div style="font-size:3rem;margin-bottom:0.4rem;">⚠️</div>
        <h2 style="margin:0 0 0.5rem;font-size:1.18rem;font-weight:900;color:#d97706;">
          ${esc(warnInfo.warning_title || 'CẢNH BÁO BẢO MẬT — LẦN DUY NHẤT (1/1)')}
        </h2>
        <p style="margin:0 0 0.85rem;font-size:0.88rem;line-height:1.55;">
          ${esc(warnInfo.message || 'Phát hiện hành vi mở hoặc can thiệp khu vực Quản trị (Admin) dù tài khoản của bạn không có quyền Quản trị.')}
        </p>
        <div style="padding:0.75rem 0.9rem;border-radius:0.8rem;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);font-size:0.82rem;line-height:1.5;color:#b91c1c;margin-bottom:1.1rem;font-weight:700;">
          🚨 LƯU Ý QUAN TRỌNG: Tài khoản của bạn hiện <u>CHƯA BỊ KHÓA</u> ở lần đầu tiên này. Nếu tiếp tục tái phạm thêm <b>1 lần nữa</b> (mở tab Admin, chỉnh DevTools hoặc gọi API Admin), tài khoản và thiết bị sẽ bị <b>BAN VĨNH VIỄN</b> ngay lập tức!
        </div>
        <button type="button" id="pk9-warn-dismiss" style="width:100%;padding:0.72rem 1rem;border-radius:0.8rem;border:none;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;font-weight:900;cursor:pointer;font-size:0.9rem;">
          ✅ Tôi đã hiểu — Quay lại học bình thường
        </button>
      </div>
    `;
    document.body.appendChild(el);
    const btn = el.querySelector('#pk9-warn-dismiss');
    if (btn) {
      btn.onclick = () => {
        el.remove();
        _intrusionBurstUntil = 0;
      };
    }
  }

  function handleAdminWarningResponse(info = {}) {
    if (APP.user) {
      APP.user.admin_warnings = Math.max(1, Number(info.warning_count || 1));
    }
    enforceAdminDomHidden();
    if (APP.activeTab === 'admin') {
      APP.activeTab = 'home';
      document.querySelectorAll('.pk9-tab-pane').forEach(p => p.classList.toggle('active', p.id === 'tab-home'));
      document.querySelectorAll('[data-nav-tab]').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-nav-tab') === 'home'));
      renderHomeTab();
    }
    renderAdminWarningModal(info);
  }

  async function reportClientAdminIntrusion(sourceLabel = 'DevTools Admin Bypass') {
    enforceAdminDomHidden();
    if (!APP.user || isClientVerifiedAdmin() || _intrusionReporting || Date.now() < _intrusionBurstUntil) return;
    _intrusionReporting = true;
    _intrusionBurstUntil = Date.now() + 1800;
    try {
      const resp = await fetch('/api/dashboard?action=security-intrusion', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-pk9-visitor': getVisitorClientId()
        },
        body: JSON.stringify({ source: sourceLabel, visitor_id: getVisitorClientId() })
      });
      const data = await resp.json().catch(() => ({}));
      if (data?.warning && !data?.banned) {
        handleAdminWarningResponse(data);
      } else if (data?.banned) {
        _intrusionBurstUntil = 0;
        handleBannedResponse(data);
      } else {
        toast(data?.message || '🔒 Khu vực Admin chỉ dành riêng cho tài khoản chủ @phucadmin!', 'error');
      }
    } catch {
      enforceAdminDomHidden();
      toast('🔒 Khu vực Admin chỉ dành riêng cho tài khoản chủ @phucadmin!', 'error');
    } finally {
      _intrusionReporting = false;
    }
  }

  function enforceAdminDomHidden() {
    if (isClientVerifiedAdmin()) return;
    ['pk9-nav-admin-group', 'pk9-nav-admin-btn', 'pk9-top-admin-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        el.classList.remove('active');
      }
    });
    const adminPane = document.getElementById('tab-admin');
    if (adminPane) {
      adminPane.classList.remove('active');
      adminPane.style.display = '';
      if (adminPane.innerHTML.trim()) adminPane.innerHTML = '';
    }
  }

  function installAdminDomGuard() {
    if (_adminDomGuardInstalled || typeof MutationObserver !== 'function') return;
    _adminDomGuardInstalled = true;
    const observer = new MutationObserver(() => {
      if (isClientVerifiedAdmin()) return;
      const pane = document.getElementById('tab-admin');
      const grp = document.getElementById('pk9-nav-admin-group');
      const navBtn = document.getElementById('pk9-nav-admin-btn');
      const topBtn = document.getElementById('pk9-top-admin-btn');
      const forcedPane = Boolean(pane && (pane.classList.contains('active') || (pane.style.display && pane.style.display !== 'none') || pane.children.length > 0));
      const forcedGrp = Boolean(grp && grp.style.display && grp.style.display !== 'none');
      const forcedNav = Boolean(navBtn && navBtn.style.display && navBtn.style.display !== 'none');
      const forcedTop = Boolean(topBtn && topBtn.style.display && topBtn.style.display !== 'none');
      if (forcedPane || forcedGrp || forcedNav || forcedTop) {
        enforceAdminDomHidden();
        if (APP.user) {
          reportClientAdminIntrusion('DevTools DOM Un-hide Admin');
        }
      }
    });
    ['tab-admin', 'pk9-nav-admin-group', 'pk9-nav-admin-btn', 'pk9-top-admin-btn'].forEach(id => {
      const targetEl = document.getElementById(id);
      if (targetEl) observer.observe(targetEl, { attributes: true, attributeFilter: ['class', 'style', 'hidden'], childList: id === 'tab-admin' });
    });
  }

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

  const PENDING_TYPESET_ELS = new Set();
  function typeset(el) {
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
    PENDING_TYPESET_ELS.forEach(el => typeset(el));
    PENDING_TYPESET_ELS.clear();
  });

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
  function syncAdminLivePolling() {
    if (APP.adminLiveTimer) {
      clearInterval(APP.adminLiveTimer);
      APP.adminLiveTimer = null;
    }
    if (APP.activeTab === 'admin' && APP.isAdmin && APP.adminAutoLive) {
      APP.adminLiveTimer = setInterval(() => {
        if (APP.activeTab === 'admin' && APP.isAdmin && APP.adminAutoLive && document.visibilityState === 'visible') {
          fetchAdminDetail({ silent: true });
        }
      }, 15000);
    }
  }

  function switchTab(tabId, options = {}) {
    const validTabs = ['home', 'lectures', 'exams', 'leaderboard', 'docs', 'khoa-chui', 'archive', 'flashcards', 'community', 'planner', 'ai', 'missions', 'journey', 'shop', 'periodic', 'idcard', 'admin'];
    const prevTab = APP.activeTab;
    const target = validTabs.includes(tabId) ? tabId : 'home';

    if (prevTab === 'exams' && target !== 'exams' && !options.force && window.PK9_EXAM_CENTER?.isTakingExam?.()) {
      window.PK9_EXAM_CENTER.persistDraft?.();
      if (typeof window.confirm === 'function' && !window.confirm('Bạn đang trong phòng thi. Chuyển sang mục khác ngay bây giờ? (Hệ thống đã tự động lưu nháp tiến độ & thời gian còn lại để bạn làm tiếp sau)')) {
        return;
      }
    }

    if (target === 'admin' && !isClientVerifiedAdmin()) {
      enforceAdminDomHidden();
      if (APP.user) {
        reportClientAdminIntrusion('switchTab(admin) Unauthorized');
      } else {
        toast('🔒 Khu vực Admin chỉ dành riêng cho tài khoản chủ @phucadmin!', 'error');
        openAuthModal('login');
      }
      return;
    }

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
    const mobHubBtn = document.getElementById('pk9-mob-hub-btn');
    if (mobHubBtn) {
      mobHubBtn.classList.toggle('active', !['home', 'lectures', 'khoa-chui', 'exams', 'leaderboard'].includes(target));
    }
    document.getElementById('pk9-mob-hub-sheet')?.classList.remove('open');

    const sidebar = document.getElementById('pk9-sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    document.getElementById('pk9-sidebar-backdrop')?.classList.remove('open');
    closeInAppViewer();

    if (target === 'home') {
      renderHomeTab();
      if (APP.user && (!APP.lbFetchedAt || Date.now() - APP.lbFetchedAt > 8000)) {
        refreshLeaderboard({ force: true, quiet: true });
      }
    }
    if (target === 'lectures') renderLecturesTab();
    if (target === 'exams' && window.PK9_EXAM_CENTER) window.PK9_EXAM_CENTER.render();
    if (target === 'leaderboard') {
      renderLeaderboardTab();
      if (APP.user) refreshLeaderboard({ force: true, quiet: true });
    }
    if (target === 'docs') renderDocsTab();
    if (target === 'khoa-chui') renderKhoaChuiTab();
    if (target === 'archive') renderArchiveTab();
    if (target === 'flashcards') renderFlashcardsTab();
    if (target === 'community') renderCommunityTab();
    if (target === 'planner') renderPlannerTab();
    if (target === 'ai') renderAiTab();
    if (['missions', 'journey', 'shop', 'periodic', 'idcard'].includes(target) && window.PK9_RPG) {
      window.PK9_RPG.renderTab(target);
    }
    if (target === 'admin') {
      if (!isClientVerifiedAdmin()) {
        enforceAdminDomHidden();
        return;
      }
      renderAdminTab();
      fetchAdminDetail();
    }

    syncAdminLivePolling();
    if (prevTab !== target && typeof trackAnalyticsEvent === 'function') {
      const safeReportTab = (target === 'admin' && !isClientVerifiedAdmin()) ? 'home' : target;
      trackAnalyticsEvent('tab', safeReportTab);
    }

    if (!options.keepScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  window.switchTab = switchTab;
  window.PK9_ASK_AI = function (promptText) {
    const text = String(promptText || '').trim().slice(0, 1950);
    if (!text) return;
    switchTab('ai', { force: true });
    window.setTimeout(() => {
      const inp = document.getElementById('pk9-ai-input');
      const form = document.getElementById('pk9-ai-form');
      if (inp && form) {
        inp.value = text;
        if (typeof form.requestSubmit === 'function') form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }, 80);
  };

  // ==========================================================================
  // AUTH & LEADERBOARD FETCHING
  // ==========================================================================
  async function refreshLeaderboard(opts = {}) {
    if (!APP.user) {
      APP.lbData = {
        locked: true,
        week_key: '',
        total_students: 0,
        leaderboard: [],
        weekly_leaderboard: [],
        exam_leaderboard: [],
        my_rank: null
      };
      APP.lbFetchedAt = 0;
      if (!opts.skipUiSync) {
        updateHeaderAuthUI();
        if (APP.activeTab === 'home') renderHomeTab();
        if (APP.activeTab === 'leaderboard') renderLeaderboardTab();
      }
      if (!opts.quiet) {
        toast('🔒 Tài khoản Khách chưa mở khóa BXH. Vui lòng đăng ký hoặc đăng nhập!', 'warning');
        openAuthModal('register');
      }
      return APP.lbData;
    }
    if (APP.lbLoading && !opts.force) return APP.lbData;
    if (!opts.force && APP.lbFetchedAt && (Date.now() - APP.lbFetchedAt) < 1500) {
      return APP.lbData;
    }
    APP.lbLoading = true;
    try {
      const lbResp = await fetch(`/api/dashboard?action=leaderboard&_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (lbResp.status === 401) {
        APP.lbData = { locked: true, week_key: '', total_students: 0, leaderboard: [], weekly_leaderboard: [], exam_leaderboard: [], my_rank: null };
        if (!opts.skipUiSync && APP.activeTab === 'leaderboard') renderLeaderboardTab();
        return APP.lbData;
      }
      if (lbResp.ok) {
        const lbJson = await lbResp.json();
        if (lbJson?.ok && !lbJson.locked) {
          APP.lbData = {
            locked: false,
            week_key: lbJson.week_key || '',
            total_students: Number(lbJson.total_students || 0),
            leaderboard: Array.isArray(lbJson.leaderboard) ? lbJson.leaderboard : [],
            weekly_leaderboard: Array.isArray(lbJson.weekly_leaderboard) ? lbJson.weekly_leaderboard : [],
            exam_leaderboard: Array.isArray(lbJson.exam_leaderboard) ? lbJson.exam_leaderboard : [],
            my_rank: lbJson.my_rank || null
          };
          APP.lbFetchedAt = Date.now();
          if (APP.user && lbJson.my_rank?.entry) {
            APP.user.xp = Number(lbJson.my_rank.entry.xp ?? APP.user.xp ?? 0);
            APP.user.weekly_xp = Number(lbJson.my_rank.entry.weeklyXp ?? APP.user.weekly_xp ?? 0);
          }
          if (!opts.skipUiSync) {
            updateHeaderAuthUI();
            if (APP.activeTab === 'home') renderHomeTab();
            if (APP.activeTab === 'leaderboard') renderLeaderboardTab();
          }
          if (!opts.quiet) {
            toast('🏆 Đã cập nhật Bảng Xếp Hạng mới nhất!', 'success');
          }
        }
      }
    } catch {
      if (!opts.quiet) toast('Không thể tải Bảng Xếp Hạng mới nhất.', 'error');
    } finally {
      APP.lbLoading = false;
    }
    return APP.lbData;
  }

  async function fetchAuthAndLeaderboard() {
    try {
      const meResp = await fetch(`/api/auth?action=me&_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'x-pk9-visitor': getVisitorClientId() }
      });
      if (meResp.status === 403) {
        const banData = await meResp.json().catch(() => ({}));
        if (banData?.banned) {
          handleBannedResponse(banData);
          return;
        }
      }
      if (meResp.ok) {
        const meData = await meResp.json();
        APP.csrf = meData.csrf || APP.csrf;
        if (meData.authenticated && meData.user) {
          _clientBanLock = null;
          try { localStorage.removeItem('pk9_ban_notice'); } catch {}
          renderBanOverlay(null);
          APP.user = meData.user;
          _serverAdminVerified = Boolean(meData.is_admin && (meData.user.username === 'phucadmin' || (meData.user.is_admin && String(meData.user.admin_granted_by || '').toLowerCase() === 'phucadmin')));
          _serverSuperAdminVerified = Boolean(_serverAdminVerified && meData.is_super_admin && meData.user.username === 'phucadmin');
          APP.weakAdminPassword = Boolean(_serverAdminVerified && meData.weak_password_warning);
          window.PK9_RPG_STATE = meData.user.rpg || window.PK9_RPG_STATE || null;
          if (meData.user.progress?.done) {
            APP.doneMap = { ...APP.doneMap, ...meData.user.progress.done };
          }
          if (meData.user.progress?.notes) {
            APP.notesMap = { ...APP.notesMap, ...meData.user.progress.notes };
          }
          saveLocalProgress();
        } else {
          APP.user = null;
          _serverAdminVerified = false;
          _serverSuperAdminVerified = false;
          APP.weakAdminPassword = false;
          window.PK9_RPG_STATE = null;
          if (meData.device_banned) {
            renderBanOverlay({ ban_reason: meData.ban_reason || 'Thiết bị đã bị khóa vĩnh viễn do xâm nhập khu vực Quản trị.' });
          }
        }
      }
    } catch {}

    try {
      const cfgResp = await fetch(`/api/dashboard?action=public-config&_=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      if (cfgResp.ok) {
        const cfg = await cfgResp.json();
        APP.systemAnnouncement = cfg?.announcement || null;
        if (Array.isArray(cfg?.custom_khoa_chui)) APP.customKhoaChui = cfg.custom_khoa_chui;
        renderSystemAnnouncementBar();
      }
    } catch {}

    await refreshLeaderboard({ force: true, quiet: true, skipUiSync: true });

    updateHeaderAuthUI();
    enforceAdminDomHidden();
    if (APP.activeTab === 'home') renderHomeTab();
    if (APP.activeTab === 'leaderboard') renderLeaderboardTab();
    if (APP.activeTab === 'khoa-chui') renderKhoaChuiTab();
    if (APP.activeTab === 'admin') {
      if (isClientVerifiedAdmin()) {
        renderAdminTab();
        fetchAdminDetail();
      } else {
        switchTab('home', { force: true, keepScroll: true });
      }
    }
  }
  window.PK9_REFRESH_LEADERBOARD = refreshLeaderboard;
  window.PK9_REFRESH_AUTH_AND_LEADERBOARD = fetchAuthAndLeaderboard;
  window.PK9_GET_USER = () => (APP.user ? { ...APP.user } : null);
  window.PK9_GET_CSRF = () => APP.csrf;
  window.PK9_OPEN_AUTH = mode => openAuthModal(mode);
  window.PK9_ON_RPG_SYNC = (rpg, extra = {}) => {
    if (APP.user && rpg) APP.user.rpg = rpg;
    if (APP.user && typeof extra.xp === 'number') APP.user.xp = extra.xp;
    if (APP.user && typeof extra.weekly_xp === 'number') APP.user.weekly_xp = extra.weekly_xp;
    updateHeaderAuthUI();
    if (APP.activeTab === 'home') renderHomeTab();
    if (APP.activeTab === 'leaderboard') renderLeaderboardTab();
    if (APP.activeTab === 'flashcards') renderFlashcardsTab();
  };

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
    const lbNavPill = document.getElementById('pk9-nav-lb-pill');

    if (adminNavGroup) adminNavGroup.style.display = APP.isAdmin ? 'block' : 'none';
    if (adminNavBtn) adminNavBtn.style.display = APP.isAdmin ? 'flex' : 'none';
    if (topAdminBtn) topAdminBtn.style.display = APP.isAdmin ? 'inline-flex' : 'none';
    if (lbNavPill) {
      if (!APP.user) {
        lbNavPill.textContent = '🔒 Khóa';
        lbNavPill.className = 'pk9-nav-pill';
      } else if (APP.isAdmin) {
        lbNavPill.textContent = 'Ngoài BXH';
        lbNavPill.className = 'pk9-nav-pill';
      } else {
        lbNavPill.textContent = 'Đua Top';
        lbNavPill.className = 'pk9-nav-pill hot';
      }
    }

    const xpVal = APP.user ? Math.max(0, Number(APP.user.xp ?? 0)) : 0;
    const wkXpVal = APP.user ? Math.max(0, Number(APP.user.weekly_xp ?? 0)) : 0;
    const levelVal = Math.floor(xpVal / 100) + 1;
    const streakVal = APP.user ? Math.max(1, Number(APP.user.streak || 1)) : 0;

    if (xpChip) {
      if (!APP.user) {
        xpChip.innerHTML = `🔒 <span class="hide-xs">Khách • </span><b>BXH<span class="pk9-hide-mob-430"> Khóa</span></b>`;
        xpChip.title = 'Tài khoản Khách không được đua BXH — Đăng ký hoặc đăng nhập để mở khóa!';
      } else if (APP.isAdmin) {
        xpChip.innerHTML = `<span class="hide-xs">🛡️ Quản trị viên • Chuỗi </span>🔥<b>${streakVal}<span class="pk9-hide-mob-430">d</span></b><span class="hide-xs"> (Ngoài BXH)</span>`;
        xpChip.title = 'Xem Bảng Xếp Hạng (Admin ngoài BXH)';
      } else {
        xpChip.innerHTML = `<span class="hide-xs">🔥 Chuỗi ${streakVal} ngày • </span>⚡<b>${xpVal}<span class="pk9-hide-mob-430"> XP</span></b><span class="hide-xs"> (Lv.${levelVal})</span>`;
        xpChip.title = 'Xem thứ hạng của bạn trên BXH Tuần & Top';
      }
    }

    const rawAvatar = APP.user ? String(APP.user.avatar_data || APP.user.avatar_url || '') : '';
    const safeAvatar = /^(https?:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i.test(rawAvatar) ? rawAvatar : '';

    if (authBtn) {
      if (APP.user) {
        const displayName = esc(APP.user.display_name || APP.user.username);
        authBtn.setAttribute('data-open-auth', 'profile');
        authBtn.title = 'Cài đặt tài khoản & hồ sơ cá nhân';
        const avatarChip = safeAvatar
          ? `<img src="${esc(safeAvatar)}" alt="" style="width:20px;height:20px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.6);flex-shrink:0;" />`
          : `<span>${APP.isAdmin ? '🛡️' : '👤'}</span>`;
        authBtn.innerHTML = `${avatarChip}<span class="pk9-auth-name">${displayName}</span>`;
      } else {
        authBtn.setAttribute('data-open-auth', 'register');
        authBtn.title = 'Đăng ký / Đăng nhập tài khoản';
        authBtn.innerHTML = `<span>🚀</span><span class="pk9-auth-name">Đăng nhập</span><span class="hide-xs"> / Đăng ký (+100 XP)</span>`;
      }
    }

    if (sideCard) {
      const myRank = APP.lbData.my_rank;
      if (APP.user) {
        const rpgInfo = APP.user.rpg || window.PK9_RPG_STATE || {};
        const eqFrame = rpgInfo.equipped_details?.frame?.cssClass || 'pk9-frame-bronze';
        const avatarThumb = window.PK9_RPG_MODELS?.renderAvatarStageHtml
          ? window.PK9_RPG_MODELS.renderAvatarStageHtml({
              size: 'sm',
              avatarImgUrl: safeAvatar,
              outfitId: rpgInfo.equipped_details?.outfit?.id || 'outfit-scholar',
              frameClass: eqFrame,
              auraClass: rpgInfo.equipped_details?.aura?.cssClass || '',
              petId: rpgInfo.equipped_details?.pet?.id || '',
              petIcon: rpgInfo.equipped_details?.pet?.icon || ''
            })
          : (safeAvatar
              ? `<img class="${esc(eqFrame)}" src="${esc(safeAvatar)}" alt="${esc(APP.user.display_name || '')}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" />`
              : `<div class="${esc(eqFrame)}" style="width:38px;height:38px;border-radius:50%;background:${APP.isAdmin ? 'linear-gradient(135deg,#e11d48,#f59e0b)' : 'linear-gradient(135deg,#2563eb,#0d9488)'};color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${rpgInfo.equipped_details?.outfit?.icon || esc((APP.user.display_name || APP.user.username || 'K').slice(0, 1).toUpperCase())}</div>`);
        sideCard.innerHTML = `
          <div class="pk9-sf-compact-only">
            <button type="button" class="pk9-icon-btn pk9-sf-mini-btn" data-open-auth="profile" title="${esc(APP.user.display_name || APP.user.username)} — Cài đặt tài khoản">
              ${safeAvatar
                ? `<img src="${esc(safeAvatar)}" alt="${esc(APP.user.display_name || '')}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`
                : `<span>${APP.isSuperAdmin ? '👑' : APP.isAdmin ? '🛡️' : (rpgInfo.equipped_details?.outfit?.icon || esc((APP.user.display_name || APP.user.username || 'K').slice(0, 1).toUpperCase()))}</span>`}
            </button>
          </div>
          <div class="pk9-sf-expanded-only">
            <div style="display:flex;align-items:center;gap:0.65rem;margin-bottom:0.55rem;">
              ${avatarThumb}
              <div style="min-width:0;flex:1;">
                <div style="font-weight:800;font-size:0.84rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${esc(APP.user.display_name)} ${APP.isSuperAdmin ? '<span class="pk9-badge" style="background:linear-gradient(135deg,#eab308,#e11d48);color:#fff;font-size:0.65rem;">👑 SUPER ADMIN</span>' : APP.isAdmin ? '<span class="pk9-badge" style="background:#e11d48;color:#fff;font-size:0.65rem;">ADMIN</span>' : ''}
                </div>
                <div style="font-size:0.72rem;color:var(--pk9-text-muted);">
                  ${APP.isSuperAdmin ? `👑 Chủ Hệ Thống • Chuỗi ${streakVal} ngày` : APP.isAdmin ? `🛡️ Quản trị viên • Chuỗi ${streakVal} ngày` : `Lv.${levelVal} • ${xpVal} XP • 🪙${rpgInfo.gold ?? 180} · 💎${rpgInfo.diamonds ?? 5}`}
                </div>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.74rem;font-weight:700;padding-top:0.45rem;border-top:1px dashed var(--pk9-border);">
              ${APP.isAdmin
                ? `<span style="color:#e11d48;">🚫 Không tính leo Top BXH</span>`
                : `<span>🏆 Top Tuần: <b>#${myRank?.weeklyRank || '—'}</b></span><span>🌟 Top Tổng: <b>#${myRank?.topRank || '—'}</b></span>`}
            </div>
            <button type="button" class="pk9-btn-exam-ghost" data-open-auth="profile" style="width:100%;justify-content:center;padding:0.42rem;margin-top:0.55rem;font-size:0.78rem;">
              ⚙️ Cài đặt tài khoản
            </button>
            ${APP.isAdmin ? `
              <button type="button" class="pk9-auth-btn" data-nav-tab="admin" style="width:100%;justify-content:center;padding:0.45rem;margin-top:0.42rem;background:linear-gradient(135deg,#e11d48,#d97706);">
                🛡️ Mở Admin Dashboard Chi Tiết
              </button>
            ` : ''}
          </div>
        `;
      } else {
        sideCard.innerHTML = `
          <div class="pk9-sf-compact-only">
            <button type="button" class="pk9-auth-btn pk9-sf-mini-btn" data-open-auth="login" title="Đăng nhập / Đăng ký (+100 XP)">🔑</button>
          </div>
          <div class="pk9-sf-expanded-only">
            <div style="font-weight:800;font-size:0.83rem;margin-bottom:0.3rem;">🔒 Đua BXH Đang Bị Khóa</div>
            <div style="font-size:0.75rem;color:var(--pk9-text-muted);margin-bottom:0.65rem;">
              Tài khoản Khách chưa thể đua BXH. Đăng ký hoặc đăng nhập để mở khóa <b>BXH Tuần & Top</b> và nhận <b>+100 XP</b>!
            </div>
            <div style="display:flex;gap:0.4rem;">
              <button type="button" class="pk9-auth-btn" data-open-auth="register" style="flex:1;justify-content:center;padding:0.46rem 0.4rem;font-size:0.76rem;">
                ✨ Đăng ký
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-open-auth="login" style="flex:1;justify-content:center;padding:0.44rem 0.4rem;font-size:0.76rem;">
                🔑 Đăng nhập
              </button>
            </div>
          </div>
        `;
      }
    }
  }

  // ==========================================================================
  // TAB 1: HOME ECOSYSTEM DASHBOARD
  // ==========================================================================
  // ==========================================================================
  // UNIFIED REAL ECOSYSTEM STATS, DAILY CHALLENGE & SMART ONBOARDING HELPERS
  // ==========================================================================
  function getEcosystemStats() {
    const catalog = getCatalog();
    const coursesCount = catalog.length;
    const topicsCount = catalog.reduce((s, c) => s + getCourseTopicCount(c), 0);
    const coursePdfCount = catalog.reduce((s, c) => s + Number(c.pdfFileCount || 0), 0);
    const docsCount = typeof getAllDocsList === 'function' ? getAllDocsList().length : 84;
    const examCenterStats = window.PK9_EXAM_CENTER?.getStats?.() || {};
    const interactiveExamCount = Number(examCenterStats.interactiveCount || (Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS.length : 8));
    const sourceExamCount = Number(examCenterStats.sourceCount || ((Array.isArray(window.PK9_EXAM_SOURCES) ? window.PK9_EXAM_SOURCES.length : 0) + (Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27.length : 0)));

    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    let targetYear = vnNow.getUTCFullYear();
    const curExamDate = new Date(Date.UTC(targetYear, 5, 25)); // June 25
    if (vnNow > curExamDate) targetYear += 1;
    const daysToExam = Math.max(1, Math.ceil((new Date(Date.UTC(targetYear, 5, 25)) - vnNow) / 86400000));

    return {
      coursesCount,
      topicsCount,
      coursePdfCount,
      docsCount,
      interactiveExamCount,
      sourceExamCount,
      daysToExam,
      examTargetYear: targetYear
    };
  }

  function syncEcosystemCounters() {
    const st = getEcosystemStats();
    const lecPill = document.getElementById('pk9-nav-lectures-count');
    if (lecPill && st.topicsCount) {
      lecPill.textContent = `${st.topicsCount.toLocaleString('vi-VN')}+ bài`;
    }
    const docPill = document.getElementById('pk9-nav-docs-count');
    if (docPill && st.docsCount) {
      docPill.textContent = `${st.docsCount} Ebook`;
    }
    if (APP.activeTab === 'home') {
      const hStatCourses = document.getElementById('pk9-hero-courses-stat');
      const hStatTopics = document.getElementById('pk9-hero-topics-sub');
      const hStatExams = document.getElementById('pk9-hero-exams-stat');
      const hStatExamsSub = document.getElementById('pk9-hero-exams-sub');
      if (hStatCourses) hStatCourses.textContent = `${st.coursesCount} Khóa`;
      if (hStatTopics) hStatTopics.textContent = `${st.topicsCount.toLocaleString('vi-VN')}+ Video HD & Chuyên đề`;
      if (hStatExams) hStatExams.textContent = `${st.interactiveExamCount} Đề Chuẩn`;
      if (hStatExamsSub) hStatExamsSub.textContent = `Chấm 3 phần + ${st.sourceExamCount}+ đề Sở/Bộ`;
    }
  }
  window.PK9_SYNC_ECOSYSTEM_STATS = syncEcosystemCounters;

  const DAILY_BOSS_QUESTIONS = [
    {
      id: 'db-math-log',
      subject: 'Toán 12 • Bẫy ĐKXĐ',
      question: 'Số nghiệm nguyên của bất phương trình $\\log_2(x - 1) \\le 3$ là bao nhiêu? (Coi chừng quên điều kiện xác định!)',
      options: ['7 nghiệm nguyên', '8 nghiệm nguyên', '9 nghiệm nguyên', 'Vô số nghiệm nguyên'],
      correct: 1,
      explain: 'Điều kiện xác định: $x - 1 > 0 \\iff x > 1$. BPT tương đương $x - 1 \\le 2^3 = 8 \\iff x \\le 9$. Kết hợp được $1 < x \\le 9$, nên các nghiệm nguyên là $x \\in \\{2; 3; 4; 5; 6; 7; 8; 9\\}$ gồm <b>8 nghiệm</b>.',
      trap: 'Bẫy phổ biến: Lấy $x \\le 9$ rồi đếm từ $1$ thành 9 nghiệm (sai vì $x=1$ làm biểu thức dưới logarit bằng 0) hoặc đếm $9 - 1 = 8$ nhầm sang 7.'
    },
    {
      id: 'db-phys-shm',
      subject: 'Vật Lí 12 • Dao động',
      question: 'Một chất điểm dao động điều hòa với phương trình $x = 6\\cos(4\\pi t - \\frac{\\pi}{3})\\,\\text{(cm)}$. Tốc độ cực đại của chất điểm bằng:',
      options: ['12π cm/s', '24π cm/s', '96π² cm/s', '24 cm/s'],
      correct: 1,
      explain: 'Tốc độ cực đại $v_{\\max} = \\omega A = 4\\pi \\cdot 6 = 24\\pi\\,\\text{(cm/s)}$.',
      trap: 'Đáp án $96\\pi^2$ là gia tốc cực đại $\\omega^2 A$, còn $24$ bị thiếu $\\pi$ do nhầm $f$ và $\\omega$.'
    },
    {
      id: 'db-chem-ester',
      subject: 'Hóa Học 12 • Ester - Lipid',
      question: 'Thủy phân hoàn toàn ester $CH_3COOC_2H_5$ trong dung dịch $NaOH$ đun nóng thu được muối có công thức là:',
      options: ['CH₃COONa', 'HCOONa', 'C₂H₅COONa', 'C₂H₅ONa'],
      correct: 0,
      explain: 'Phương trình: $CH_3COOC_2H_5 + NaOH \\xrightarrow{t^\\circ} CH_3COONa + C_2H_5OH$. Muối tạo thành mang gốc axit $CH_3COO^-$.',
      trap: 'Lưu ý phân biệt phần gốc acid (trước nhóm $-COO-$) tạo muối, còn phần $-C_2H_5$ tạo alcohol $C_2H_5OH$, không tạo muối $C_2H_5ONa$.'
    },
    {
      id: 'db-eng-colloc',
      subject: 'Tiếng Anh 12 • Collocation',
      question: 'Choose the best option: "It is crucial that students _______ full advantage of public practice exams before the national test."',
      options: ['make', 'take', 'do', 'give'],
      correct: 1,
      explain: 'Cụm cố định chuẩn GDPT 2018: <b>take (full) advantage of + N/V-ing</b> = tận dụng tối đa cái gì.',
      trap: 'Dễ nhầm sang "make" (vì hay quen cụm "make use of" hoặc "make the most of").'
    },
    {
      id: 'db-dgnl-logic',
      subject: 'ĐGNL • Tư duy Logic',
      question: 'Trong phòng thi, nếu "Không nộp bài trễ" thì "Không bị trừ điểm". Mệnh đề nào sau đây chắc chắn ĐÚNG?',
      options: [
        'Nếu bị trừ điểm thì chắc chắn đã nộp bài trễ',
        'Nếu nộp bài đúng hạn thì chắc chắn đạt điểm tối đa',
        'Ai nộp bài trễ thì chắc chắn không làm được câu khó',
        'Nếu không bị trừ điểm thì chứng tỏ làm hết 100% bài'
      ],
      correct: 0,
      explain: 'Theo quy tắc phản đảo logic: $(P \\Rightarrow Q) \\iff (\\neg Q \\Rightarrow \\neg P)$. Gọi $P = \\text{"Không nộp trễ"}$, $Q = \\text{"Không bị trừ điểm"}$, suy ra $\\neg Q \\text{ (Bị trừ điểm)} \\Rightarrow \\neg P \\text{ (Đã nộp trễ)}$.',
      trap: 'Các lựa chọn khác đều đánh tráo khái niệm "không bị trừ điểm" sang "đạt điểm tối đa".'
    }
  ];

  function getVnTodayStr() {
    const vn = new Date(Date.now() + 7 * 60 * 60 * 1000);
    return `${vn.getUTCFullYear()}-${String(vn.getUTCMonth() + 1).padStart(2, '0')}-${String(vn.getUTCDate()).padStart(2, '0')}`;
  }

  function getTodayDailyBoss() {
    const key = getVnTodayStr();
    const dayNum = Math.floor(Date.now() / 86400000);
    const q = DAILY_BOSS_QUESTIONS[Math.abs(dayNum) % DAILY_BOSS_QUESTIONS.length];
    let pickedIdx = null;
    try {
      const saved = JSON.parse(localStorage.getItem(`pk9_daily_boss_${key}`) || 'null');
      if (saved && saved.id === q.id && typeof saved.picked === 'number') pickedIdx = saved.picked;
    } catch {}
    return { key, question: q, pickedIdx };
  }

  function getUserGoalPref() {
    try {
      const saved = JSON.parse(localStorage.getItem('pk9_user_goal') || 'null');
      if (saved && saved.grade && saved.target) return saved;
    } catch {}
    return {
      grade: APP.user?.settings?.preferred_grade || APP.gradeFilter || '2K9',
      target: '8+'
    };
  }

  const ADMIN_CONTACT_EMAIL = 'doivo250388@gmail.com';
  const ADMIN_CONTACT_PHONE = '0382952325';

  function buildGmailComposeUrl(subject, bodyText) {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ADMIN_CONTACT_EMAIL)}&su=${encodeURIComponent(subject || '[HỌC CÙNG PHÚC K9] Góp ý / Báo lỗi')}&body=${encodeURIComponent(bodyText || '')}`;
  }

  function buildMailtoUrl(subject, bodyText) {
    return `mailto:${ADMIN_CONTACT_EMAIL}?subject=${encodeURIComponent(subject || '[HỌC CÙNG PHÚC K9] Góp ý / Báo lỗi')}&body=${encodeURIComponent(bodyText || '')}`;
  }

  function closeFeedbackModal() {
    const ov = document.getElementById('pk9-feedback-modal');
    if (ov) ov.classList.remove('open');
  }

  function renderFeedbackModalBody() {
    const box = document.getElementById('pk9-feedback-modal-box');
    if (!box) return;
    const catDefs = [
      { id: 'bug', label: '🐛 Báo lỗi Video / PDF / Web' },
      { id: 'exam', label: '📝 Sai đáp án / Đề thi' },
      { id: 'feature', label: '💡 Góp ý tính năng mới' },
      { id: 'other', label: '🤝 Liên hệ / Khác' }
    ];
    const submitted = APP.feedbackSubmitted;
    const defaultName = APP.user?.display_name || APP.user?.username || '';

    box.innerHTML = `
      <div class="pk9-fb-head">
        <div>
          <div class="pk9-onboard-kicker" style="color:#059669;">💬 KÊNH GÓP Ý &amp; HỖ TRỢ TRỰC TIẾP • HỌC CÙNG PHÚC K9</div>
          <h3 style="margin:0.2rem 0 0;font-size:1.18rem;font-weight:900;">Gửi Feedback Về Cho Admin</h3>
        </div>
        <button type="button" class="pk9-icon-btn" data-close-feedback="1" aria-label="Đóng">✕</button>
      </div>

      <div class="pk9-fb-contact-strip">
        <div class="pk9-fb-contact-pill">
          <span>📧 Gmail: <b>${ADMIN_CONTACT_EMAIL}</b></span>
          <div class="pk9-fb-mini-acts">
            <a href="${buildMailtoUrl('[HỌC CÙNG PHÚC K9] Góp ý', '')}" class="pk9-admin-btn-xs primary" target="_blank" rel="noopener">Gửi Mail</a>
            <button type="button" class="pk9-admin-btn-xs" data-copy-contact="${ADMIN_CONTACT_EMAIL}">📋 Copy</button>
          </div>
        </div>
        <div class="pk9-fb-contact-pill">
          <span>📞 SĐT / Zalo: <b>${ADMIN_CONTACT_PHONE}</b></span>
          <div class="pk9-fb-mini-acts">
            <a href="https://zalo.me/${ADMIN_CONTACT_PHONE}" class="pk9-admin-btn-xs primary" target="_blank" rel="noopener">💬 Zalo</a>
            <a href="tel:${ADMIN_CONTACT_PHONE}" class="pk9-admin-btn-xs">📞 Gọi</a>
            <button type="button" class="pk9-admin-btn-xs" data-copy-contact="${ADMIN_CONTACT_PHONE}">📋 Copy</button>
          </div>
        </div>
      </div>

      ${submitted ? `
        <div class="pk9-fb-success-card">
          <div style="font-size:2rem;margin-bottom:0.35rem;">🎉</div>
          <h4 style="margin:0 0 0.35rem;font-size:1.05rem;font-weight:900;">Cảm Ơn Bạn Đã Đóng Góp Ý Kiến!</h4>
          <p style="margin:0 0 0.8rem;font-size:0.84rem;color:var(--pk9-text-muted);line-height:1.5;">
            ${esc(submitted.serverMessage || 'Góp ý của bạn đã được lưu vào Hộp thư Admin trên web.')}
            ${submitted.emailForwarded ? ' Hệ thống cũng đã chuyển tiếp bản sao tới Gmail Admin.' : ' Nếu cần gửi kèm ảnh chụp màn hình hoặc trao đổi gấp, hãy bấm nút bên dưới:'}
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:0.45rem;justify-content:center;margin-bottom:0.85rem;">
            <a href="${buildGmailComposeUrl(submitted.mailSubject, submitted.mailBody)}" target="_blank" rel="noopener" class="pk9-btn-exam-primary" style="flex:0 1 auto;padding:0.5rem 0.95rem;font-size:0.8rem;text-decoration:none;">
              📧 Mở Gmail gửi về ${ADMIN_CONTACT_EMAIL}
            </a>
            <a href="${buildMailtoUrl(submitted.mailSubject, submitted.mailBody)}" class="pk9-btn-exam-ghost" style="flex:0 1 auto;padding:0.5rem 0.9rem;font-size:0.8rem;text-decoration:none;">
              ✉️ App Email mặc định
            </a>
            <a href="https://zalo.me/${ADMIN_CONTACT_PHONE}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost" style="flex:0 1 auto;padding:0.5rem 0.9rem;font-size:0.8rem;text-decoration:none;">
              💬 Nhắn Zalo ${ADMIN_CONTACT_PHONE}
            </a>
          </div>
          <div style="display:flex;justify-content:center;gap:0.5rem;flex-wrap:wrap;">
            <button type="button" class="pk9-admin-btn-xs" data-fb-reset="1">✍️ Gửi thêm góp ý khác</button>
            <button type="button" class="pk9-admin-btn-xs primary" data-close-feedback="1">✓ Đóng cửa sổ</button>
          </div>
        </div>
      ` : `
        <form id="pk9-feedback-form" class="pk9-fb-form">
          ${APP.feedbackContext ? `
            <div class="pk9-fb-context-badge">
              <span>📍 Đang gắn ngữ cảnh: <b>${esc(APP.feedbackContext)}</b></span>
              <button type="button" class="pk9-admin-btn-xs" data-fb-clear-ctx="1">✕ Bỏ</button>
            </div>
          ` : ''}
          <div>
            <label class="pk9-fb-label">1. Bạn hài lòng mức nào với web?</label>
            <div class="pk9-fb-stars" role="group" aria-label="Đánh giá sao">
              ${[1, 2, 3, 4, 5].map(star => `
                <button type="button" class="pk9-fb-star-btn ${Number(APP.feedbackRating || 5) >= star ? 'active' : ''}" data-fb-star="${star}" title="${star} sao">
                  ★
                </button>
              `).join('')}
              <span style="font-size:0.78rem;font-weight:800;color:var(--pk9-text-muted);margin-left:0.35rem;">
                ${['', 'Rất cần cải thiện', 'Chưa hài lòng lắm', 'Ổn, cần thêm chỉnh sửa', 'Rất tốt!', 'Tuyệt vời 5 sao!'][Math.min(5, Math.max(1, Number(APP.feedbackRating || 5)))]}
              </span>
            </div>
          </div>

          <div>
            <label class="pk9-fb-label">2. Chọn chủ đề góp ý:</label>
            <div style="display:flex;flex-wrap:wrap;gap:0.38rem;">
              ${catDefs.map(c => `
                <button type="button" class="pk9-exam-chip ${APP.feedbackCategory === c.id ? 'active' : ''}" data-fb-cat="${c.id}" style="padding:0.32rem 0.65rem;font-size:0.76rem;">
                  ${c.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="pk9-fb-row-2">
            <div>
              <label class="pk9-fb-label" for="pk9-fb-name">Tên của bạn:</label>
              <input type="text" id="pk9-fb-name" name="name" class="pk9-input" maxlength="80" placeholder="VD: Minh Anh 2K9..." value="${esc(defaultName)}" />
            </div>
            <div>
              <label class="pk9-fb-label" for="pk9-fb-contact">SĐT / Zalo / Gmail nhận hồi âm (tùy chọn):</label>
              <input type="text" id="pk9-fb-contact" name="contact" class="pk9-input" maxlength="120" placeholder="VD: 09xx... hoặc email@gmail.com" />
            </div>
          </div>

          <div>
            <label class="pk9-fb-label" for="pk9-fb-msg">3. Nội dung chi tiết <span style="color:#e11d48;">*</span></label>
            <textarea id="pk9-fb-msg" name="message" class="pk9-input pk9-fb-textarea" rows="4" minlength="6" maxlength="1500" required placeholder="Mô tả lỗi bạn gặp (link video/PDF hỏng, sai đáp án câu nào...) hoặc tính năng bạn muốn Admin bổ sung thêm..."></textarea>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-top:0.2rem;">
            <span style="font-size:0.74rem;color:var(--pk9-text-muted);">
              🔒 Gửi trực tiếp về Admin • Hoạt động ngay cả khi chưa đăng nhập.
            </span>
            <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
              <button type="button" class="pk9-btn-exam-ghost" data-close-feedback="1" style="padding:0.5rem 0.9rem;font-size:0.82rem;">Hủy</button>
              <button type="submit" class="pk9-btn-exam-primary" id="pk9-fb-submit-btn" style="padding:0.5rem 1.15rem;font-size:0.84rem;">🚀 Gửi Feedback Cho Admin</button>
            </div>
          </div>
        </form>
      `}
    `;
  }

  function openFeedbackModal(opts = {}) {
    const ov = document.getElementById('pk9-feedback-modal');
    if (!ov) return;
    if (opts.category) APP.feedbackCategory = opts.category;
    if (opts.context !== undefined) {
      APP.feedbackContext = String(opts.context || '').trim().slice(0, 180);
    } else {
      APP.feedbackContext = `Mục: ${TAB_LABELS_VI[APP.activeTab] || APP.activeTab || 'Trang chủ'}`;
    }
    APP.feedbackSubmitted = null;
    renderFeedbackModalBody();
    ov.classList.add('open');
  }

  function closeOnboardingModal() {
    const ov = document.getElementById('pk9-onboarding-modal');
    if (ov) ov.classList.remove('open');
    try {
      if (APP.user?.username) {
        localStorage.setItem(`pk9_onboard_member_v1_${String(APP.user.username).toLowerCase()}`, '1');
      } else {
        localStorage.setItem('pk9_onboard_guest_v1', '1');
      }
    } catch {}
  }

  function openOnboardingModal(mode = 'auto') {
    const ov = document.getElementById('pk9-onboarding-modal');
    const box = document.getElementById('pk9-onboarding-modal-box');
    if (!ov || !box) return;
    const isMember = mode === 'member' ? true : (mode === 'guest' ? false : Boolean(APP.user));
    const stats = getEcosystemStats();
    const uname = esc(APP.user?.display_name || APP.user?.username || 'Bạn');

    box.innerHTML = isMember ? `
      <div class="pk9-onboard-head member">
        <div>
          <div class="pk9-onboard-kicker">🎉 CHÀO MỪNG THÀNH VIÊN CHÍNH THỨC • HỌC CÙNG PHÚC K9</div>
          <h3 style="margin:0.2rem 0 0;font-size:1.2rem;font-weight:900;">Hành Trang Tân Binh Cho ${uname}</h3>
        </div>
        <button type="button" class="pk9-icon-btn" data-close-onboarding="1" aria-label="Đóng">✕</button>
      </div>
      <div style="font-size:0.84rem;color:var(--pk9-text-muted);margin:0.65rem 0 0.85rem;line-height:1.5;">
        Tài khoản của bạn đã mở khóa toàn bộ <b>BXH Tuần, Ví Vàng/Kim Cương, Cửa Hàng Khung Avatar Nitro Discord & Lưu tiến độ đồng bộ</b>. Dưới đây là 4 bước dùng web hiệu quả nhất:
      </div>
      <div class="pk9-onboard-steps">
        <div class="pk9-onboard-step">
          <span class="pk9-step-num">1</span>
          <div style="min-width:0;flex:1;">
            <strong>Chọn đúng Thầy/Cô & Video Bài Giảng (${stats.topicsCount.toLocaleString('vi-VN')}+ bài)</strong>
            <div>Bấm nút Phát thương hiệu <b>HỌC CÙNG PHÚC K9</b> trên khung video để học nhanh không lag, tải PDF & ghi chú mốc giây ngay bên dưới.</div>
            <button type="button" class="pk9-admin-btn-xs primary" data-nav-tab="lectures" data-close-onboarding="1" style="margin-top:0.35rem;">🎬 Vào Phòng Video ngay</button>
          </div>
        </div>
        <div class="pk9-onboard-step">
          <span class="pk9-step-num">2</span>
          <div style="min-width:0;flex:1;">
            <strong>Điểm danh 24h & Giải đề nhận XP đua Top Tuần</strong>
            <div>Mỗi ngày điểm danh nhận Vàng, làm bài trong <b>Kho Luyện Đề (${stats.interactiveExamCount} đề + ${stats.sourceExamCount}+ đề gốc)</b> để tích XP lên Bảng Vàng.</div>
            <button type="button" class="pk9-admin-btn-xs" data-nav-tab="exams" data-close-onboarding="1" style="margin-top:0.35rem;">🏛️ Vào Kho Luyện Đề</button>
          </div>
        </div>
        <div class="pk9-onboard-step">
          <span class="pk9-step-num">3</span>
          <div style="min-width:0;flex:1;">
            <strong>Đeo Khung Viền Avatar Nitro Discord & Hào Quang 3D</strong>
            <div>Vào Siêu Thị 3D để thử miễn phí các khung động kiểu Discord Nitro (<i>Hoa Anh Đào, Tai Mèo Neon, Glitch, Sao Thổ, Hắc Hỏa</i>) lên avatar của bạn!</div>
            <button type="button" class="pk9-admin-btn-xs" data-nav-tab="shop" data-close-onboarding="1" style="margin-top:0.35rem;">🛍️ Mở Shop &amp; Khung Nitro</button>
          </div>
        </div>
        <div class="pk9-onboard-step">
          <span class="pk9-step-num">4</span>
          <div style="min-width:0;flex:1;">
            <strong>Lấy Thẻ Học Viên QR &amp; Sổ Câu Sai tự động</strong>
            <div>Mở Thẻ QR cá nhân để lưu ảnh thành tích hoặc dùng <b>Gia Sư AI 24/7</b> giải bài mọi lúc.</div>
            <button type="button" class="pk9-admin-btn-xs" data-nav-tab="idcard" data-close-onboarding="1" style="margin-top:0.35rem;">🪪 Xem Thẻ Học Viên QR</button>
          </div>
        </div>
      </div>
      <div class="pk9-onboard-foot">
        <button type="button" class="pk9-btn-exam-ghost" data-switch-onboard-mode="guest" style="font-size:0.78rem;">👀 Xem hướng dẫn Khách</button>
        <button type="button" class="pk9-btn-exam-primary" data-close-onboarding="1" style="padding:0.55rem 1.25rem;">✅ Bắt Đầu Học Ngay!</button>
      </div>
    ` : `
      <div class="pk9-onboard-head guest">
        <div>
          <div class="pk9-onboard-kicker">👋 LẦN ĐẦU TỚI HỌC CÙNG PHÚC K9 • HƯỚNG DẪN NHANH</div>
          <h3 style="margin:0.2rem 0 0;font-size:1.2rem;font-weight:900;">Bứt Phá Điểm Số Trong 3 Bước Dễ Hiểu</h3>
        </div>
        <button type="button" class="pk9-icon-btn" data-close-onboarding="1" aria-label="Đóng">✕</button>
      </div>
      <div style="font-size:0.84rem;color:var(--pk9-text-muted);margin:0.65rem 0 0.85rem;line-height:1.5;">
        Bạn đang dùng chế độ <b>Khách (Miễn phí 100%)</b> — hoàn toàn có thể học thử bài giảng, bấm Casio làm đề thi Sở/Bộ ngay mà chưa cần đăng ký. Tuy nhiên để lưu tiến độ &amp; mở khóa BXH, hãy tạo tài khoản 10 giây!
      </div>
      <div class="pk9-onboard-steps">
        <div class="pk9-onboard-step">
          <span class="pk9-step-num">1</span>
          <div style="min-width:0;flex:1;">
            <strong>Chọn Khối → Môn → Thầy/Cô bạn muốn học</strong>
            <div>Vào mục <b>Video Bài Giảng (${stats.topicsCount.toLocaleString('vi-VN')}+ bài)</b>, bấm nút Phát mang logo Phúc K9 để xem bài + đọc/tải PDF kèm theo.</div>
            <button type="button" class="pk9-admin-btn-xs" data-nav-tab="lectures" data-close-onboarding="1" style="margin-top:0.35rem;">🎬 Xem Thử Video Ngay</button>
          </div>
        </div>
        <div class="pk9-onboard-step">
          <span class="pk9-step-num">2</span>
          <div style="min-width:0;flex:1;">
            <strong>Thử ngay Kho Luyện Đề 3 Phần &amp; Thử Thách 1 Câu Hôm Nay</strong>
            <div>Hệ thống chấm điểm tự động chuẩn 2018 (Trắc nghiệm, Đúng-Sai, Trả lời ngắn), có sẵn máy tính Casio &amp; bảng nháp.</div>
            <button type="button" class="pk9-admin-btn-xs" data-nav-tab="exams" data-close-onboarding="1" style="margin-top:0.35rem;">🏛️ Làm Đề Thử Ngay</button>
          </div>
        </div>
        <div class="pk9-onboard-step highlight">
          <span class="pk9-step-num">3</span>
          <div style="min-width:0;flex:1;">
            <strong>Đăng Ký / Đăng Nhập để mở toàn bộ quyền lợi Thành viên (+100 XP)</strong>
            <div>Lưu tiến độ vĩnh viễn, đua Top BXH Tuần, nhận Vàng mở <b>Khung Avatar kiểu Discord Nitro</b> &amp; tạo <b>Thẻ Học Viên QR</b>!</div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.42rem;">
              <button type="button" class="pk9-btn-exam-primary" data-close-onboarding="1" data-open-auth="register" style="padding:0.42rem 0.9rem;font-size:0.78rem;">🚀 Đăng Ký Miễn Phí (+100 XP)</button>
              <button type="button" class="pk9-btn-exam-ghost" data-close-onboarding="1" data-open-auth="login" style="padding:0.42rem 0.78rem;font-size:0.78rem;">🔑 Đăng Nhập</button>
            </div>
          </div>
        </div>
      </div>
      <div class="pk9-onboard-foot">
        <button type="button" class="pk9-btn-exam-ghost" data-switch-onboard-mode="member" style="font-size:0.78rem;">🛡️ Xem trước giao diện sau khi Đăng nhập</button>
        <button type="button" class="pk9-btn-exam-ghost" data-close-onboarding="1" style="font-size:0.8rem;">👀 Tiếp tục xem dạng Khách</button>
      </div>
    `;
    ov.classList.add('open');
  }

  function renderHomeTab() {
    const root = document.getElementById('tab-home');
    if (!root) return;

    const catalog = getCatalog();
    const filteredCourses = APP.gradeFilter === 'ALL'
      ? catalog
      : catalog.filter(c => c.grade === APP.gradeFilter);

    const s2k9Map = new Map();
    let total2k9Pdfs = 0;
    for (const c of catalog.filter(x => x.grade === '2K9')) {
      if (!s2k9Map.has(c.subject)) {
        s2k9Map.set(c.subject, { subject: c.subject, icon: c.icon, teachers: [], topics: 0, videos: 0, pdfs: 0 });
      }
      const entry = s2k9Map.get(c.subject);
      const tCount = getCourseTopicCount(c);
      const pCount = Number(c.pdfFileCount || 0);
      entry.teachers.push(c);
      entry.topics += tCount;
      entry.videos += tCount;
      entry.pdfs += pCount;
      total2k9Pdfs += pCount;
    }
    const subjects2k9List = Array.from(s2k9Map.values());
    const doneTotal = Object.values(APP.doneMap || {}).filter(Boolean).length;
    const seedExams = (window.PK9_SEED_EXAMS || []).slice(0, 8);
    const topWeekly = (APP.lbData?.weekly_leaderboard || [])
      .filter(r => !r.is_admin && r.role !== 'admin')
      .slice(0, 3);

    const stats = getEcosystemStats();
    const totalTopics = stats.topicsCount;
    const goalPref = getUserGoalPref();
    const boss = getTodayDailyBoss();
    const bq = boss.question;
    const bossAnswered = typeof boss.pickedIdx === 'number';
    const bossCorrect = bossAnswered && boss.pickedIdx === bq.correct;

    const goalMap = {
      '2K9': { label: 'Khối 12 (THPT 2K9)', courseId: '2k9-toan-thay-do-van-duc', examSubject: 'Toán' },
      'DGNL': { label: 'Luyện ĐGNL (V-ACT/HSA/TSA)', courseId: catalog.find(c => c.grade === 'DGNL')?.id || '2k9-toan-thay-do-van-duc', examSubject: 'ĐGNL' },
      '2K11': { label: 'Khối 10 Mới (2K11)', courseId: catalog.find(c => c.grade === '2K11')?.id || '2k9-toan-thay-do-van-duc', examSubject: 'Toán' },
      '2K12': { label: 'Ôn Thi Vào 10 (2K12)', courseId: catalog.find(c => c.grade === '2K12')?.id || '2k9-toan-thay-do-van-duc', examSubject: 'Toán' }
    };
    const activeGoalCfg = goalMap[goalPref.grade] || goalMap['2K9'];
    const goalAdvice = goalPref.target === '9+'
      ? 'Ưu tiên chuyên đề Vận dụng cao + luyện đề Sở/Bộ bấm giờ chuẩn & phân tích sổ câu sai mỗi tối.'
      : goalPref.target === '8+'
      ? 'Nắm chắc toàn bộ nền tảng trọng tâm + luyện thuần thục Phần II Đúng/Sai để không mất điểm oan.'
      : 'Học bài nền tảng cốt lõi từng chương, bấm xem video từng bước & ôn Flashcard công thức hằng ngày.';

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
                <span>⚡ <span class="pk9-hide-mob-xs">HỆ SINH THÁI GIÁO DỤC TOÀN DIỆN • </span>HỌC CÙNG PHÚC K9</span>
              </div>
            </div>
            <h1>
              Bứt Phá Điểm Số 9+ Cùng<br/>
              <span>HỌC CÙNG PHÚC K9</span>
            </h1>
            <p>
              Nền tảng luyện thi thế hệ mới tích hợp <b>${totalTopics.toLocaleString('vi-VN')}+ Video bài giảng &amp; PDF công khai</b><span class="pk9-hide-mob-xs"> theo từng Thầy/Cô (Toán, Lí, Hóa, Sinh, Anh, Văn, Sử, Địa &amp; ĐGNL)</span>, <b>Kho đề Sở/Bộ chấm tự động 3 phần</b> và <b>BXH Học Viên</b>.
            </p>
            <div class="pk9-hero-ctas">
              <button type="button" class="pk9-btn-hero-main" data-nav-tab="lectures">
                🎬 <span class="pk9-hide-mob-xs">Vào Phòng Học Video (${totalTopics.toLocaleString('vi-VN')}+ bài)</span><span class="pk9-show-mob-xs">Học Video</span>
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-nav-tab="exams">
                🏛️ <span class="pk9-hide-mob-xs">Luyện Đề Chấm Tự Động (${stats.interactiveExamCount}+ đề)</span><span class="pk9-show-mob-xs">Luyện Đề</span>
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-nav-tab="khoa-chui" style="background:linear-gradient(135deg,rgba(16,185,129,0.28),rgba(37,99,235,0.28));border-color:rgba(52,211,153,0.6);">
                📖 <span class="pk9-hide-mob-xs">Thư Viện Công Khai</span><span class="pk9-show-mob-xs">Công khai</span>
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-open-onboarding="auto">
                ❓ <span class="pk9-hide-mob-xs">Hướng Dẫn Tân Thủ</span><span class="pk9-show-mob-xs">Hướng dẫn</span>
              </button>
            </div>
          </div>
          <div class="pk9-hero-stats-card">
            <div class="pk9-stat-box">
              <strong id="pk9-hero-courses-stat">${stats.coursesCount} Khóa</strong>
              <span id="pk9-hero-topics-sub">${totalTopics.toLocaleString('vi-VN')}+ Video HD &amp; Chuyên đề</span>
            </div>
            <div class="pk9-stat-box">
              <strong id="pk9-hero-exams-stat">${stats.interactiveExamCount} Đề Chuẩn</strong>
              <span id="pk9-hero-exams-sub">Chấm 3 phần + ${stats.sourceExamCount}+ đề Sở/Bộ</span>
            </div>
            <div class="pk9-stat-box">
              <strong>${stats.docsCount} Bộ Ebook</strong>
              <span>+${stats.coursePdfCount.toLocaleString('vi-VN')} PDF gắn theo từng bài</span>
            </div>
            <div class="pk9-stat-box">
              ${APP.user ? `
                <strong>${doneTotal} Bài</strong>
                <span>Bạn đã hoàn thành trên hệ thống</span>
              ` : `
                <strong>${stats.daysToExam} Ngày</strong>
                <span>Đếm ngược THPT ${stats.examTargetYear} • Thử ngay miễn phí</span>
              `}
            </div>
          </div>
        </div>
      </section>

      <!-- MỤC TIÊU CÁ NHÂN & THỬ THÁCH 1 CÂU HÔM NAY (HOẠT ĐỘNG NGAY CHO CẢ KHÁCH) -->
      <section class="pk9-home-starter-grid">
        <div class="pk9-card pk9-goal-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.55rem;">
            <span class="pk9-badge pk9-badge-subj">🎯 LỘ TRÌNH CÁ NHÂN HÓA</span>
            <span style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);">Chọn nhanh để gợi ý đúng việc cần học</span>
          </div>
          <h3 style="margin:0 0 0.55rem;font-size:1.05rem;font-weight:900;">Em đang ôn khối nào &amp; đặt mục tiêu mấy điểm?</h3>
          <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.5rem;">
            ${Object.entries(goalMap).map(([gKey, cfg]) => `
              <button type="button" class="pk9-exam-chip ${goalPref.grade === gKey ? 'active' : ''}" data-set-goal-grade="${gKey}" style="padding:0.32rem 0.65rem;font-size:0.76rem;">
                ${esc(cfg.label)}
              </button>
            `).join('')}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.35rem;align-items:center;margin-bottom:0.65rem;">
            <span style="font-size:0.76rem;font-weight:800;color:var(--pk9-text-muted);">Mục tiêu:</span>
            ${['7+', '8+', '9+'].map(tgt => `
              <button type="button" class="pk9-exam-chip ${goalPref.target === tgt ? 'active' : ''}" data-set-goal-target="${tgt}" style="padding:0.28rem 0.68rem;font-size:0.76rem;">
                🎯 ${tgt} điểm
              </button>
            `).join('')}
          </div>
          <div style="font-size:0.82rem;color:var(--pk9-text-muted);padding:0.58rem 0.78rem;border-radius:0.82rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);margin-bottom:0.72rem;line-height:1.45;">
            💡 <b>Gợi ý cho ${esc(activeGoalCfg.label)} (${esc(goalPref.target)}):</b> ${esc(goalAdvice)}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 150px),1fr));gap:0.42rem;">
            <button type="button" class="pk9-btn-exam-primary" data-open-lecture-course="${esc(activeGoalCfg.courseId)}" style="font-size:0.78rem;padding:0.52rem 0.65rem;">
              ${APP.resumeItem ? '▶️ Học bài tiếp theo' : '🎬 Vào Video mục tiêu'}
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="exams" style="font-size:0.78rem;padding:0.52rem 0.65rem;">
              🏛️ Làm 1 đề hôm nay
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="flashcards" style="font-size:0.78rem;padding:0.52rem 0.65rem;">
              🃏 Ôn Flashcards 3D
            </button>
          </div>
        </div>

        <div class="pk9-card pk9-daily-boss-card" id="pk9-daily-boss-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">
            <span class="pk9-badge pk9-badge-hot">⚡ THỬ THÁCH 1 CÂU HÔM NAY</span>
            <span class="pk9-badge pk9-badge-code">${esc(bq.subject)}</span>
          </div>
          <div style="font-size:0.9rem;font-weight:700;line-height:1.55;margin-bottom:0.65rem;">${bq.question}</div>
          <div class="pk9-daily-boss-opts">
            ${bq.options.map((opt, idx) => {
              const letter = ['A', 'B', 'C', 'D'][idx];
              let cls = 'pk9-daily-opt-btn';
              if (bossAnswered) {
                if (idx === bq.correct) cls += ' is-correct';
                else if (idx === boss.pickedIdx) cls += ' is-wrong';
              }
              return `
                <button type="button" class="${cls}" data-daily-pick="${idx}" ${bossAnswered ? 'disabled' : ''}>
                  <span class="pk9-daily-letter">${letter}</span>
                  <span>${esc(opt)}</span>
                </button>
              `;
            }).join('')}
          </div>
          ${bossAnswered ? `
            <div class="pk9-daily-explain ${bossCorrect ? 'ok' : 'bad'}">
              <div style="font-weight:900;margin-bottom:0.25rem;">
                ${bossCorrect ? '🎉 Chính xác! Tư duy rất chắc!' : '⚠️ Dính bẫy nhẹ rồi! Xem ngay lý do bên dưới:'}
              </div>
              <div style="font-size:0.81rem;line-height:1.5;">${bq.explain}</div>
              <div style="font-size:0.77rem;color:var(--pk9-text-muted);margin-top:0.35rem;">🪤 ${esc(bq.trap)}</div>
              ${!APP.user ? `
                <div style="margin-top:0.55rem;">
                  <button type="button" class="pk9-btn-exam-primary" data-open-auth="register" style="padding:0.42rem 0.9rem;font-size:0.78rem;">
                    💾 Lưu thành tích &amp; nhận +100 XP chào mừng
                  </button>
                </div>
              ` : ''}
            </div>
          ` : `
            <div style="font-size:0.75rem;color:var(--pk9-text-muted);margin-top:0.45rem;">
              👆 Chọn đáp án trực tiếp (không cần đăng nhập) để xem giải thích &amp; phân tích bẫy!
            </div>
          `}
        </div>
      </section>

      <div class="pk9-mob-shortcut-strip" aria-label="Công cụ nhanh trên di động">
        <button type="button" class="pk9-mob-tool-pill" data-open-cmd="1">🔍 Tìm bài / đề</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="missions">⚡ Luyện nhiệm vụ</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="shop">🛍️ Cửa hàng & Túi</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="periodic">⚗️ Bảng tuần hoàn</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="journey">🗺️ Vượt đảo</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="idcard">🪪 Thẻ QR</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="docs">📚 Thư viện PDF</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="flashcards">🃏 Flashcards 3D</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="archive">🗂️ Tổng ôn 2K8</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="planner">⏱️ Pomodoro 9+</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="ai">🤖 Trợ lý AI</button>
        <button type="button" class="pk9-mob-tool-pill" data-nav-tab="community">🤝 Cộng đồng</button>
        <button type="button" class="pk9-mob-tool-pill" data-open-auth="profile">👤 Tài khoản</button>
        ${APP.isAdmin ? '<button type="button" class="pk9-mob-tool-pill" data-nav-tab="admin" style="color:#e11d48;border-color:rgba(225,29,72,0.35);">🛡️ Admin Pro</button>' : ''}
      </div>

      ${window.PK9_RPG && typeof window.PK9_RPG.renderHomeWidget === 'function' ? window.PK9_RPG.renderHomeWidget(APP.user, APP.isAdmin) : ''}

      ${!APP.isStandalone ? `
        <div class="pk9-mob-app-banner">
          <div style="flex:1 1 min(100%, 200px);min-width:0;">
            <div style="font-size:0.74rem;font-weight:800;color:var(--pk9-primary);text-transform:uppercase;">📲 Trải Nghiệm App Trên Điện Thoại</div>
            <div style="font-size:0.96rem;font-weight:800;margin-top:0.12rem;">Cài đặt App Học Cùng Phúc K9 & Tải PDF học offline</div>
            <div style="font-size:0.8rem;color:var(--pk9-text-muted);margin-top:0.15rem;">Mở nhanh toàn màn hình từ Màn hình chính iOS/Android, tải mọi tài liệu PDF bài giảng về máy 1 chạm.</div>
          </div>
          <button type="button" class="pk9-btn-exam-primary" data-install-app="1" style="flex:0 0 auto;min-height:44px;">
            📲 Tải App Về Điện Thoại
          </button>
        </div>
      ` : ''}

      <!-- BANNER TRUY CẬP THẲNG THƯ VIỆN CÔNG KHAI TRONG WEB -->
      <div class="pk9-card" style="margin-bottom:1.25rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.85rem;background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(37,99,235,0.12));border:1.5px solid rgba(16,185,129,0.38);">
        <div style="flex:1 1 min(100%, 220px);min-width:0;">
          <div style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.73rem;font-weight:900;color:#0d9488;text-transform:uppercase;margin-bottom:0.2rem;">
            <span class="pk9-live-dot"></span> TỔNG HỢP CÔNG KHAI • GHI RÕ NGUỒN GIẢNG VIÊN
          </div>
          <div style="font-size:1.08rem;font-weight:900;">📖 Thư Viện Video Công Khai &amp; Tài Liệu Tham Khảo 2K8 / 2K9</div>
          <div style="font-size:0.83rem;color:var(--pk9-text-muted);margin-top:0.15rem;">
            Truy cập nhanh bảng tổng hợp các chuyên đề công khai Toán, Lí, Hóa, Sinh, Anh, Văn, ĐGNL ngay trong giao diện web — hỗ trợ phóng to toàn màn hình &amp; ghi công nguồn gốc đầy đủ.
          </div>
        </div>
        <div style="display:flex;gap:0.55rem;flex-wrap:wrap;">
          <button type="button" class="pk9-auth-btn" data-nav-tab="khoa-chui" style="background:linear-gradient(135deg,#0d9488,#2563eb);">
            📖 Mở Thư Viện Công Khai
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
        <div class="pk9-grade-filter-row" style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          ${['2K9', '2K8', 'DGNL', '2K11', '2K12', 'ALL'].map(g => `
            <button type="button" class="pk9-exam-chip ${APP.gradeFilter === g ? 'active' : ''}" data-set-grade="${g}">
              ${g === '2K9' ? `🎓 Theo Giáo Viên (${subjects2k9List.length} Môn & ĐGNL)` : g === '2K8' ? '🔥 Tuyển Chọn 2K8' : g === 'DGNL' ? '🏛️ ĐGNL & ĐGTD' : g === '2K11' ? '📘 Lớp 10 Mới (2K11)' : g === '2K12' ? '🎯 Ôn Vào 10 (2K12)' : `🌐 Tất cả (${catalog.length} khóa)`}
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
          💡 Đang có sẵn <b>${catalog.filter(c => c.grade === '2K9').length} giáo viên</b> trên <b>${subjects2k9List.length} môn & ĐGNL</b> với tổng <b>${total2k9Pdfs} file PDF</b> đề thi & bản viết tay (100% link công khai). Vào tab <b>Video Bài Giảng</b> để chọn đúng Thầy/Cô bạn đang học!
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
          <p>${APP.user
            ? 'Theo dõi điểm luyện đề, XP tích lũy mỗi ngày và tranh ngôi Thủ khoa Tuần.'
            : 'Tính năng Đua Bảng Xếp Hạng chỉ mở cho thành viên đã đăng nhập hoặc đăng ký tài khoản.'}</p>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${!APP.user ? `
            <button type="button" class="pk9-auth-btn" data-open-auth="register">
              🔓 Đăng ký mở khóa BXH (+100 XP)
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-open-auth="login">
              🔑 Đăng nhập
            </button>
          ` : `
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="leaderboard">
              Xem đầy đủ BXH Tuần & Top →
            </button>
          `}
        </div>
      </div>

      ${!APP.user ? `
        <div class="pk9-card" style="text-align:center;padding:2rem 1.25rem;background:linear-gradient(135deg,rgba(37,99,235,0.06),rgba(13,148,136,0.06));border:1.5px dashed rgba(37,99,235,0.35);">
          <div style="font-size:2.3rem;margin-bottom:0.45rem;">🔒</div>
          <div style="font-weight:900;font-size:1.1rem;margin-bottom:0.4rem;">Đấu Trường BXH Đang Bị Khóa Với Tài Khoản Khách</div>
          <p style="margin:0 auto 1.05rem;max-width:560px;font-size:0.87rem;color:var(--pk9-text-muted);line-height:1.55;">
            Tài khoản Khách vẫn có thể xem bài giảng và làm đề thử, nhưng <b>không thể xem hoặc đua Bảng Xếp Hạng</b>. Hãy đăng ký (miễn phí 10 giây) hoặc đăng nhập để mở khóa BXH Tuần, BXH Top & BXH Cao Thủ Luyện Đề!
          </p>
          <div style="display:flex;justify-content:center;gap:0.65rem;flex-wrap:wrap;">
            <button type="button" class="pk9-auth-btn" data-open-auth="register">
              ✨ Đăng ký mở khóa BXH (+100 XP)
            </button>
            <button type="button" class="pk9-btn-exam-ghost" data-open-auth="login">
              🔑 Đã có tài khoản? Đăng nhập
            </button>
          </div>
        </div>
      ` : topWeekly.length ? `
        <div class="pk9-lb-podium">
          ${(topWeekly.length >= 3 ? [topWeekly[1], topWeekly[0], topWeekly[2]] : topWeekly).filter(Boolean).map(row => {
            const r = row.rank;
            const crown = r === 1 ? '👑' : r === 2 ? '🥈' : '🥉';
            return `
              <div class="pk9-podium-card rank-${r}">
                <div class="pk9-podium-crown">${crown}</div>
                ${window.PK9_RPG_MODELS?.renderAvatarStageHtml ? window.PK9_RPG_MODELS.renderAvatarStageHtml({
                  size: 'md',
                  outfitId: row.rpg_outfit_id || 'outfit-scholar',
                  frameClass: row.rpg_frame || 'pk9-frame-bronze',
                  auraClass: row.rpg_aura || '',
                  petId: row.rpg_pet_id || '',
                  petIcon: row.rpg_pet || '',
                  avatarImgUrl: row.avatar_url || row.avatar_data || ''
                }) : `<div class="pk9-lb-avatar ${esc(row.rpg_frame || 'pk9-frame-bronze')}">${row.rpg_outfit ? esc(row.rpg_outfit) : esc((row.display_name || 'K').slice(0, 1).toUpperCase())}</div>`}
                <div style="font-weight:900;font-size:1.02rem;margin-top:0.35rem;">Hạng #${r} • ${esc(row.display_name)} ${row.rpg_pet ? esc(row.rpg_pet) : ''}</div>
                <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin:0.2rem 0 0.65rem;">🏫 ${esc(row.school || 'Học viên đã đăng ký')} • Khối ${esc(row.grade || '2K9')}</div>
                <div style="display:flex;justify-content:center;gap:0.4rem;flex-wrap:wrap;">
                  <span class="pk9-badge pk9-badge-subj">🔥 +${Number(row.weeklyXp || 0)} XP Tuần</span>
                  <span class="pk9-badge pk9-badge-code">⚡ ${Number(row.xp || 0)} XP (Lv.${Number(row.level || 1)})</span>
                  <span class="pk9-badge pk9-badge-verified">🎯 Đỉnh: ${Number(row.bestScore || 0).toFixed(2)}đ • ${Number(row.attempts || 0)} đề</span>
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
            Bảng xếp hạng chỉ hiển thị dữ liệu thật 100% từ các tài khoản học viên đã đăng ký và làm đề trên web. Hãy là người tiên phong bứt phá Top #1!
          </p>
          <button type="button" class="pk9-btn-exam-primary" data-nav-tab="exams">
            ⚡ Làm Đề Ghi Điểm Ngay
          </button>
        </div>
      `}

      <section class="pk9-card pk9-home-feedback-banner">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.9rem;">
          <div style="min-width:0;flex:1 1 min(100%, 340px);">
            <span class="pk9-badge pk9-badge-verified" style="margin-bottom:0.4rem;">💬 KÊNH GÓP Ý &amp; HỖ TRỢ TRỰC TIẾP ADMIN</span>
            <h3 style="margin:0.15rem 0 0.35rem;font-size:1.08rem;font-weight:900;">Phát hiện link lỗi, sai đáp án hay muốn góp ý tính năng mới?</h3>
            <p style="margin:0;font-size:0.83rem;color:var(--pk9-text-muted);line-height:1.5;">
              Nhắn thẳng cho Admin Phúc K9 qua form góp ý trên web, <b>Gmail: <a href="mailto:${ADMIN_CONTACT_EMAIL}" style="color:var(--pk9-primary);font-weight:800;">${ADMIN_CONTACT_EMAIL}</a></b> hoặc <b>SĐT / Zalo: <a href="tel:${ADMIN_CONTACT_PHONE}" style="color:var(--pk9-primary);font-weight:800;">${ADMIN_CONTACT_PHONE}</a></b>.
            </p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.48rem;">
            <button type="button" class="pk9-btn-exam-primary" data-open-feedback="bug" style="flex:0 1 auto;padding:0.55rem 1.05rem;font-size:0.83rem;">
              💬 Gửi Feedback / Báo Lỗi
            </button>
            <a href="https://zalo.me/${ADMIN_CONTACT_PHONE}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost" style="flex:0 1 auto;padding:0.55rem 0.95rem;font-size:0.82rem;text-decoration:none;">
              💬 Zalo ${ADMIN_CONTACT_PHONE}
            </a>
            <a href="mailto:${ADMIN_CONTACT_EMAIL}" class="pk9-btn-exam-ghost" style="flex:0 1 auto;padding:0.55rem 0.95rem;font-size:0.82rem;text-decoration:none;">
              📧 Gmail Admin
            </a>
          </div>
        </div>
      </section>
    `;
    typeset(root);
  }

  // ==========================================================================
  // ==========================================================================
  // TAB 2: MULTI-SUBJECT VIDEO LECTURE STUDIO (2-TIER: GRADE -> SUBJECT)
  // ==========================================================================
  function toDrivePreviewUrl(rawUrl) {
    const raw = String(rawUrl || '').trim();
    if (!raw) return '';
    const fileMatch = raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
    if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    const openMatch = raw.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([A-Za-z0-9_-]+)/);
    if (openMatch) return `https://drive.google.com/file/d/${openMatch[1]}/preview`;
    const folderMatch = raw.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/);
    if (folderMatch) return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
    const docMatch = raw.match(/docs\.google\.com\/(document|presentation)\/d\/([A-Za-z0-9_-]+)/);
    if (docMatch) return `https://docs.google.com/${docMatch[1]}/d/${docMatch[2]}/preview`;
    const sheetMatch = raw.match(/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
    if (sheetMatch) {
      const gidMatch = raw.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/htmlview?gid=${gid}&widget=true&headers=false`;
    }
    return raw;
  }

  function isDriveFolderUrl(rawUrl) {
    return /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//i.test(String(rawUrl || ''));
  }

  function toDirectDownloadUrl(rawUrl) {
    const raw = String(rawUrl || '').trim();
    if (!raw || isDriveFolderUrl(raw) || /youtube\.com|youtu\.be|docs\.google\.com\/spreadsheets/i.test(raw)) return '';
    const fileMatch = raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/)
      || raw.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([A-Za-z0-9_-]+)/);
    if (fileMatch) return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
    return raw;
  }

  function getTopicVideoEmbed(topic) {
    if (!topic) return { kind: 'none', embedUrl: '', externalUrl: '', codeLabel: '' };
    if (topic.videoId) {
      return {
        kind: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${topic.videoId}?rel=0&modestbranding=1&enablejsapi=1&playsinline=1`,
        externalUrl: `https://www.youtube.com/watch?v=${topic.videoId}`,
        codeLabel: topic.videoId
      };
    }
    const raw = String(topic.driveVideoUrl || topic.videoUrl || '').trim();
    const yt = raw.match(/(?:youtube\.com\/(?:watch\?v=|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) {
      return {
        kind: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&enablejsapi=1&playsinline=1`,
        externalUrl: `https://www.youtube.com/watch?v=${yt[1]}`,
        codeLabel: yt[1]
      };
    }
    const dm = raw.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/)
      || raw.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([A-Za-z0-9_-]+)/);
    if (dm) {
      return {
        kind: 'drive',
        embedUrl: `https://drive.google.com/file/d/${dm[1]}/preview`,
        externalUrl: raw,
        codeLabel: `Drive:${dm[1].slice(0, 8)}`
      };
    }
    const fm = raw.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/);
    if (fm) {
      return {
        kind: 'drive',
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${fm[1]}#list`,
        externalUrl: raw,
        codeLabel: `Folder:${fm[1].slice(0, 8)}`
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
            const dlUrl = toDirectDownloadUrl(it.url);
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
              ${dlUrl ? `
                <a href="${esc(dlUrl)}" download target="_blank" rel="noopener" class="pk9-pdf-action-btn" title="Tải trực tiếp file PDF về điện thoại hoặc máy tính">
                  ⬇️ Tải PDF
                </a>
              ` : ''}
              <a href="${esc(it.url)}" target="_blank" rel="noopener" class="pk9-pdf-action-btn">
                ↗️ Mở Drive
              </a>
            `;
          }).join('')}
        </div>
        ${activePreviewUrl ? `
          <div class="pk9-inline-pdf-wrap">
            <div class="pk9-pdf-brand-bar">
              <div class="pk9-brand-bar-left">
                <img src="/assets/phuc-k9-favicon.png" alt="Logo Phúc K9" class="pk9-brand-crest-img" />
                <div style="min-width:0;flex:1;">
                  <div class="pk9-brand-pill-tag">HỌC CÙNG PHÚC K9 • TÀI LIỆU PDF ĐỘC QUYỀN</div>
                  <div style="font-size:0.75rem;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(APP.inlinePdfTitle || 'Tài liệu PDF bài giảng')}</div>
                </div>
              </div>
              <div class="pk9-brand-bar-actions">
                <button type="button" class="pk9-brand-mini-btn" data-open-inapp-url="${esc(activePreviewUrl)}" data-open-inapp-title="${esc(APP.inlinePdfTitle || 'Tài liệu PDF bài giảng')}" data-open-inapp-sub="Tài liệu PDF chính thức • Học Cùng Phúc K9">🔍 Phóng to</button>
                <button type="button" class="pk9-brand-mini-btn" data-reload-inline-pdf="1">🔄 Tải lại</button>
                ${toDirectDownloadUrl(activePreviewUrl) ? `<a href="${esc(toDirectDownloadUrl(activePreviewUrl))}" download target="_blank" rel="noopener" class="pk9-brand-mini-btn">⬇️ Tải PDF</a>` : ''}
                <button type="button" class="pk9-brand-mini-btn" data-close-inline-pdf="1" style="border-color:rgba(248,113,113,0.45);color:#fca5a5;">✕ Thu gọn</button>
              </div>
            </div>
            <div class="pk9-inline-pdf-frame-inner">
              <iframe
                id="pk9-inline-pdf-iframe"
                src="${esc(toDrivePreviewUrl(activePreviewUrl))}"
                title="${esc(APP.inlinePdfTitle || 'Tài liệu PDF bài giảng')}"
                allow="autoplay"
              ></iframe>
              <div class="pk9-player-watermark is-pdf" aria-hidden="true">
                <img src="/assets/phuc-k9-favicon.png" alt="" />
                <span>HỌC CÙNG PHÚC K9 • PDF</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function getSubjectAccent(subjectName = '') {
    const s = String(subjectName || '').toLowerCase();
    if (s.includes('toán')) return { bg: 'linear-gradient(135deg,#2563eb,#0ea5e9)', chip: 'rgba(37,99,235,0.12)', hex: '#2563eb' };
    if (s.includes('lí') || s.includes('lý')) return { bg: 'linear-gradient(135deg,#d97706,#f59e0b)', chip: 'rgba(217,119,6,0.12)', hex: '#d97706' };
    if (s.includes('hóa')) return { bg: 'linear-gradient(135deg,#059669,#10b981)', chip: 'rgba(5,150,105,0.12)', hex: '#059669' };
    if (s.includes('sinh')) return { bg: 'linear-gradient(135deg,#0d9488,#14b8a6)', chip: 'rgba(13,148,136,0.12)', hex: '#0d9488' };
    if (s.includes('anh')) return { bg: 'linear-gradient(135deg,#4f46e5,#8b5cf6)', chip: 'rgba(79,70,229,0.12)', hex: '#4f46e5' };
    if (s.includes('văn')) return { bg: 'linear-gradient(135deg,#e11d48,#f43f5e)', chip: 'rgba(225,29,72,0.12)', hex: '#e11d48' };
    if (s.includes('sử')) return { bg: 'linear-gradient(135deg,#c2410c,#ea580c)', chip: 'rgba(194,65,12,0.12)', hex: '#c2410c' };
    if (s.includes('địa')) return { bg: 'linear-gradient(135deg,#0284c7,#06b6d4)', chip: 'rgba(2,132,199,0.12)', hex: '#0284c7' };
    return { bg: 'linear-gradient(135deg,#7c3aed,#ec4899)', chip: 'rgba(124,58,237,0.12)', hex: '#7c3aed' };
  }

  function getTeacherMonogram(name = '') {
    const clean = String(name || '')
      .replace(/^(thầy|cô|giáo viên|gv|ts\.?|ths\.?|gs\.?)\s+/i, '')
      .trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (!parts.length) return 'GV';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function buildTeacherRosterCardsHtml(teachers, activeCourseId, subjectName) {
    const q = String(APP.teacherPickerSearch || '').trim().toLowerCase();
    const list = q
      ? teachers.filter(tc => `${tc.teacher} ${tc.name} ${tc.courseTag || ''} ${tc.desc || ''}`.toLowerCase().includes(q))
      : teachers;
    if (!list.length) {
      return `
        <div style="padding:1rem;border-radius:0.9rem;background:var(--pk9-surface-2);border:1px dashed var(--pk9-border);font-size:0.84rem;color:var(--pk9-text-muted);text-align:center;">
          Không tìm thấy thầy/cô khớp từ khóa “<b>${esc(APP.teacherPickerSearch)}</b>”.
        </div>
      `;
    }
    const accent = getSubjectAccent(subjectName);
    return `
      <div class="pk9-teacher-tier-grid">
        ${list.map(tc => {
          const cp = countCourseProgress(tc);
          const isAct = tc.id === activeCourseId;
          const mono = getTeacherMonogram(tc.teacher);
          const subAccent = getSubjectAccent(tc.subject || subjectName || '');
          const barBg = (subAccent || accent).bg;
          return `
            <button type="button" class="pk9-teacher-tier-card ${isAct ? 'active' : ''}" data-select-course="${esc(tc.id)}">
              <div class="pk9-teacher-card-head">
                <span class="pk9-teacher-avatar" style="background:${barBg};">${esc(mono)}</span>
                <div style="min-width:0;flex:1;">
                  <div class="pk9-teacher-card-name">${esc(tc.teacher)}</div>
                  <div class="pk9-teacher-card-tag">${esc(tc.courseTag || tc.desc || 'Full chuyên đề 2K9 & PDF')}</div>
                </div>
                ${isAct ? '<span class="pk9-badge pk9-badge-verified" style="font-size:0.64rem;flex-shrink:0;">ĐANG HỌC</span>' : ''}
              </div>
              <div class="pk9-teacher-card-foot">
                <span class="pk9-tc-stat-pill">🎬 ${Number(tc.videoCount || 0)} video</span>
                <span class="pk9-tc-stat-pill">📄 ${Number(tc.pdfFileCount || 0)} PDF</span>
                ${cp.done > 0 ? `<span class="pk9-tc-stat-pill done">✓ ${cp.done}/${cp.total} (${cp.percent}%)</span>` : ''}
              </div>
              ${cp.done > 0 ? `<div class="pk9-tc-mini-bar"><span style="width:${Math.max(5, cp.percent)}%;"></span></div>` : ''}
            </button>
          `;
        }).join('')}
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

    const num2k9Subjects = new Set(catalog.filter(c => c.grade === '2K9').map(c => c.subject)).size || 8;
    const gradeMeta = [
      { code: '2K9', icon: '🎓', shortTitle: 'Khối 12 (2K9)', label: 'Khối 12 (2K9/2K8) — Full GV & PDF' },
      { code: '2K8', icon: '🔥', shortTitle: '2K8 Tuyển chọn', label: 'Khối 12 Tuyển Chọn 2K8 — Chuyên Đề' },
      { code: 'DGNL', icon: '🏛️', shortTitle: 'ĐGNL & ĐGTD', label: 'V-ACT (Empire) • HSA • TSA • SP/BCA' },
      { code: '2K11', icon: '📘', shortTitle: 'Khối 10 (2K11)', label: 'Khối 10 — Chương Trình Mới 2018' },
      { code: '2K12', icon: '🎯', shortTitle: 'Vào 10 (2K12)', label: 'Khối 9 — Ôn Thi Vào Lớp 10' }
    ];
    const coursesInActiveGrade = catalog.filter(c => c.grade === activeGrade);

    // Group 2K9 by subjects + list all teachers in the selected subject
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
    const allCoursePdfs = collectCourseAllPdfs(course, flatTopics);
    const curIdx = flatTopics.findIndex(t => t.id === activeTopic?.id);
    const prevTopic = curIdx > 0 ? flatTopics[curIdx - 1] : null;
    const nextTopic = curIdx >= 0 && curIdx < flatTopics.length - 1 ? flatTopics[curIdx + 1] : null;

    const isDone = Boolean(activeTopic && APP.doneMap[activeTopic.id]);
    const prog = countCourseProgress(course);
    const pdfQuery = APP.teacherPdfSearch.trim().toLowerCase();
    const filteredCoursePdfs = pdfQuery
      ? allCoursePdfs.filter(p => `${p.topicTitle} ${p.chapterTitle} ${p.label}`.toLowerCase().includes(pdfQuery))
      : allCoursePdfs;
    const ytSearchUrl = activeTopic?.youtubeSearchUrl
      || `https://www.youtube.com/results?search_query=${encodeURIComponent(`${course.shortName || course.name} ${activeTopic?.title || ''}`)}`;
    const courseAccent = getSubjectAccent(course.subject || course.name);

    root.innerHTML = `
      <div class="pk9-studio-context-bar" id="pk9-studio-context-bar">
        <div class="pk9-context-left">
          <span class="pk9-teacher-avatar" style="background:${courseAccent.bg};width:40px;height:40px;font-size:0.86rem;">${esc(getTeacherMonogram(course.teacher || course.shortName))}</span>
          <div style="min-width:0;flex:1;">
            <div style="display:flex;align-items:center;gap:0.38rem;flex-wrap:wrap;">
              <span class="pk9-context-badge">Khối ${esc(activeGrade)}</span>
              <span class="pk9-context-badge soft">${course.icon || '📘'} ${esc(course.subject || course.shortName || '')}</span>
              <span class="pk9-context-prog-pill" id="pk9-context-prog-pill">✓ ${prog.done}/${prog.total} bài (${prog.percent}%)</span>
            </div>
            <div class="pk9-context-teacher">
              ${esc(course.teacher || course.name)}
            </div>
          </div>
        </div>
        <div class="pk9-context-actions">
          <button type="button" class="pk9-admin-btn-xs primary" data-toggle-mob-selectors="1" style="min-height:36px;">
            ${APP.mobileSelectorsCollapsed ? '✨ Mở bộ chọn GV / Môn' : '🔼 Thu gọn bộ chọn'}
          </button>
          ${allCoursePdfs.length ? `
            <button type="button" class="pk9-admin-btn-xs ${APP.showTeacherPdfDrawer ? 'active' : ''}" data-toggle-teacher-pdfs="1" style="min-height:36px;">
              📄 Kho PDF (${allCoursePdfs.length})
            </button>
          ` : ''}
          <button type="button" class="pk9-admin-btn-xs" data-toggle-theater="1" style="min-height:36px;">
            🖥️ ${APP.theaterMode ? 'Thu nhỏ' : 'Rạp chiếu'}
          </button>
          <button type="button" class="pk9-admin-btn-xs" data-mob-jump-sidebar="1" style="min-height:36px;">
            📑 Mục lục
          </button>
        </div>
      </div>

      <section class="pk9-lecture-hierarchy ${APP.mobileSelectorsCollapsed ? 'is-collapsed mob-collapsed' : ''}" id="pk9-lecture-hierarchy" aria-label="Chọn Khối lớp, Môn học và Giáo viên">
        <div class="pk9-tier-label">
          <span>📚 BƯỚC 1: CHỌN KHỐI LỚP HỌC TẬP</span>
          <span style="font-size:0.74rem;color:var(--pk9-text-muted);text-transform:none;font-weight:700;">
            ${totalAllTopics}+ bài giảng Video HD & PDF chuẩn
          </span>
        </div>

        <div class="pk9-grade-tier-grid">
          ${gradeMeta.map(gm => {
            const gCourses = catalog.filter(c => c.grade === gm.code);
            const gTopicsCount = gCourses.reduce((s, c) => s + getCourseTopicCount(c), 0);
            const isAct = gm.code === activeGrade;
            return `
              <button type="button" class="pk9-grade-tier-card ${isAct ? 'active' : ''}" data-select-lecture-grade="${gm.code}" title="${esc(gm.label)}">
                <div class="pk9-grade-tier-icon">${gm.icon}</div>
                <div style="min-width:0;flex:1;">
                  <div class="pk9-grade-card-title">${esc(gm.shortTitle)}</div>
                  <div class="pk9-grade-card-sub">
                    ${gm.code === '2K9' ? `${gCourses.length} GV • ${num2k9Subjects} môn` : `${gCourses.length} môn`} • <b>${gTopicsCount}</b> mục
                  </div>
                </div>
              </button>
            `;
          }).join('')}
        </div>

        ${activeGrade === '2K9' && subjects2k9.length ? `
          <div class="pk9-tier-label" style="margin-bottom:0.5rem;">
            <span>🎯 BƯỚC 2: CHỌN MÔN HỌC KHỐI 2K9 (${subjects2k9.length} MÔN)</span>
            <span style="font-size:0.73rem;color:var(--pk9-text-muted);text-transform:none;font-weight:700;">
              Đang chọn: <b>${esc(current2k9Subj?.subject || '')}</b> (${teachersIn2k9Subj.length} Thầy/Cô)
            </span>
          </div>

          <div class="pk9-subject-tier-grid" style="margin-bottom:1rem;">
            ${subjects2k9.map(sub => {
              const isAct = sub.subject === current2k9Subj?.subject;
              const acc = getSubjectAccent(sub.subject);
              return `
                <button type="button" class="pk9-subject-tier-card ${isAct ? 'active' : ''}" data-select-2k9-subject="${esc(sub.subject)}" style="--pk9-subj-hex:${acc.hex};--pk9-subj-bg:${acc.bg};">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4rem;width:100%;">
                    <span class="pk9-subj-icon-badge" style="${isAct ? '' : `background:${acc.chip};color:${acc.hex};`}">${sub.icon || '📘'}</span>
                    <span class="pk9-subj-meta">${sub.teachers.length} GV • ${sub.topics} bài</span>
                  </div>
                  <div>
                    <div style="font-weight:900;font-size:0.9rem;line-height:1.25;">Môn ${esc(sub.subject)}</div>
                    <div class="pk9-subj-meta" style="margin-top:0.12rem;">
                      📄 ${sub.pdfs} file PDF & Đề
                    </div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <div class="pk9-tier-label pk9-teacher-tier-head" style="margin-bottom:0.55rem;">
            <span>👨‍🏫 BƯỚC 3: CHỌN THẦY / CÔ MÔN ${esc((current2k9Subj?.subject || '').toUpperCase())} (${teachersIn2k9Subj.length} GIÁO VIÊN)</span>
            ${teachersIn2k9Subj.length >= 4 ? `
              <input type="search" id="pk9-teacher-quick-search" class="pk9-input pk9-teacher-filter-input" placeholder="🔍 Tìm nhanh tên Thầy / Cô..." value="${esc(APP.teacherPickerSearch || '')}" />
            ` : `
              <span style="font-size:0.73rem;color:var(--pk9-text-muted);text-transform:none;font-weight:700;">
                Đang học: <b>${esc(course.teacher)}</b>
              </span>
            `}
          </div>

          <div id="pk9-teacher-grid-wrap">
            ${buildTeacherRosterCardsHtml(teachersIn2k9Subj, course.id, current2k9Subj?.subject || '')}
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
              const acc = getSubjectAccent(c.subject || c.name);
              return `
                <button type="button" class="pk9-subject-tier-card ${isAct ? 'active' : ''}" data-select-course="${esc(c.id)}" style="--pk9-subj-hex:${acc.hex};--pk9-subj-bg:${acc.bg};">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.4rem;width:100%;">
                    <span class="pk9-subj-icon-badge" style="${isAct ? '' : `background:${acc.chip};color:${acc.hex};`}">${c.icon || '📘'}</span>
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
          <button type="button" class="pk9-btn-exam-primary" id="pk9-teacher-pdf-toggle-btn" data-toggle-teacher-pdfs="1" data-pdf-total="${allCoursePdfs.length}" style="padding:0.45rem 0.9rem;font-size:0.8rem;">
            ${APP.showTeacherPdfDrawer ? '🔽 Thu gọn Kho PDF' : `📄 Mở Kho Tất Cả PDF (${allCoursePdfs.length} file)`}
          </button>
        </div>
        <section class="pk9-teacher-pdf-drawer" id="pk9-teacher-pdf-drawer-sec" style="display:${APP.showTeacherPdfDrawer ? 'block' : 'none'};" aria-label="Kho tất cả file PDF của giáo viên">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.65rem;">
            <strong style="font-size:0.95rem;" id="pk9-teacher-pdf-count-label">📂 Tất cả File PDF của ${esc(course.teacher)} (${filteredCoursePdfs.length}/${allCoursePdfs.length})</strong>
            <input type="search" id="pk9-teacher-pdf-search" class="pk9-input" placeholder="🔍 Lọc tên đề / chuyên đề PDF..." value="${esc(APP.teacherPdfSearch)}" style="max-width:320px;margin:0;" />
          </div>
          <div id="pk9-teacher-pdf-list-wrap">
            ${buildTeacherPdfRowsHtml(course, allCoursePdfs)}
          </div>
        </section>
      ` : ''}

      <div class="pk9-lecture-studio ${APP.theaterMode ? 'theater' : ''}" id="pk9-lecture-studio">
        <aside class="pk9-course-sidebar" id="pk9-course-sidebar">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.5rem;">
            <strong style="font-size:0.95rem;">📑 Mục lục: ${course.icon} ${esc(course.shortName || course.name)}</strong>
            <span class="pk9-badge pk9-badge-verified" id="pk9-course-prog-badge">${prog.done}/${prog.total} bài (${prog.percent}%)</span>
          </div>
          <div class="pk9-topic-track" style="margin-bottom:0.75rem;">
            <div class="pk9-topic-fill" id="pk9-course-prog-fill" style="width:${Math.max(4, prog.percent)}%;"></div>
          </div>
          <input type="search" id="pk9-lecture-search-input" class="pk9-input" placeholder="🔍 Tìm bài giảng / chuyên đề..." value="${esc(APP.lectureSearch)}" style="margin-top:0;margin-bottom:0.5rem;" />

          <div id="pk9-lecture-chapters-list">
            ${buildCourseChaptersListHtml(course, activeChapter, activeTopic)}
          </div>
        </aside>

        ${activeTopic ? (() => {
          const vid = getTopicVideoEmbed(activeTopic);
          const frameSrc = vid.kind !== 'none'
            ? vid.embedUrl
            : (activeTopic.pdfUrl ? toDrivePreviewUrl(activeTopic.pdfUrl) : '');
          const tsList = parseVideoTimestampNotes(APP.notesMap[activeTopic.id] || '');
          return `
          <div class="pk9-video-stage" id="pk9-video-stage">
            <div class="pk9-studio-brand-bar">
              <div class="pk9-brand-bar-left">
                <img src="/assets/phuc-k9-favicon.png" alt="Học Cùng Phúc K9" class="pk9-brand-crest-img" />
                <div style="min-width:0;flex:1;">
                  <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
                    <span class="pk9-brand-pill-tag">HỌC CÙNG PHÚC K9 • STUDIO ĐỘC QUYỀN</span>
                    <span class="pk9-brand-sub-pill">${vid.kind === 'youtube' ? '🎬 VIDEO HD' : vid.kind === 'drive' ? '🎬 DRIVE PLAYER' : '📄 TÀI LIỆU PDF'}</span>
                    ${vid.kind === 'youtube' ? `<span class="pk9-brand-time-pill" id="pk9-yt-time-readout" title="Thời lượng đang phát">⏱ 00:00</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="pk9-brand-bar-actions">
                <button type="button" class="pk9-brand-mini-btn ${APP.theaterMode ? 'active' : ''}" data-toggle-theater="1">
                  🖥️ ${APP.theaterMode ? 'Thu nhỏ' : 'Rạp chiếu'}
                </button>
                ${(vid.externalUrl || frameSrc) ? `
                  <button type="button" class="pk9-brand-mini-btn" data-open-inapp-url="${esc(vid.externalUrl || frameSrc)}" data-open-inapp-title="${esc(activeTopic.title)}" data-open-inapp-sub="${esc(course.teacher || '')} • Học Cùng Phúc K9">
                    🔍 Toàn màn hình
                  </button>
                ` : ''}
                <button type="button" class="pk9-brand-mini-btn" data-open-feedback="bug" data-feedback-ctx="${esc(`${course.shortName || course.name} • ${activeTopic.title}`)}" title="Báo lỗi video hoặc PDF bài học này về Admin">
                  🐛 Báo lỗi
                </button>
              </div>
            </div>

            ${frameSrc ? (() => {
              const isVideoItem = vid.kind === 'youtube' || vid.kind === 'drive';
              const topicKey = `${course.id}::${activeTopic.id}`;
              const usePoster = isVideoItem && APP._lectureStartedKey !== topicKey;
              const ytThumbId = extractYtId(frameSrc);
              const thumbUrl = ytThumbId ? `https://i.ytimg.com/vi/${ytThumbId}/hqdefault.jpg` : '';
              const sep = frameSrc.includes('?') ? '&' : '?';
              const autoSrc = vid.kind === 'youtube' ? `${frameSrc}${sep}autoplay=1` : frameSrc;
              return `
              <div class="pk9-video-frame-wrap ${usePoster ? 'is-poster-idle' : ''}" id="pk9-video-frame-wrap">
                <iframe
                  id="pk9-lecture-iframe"
                  data-vid-kind="${esc(vid.kind)}"
                  data-yt-slot="lecture"
                  data-yt-base="${esc(frameSrc)}"
                  data-autoplay-src="${esc(autoSrc)}"
                  data-topic-key="${esc(topicKey)}"
                  data-external-url="${esc(vid.externalUrl || '')}"
                  src="${usePoster ? 'about:blank' : esc(frameSrc)}"
                  title="${esc(activeTopic.title)}"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                ></iframe>
                ${usePoster ? `
                  <div class="pk9-brand-player-poster" id="pk9-brand-player-poster" data-start-branded-video="1" role="button" tabindex="0" aria-label="Bấm để phát video Học Cùng Phúc K9">
                    ${thumbUrl ? `<img src="${esc(thumbUrl)}" alt="" class="pk9-brand-poster-thumb" loading="lazy" onerror="this.style.display='none'" />` : ''}
                    <div class="pk9-brand-poster-scrim"></div>
                    <div class="pk9-brand-poster-top">
                      <span class="pk9-brand-poster-chip">🏫 ${esc(course.teacher || 'HỌC CÙNG PHÚC K9')}</span>
                      <span class="pk9-brand-poster-chip gold">HD • ${esc(activeTopic.duration || 'Bài giảng')}</span>
                    </div>
                    <button type="button" class="pk9-brand-play-trigger" data-start-branded-video="1">
                      <span class="pk9-brand-play-orbit"></span>
                      <span class="pk9-brand-play-circle">
                        <img src="/assets/phuc-k9-favicon.png" alt="" class="pk9-brand-play-crest" />
                        <span class="pk9-brand-play-tri">▶</span>
                      </span>
                      <span class="pk9-brand-play-caption">
                        <strong>PHÁT BÀI GIẢNG • HỌC CÙNG PHÚC K9</strong>
                        <small>${esc(activeTopic.title)}</small>
                      </span>
                    </button>
                  </div>
                ` : ''}
                <div class="pk9-video-suspended-overlay" id="pk9-video-suspended-overlay">
                  <div class="pk9-suspended-badge">📺 Đang phát ở chế độ Toàn màn hình</div>
                  <p style="margin:0.35rem 0 0.85rem;font-size:0.82rem;color:#cbd5e1;">Trình phát chính tạm dừng để tránh phát 2 video cùng lúc.</p>
                  <button type="button" class="pk9-btn-hero-main" data-restore-inline-video="1" style="padding:0.5rem 1.05rem;font-size:0.8rem;">
                    ▶ Tiếp tục xem tại khung này
                  </button>
                </div>
                <div class="pk9-player-watermark ${vid.kind === 'none' ? 'is-pdf' : ''}" aria-hidden="true">
                  <img src="/assets/phuc-k9-favicon.png" alt="" />
                  <span>HỌC CÙNG PHÚC K9</span>
                </div>
              </div>

              <div class="pk9-player-control-dock" id="pk9-player-control-dock">
                ${vid.kind === 'youtube' ? `
                  <div class="pk9-ctrl-group">
                    <button type="button" class="pk9-ctrl-btn" data-yt-slot="lecture" data-yt-seek="-30" title="Tua lùi 30 giây">⏮ -30s</button>
                    <button type="button" class="pk9-ctrl-btn" data-yt-slot="lecture" data-yt-seek="-10" title="Tua lùi 10 giây">⏪ -10s</button>
                    <button type="button" class="pk9-ctrl-btn pk9-ctrl-brand-play" data-yt-slot="lecture" data-yt-toggle="1" title="Phát hoặc Tạm dừng (Phúc K9 Studio)">
                      <img src="/assets/phuc-k9-favicon.png" alt="" class="pk9-dock-brand-dot" />
                      <span>▶ Phát / Dừng • K9</span>
                    </button>
                    <button type="button" class="pk9-ctrl-btn" data-yt-slot="lecture" data-yt-seek="10" title="Tua tới 10 giây">⏩ +10s</button>
                    <button type="button" class="pk9-ctrl-btn" data-yt-slot="lecture" data-yt-seek="30" title="Tua tới 30 giây">⏭ +30s</button>
                  </div>
                  <div class="pk9-ctrl-group">
                    <span class="pk9-hide-mob-430" style="font-size:0.7rem;font-weight:800;color:#94a3b8;margin-right:0.15rem;">⚡ Tốc độ:</span>
                    ${[0.75, 1, 1.25, 1.5, 2].map(spd => `
                      <button type="button" class="pk9-ctrl-speed-pill ${spd === 1 ? 'active' : ''}" data-yt-slot="lecture" data-yt-rate="${spd}">${spd}x</button>
                    `).join('')}
                    <button type="button" class="pk9-ctrl-btn" data-yt-mark-note="${esc(activeTopic.id)}" title="Lấy mốc giây hiện tại chèn vào Ghi chú">📌 +Mốc</button>
                  </div>
                ` : vid.kind === 'drive' ? `
                  <div class="pk9-ctrl-group">
                    <button type="button" class="pk9-ctrl-btn primary" data-reload-lecture-iframe="1">🔄 Tải lại phát</button>
                    <button type="button" class="pk9-ctrl-btn" data-toggle-theater="1">🖥️ Chế độ rạp</button>
                    <span class="pk9-brand-sub-pill">⌨️ Phím J / L trong video để tua ±10s</span>
                  </div>
                  <div class="pk9-ctrl-group">
                    ${vid.externalUrl ? `<a href="${esc(vid.externalUrl)}" target="_blank" rel="noopener" class="pk9-brand-mini-btn">🎬 Mở gốc Drive ↗</a>` : ''}
                  </div>
                ` : `
                  <div class="pk9-ctrl-group">
                    <button type="button" class="pk9-ctrl-btn primary" data-open-inapp-url="${esc(activeTopic.pdfUrl || '')}" data-open-inapp-title="${esc(activeTopic.title)}" data-open-inapp-sub="Tài liệu PDF • Học Cùng Phúc K9">🔍 Đọc toàn màn hình</button>
                    <button type="button" class="pk9-ctrl-btn" data-reload-lecture-iframe="1">🔄 Tải lại PDF</button>
                  </div>
                  <div class="pk9-ctrl-group">
                    ${activeTopic.pdfUrl && toDirectDownloadUrl(activeTopic.pdfUrl) ? `<a href="${esc(toDirectDownloadUrl(activeTopic.pdfUrl))}" download target="_blank" rel="noopener" class="pk9-brand-mini-btn">⬇️ Tải PDF</a>` : ''}
                  </div>
                `}
              </div>
            `; })() : ''}

            ${tsList.length ? `
              <div class="pk9-ts-bar" id="pk9-video-ts-bar">
                <span style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);">⏱ Mốc ghi chú video:</span>
                ${tsList.map(ts => `
                  <button type="button" class="pk9-ts-chip" data-seek-video="${ts.sec}" data-seek-label="${esc(ts.label)}" title="Nhảy tới mốc ${esc(ts.label)}">
                    ▶ ${esc(ts.label)}${ts.note ? ` · ${esc(ts.note)}` : ''}
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <div id="pk9-topic-pdf-attachments-wrap">
              ${renderTopicPdfAttachments(activeTopic)}
            </div>

            <div class="pk9-video-info-bar">
              <div style="flex:1 1 min(100%, 200px);min-width:0;">
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

              <div class="pk9-video-action-grid">
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
                <button type="button" class="pk9-btn-exam-ghost" data-mob-jump-sidebar="1" title="Cuộn lên mục lục bài học">
                  📑 Mục lục bài học
                </button>
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
    bindYtBridgeForSlot('lecture');
  }

  const YT_BRIDGE_STATE = {
    lecture: { time: 0, rate: 1, playing: false, ready: false, lastShownSec: -1 },
    modal: { time: 0, rate: 1, playing: false, ready: false, lastShownSec: -1 }
  };
  let _ytMsgListenerBound = false;

  function formatMmSs(secVal) {
    const s = Math.max(0, Math.floor(Number(secVal || 0)));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(rem)}` : `${pad(m)}:${pad(rem)}`;
  }

  function sendYtCommand(slotKey, func, args = []) {
    const ifrId = slotKey === 'modal' ? 'pk9-inapp-viewer-iframe' : 'pk9-lecture-iframe';
    const ifr = document.getElementById(ifrId);
    if (!ifr || !ifr.contentWindow) return false;
    try {
      ifr.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
      return true;
    } catch {
      return false;
    }
  }

  function updateYtReadout(slotKey, sec) {
    const st = YT_BRIDGE_STATE[slotKey];
    if (!st) return;
    st.time = Math.max(0, Number(sec || 0));
    const whole = Math.floor(st.time);
    if (whole === st.lastShownSec) return;
    st.lastShownSec = whole;
    const elId = slotKey === 'modal' ? 'pk9-yt-modal-time-readout' : 'pk9-yt-time-readout';
    const el = document.getElementById(elId);
    if (el) el.textContent = `⏱ ${formatMmSs(whole)}`;
  }

  function bindYtBridgeForSlot(slotKey) {
    if (!_ytMsgListenerBound) {
      _ytMsgListenerBound = true;
      window.addEventListener('message', ev => {
        if (!ev.origin || !/youtube(-nocookie)?\.com$/i.test(new URL(ev.origin).hostname)) return;
        let msg = ev.data;
        if (typeof msg === 'string') {
          if (!msg.includes('infoDelivery') && !msg.includes('initialDelivery')) return;
          try { msg = JSON.parse(msg); } catch { return; }
        }
        if (!msg || typeof msg !== 'object') return;
        const info = msg.info;
        if (!info || typeof info !== 'object') return;
        const slot = YT_BRIDGE_STATE[msg.id] ? msg.id : 'lecture';
        const st = YT_BRIDGE_STATE[slot];
        st.ready = true;
        if (typeof info.currentTime === 'number') updateYtReadout(slot, info.currentTime);
        if (typeof info.playerState === 'number') st.playing = info.playerState === 1;
        if (typeof info.playbackRate === 'number') st.rate = info.playbackRate;
      });
    }
    const st = YT_BRIDGE_STATE[slotKey];
    if (st) {
      st.time = 0;
      st.lastShownSec = -1;
      st.playing = false;
      st.ready = false;
    }
    const ifrId = slotKey === 'modal' ? 'pk9-inapp-viewer-iframe' : 'pk9-lecture-iframe';
    const ifr = document.getElementById(ifrId);
    if (!ifr) return;
    const pingListening = () => {
      if (!ifr.contentWindow) return;
      try {
        ifr.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: slotKey }), '*');
      } catch {}
    };
    ifr.addEventListener('load', pingListening, { once: true });
    pingListening();
  }

  function collectCourseAllPdfs(course, flatTopicsOut = []) {
    const allCoursePdfs = [];
    const seenCoursePdfUrls = new Set();
    if (!course) return allCoursePdfs;
    for (const ch of course.chapters || []) {
      for (const t of ch.topics || []) {
        flatTopicsOut.push(t);
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
    return allCoursePdfs;
  }

  function buildTeacherPdfRowsHtml(course, allCoursePdfsInput) {
    const allCoursePdfs = allCoursePdfsInput || collectCourseAllPdfs(course);
    const pdfQuery = APP.teacherPdfSearch.trim().toLowerCase();
    const filteredCoursePdfs = pdfQuery
      ? allCoursePdfs.filter(p => `${p.topicTitle} ${p.chapterTitle} ${p.label}`.toLowerCase().includes(pdfQuery))
      : allCoursePdfs;
    const countLabel = document.getElementById('pk9-teacher-pdf-count-label');
    if (countLabel && course) {
      countLabel.textContent = `📂 Tất cả File PDF của ${course.teacher} (${filteredCoursePdfs.length}/${allCoursePdfs.length})`;
    }
    return `
      <div class="pk9-teacher-pdf-list">
        ${filteredCoursePdfs.slice(0, 120).map(p => {
          const dlUrl = toDirectDownloadUrl(p.url);
          return `
          <div class="pk9-teacher-pdf-row">
            <div>
              <div style="font-size:0.82rem;font-weight:700;line-height:1.4;">${esc(p.topicTitle)}</div>
              <div style="font-size:0.74rem;color:var(--pk9-text-muted);margin-top:0.12rem;">${esc(p.chapterTitle)} • <b>${esc(p.label)}</b></div>
            </div>
            <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
              <button type="button" class="pk9-pdf-action-btn primary" data-open-inapp-url="${esc(p.url)}" data-open-inapp-title="${esc(`${p.topicTitle} — ${p.label}`)}" data-open-inapp-sub="${esc(course?.teacher || '')} • Kho PDF 2K9">
                📖 Đọc ngay
              </button>
              <button type="button" class="pk9-pdf-action-btn" data-select-topic="${esc(p.topicId)}">
                🎯 Tới bài
              </button>
              ${dlUrl ? `
                <a href="${esc(dlUrl)}" download target="_blank" rel="noopener" class="pk9-pdf-action-btn">
                  ⬇️ Tải PDF
                </a>
              ` : ''}
              <a href="${esc(p.url)}" target="_blank" rel="noopener" class="pk9-pdf-action-btn">
                ↗️ Drive
              </a>
            </div>
          </div>
          `;
        }).join('')}
      </div>
      ${filteredCoursePdfs.length > 120 ? `<div style="font-size:0.74rem;color:var(--pk9-text-muted);margin-top:0.45rem;">Đang hiển thị 120/${filteredCoursePdfs.length} file đầu tiên — nhập từ khóa ở ô lọc bên trên để tìm nhanh file cụ thể.</div>` : ''}
    `;
  }

  function buildCourseChaptersListHtml(course, activeChapter, activeTopic) {
    if (!course) return '';
    const qFilter = APP.lectureSearch.trim().toLowerCase();
    return (course.chapters || []).map((ch, chIdx) => {
      const topics = (ch.topics || []).filter(t => {
        if (!qFilter) return true;
        return `${t.title} ${t.code || ''} ${t.desc || ''}`.toLowerCase().includes(qFilter);
      });
      if (!topics.length) return '';
      const chKey = `${course.id}::${ch.id}`;
      const doneInCh = topics.filter(t => APP.doneMap[t.id]).length;
      const isOpen = qFilter
        ? true
        : (APP.openChaptersMap[chKey] !== undefined
            ? Boolean(APP.openChaptersMap[chKey])
            : (ch.id === activeChapter?.id || (course.chapters || []).length <= 2));
      return `
        <div class="pk9-chapter-block ${isOpen ? 'open' : ''}">
          <button type="button" class="pk9-chapter-head" data-toggle-chapter="${esc(chKey)}">
            <span class="pk9-chapter-title-wrap">
              <span class="pk9-chapter-chevron">${isOpen ? '▾' : '▸'}</span>
              <span>${esc(ch.title)}</span>
            </span>
            <span class="pk9-chapter-count-pill ${doneInCh === topics.length && topics.length > 0 ? 'all-done' : ''}">
              ${doneInCh > 0 ? `${doneInCh}/` : ''}${topics.length} bài
            </span>
          </button>
          ${isOpen ? `
          <div class="pk9-topic-list">
            ${topics.map((t, tIdx) => {
              const done = Boolean(APP.doneMap[t.id]);
              const act = t.id === activeTopic?.id;
              const hasPdf = Boolean(t.pdfUrl || t.solutionPdfUrl || (Array.isArray(t.pdfs) && t.pdfs.length));
              const isPdfOnly = t.kind === 'pdf' || (!t.videoId && !t.driveVideoUrl && Boolean(t.pdfUrl));
              const numLabel = String(tIdx + 1).padStart(2, '0');
              return `
                <button type="button" class="pk9-topic-btn ${act ? 'active' : ''} ${done ? 'done' : ''}" data-select-topic="${esc(t.id)}">
                  <span class="pk9-topic-index">${act ? '▶' : (done ? '✓' : numLabel)}</span>
                  <span style="flex:1;min-width:0;line-height:1.38;">${isPdfOnly ? '📄 ' : '🎬 '}${esc(t.title)}${hasPdf ? '<span class="pk9-topic-pdf-tag">PDF</span>' : ''}</span>
                  <span class="pk9-topic-dur" style="color:${done ? '#10b981' : 'var(--pk9-text-soft)'};">
                    ${done ? 'Xong' : esc(t.duration || '45p')}
                  </span>
                </button>
              `;
            }).join('')}
          </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function parseVideoTimestampNotes(text) {
    const out = [];
    const lines = String(text || '').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/\[?(\d{1,3}):([0-5]\d)\]?\s*(.*)/);
      if (!m) continue;
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const total = min * 60 + sec;
      const label = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      const note = String(m[3] || '').trim().slice(0, 42);
      out.push({ sec: total, label, note });
      if (out.length >= 16) break;
    }
    return out;
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
      const tsList = parseVideoTimestampNotes(savedNote);
      return `
        <div>
          <label style="font-weight:800;font-size:0.9rem;display:block;margin-bottom:0.5rem;">
            📝 Ghi chú cá nhân & Mốc thời gian cho bài "${esc(topic.title)}" (Đồng bộ đám mây khi đăng nhập)
          </label>
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;align-items:center;margin-bottom:0.55rem;padding:0.55rem 0.7rem;border-radius:0.8rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
            <input type="text" id="pk9-ts-time-input" class="pk9-input" placeholder="mm:ss (VD: 12:30)" style="width:140px;margin:0;" maxlength="7" />
            <input type="text" id="pk9-ts-label-input" class="pk9-input" placeholder="Nội dung tại mốc này (VD: Công thức bấm máy...)" style="flex:1 1 200px;margin:0;" maxlength="80" />
            <button type="button" class="pk9-btn-exam-ghost" data-insert-ts-note="${esc(topic.id)}" style="flex-shrink:0;">
              ⏱ + Chèn mốc video
            </button>
          </div>
          ${tsList.length ? `
            <div class="pk9-ts-bar" style="margin-bottom:0.55rem;margin-top:0;">
              <span style="font-size:0.74rem;font-weight:800;color:var(--pk9-text-muted);">▶ Bấm để tua video:</span>
              ${tsList.map(ts => `
                <button type="button" class="pk9-ts-chip" data-seek-video="${ts.sec}" data-seek-label="${esc(ts.label)}">
                  ${esc(ts.label)}${ts.note ? ` · ${esc(ts.note)}` : ''}
                </button>
              `).join('')}
            </div>
          ` : ''}
          <textarea id="pk9-topic-note-area" class="pk9-input" rows="7" placeholder="Ghi lại công thức quan trọng hoặc thêm dòng dạng [12:30] Công thức nhanh để bấm tua thẳng tới đoạn video...">${esc(savedNote)}</textarea>
          <div style="margin-top:0.75rem;display:flex;justify-content:flex-end;">
            <button type="button" class="pk9-btn-exam-primary" data-save-note="${esc(topic.id)}">
              💾 Lưu ghi chú & Mốc thời gian
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

    if (!APP.user) {
      root.innerHTML = `
        <div class="pk9-exam-hub">
          <div class="pk9-exam-hero">
            <div class="pk9-exam-hero-grid">
              <div>
                <div style="display:inline-flex;align-items:center;gap:0.45rem;padding:0.32rem 0.85rem;border-radius:999px;background:rgba(245,158,11,0.22);border:1px solid rgba(245,158,11,0.45);font-size:0.75rem;font-weight:800;margin-bottom:0.8rem;">
                  <span>🔒 ĐẤU TRƯỜNG BẢNG VÀNG PHÚC K9 • ĐANG KHÓA VỚI TÀI KHOẢN KHÁCH</span>
                </div>
                <h2 style="font-size:1.65rem;font-weight:900;margin:0 0 0.55rem;">
                  Đăng Nhập hoặc Đăng Ký Để Mở Khóa Bảng Xếp Hạng!
                </h2>
                <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.92rem;line-height:1.6;">
                  Tài khoản Khách chưa được tham gia đua Top để đảm bảo Bảng Xếp Hạng 100% công bằng, chống điểm ảo và lưu giữ đúng thành tích của từng học viên.
                </p>
                <div style="display:flex;gap:0.65rem;flex-wrap:wrap;margin-top:1.1rem;">
                  <button type="button" class="pk9-btn-hero-main" data-open-auth="register">
                    ✨ Đăng Ký Mở Khóa BXH (+100 XP)
                  </button>
                  <button type="button" class="pk9-btn-hero-sec" data-open-auth="login">
                    🔑 Đăng Nhập Tài Khoản
                  </button>
                </div>
              </div>
              <div>
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.2rem;">
                  <div style="font-size:0.76rem;font-weight:800;color:#fde047;text-transform:uppercase;margin-bottom:0.45rem;">🎁 QUYỀN LỢI KHI MỞ KHÓA THÀNH VIÊN</div>
                  <ul style="margin:0;padding-left:1.1rem;font-size:0.84rem;color:rgba(255,255,255,0.92);line-height:1.65;">
                    <li>Tặng ngay <b>+100 XP</b>, <b>180 🪙 Vàng</b> & <b>5 💎 Kim cương</b>.</li>
                    <li>Mở khóa đủ 3 bảng: <b>BXH Hàng Tuần</b>, <b>BXH Top Học Viên</b> & <b>BXH Cao Thủ Luyện Đề</b>.</li>
                    <li>Tích XP thật từ <b>Video (+25 XP)</b>, <b>Flashcard (+20 XP)</b>, <b>Nộp Đề (+60→140 XP)</b> & <b>Vượt Đảo Cờ Vùng</b>.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="pk9-card" style="text-align:center;padding:2rem 1.25rem;">
            <div style="font-size:2.2rem;margin-bottom:0.4rem;">🛡️</div>
            <div style="font-weight:900;font-size:1.05rem;margin-bottom:0.35rem;">Chế Độ Khách Chỉ Hỗ Trợ Xem Thử & Ôn Luyện Cá Nhân</div>
            <p style="margin:0 auto 1rem;max-width:520px;font-size:0.86rem;color:var(--pk9-text-muted);line-height:1.55;">
              Bạn có thể tạo tài khoản trong 10 giây (chỉ cần tên đăng nhập & mật khẩu) để chính thức bước vào Đấu Trường Đua Top cùng các học viên khác!
            </p>
            <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="home">
              ← Quay về Trang Chủ
            </button>
          </div>
        </div>
      `;
      return;
    }

    const onlyStudents = rows => (rows || []).filter(r => !r.is_admin && r.role !== 'admin');
    const weeklyRows = onlyStudents(APP.lbData.weekly_leaderboard);
    const topRows = onlyStudents(APP.lbData.leaderboard);
    const examRows = onlyStudents(APP.lbData.exam_leaderboard);

    const list = APP.lbMode === 'weekly'
      ? weeklyRows
      : APP.lbMode === 'exam'
      ? examRows
      : topRows;

    const q = APP.lbSearch.trim().toLowerCase();
    const filtered = list.filter(r => {
      if (!q) return true;
      return `${r.display_name} ${r.username} ${r.school || ''} ${r.grade || ''}`.toLowerCase().includes(q);
    });

    const top3 = list.slice(0, 3);
    const myRank = APP.lbData.my_rank;
    const isExcludedAdmin = APP.isAdmin || Boolean(myRank?.excluded_from_leaderboard);
    const maxMetric = APP.lbMode === 'exam'
      ? Math.max(10, ...list.map(x => Number(x.bestScore) || 0))
      : Math.max(100, ...list.map(x => Number(APP.lbMode === 'weekly' ? x.weeklyXp : x.xp) || 0));
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
                  <span>100% Học viên thật • Quản trị viên không tính đua Top</span>
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
              ${APP.user && isExcludedAdmin ? `
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.2rem;">
                  <div style="font-size:0.76rem;font-weight:800;color:#fda4af;text-transform:uppercase;">🛡️ CHẾ ĐỘ QUẢN TRỊ VIÊN • NGOÀI BXH</div>
                  <div style="font-size:1.15rem;font-weight:900;margin:0.25rem 0 0.45rem;">🛡️ ${esc(APP.user.display_name)} (@${esc(APP.user.username)})</div>
                  <p style="margin:0 0 0.85rem;font-size:0.82rem;color:rgba(255,255,255,0.9);line-height:1.5;">
                    Tài khoản Quản trị viên được loại khỏi Bảng Xếp Hạng để đảm bảo công bằng tuyệt đối và giữ động lực leo Top cho học viên.
                  </p>
                  <button type="button" class="pk9-btn-hero-main" data-nav-tab="admin" style="width:100%;justify-content:center;padding:0.55rem 0.9rem;font-size:0.84rem;">
                    🛡️ Mở Admin Dashboard
                  </button>
                </div>
              ` : APP.user ? `
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.2rem;">
                  <div style="font-size:0.76rem;font-weight:800;color:#fde047;text-transform:uppercase;">🌟 THỨ HẠNG THẬT CỦA BẠN</div>
                  <div style="font-size:1.15rem;font-weight:900;margin:0.25rem 0 0.75rem;">👤 ${esc(APP.user.display_name)} (@${esc(APP.user.username)})</div>
                  <div class="pk9-lb-myrank-grid" style="text-align:center;">
                    <div style="background:rgba(15,23,42,0.45);padding:0.6rem;border-radius:0.8rem;">
                      <strong style="display:block;font-size:1.2rem;color:#38bdf8;">#${myRank?.weeklyRank || '—'}</strong>
                      <span style="font-size:0.72rem;">Tuần (${Number(myRank?.entry?.weeklyXp ?? APP.user.weekly_xp ?? 0)} XP)</span>
                    </div>
                    <div style="background:rgba(15,23,42,0.45);padding:0.6rem;border-radius:0.8rem;">
                      <strong style="display:block;font-size:1.2rem;color:#34d399;">#${myRank?.topRank || '—'}</strong>
                      <span style="font-size:0.72rem;">Top (${Number(myRank?.entry?.xp ?? APP.user.xp ?? 0)} XP)</span>
                    </div>
                    <div style="background:rgba(15,23,42,0.45);padding:0.6rem;border-radius:0.8rem;">
                      <strong style="display:block;font-size:1.2rem;color:#fbbf24;">#${myRank?.examRank || '—'}</strong>
                      <span style="font-size:0.72rem;">Đỉnh ${Number(myRank?.entry?.bestScore || 0).toFixed(1)}đ (${Number(myRank?.entry?.attempts || 0)} đề)</span>
                    </div>
                  </div>
                  <div style="margin-top:0.65rem;padding-top:0.55rem;border-top:1px dashed rgba(255,255,255,0.2);display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;font-size:0.74rem;color:rgba(255,255,255,0.9);">
                    <span>📚 <b>${Number(myRank?.entry?.lessonsDone ?? Object.values(APP.doneMap || {}).filter(Boolean).length)}</b> bài học</span>
                    <span>⚔️ <b>${Number(myRank?.entry?.questionsConquered ?? APP.user?.rpg?.questions_conquered ?? 0)}</b> câu chinh phục</span>
                    <span>🔥 Chuỗi <b>${Number(myRank?.entry?.streak ?? APP.user?.streak ?? 1)}</b> ngày</span>
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
              🔥 BXH Hàng Tuần (${weeklyRows.length} học viên)
            </button>
            <button type="button" class="pk9-exam-chip ${APP.lbMode === 'top' ? 'active' : ''}" data-lb-mode="top">
              🏆 BXH Top Học Viên (${topRows.length} học viên)
            </button>
            <button type="button" class="pk9-exam-chip ${APP.lbMode === 'exam' ? 'active' : ''}" data-lb-mode="exam">
              🎯 BXH Cao Thủ Luyện Đề (${examRows.length})
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
            <div class="pk9-exam-search">
              <span class="pk9-exam-search-icon">🔍</span>
              <input type="search" id="pk9-lb-search-input" placeholder="Tìm học viên, trường THPT..." value="${esc(APP.lbSearch)}" />
            </div>
            <button type="button" class="pk9-btn-exam-ghost" data-refresh-leaderboard="1" style="padding:0.46rem 0.78rem;font-size:0.78rem;white-space:nowrap;">
              🔄 Làm mới BXH
            </button>
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
                ${window.PK9_RPG_MODELS?.renderAvatarStageHtml ? window.PK9_RPG_MODELS.renderAvatarStageHtml({
                  size: 'lg',
                  outfitId: row.rpg_outfit_id || 'outfit-scholar',
                  frameClass: row.rpg_frame || 'pk9-frame-bronze',
                  auraClass: row.rpg_aura || '',
                  petId: row.rpg_pet_id || '',
                  petIcon: row.rpg_pet || '',
                  avatarImgUrl: row.avatar_url || row.avatar_data || ''
                }) : `<div class="pk9-lb-avatar ${esc(row.rpg_frame || 'pk9-frame-bronze')}">${row.rpg_outfit ? esc(row.rpg_outfit) : esc((row.display_name || 'K').slice(0, 1).toUpperCase())}</div>`}
                <div style="font-weight:900;font-size:1.06rem;margin-top:0.45rem;">${slot.title} • ${esc(row.display_name)} ${row.rpg_pet ? esc(row.rpg_pet) : ''}</div>
                <div style="font-size:0.79rem;color:var(--pk9-text-muted);margin:0.2rem 0 0.65rem;">
                  🏫 ${esc(row.school || 'Học viên đã đăng ký')} • Khối ${esc(row.grade || '2K9')} ${row.rpg_tier ? `• <b>${esc(row.rpg_tier)}</b>` : ''}
                </div>
                <div style="display:flex;justify-content:center;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.6rem;">
                  <span class="pk9-badge pk9-badge-subj">${mainMetric}</span>
                  <span class="pk9-badge pk9-badge-verified">📝 ${row.attempts || 0} đề • Cao nhất ${Number(row.bestScore || 0).toFixed(2)}đ</span>
                </div>
                <div style="display:flex;justify-content:center;gap:0.35rem;flex-wrap:wrap;">
                  ${row.rpg_title ? `<span class="pk9-badge pk9-badge-code">✨ ${esc(row.rpg_title)}</span>` : ''}
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
            <div>${APP.lbMode === 'weekly' ? 'XP Tuần Này' : APP.lbMode === 'exam' ? 'Điểm Luyện Đề' : 'Tổng XP & Level'}</div>
            <div class="hide-mob">Thành tích Luyện đề</div>
            <div class="hide-mob">Chuỗi & Huy hiệu</div>
          </div>
          <div id="pk9-lb-rows-body">
            ${buildLeaderboardRowsHtml()}
          </div>
        </div>
      </div>
    `;
  }

  function buildLeaderboardRowsHtml() {
    const onlyStudents = rows => (rows || []).filter(r => !r.is_admin && r.role !== 'admin');
    const weeklyRows = onlyStudents(APP.lbData.weekly_leaderboard);
    const topRows = onlyStudents(APP.lbData.leaderboard);
    const examRows = onlyStudents(APP.lbData.exam_leaderboard);
    const list = APP.lbMode === 'weekly'
      ? weeklyRows
      : APP.lbMode === 'exam'
      ? examRows
      : topRows;
    const q = APP.lbSearch.trim().toLowerCase();
    const filtered = list.filter(r => {
      if (!q) return true;
      return `${r.display_name} ${r.username} ${r.school || ''} ${r.grade || ''}`.toLowerCase().includes(q);
    });
    const maxMetric = APP.lbMode === 'exam'
      ? Math.max(10, ...list.map(x => Number(x.bestScore) || 0))
      : Math.max(100, ...list.map(x => Number(APP.lbMode === 'weekly' ? x.weeklyXp : x.xp) || 0));

    if (!filtered.length) {
      return `
        <div style="padding:2.2rem 1.5rem;text-align:center;color:var(--pk9-text-muted);font-size:0.9rem;">
          Chưa có học viên thật nào ghi nhận ở mục này. Hãy đăng ký tài khoản hoặc hoàn thành 1 đề thi để xuất hiện đầu tiên!
        </div>
      `;
    }
    return filtered.map((row, idx) => {
      const isMe = APP.user && String(row.username || '').toLowerCase() === String(APP.user.username || '').toLowerCase();
      const rankBadge = row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`;
      const curVal = APP.lbMode === 'exam'
        ? Number(row.bestScore || 0)
        : Number(APP.lbMode === 'weekly' ? row.weeklyXp : row.xp) || 0;
      const pct = Math.min(100, Math.max(curVal > 0 ? 12 : 4, Math.round((curVal / (maxMetric || 1)) * 100)));
      return `
        <div class="pk9-lb-row ${isMe ? 'me' : ''}" style="animation-delay:${Math.min(idx * 0.05, 0.4)}s;">
          <div style="font-weight:900;font-size:0.95rem;color:${row.rank <= 3 ? '#d97706' : 'var(--pk9-text)'};">
            ${rankBadge}
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;min-width:0;">
            ${window.PK9_RPG_MODELS?.renderAvatarStageHtml ? window.PK9_RPG_MODELS.renderAvatarStageHtml({
              size: 'sm',
              outfitId: row.rpg_outfit_id || 'outfit-scholar',
              frameClass: row.rpg_frame || 'pk9-frame-bronze',
              auraClass: row.rpg_aura || '',
              petId: row.rpg_pet_id || '',
              petIcon: row.rpg_pet || '',
              avatarImgUrl: row.avatar_url || row.avatar_data || ''
            }) : `
            <div class="${esc(row.rpg_frame || 'pk9-frame-bronze')}" style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0d9488);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.1rem;">
              ${row.rpg_outfit ? esc(row.rpg_outfit) : esc((row.display_name || 'K').slice(0, 1).toUpperCase())}
            </div>`}
            <div style="min-width:0;">
              <div style="font-weight:800;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${esc(row.display_name)} ${row.rpg_pet ? esc(row.rpg_pet) : ''} (@${esc(row.username)}) ${isMe ? '<span class="pk9-badge pk9-badge-subj">Bạn</span>' : ''}
              </div>
              <div style="font-size:0.76rem;color:var(--pk9-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                🏫 ${esc(row.school || 'Học viên đã đăng ký')} • Khối ${esc(row.grade || '2K9')} ${row.rpg_title ? `• ${esc(row.rpg_title)}` : ''}
              </div>
            </div>
          </div>
          <div>
            <div style="font-weight:800;color:var(--pk9-primary);font-size:0.86rem;">
              ${APP.lbMode === 'weekly'
                ? `🔥 ${Number(row.weeklyXp || 0)} XP Tuần <span style="font-size:0.73rem;color:var(--pk9-text-muted);">• Tổng ${Number(row.xp || 0)} XP</span>`
                : APP.lbMode === 'exam'
                ? `🎯 Đỉnh ${Number(row.bestScore || 0).toFixed(2)}đ <span style="font-size:0.74rem;color:var(--pk9-text-muted);">(TB ${Number(row.avgScore || 0).toFixed(2)}đ • ${Number(row.attempts || 0)} đề)</span>`
                : `⚡ ${Number(row.xp || 0)} XP <span style="font-size:0.74rem;color:var(--pk9-text-muted);">(Lv.${Number(row.level || 1)} • Tuần +${Number(row.weeklyXp || 0)})</span>`}
            </div>
            <div class="pk9-topic-track" style="height:0.38rem;margin-top:0.28rem;">
              <div class="pk9-topic-fill" style="width:${pct}%;"></div>
            </div>
          </div>
          <div class="hide-mob" style="font-size:0.82rem;">
            <div>🎯 Đỉnh: <b>${Number(row.bestScore || 0).toFixed(2)}đ</b> • ${Number(row.attempts || 0)} đề</div>
            <div style="font-size:0.73rem;color:var(--pk9-text-muted);">📚 ${Number(row.lessonsDone || 0)} bài • ⚔️ ${Number(row.questionsConquered || 0)} câu</div>
          </div>
          <div class="hide-mob" style="font-size:0.8rem;">
            🔥 ${row.streak || 1} ngày • <span class="pk9-badge pk9-badge-code">${esc((row.badges || ['Thành Viên K9'])[0])}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================================================
  // TAB 5: PDF PRO LIBRARY (84+ DOCUMENTS)
  // ==========================================================================
  function getAllDocsList() {
    const kv = Array.isArray(window.KIMVAN_DOCS) ? window.KIMVAN_DOCS : [];
    const ref = Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27 : [];
    return [
      ...ref.map((d, i) => ({ id: `ref-${i}`, title: d.title, subject: d.subject || 'Tổng hợp', kind: d.kind || 'Đề thi & Lời giải', source: d.source || 'Sở GD&ĐT', url: d.url })),
      ...kv.map((d, i) => ({ id: `kv-${i}`, title: d.title, subject: d.subject || 'Tổng hợp', kind: d.kind || 'Ebook / Tài liệu', source: 'Kho Tài Liệu Phúc K9', url: d.url }))
    ];
  }

  function buildDocsCardsHtml() {
    const allDocs = getAllDocsList();
    const q = APP.docSearch.trim().toLowerCase();
    const filtered = allDocs.filter(d => {
      if (APP.docSubject !== 'ALL' && !String(d.subject).toLowerCase().includes(APP.docSubject.replace(' 12', '').toLowerCase())) return false;
      if (!q) return true;
      return `${d.title} ${d.subject} ${d.kind} ${d.source}`.toLowerCase().includes(q);
    });
    return filtered.map(d => `
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
          ${!isDriveFolderUrl(d.url) ? `
            <a href="${esc(toDirectDownloadUrl(d.url) || d.url)}" download target="_blank" rel="noopener" class="pk9-btn-exam-ghost" style="text-decoration:none;flex:0 0 auto;padding:0.55rem 0.78rem;" title="Tải PDF về máy">
              ⬇️ Tải PDF
            </a>
          ` : ''}
          <a href="${esc(d.url)}" target="_blank" rel="noopener" class="pk9-btn-exam-ghost" style="text-decoration:none;flex:0 0 auto;padding:0.55rem 0.7rem;" title="Mở tab ngoài">
            ↗
          </a>
        </div>
      </article>
    `).join('');
  }

  function renderDocsTab() {
    const root = document.getElementById('tab-docs');
    if (!root) return;

    const allDocs = getAllDocsList();
    const subjects = ['ALL', 'Toán 12', 'Vật lí 12', 'Hóa học 12', 'Sinh học 12', 'Tiếng Anh 12'];

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

        <div class="pk9-exam-grid" id="pk9-doc-cards-grid">
          ${buildDocsCardsHtml()}
        </div>
      </div>
    `;
  }

  function extractYtId(rawUrl = '') {
    const m = String(rawUrl || '').match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : '';
  }

  function extractDriveFileId(rawUrl = '') {
    const m = String(rawUrl || '').match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/)
      || String(rawUrl || '').match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([A-Za-z0-9_-]+)/);
    return m ? m[1] : '';
  }

  function setYtEmbedStartTime(embedUrl, startSec = 0) {
    try {
      const u = new URL(embedUrl, window.location.origin);
      if (startSec > 0) u.searchParams.set('start', String(Math.floor(startSec)));
      else u.searchParams.delete('start');
      u.searchParams.set('autoplay', '0');
      u.searchParams.set('enablejsapi', '1');
      return u.toString();
    } catch {
      const clean = String(embedUrl || '').replace(/([?&])(start|autoplay)=[^&]*/g, '');
      const sep = clean.includes('?') ? '&' : '?';
      return startSec > 0 ? `${clean}${sep}start=${Math.floor(startSec)}&autoplay=0` : clean;
    }
  }

  function restoreSuspendedLectureVideo(overrideStartSec) {
    const sus = APP._suspendedLectureVideo;
    APP._suspendedLectureVideo = null;
    const wrap = document.getElementById('pk9-video-frame-wrap');
    if (wrap) wrap.classList.remove('is-suspended');
    const ifr = document.getElementById('pk9-lecture-iframe');
    if (!ifr || !sus || !sus.src) return;

    let restoreSrc = sus.src;
    if (sus.kind === 'youtube') {
      const secToUse = typeof overrideStartSec === 'number' && overrideStartSec >= 0 ? overrideStartSec : (sus.resumeSec || 0);
      restoreSrc = setYtEmbedStartTime(sus.src, secToUse);
      const readout = document.getElementById('pk9-yt-time-readout');
      if (readout && secToUse > 0) readout.textContent = `⏱ ${formatMmSs(secToUse)}`;
    }
    ifr.src = restoreSrc;
    bindYtBridgeForSlot('lecture');
  }

  function closeInAppViewer() {
    const ov = document.getElementById('pk9-inapp-viewer-overlay');
    if (!ov || !ov.classList.contains('open')) return;
    const modalSec = Math.floor(YT_BRIDGE_STATE.modal.time || 0);
    const modalIfr = document.getElementById('pk9-inapp-viewer-iframe');
    if (modalIfr) {
      sendYtCommand('modal', 'pauseVideo', []);
      modalIfr.src = 'about:blank';
    }
    ov.classList.remove('open');
    ov.innerHTML = '';

    const sus = APP._suspendedLectureVideo;
    if (sus) {
      const modalWasSameYt = sus.ytId && sus.ytId === extractYtId(sus.modalRawUrl || '');
      const resumeAt = modalWasSameYt && modalSec > 0 ? modalSec : undefined;
      restoreSuspendedLectureVideo(resumeAt);
    }
  }

  function startBrandedLectureVideo() {
    const ifr = document.getElementById('pk9-lecture-iframe');
    const wrap = document.getElementById('pk9-video-frame-wrap');
    const poster = document.getElementById('pk9-brand-player-poster');
    if (!ifr) return false;
    const tKey = ifr.getAttribute('data-topic-key') || '';
    if (tKey) APP._lectureStartedKey = tKey;
    if (poster) poster.remove();
    if (wrap) wrap.classList.remove('is-poster-idle');
    const autoSrc = ifr.getAttribute('data-autoplay-src') || ifr.getAttribute('data-yt-base') || '';
    if (autoSrc && (!ifr.src || ifr.src.startsWith('about:blank'))) {
      ifr.src = autoSrc;
      bindYtBridgeForSlot('lecture');
    }
    return true;
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
    let isYtModal = false;
    const ytId = extractYtId(embedUrl);
    if (ytId) {
      isYtModal = true;
      embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=1&playsinline=1&autoplay=1`;
    } else if (embedUrl.includes('docs.google.com/spreadsheets/d/')) {
      const m = embedUrl.match(/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
      const gidMatch = embedUrl.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '662446747';
      if (m) embedUrl = `https://docs.google.com/spreadsheets/d/${m[1]}/htmlview?gid=${gid}&widget=true&headers=false`;
    } else if (embedUrl.includes('drive.google.com/') || embedUrl.includes('docs.google.com/')) {
      embedUrl = toDrivePreviewUrl(embedUrl);
    }

    // Prevent dual simultaneous video/audio playback: suspend inline lecture video before mounting fullscreen modal
    const lectureIfr = document.getElementById('pk9-lecture-iframe');
    const lectKind = lectureIfr?.dataset?.vidKind || '';
    const lectLiveSrc = lectureIfr && lectureIfr.src && !lectureIfr.src.startsWith('about:blank') ? lectureIfr.src : '';
    const lectYtId = extractYtId(lectureIfr?.dataset?.ytBase || lectLiveSrc);
    const lectDriveId = extractDriveFileId(lectureIfr?.dataset?.externalUrl || lectureIfr?.dataset?.ytBase || lectLiveSrc);
    const targetDriveId = extractDriveFileId(rawUrl || embedUrl);
    const isOpeningVideo = isYtModal || (lectKind === 'drive' && Boolean(lectDriveId && targetDriveId && lectDriveId === targetDriveId));

    if (lectureIfr && lectLiveSrc && (lectKind === 'youtube' || lectKind === 'drive')) {
      const curSec = Math.floor(YT_BRIDGE_STATE.lecture.time || 0);
      if (isOpeningVideo) {
        if (lectKind === 'youtube') sendYtCommand('lecture', 'pauseVideo', []);
        if (!APP._suspendedLectureVideo) {
          APP._suspendedLectureVideo = {
            src: lectureIfr.dataset.ytBase || lectLiveSrc,
            kind: lectKind,
            resumeSec: curSec,
            ytId: lectYtId,
            modalRawUrl: rawUrl
          };
        } else {
          APP._suspendedLectureVideo.modalRawUrl = rawUrl;
        }
        lectureIfr.src = 'about:blank';
        document.getElementById('pk9-video-frame-wrap')?.classList.add('is-suspended');
        if (isYtModal && lectYtId && ytId === lectYtId && curSec > 1) {
          embedUrl += `&start=${curSec}`;
        }
      } else if (lectKind === 'youtube') {
        sendYtCommand('lecture', 'pauseVideo', []);
      }
    }

    overlay.innerHTML = `
      <div class="pk9-inapp-viewer-box">
        <div class="pk9-sheet-toolbar" style="background:linear-gradient(135deg,#071022 0%,#102442 75%,#0d2b3e 100%);color:#f8fafc;border-bottom:1px solid rgba(250,204,21,0.32);">
          <div style="display:flex;align-items:center;gap:0.65rem;min-width:0;flex:1;">
            <img src="/assets/phuc-k9-favicon.png" alt="Logo Học Cùng Phúc K9" class="pk9-brand-crest-img" style="width:36px;height:36px;border-radius:10px;" />
            <div style="min-width:0;flex:1;">
              <div style="font-size:0.7rem;font-weight:900;color:#fde047;letter-spacing:0.05em;text-transform:uppercase;">
                HỌC CÙNG PHÚC K9 • ${isYtModal ? 'STUDIO VIDEO ĐỘC QUYỀN' : 'TRÌNH ĐỌC PDF & TÀI LIỆU ĐỘC QUYỀN'}
              </div>
              <div style="font-weight:900;font-size:0.96rem;color:#ffffff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${esc(title || 'Thư Viện Công Khai')}
              </div>
              ${subTitle ? `<div style="font-size:0.74rem;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(subTitle)}</div>` : ''}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.42rem;flex-wrap:wrap;">
            ${!/youtube\.com|youtu\.be|spreadsheets/i.test(rawUrl || '') && toDirectDownloadUrl(rawUrl) ? `
              <a href="${esc(toDirectDownloadUrl(rawUrl))}" download target="_blank" rel="noopener" class="pk9-brand-mini-btn" style="background:#0284c7;border-color:#38bdf8;">⬇️ Tải về</a>
            ` : ''}
            ${rawUrl ? `
              <a href="${esc(rawUrl)}" target="_blank" rel="noopener" class="pk9-brand-mini-btn">↗️ Mở gốc</a>
            ` : ''}
            <button type="button" class="pk9-brand-mini-btn" data-reload-inapp-iframe="1">🔄 Tải lại</button>
            <button type="button" class="pk9-btn-exam-primary" data-close-inapp-viewer="1" style="padding:0.38rem 0.85rem;background:#e11d48;font-size:0.78rem;">
              ✕ Đóng
            </button>
          </div>
        </div>
        ${isYtModal ? `
          <div class="pk9-player-control-dock" id="pk9-modal-control-dock" style="padding:0.45rem 1rem;">
            <div class="pk9-ctrl-group">
              <span class="pk9-brand-time-pill" id="pk9-yt-modal-time-readout">⏱ 00:00</span>
              <button type="button" class="pk9-ctrl-btn" data-yt-slot="modal" data-yt-seek="-30">⏮ -30s</button>
              <button type="button" class="pk9-ctrl-btn" data-yt-slot="modal" data-yt-seek="-10">⏪ -10s</button>
              <button type="button" class="pk9-ctrl-btn primary" data-yt-slot="modal" data-yt-toggle="1">⏯ Phát / Dừng</button>
              <button type="button" class="pk9-ctrl-btn" data-yt-slot="modal" data-yt-seek="10">⏩ +10s</button>
              <button type="button" class="pk9-ctrl-btn" data-yt-slot="modal" data-yt-seek="30">⏭ +30s</button>
            </div>
            <div class="pk9-ctrl-group">
              ${[0.75, 1, 1.25, 1.5, 2].map(spd => `
                <button type="button" class="pk9-ctrl-speed-pill ${spd === 1 ? 'active' : ''}" data-yt-slot="modal" data-yt-rate="${spd}">${spd}x</button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        <div style="flex:1;background:#ffffff;position:relative;">
          <iframe
            id="pk9-inapp-viewer-iframe"
            data-yt-slot="modal"
            src="${esc(embedUrl)}"
            title="${esc(title)}"
            style="width:100%;height:100%;border:0;display:block;"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen
          ></iframe>
          <div class="pk9-player-watermark ${isYtModal ? '' : 'is-pdf'}" aria-hidden="true">
            <img src="/assets/phuc-k9-favicon.png" alt="" />
            <span>HỌC CÙNG PHÚC K9</span>
          </div>
        </div>
      </div>
    `;
    overlay.classList.add('open');
    bindYtBridgeForSlot('modal');
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
      { id: 'kc-sheet-master', title: 'Bảng Master Thư Viện Công Khai Tổng Hợp (Full Sheet GID 662446747)', subject: 'Tổng hợp', teacher: 'Tổng hợp Giáo viên (Nguồn công khai)', items: 'Toàn bộ link bài giảng YouTube & tài liệu công khai 2K8/2K9', tag: 'BẢNG GỐC', url: KHOA_CHUI_HTMLVIEW_URL, courseId: 'math12' },
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
                📖 Thư Viện Công Khai — Tổng Hợp Nguồn Video &amp; Tài Liệu Tham Khảo
              </h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.9rem;line-height:1.6;">
                Tổng hợp liên kết công khai từ YouTube, Google Sheet cộng đồng (` + 'docs.google.com/spreadsheets/...#gid=662446747' + `) với đầy đủ tên Thầy/Cô &amp; nguồn gốc để học sinh tra cứu trực tiếp trong web (hỗ trợ thu phóng, tìm kiếm nhanh &amp; tôn trọng tác quyền gốc).
              </p>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.55rem;justify-content:center;">
              <button type="button" class="pk9-btn-hero-main" data-kc-toggle-fullscreen="1" style="justify-content:center;width:100%;">
                ${APP.kcFullscreen ? '📐 Thu nhỏ về trang chuẩn' : '🖥️ Phóng To Bảng Tài Liệu Toàn Màn Hình'}
              </button>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
                <button type="button" class="pk9-btn-hero-sec" data-kc-scroll-directory="1" style="justify-content:center;padding:0.6rem;">
                  🗂️ Danh mục chọn nhanh
                </button>
                <button type="button" class="pk9-btn-hero-sec" data-nav-tab="lectures" style="justify-content:center;padding:0.6rem;">
                  🎬 Phòng Video ${getEcosystemStats().topicsCount.toLocaleString('vi-VN')}+ bài
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- EMBEDDED GOOGLE SHEET WORKSPACE DIRECTLY INSIDE MAIN WEBSITE -->
        <section class="pk9-sheet-workspace ${APP.kcFullscreen ? 'fullscreen-focus' : ''}" id="pk9-khoa-chui-workspace">
          <div class="pk9-sheet-toolbar">
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <span style="font-weight:900;font-size:0.88rem;color:var(--pk9-primary);">📊 Bảng Thư Viện Công Khai Trực Tiếp:</span>
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
              title="Thư Viện Công Khai — Học Cùng Phúc K9"
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
            <h3 id="pk9-kc-dir-count">🚀 Danh Mục Khóa Học & Chuyên Đề Tham Khảo Mở Nhanh Trong Web (${filtered.length} khóa)</h3>
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

        <div class="pk9-exam-grid" id="pk9-kc-cards-grid">
          ${buildKhoaChuiCardsHtml()}
        </div>
      </div>
    `;
  }

  function buildKhoaChuiCardsHtml() {
    const allItems = getKhoaChuiCuratedList();
    const q = APP.kcSearch.trim().toLowerCase();
    const filtered = allItems.filter(item => {
      if (APP.kcSubject !== 'ALL' && !String(item.subject || '').toLowerCase().includes(APP.kcSubject.toLowerCase())) return false;
      if (!q) return true;
      return `${item.title} ${item.teacher || ''} ${item.subject || ''} ${item.tag || ''}`.toLowerCase().includes(q);
    });
    const dirCountEl = document.getElementById('pk9-kc-dir-count');
    if (dirCountEl) {
      dirCountEl.textContent = `🚀 Danh Mục Khóa Học & Chuyên Đề Tham Khảo Mở Nhanh Trong Web (${filtered.length} khóa)`;
    }
    return filtered.map(item => `
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
    `).join('');
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
            📖 Mở Thư Viện Công Khai Trực Tiếp
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
  function getFlashcardsStateMap() {
    if (window.PK9_RPG_STATE?.flashcards_state && typeof window.PK9_RPG_STATE.flashcards_state === 'object') {
      return window.PK9_RPG_STATE.flashcards_state;
    }
    try {
      return JSON.parse(localStorage.getItem('pk9_fc_state') || '{}') || {};
    } catch {
      return {};
    }
  }

  async function updateFlashcardItemState(cardKey, patch, opts = {}) {
    try {
      const curMap = getFlashcardsStateMap();
      const next = { ...(curMap[cardKey] || {}), ...patch, updatedAt: new Date().toISOString() };
      curMap[cardKey] = next;
      localStorage.setItem('pk9_fc_state', JSON.stringify(curMap));
      if (window.PK9_RPG_STATE) {
        window.PK9_RPG_STATE.flashcards_state = { ...(window.PK9_RPG_STATE.flashcards_state || {}), [cardKey]: next };
      }
    } catch {}

    if (APP.user && !opts.skipServerSync) {
      try {
        const resp = await fetch('/api/dashboard?action=rpg-settings', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
          body: JSON.stringify({ flashcard_update: { key: cardKey, ...patch } })
        });
        if (resp.ok) {
          const d = await resp.json();
          if (d?.rpg && typeof window.PK9_APPLY_RPG_UPDATE === 'function') window.PK9_APPLY_RPG_UPDATE(d.rpg);
        }
      } catch {}
    }
  }

  function renderFlashcardsTab() {
    const root = document.getElementById('tab-flashcards');
    if (!root) return;
    const decks = Array.isArray(window.PK9_FLASHCARDS) ? window.PK9_FLASHCARDS : [];
    const deck = decks[APP.fcDeckIdx] || decks[0];
    if (!deck) return;
    const rawCards = (deck.cards || []).map((c, idx) => ({ ...c, _origIdx: idx, _key: `${deck.id}_${idx}` }));
    const fcMap = getFlashcardsStateMap();
    const counts = { ALL: rawCards.length, new: 0, learning: 0, mastered: 0, star: 0 };
    for (const c of rawCards) {
      const st = fcMap[c._key] || { status: 'new', star: false };
      const sName = st.status || 'new';
      counts[sName] = (counts[sName] || 0) + 1;
      if (st.star) counts.star += 1;
    }
    const filteredCards = rawCards.filter(c => {
      const st = fcMap[c._key] || { status: 'new', star: false };
      if (APP.fcFilter === 'ALL') return true;
      if (APP.fcFilter === 'star') return Boolean(st.star);
      return (st.status || 'new') === APP.fcFilter;
    });
    const cards = filteredCards.length ? filteredCards : rawCards;
    const safeIdx = ((APP.fcCardIdx % cards.length) + cards.length) % cards.length;
    const card = cards[safeIdx] || cards[0];
    const cardState = fcMap[card._key] || { status: 'new', star: false };

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>🃏 Flashcards 3D Phản Xạ Công Thức (${esc(deck.subject)})</h2>
            <p>Nhấn vào thẻ để lật 3D xem đáp án. Phân loại Chưa học / Đang học / Đã thuộc / Thẻ sao ⭐ & đồng bộ lên tài khoản!</p>
          </div>
          <div class="pk9-fc-deck-bar">
            ${decks.map((d, idx) => `
              <button type="button" class="pk9-exam-chip ${idx === APP.fcDeckIdx ? 'active' : ''}" data-fc-deck="${idx}">
                ${d.icon} ${esc(d.subject)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="pk9-fc-status-bar">
          <button type="button" class="pk9-exam-chip ${APP.fcFilter === 'ALL' ? 'active' : ''}" data-fc-filter="ALL">Tất cả (${counts.ALL})</button>
          <button type="button" class="pk9-exam-chip ${APP.fcFilter === 'new' ? 'active' : ''}" data-fc-filter="new">Chưa học (${counts.new})</button>
          <button type="button" class="pk9-exam-chip ${APP.fcFilter === 'learning' ? 'active' : ''}" data-fc-filter="learning">Đang học (${counts.learning})</button>
          <button type="button" class="pk9-exam-chip ${APP.fcFilter === 'mastered' ? 'active' : ''}" data-fc-filter="mastered">Đã thuộc (${counts.mastered})</button>
          <button type="button" class="pk9-exam-chip ${APP.fcFilter === 'star' ? 'active' : ''}" data-fc-filter="star">⭐ Có thẻ sao (${counts.star})</button>
        </div>

        ${!filteredCards.length ? `
          <div style="padding:0.75rem 1rem;border-radius:0.85rem;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);font-size:0.82rem;">
            Bộ lọc "${esc(APP.fcFilter)}" chưa có thẻ nào — đang hiển thị tạm toàn bộ ${rawCards.length} thẻ.
          </div>
        ` : ''}

        <div class="pk9-fc-scene" data-fc-flip="1">
          <div class="pk9-fc-card ${APP.fcFlipped ? 'flipped' : ''}" id="pk9-fc-card-el">
            <div class="pk9-fc-face pk9-fc-front">
              <span class="pk9-badge pk9-badge-subj pk9-fc-badge">
                ${deck.icon} ${esc(deck.subject)} • Thẻ ${safeIdx + 1}/${cards.length} ${cardState.star ? '⭐' : ''} (Nhấn để lật)
              </span>
              <div class="pk9-fc-question">${card.front}</div>
            </div>
            <div class="pk9-fc-face pk9-fc-back">
              <span class="pk9-badge pk9-fc-badge" style="background:rgba(255,255,255,0.2);color:#fff;">
                💡 Đáp án & Công thức chuẩn
              </span>
              <div class="pk9-fc-answer">${card.back}</div>
            </div>
          </div>
        </div>

        <div class="pk9-fc-swipe-hint">👈 Vuốt trái / phải để đổi thẻ • Chạm vào thẻ để lật 3D</div>

        <div class="pk9-fc-controls">
          <button type="button" class="pk9-btn-exam-ghost" data-fc-prev="1">← Thẻ trước</button>
          <button type="button" class="pk9-btn-exam-ghost" data-fc-flip="1">🔄 Lật thẻ 3D</button>
          <button type="button" class="pk9-btn-exam-ghost" data-fc-star="${esc(card._key)}" data-fc-curstar="${cardState.star ? '1' : '0'}">
            ${cardState.star ? '⭐ Bỏ sao' : '☆ Đánh dấu sao'}
          </button>
          <button type="button" class="pk9-btn-exam-ghost" data-fc-learning="${esc(card._key)}">
            📖 Đang học
          </button>
          <button type="button" class="pk9-btn-exam-primary" data-fc-mastered="${esc(card._key)}" style="max-width:240px;">
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

  function safeCommunityLink(url) {
    const raw = String(url || '').trim();
    return (/^https?:\/\//i.test(raw) || raw.startsWith('/api/blob?')) ? raw : '';
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
          <h4 style="margin:0 0 0.5rem;font-size:1rem;font-weight:800;">📤 Đóng góp tài liệu / link đề thi cho cộng đồng K9</h4>
          ${!APP.user ? `
            <p style="margin:0 0 0.75rem;font-size:0.83rem;color:#b45309;font-weight:700;">
              🔒 Bạn đang ở chế độ Khách. Hãy <button type="button" class="pk9-admin-btn-xs" data-open-auth="login">Đăng nhập / Đăng ký</button> để đăng tài liệu lên máy chủ lưu vĩnh viễn.
            </p>
          ` : ''}
          <form id="pk9-community-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:0.75rem;">
            <input type="text" name="title" class="pk9-input" maxlength="180" placeholder="Tên tài liệu / đề thi..." required />
            <input type="text" name="subject" class="pk9-input" maxlength="60" placeholder="Môn học (VD: Toán 12, Sinh 12)" required />
            <input type="url" name="url" class="pk9-input" maxlength="600" placeholder="Link Google Drive / PDF / OneDrive (https://...)..." required />
            <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.35rem;">🚀 Chia sẻ lên Cộng đồng</button>
          </form>
        </div>

        <div class="pk9-exam-grid">
          ${APP.communityItems.length ? APP.communityItems.map(item => {
            const href = safeCommunityLink(item.download_url || item.url);
            const canDel = Boolean(item.id && APP.user && (APP.isAdmin || String(item.username || '').toLowerCase() === String(APP.user.username || '').toLowerCase()));
            return `
            <article class="pk9-exam-card">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;margin-bottom:0.5rem;">
                  <span class="pk9-badge pk9-badge-subj">${esc(item.subject || 'Tài liệu K9')}</span>
                  ${canDel ? `<button type="button" class="pk9-admin-btn-xs danger" data-del-community-item="${esc(item.id)}">🗑️ Xóa</button>` : ''}
                </div>
                <h4>${esc(item.title)}</h4>
                <div class="pk9-exam-origin">👤 Đóng góp bởi: ${esc(item.author || item.uploader || item.username || 'Học viên K9')}${item.created_label ? ` • ${esc(item.created_label)}` : ''}</div>
              </div>
              ${href ? `
                <a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="pk9-btn-exam-ghost" style="margin-top:0.75rem;">
                  🔗 Mở tài liệu chia sẻ ↗
                </a>
              ` : `
                <span class="pk9-exam-origin" style="margin-top:0.75rem;">Link tài liệu chưa hợp lệ</span>
              `}
            </article>
          `;
          }).join('') : `
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
            <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.85rem;">
              <button type="button" class="pk9-exam-chip ${APP.pomoMode === 25 ? 'active' : ''}" data-pomo-mode="25">🍅 Học sâu 25p</button>
              <button type="button" class="pk9-exam-chip ${APP.pomoMode === 50 ? 'active' : ''}" data-pomo-mode="50">🔥 Luyện đề 50p</button>
              <button type="button" class="pk9-exam-chip ${APP.pomoMode === 5 ? 'active' : ''}" data-pomo-mode="5">☕ Nghỉ 5p</button>
            </div>
            <div id="pk9-pomo-clock" class="pk9-pomo-clock">
              ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}
            </div>
            <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:0.55rem;">
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

    const samples = [
      'Giải thích cách tính tích phân từng phần và ví dụ minh họa?',
      'So sánh lực Lo-ren-xơ và lực từ tác dụng lên dây dẫn?',
      'Cách viết đồng phân este C4H8O2 nhanh không bị sót?'
    ];

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <div class="pk9-sec-head" style="margin-top:0;">
          <div>
            <h2>🤖 Trợ Lý AI Học Tập Phúc K9 (Giải Toán, Lí, Hóa, Sinh, Anh 24/7)</h2>
            <p>Đặt câu hỏi về công thức, phương pháp giải bài tập hoặc nhờ AI lập kế hoạch ôn thi cá nhân hóa.</p>
          </div>
        </div>

        <div class="pk9-card">
          <div style="display:flex;flex-wrap:wrap;gap:0.45rem;margin-bottom:0.75rem;">
            ${samples.map(s => `<button type="button" class="pk9-exam-chip" data-ai-suggest="${esc(s)}" style="font-size:0.78rem;">💡 ${esc(s)}</button>`).join('')}
          </div>
          <div id="pk9-ai-messages" style="min-height:260px;max-height:420px;overflow-y:auto;padding:1rem;border-radius:1rem;background:var(--pk9-surface-2);margin-bottom:1rem;display:flex;flex-direction:column;gap:0.75rem;">
            <div style="align-self:flex-start;max-width:85%;padding:0.85rem 1.1rem;border-radius:1rem;background:var(--pk9-surface);border:1px solid var(--pk9-border);font-size:0.9rem;">
              👋 Xin chào! Mình là <b>Trợ lý AI Học Cùng Phúc K9</b>. Bạn cần giải thích công thức Toán 12, Vật lí 12, Hóa học 12 (IUPAC), Sinh học 12 hay chiến thuật làm đề GDPT 2018? Hãy nhập câu hỏi bên dưới nhé!
            </div>
          </div>
          <form id="pk9-ai-form" class="pk9-ai-form">
            <input type="text" id="pk9-ai-input" class="pk9-input" maxlength="2000" style="margin-top:0;flex:1 1 min(100%, 200px);min-width:0;" placeholder="Nhập câu hỏi bài tập hoặc công thức cần giải thích..." required />
            <button type="submit" id="pk9-ai-submit-btn" class="pk9-btn-exam-primary" style="flex:0 0 auto;padding:0 1.2rem;">Gửi câu hỏi 🚀</button>
          </form>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // TAB 11: SUPER DETAILED ADMIN DASHBOARD (TRUNG TÂM ĐIỀU HÀNH QUẢN TRỊ VIÊN)
  // ==========================================================================
  const TAB_LABELS_VI = {
    home: '🏠 Trang chủ',
    lectures: '🎬 Video bài giảng',
    exams: '🏛️ Phòng luyện đề',
    leaderboard: '🏆 BXH Tuần & Top',
    docs: '📚 Thư viện PDF',
    'khoa-chui': '📖 Thư viện công khai',
    archive: '🗂️ Tổng ôn 2K8',
    flashcards: '🧠 Flashcard 3D',
    community: '🤝 Cộng đồng',
    planner: '⏱️ Pomodoro 9+',
    ai: '🤖 Trợ lý AI',
    admin: '🛡️ Admin Pro'
  };

  function deviceMetaBadge(devType) {
    if (devType === 'mobile') return { cls: 'mobile', label: '📱 Điện thoại' };
    if (devType === 'tablet') return { cls: 'tablet', label: '📲 Tablet' };
    return { cls: 'desktop', label: '💻 Máy tính' };
  }

  function renderAnalyticsBars(items, emptyText, labelFn = x => x, colorCss = '') {
    const list = Array.isArray(items) ? items.filter(x => x && Number(x.count || 0) > 0) : [];
    if (!list.length) {
      return `<div style="padding:0.85rem;text-align:center;font-size:0.82rem;color:var(--pk9-text-muted);">${esc(emptyText)}</div>`;
    }
    const maxVal = Math.max(1, ...list.map(x => Number(x.count || 0)));
    return `
      <div class="pk9-analytics-list">
        ${list.slice(0, 8).map(item => {
          const cnt = Number(item.count || 0);
          const pct = Math.max(4, Math.round((cnt / maxVal) * 100));
          const label = labelFn(item.name);
          return `
            <div class="pk9-analytics-bar-row">
              <div class="pk9-analytics-bar-head">
                <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(label)}</span>
                <span style="font-variant-numeric:tabular-nums;color:var(--pk9-primary);flex-shrink:0;">${cnt.toLocaleString('vi-VN')}</span>
              </div>
              <div class="pk9-analytics-bar-track">
                <div class="pk9-analytics-bar-fill" style="width:${pct}%;${colorCss}"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  async function fetchAdminDetail(opts = {}) {
    if (!isClientVerifiedAdmin()) return;
    if (!opts.silent && !APP.adminDetailData) APP.adminLoading = true;
    try {
      const vid = getVisitorClientId();
      const [resp, exResp] = await Promise.all([
        fetch('/api/dashboard?action=admin-detail', {
          credentials: 'include',
          headers: { 'x-pk9-visitor': vid }
        }),
        fetch('/api/exams?action=admin-list', {
          credentials: 'include',
          headers: { 'x-pk9-visitor': vid }
        }).catch(() => null)
      ]);
      if (resp && (resp.status === 401 || resp.status === 403)) {
        const errData = await resp.json().catch(() => ({}));
        APP.adminLoading = false;
        if (errData?.warning && !errData?.banned) {
          handleAdminWarningResponse(errData);
          return;
        }
        if (errData?.banned) {
          handleBannedResponse(errData);
          return;
        }
        _serverAdminVerified = false;
        _serverSuperAdminVerified = false;
        APP.adminDetailData = null;
        updateHeaderAuthUI();
        enforceAdminDomHidden();
        switchTab('home', { force: true, keepScroll: true });
        return;
      }
      if (resp && resp.ok) {
        const data = await resp.json();
        if (data?.ok) {
          APP.adminDetailData = data;
          _serverSuperAdminVerified = Boolean(data.viewer_is_super_admin && APP.user?.username === 'phucadmin');
          if (data.announcement !== undefined) APP.systemAnnouncement = data.announcement;
          if (Array.isArray(data.custom_khoa_chui)) APP.customKhoaChui = data.custom_khoa_chui;
          renderSystemAnnouncementBar();
        }
      }
      if (exResp && exResp.ok) {
        const exData = await exResp.json().catch(() => ({}));
        if (Array.isArray(exData?.exams)) {
          APP.adminExamsCatalog = exData.exams;
        }
      }
    } catch {}
    APP.adminLoading = false;
    if (APP.activeTab === 'admin' && isClientVerifiedAdmin()) {
      const editingAdminInput = opts.silent && document.activeElement?.closest('#tab-admin input, #tab-admin select, #tab-admin textarea');
      if (!editingAdminInput) renderAdminTab();
    }
  }

  async function runAdminAction(payload) {
    if (!isClientVerifiedAdmin()) {
      enforceAdminDomHidden();
      return false;
    }
    try {
      const resp = await fetch('/api/dashboard?action=admin-action', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': APP.csrf,
          'x-pk9-visitor': getVisitorClientId()
        },
        body: JSON.stringify(payload)
      });
      const data = await resp.json().catch(() => ({}));
      if (resp.status === 403 && data?.warning && !data?.banned) {
        handleAdminWarningResponse(data);
        return false;
      }
      if (resp.status === 403 && data?.banned) {
        handleBannedResponse(data);
        return false;
      }
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

    if (!isClientVerifiedAdmin()) {
      root.innerHTML = '';
      root.classList.remove('active');
      enforceAdminDomHidden();
      return;
    }

    const d = APP.adminDetailData;
    const kpis = d?.kpis || {
      total_users: (APP.lbData.leaderboard || []).length || 0,
      active_today: 0,
      online_now: 0,
      unique_visitors: 0,
      estimated_people: 0,
      visitors_today: 0,
      visitors_7d: 0,
      visitors_30d: 0,
      pageviews_all: 0,
      pageviews_today: 0,
      sessions_today: 0,
      returning_today: 0,
      new_today: 0,
      return_rate: 0,
      total_attempts: 0,
      avg_exam_score: 0,
      total_lessons_done: 0,
      total_notes_saved: 0,
      total_xp_system: 0
    };
    const traffic = d?.traffic || {};
    const obd = traffic.online_by_device || { mobile: 0, tablet: 0, desktop: 0 };
    const devAll = traffic.devices || { mobile: 0, tablet: 0, desktop: 0, pwa: 0 };
    const totalDevKnown = Math.max(1, (devAll.mobile || 0) + (devAll.tablet || 0) + (devAll.desktop || 0));
    const mobileShare = Math.round((((devAll.mobile || 0) + (devAll.tablet || 0)) / totalDevKnown) * 100);

    const catalog = getCatalog();
    const totalCourses = catalog.length;
    const totalVideoLectures = catalog.reduce((s, c) => s + c.chapters.reduce((a, ch) => a + ch.topics.length, 0), 0);
    const totalPdfDocs = (Array.isArray(window.KIMVAN_DOCS) ? window.KIMVAN_DOCS.length : 0) + (Array.isArray(window.PHUC_PDF_REFERENCE_V27) ? window.PHUC_PDF_REFERENCE_V27.length : 0);
    const totalSeedExams = Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS.length : 8;

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <section class="pk9-admin-hero">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.85rem;">
            <div style="min-width:0;flex:1 1 min(100%, 360px);">
              <div style="display:flex;align-items:center;gap:0.42rem;flex-wrap:wrap;margin-bottom:0.5rem;">
                <span class="pk9-live-pill">
                  <span class="pk9-live-dot"></span>
                  <span>ADMIN COMMAND CENTER • TELEMETRY CHÍNH XÁC</span>
                </span>
                <span class="pk9-badge" style="background:rgba(255,255,255,0.16);color:#fff;">
                  🗄️ ${esc(d?.storage_mode || 'Active Sync')}
                </span>
                <span class="pk9-badge" style="background:rgba(245,158,11,0.25);color:#fde047;">
                  📅 Tuần: ${esc(d?.week_key || APP.lbData.week_key || 'Hiện tại')}
                </span>
              </div>
              <h2 style="margin:0 0 0.3rem;font-size:clamp(1.12rem, 2.5vw, 1.55rem);font-weight:900;">
                🛡️ Trung Tâm Điều Hành & Đo Lường Đa Thiết Bị — HỌC CÙNG PHÚC K9
              </h2>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:0.84rem;">
                Quản trị viên <b>${esc(APP.user.display_name)} (@${esc(APP.user.username)})</b> • Tách chuẩn thiết bị thật (Mobile / Tablet / PC / Zalo & Threads WebView) — loại bỏ bot tự động.
              </p>
            </div>
            <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
              <button type="button" class="pk9-btn-hero-main" data-admin-refresh="1" style="padding:0.52rem 0.9rem;font-size:0.8rem;">
                🔄 Làm mới
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-admin-toggle-live="1" style="padding:0.52rem 0.9rem;font-size:0.8rem;">
                ${APP.adminAutoLive ? '🟢 Live 15s' : '⏸ Tạm dừng Live'}
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-admin-export-csv="1" style="padding:0.52rem 0.9rem;font-size:0.8rem;">
                📊 Xuất CSV
              </button>
              <button type="button" class="pk9-btn-hero-sec" data-admin-export-json="1" style="padding:0.52rem 0.9rem;font-size:0.8rem;">
                📥 JSON
              </button>
            </div>
          </div>
        </section>

        ${(APP.weakAdminPassword || d?.weak_admin_password) ? `
          <div class="pk9-card" style="border:1.5px solid #ef4444;background:rgba(239,68,68,0.08);margin-bottom:0.85rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;">
            <div style="font-size:0.86rem;line-height:1.45;">
              <b style="color:#dc2626;">⚠️ CẢNH BÁO BẢO MẬT QUẢN TRỊ:</b> Tài khoản quản trị <code>@phucadmin</code> đang dùng mật khẩu mặc định dễ đoán. Hãy đổi mật khẩu mạnh ngay hoặc đặt biến <code>ADMIN_DEFAULT_PASSWORD</code> trên Vercel!
            </div>
            <button type="button" class="pk9-btn-exam-primary" data-open-auth="security" style="background:#dc2626;flex:0 0 auto;">🔑 Đổi mật khẩu ngay</button>
          </div>
        ` : ''}

        <!-- 8 REAL-TIME ACCURATE MULTI-DEVICE KPI CARDS -->
        <div class="pk9-admin-kpi-grid">
          <div class="pk9-admin-kpi-card emerald">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">🟢 Đang Online Trực Tiếp</div>
            <div class="pk9-admin-kpi-val">${kpis.online_now} <span style="font-size:0.82rem;color:#10b981;">online</span></div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              📱 <b>${obd.mobile}</b> Mobile • 💻 <b>${obd.desktop}</b> PC${obd.tablet ? ` • 📲 <b>${obd.tablet}</b> Tab` : ''}
            </div>
          </div>

          <div class="pk9-admin-kpi-card">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">📱 Thiết Bị Đã Vào Web</div>
            <div class="pk9-admin-kpi-val">${Number(kpis.unique_visitors || 0).toLocaleString('vi-VN')}</div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              ~<b>${kpis.estimated_people ?? kpis.unique_visitors}</b> người thật • Hôm nay: <b style="color:#10b981;">+${kpis.visitors_today}</b> (🆕 ${kpis.new_today ?? 0})
            </div>
          </div>

          <div class="pk9-admin-kpi-card violet">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">📲 Tỷ Trọng Mobile / PC</div>
            <div class="pk9-admin-kpi-val">${mobileShare}% <span style="font-size:0.8rem;color:var(--pk9-primary);">Mobile</span></div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              📱 ${devAll.mobile || 0} ĐT • 💻 ${devAll.desktop || 0} PC${devAll.pwa ? ` • 🏠 ${devAll.pwa} App` : ''}
            </div>
          </div>

          <div class="pk9-admin-kpi-card">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">👁️ Lượt Xem & Phiên Hôm Nay</div>
            <div class="pk9-admin-kpi-val">${Number(kpis.pageviews_all || 0).toLocaleString('vi-VN')}</div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              Hôm nay: <b>+${kpis.pageviews_today}</b> • Phiên: <b>${kpis.sessions_today ?? 0}</b> • Quay lại: <b>${kpis.return_rate ?? 0}%</b>
            </div>
          </div>

          <div class="pk9-admin-kpi-card emerald">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">👥 Học Viên Đăng Ký</div>
            <div class="pk9-admin-kpi-val">${kpis.total_users}</div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              Hoạt động hôm nay: <b style="color:#10b981;">${kpis.active_today} học viên</b>
            </div>
          </div>

          <div class="pk9-admin-kpi-card rose">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">🏛️ Lượt Nộp Đề & Điểm TB</div>
            <div class="pk9-admin-kpi-val">${kpis.total_attempts} <span style="font-size:0.84rem;color:#f59e0b;">(${Number(kpis.avg_exam_score || 0).toFixed(2)}đ)</span></div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              Chấm tự động trên <b>${totalSeedExams} đề gốc Sở/Bộ</b>
            </div>
          </div>

          <div class="pk9-admin-kpi-card">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">🎬 Bài Giảng Hoàn Thành</div>
            <div class="pk9-admin-kpi-val">${kpis.total_lessons_done}</div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              Trên tổng số <b>${totalVideoLectures} bài</b> (${totalCourses} khóa)
            </div>
          </div>

          <div class="pk9-admin-kpi-card violet">
            <div style="font-size:0.72rem;font-weight:800;color:var(--pk9-text-muted);text-transform:uppercase;">⚡ Tổng XP Toàn Hệ Thống</div>
            <div class="pk9-admin-kpi-val">${Number(kpis.total_xp_system || 0).toLocaleString('vi-VN')}</div>
            <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
              Ghi chú: <b>${kpis.total_notes_saved}</b> • UV 7 ngày: <b>${kpis.visitors_7d}</b>
            </div>
          </div>
        </div>

        <!-- ADMIN SUB-NAVIGATION -->
        <div class="pk9-admin-subtabs">
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'overview' ? 'active' : ''}" data-admin-subtab="overview">
            📊 1. Tổng Quan & 14D
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'traffic' ? 'active' : ''}" data-admin-subtab="traffic">
            🌐 2. Thiết Bị & Live (${traffic.online_now ?? kpis.online_now ?? 0})
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'users' ? 'active' : ''}" data-admin-subtab="users">
            👥 3. Học Viên (${(d?.users || []).length})
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'exams' ? 'active' : ''}" data-admin-subtab="exams">
            🏛️ 4. Giám Sát Thi (${(d?.recent_attempts || []).length})
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'content' ? 'active' : ''}" data-admin-subtab="content">
            📖 5. Thư Viện (${totalVideoLectures} Video)
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'system' ? 'active' : ''}" data-admin-subtab="system">
            ⚙️ 6. Hệ Thống & Audit
          </button>
          <button type="button" class="pk9-admin-subtab ${APP.adminSubtab === 'feedback' ? 'active' : ''}" data-admin-subtab="feedback">
            💬 7. Feedback (${(d?.feedbacks || []).filter(f => (f.status || 'new') === 'new').length} mới)
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
    const traffic = d?.traffic || {};
    const grades = d?.distributions?.grades || { '2K9': 0, '2K8': 0, 'DGNL': 0, '2K11': 0, '2K12': 0 };
    const scores = d?.distributions?.scores || { '9_10': 0, '8_9': 0, '7_8': 0, '5_7': 0, 'under_5': 0 };
    const subjects = Array.isArray(d?.distributions?.subjects) ? d.distributions.subjects : [];

    // SUBTAB 1: OVERVIEW CHARTS & ANALYTICS
    if (APP.adminSubtab === 'overview') {
      const maxDayTraffic = Math.max(5, ...series.map(s => (s.visitors || 0) + (s.pageviews || 0)));
      const totalGradeUsers = Math.max(1, Object.values(grades).reduce((a, b) => a + Number(b || 0), 0));

      return `
        <div class="pk9-admin-chart-grid">
          <div class="pk9-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.5rem;">
              <div>
                <h3 style="margin:0;font-size:1rem;font-weight:900;">📈 Lưu Lượng Khách & Thiết Bị 14 Ngày Gần Nhất</h3>
                <div style="font-size:0.76rem;color:var(--pk9-text-muted);margin-top:0.15rem;">
                  <span style="color:#2563eb;font-weight:800;">■ Mobile/Tablet</span> &nbsp;
                  <span style="color:#059669;font-weight:800;">■ PC/Laptop</span> &nbsp;• Trên cùng: Tổng lượt xem (PV)
                </div>
              </div>
              <span class="pk9-badge pk9-badge-verified">Chính xác 14D</span>
            </div>
            <div class="pk9-bar-chart">
              ${series.map(item => {
                const mob = Number(item.mobile_visitors || 0) + Number(item.tablet_visitors || 0);
                const desk = Number(item.desktop_visitors || 0);
                const pv = Number(item.pageviews || 0);
                const vis = Number(item.visitors || 0);
                const metric = Math.max(vis, mob + desk) + Math.round(pv * 0.25);
                const hPct = Math.min(100, Math.max(6, Math.round((metric / maxDayTraffic) * 100)));
                const devSum = Math.max(1, mob + desk);
                const mobPct = mob + desk > 0 ? Math.round((mob / devSum) * 100) : 60;
                const deskPct = 100 - mobPct;
                return `
                  <div class="pk9-bar-col" title="Ngày ${esc(item.date)}: ${vis} thiết bị (Mobile/Tab: ${mob}, PC: ${desk}), ${pv} lượt xem, ${item.attempts || 0} đề thi">
                    <span style="font-size:0.64rem;font-weight:800;color:var(--pk9-primary);">${vis || pv}</span>
                    <div class="pk9-bar-stack" style="height:${hPct}%;">
                      <div class="pk9-bar-seg-mobile" style="height:${mobPct}%;"></div>
                      <div class="pk9-bar-seg-desktop" style="height:${deskPct}%;"></div>
                    </div>
                    <span style="font-size:0.64rem;color:var(--pk9-text-muted);font-weight:700;">${esc(item.label)}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="pk9-card">
            <h3 style="margin:0 0 0.75rem;font-size:1rem;font-weight:900;">🎯 Phân Bổ Học Viên Theo Khối & Phổ Điểm</h3>
            <div style="display:flex;flex-direction:column;gap:0.6rem;">
              ${[
                { label: '🎓 Khối 12 — Luyện Thi 2026 (2K9)', count: grades['2K9'] || 0, color: '#2563eb' },
                { label: '🏆 Tổng Ôn Khóa 2K8 Pro', count: grades['2K8'] || 0, color: '#8b5cf6' },
                { label: '🧠 ĐGNL HCM / HSA / TSA', count: grades['DGNL'] || 0, color: '#ec4899' },
                { label: '📘 Khối 10 — CT Mới (2K11)', count: grades['2K11'] || 0, color: '#0d9488' },
                { label: '🎯 Khối 9 — Ôn Vào 10 (2K12)', count: grades['2K12'] || 0, color: '#f59e0b' }
              ].map(row => {
                const pct = Math.round((row.count / totalGradeUsers) * 100);
                return `
                  <div>
                    <div style="display:flex;justify-content:space-between;font-size:0.78rem;font-weight:800;margin-bottom:0.2rem;">
                      <span>${row.label}</span>
                      <span>${row.count} HV (${pct}%)</span>
                    </div>
                    <div class="pk9-topic-track" style="height:0.46rem;">
                      <div class="pk9-topic-fill" style="width:${row.count ? Math.max(4, pct) : 0}%;background:${row.color};"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>

            <hr style="border:none;border-top:1px dashed var(--pk9-border);margin:0.85rem 0;" />
            <div style="font-weight:800;font-size:0.82rem;margin-bottom:0.45rem;">📊 Phổ Điểm Phòng Luyện Đề Chuẩn Bộ GD&ĐT:</div>
            <div class="pk9-score-buckets-grid" style="text-align:center;">
              ${[
                { k: '9_10', label: '9.0 - 10đ', c: '#10b981' },
                { k: '8_9', label: '8.0 - 8.9đ', c: '#2563eb' },
                { k: '7_8', label: '7.0 - 7.9đ', c: '#0d9488' },
                { k: '5_7', label: '5.0 - 6.9đ', c: '#f59e0b' },
                { k: 'under_5', label: '< 5.0đ', c: '#ef4444' }
              ].map(b => `
                <div style="padding:0.45rem 0.25rem;border-radius:0.7rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
                  <div style="font-size:1rem;font-weight:900;color:${b.c};">${scores[b.k] || 0}</div>
                  <div style="font-size:0.66rem;font-weight:700;color:var(--pk9-text-muted);">${b.label}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pk9-grid-3">
          <div class="pk9-card">
            <h4 style="margin:0 0 0.7rem;font-size:0.96rem;font-weight:900;">🏆 Top 5 Học Viên Dẫn Đầu XP</h4>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              ${users.slice().sort((a, b) => b.xp - a.xp).slice(0, 5).map((u, idx) => `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.5rem 0.7rem;border-radius:0.75rem;background:var(--pk9-surface-2);">
                  <div style="min-width:0;">
                    <div style="font-weight:800;font-size:0.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">#${idx + 1} • ${esc(u.display_name)} (@${esc(u.username)})</div>
                    <div style="font-size:0.71rem;color:var(--pk9-text-muted);">${esc(u.school || 'Học viên K9')} • ${u.lessons_done} bài • ${u.exam_attempts} đề</div>
                  </div>
                  <span class="pk9-badge pk9-badge-subj">⚡ ${u.xp} XP</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.7rem;font-size:0.96rem;font-weight:900;">📚 Thống Kê Luyện Đề Theo Môn</h4>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              ${subjects.length ? subjects.map(s => `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.5rem 0.7rem;border-radius:0.75rem;background:var(--pk9-surface-2);">
                  <div style="min-width:0;">
                    <div style="font-weight:800;font-size:0.83rem;">${esc(s.subject)}</div>
                    <div style="font-size:0.72rem;color:var(--pk9-text-muted);">Điểm TB: <b>${s.avgScore}đ</b> • Cao nhất: <b>${s.bestScore}đ</b></div>
                  </div>
                  <span class="pk9-badge pk9-badge-verified">${s.count} lượt thi</span>
                </div>
              `).join('') : `
                <div style="padding:1rem;text-align:center;color:var(--pk9-text-muted);font-size:0.82rem;">
                  Chưa có lượt nộp đề nào. Khi học viên nộp bài, thống kê từng môn sẽ tự động tổng hợp tại đây.
                </div>
              `}
            </div>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.7rem;font-size:0.96rem;font-weight:900;">⚡ Thao Tác Nhanh Cho Admin</h4>
            <div style="display:flex;flex-direction:column;gap:0.5rem;">
              <button type="button" class="pk9-btn-exam-primary" data-admin-subtab="traffic" style="width:100%;justify-content:center;">
                🌐 Xem Thiết Bị & Người Đang Online (${traffic.online_now || 0})
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-admin-subtab="users" style="width:100%;justify-content:center;">
                👥 Quản lý học viên & Cấp XP / VIP
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-admin-subtab="content" style="width:100%;justify-content:center;">
                📖 Quản lý Thư Viện Công Khai
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-admin-subtab="system" style="width:100%;justify-content:center;">
                📢 Phát thông báo toàn hệ thống
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // SUBTAB 2: REAL-TIME MULTI-DEVICE & TRAFFIC TELEMETRY
    if (APP.adminSubtab === 'traffic') {
      const onlineSessions = Array.isArray(traffic.online_sessions) ? traffic.online_sessions : [];
      const osList = Array.isArray(traffic.os_breakdown) ? traffic.os_breakdown : [];
      const browserList = Array.isArray(traffic.browser_breakdown) ? traffic.browser_breakdown : [];
      const topTabs = Array.isArray(traffic.top_tabs) ? traffic.top_tabs : [];
      const topRefs = Array.isArray(traffic.top_referrers) ? traffic.top_referrers : [];
      const recentDevices = Array.isArray(traffic.recent_devices) ? traffic.recent_devices : [];
      const filteredDevices = recentDevices.filter(dev => {
        if (APP.adminDeviceFilter === 'PWA') return Boolean(dev.pwa);
        if (APP.adminDeviceFilter === 'ALL') return true;
        return dev.device_type === APP.adminDeviceFilter;
      });
      const devToday = traffic.devices_today || { mobile: 0, tablet: 0, desktop: 0 };

      return `
        <div class="pk9-card" style="margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.65rem;margin-bottom:0.85rem;">
            <div>
              <h3 style="margin:0;font-size:1.02rem;font-weight:900;">🟢 Thiết Bị Đang Online Thời Gian Thực (Cửa Sổ 120s)</h3>
              <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin-top:0.15rem;">
                Hôm nay trên thiết bị: 📱 <b>${devToday.mobile || 0}</b> Điện thoại • 💻 <b>${devToday.desktop || 0}</b> PC • 📲 <b>${devToday.tablet || 0}</b> Tablet
              </div>
            </div>
            <button type="button" class="pk9-admin-btn-xs" data-admin-refresh="1">🔄 Quét Live</button>
          </div>
          ${onlineSessions.length ? `
            <div class="pk9-online-grid">
              ${onlineSessions.map(sess => {
                const dm = deviceMetaBadge(sess.device_type);
                const agoSec = Math.max(0, Math.round((Date.now() - Number(sess.ts || Date.now())) / 1000));
                const agoText = agoSec < 8 ? 'Vừa xong' : `${agoSec}s trước`;
                return `
                  <div class="pk9-session-card">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;">
                      <span class="pk9-device-badge ${dm.cls}">${dm.label}</span>
                      <span style="font-size:0.71rem;font-weight:700;color:#10b981;">● ${agoText}</span>
                    </div>
                    <div style="font-size:0.82rem;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                      ${sess.username ? `👤 @${esc(sess.username)}` : `🕵️ Khách #${esc(sess.vid_short || 'anon')}`}
                      ${sess.pwa ? ' <span class="pk9-badge pk9-badge-verified" style="font-size:0.65rem;padding:0.1rem 0.35rem;">PWA</span>' : ''}
                    </div>
                    <div style="font-size:0.74rem;color:var(--pk9-text-muted);">
                      <b>${esc(sess.os || 'OS')}</b> • ${esc(sess.browser || 'Browser')}${sess.screen ? ` • ${esc(sess.screen)}` : ''}
                    </div>
                    <div style="font-size:0.73rem;color:var(--pk9-primary);font-weight:700;">
                      Đang xem: ${esc(TAB_LABELS_VI[sess.active_tab] || sess.active_tab || 'home')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div style="padding:1.25rem;text-align:center;font-size:0.84rem;color:var(--pk9-text-muted);background:var(--pk9-surface-2);border-radius:0.9rem;">
              Chưa ghi nhận thiết bị nào khác online trong 120 giây qua.
            </div>
          `}
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 255px),1fr));gap:0.85rem;margin-bottom:1rem;">
          <div class="pk9-card">
            <h4 style="margin:0 0 0.7rem;font-size:0.95rem;font-weight:900;">📱 Hệ Điều Hành (OS)</h4>
            ${renderAnalyticsBars(osList, 'Chưa có dữ liệu hệ điều hành.', name => name)}
          </div>
          <div class="pk9-card">
            <h4 style="margin:0 0 0.7rem;font-size:0.95rem;font-weight:900;">🌐 Trình Duyệt & In-App (Zalo/Threads)</h4>
            ${renderAnalyticsBars(browserList, 'Chưa có dữ liệu trình duyệt.', name => name, 'background:linear-gradient(90deg,#7c3aed,#ec4899);')}
          </div>
          <div class="pk9-card">
            <h4 style="margin:0 0 0.7rem;font-size:0.95rem;font-weight:900;">🔥 Chuyên Mục Được Xem Nhiều</h4>
            ${renderAnalyticsBars(topTabs, 'Chưa có lượt chuyển mục.', name => TAB_LABELS_VI[name] || name, 'background:linear-gradient(90deg,#10b981,#06b6d4);')}
          </div>
          <div class="pk9-card">
            <h4 style="margin:0 0 0.7rem;font-size:0.95rem;font-weight:900;">🔗 Nguồn Giới Thiệu (Referrers)</h4>
            ${renderAnalyticsBars(topRefs, 'Chưa có dữ liệu nguồn truy cập.', name => name === 'direct' ? 'Truy cập trực tiếp (Direct / QR)' : name, 'background:linear-gradient(90deg,#f59e0b,#ef4444);')}
          </div>
        </div>

        <div class="pk9-card">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.65rem;margin-bottom:0.85rem;">
            <h4 style="margin:0;font-size:0.98rem;font-weight:900;">📋 Nhật Ký Thiết Bị Đã Truy Cập Website (${filteredDevices.length})</h4>
            <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
              ${[
                { k: 'ALL', label: `Tất cả (${recentDevices.length})` },
                { k: 'mobile', label: '📱 Điện thoại' },
                { k: 'desktop', label: '💻 Máy tính' },
                { k: 'tablet', label: '📲 Tablet' },
                { k: 'PWA', label: '🏠 PWA App' }
              ].map(f => `
                <button type="button" class="pk9-exam-chip ${APP.adminDeviceFilter === f.k ? 'active' : ''}" data-admin-device-filter="${f.k}">
                  ${f.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="pk9-admin-table-wrap">
            <table class="pk9-admin-table">
              <thead>
                <tr>
                  <th>Thiết bị / ID</th>
                  <th>Hệ điều hành</th>
                  <th>Trình duyệt / WebView</th>
                  <th>Màn hình</th>
                  <th>Tài khoản</th>
                  <th>Mục cuối</th>
                  <th>Nguồn</th>
                  <th>Lượt vào</th>
                  <th>Lần cuối</th>
                </tr>
              </thead>
              <tbody>
                ${filteredDevices.length ? filteredDevices.map(dev => {
                  const dm = deviceMetaBadge(dev.device_type);
                  return `
                    <tr>
                      <td>
                        <span class="pk9-device-badge ${dm.cls}">${dm.label}</span>
                        <div style="font-size:0.68rem;color:var(--pk9-text-muted);margin-top:0.2rem;">#${esc(dev.vid_short || '')} ${dev.pwa ? '• 🏠 PWA' : ''}</div>
                      </td>
                      <td><b>${esc(dev.os || '—')}</b></td>
                      <td>${esc(dev.browser || '—')}</td>
                      <td><code>${esc(dev.screen || '—')}</code></td>
                      <td>${dev.username ? `<b>@${esc(dev.username)}</b>` : '<span style="color:var(--pk9-text-muted);">Khách vãng lai</span>'}</td>
                      <td>${esc(TAB_LABELS_VI[dev.active_tab] || dev.active_tab || 'home')}</td>
                      <td style="font-size:0.75rem;">${esc(dev.last_ref || 'direct')}</td>
                      <td><b>${Number(dev.visits || 1)}</b> (${Number(dev.pageviews || 1)} PV)</td>
                      <td style="font-size:0.74rem;color:var(--pk9-text-muted);">${dev.last_seen ? new Date(dev.last_seen).toLocaleString('vi-VN') : '—'}</td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="9" style="text-align:center;padding:1.5rem;color:var(--pk9-text-muted);">
                      Chưa có nhật ký thiết bị nào khớp bộ lọc.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
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

      const viewerIsSuper = Boolean(d?.viewer_is_super_admin || isClientVerifiedSuperAdmin());
      const bannedTotal = users.filter(x => x.banned).length;
      const warnedTotal = users.filter(x => !x.banned && Number(x.admin_warnings || 0) > 0).length;
      return `
        ${viewerIsSuper ? `
          <div class="pk9-card" style="margin-bottom:1rem;border:1.5px solid rgba(225,29,72,0.35);background:linear-gradient(135deg,rgba(234,179,8,0.12),rgba(225,29,72,0.08));display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;padding:0.85rem 1rem;">
            <div>
              <div style="font-weight:900;font-size:0.95rem;color:#be123c;">👑 Đang hoạt động với quyền Super Admin độc quyền (@phucadmin)</div>
              <div style="font-size:0.8rem;color:var(--pk9-text-muted);">Bạn có toàn quyền bấm <b>🛡️ Phân quyền</b>, <b>🚫 Ban vĩnh viễn / ✅ Gỡ Ban</b>. Tài khoản thường cố mở Admin sẽ bị <b>⚠️ Cảnh báo 1 lần duy nhất</b>, tái phạm lần sau sẽ tự động <b>🚫 Ban vĩnh viễn</b>!</div>
            </div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
              ${warnedTotal > 0 ? `<span class="pk9-badge" style="background:#f59e0b;color:#fff;">⚠️ Cảnh báo: ${warnedTotal}</span>` : ''}
              <span class="pk9-badge" style="background:#e11d48;color:#fff;">🚫 Đã Ban: ${bannedTotal}</span>
            </div>
          </div>
        ` : ''}
        <div class="pk9-card" style="margin-bottom:1.25rem;">
          <h4 style="margin:0 0 0.75rem;font-size:1rem;font-weight:900;">➕ Tạo Nhanh Tài Khoản ${viewerIsSuper ? 'Học Viên / VIP / Admin' : 'Học Viên / VIP'} Mới</h4>
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
                  ${viewerIsSuper ? '<option value="admin">Admin phụ</option>' : ''}
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
              { k: 'admin', label: '🛡️ Quản trị viên' },
              { k: 'vip', label: '💎 Học viên VIP' },
              { k: 'student', label: '🎓 Học viên chuẩn' },
              { k: 'warned', label: `⚠️ Bị cảnh báo (${warnedTotal})` },
              { k: 'banned', label: `🚫 Đã Ban (${bannedTotal})` }
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
                <th>#</th>
                <th>Học viên / Tài khoản</th>
                <th>Phân quyền & Trạng thái</th>
                <th>Khối</th>
                <th>XP & Chuỗi</th>
                <th>Tiến độ Video</th>
                <th>Luyện đề & Điểm</th>
                <th>Hoạt động cuối</th>
                <th>Thao tác & Phân quyền</th>
              </tr>
            </thead>
            <tbody id="pk9-admin-users-tbody">
              ${buildAdminUsersRowsHtml(users)}
            </tbody>
          </table>
        </div>
      `;
    }

    // SUBTAB 3: EXAM ATTEMPTS & SUBMISSIONS MONITOR + EXAM MANAGER
    if (APP.adminSubtab === 'exams') {
      const q = APP.adminExamSearch.trim().toLowerCase();
      const filteredAttempts = attempts.filter(a => {
        if (!q) return true;
        return `${a.username} ${a.display_name} ${a.title} ${a.subject}`.toLowerCase().includes(q);
      });
      const adminExams = Array.isArray(APP.adminExamsCatalog) && APP.adminExamsCatalog.length
        ? APP.adminExamsCatalog
        : (Array.isArray(window.PK9_SEED_EXAMS) ? window.PK9_SEED_EXAMS.map(x => ({
            id: x.id,
            title: x.title,
            subject: x.subject,
            grade: x.grade || '12',
            duration: x.durationMinutes || x.duration || 50,
            questionCount: (x.questions || []).length,
            published: true,
            isSeed: true
          })) : []);

      return `
        <div class="pk9-grid-3" style="margin-bottom:1.15rem;">
          <div class="pk9-card pk9-span-2">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.5rem;">
              <h4 style="margin:0;font-size:1.02rem;font-weight:900;">➕ Nhập Đề Thi Tương Tác Chuẩn 3 Phần GDPT 2018 (JSON Import)</h4>
              <button type="button" class="pk9-admin-btn-xs" data-fill-sample-exam-json="1" style="background:rgba(37,99,235,0.12);color:var(--pk9-primary);">
                📋 Điền Mẫu Đề 3 Phần Chuẩn
              </button>
            </div>
            <p style="margin:0 0 0.65rem;font-size:0.79rem;color:var(--pk9-text-muted);">
              Dán cấu trúc JSON đề thi (gồm Phần I trắc nghiệm ABCD, Phần II Đúng/Sai 4 ý, Phần III Trả lời ngắn) để xuất bản trực tiếp vào Phòng Thi Ảo.
            </p>
            <form id="pk9-admin-import-exam-form" style="display:flex;flex-direction:column;gap:0.6rem;">
              <textarea id="pk9-admin-exam-json" name="exam_json" class="pk9-input" rows="5" placeholder='{"id":"exam-hoa-12-de-moi","title":"Đề Thi Thử Hóa Học 12 — Đề Số 1","subject":"Hóa học","grade":"12","duration":50,"source":"Thầy Dương Hóa / Sở GD&ĐT","questions":[...]}' style="font-family:monospace;font-size:0.78rem;" required></textarea>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                <label style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:700;cursor:pointer;">
                  <input type="checkbox" name="publish_now" value="1" checked />
                  Xuất bản hiển thị ngay trong Phòng Luyện Đề
                </label>
                <button type="submit" class="pk9-btn-exam-primary">🚀 Nhập & Xuất Bản Đề Thi</button>
              </div>
            </form>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.55rem;font-size:0.98rem;font-weight:900;">📚 Kho Đề Thi Hiện Có (${adminExams.length} đề)</h4>
            <div style="max-height:220px;overflow-y:auto;display:flex;flex-direction:column;gap:0.45rem;">
              ${adminExams.map(ex => `
                <div style="padding:0.5rem 0.65rem;border-radius:0.7rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);display:flex;justify-content:space-between;align-items:center;gap:0.45rem;">
                  <div style="min-width:0;flex:1;">
                    <div style="font-weight:800;font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(ex.title)}</div>
                    <div style="font-size:0.72rem;color:var(--pk9-text-muted);">
                      ${esc(ex.subject)} • ${ex.questionCount || 0} câu • ${ex.published !== false ? '<b style="color:#10b981;">Đang mở</b>' : '<b style="color:#f59e0b;">Đang ẩn</b>'}
                    </div>
                  </div>
                  <div style="display:flex;gap:0.3rem;flex-shrink:0;">
                    <button type="button" class="pk9-admin-btn-xs" data-quick-start-exam="${esc(ex.id)}" title="Mở đề thi">⚡ Thi</button>
                    ${!ex.isSeed ? `
                      <button type="button" class="pk9-admin-btn-xs" data-admin-exam-toggle-pub="${esc(ex.id)}" data-cur-pub="${ex.published !== false ? '1' : '0'}">
                        ${ex.published !== false ? '🙈 Ẩn' : '👁️ Hiện'}
                      </button>
                      <button type="button" class="pk9-admin-btn-xs danger" data-admin-exam-delete="${esc(ex.id)}">🗑️</button>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pk9-card" style="margin-bottom:1.15rem;">
          <h4 style="margin:0 0 0.5rem;font-size:1.02rem;font-weight:900;">🏆 Lập Lịch Kỳ Thi Thử Toàn Hệ Thống (Live Contest Scheduler)</h4>
          <p style="margin:0 0 0.75rem;font-size:0.79rem;color:var(--pk9-text-muted);">
            Tạo đợt thi thử có đồng hồ đếm ngược hiển thị ngoài Phòng Luyện Đề và Bảng Xếp Hạng riêng cho đợt thi đó.
          </p>
          <form id="pk9-admin-contest-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0.65rem;align-items:end;">
            <div>
              <label style="font-size:0.75rem;font-weight:800;">Tên kỳ thi</label>
              <input type="text" name="title" class="pk9-input" maxlength="140" placeholder="VD: Thi Thử Cuối Tuần THPTQG..." required />
            </div>
            <div>
              <label style="font-size:0.75rem;font-weight:800;">Đề thi gắn với đợt</label>
              <select name="examId" class="pk9-input" required>
                ${adminExams.map(ex => `<option value="${esc(ex.id)}">${esc(ex.title)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="font-size:0.75rem;font-weight:800;">Bắt đầu</label>
              <input type="datetime-local" name="startAt" class="pk9-input" required />
            </div>
            <div>
              <label style="font-size:0.75rem;font-weight:800;">Kết thúc</label>
              <input type="datetime-local" name="endAt" class="pk9-input" required />
            </div>
            <div>
              <label style="font-size:0.75rem;font-weight:800;">Thưởng Top 💎</label>
              <input type="number" name="rewardDiamonds" class="pk9-input" min="0" max="50" value="5" />
            </div>
            <button type="submit" class="pk9-btn-exam-primary">🚀 Mở / Cập Nhật Kỳ Thi</button>
          </form>
        </div>

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
            <tbody id="pk9-admin-attempts-tbody">
              ${buildAdminExamAttemptsRowsHtml(attempts)}
            </tbody>
          </table>
        </div>
      `;
    }

    // SUBTAB 4: CONTENT & KHOA CHUI THAM KHAO MANAGER
    if (APP.adminSubtab === 'content') {
      const catalog = getCatalog();
      return `
        <div class="pk9-grid-3" style="margin-bottom:1.15rem;">
          <div class="pk9-card pk9-span-2">
            <h4 style="margin:0 0 0.4rem;font-size:1.02rem;font-weight:900;">📖 Thêm Nguồn Học / Bảng Tổng Hợp Mới Vào "Thư Viện Công Khai"</h4>
            <p style="margin:0 0 0.75rem;font-size:0.8rem;color:var(--pk9-text-muted);">
              Nguồn học được thêm tại đây sẽ xuất hiện ngay lập tức trong tab <b>Thư Viện Công Khai</b> và hỗ trợ mở trực tiếp ngay trong web.
            </p>
            <form id="pk9-admin-add-khoachui-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%, 190px),1fr));gap:0.6rem;">
              <input type="text" name="title" class="pk9-input" placeholder="Tên khóa học / chuyên đề (VD: Khóa Tổng Ôn Toán 12...)" required />
              <input type="text" name="teacher" class="pk9-input" placeholder="Giáo viên (VD: Thầy Đỗ Văn Đức)" required />
              <input type="text" name="subject" class="pk9-input" placeholder="Môn học (Toán, Vật lí, Hóa học...)" required />
              <input type="text" name="tag" class="pk9-input" placeholder="Nhãn (VD: HOT 2026, VIP 9+)" value="VIP 2026" />
              <input type="url" name="url" class="pk9-input" placeholder="Link Google Sheet / Drive / YouTube..." required />
              <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.3rem;">➕ Thêm vào Thư Viện Công Khai</button>
            </form>
          </div>

          <div class="pk9-card">
            <h4 style="margin:0 0 0.5rem;font-size:0.98rem;font-weight:900;">📊 Trạng Thái Bảng Thư Viện Công Khai</h4>
            <div style="font-size:0.8rem;color:var(--pk9-text-muted);line-height:1.6;margin-bottom:0.85rem;">
              <div><b>Sheet ID:</b> <code>${KHOA_CHUI_SHEET_ID.slice(0, 18)}...</code></div>
              <div><b>GID mặc định:</b> <code>${KHOA_CHUI_GID}</code></div>
              <div><b>Chế độ nhúng:</b> Trực tiếp trong web (HTMLView + Widget)</div>
              <div><b>Số nguồn bổ sung:</b> ${APP.customKhoaChui.length} nguồn</div>
            </div>
            <button type="button" class="pk9-btn-exam-primary" data-nav-tab="khoa-chui" style="width:100%;">
              📖 Kiểm tra giao diện Thư Viện Công Khai
            </button>
          </div>
        </div>

        ${APP.customKhoaChui.length ? `
          <div class="pk9-card" style="margin-bottom:1.15rem;">
            <h4 style="margin:0 0 0.65rem;font-size:0.96rem;font-weight:900;">📌 Danh Sách Nguồn Bổ Sung Đang Hiển Thị (${APP.customKhoaChui.length})</h4>
            <div style="display:flex;flex-direction:column;gap:0.45rem;">
              ${APP.customKhoaChui.map(kc => `
                <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.5rem;padding:0.55rem 0.75rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
                  <div style="min-width:0;flex:1 1 min(100%, 220px);">
                    <div style="font-weight:800;font-size:0.84rem;">${esc(kc.title)} <span class="pk9-badge pk9-badge-subj">${esc(kc.subject)}</span></div>
                    <div style="font-size:0.74rem;color:var(--pk9-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(kc.teacher)} • ${esc(kc.url)}</div>
                  </div>
                  <button type="button" class="pk9-admin-btn-xs danger" data-admin-del-khoachui="${esc(kc.id)}">🗑️ Xóa</button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

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

    // SUBTAB 7: USER FEEDBACK INBOX
    if (APP.adminSubtab === 'feedback') {
      const allFb = Array.isArray(d?.feedbacks) ? d.feedbacks : [];
      const curFilter = APP.adminFeedbackFilter || 'ALL';
      const filteredFb = allFb.filter(it => {
        const st = it.status || 'new';
        if (curFilter === 'new') return st === 'new' || st === 'read';
        if (curFilter === 'resolved') return st === 'resolved';
        return true;
      });
      const newCount = allFb.filter(it => (it.status || 'new') === 'new').length;
      return `
        <div class="pk9-card" style="margin-bottom:1.1rem;">
          <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;">
            <div>
              <h4 style="margin:0 0 0.25rem;font-size:1.05rem;font-weight:900;">💬 Hộp Thư Góp Ý &amp; Báo Lỗi Học Viên (${allFb.length} tin • ${newCount} chưa đọc)</h4>
              <p style="margin:0;font-size:0.8rem;color:var(--pk9-text-muted);">
                Kênh liên hệ nhận góp ý trực tiếp: Gmail <b>${ADMIN_CONTACT_EMAIL}</b> • SĐT/Zalo <b>${ADMIN_CONTACT_PHONE}</b>.
              </p>
            </div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
              <button type="button" class="pk9-exam-chip ${curFilter === 'ALL' ? 'active' : ''}" data-admin-fb-filter="ALL">Tất cả (${allFb.length})</button>
              <button type="button" class="pk9-exam-chip ${curFilter === 'new' ? 'active' : ''}" data-admin-fb-filter="new">Chưa xong (${allFb.filter(it => (it.status || 'new') !== 'resolved').length})</button>
              <button type="button" class="pk9-exam-chip ${curFilter === 'resolved' ? 'active' : ''}" data-admin-fb-filter="resolved">Đã xử lý (${allFb.filter(it => it.status === 'resolved').length})</button>
            </div>
          </div>
        </div>

        ${filteredFb.length ? `
          <div style="display:flex;flex-direction:column;gap:0.75rem;">
            ${filteredFb.map(fb => {
              const st = fb.status || 'new';
              const stars = '★'.repeat(Math.max(1, Math.min(5, Number(fb.rating || 5))));
              const isEmail = /@/.test(fb.contact || '');
              return `
                <article class="pk9-card" style="border-left:4px solid ${st === 'resolved' ? '#10b981' : st === 'read' ? '#3b82f6' : '#f59e0b'};">
                  <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:0.55rem;margin-bottom:0.45rem;">
                    <div style="display:flex;flex-wrap:wrap;gap:0.35rem;align-items:center;">
                      <span class="pk9-badge ${st === 'resolved' ? 'pk9-badge-verified' : st === 'read' ? 'pk9-badge-subj' : 'pk9-badge-hot'}">
                        ${st === 'resolved' ? '✓ Đã xử lý' : st === 'read' ? '👀 Đã xem' : '● Mới'}
                      </span>
                      <span class="pk9-badge pk9-badge-subj">${esc(fb.category_label || 'Góp ý')}</span>
                      <span class="pk9-badge pk9-badge-code" style="color:#f59e0b;">${stars}</span>
                      ${fb.email_sent ? '<span class="pk9-badge pk9-badge-verified">📧 Đã forward Gmail</span>' : ''}
                    </div>
                    <span style="font-size:0.75rem;color:var(--pk9-text-muted);">${esc(fb.created_label || fb.created_at || '')} • ${esc(fb.device_hint || 'Web')}</span>
                  </div>
                  <div style="font-size:0.86rem;font-weight:800;margin-bottom:0.25rem;">
                    👤 ${esc(fb.sender_name || 'Ẩn danh')} ${fb.username ? `<code style="font-size:0.75rem;">@${esc(fb.username)}</code>` : '<span style="font-size:0.74rem;color:var(--pk9-text-muted);">(Khách)</span>'}
                    ${fb.contact ? ` • 📞 Liên hệ: <b>${esc(fb.contact)}</b>` : ''}
                  </div>
                  ${fb.page_context ? `<div style="font-size:0.76rem;color:var(--pk9-primary);margin-bottom:0.35rem;">📍 ${esc(fb.page_context)}</div>` : ''}
                  <div style="font-size:0.86rem;line-height:1.55;padding:0.62rem 0.78rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);white-space:pre-line;">${esc(fb.message)}</div>
                  <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.65rem;">
                    ${st !== 'resolved' ? `<button type="button" class="pk9-admin-btn-xs primary" data-admin-fb-status="resolved" data-fb-id="${esc(fb.id)}">✓ Đánh dấu Đã xử lý</button>` : ''}
                    ${st === 'new' ? `<button type="button" class="pk9-admin-btn-xs" data-admin-fb-status="read" data-fb-id="${esc(fb.id)}">👀 Đã xem</button>` : ''}
                    ${isEmail ? `<a href="mailto:${esc(fb.contact)}?subject=${encodeURIComponent('[HỌC CÙNG PHÚC K9] Phản hồi góp ý của bạn')}" class="pk9-admin-btn-xs" style="text-decoration:none;">📧 Trả lời Email</a>` : ''}
                    <button type="button" class="pk9-admin-btn-xs danger" data-admin-fb-delete="${esc(fb.id)}">🗑️ Xóa</button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="pk9-card" style="text-align:center;padding:2rem;color:var(--pk9-text-muted);">
            Chưa có góp ý nào khớp bộ lọc hiện tại.
          </div>
        `}
      `;
    }

    // SUBTAB 5: SYSTEM ANNOUNCEMENT, API HEALTH & AUDIT LOGS
    const logs = Array.isArray(d?.audit_logs) ? d.audit_logs : [];
    const curAnn = APP.systemAnnouncement || {};
    return `
      <div class="pk9-grid-3" style="margin-bottom:1.15rem;">
        <div class="pk9-card pk9-span-2">
          <h4 style="margin:0 0 0.45rem;font-size:1.05rem;font-weight:900;">📢 Phát Thông Báo Toàn Hệ Thống (System Broadcast Banner)</h4>
          <p style="margin:0 0 0.85rem;font-size:0.82rem;color:var(--pk9-text-muted);">
            Thanh thông báo sẽ hiển thị nổi bật trên đỉnh trang cho tất cả học viên đang truy cập website.
          </p>
          <form id="pk9-admin-announce-form" style="display:flex;flex-direction:column;gap:0.65rem;">
            <input type="text" name="text" class="pk9-input" placeholder="Nhập nội dung thông báo (VD: Đã cập nhật Thư Viện Công Khai 2026 &amp; Đề thi thử Sở Hà Nội!)" value="${esc(curAnn.text || '')}" />
            <div style="display:flex;gap:0.65rem;flex-wrap:wrap;align-items:center;">
              <select name="link" class="pk9-input" style="max-width:260px;margin-top:0;">
                <option value="khoa-chui" ${curAnn.link === 'khoa-chui' ? 'selected' : ''}>Nút bấm dẫn tới: Thư Viện Công Khai</option>
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
              <span>Thư Viện Công Khai Embed</span>
              <b style="color:#10b981;">● Connected</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.45rem 0.65rem;background:var(--pk9-surface-2);border-radius:0.6rem;">
              <span>Storage Engine</span>
              <b>${esc(d?.storage_mode || 'Active')}</b>
            </div>
            <div style="display:flex;justify-content:space-between;padding:0.45rem 0.65rem;background:var(--pk9-surface-2);border-radius:0.6rem;">
              <span>Admin Security Guard</span>
              ${(APP.weakAdminPassword || d?.weak_admin_password)
                ? '<b style="color:#dc2626;">● MK mặc định (Cần đổi ngay!)</b>'
                : '<b style="color:#10b981;">● Protected</b>'}
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

  function buildAdminUsersRowsHtml(users) {
    const q = (APP.adminUserSearch || '').trim().toLowerCase();
    const roleFilter = APP.adminUserRoleFilter || 'ALL';
    const filtered = (users || []).filter(u => {
      if (roleFilter === 'banned') {
        if (!u.banned) return false;
      } else if (roleFilter === 'warned') {
        if (u.banned || Number(u.admin_warnings || 0) <= 0) return false;
      } else if (roleFilter !== 'ALL') {
        if (u.banned || (u.role || 'student') !== roleFilter) return false;
      }
      if (!q) return true;
      return `${u.username} ${u.display_name} ${u.school} ${u.grade}`.toLowerCase().includes(q);
    });
    const viewerIsSuper = Boolean(APP.adminDetailData?.viewer_is_super_admin || isClientVerifiedSuperAdmin());
    if (!filtered.length) {
      return `
        <tr>
          <td colspan="9" style="text-align:center;padding:2rem;color:var(--pk9-text-muted);">
            Chưa có học viên nào khớp bộ lọc.
          </td>
        </tr>
      `;
    }
    return filtered.map((u, idx) => {
      const rowIsSuper = Boolean(u.is_super_admin || String(u.username || '').toLowerCase() === 'phucadmin');
      const rowIsBanned = Boolean(u.banned);
      const roleLabel = rowIsBanned
        ? '🚫 ĐÃ BAN'
        : rowIsSuper
          ? '👑 SUPER ADMIN'
          : u.role === 'admin'
            ? '🛡️ ADMIN PHỤ'
            : u.role === 'vip'
              ? '💎 VIP PRO'
              : '🎓 Học viên';
      const roleCls = rowIsBanned ? 'admin' : (u.role || 'student');
      return `
      <tr style="${rowIsBanned ? 'background:rgba(239,68,68,0.08);' : (APP.adminSelectedStudent === u.username ? 'background:rgba(37,99,235,0.08);' : '')}">
        <td><b>${idx + 1}</b></td>
        <td>
          <div style="font-weight:800;">${esc(u.display_name)}</div>
          <div style="font-size:0.74rem;color:var(--pk9-text-muted);">@${esc(u.username)} • ${esc(u.school || 'Chưa cập nhật trường')}</div>
          ${rowIsBanned && u.ban_reason ? `<div style="font-size:0.7rem;color:#dc2626;margin-top:0.15rem;">🚫 ${esc(u.ban_reason)}</div>` : (!rowIsBanned && Number(u.admin_warnings || 0) > 0 ? `<div style="font-size:0.7rem;color:#d97706;margin-top:0.15rem;font-weight:700;">⚠️ Đã bị cảnh báo 1/1 (tái phạm sẽ tự Ban)</div>` : '')}
        </td>
        <td>
          <span class="pk9-admin-role-pill ${esc(roleCls)}" style="${rowIsSuper ? 'background:linear-gradient(135deg,#eab308,#e11d48);color:#fff;' : rowIsBanned ? 'background:#dc2626;color:#fff;' : ''}">
            ${roleLabel}
          </span>
          ${(!rowIsSuper && u.role === 'admin' && u.admin_granted_by) ? `<div style="font-size:0.68rem;color:var(--pk9-text-muted);margin-top:0.18rem;">Cấp bởi @${esc(u.admin_granted_by)}</div>` : ''}
        </td>
        <td><span class="pk9-badge pk9-badge-grade">${esc(u.grade || '2K9')}</span></td>
        <td>
          <div style="font-weight:900;color:var(--pk9-primary);">${u.xp || 100} XP</div>
          <div style="font-size:0.72rem;color:var(--pk9-text-muted);">🔥 ${u.streak || 1} ngày</div>
        </td>
        <td>
          <span style="font-weight:800;">${u.lessons_done || 0} bài</span>
          ${u.notes_count ? `<div style="font-size:0.72rem;color:var(--pk9-text-muted);">📝 ${u.notes_count} ghi chú</div>` : ''}
        </td>
        <td>
          <span style="font-weight:800;">${u.exam_attempts || 0} đề</span>
          ${u.avg_score !== null && u.avg_score !== undefined ? `<div style="font-size:0.74rem;font-weight:800;color:#10b981;">TB: ${Number(u.avg_score).toFixed(2)}đ</div>` : ''}
        </td>
        <td style="font-size:0.76rem;color:var(--pk9-text-muted);">
          ${u.last_active ? new Date(u.last_active).toLocaleString('vi-VN') : 'Mới tạo'}
        </td>
        <td>
          <div style="display:flex;gap:0.3rem;flex-wrap:wrap;align-items:center;">
            <button type="button" class="pk9-btn-exam-ghost" data-admin-inspect-user="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;">🔍 Chi tiết</button>
            <button type="button" class="pk9-btn-exam-ghost" data-admin-grant-xp="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;color:#10b981;">⚡ +200 XP</button>
            ${rowIsSuper ? `
              <span class="pk9-badge" style="background:rgba(234,179,8,0.18);color:#b45309;font-size:0.7rem;">👑 Toàn quyền</span>
              ${viewerIsSuper ? `<button type="button" class="pk9-btn-exam-ghost" data-admin-reset-pw="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;color:#f59e0b;">🔑 Đổi MK</button>` : ''}
            ` : viewerIsSuper ? `
              <button type="button" class="pk9-btn-exam-primary" data-admin-open-role="${esc(u.username)}" data-cur-role="${esc(u.role || 'student')}" data-display-name="${esc(u.display_name || u.username)}" style="padding:0.26rem 0.55rem;font-size:0.72rem;background:linear-gradient(135deg,#2563eb,#7c3aed);">🛡️ Phân quyền</button>
              ${rowIsBanned
                ? `<button type="button" class="pk9-btn-exam-ghost" data-admin-unban-user="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;color:#10b981;border-color:#10b981;">✅ Gỡ Ban</button>`
                : `<button type="button" class="pk9-btn-exam-ghost" data-admin-ban-user="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;color:#dc2626;border-color:rgba(220,38,38,0.45);">🚫 Ban vĩnh viễn</button>`
              }
              ${(!rowIsBanned && Number(u.admin_warnings || 0) > 0) ? `<button type="button" class="pk9-btn-exam-ghost" data-admin-clear-warn="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;color:#d97706;">🧹 Xóa cảnh báo</button>` : ''}
              <button type="button" class="pk9-btn-exam-ghost" data-admin-reset-pw="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;color:#f59e0b;">🔑 Đổi MK</button>
              <button type="button" class="pk9-btn-exam-ghost" data-admin-del-user="${esc(u.username)}" style="padding:0.25rem 0.5rem;font-size:0.72rem;color:#ef4444;">🗑️</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
    }).join('');
  }

  function buildAdminExamAttemptsRowsHtml(attempts) {
    const q = (APP.adminExamSearch || '').trim().toLowerCase();
    const filtered = (attempts || []).filter(a => {
      if (!q) return true;
      return `${a.username} ${a.display_name} ${a.exam_title} ${a.subject}`.toLowerCase().includes(q);
    });
    if (!filtered.length) {
      return `
        <tr>
          <td colspan="7" style="text-align:center;padding:2rem;color:var(--pk9-text-muted);">
            Chưa có lượt nộp bài thi nào được ghi nhận trên hệ thống.
          </td>
        </tr>
      `;
    }
    return filtered.map((a, idx) => {
      const sc = Number(a.score ?? 0);
      const badgeColor = sc >= 8 ? '#10b981' : sc >= 6.5 ? '#2563eb' : sc >= 5 ? '#f59e0b' : '#ef4444';
      const mins = Math.floor(Number(a.duration_sec || 0) / 60);
      const secs = Number(a.duration_sec || 0) % 60;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td style="font-size:0.76rem;color:var(--pk9-text-muted);">${a.submitted_at ? new Date(a.submitted_at).toLocaleString('vi-VN') : 'Vừa xong'}</td>
          <td>
            <div style="font-weight:800;">${esc(a.display_name || a.username)}</div>
            <div style="font-size:0.72rem;color:var(--pk9-text-muted);">@${esc(a.username)}</div>
          </td>
          <td style="font-weight:700;">${esc(a.exam_title || a.exam_id)}</td>
          <td><span class="pk9-badge pk9-badge-subj">${esc(a.subject || 'Tổng hợp')}</span></td>
          <td>
            <span style="padding:0.22rem 0.55rem;border-radius:999px;font-weight:900;font-size:0.82rem;background:${badgeColor}1f;color:${badgeColor};">
              ${sc.toFixed(2)} đ
            </span>
          </td>
          <td style="font-size:0.8rem;font-weight:700;">${mins}p ${secs}s</td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // AUTH MODAL (LOGIN / REGISTER / PROFILE / FORGOT PASSWORD)
  // ==========================================================================
  function isSafeAvatarUrl(src) {
    return /^(https?:\/\/|data:image\/(?:jpeg|png|webp);base64,)/i.test(String(src || ''));
  }

  function renderAvatarInner(avatarSrc, initialChar) {
    if (isSafeAvatarUrl(avatarSrc)) {
      return `<img src="${esc(avatarSrc)}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:999px;display:block;" />`;
    }
    return `<span>${esc(initialChar)}</span>`;
  }

  function renderGradeOptionsHtml(selectedGrade = '2K9') {
    const gradeOptions = [
      ['2K9', 'Khối 12 — Luyện thi THPT Quốc Gia (2K9)'],
      ['2K8', 'Ôn thi / Tổng ôn 2K8 Pro'],
      ['DGNL', 'Luyện thi ĐGNL / ĐGTD'],
      ['2K11', 'Khối 10 — Chương trình mới (2K11)'],
      ['2K12', 'Khối 9 — Ôn thi vào lớp 10 (2K12)']
    ];
    return gradeOptions
      .map(([val, label]) => `<option value="${val}" ${selectedGrade === val ? 'selected' : ''}>${label}</option>`)
      .join('');
  }

  function resizeAvatarToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !String(file.type || '').startsWith('image/')) {
        reject(new Error('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP).'));
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        reject(new Error('Ảnh quá lớn (tối đa 8MB).'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Tệp ảnh không hợp lệ.'));
        img.onload = () => {
          const size = 160;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          const minSide = Math.min(img.width || size, img.height || size);
          const sx = Math.max(0, Math.floor(((img.width || size) - minSide) / 2));
          const sy = Math.max(0, Math.floor(((img.height || size) - minSide) / 2));
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          let out = canvas.toDataURL('image/jpeg', 0.84);
          if (out.length > 240000) out = canvas.toDataURL('image/jpeg', 0.65);
          if (out.length > 255000) {
            reject(new Error('Ảnh sau nén vẫn vượt quá giới hạn lưu trữ.'));
            return;
          }
          resolve(out);
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function openAuthModal(defaultMode = 'register') {
    const modal = document.getElementById('pk9-auth-modal');
    if (!modal) return;
    APP.pendingAvatarData = undefined;
    if (!modal.dataset.pk9AvatarBound) {
      modal.dataset.pk9AvatarBound = '1';
      modal.addEventListener('change', async (ev) => {
        const input = ev.target && ev.target.id === 'pk9-avatar-file-input' ? ev.target : null;
        if (!input || !input.files || !input.files[0]) return;
        try {
          const dataUrl = await resizeAvatarToDataUrl(input.files[0]);
          APP.pendingAvatarData = dataUrl;
          const preview = document.getElementById('pk9-settings-avatar-preview');
          if (preview) {
            const ch = (APP.user?.display_name || APP.user?.username || 'U').trim().charAt(0).toUpperCase() || 'U';
            preview.innerHTML = renderAvatarInner(dataUrl, ch);
          }
          toast('Đã chọn ảnh đại diện mới — bấm "Lưu cài đặt tài khoản" để áp dụng.', 'info');
        } catch (err) {
          toast(err?.message || 'Không thể xử lý ảnh này.', 'error');
        }
      });
    }
    modal.classList.add('open');
    const resolvedMode = (APP.user && defaultMode !== 'switch-login' && defaultMode !== 'switch-register' && defaultMode !== 'forgot')
      ? (defaultMode === 'security' ? 'security' : 'profile')
      : defaultMode;
    renderAuthModalContent(resolvedMode);
  }

  function closeAuthModal() {
    const modal = document.getElementById('pk9-auth-modal');
    if (modal) modal.classList.remove('open');
  }

  function renderAuthModalContent(mode = 'register') {
    const box = document.getElementById('pk9-auth-modal-box');
    if (!box) return;

    if (mode === 'forgot') {
      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.9rem;">
          <h3 style="margin:0;font-size:1.18rem;font-weight:900;">🔑 Khôi Phục Mật Khẩu Tự Động</h3>
          <button type="button" class="pk9-icon-btn" data-close-auth="1">✕</button>
        </div>
        <p style="margin:0 0 0.9rem;font-size:0.84rem;color:var(--pk9-text-muted);line-height:1.5;">
          Nhập tên đăng nhập và <b>Mã PIN khôi phục</b> hoặc <b>Gmail khôi phục</b> bạn đã đăng ký để đặt lại mật khẩu mới ngay lập tức.
        </p>
        <form id="pk9-forgot-form" style="display:flex;flex-direction:column;gap:0.75rem;">
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Tên đăng nhập cần khôi phục</label>
            <input type="text" name="username" class="pk9-input" placeholder="VD: minhanh2k9" required />
          </div>
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Mã PIN khôi phục hoặc Gmail đã đăng ký</label>
            <input type="text" name="recovery_input" class="pk9-input" placeholder="Nhập Mã PIN (4–12 ký tự) hoặc Gmail của bạn" required />
          </div>
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Mật khẩu mới (tối thiểu 6 ký tự)</label>
            <input type="password" name="new_password" class="pk9-input" minlength="6" maxlength="128" placeholder="••••••••" required />
          </div>
          <div>
            <label style="font-size:0.82rem;font-weight:700;">Xác nhận mật khẩu mới</label>
            <input type="password" name="confirm_password" class="pk9-input" minlength="6" maxlength="128" placeholder="Nhập lại mật khẩu mới" required />
          </div>
          <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.35rem;padding:0.8rem;">
            🔓 Đặt lại mật khẩu &amp; Đăng nhập ngay
          </button>
        </form>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.9rem;padding-top:0.75rem;border-top:1px solid var(--pk9-border);font-size:0.8rem;">
          <button type="button" class="pk9-btn-exam-ghost" data-switch-auth-mode="login" style="font-size:0.8rem;">← Quay lại Đăng nhập</button>
          <span style="color:var(--pk9-text-muted);font-size:0.75rem;">Chưa cài PIN? Nhắn Admin để cấp lại MK</span>
        </div>
      `;
      return;
    }

    if (APP.user && mode !== 'switch-login' && mode !== 'switch-register') {
      const isSecurity = mode === 'security';
      const initialChar = (APP.user.display_name || APP.user.username || 'U').trim().charAt(0).toUpperCase() || 'U';
      const activeAvatar = APP.pendingAvatarData !== undefined
        ? APP.pendingAvatarData
        : (APP.user.avatar_data || APP.user.avatar_url || '');
      const userBio = String(APP.user.settings?.bio || '').trim();
      const userGrade = APP.user.settings?.preferred_grade || '2K9';
      const recEmail = String(APP.user.settings?.recovery_email || '').trim();
      const hasPin = Boolean(APP.user.has_recovery || APP.user.settings?.has_recovery_pin);

      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.9rem;">
          <h3 style="margin:0;font-size:1.18rem;font-weight:900;">⚙️ Cài Đặt Tài Khoản</h3>
          <button type="button" class="pk9-icon-btn" data-close-auth="1">✕</button>
        </div>

        <div style="display:flex;align-items:center;gap:0.85rem;padding:0.9rem 1rem;border-radius:1rem;background:var(--pk9-surface-2);margin-bottom:0.9rem;">
          <div id="pk9-settings-avatar-preview" style="width:54px;height:54px;flex-shrink:0;border-radius:999px;background:linear-gradient(135deg,#2563eb,#0d9488);color:#fff;font-weight:900;font-size:1.25rem;display:flex;align-items:center;justify-content:center;overflow:hidden;border:2px solid rgba(255,255,255,0.6);">
            ${renderAvatarInner(activeAvatar, initialChar)}
          </div>
          <div style="min-width:0;flex:1;">
            <div style="font-weight:900;font-size:1.02rem;display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
              <span>${esc(APP.user.display_name || APP.user.username)}</span>
              <span style="font-size:0.74rem;font-weight:700;color:var(--pk9-text-muted);">@${esc(APP.user.username)}</span>
              ${APP.isAdmin ? '<span style="font-size:0.7rem;padding:0.12rem 0.45rem;border-radius:999px;background:rgba(225,29,72,0.12);color:#e11d48;font-weight:800;">🛡️ Quản trị viên</span>' : ''}
            </div>
            ${userBio ? `<div style="font-size:0.8rem;color:var(--pk9-text-muted);margin-top:0.15rem;word-break:break-word;">${esc(userBio)}</div>` : ''}
            <div style="font-size:0.8rem;color:var(--pk9-text-muted);margin-top:0.2rem;">
              ${APP.isAdmin
                ? '🛡️ Tài khoản Quản trị viên (Không tính vào BXH top học viên)'
                : `⚡ Tổng XP: <b>${APP.user.xp || 100} XP</b> • 🔥 XP Tuần: <b>${APP.user.weekly_xp || 100} XP</b> • Chuỗi: <b>${APP.user.streak || 1} ngày</b>`}
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;background:var(--pk9-surface-2);padding:0.3rem;border-radius:0.8rem;margin-bottom:0.95rem;">
          <button type="button" class="pk9-grade-btn ${!isSecurity ? 'active' : ''}" data-switch-auth-mode="profile">👤 Thông tin &amp; Hồ sơ</button>
          <button type="button" class="pk9-grade-btn ${isSecurity ? 'active' : ''}" data-switch-auth-mode="security">🔒 Đổi mật khẩu</button>
        </div>

        ${isSecurity ? `
          <form id="pk9-password-form" style="display:flex;flex-direction:column;gap:0.75rem;">
            <div>
              <label style="font-size:0.82rem;font-weight:700;">Mật khẩu hiện tại</label>
              <input type="password" name="current_password" class="pk9-input" autocomplete="current-password" placeholder="Nhập mật khẩu đang dùng" required />
            </div>
            <div>
              <label style="font-size:0.82rem;font-weight:700;">Mật khẩu mới (tối thiểu 6 ký tự)</label>
              <input type="password" name="new_password" class="pk9-input" minlength="6" maxlength="128" autocomplete="new-password" placeholder="••••••••" required />
            </div>
            <div>
              <label style="font-size:0.82rem;font-weight:700;">Xác nhận mật khẩu mới</label>
              <input type="password" name="confirm_password" class="pk9-input" minlength="6" maxlength="128" autocomplete="new-password" placeholder="Nhập lại mật khẩu mới" required />
            </div>
            <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.25rem;">🔑 Cập nhật mật khẩu</button>
          </form>
        ` : `
          <form id="pk9-profile-form" style="display:flex;flex-direction:column;gap:0.72rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <label for="pk9-avatar-file-input" class="pk9-btn-exam-ghost" style="cursor:pointer;">📷 Chọn ảnh đại diện</label>
              <input type="file" id="pk9-avatar-file-input" accept="image/png,image/jpeg,image/webp,image/*" style="display:none;" />
              <button type="button" class="pk9-btn-exam-ghost" data-clear-avatar="1" style="color:#ef4444;">🗑️ Gỡ ảnh</button>
            </div>
            <div>
              <label style="font-size:0.82rem;font-weight:700;">Họ và tên hiển thị trên BXH</label>
              <input type="text" name="display_name" class="pk9-input" maxlength="50" value="${esc(APP.user.display_name || '')}" required />
            </div>
            <div>
              <label style="font-size:0.82rem;font-weight:700;">Trường THPT / THCS</label>
              <input type="text" name="school" class="pk9-input" maxlength="80" value="${esc(APP.user.settings?.school || '')}" placeholder="VD: THPT Chuyên Hà Nội - Amsterdam" />
            </div>
            <div>
              <label style="font-size:0.82rem;font-weight:700;">Giới thiệu ngắn / Mục tiêu điểm số</label>
              <input type="text" name="bio" class="pk9-input" maxlength="120" value="${esc(APP.user.settings?.bio || '')}" placeholder="VD: Mục tiêu 27+ khối A00 năm 2027" />
            </div>
            <div>
              <label style="font-size:0.82rem;font-weight:700;">Khối lớp ưu tiên</label>
              <select name="preferred_grade" class="pk9-input">
                ${renderGradeOptionsHtml(userGrade)}
              </select>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;padding:0.65rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px dashed var(--pk9-border);">
              <div>
                <label style="font-size:0.76rem;font-weight:800;">📧 Gmail khôi phục MK</label>
                <input type="email" name="recovery_email" class="pk9-input" value="${esc(recEmail)}" placeholder="VD: ban@gmail.com" style="font-size:0.8rem;padding:0.45rem 0.6rem;" />
              </div>
              <div>
                <label style="font-size:0.76rem;font-weight:800;">🔐 Mã PIN khôi phục ${hasPin ? '(Đã cài)' : '(4–12 số)'}</label>
                <input type="password" name="recovery_pin" class="pk9-input" minlength="4" maxlength="32" placeholder="${hasPin ? 'Nhập để đổi PIN mới' : 'VD: 200927'}" style="font-size:0.8rem;padding:0.45rem 0.6rem;" />
              </div>
            </div>
            <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.25rem;">💾 Lưu cài đặt tài khoản</button>
          </form>
        `}

        <div style="display:flex;gap:0.55rem;margin-top:0.85rem;padding-top:0.8rem;border-top:1px solid var(--pk9-border);flex-wrap:wrap;">
          ${APP.isAdmin ? `
            <button type="button" class="pk9-btn-exam-primary" data-nav-tab="admin" data-close-auth="1" style="background:linear-gradient(135deg,#e11d48,#d97706);">
              🛡️ Mở Admin Dashboard
            </button>
          ` : ''}
          <button type="button" class="pk9-btn-exam-ghost" data-switch-auth-mode="switch-login">🔄 Đổi tài khoản</button>
          <button type="button" class="pk9-btn-exam-ghost" data-logout-btn="1" style="color:#ef4444;margin-left:auto;">🚪 Đăng xuất</button>
        </div>
      `;
      return;
    }

    const isReg = mode === 'register' || mode === 'switch-register';
    const regModeAttr = APP.user ? 'switch-register' : 'register';
    const loginModeAttr = APP.user ? 'switch-login' : 'login';
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <h3 style="margin:0;font-size:1.22rem;font-weight:900;">
          ${isReg ? '🚀 Đăng Ký Tài Khoản Học Viên (+100 XP)' : '🔐 Đăng Nhập Hệ Sinh Thái Phúc K9'}
        </h3>
        <button type="button" class="pk9-icon-btn" data-close-auth="1">✕</button>
      </div>

      ${APP.user ? `
        <button type="button" class="pk9-btn-exam-ghost" data-switch-auth-mode="profile" style="width:100%;justify-content:center;margin-bottom:0.75rem;">
          ← Quay lại Cài đặt tài khoản (${esc(APP.user.display_name || APP.user.username)})
        </button>
      ` : ''}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.4rem;background:var(--pk9-surface-2);padding:0.3rem;border-radius:0.8rem;margin-bottom:1rem;">
        <button type="button" class="pk9-grade-btn ${isReg ? 'active' : ''}" data-switch-auth-mode="${regModeAttr}">✨ Đăng ký mới</button>
        <button type="button" class="pk9-grade-btn ${!isReg ? 'active' : ''}" data-switch-auth-mode="${loginModeAttr}">🔑 Đăng nhập</button>
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
              ${renderGradeOptionsHtml('2K9')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;padding:0.6rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px dashed var(--pk9-border);">
            <div>
              <label style="font-size:0.75rem;font-weight:800;">📧 Gmail khôi phục (Tùy chọn)</label>
              <input type="email" name="recovery_email" class="pk9-input" placeholder="VD: ban@gmail.com" style="font-size:0.8rem;padding:0.45rem 0.6rem;" />
            </div>
            <div>
              <label style="font-size:0.75rem;font-weight:800;">🔐 Mã PIN khôi phục (4–12 ký tự)</label>
              <input type="password" name="recovery_pin" class="pk9-input" minlength="4" maxlength="32" placeholder="VD: 200927" style="font-size:0.8rem;padding:0.45rem 0.6rem;" />
            </div>
          </div>
        ` : ''}
        <div>
          <label style="font-size:0.82rem;font-weight:700;">Mật khẩu (tối thiểu 6 ký tự)</label>
          <input type="password" name="password" class="pk9-input" placeholder="••••••••" required />
        </div>
        ${!isReg ? `
          <div style="display:flex;justify-content:flex-end;margin-top:-0.25rem;">
            <button type="button" class="pk9-btn-exam-ghost" data-switch-auth-mode="forgot" style="padding:0.25rem 0.55rem;font-size:0.78rem;color:var(--pk9-primary);border:none;">
              🔑 Quên mật khẩu? Khôi phục bằng PIN / Gmail
            </button>
          </div>
        ` : ''}
        <button type="submit" class="pk9-btn-exam-primary" style="margin-top:0.35rem;padding:0.8rem;">
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
    const results = [
      {
        kind: '📖 Thư Viện Công Khai',
        title: 'Mở Thư Viện Video & Tài Liệu Công Khai Trực Tiếp (Sheet GID 662446747)',
        sub: 'Truy cập thẳng trong web chính • Ghi rõ tên Thầy/Cô & nguồn gốc',
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
        sub: 'Traffic 14 ngày • Học viên • Lịch sử làm đề • Quản lý Thư Viện & Thông báo',
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
      const openMobHub = e.target.closest('[data-open-mob-hub]');
      if (openMobHub) {
        const sheet = document.getElementById('pk9-mob-hub-sheet');
        if (sheet) {
          const isOpen = sheet.classList.toggle('open');
          document.getElementById('pk9-mob-hub-btn')?.classList.toggle('active', isOpen);
          const walletEl = document.getElementById('pk9-mob-hub-wallet');
          if (walletEl) {
            const rpg = window.PK9_RPG_STATE || APP.user?.rpg || {};
            const gold = rpg.gold ?? 160;
            const dia = rpg.diamonds ?? 5;
            const streak = APP.user?.streak ?? rpg.streak ?? 1;
            const lv = rpg.level ?? 1;
            walletEl.innerHTML = `🪙 <b>${gold}</b> Vàng • 💎 <b>${dia}</b> KC • 🔥 Chuỗi <b>${streak}</b> ngày • ⚡ Cấp <b>${lv}</b>`;
          }
        }
        return;
      }

      const closeMobHub = e.target.closest('[data-close-mob-hub]');
      if (closeMobHub) {
        document.getElementById('pk9-mob-hub-sheet')?.classList.remove('open');
        document.getElementById('pk9-mob-hub-btn')?.classList.remove('active');
        if (!closeMobHub.hasAttribute('data-open-feedback') && !closeMobHub.hasAttribute('data-open-auth') && !closeMobHub.hasAttribute('data-nav-tab')) {
          return;
        }
      }

      if (e.target.id === 'pk9-feedback-modal' || e.target.closest('[data-close-feedback]')) {
        closeFeedbackModal();
        return;
      }

      const openFbBtn = e.target.closest('[data-open-feedback]');
      if (openFbBtn) {
        const catAttr = openFbBtn.getAttribute('data-open-feedback');
        const ctxAttr = openFbBtn.getAttribute('data-feedback-ctx');
        openFeedbackModal({
          category: ['bug', 'exam', 'feature', 'other'].includes(catAttr) ? catAttr : undefined,
          context: ctxAttr || undefined
        });
        return;
      }

      const fbStarBtn = e.target.closest('[data-fb-star]');
      if (fbStarBtn) {
        APP.feedbackRating = Math.min(5, Math.max(1, Number(fbStarBtn.getAttribute('data-fb-star') || 5)));
        const nameVal = document.getElementById('pk9-fb-name')?.value;
        const contactVal = document.getElementById('pk9-fb-contact')?.value;
        const msgVal = document.getElementById('pk9-fb-msg')?.value;
        renderFeedbackModalBody();
        if (nameVal !== undefined && document.getElementById('pk9-fb-name')) document.getElementById('pk9-fb-name').value = nameVal;
        if (contactVal !== undefined && document.getElementById('pk9-fb-contact')) document.getElementById('pk9-fb-contact').value = contactVal;
        if (msgVal !== undefined && document.getElementById('pk9-fb-msg')) document.getElementById('pk9-fb-msg').value = msgVal;
        return;
      }

      const fbCatBtn = e.target.closest('[data-fb-cat]');
      if (fbCatBtn) {
        APP.feedbackCategory = fbCatBtn.getAttribute('data-fb-cat') || 'bug';
        const nameVal = document.getElementById('pk9-fb-name')?.value;
        const contactVal = document.getElementById('pk9-fb-contact')?.value;
        const msgVal = document.getElementById('pk9-fb-msg')?.value;
        renderFeedbackModalBody();
        if (nameVal !== undefined && document.getElementById('pk9-fb-name')) document.getElementById('pk9-fb-name').value = nameVal;
        if (contactVal !== undefined && document.getElementById('pk9-fb-contact')) document.getElementById('pk9-fb-contact').value = contactVal;
        if (msgVal !== undefined && document.getElementById('pk9-fb-msg')) document.getElementById('pk9-fb-msg').value = msgVal;
        return;
      }

      if (e.target.closest('[data-fb-clear-ctx]')) {
        APP.feedbackContext = '';
        const nameVal = document.getElementById('pk9-fb-name')?.value;
        const contactVal = document.getElementById('pk9-fb-contact')?.value;
        const msgVal = document.getElementById('pk9-fb-msg')?.value;
        renderFeedbackModalBody();
        if (nameVal !== undefined && document.getElementById('pk9-fb-name')) document.getElementById('pk9-fb-name').value = nameVal;
        if (contactVal !== undefined && document.getElementById('pk9-fb-contact')) document.getElementById('pk9-fb-contact').value = contactVal;
        if (msgVal !== undefined && document.getElementById('pk9-fb-msg')) document.getElementById('pk9-fb-msg').value = msgVal;
        return;
      }

      if (e.target.closest('[data-fb-reset]')) {
        APP.feedbackSubmitted = null;
        renderFeedbackModalBody();
        return;
      }

      const copyBtn = e.target.closest('[data-copy-contact]');
      if (copyBtn) {
        const val = copyBtn.getAttribute('data-copy-contact') || '';
        try {
          await navigator.clipboard.writeText(val);
          toast(`📋 Đã sao chép: ${val}`, 'success');
        } catch {
          toast(`Thông tin liên hệ: ${val}`, 'info');
        }
        return;
      }

      if (e.target.id === 'pk9-onboarding-modal') {
        closeOnboardingModal();
        return;
      }

      const closeOnbBtn = e.target.closest('[data-close-onboarding]');
      if (closeOnbBtn) {
        closeOnboardingModal();
        if (!closeOnbBtn.hasAttribute('data-nav-tab') && !closeOnbBtn.hasAttribute('data-open-auth')) return;
      }

      const openOnbBtn = e.target.closest('[data-open-onboarding]');
      if (openOnbBtn) {
        openOnboardingModal(openOnbBtn.getAttribute('data-open-onboarding') || 'auto');
        return;
      }

      const switchOnbBtn = e.target.closest('[data-switch-onboard-mode]');
      if (switchOnbBtn) {
        openOnboardingModal(switchOnbBtn.getAttribute('data-switch-onboard-mode') || 'auto');
        return;
      }

      const toggleRpgGroup = e.target.closest('[data-toggle-rpg-group]');
      if (toggleRpgGroup) {
        const grp = document.getElementById('pk9-rpg-nav-group');
        if (grp) {
          const isCollapsed = grp.classList.toggle('collapsed');
          toggleRpgGroup.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
          const arr = toggleRpgGroup.querySelector('.pk9-nav-group-arrow');
          if (arr) arr.textContent = isCollapsed ? '▸' : '▾';
        }
        return;
      }

      const startBrandVidBtn = e.target.closest('[data-start-branded-video]');
      if (startBrandVidBtn) {
        startBrandedLectureVideo();
        return;
      }

      const goalGradeBtn = e.target.closest('[data-set-goal-grade]');
      if (goalGradeBtn) {
        const g = goalGradeBtn.getAttribute('data-set-goal-grade') || '2K9';
        const cur = getUserGoalPref();
        try {
          localStorage.setItem('pk9_user_goal', JSON.stringify({ grade: g, target: cur.target || '8+' }));
        } catch {}
        if (['2K9', 'DGNL', '2K11', '2K12'].includes(g)) {
          APP.gradeFilter = g;
        }
        const prevY = window.scrollY;
        renderHomeTab();
        window.scrollTo(0, prevY);
        return;
      }

      const goalTargetBtn = e.target.closest('[data-set-goal-target]');
      if (goalTargetBtn) {
        const t = goalTargetBtn.getAttribute('data-set-goal-target') || '8+';
        const cur = getUserGoalPref();
        try {
          localStorage.setItem('pk9_user_goal', JSON.stringify({ grade: cur.grade || '2K9', target: t }));
        } catch {}
        const prevY = window.scrollY;
        renderHomeTab();
        window.scrollTo(0, prevY);
        return;
      }

      const dailyBtn = e.target.closest('[data-daily-pick]');
      if (dailyBtn && !dailyBtn.disabled) {
        const idx = Number(dailyBtn.getAttribute('data-daily-pick'));
        const boss = getTodayDailyBoss();
        try {
          localStorage.setItem(`pk9_daily_boss_${boss.key}`, JSON.stringify({ id: boss.question.id, picked: idx }));
        } catch {}
        const prevY = window.scrollY;
        renderHomeTab();
        window.scrollTo(0, prevY);
        if (idx === boss.question.correct) {
          toast('🎉 Chính xác! Rất vững kiến thức rồi đấy!', 'success');
        } else {
          toast('⚠️ Dính bẫy nhẹ rồi — đọc phần giải thích ngay bên dưới nhé!', 'info');
        }
        return;
      }

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
        APP.teacherPickerSearch = '';
        APP._suspendedLectureVideo = null;
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
        APP.teacherPickerSearch = '';
        APP._suspendedLectureVideo = null;
        renderLecturesTab();
        return;
      }

      const togglePdfDrawer = e.target.closest('[data-toggle-teacher-pdfs]');
      if (togglePdfDrawer) {
        APP.showTeacherPdfDrawer = !APP.showTeacherPdfDrawer;
        const drawerSec = document.getElementById('pk9-teacher-pdf-drawer-sec');
        const mainToggleBtn = document.getElementById('pk9-teacher-pdf-toggle-btn');
        if (drawerSec && document.getElementById('pk9-video-stage')) {
          drawerSec.style.display = APP.showTeacherPdfDrawer ? 'block' : 'none';
          const total = mainToggleBtn?.getAttribute('data-pdf-total') || '';
          if (mainToggleBtn) {
            mainToggleBtn.innerHTML = APP.showTeacherPdfDrawer
              ? '🔽 Thu gọn Kho PDF'
              : `📄 Mở Kho Tất Cả PDF (${total} file)`;
          }
          document.querySelectorAll('[data-toggle-teacher-pdfs]').forEach(btn => {
            if (btn !== mainToggleBtn) btn.classList.toggle('active', APP.showTeacherPdfDrawer);
          });
          if (APP.showTeacherPdfDrawer) {
            drawerSec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          renderLecturesTab();
        }
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
        APP._suspendedLectureVideo = null;
        renderLecturesTab();
        return;
      }

      const toggleCh = e.target.closest('[data-toggle-chapter]');
      if (toggleCh) {
        const chKey = toggleCh.getAttribute('data-toggle-chapter');
        if (chKey) {
          const cur = APP.openChaptersMap[chKey];
          const c = getCourseById(APP.activeCourseId);
          const found = findTopicInCourse(c, APP.activeTopicId);
          if (cur === undefined) {
            const actCh = found?.chapter;
            const defaultOpen = (actCh && `${c.id}::${actCh.id}` === chKey) || ((c?.chapters || []).length <= 2);
            APP.openChaptersMap[chKey] = !defaultOpen;
          } else {
            APP.openChaptersMap[chKey] = !cur;
          }
          const chListEl = document.getElementById('pk9-lecture-chapters-list');
          if (chListEl && c) {
            chListEl.innerHTML = buildCourseChaptersListHtml(c, found?.chapter, found?.topic);
          } else {
            renderLecturesTab();
          }
        }
        return;
      }

      const selTopic = e.target.closest('[data-select-topic]');
      if (selTopic) {
        APP.activeTopicId = selTopic.getAttribute('data-select-topic');
        APP.inlinePdfUrl = '';
        APP._suspendedLectureVideo = null;
        renderLecturesTab();
        if (window.innerWidth <= 1024) {
          setTimeout(() => {
            document.getElementById('pk9-video-stage')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 60);
        }
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
        const attachWrap = document.getElementById('pk9-topic-pdf-attachments-wrap');
        const activeCourse = getCourseById(APP.activeCourseId);
        const found = findTopicInCourse(activeCourse, APP.activeTopicId);
        if (attachWrap && activeCourse && found?.topic && document.getElementById('pk9-video-stage')) {
          attachWrap.innerHTML = renderTopicPdfAttachments(found.topic);
        } else {
          renderLecturesTab();
        }
        return;
      }

      if (e.target.closest('[data-close-inline-pdf]')) {
        APP.inlinePdfUrl = '';
        APP.inlinePdfTitle = '';
        const attachWrap = document.getElementById('pk9-topic-pdf-attachments-wrap');
        const activeCourse = getCourseById(APP.activeCourseId);
        const found = findTopicInCourse(activeCourse, APP.activeTopicId);
        if (attachWrap && activeCourse && found?.topic) {
          attachWrap.innerHTML = renderTopicPdfAttachments(found.topic);
        } else {
          renderLecturesTab();
        }
        return;
      }

      if (e.target.closest('[data-reload-inline-pdf]')) {
        const pdfIfr = document.getElementById('pk9-inline-pdf-iframe');
        if (pdfIfr && pdfIfr.src) {
          const s = pdfIfr.src;
          pdfIfr.src = s;
          toast('🔄 Đã tải lại file PDF!', 'info');
        }
        return;
      }

      if (e.target.closest('[data-reload-lecture-iframe]')) {
        if (document.getElementById('pk9-brand-player-poster')) {
          startBrandedLectureVideo();
          toast('🎬 Đã khởi chạy trình phát bài giảng Học Cùng Phúc K9!', 'info');
          return;
        }
        const vidIfr = document.getElementById('pk9-lecture-iframe');
        if (vidIfr) {
          const live = vidIfr.src && !vidIfr.src.startsWith('about:blank') ? vidIfr.src : (vidIfr.dataset.ytBase || vidIfr.dataset.autoplaySrc || '');
          if (live) {
            vidIfr.src = live;
            toast('🔄 Đã tải lại trình phát bài giảng!', 'info');
          }
        }
        return;
      }

      const subtabBtn = e.target.closest('[data-study-subtab]');
      if (subtabBtn) {
        APP.studySubtab = subtabBtn.getAttribute('data-study-subtab');
        const subtabBody = document.getElementById('pk9-study-body');
        const activeCourse = getCourseById(APP.activeCourseId);
        const found = findTopicInCourse(activeCourse, APP.activeTopicId);
        if (subtabBody && activeCourse && found?.topic && document.getElementById('pk9-video-stage')) {
          document.querySelectorAll('#pk9-video-stage .pk9-study-subtabs [data-study-subtab]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-study-subtab') === APP.studySubtab);
          });
          subtabBody.innerHTML = renderTopicSubtabContent(found.topic);
          typeset(subtabBody);
        } else {
          renderLecturesTab();
        }
        return;
      }

      const theaterBtn = e.target.closest('[data-toggle-theater]');
      if (theaterBtn) {
        APP.theaterMode = !APP.theaterMode;
        const studioEl = document.getElementById('pk9-lecture-studio');
        if (studioEl && document.getElementById('pk9-video-stage')) {
          studioEl.classList.toggle('theater', APP.theaterMode);
          document.querySelectorAll('[data-toggle-theater]').forEach(btn => {
            btn.classList.toggle('active', APP.theaterMode);
            btn.innerHTML = `🖥️ ${APP.theaterMode ? 'Thu nhỏ' : 'Rạp chiếu'}`;
          });
        } else {
          renderLecturesTab();
        }
        return;
      }

      const doneBtn = e.target.closest('[data-toggle-done-topic]');
      if (doneBtn) {
        const tId = doneBtn.getAttribute('data-toggle-done-topic');
        APP.doneMap[tId] = !APP.doneMap[tId];
        const isDoneNow = Boolean(APP.doneMap[tId]);
        if (document.getElementById('pk9-video-stage')) {
          doneBtn.style.background = isDoneNow ? '#10b981' : '';
          doneBtn.innerHTML = isDoneNow ? '✓ Đã hoàn thành (+25 XP)' : '✅ Đánh dấu hoàn thành (+25 XP)';
          const activeCourse = getCourseById(APP.activeCourseId);
          const found = findTopicInCourse(activeCourse, APP.activeTopicId);
          if (activeCourse) {
            const prog = countCourseProgress(activeCourse);
            const progBadge = document.getElementById('pk9-course-prog-badge');
            const progFill = document.getElementById('pk9-course-prog-fill');
            const ctxProg = document.getElementById('pk9-context-prog-pill');
            if (progBadge) progBadge.textContent = `${prog.done}/${prog.total} bài (${prog.percent}%)`;
            if (progFill) progFill.style.width = `${Math.max(4, prog.percent)}%`;
            if (ctxProg) ctxProg.textContent = `✓ ${prog.done}/${prog.total} bài (${prog.percent}%)`;
          }
          const chListEl = document.getElementById('pk9-lecture-chapters-list');
          if (chListEl && activeCourse && found?.topic) {
            chListEl.innerHTML = buildCourseChaptersListHtml(activeCourse, found.chapter, found.topic);
          }
        } else {
          renderLecturesTab();
        }
        if (isDoneNow) {
          let earnedMsg = APP.user
            ? '🎉 Đã hoàn thành bài giảng!'
            : '✅ Đã đánh dấu hoàn thành cục bộ (Chế độ Khách). Đăng nhập để tích +25 XP lên BXH!';
          if (APP.user) {
            try {
              const recRes = await fetch('/api/dashboard?action=record-study', {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store',
                headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
                body: JSON.stringify({ type: 'lesson', item_id: tId })
              });
              const recData = await recRes.json().catch(() => ({}));
              if (recRes.ok && recData.ok) {
                if (typeof recData.xp_total === 'number') APP.user.xp = recData.xp_total;
                if (typeof recData.weekly_xp === 'number') APP.user.weekly_xp = recData.weekly_xp;
                if (recData.rpg) APP.user.rpg = recData.rpg;
                if (recData.xp_earned > 0) {
                  earnedMsg = `🎉 Đã hoàn thành bài giảng! +${recData.xp_earned} XP (+${recData.gold_earned || 0} vàng) lên BXH!`;
                } else if (recData.xp_earned === 0) {
                  earnedMsg = '✅ Đã đánh dấu hoàn thành bài giảng (đã nhận XP trước đó).';
                }
              }
            } catch {}
          }
          await syncProgressToServer();
          if (APP.user) {
            await fetchAuthAndLeaderboard();
          }
          toast(earnedMsg, APP.user ? 'success' : 'info');
        } else {
          await syncProgressToServer();
        }
        updateHeaderAuthUI();
        return;
      }

      const quizOpt = e.target.closest('[data-topic-quiz]');
      if (quizOpt) {
        const qKey = quizOpt.getAttribute('data-topic-quiz');
        const oIdx = Number(quizOpt.getAttribute('data-topic-opt'));
        APP.quizAnswers[qKey] = oIdx;
        const subtabBody = document.getElementById('pk9-study-body');
        const activeCourse = getCourseById(APP.activeCourseId);
        const found = findTopicInCourse(activeCourse, APP.activeTopicId);
        if (subtabBody && activeCourse && found?.topic) {
          subtabBody.innerHTML = renderTopicSubtabContent(found.topic);
          typeset(subtabBody);
        } else {
          renderLecturesTab();
        }
        return;
      }

      const ytSeekBtn = e.target.closest('[data-yt-seek]');
      if (ytSeekBtn) {
        const slot = ytSeekBtn.getAttribute('data-yt-slot') || 'lecture';
        if (slot === 'lecture' && document.getElementById('pk9-brand-player-poster')) {
          startBrandedLectureVideo();
        }
        const delta = Number(ytSeekBtn.getAttribute('data-yt-seek') || 0);
        const st = YT_BRIDGE_STATE[slot] || YT_BRIDGE_STATE.lecture;
        const target = Math.max(0, Math.round((st.time || 0) + delta));
        updateYtReadout(slot, target);
        sendYtCommand(slot, 'seekTo', [target, true]);
        sendYtCommand(slot, 'playVideo', []);
        st.playing = true;
        toast(`${delta < 0 ? '⏪' : '⏩'} Đã tua ${delta > 0 ? `+${delta}s` : `${delta}s`} (${formatMmSs(target)})`, 'info');
        return;
      }

      const ytToggleBtn = e.target.closest('[data-yt-toggle]');
      if (ytToggleBtn) {
        const slot = ytToggleBtn.getAttribute('data-yt-slot') || 'lecture';
        const st = YT_BRIDGE_STATE[slot] || YT_BRIDGE_STATE.lecture;
        if (slot === 'lecture' && document.getElementById('pk9-brand-player-poster')) {
          startBrandedLectureVideo();
          st.playing = true;
          return;
        }
        if (st.playing) {
          sendYtCommand(slot, 'pauseVideo', []);
          st.playing = false;
        } else {
          sendYtCommand(slot, 'playVideo', []);
          st.playing = true;
        }
        return;
      }

      const ytRateBtn = e.target.closest('[data-yt-rate]');
      if (ytRateBtn) {
        const slot = ytRateBtn.getAttribute('data-yt-slot') || 'lecture';
        const rate = Number(ytRateBtn.getAttribute('data-yt-rate') || 1);
        const st = YT_BRIDGE_STATE[slot] || YT_BRIDGE_STATE.lecture;
        st.rate = rate;
        sendYtCommand(slot, 'setPlaybackRate', [rate]);
        const scope = slot === 'modal' ? '#pk9-modal-control-dock' : '#pk9-player-control-dock';
        document.querySelectorAll(`${scope} [data-yt-rate]`).forEach(b => {
          b.classList.toggle('active', Number(b.getAttribute('data-yt-rate')) === rate);
        });
        toast(`⚡ Tốc độ phát: ${rate}x`, 'info');
        return;
      }

      const ytMarkBtn = e.target.closest('[data-yt-mark-note]');
      if (ytMarkBtn) {
        const stamp = formatMmSs(YT_BRIDGE_STATE.lecture.time || 0);
        APP.studySubtab = 'notes';
        const bodyEl = document.getElementById('pk9-study-body');
        const activeCourse = getCourseById(APP.activeCourseId);
        const found = findTopicInCourse(activeCourse, APP.activeTopicId);
        if (bodyEl && found?.topic) {
          document.querySelectorAll('.pk9-study-subtab').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-study-subtab') === 'notes');
          });
          bodyEl.innerHTML = renderTopicSubtabContent(found.topic);
        }
        const timeInp = document.getElementById('pk9-ts-time-input');
        if (timeInp) {
          timeInp.value = stamp;
          document.getElementById('pk9-ts-label-input')?.focus();
        }
        toast(`📌 Đã chép mốc ${stamp} vào ô Ghi chú bên dưới!`, 'success');
        return;
      }

      const seekBtn = e.target.closest('[data-seek-video]');
      if (seekBtn) {
        const sec = Math.max(0, Number(seekBtn.getAttribute('data-seek-video') || 0));
        const label = seekBtn.getAttribute('data-seek-label') || '';
        const ifr = document.getElementById('pk9-lecture-iframe');
        const stage = document.getElementById('pk9-video-stage');
        if (ifr) {
          const kind = ifr.getAttribute('data-vid-kind');
          const base = ifr.getAttribute('data-yt-base') || '';
          if (kind === 'youtube' && base) {
            if (YT_BRIDGE_STATE.lecture.ready) {
              updateYtReadout('lecture', sec);
              sendYtCommand('lecture', 'seekTo', [sec, true]);
              sendYtCommand('lecture', 'playVideo', []);
              YT_BRIDGE_STATE.lecture.playing = true;
            } else {
              const cleanBase = base.replace(/([?&])(start|autoplay)=[^&]*/g, '').replace(/[?&]$/, '');
              ifr.src = `${cleanBase}${cleanBase.includes('?') ? '&' : '?'}start=${sec}&autoplay=1`;
            }
            stage?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            toast(`▶ Đã tua video tới mốc ${label || `${sec}s`}!`, 'info');
          } else {
            toast(`⏱ Mốc ghi chú ${label}: video Google Drive chưa hỗ trợ nhảy giây trực tiếp, bạn kéo thanh tua tới phút này nhé.`, 'info');
          }
        }
        return;
      }

      const insertTsBtn = e.target.closest('[data-insert-ts-note]');
      if (insertTsBtn) {
        const tId = insertTsBtn.getAttribute('data-insert-ts-note');
        const tRaw = (document.getElementById('pk9-ts-time-input')?.value || '').trim();
        const lRaw = (document.getElementById('pk9-ts-label-input')?.value || '').trim();
        const area = document.getElementById('pk9-topic-note-area');
        const m = tRaw.match(/^(\d{1,3}):([0-5]\d)$/);
        if (!m) {
          toast('Nhập mốc thời gian đúng dạng phút:giây (VD: 12:30 hoặc 04:15).', 'error');
          return;
        }
        const tag = `[${String(Number(m[1])).padStart(2, '0')}:${m[2]}] ${lRaw || 'Ghi chú quan trọng'}`;
        if (area) {
          area.value = area.value.trim() ? `${area.value.trim()}\n${tag}` : tag;
          APP.notesMap[tId] = area.value;
          await syncProgressToServer();
          toast(`⏱ Đã thêm & lưu mốc ${m[1]}:${m[2]}!`, 'success');
          renderLecturesTab();
        }
        return;
      }

      const saveNoteBtn = e.target.closest('[data-save-note]');
      if (saveNoteBtn) {
        const tId = saveNoteBtn.getAttribute('data-save-note');
        const area = document.getElementById('pk9-topic-note-area');
        if (area) {
          APP.notesMap[tId] = area.value;
          await syncProgressToServer();
          toast('💾 Đã lưu ghi chú & mốc thời gian bài giảng!', 'success');
          renderLecturesTab();
        }
        return;
      }

      const lbModeBtn = e.target.closest('[data-lb-mode]');
      if (lbModeBtn) {
        APP.lbMode = lbModeBtn.getAttribute('data-lb-mode');
        renderLeaderboardTab();
        return;
      }

      const lbRefreshBtn = e.target.closest('[data-refresh-leaderboard]');
      if (lbRefreshBtn) {
        toast('🔄 Đang đồng bộ Bảng Xếp Hạng mới nhất...', 'info');
        await refreshLeaderboard({ force: true });
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

      const fcFilterBtn = e.target.closest('[data-fc-filter]');
      if (fcFilterBtn) {
        APP.fcFilter = fcFilterBtn.getAttribute('data-fc-filter') || 'ALL';
        APP.fcCardIdx = 0;
        APP.fcFlipped = false;
        renderFlashcardsTab();
        return;
      }

      const fcStarBtn = e.target.closest('[data-fc-star]');
      if (fcStarBtn) {
        const key = fcStarBtn.getAttribute('data-fc-star');
        const nextStar = fcStarBtn.getAttribute('data-fc-curstar') !== '1';
        updateFlashcardItemState(key, { star: nextStar });
        toast(nextStar ? '⭐ Đã đánh dấu sao thẻ này!' : 'Đã bỏ dấu sao thẻ.', 'info');
        renderFlashcardsTab();
        return;
      }

      const fcLearnBtn = e.target.closest('[data-fc-learning]');
      if (fcLearnBtn) {
        const key = fcLearnBtn.getAttribute('data-fc-learning');
        if (APP.fcFilter !== 'new') {
          APP.fcCardIdx += 1;
        }
        APP.fcFlipped = false;
        updateFlashcardItemState(key, { status: 'learning' });
        renderFlashcardsTab();
        toast('📖 Đã xếp thẻ vào mục Đang học.', 'info');
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
        const decks = window.PK9_FLASHCARDS || [];
        const deck = decks[APP.fcDeckIdx % Math.max(1, decks.length)];
        const len = Math.max(1, (deck?.cards || []).length);
        APP.fcCardIdx = (APP.fcCardIdx - 1 + len) % len;
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
        if (APP.fcFilter !== 'new' && APP.fcFilter !== 'learning') {
          APP.fcCardIdx += 1;
        }
        APP.fcFlipped = false;
        // Skip duplicate rpg-settings POST when logged in because record-study atomically saves flashcard mastery + XP
        updateFlashcardItemState(itemId, { status: 'mastered' }, { skipServerSync: Boolean(APP.user) });
        renderFlashcardsTab();
        let fcMsg = APP.user
          ? '⚡ Đã ghi nhớ thẻ công thức!'
          : '✅ Đã ghi nhớ thẻ cục bộ (Chế độ Khách). Đăng nhập để nhận +20 XP lên BXH!';
        if (APP.user) {
          fetch('/api/dashboard?action=record-study', {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify({ type: 'flashcard', item_id: itemId })
          })
            .then(r => r.json().then(d => ({ ok: r.ok, d })))
            .then(async ({ ok, d }) => {
              if (ok && d?.ok) {
                if (typeof d.xp_total === 'number') APP.user.xp = d.xp_total;
                if (typeof d.weekly_xp === 'number') APP.user.weekly_xp = d.weekly_xp;
                if (d.rpg) {
                  APP.user.rpg = d.rpg;
                  window.PK9_RPG_STATE = d.rpg;
                }
                if (d.xp_earned > 0) {
                  toast(`⚡ Đã ghi nhớ thẻ! +${d.xp_earned} XP · +${d.gold_earned || 0} Vàng lên BXH!`, 'success');
                } else {
                  toast('⚡ Đã ghi nhớ thẻ công thức!', 'info');
                }
                await fetchAuthAndLeaderboard();
                updateHeaderAuthUI();
              }
            })
            .catch(() => {});
        } else {
          toast(fcMsg, 'info');
        }
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
        _serverAdminVerified = false;
        _serverSuperAdminVerified = false;
        APP.weakAdminPassword = false;
        APP.adminDetailData = null;
        enforceAdminDomHidden();
        APP.pendingAvatarData = undefined;
        APP.lbData = { locked: true, week_key: '', total_students: 0, leaderboard: [], weekly_leaderboard: [], exam_leaderboard: [], my_rank: null };
        window.PK9_RPG_STATE = null;
        updateHeaderAuthUI();
        closeAuthModal();
        toast('Đã đăng xuất tài khoản.', 'info');
        await fetchAuthAndLeaderboard();
        if (window.PK9_RPG?.loadMeta) await window.PK9_RPG.loadMeta();
        if (APP.activeTab === 'journey' && window.PK9_RPG) window.PK9_RPG.renderTab('journey');
        return;
      }

      const clearAvatarBtn = e.target.closest('[data-clear-avatar]');
      if (clearAvatarBtn) {
        APP.pendingAvatarData = '';
        const preview = document.getElementById('pk9-settings-avatar-preview');
        const ch = (APP.user?.display_name || APP.user?.username || 'U').trim().charAt(0).toUpperCase() || 'U';
        if (preview) preview.innerHTML = renderAvatarInner('', ch);
        const fileInput = document.getElementById('pk9-avatar-file-input');
        if (fileInput) fileInput.value = '';
        toast('Đã gỡ ảnh xem trước — bấm "Lưu cài đặt tài khoản" để áp dụng.', 'info');
        return;
      }

      const themeBtn = e.target.closest('[data-toggle-theme]');
      if (themeBtn) {
        const applyTheme = () => {
          const isDark = document.documentElement.classList.toggle('dark');
          try { localStorage.setItem('pk9_theme', isDark ? 'dark' : 'light'); } catch {}
          themeBtn.textContent = isDark ? '☀️' : '🌙';
        };
        if (typeof runSmoothVisualTransition === 'function') {
          runSmoothVisualTransition(applyTheme);
        } else {
          applyTheme();
        }
        return;
      }

      const togglePcSidebarBtn = e.target.closest('[data-toggle-pc-sidebar]');
      if (togglePcSidebarBtn) {
        applyPcSidebarCollapsed(!APP.sidebarCollapsed);
        return;
      }

      const mobMenuBtn = e.target.closest('[data-toggle-mobile-sidebar]');
      if (mobMenuBtn) {
        const sb = document.getElementById('pk9-sidebar');
        const bd = document.getElementById('pk9-sidebar-backdrop');
        const open = sb?.classList.toggle('mobile-open');
        if (bd) bd.classList.toggle('open', Boolean(open));
        syncMobileScrollLock();
        return;
      }

      const closeMobMenu = e.target.closest('[data-close-mobile-sidebar]');
      if (closeMobMenu) {
        document.getElementById('pk9-sidebar')?.classList.remove('mobile-open');
        document.getElementById('pk9-sidebar-backdrop')?.classList.remove('open');
        syncMobileScrollLock();
        return;
      }

      const installAppBtn = e.target.closest('[data-install-app]');
      if (installAppBtn) {
        openInstallAppModal();
        return;
      }

      const closeInstallBtn = e.target.closest('[data-close-install-modal]');
      if (closeInstallBtn) {
        closeInstallAppModal();
        return;
      }

      const triggerNativeBtn = e.target.closest('[data-trigger-native-install]');
      if (triggerNativeBtn) {
        if (APP.deferredInstallPrompt) {
          const deferred = APP.deferredInstallPrompt;
          APP.deferredInstallPrompt = null;
          Promise.resolve(deferred.prompt())
            .then(() => deferred.userChoice)
            .then((choice) => {
              if (choice?.outcome === 'accepted') {
                APP.isStandalone = true;
                closeInstallAppModal();
              }
              updateInstallButtonUI();
            })
            .catch(() => {
              updateInstallButtonUI();
            });
        }
        return;
      }

      const copyAppLinkBtn = e.target.closest('[data-copy-app-link]');
      if (copyAppLinkBtn) {
        const appUrl = window.location.href;
        const copyFallback = () => {
          let copied = false;
          try {
            const ta = document.createElement('textarea');
            ta.value = appUrl;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            copied = document.execCommand('copy');
            ta.remove();
          } catch {}
          copyAppLinkBtn.textContent = copied ? '✅ Đã sao chép link! Dán vào Safari/Chrome nhé' : appUrl;
        };
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(appUrl)
            .then(() => {
              copyAppLinkBtn.textContent = '✅ Đã sao chép link! Dán vào Safari/Chrome nhé';
            })
            .catch(copyFallback);
        } else {
          copyFallback();
        }
        return;
      }

      const toggleMobSelBtn = e.target.closest('[data-toggle-mob-selectors]');
      if (toggleMobSelBtn) {
        APP.mobileSelectorsCollapsed = !APP.mobileSelectorsCollapsed;
        const selWrap = document.getElementById('pk9-lecture-hierarchy');
        if (selWrap) {
          selWrap.classList.toggle('is-collapsed', APP.mobileSelectorsCollapsed);
          selWrap.classList.toggle('mob-collapsed', APP.mobileSelectorsCollapsed);
          document.querySelectorAll('[data-toggle-mob-selectors]').forEach(btn => {
            btn.innerHTML = APP.mobileSelectorsCollapsed ? '✨ Mở bộ chọn GV / Môn' : '🔼 Thu gọn bộ chọn';
          });
        } else {
          renderLecturesTab();
        }
        return;
      }

      if (e.target.closest('[data-restore-inline-video]')) {
        restoreSuspendedLectureVideo();
        return;
      }

      const mobJumpSidebarBtn = e.target.closest('[data-mob-jump-sidebar]');
      if (mobJumpSidebarBtn) {
        document.getElementById('pk9-course-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const ifr = document.getElementById('pk9-khoa-chui-iframe');
        if (ifr) {
          const z = APP.kcZoom;
          const scaleStyle = z !== 100
            ? `transform:scale(${z / 100});transform-origin:top left;width:${(10000 / z).toFixed(2)}%;height:${(10000 / z).toFixed(2)}%;`
            : 'width:100%;height:100%;';
          ifr.setAttribute('style', `border:0;display:block;background:#fff;${scaleStyle}`);
          document.querySelectorAll('[data-kc-zoom]').forEach(btn => {
            btn.classList.toggle('active', Number(btn.getAttribute('data-kc-zoom')) === z);
          });
        } else {
          renderKhoaChuiTab();
        }
        return;
      }

      const kcReloadBtn = e.target.closest('[data-kc-reload]');
      if (kcReloadBtn) {
        const ifr = document.getElementById('pk9-khoa-chui-iframe');
        if (ifr) {
          const cur = ifr.src;
          ifr.src = cur;
          toast('🔄 Đang làm mới dữ liệu Thư Viện Công Khai trực tiếp trong web...', 'info');
        }
        return;
      }

      const kcFullBtn = e.target.closest('[data-kc-toggle-fullscreen]');
      if (kcFullBtn) {
        APP.kcFullscreen = !APP.kcFullscreen;
        const ws = document.getElementById('pk9-khoa-chui-workspace');
        const fw = document.getElementById('pk9-khoa-chui-frame-wrap');
        if (ws && fw) {
          ws.classList.toggle('pk9-sheet-fullscreen', APP.kcFullscreen);
          fw.style.height = APP.kcFullscreen ? 'calc(100vh - 58px)' : '76vh';
          kcFullBtn.innerHTML = APP.kcFullscreen ? '🗗 Thu nhỏ khung' : '⛶ Toàn màn hình trong Web';
        } else {
          renderKhoaChuiTab();
        }
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
        const kcGrid = document.getElementById('pk9-kc-cards-grid');
        if (kcGrid) {
          document.querySelectorAll('[data-kc-subj]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-kc-subj') === APP.kcSubject);
          });
          kcGrid.innerHTML = buildKhoaChuiCardsHtml();
        } else {
          renderKhoaChuiTab();
        }
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
      if (closeInAppBtn || e.target?.id === 'pk9-inapp-viewer-overlay') {
        closeInAppViewer();
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

      // --- AI SUGGESTION CHIPS & COMMUNITY DELETE ---
      const aiSuggestBtn = e.target.closest('[data-ai-suggest]');
      if (aiSuggestBtn) {
        const aiInput = document.getElementById('pk9-ai-input');
        if (aiInput) {
          aiInput.value = aiSuggestBtn.getAttribute('data-ai-suggest') || '';
          aiInput.focus();
        }
        return;
      }

      const delCommBtn = e.target.closest('[data-del-community-item]');
      if (delCommBtn) {
        const itemId = delCommBtn.getAttribute('data-del-community-item');
        if (!itemId) return;
        if (!window.confirm('Xác nhận xóa tài liệu này khỏi Thư viện Cộng đồng?')) return;
        try {
          const resp = await fetch('/api/community?action=delete', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify({ id: itemId })
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data?.ok) {
            APP.communityItems = APP.communityItems.filter(it => String(it.id || '') !== String(itemId));
            toast('🗑️ Đã xóa tài liệu khỏi Thư viện Cộng đồng.', 'info');
            renderCommunityTab();
          } else {
            toast(data?.message || 'Không thể xóa tài liệu này.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
        return;
      }

      // --- ADMIN EXAM CATALOG MANAGER ---
      const fillSampleExamBtn = e.target.closest('[data-fill-sample-exam-json]');
      if (fillSampleExamBtn) {
        const area = document.getElementById('pk9-admin-exam-json-input');
        if (area) {
          const sampleExam = {
            id: `de-moi-${Date.now().toString(36)}`,
            title: 'Đề Thi Thử Tốt Nghiệp THPT 2026 — Môn Hóa Học (Chuẩn GDPT 2018)',
            subject: 'Hóa học',
            grade: '2K9',
            sourceOrg: 'Sở GD&ĐT',
            durationMin: 50,
            questions: [
              {
                id: 'p1_q1',
                part: 1,
                type: 'mcq',
                prompt: 'Kim loại nào sau đây có tính dẫn điện tốt nhất ở điều kiện thường?',
                choices: ['A. Đồng (Cu)', 'B. Bạc (Ag)', 'C. Vàng (Au)', 'D. Nhôm (Al)'],
                answer: 1,
                explanation: 'Bạc (Ag) dẫn điện tốt nhất trong tất cả các kim loại (Ag > Cu > Au > Al > Fe).'
              },
              {
                id: 'p2_q1',
                part: 2,
                type: 'true_false',
                prompt: 'Cho các phát biểu về carbohydrate:',
                statements: [
                  { id: 'a', text: 'a) Glucose và fructose là đồng phân cấu tạo của nhau.', answer: true },
                  { id: 'b', text: 'b) Saccharose tham gia phản ứng tráng bạc trực tiếp.', answer: false },
                  { id: 'c', text: 'c) Tinh bột và cellulose đều là polymer thiên nhiên.', answer: true },
                  { id: 'd', text: 'd) Thủy phân hoàn toàn tinh bột thu được glucose.', answer: true }
                ],
                explanation: 'Saccharose không có nhóm -CHO mở vòng nên không tráng bạc trực tiếp.'
              },
              {
                id: 'p3_q1',
                part: 3,
                type: 'short_answer',
                prompt: 'Phân tử khối của ethyl acetate (CH3COOC2H5) bằng bao nhiêu?',
                answer: ['88'],
                explanation: 'M(CH3COOC2H5) = 12*4 + 8 + 16*2 = 88.'
              }
            ]
          };
          area.value = JSON.stringify(sampleExam, null, 2);
          toast('📋 Đã điền mẫu JSON đề thi 3 phần chuẩn GDPT 2018!', 'info');
        }
        return;
      }

      const adminExamPubBtn = e.target.closest('[data-admin-exam-toggle-pub]');
      if (adminExamPubBtn) {
        const examId = adminExamPubBtn.getAttribute('data-admin-exam-toggle-pub');
        const curPub = adminExamPubBtn.getAttribute('data-cur-pub') === '1';
        const act = curPub ? 'unpublish' : 'publish';
        try {
          const resp = await fetch(`/api/exams?action=${act}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify({ exam_id: examId })
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data?.ok) {
            toast(curPub ? '⏸ Đã tạm ẩn đề thi khỏi danh sách học sinh.' : '✅ Đã xuất bản đề thi lên Kho Luyện Đề!', 'success');
            await fetchAdminDetail();
            if (window.PK9_EXAM_CENTER?.reloadCatalog) await window.PK9_EXAM_CENTER.reloadCatalog();
          } else {
            toast(data?.message || 'Không thể cập nhật trạng thái đề thi.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
        return;
      }

      const adminExamDelBtn = e.target.closest('[data-admin-exam-delete]');
      if (adminExamDelBtn) {
        const examId = adminExamDelBtn.getAttribute('data-admin-exam-delete');
        if (!window.confirm(`Xác nhận xóa đề thi tùy chỉnh "${examId}" khỏi hệ thống?`)) return;
        try {
          const resp = await fetch('/api/exams?action=delete', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify({ exam_id: examId })
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data?.ok) {
            toast('🗑️ Đã xóa đề thi tùy chỉnh.', 'info');
            await fetchAdminDetail();
            if (window.PK9_EXAM_CENTER?.reloadCatalog) await window.PK9_EXAM_CENTER.reloadCatalog();
          } else {
            toast(data?.message || 'Không thể xóa đề thi này.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
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

      const adminToggleLiveBtn = e.target.closest('[data-admin-toggle-live]');
      if (adminToggleLiveBtn) {
        APP.adminAutoLive = !APP.adminAutoLive;
        syncAdminLivePolling();
        renderAdminTab();
        toast(APP.adminAutoLive ? '🟢 Đã bật tự động cập nhật mỗi 15 giây' : '⏸ Đã tạm dừng tự động làm mới', 'info');
        return;
      }

      const adminDeviceFilterBtn = e.target.closest('[data-admin-device-filter]');
      if (adminDeviceFilterBtn) {
        APP.adminDeviceFilter = adminDeviceFilterBtn.getAttribute('data-admin-device-filter') || 'ALL';
        renderAdminTab();
        return;
      }

      const adminDelKcBtn = e.target.closest('[data-admin-del-khoachui]');
      if (adminDelKcBtn) {
        const id = adminDelKcBtn.getAttribute('data-admin-del-khoachui');
        await runAdminAction({ sub_action: 'delete-khoa-chui', id });
        return;
      }

      const adminFbFilterBtn = e.target.closest('[data-admin-fb-filter]');
      if (adminFbFilterBtn) {
        APP.adminFeedbackFilter = adminFbFilterBtn.getAttribute('data-admin-fb-filter') || 'ALL';
        renderAdminTab();
        return;
      }

      const adminFbStatusBtn = e.target.closest('[data-admin-fb-status]');
      if (adminFbStatusBtn) {
        const id = adminFbStatusBtn.getAttribute('data-fb-id') || '';
        const status = adminFbStatusBtn.getAttribute('data-admin-fb-status') || 'resolved';
        await runAdminAction({ sub_action: 'feedback-status', id, status });
        return;
      }

      const adminFbDelBtn = e.target.closest('[data-admin-fb-delete]');
      if (adminFbDelBtn) {
        const id = adminFbDelBtn.getAttribute('data-admin-fb-delete') || '';
        await runAdminAction({ sub_action: 'feedback-delete', id });
        return;
      }

      const adminExportCsvBtn = e.target.closest('[data-admin-export-csv]');
      if (adminExportCsvBtn) {
        const payload = APP.adminDetailData || {};
        const csvCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [['Ngay', 'Khach', 'Mobile', 'Desktop', 'Tablet', 'Pageviews', 'Bai_thi', 'Dang_ky']];
        for (const s of (payload.daily_series || [])) {
          rows.push([s.date, s.visitors, s.mobile_visitors || 0, s.desktop_visitors || 0, s.tablet_visitors || 0, s.pageviews, s.attempts, s.signups]);
        }
        rows.push([]);
        rows.push(['Username', 'Ho_ten', 'Vai_tro', 'Khoi', 'XP', 'Bai_hoc_xong', 'So_de_thi', 'Diem_TB', 'Hoat_dong_cuoi']);
        for (const u of (payload.users || [])) {
          rows.push([u.username, u.display_name, u.role, u.grade, u.xp, u.lessons_done, u.exam_attempts, u.avg_score, u.last_active]);
        }
        const csvText = '\uFEFF' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phuc-k9-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast('📊 Đã xuất báo cáo CSV (mở được ngay trong Excel)!', 'success');
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

      const adminOpenRoleBtn = e.target.closest('[data-admin-open-role]');
      if (adminOpenRoleBtn) {
        if (!isClientVerifiedSuperAdmin()) {
          toast('Chỉ tài khoản Super Admin @phucadmin mới có quyền Phân quyền!', 'error');
          return;
        }
        const username = adminOpenRoleBtn.getAttribute('data-admin-open-role');
        const cur = adminOpenRoleBtn.getAttribute('data-cur-role') || 'student';
        const dispName = adminOpenRoleBtn.getAttribute('data-display-name') || username;
        const oldModal = document.getElementById('pk9-role-assign-modal');
        if (oldModal) oldModal.remove();
        const modal = document.createElement('div');
        modal.id = 'pk9-role-assign-modal';
        modal.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:1rem;';
        modal.innerHTML = `
          <div style="max-width:440px;width:100%;background:var(--pk9-surface,#fff);color:var(--pk9-text,#0f172a);border-radius:1rem;padding:1.25rem;box-shadow:0 20px 50px rgba(0,0,0,0.3);border:1px solid var(--pk9-border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h3 style="margin:0;font-size:1.05rem;font-weight:900;">🛡️ Phân Quyền Tài Khoản</h3>
              <button type="button" id="pk9-role-modal-close" class="pk9-btn-exam-ghost" style="padding:0.2rem 0.5rem;">✕</button>
            </div>
            <p style="margin:0 0 0.85rem;font-size:0.85rem;color:var(--pk9-text-muted);">
              Chọn vai trò mới cho <b>${esc(dispName)}</b> (<code>@${esc(username)}</code>):
            </p>
            <div style="display:grid;gap:0.55rem;">
              ${[
                { r: 'student', title: '🎓 Học viên chuẩn', desc: 'Học bài, làm đề thi và đua BXH bình thường.' },
                { r: 'vip', title: '💎 Học viên VIP Pro', desc: 'Học viên ưu tiên VIP + mở khóa huy hiệu VIP Pro.' },
                { r: 'admin', title: '🛡️ Cấp quyền Admin phụ', desc: 'Mở quyền xem Admin Dashboard (chỉ @phucadmin mới cấp/gỡ được).' }
              ].map(opt => `
                <button type="button" data-pick-role="${opt.r}" style="text-align:left;padding:0.7rem 0.85rem;border-radius:0.75rem;border:1.5px solid ${cur === opt.r ? 'var(--pk9-primary)' : 'var(--pk9-border)'};background:${cur === opt.r ? 'rgba(37,99,235,0.08)' : 'transparent'};cursor:pointer;">
                  <div style="font-weight:800;font-size:0.88rem;color:var(--pk9-text);">${opt.title} ${cur === opt.r ? '• (Hiện tại)' : ''}</div>
                  <div style="font-size:0.76rem;color:var(--pk9-text-muted);margin-top:0.15rem;">${opt.desc}</div>
                </button>
              `).join('')}
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#pk9-role-modal-close')?.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', ev => { if (ev.target === modal) modal.remove(); });
        modal.querySelectorAll('[data-pick-role]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const nextRole = btn.getAttribute('data-pick-role') || 'student';
            modal.remove();
            await runAdminAction({ sub_action: 'set-role', username, role: nextRole });
          });
        });
        return;
      }

      const adminBanUserBtn = e.target.closest('[data-admin-ban-user]');
      if (adminBanUserBtn) {
        const username = adminBanUserBtn.getAttribute('data-admin-ban-user');
        const reason = window.prompt(`Nhập lý do khóa (Ban) vĩnh viễn tài khoản @${username}:`, 'Xâm nhập trái phép khu vực Admin / Vi phạm quy định web');
        if (reason === null) return;
        await runAdminAction({ sub_action: 'ban-user', username, reason: reason.trim() || 'Vi phạm quy định hệ thống' });
        return;
      }

      const adminUnbanUserBtn = e.target.closest('[data-admin-unban-user]');
      if (adminUnbanUserBtn) {
        const username = adminUnbanUserBtn.getAttribute('data-admin-unban-user');
        if (!window.confirm(`Xác nhận mở khóa (Gỡ Ban) cho tài khoản @${username}?`)) return;
        await runAdminAction({ sub_action: 'unban-user', username });
        return;
      }

      const adminClearWarnBtn = e.target.closest('[data-admin-clear-warn]');
      if (adminClearWarnBtn) {
        const username = adminClearWarnBtn.getAttribute('data-admin-clear-warn');
        await runAdminAction({ sub_action: 'clear-warnings', username });
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
        const suggested = `K9@${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const nextPass = window.prompt(`Nhập mật khẩu mới cho @${username} (6–128 ký tự):`, suggested);
        if (nextPass === null) return;
        const cleanPass = String(nextPass).trim();
        if (cleanPass.length < 6) {
          toast('Mật khẩu mới cần ít nhất 6 ký tự.', 'error');
          return;
        }
        await runAdminAction({ sub_action: 'reset-password', username, new_password: cleanPass });
        return;
      }

      const adminDelUserBtn = e.target.closest('[data-admin-del-user]');
      if (adminDelUserBtn) {
        const username = adminDelUserBtn.getAttribute('data-admin-del-user');
        if (!window.confirm(`Xác nhận xóa vĩnh viễn tài khoản @${username}?`)) return;
        await runAdminAction({ sub_action: 'delete-user', username });
        return;
      }
    });

    document.addEventListener('input', e => {
      if (e.target.id === 'pk9-lecture-search-input') {
        APP.lectureSearch = e.target.value || '';
        const chListEl = document.getElementById('pk9-lecture-chapters-list');
        const activeCourse = getCourseById(APP.activeCourseId);
        const found = findTopicInCourse(activeCourse, APP.activeTopicId);
        if (chListEl && activeCourse) {
          chListEl.innerHTML = buildCourseChaptersListHtml(activeCourse, found?.chapter, found?.topic);
        }
      } else if (e.target.id === 'pk9-teacher-quick-search') {
        APP.teacherPickerSearch = e.target.value || '';
        const wrap = document.getElementById('pk9-teacher-grid-wrap');
        const activeCourse = getCourseById(APP.activeCourseId);
        const teachersInSubj = getCatalog().filter(c => c.grade === '2K9' && c.subject === (APP.active2k9Subject || activeCourse?.subject));
        if (wrap) {
          wrap.innerHTML = buildTeacherRosterCardsHtml(teachersInSubj, APP.activeCourseId, APP.active2k9Subject || activeCourse?.subject || '');
        }
      } else if (e.target.id === 'pk9-teacher-pdf-search') {
        APP.teacherPdfSearch = e.target.value || '';
        const listEl = document.getElementById('pk9-teacher-pdf-list-wrap');
        const activeCourse = getCourseById(APP.activeCourseId);
        if (listEl && activeCourse) {
          listEl.innerHTML = buildTeacherPdfRowsHtml(activeCourse);
        }
      } else if (e.target.id === 'pk9-lb-search-input') {
        APP.lbSearch = e.target.value || '';
        const rowsEl = document.getElementById('pk9-lb-rows-body');
        if (rowsEl) {
          rowsEl.innerHTML = buildLeaderboardRowsHtml();
        }
      } else if (e.target.id === 'pk9-doc-search-input') {
        APP.docSearch = e.target.value || '';
        const gridEl = document.getElementById('pk9-doc-cards-grid');
        if (gridEl) {
          gridEl.innerHTML = buildDocsCardsHtml();
        }
      } else if (e.target.id === 'pk9-kc-search-input') {
        APP.kcSearch = e.target.value || '';
        const gridEl = document.getElementById('pk9-kc-cards-grid');
        if (gridEl) {
          gridEl.innerHTML = buildKhoaChuiCardsHtml();
        }
      } else if (e.target.id === 'pk9-admin-user-search') {
        APP.adminUserSearch = e.target.value || '';
        const tbody = document.getElementById('pk9-admin-users-tbody');
        if (tbody) {
          tbody.innerHTML = buildAdminUsersRowsHtml(APP.adminDetailData?.users || []);
        }
      } else if (e.target.id === 'pk9-admin-exam-search') {
        APP.adminExamSearch = e.target.value || '';
        const tbody = document.getElementById('pk9-admin-attempts-tbody');
        if (tbody) {
          tbody.innerHTML = buildAdminExamAttemptsRowsHtml(APP.adminDetailData?.exam_attempts || []);
        }
      } else if (e.target.id === 'pk9-cmd-input') {
        renderCommandResults(e.target.value || '');
      }
    });

    document.addEventListener('submit', async e => {
      if (e.target.id === 'pk9-admin-import-exam-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const rawJson = String(fd.get('exam_json') || '').trim();
        const publishNow = fd.get('publish_now') !== null;
        let parsedExam = null;
        try {
          parsedExam = JSON.parse(rawJson);
        } catch (err) {
          toast(`❌ JSON không hợp lệ: ${err.message}`, 'error');
          return;
        }
        try {
          const resp = await fetch('/api/exams?action=admin-import', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify({ exam: parsedExam, publish_now: publishNow })
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data?.ok) {
            toast(`🎉 Đã nạp đề thi "${parsedExam.title || data.exam_id}" thành công!`, 'success');
            e.target.reset();
            await fetchAdminDetail();
            if (window.PK9_EXAM_CENTER?.reloadCatalog) await window.PK9_EXAM_CENTER.reloadCatalog();
          } else {
            toast(data?.message || 'Không thể nạp đề thi.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
        return;
      }

      if (e.target.id === 'pk9-forgot-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
          const resp = await fetch('/api/auth?action=forgot-password', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf, 'x-pk9-visitor': getVisitorClientId() },
            body: JSON.stringify(payload)
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok || !data?.ok) {
            toast(data?.message || 'Không thể khôi phục mật khẩu.', 'error');
            return;
          }
          APP.user = data.user;
          _serverAdminVerified = Boolean(data.user && data.user.is_admin && (data.user.username === 'phucadmin' || (data.user.is_admin && String(data.user.admin_granted_by || '').toLowerCase() === 'phucadmin')));
          _serverSuperAdminVerified = Boolean(_serverAdminVerified && data.user?.username === 'phucadmin');
          APP.csrf = data.csrf || APP.csrf;
          closeAuthModal();
          toast(data.message || 'Khôi phục mật khẩu thành công!', 'success');
          await fetchAuthAndLeaderboard();
          if (window.PK9_RPG?.loadMeta) {
            await window.PK9_RPG.loadMeta(APP.user?.settings?.preferred_grade || '2K9');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
        return;
      }

      if (e.target.id === 'pk9-feedback-form') {
        e.preventDefault();
        const form = e.target;
        const fd = new FormData(form);
        const submitBtn = document.getElementById('pk9-fb-submit-btn');
        const name = String(fd.get('name') || '').trim();
        const contact = String(fd.get('contact') || '').trim();
        const message = String(fd.get('message') || '').trim();
        if (message.length < 6) {
          toast('Vui lòng nhập nội dung góp ý ít nhất 6 ký tự.', 'error');
          return;
        }
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '⏳ Đang gửi...';
        }
        try {
          if (!APP.csrf) {
            await fetchAuthAndLeaderboard();
          }
          const deviceHint = `${window.innerWidth <= 768 ? 'Mobile' : 'Desktop'} (${window.innerWidth}x${window.innerHeight})`;
          const resp = await fetch('/api/community?action=feedback-submit', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': APP.csrf,
              'x-pk9-visitor': getVisitorClientId()
            },
            body: JSON.stringify({
              category: APP.feedbackCategory || 'bug',
              rating: APP.feedbackRating || 5,
              name,
              contact,
              message,
              page_context: APP.feedbackContext || '',
              device_hint: deviceHint
            })
          });
          const data = await resp.json().catch(() => ({}));
          if (data?.csrf) APP.csrf = data.csrf;
          if (!resp.ok || !data?.ok) {
            toast(data?.message || 'Không thể gửi feedback lúc này.', 'error');
            return;
          }
          const catMap = {
            bug: 'Báo lỗi Video / PDF / Web',
            exam: 'Góp ý Đề thi / Đáp án',
            feature: 'Đề xuất tính năng mới',
            other: 'Góp ý chung / Liên hệ'
          };
          const subj = `[HỌC CÙNG PHÚC K9] Feedback (${catMap[APP.feedbackCategory] || 'Góp ý'}) ★${APP.feedbackRating || 5}`;
          const mailBody = [
            `Người gửi: ${name || APP.user?.display_name || 'Học viên'}`,
            `Liên hệ lại: ${contact || 'Không để lại'}`,
            `Ngữ cảnh: ${APP.feedbackContext || 'Trang web'}`,
            `Đánh giá: ${APP.feedbackRating || 5}/5 sao`,
            '',
            'Nội dung chi tiết:',
            message
          ].join('\n');
          APP.feedbackSubmitted = {
            serverMessage: data.message,
            emailForwarded: Boolean(data.email_forwarded),
            mailSubject: subj,
            mailBody
          };
          renderFeedbackModalBody();
          toast('🎉 ' + (data.message || 'Đã gửi góp ý thành công!'), 'success');
        } catch {
          toast('Lỗi kết nối khi gửi feedback. Bạn có thể nhắn Zalo 0382952325 hoặc Gmail doivo250388@gmail.com.', 'error');
        } finally {
          if (submitBtn && document.body.contains(submitBtn)) {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Gửi Feedback Cho Admin';
          }
        }
        return;
      }

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
            headers: {
              'Content-Type': 'application/json',
              'x-csrf-token': APP.csrf,
              'x-pk9-visitor': getVisitorClientId()
            },
            body: JSON.stringify(payload)
          });
          const data = await resp.json();
          if (!resp.ok || !data?.ok) {
            if (data?.banned) {
              closeAuthModal();
              handleBannedResponse(data);
              return;
            }
            toast(data?.message || 'Không thể xác thực tài khoản.', 'error');
            return;
          }
          _clientBanLock = null;
          try { localStorage.removeItem('pk9_ban_notice'); } catch {}
          renderBanOverlay(null);
          APP.user = data.user;
          _serverAdminVerified = Boolean(data.is_admin && (data.user?.username === 'phucadmin' || (data.user?.is_admin && String(data.user?.admin_granted_by || '').toLowerCase() === 'phucadmin')));
          _serverSuperAdminVerified = Boolean(_serverAdminVerified && data.is_super_admin && data.user?.username === 'phucadmin');
          APP.weakAdminPassword = Boolean(_serverAdminVerified && data.weak_password_warning);
          APP.csrf = data.csrf || APP.csrf;
          closeAuthModal();
          toast(data.message || 'Thành công!', 'success');
          await fetchAuthAndLeaderboard();
          if (window.PK9_RPG?.loadMeta) {
            await window.PK9_RPG.loadMeta(APP.user?.settings?.preferred_grade || '2K9');
          }
          if (APP.activeTab === 'journey' && window.PK9_RPG) window.PK9_RPG.renderTab('journey');
          if (APP.isAdmin) {
            if (APP.weakAdminPassword) {
              toast('⚠️ Mật khẩu Admin hiện yếu! Vui lòng đổi sang mật khẩu mạnh ngay.', 'error');
            } else {
              toast(APP.isSuperAdmin ? '👑 Đã kích hoạt Super Admin @phucadmin!' : '🛡️ Quyền Admin đã kích hoạt!', 'info');
            }
          }
          try {
            const memberOnbKey = `pk9_onboard_member_v1_${String(APP.user?.username || '').toLowerCase()}`;
            if (APP.user && !localStorage.getItem(memberOnbKey)) {
              setTimeout(() => openOnboardingModal('member'), 360);
            }
          } catch {}
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
      }

      if (e.target.id === 'pk9-profile-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        if (APP.pendingAvatarData !== undefined) {
          payload.avatar_data = APP.pendingAvatarData;
        }
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
            APP.pendingAvatarData = undefined;
            updateHeaderAuthUI();
            closeAuthModal();
            toast('Đã lưu cài đặt tài khoản thành công!', 'success');
            await fetchAuthAndLeaderboard();
          if (window.PK9_RPG?.loadMeta) {
            await window.PK9_RPG.loadMeta(APP.user?.settings?.preferred_grade || '2K9');
          }
          if (APP.activeTab === 'journey' && window.PK9_RPG) window.PK9_RPG.renderTab('journey');
          } else {
            toast(data?.message || 'Không thể lưu hồ sơ.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
        return;
      }

      if (e.target.id === 'pk9-password-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const current_password = String(fd.get('current_password') || '');
        const new_password = String(fd.get('new_password') || '');
        const confirm_password = String(fd.get('confirm_password') || '');
        if (new_password.length < 6) {
          toast('Mật khẩu mới phải từ 6 ký tự trở lên.', 'error');
          return;
        }
        if (new_password !== confirm_password) {
          toast('Xác nhận mật khẩu mới chưa khớp.', 'error');
          return;
        }
        try {
          const resp = await fetch('/api/auth?action=change-password', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify({ current_password, new_password, confirm_password })
          });
          const data = await resp.json();
          if (resp.ok && data?.ok) {
            if (data.csrf) APP.csrf = data.csrf;
            if (APP.isAdmin && new_password !== 'admin123') APP.weakAdminPassword = false;
            e.target.reset();
            toast(data.message || 'Đổi mật khẩu thành công!', 'success');
            renderAuthModalContent('profile');
            if (APP.activeTab === 'admin') renderAdminTab();
          } else {
            toast(data?.message || 'Không thể đổi mật khẩu.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ.', 'error');
        }
        return;
      }

      if (e.target.id === 'pk9-admin-contest-form') {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        try {
          const resp = await fetch('/api/exams?action=contest-save', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify(payload)
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data?.ok) {
            toast(data.message || '🏆 Đã mở kỳ thi thử toàn hệ thống!', 'success');
            if (window.PK9_EXAM_CENTER?.loadArenaLobbyData) {
              await window.PK9_EXAM_CENTER.loadArenaLobbyData();
            }
            e.target.reset();
          } else {
            toast(data?.message || 'Không lưu được kỳ thi thử.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ khi lưu kỳ thi.', 'error');
        }
        return;
      }

      if (e.target.id === 'pk9-community-form') {
        e.preventDefault();
        if (!APP.user) {
          toast('🔒 Vui lòng đăng nhập tài khoản để chia sẻ tài liệu lên Thư viện Cộng đồng!', 'error');
          openAuthModal('login');
          return;
        }
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const fd = new FormData(form);
        const item = Object.fromEntries(fd.entries());
        if (submitBtn) submitBtn.disabled = true;
        try {
          const resp = await fetch('/api/community?action=create', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': APP.csrf },
            body: JSON.stringify(item)
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data?.ok && data?.item) {
            if (data.csrf) APP.csrf = data.csrf;
            APP.communityItems.unshift(data.item);
            form.reset();
            toast('🎉 Đã chia sẻ & lưu tài liệu lên Thư viện Cộng đồng!', 'success');
            renderCommunityTab();
          } else {
            toast(data?.message || 'Không thể lưu tài liệu lên máy chủ.', 'error');
          }
        } catch {
          toast('Lỗi kết nối máy chủ khi chia sẻ tài liệu.', 'error');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
        return;
      }

      if (e.target.id === 'pk9-ai-form') {
        e.preventDefault();
        const input = document.getElementById('pk9-ai-input');
        const submitBtn = document.getElementById('pk9-ai-submit-btn');
        const box = document.getElementById('pk9-ai-messages');
        const q = String(input?.value || '').trim();
        if (!q || !box) return;
        input.value = '';
        if (submitBtn) submitBtn.disabled = true;

        box.insertAdjacentHTML('beforeend', `
          <div style="align-self:flex-end;max-width:80%;padding:0.75rem 1rem;border-radius:1rem;background:var(--pk9-primary);color:#fff;font-size:0.9rem;font-weight:600;white-space:pre-line;">
            ${esc(q)}
          </div>
        `);

        const pendingEl = document.createElement('div');
        pendingEl.style.cssText = 'align-self:flex-start;max-width:85%;padding:0.85rem 1.1rem;border-radius:1rem;background:var(--pk9-surface);border:1px solid var(--pk9-border);font-size:0.9rem;white-space:pre-line;';
        pendingEl.innerHTML = '🤖 <b>Trợ lý AI Phúc K9:</b>\n⏳ Đang phân tích đề bài và viết lời giải chi tiết...';
        box.appendChild(pendingEl);
        box.scrollTop = box.scrollHeight;

        const curCourse = getCourseById(APP.activeCourseId);
        const curTopic = findTopicInCourse(curCourse, APP.activeTopicId)?.topic;
        let replyText = '';
        let errReason = '';
        try {
          const resp = await fetch('/api/ai', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: q,
              prompt: q,
              context: {
                grade: APP.user?.settings?.preferred_grade || APP.gradeFilter || '2K9',
                title: curTopic?.title || curCourse?.title || '',
                description: curCourse ? `${curCourse.subject || ''} - ${curCourse.teacher || ''}` : ''
              }
            })
          });
          const data = await resp.json().catch(() => ({}));
          if (resp.ok && data?.ok) {
            replyText = data.answer || data.reply || data.text || '';
          } else {
            errReason = data?.message || `Máy chủ AI phản hồi mã lỗi ${resp.status}.`;
          }
        } catch {
          errReason = 'Không thể kết nối tới /api/ai.';
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }

        if (replyText) {
          pendingEl.innerHTML = `🤖 <b>Trợ lý AI Phúc K9:</b>\n${esc(replyText)}`;
        } else {
          pendingEl.innerHTML = `⚠️ <b>AI Tutor tạm chưa phản hồi trực tiếp</b> (${esc(errReason)})\n\n💡 Gợi ý tự tra nhanh:\n1) Tìm dạng toán/lý thuyết trong <b>Video Bài Giảng & Lý Thuyết</b>;\n2) Mở <b>Bảng Tuần Hoàn</b> hoặc <b>Flashcard 3D</b> nếu cần tra nhanh công thức;\n3) Thử làm đề tương ứng ở <b>Phòng Luyện Đề</b> để xem lời giải chi tiết.`;
        }
        box.scrollTop = box.scrollHeight;
        typeset(box);
      }
    });

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
      } else if ((e.key === 'Enter' || e.key === ' ') && e.target?.id === 'pk9-brand-player-poster') {
        e.preventDefault();
        startBrandedLectureVideo();
      } else if (e.key === 'Escape') {
        closeAuthModal();
        closeOnboardingModal();
        closeFeedbackModal();
        document.getElementById('pk9-cmd-modal')?.classList.remove('open');
        closeInAppViewer();
        if (APP.kcFullscreen) {
          APP.kcFullscreen = false;
          if (APP.activeTab === 'khoa-chui') renderKhoaChuiTab();
        }
      }
    });
  }

  function syncMobileScrollLock() {
    const sidebarOpen = Boolean(document.getElementById('pk9-sidebar')?.classList.contains('mobile-open'));
    const installOpen = Boolean(document.getElementById('pk9-install-modal'));
    const locked = sidebarOpen || installOpen;
    document.body.classList.toggle('pk9-scroll-lock', locked);
    document.body.style.overflow = locked ? 'hidden' : '';
  }

  function updateInstallButtonUI() {
    const standalone = APP.isStandalone
      || Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches)
      || window.navigator?.standalone === true;
    APP.isStandalone = standalone;
    const btn = document.getElementById('pk9-install-app-btn');
    if (btn) {
      btn.classList.toggle('installed', standalone);
      if (standalone) {
        btn.innerHTML = '✓ <span class="pk9-hide-compact">Đã cài </span><span>App</span>';
        btn.title = 'Đang chạy ở chế độ ứng dụng độc lập';
      } else if (APP.deferredInstallPrompt) {
        btn.innerHTML = '📲 <span class="pk9-hide-compact">Cài </span><span>App</span>';
        btn.title = 'Cài đặt web thành ứng dụng trên điện thoại';
      } else {
        btn.innerHTML = '📲 <span class="pk9-hide-compact">Tải </span><span>App</span>';
        btn.title = 'Hướng dẫn cài ứng dụng lên màn hình chính';
      }
    }
  }

  function closeInstallAppModal() {
    const existing = document.getElementById('pk9-install-modal');
    if (existing) existing.remove();
    syncMobileScrollLock();
  }

  function openInstallAppModal() {
    closeInstallAppModal();
    const ua = navigator.userAgent || '';
    const isInApp = /FBAN|FBAV|FB_IAB|Instagram|Threads|Barcelona|Zalo|Line|MicroMessenger|TikTok/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isDark = document.documentElement.classList.contains('dark');
    const standalone = APP.isStandalone
      || Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches)
      || window.navigator?.standalone === true;

    const surface = isDark ? '#0f172a' : '#ffffff';
    const textMain = isDark ? '#f1f5f9' : '#0f172a';
    const textSub = isDark ? '#94a3b8' : '#475569';
    const cardBg = isDark ? '#1e293b' : '#f8fafc';
    const borderCol = isDark ? 'rgba(148,163,184,0.22)' : '#e2e8f0';

    const modal = document.createElement('div');
    modal.id = 'pk9-install-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.68);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="pk9-install-title" style="width:100%;max-width:460px;max-height:90vh;overflow-y:auto;background:${surface};color:${textMain};border:1px solid ${borderCol};border-radius:20px;padding:1.25rem 1.3rem;box-shadow:0 24px 60px rgba(0,0,0,0.35);">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;margin-bottom:0.85rem;">
          <div>
            <h3 id="pk9-install-title" style="margin:0;font-size:1.12rem;font-weight:800;line-height:1.35;">📲 Tải & Cài App Học Cùng Phúc K9</h3>
            <p style="margin:0.25rem 0 0;font-size:0.84rem;color:${textSub};line-height:1.45;">Học toàn màn hình như app thật, mở nhanh từ màn hình chính trên iPhone & Android.</p>
          </div>
          <button type="button" data-close-install-modal="1" aria-label="Đóng" style="flex:0 0 auto;min-width:38px;min-height:38px;border-radius:10px;border:1px solid ${borderCol};background:${cardBg};color:${textMain};font-weight:700;cursor:pointer;">✕</button>
        </div>

        ${standalone ? `
          <div style="padding:0.85rem 1rem;border-radius:14px;background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.35);color:#10b981;font-weight:700;font-size:0.9rem;margin-bottom:0.85rem;">
            ✅ Bạn đang mở web ở chế độ Ứng dụng độc lập (PWA) rồi!
          </div>
        ` : ''}

        ${APP.deferredInstallPrompt ? `
          <button type="button" class="pk9-btn-exam-primary" data-trigger-native-install="1" style="width:100%;justify-content:center;padding:0.8rem 1rem;font-size:0.95rem;margin-bottom:0.85rem;">
            📲 Cài Đặt Ứng Dụng Ngay (1 chạm)
          </button>
        ` : ''}

        ${isInApp ? `
          <div style="padding:0.85rem 0.95rem;border-radius:14px;background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.38);margin-bottom:0.85rem;">
            <div style="font-weight:800;font-size:0.88rem;color:#d97706;margin-bottom:0.35rem;">⚠️ Đang mở trong trình duyệt nội bộ (Threads / FB / Zalo)</div>
            <div style="font-size:0.82rem;color:${textSub};line-height:1.5;margin-bottom:0.65rem;">Trình duyệt trong app chặn tính năng cài App & tải PDF. Hãy bấm nút dưới để sao chép link rồi mở bằng <b>Safari</b> (iPhone) hoặc <b>Chrome</b> (Android).</div>
            <button type="button" class="pk9-btn-exam-primary" data-copy-app-link="1" style="width:100%;justify-content:center;">
              📋 Sao chép link mở Safari / Chrome
            </button>
          </div>
        ` : `
          <button type="button" class="pk9-btn-exam-ghost" data-copy-app-link="1" style="width:100%;justify-content:center;margin-bottom:0.85rem;">
            📋 Sao chép link mở Safari / Chrome
          </button>
        `}

        <div style="display:grid;gap:0.65rem;">
          <div style="padding:0.8rem 0.9rem;border-radius:14px;background:${cardBg};border:1px solid ${borderCol};${isIOS ? 'box-shadow:0 0 0 2px rgba(59,130,246,0.35);' : ''}">
            <div style="font-weight:800;font-size:0.88rem;margin-bottom:0.3rem;">🍎 Trên iPhone / iPad (Safari)</div>
            <ol style="margin:0;padding-left:1.15rem;font-size:0.82rem;color:${textSub};line-height:1.55;">
              <li>Mở web bằng trình duyệt <b>Safari</b>.</li>
              <li>Chạm biểu tượng <b>Chia sẻ (ô vuông mũi tên lên)</b> ở thanh dưới.</li>
              <li>Chọn <b>"Thêm vào MH chính" (Add to Home Screen)</b> → <b>Thêm</b>.</li>
            </ol>
          </div>

          <div style="padding:0.8rem 0.9rem;border-radius:14px;background:${cardBg};border:1px solid ${borderCol};${!isIOS ? 'box-shadow:0 0 0 2px rgba(16,185,129,0.3);' : ''}">
            <div style="font-weight:800;font-size:0.88rem;margin-bottom:0.3rem;">🤖 Trên Android / Chrome / Edge</div>
            <ol style="margin:0;padding-left:1.15rem;font-size:0.82rem;color:${textSub};line-height:1.55;">
              <li>Mở web bằng <b>Chrome</b> hoặc <b>Edge</b>.</li>
              <li>Bấm nút <b>📲 Cài Đặt Ứng Dụng Ngay</b> ở trên (nếu có) hoặc bấm menu <b>⋮</b> góc phải.</li>
              <li>Chọn <b>"Cài đặt ứng dụng" / "Thêm vào màn hình chính"</b>.</li>
            </ol>
          </div>
        </div>

        <div style="margin-top:0.9rem;display:flex;justify-content:flex-end;">
          <button type="button" class="pk9-btn-exam-ghost" data-close-install-modal="1">Đóng hướng dẫn</button>
        </div>
      </div>
    `;
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeInstallAppModal();
    });
    document.body.appendChild(modal);
    syncMobileScrollLock();
  }

  function initMobileAndPwaHelpers() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    updateInstallButtonUI();

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      APP.deferredInstallPrompt = e;
      updateInstallButtonUI();
    });

    window.addEventListener('appinstalled', () => {
      APP.deferredInstallPrompt = null;
      APP.isStandalone = true;
      closeInstallAppModal();
      updateInstallButtonUI();
    });

    const scrollTopBtn = document.getElementById('pk9-mob-scroll-top');
    if (scrollTopBtn) {
      let scrollRaf = 0;
      const onScroll = () => {
        if (scrollRaf) return;
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0;
          scrollTopBtn.classList.toggle('visible', window.scrollY > 360);
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const sidebarEl = document.getElementById('pk9-sidebar');
    if (sidebarEl) {
      if (typeof MutationObserver !== 'undefined') {
        new MutationObserver(() => syncMobileScrollLock()).observe(sidebarEl, {
          attributes: true,
          attributeFilter: ['class'],
        });
      }
      let sbStartX = 0;
      let sbStartY = 0;
      sidebarEl.addEventListener('touchstart', (ev) => {
        if (!ev.touches || ev.touches.length !== 1) return;
        sbStartX = ev.touches[0].clientX;
        sbStartY = ev.touches[0].clientY;
      }, { passive: true });
      sidebarEl.addEventListener('touchend', (ev) => {
        if (!sidebarEl.classList.contains('mobile-open') || !ev.changedTouches || !ev.changedTouches.length) return;
        const dx = ev.changedTouches[0].clientX - sbStartX;
        const dy = ev.changedTouches[0].clientY - sbStartY;
        if (dx < -55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          sidebarEl.classList.remove('mobile-open');
          document.getElementById('pk9-sidebar-backdrop')?.classList.remove('open');
          syncMobileScrollLock();
        }
      }, { passive: true });
    }

    let fcStartX = 0;
    let fcStartY = 0;
    let fcSkipSwipe = false;
    document.addEventListener('touchstart', (ev) => {
      const scene = ev.target?.closest?.('.pk9-fc-scene');
      if (!scene || !ev.touches || ev.touches.length !== 1) {
        fcSkipSwipe = true;
        return;
      }
      const mjx = ev.target.closest('mjx-container');
      fcSkipSwipe = Boolean(mjx && mjx.scrollWidth > mjx.clientWidth + 6);
      fcStartX = ev.touches[0].clientX;
      fcStartY = ev.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (ev) => {
      if (fcSkipSwipe || !ev.changedTouches || !ev.changedTouches.length) return;
      const scene = ev.target?.closest?.('.pk9-fc-scene');
      if (!scene) return;
      const dx = ev.changedTouches[0].clientX - fcStartX;
      const dy = ev.changedTouches[0].clientY - fcStartY;
      if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) {
          document.querySelector('[data-fc-next]')?.click();
        } else {
          document.querySelector('[data-fc-prev]')?.click();
        }
      }
    }, { passive: true });
  }

  function getVisitorClientId() {
    try {
      let vid = localStorage.getItem('pk9_visitor_id') || '';
      if (!/^[a-f0-9-]{20,80}$/i.test(vid)) {
        if (window.crypto?.randomUUID) {
          vid = window.crypto.randomUUID();
        } else if (window.crypto?.getRandomValues) {
          const b = new Uint8Array(16);
          window.crypto.getRandomValues(b);
          b[6] = (b[6] & 0x0f) | 0x40;
          b[8] = (b[8] & 0x3f) | 0x80;
          const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
          vid = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
        }
        if (vid) localStorage.setItem('pk9_visitor_id', vid);
      }
      return vid;
    } catch {
      return '';
    }
  }

  function getSessionTabId() {
    try {
      let sid = sessionStorage.getItem('pk9_session_id') || '';
      if (!sid) {
        sid = window.crypto?.randomUUID ? window.crypto.randomUUID() : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem('pk9_session_id', sid);
      }
      return sid;
    } catch {
      return '';
    }
  }

  let telemetryBooted = false;
  function trackAnalyticsEvent(event = 'pageview', tabOverride = '') {
    try {
      const vid = getVisitorClientId();
      const sid = getSessionTabId();
      const coarse = Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
      const minW = Math.min(window.innerWidth || 9999, screen?.width || 9999);
      const isMob = typeof navigator.userAgentData?.mobile === 'boolean'
        ? navigator.userAgentData.mobile
        : (coarse && minW <= 900);
      const requestedTab = tabOverride || APP.activeTab || 'home';
      const safeReportTab = (requestedTab === 'admin' && !isClientVerifiedAdmin()) ? 'home' : requestedTab;
      const payload = {
        visitor_id: vid,
        session_id: sid,
        event,
        path: location.pathname || '/',
        tab: safeReportTab,
        ref: event === 'pageview' ? (document.referrer || '') : '',
        mobile: isMob,
        platform_hint: navigator.userAgentData?.platform || navigator.platform || '',
        screen: (screen?.width && screen?.height) ? `${screen.width}x${screen.height}` : '',
        screen_w: Number(screen?.width || window.innerWidth || 0),
        dpr: Number(window.devicePixelRatio || 1),
        pwa: Boolean(APP.isStandalone || window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone),
        touch_points: Number(navigator.maxTouchPoints || 0)
      };
      fetch('/api/dashboard?action=track-visitor', {
        method: 'POST',
        credentials: 'include',
        keepalive: event === 'heartbeat',
        headers: { 'Content-Type': 'application/json', 'x-pk9-visitor': vid },
        body: JSON.stringify(payload)
      })
        .then(async r => {
          if (r.status === 403) {
            const d = await r.json().catch(() => ({}));
            if (d?.warning && !d?.banned) handleAdminWarningResponse(d);
            else if (d?.banned) handleBannedResponse(d);
            return null;
          }
          return r.ok ? r.json() : null;
        })
        .then(d => {
          if (d?.visitor_id && /^[a-f0-9-]{20,80}$/i.test(d.visitor_id)) {
            try { localStorage.setItem('pk9_visitor_id', d.visitor_id); } catch {}
          }
        })
        .catch(() => {});
    } catch {}
  }

  function applyPcSidebarCollapsed(collapsed, { persist = true } = {}) {
    const next = Boolean(collapsed);
    APP.sidebarCollapsed = next;
    const shell = document.querySelector('.pk9-shell');
    const sb = document.getElementById('pk9-sidebar');
    if (shell) shell.classList.toggle('sidebar-collapsed', next);
    if (sb) sb.classList.toggle('pc-collapsed', next);
    document.querySelectorAll('[data-toggle-pc-sidebar]').forEach((btn) => {
      btn.setAttribute('aria-expanded', next ? 'false' : 'true');
      btn.setAttribute('title', next ? 'Mở rộng thanh bên (PC)' : 'Thu gọn thanh bên (PC)');
      btn.setAttribute('aria-label', next ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên');
      btn.classList.toggle('is-collapsed', next);
    });
    if (persist) {
      try { localStorage.setItem('pk9_pc_sidebar_collapsed', next ? '1' : '0'); } catch {}
    }
  }

  function runSmoothVisualTransition(updateDomFn) {
    if (typeof updateDomFn !== 'function') return;
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && typeof document.startViewTransition === 'function') {
      try {
        document.startViewTransition(() => {
          updateDomFn();
        });
        return;
      } catch {}
    }
    updateDomFn();
  }

  function initSmoothMotionHelpers() {
    if (window.__pk9MotionBooted) return;
    window.__pk9MotionBooted = true;
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // 0) Pause CSS animations automatically when browser tab is backgrounded
    document.addEventListener('visibilitychange', () => {
      document.documentElement.classList.toggle('pk9-doc-hidden', document.hidden);
    }, { passive: true });

    // 1) Desktop pointer-only RAF-throttled spotlight glow (--mx / --my) — skip heavy SVG shop cards
    const finePointer = typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (finePointer) {
      let pendingEv = null;
      let rafId = 0;
      let lastCard = null;
      const flushSpotlight = () => {
        rafId = 0;
        if (!pendingEv) return;
        const card = pendingEv.target?.closest?.('.pk9-card, .pk9-exam-card');
        if (lastCard && lastCard !== card) {
          lastCard.style.removeProperty('--mx');
          lastCard.style.removeProperty('--my');
        }
        if (card) {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${Math.round(pendingEv.clientX - rect.left)}px`);
          card.style.setProperty('--my', `${Math.round(pendingEv.clientY - rect.top)}px`);
        }
        lastCard = card || null;
        pendingEv = null;
      };
      document.addEventListener('pointermove', (ev) => {
        pendingEv = ev;
        if (!rafId) rafId = requestAnimationFrame(flushSpotlight);
      }, { passive: true });
      document.addEventListener('pointerleave', () => {
        if (lastCard) {
          lastCard.style.removeProperty('--mx');
          lastCard.style.removeProperty('--my');
          lastCard = null;
        }
      }, { passive: true });
    }

    // 2) Passive IntersectionObserver scroll reveal for active-tab below-fold cards (batched reads, zero layout thrash)
    if (typeof IntersectionObserver !== 'undefined') {
      const revealSelector = '.pk9-tab-pane.active .pk9-grid-3 > .pk9-card, .pk9-tab-pane.active .pk9-grid-4 > .pk9-card, .pk9-tab-pane.active .pk9-exam-grid > .pk9-exam-card';
      const io = new IntersectionObserver((entries) => {
        for (const ent of entries) {
          if (ent.isIntersecting) {
            ent.target.classList.remove('pk9-scroll-wait');
            ent.target.classList.add('pk9-inview');
            io.unobserve(ent.target);
          }
        }
      }, { rootMargin: '0px 0px -36px 0px', threshold: 0.04 });

      const scanCards = () => {
        const vh = window.innerHeight || 800;
        const candidates = [];
        document.querySelectorAll(revealSelector).forEach((el) => {
          if (el.dataset.pk9Obs !== '1') candidates.push(el);
        });
        if (!candidates.length) return;
        const tops = candidates.map(el => el.getBoundingClientRect().top);
        for (let i = 0; i < candidates.length; i++) {
          const el = candidates[i];
          el.dataset.pk9Obs = '1';
          if (tops[i] > vh + 40) {
            el.classList.add('pk9-scroll-wait');
            io.observe(el);
          }
        }
      };

      const contentRoot = document.getElementById('main-content');
      if (contentRoot && typeof MutationObserver !== 'undefined') {
        let scanTimer = 0;
        new MutationObserver(() => {
          if (scanTimer) return;
          scanTimer = setTimeout(() => {
            scanTimer = 0;
            scanCards();
          }, 90);
        }).observe(contentRoot, { childList: true, subtree: true });
      }
      scanCards();
    }
  }

  async function initApp() {
    try {
      const savedTheme = localStorage.getItem('pk9_theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      const themeBtn = document.querySelector('[data-toggle-theme]');
      if (themeBtn) {
        themeBtn.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
      }
      const savedSidebarCollapsed = localStorage.getItem('pk9_pc_sidebar_collapsed') === '1';
      applyPcSidebarCollapsed(savedSidebarCollapsed, { persist: false });
      document.querySelectorAll('#pk9-sidebar .pk9-nav-item').forEach((btn) => {
        if (!btn.getAttribute('title')) {
          const labelSpan = btn.querySelector('.pk9-nav-item-left > span:not(.pk9-nav-icon)');
          const txt = (labelSpan?.textContent || btn.textContent || '').trim();
          if (txt) btn.setAttribute('title', txt);
        }
      });
    } catch {}

    initMobileAndPwaHelpers();
    initSmoothMotionHelpers();
    loadLocalProgress();
    bindEvents();
    renderHomeTab();
    syncEcosystemCounters();
    updateHeaderAuthUI();
    enforceAdminDomHidden();
    await fetchAuthAndLeaderboard();
    syncEcosystemCounters();
    installAdminDomGuard();
    try {
      const cachedBan = JSON.parse(localStorage.getItem('pk9_ban_notice') || 'null');
      if (!APP.user && cachedBan?.banned) renderBanOverlay(cachedBan);
    } catch {}
    loadCommunityItems();
    try {
      const onbKey = APP.user?.username
        ? `pk9_onboard_member_v1_${String(APP.user.username).toLowerCase()}`
        : 'pk9_onboard_guest_v1';
      if (!localStorage.getItem(onbKey) && !document.querySelector('.pk9-ban-overlay')) {
        setTimeout(() => {
          openOnboardingModal(APP.user ? 'member' : 'guest');
        }, 420);
      }
    } catch {}

    try {
      const params = new URLSearchParams(window.location.search || '');
      const duelCode = params.get('duel');
      const tabParam = params.get('tab');
      if (duelCode && window.PK9_EXAM_CENTER?.openDuelByCode) {
        switchTab('exams', { force: true });
        window.PK9_EXAM_CENTER.openDuelByCode(duelCode);
      } else if (tabParam && ['home', 'lectures', 'exams', 'leaderboard', 'docs', 'khoa-chui', 'archive', 'flashcards', 'community', 'planner', 'ai', 'missions', 'journey', 'shop', 'periodic', 'idcard'].includes(tabParam)) {
        switchTab(tabParam, { force: true });
      }
    } catch {}

    // Ghi nhận lượt truy cập thực & thiết bị (Mobile / Desktop / Tablet / WebView) vào Admin Dashboard
    trackAnalyticsEvent('pageview', (APP.activeTab === 'admin' && !isClientVerifiedAdmin()) ? 'home' : (APP.activeTab || 'home'));
    if (!telemetryBooted) {
      telemetryBooted = true;
      setInterval(() => {
        if (document.visibilityState === 'visible') {
          trackAnalyticsEvent('heartbeat', (APP.activeTab === 'admin' && !isClientVerifiedAdmin()) ? 'home' : (APP.activeTab || 'home'));
          if (APP.user && (APP.activeTab === 'leaderboard' || APP.activeTab === 'home')) {
            refreshLeaderboard({ force: true, quiet: true });
          }
        }
      }, 30000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          trackAnalyticsEvent('heartbeat', (APP.activeTab === 'admin' && !isClientVerifiedAdmin()) ? 'home' : (APP.activeTab || 'home'));
          if (APP.user) {
            refreshLeaderboard({ force: true, quiet: true });
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(window, document);
