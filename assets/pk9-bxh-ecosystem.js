/* ============================================================================
 * HỌC CÙNG PHÚC K9 — BXH TUẦN 3 TẦNG (R1), SOI HỒ SƠ CÔNG KHAI 4 TẦNG (R2),
 * TỦ KÍNH THÀNH TỰU 5 VÙNG & XUẤT .PNG 9:16 / 16:9 (R3) & 7 VÒNG LẶP KÍCH HỌC (R4)
 * ============================================================================ */
(function (window, document) {
  'use strict';

  const BXH_UI = {
    layer: 'tier1', // 'tier1' (Bảng Đấu 30) | 'tier2_weekly' (Toàn Hệ Tuần) | 'tier2_alltime' (Toàn Hệ EXP) | 'tier3' (4 Phó Bảng) | 'legacy_exam' (Cao Thủ Đề)
    grade: '',
    division: '',
    subBoard: 'arena_9plus',
    showRewardLookup: false,
    search: '',
    // R3 Tủ Kính Thành Tựu state
    selectedSlotTarget: null, // { type: 'hero' } | { type: 'showcase', index: 0..5 }
    vaultStatusFilter: 'ALL', // 'ALL' | 'unlocked' | 'locked'
    vaultTypeFilter: 'ALL',   // 'ALL' | 'weekly_fx' | 'permanent' | 'seasonal'
    vaultSourceFilter: 'ALL', // 'ALL' | 'bxh' | 'exam2018' | 'pomodoro' | 'iupac'
    visitorPreviewMode: false,
    // R4 Pomodoro Cộng Hưởng state
    pomoCoStudy: true,
    pomoStatusTag: '📝 Đang giải đề 2018',
    pomoCheckinNote: '',
    pomoMaxIdleSec: 0,
    pomoLastActiveTs: Date.now(),
    // R4 AI Vision 2 câu biến thể
    aiQuizOpen: false,
    aiQuizAnswers: {},
    aiCurrentPair: [],
    aiUsedIds: []
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toast(msg, type = 'info') {
    if (typeof window.PK9_TOAST === 'function') window.PK9_TOAST(msg, type);
  }

  function getUser() {
    return typeof window.PK9_GET_USER === 'function' ? window.PK9_GET_USER() : null;
  }

  function getRpg() {
    return window.PK9_RPG?.getState ? window.PK9_RPG.getState() : (window.PK9_RPG_STATE || {});
  }

  function getLbData() {
    return typeof window.PK9_GET_LB_DATA === 'function' ? window.PK9_GET_LB_DATA() : (window.PK9_LB_DATA || {});
  }

  const VN_PROVINCE_LIST = [
    'Hà Nội', 'TP.HCM', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Huế', 'Thừa Thiên Huế',
    'An Giang', 'Bà Rịa - Vũng Tàu', 'Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh',
    'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng',
    'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
    'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Khánh Hòa',
    'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An',
    'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình',
    'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh',
    'Thái Bình', 'Thái Nguyên', 'Thanh Hóa', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
    'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
  ];

  function formatSchoolForPreview(rawSchool, grade = '2K9', schoolVisibility = 'province_grade', isAnon = false) {
    if (isAnon || schoolVisibility === 'hide_all') {
      return 'Đã ẩn Trường & Địa phương (Safe-by-Default)';
    }
    const cleanRaw = String(rawSchool || '').trim();
    if (schoolVisibility === 'public_all') {
      return cleanRaw || `Học viên Hệ ${grade} • Học Cùng Phúc K9`;
    }
    const lower = cleanRaw.toLowerCase();
    const matchedProv = VN_PROVINCE_LIST.find(p => lower.includes(p.toLowerCase()));
    if (matchedProv) return `Khu vực ${matchedProv} • Hệ ${grade}`;
    return `Khu vực THPT • Hệ ${grade}`;
  }

  function renderWeeklySettlementAndRevivalHtml(myBxh, user, divTiers) {
    const parts = [];
    const st = myBxh?.last_weekly_settlement;
    if (st && st.week_key) {
      let dismissed = false;
      try {
        dismissed = localStorage.getItem(`pk9_settled_seen_${String(user?.username || '').toLowerCase()}_${st.week_key}`) === '1';
      } catch {}
      if (!dismissed) {
        const prevObj = divTiers.find(t => t.id === st.prev_tier) || { icon: '🥉', name: st.prev_tier || 'Hạng Đồng' };
        const newObj = divTiers.find(t => t.id === st.new_tier) || prevObj;
        const rw = st.reward || {};
        const rwParts = [];
        if (rw.gold) rwParts.push(`+${rw.gold} 🪙`);
        if (rw.diamonds) rwParts.push(`+${rw.diamonds} 💎`);
        if (rw.iupac_tickets) rwParts.push(`+${rw.iupac_tickets} 🎫 Vé IUPAC`);
        if (rw.iupac_shards) rwParts.push(`+${rw.iupac_shards} Mảnh Vé`);
        if (rw.shop_shards) rwParts.push(`+${rw.shop_shards} 🧩 Mảnh 3D`);
        if (rw.gold_charm) rwParts.push(`+${rw.gold_charm} 🧿 Bùa Vàng`);
        if (rw.xp_boost) rwParts.push(`+${rw.xp_boost} 🚀 Vé x2 EXP`);
        if (rw.island_flags) rwParts.push(`+${rw.island_flags} 🚩 Cờ Vùng Đảo`);
        const rwTempTitle = typeof rw.temp_title === 'string' ? rw.temp_title : (rw.temp_title?.text || rw.temp_title?.name || '');
        if (rwTempTitle) rwParts.push(`👑 Danh hiệu 7d: ${rwTempTitle}`);
        const l2List = Array.isArray(st.layer2_rewards) ? st.layer2_rewards : [];
        const l2Summary = l2List.map(item => {
          const lp = [];
          if (item.gold) lp.push(`+${item.gold}🪙`);
          if (item.diamonds) lp.push(`+${item.diamonds}💎`);
          if (item.iupac_tickets) lp.push(`+${item.iupac_tickets}🎫`);
          if (item.shop_shards) lp.push(`+${item.shop_shards}🧩`);
          if (item.island_flags) lp.push(`+${item.island_flags}🚩`);
          const itTitle = typeof item.temp_title === 'string' ? item.temp_title : (item.temp_title?.text || item.temp_title?.name || '');
          if (itTitle) lp.push(`👑 ${itTitle}`);
          return `${item.label || item.source || 'Vinh danh'}: ${lp.join(', ') || 'Vinh danh Top'}`;
        });
        parts.push(`
          <div class="pk9-card pk9-settlement-banner" style="padding:0.95rem 1.15rem;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.6rem;flex-wrap:wrap;">
              <div>
                <div style="font-size:0.74rem;font-weight:900;color:#d97706;text-transform:uppercase;">🎉 TỔNG KẾT TUẦN BXH ${esc(st.week_key)} • HỆ ${esc(st.grade || '2K9')}</div>
                <div style="font-weight:900;font-size:1rem;margin:0.2rem 0;">
                  Hạng #${Number(st.rank || 1)}/${Number(st.total || 30)} (${Number(st.dxh || 0)} ĐXH) • ${esc(st.standing?.label || 'Hoàn tất chu kỳ tuần')}
                </div>
                <div style="font-size:0.8rem;color:var(--pk9-text-muted);line-height:1.45;">
                  Hạng Đấu: <b>${prevObj.icon} ${esc(prevObj.name)}</b> → <b>${newObj.icon} ${esc(newObj.name)}</b>
                  ${st.shield_used ? ' • <b style="color:#0284c7;">🛡️ Đã kích hoạt Khiên Bảo Vệ Hạng!</b>' : ''}
                  ${rwParts.length ? `<br/>🎁 <b>Quà Bảng Đấu (Tầng 1):</b> ${rwParts.map(s => esc(s)).join(' · ')}` : ''}
                  ${l2Summary.length ? `<br/>🏅 <b>Vinh danh Toàn Hệ & Phó Bảng (Tầng 2–3):</b> ${l2Summary.map(s => esc(s)).join(' • ')}` : ''}
                </div>
              </div>
              <button type="button" class="pk9-admin-btn-xs" data-bxh-dismiss-settlement="${esc(st.week_key)}">✓ Đã nhận thông báo</button>
            </div>
          </div>
        `);
      }
    }
    const hib = myBxh?.hibernation;
    if (hib && hib.revival_active) {
      const revDxh = Math.min(500, Math.max(0, Number(hib.revival_dxh || 0)));
      const revPct = Math.min(100, Math.round((revDxh / 500) * 100));
      const restoreObj = divTiers.find(t => t.id === hib.restore_tier) || { icon: '🏅', name: hib.restore_tier || 'Hạng cũ' };
      parts.push(`
        <div class="pk9-card pk9-revival-banner" style="padding:0.9rem 1.15rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.4rem;">
            <strong style="font-size:0.92rem;color:#059669;">🦅 NHIỆM VỤ HỒI SINH (7 NGÀY LĂN) — KHÔI PHỤC ${restoreObj.icon} ${esc(restoreObj.name)}</strong>
            <span class="pk9-badge pk9-badge-verified" style="font-size:0.72rem;">${hib.pending_restore_next_monday ? '✅ Đã đạt • Khôi phục 00:00 Thứ Hai' : `${revDxh} / 500 ĐXH (${revPct}%)`}</span>
          </div>
          <div class="pk9-topic-track" style="height:0.42rem;margin-bottom:0.35rem;">
            <div class="pk9-topic-fill" style="width:${hib.pending_restore_next_monday ? 100 : revPct}%;"></div>
          </div>
          <div style="font-size:0.76rem;color:var(--pk9-text-muted);">
            ${hib.pending_restore_next_monday
              ? `🎉 Tuyệt vời! Bạn đã hoàn thành 500 ĐXH Hồi Sinh & nhận tiến độ Badge <b>Phượng Hoàng Trở Lại</b>. Hạng <b>${esc(restoreObj.name)}</b> sẽ tự động khôi phục vào chu kỳ Thứ Hai kế tiếp!`
              : `Đạt đủ <b>500 ĐXH</b> trong 7 ngày liên tiếp kể từ ngày học lại để khôi phục ngay <b>${esc(restoreObj.name)}</b> (Hệ ${esc(hib.restore_grade || '2K9')}) & mở Badge <b>Phượng Hoàng Trở Lại</b>!`}
          </div>
        </div>
      `);
    }
    return parts.join('');
  }

  async function rpgPost(action, body = {}) {
    if (window.PK9_RPG?.rpgPost) {
      return await window.PK9_RPG.rpgPost(action, body);
    }
    return { ok: false };
  }

  // Lưu mã giới thiệu QR Referral (?ref=[SBD] / ?card=[SBD] / /u/[SBD]) vào localStorage khi khách quét mã QR
  let _urlBootHandled = false;
  function captureUrlReferralAndProfile() {
    try {
      const search = window.location?.search || '';
      const pathname = window.location?.pathname || '';
      const params = new URLSearchParams(search);
      const uMatch = pathname.match(/^\/u\/([^/?#]+)/i);
      const sbdFromPath = uMatch && uMatch[1] ? decodeURIComponent(uMatch[1]).trim() : '';
      const cardParam = (params.get('card') || params.get('student_card') || '').trim();
      const sbdParam = (params.get('sbd') || '').trim();
      const ref = (params.get('ref') || params.get('referral') || sbdFromPath || sbdParam || (cardParam && cardParam.toLowerCase() !== 'guest' ? cardParam : '')).trim();
      if (ref) {
        localStorage.setItem('pk9_qr_referral_sbd', String(ref).trim());
      }
      if (_urlBootHandled) return;
      if (sbdFromPath) {
        _urlBootHandled = true;
        setTimeout(() => {
          openPublicProfileInspector({ sbd: sbdFromPath, mode: 'full' });
        }, 120);
      } else if (cardParam) {
        _urlBootHandled = true;
        setTimeout(() => {
          openPublicProfileInspector({
            username: cardParam,
            sbd: sbdParam,
            name: params.get('n') || params.get('name') || '',
            grade: params.get('g') || params.get('grade') || '',
            mode: 'full'
          });
        }, 120);
      }
    } catch {}
  }

  // ==========================================================================
  // 1. R1: BẢNG XẾP HẠNG TUẦN 3 TẦNG, 4 RƯƠNG MỐC, RIVAL PIN & STUDY SQUAD
  // ==========================================================================
  function renderLeaderboardTabEnhanced() {
    const root = document.getElementById('tab-leaderboard');
    if (!root) return;
    const user = getUser();
    const lbData = getLbData();

    if (!user) {
      let savedRef = '';
      try { savedRef = localStorage.getItem('pk9_qr_referral_sbd') || ''; } catch {}
      root.innerHTML = `
        <div class="pk9-exam-hub">
          <div class="pk9-exam-hero">
            <div class="pk9-exam-hero-grid">
              <div>
                <div style="display:inline-flex;align-items:center;gap:0.45rem;padding:0.32rem 0.85rem;border-radius:999px;background:rgba(245,158,11,0.22);border:1px solid rgba(245,158,11,0.45);font-size:0.75rem;font-weight:800;margin-bottom:0.8rem;">
                  <span>🔒 ĐẤU TRƯỜNG BẢNG VÀNG PHÚC K9 • KHÓA VỚI TÀI KHOẢN KHÁCH (K9-GUEST)</span>
                </div>
                <h2 style="font-size:1.65rem;font-weight:900;margin:0 0 0.55rem;">
                  Đăng Nhập hoặc Đăng Ký Để Mở Khóa BXH Tuần 3 Tầng & 4 Rương Mốc!
                </h2>
                <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.92rem;line-height:1.6;">
                  Hệ thống BXH Tuần chia công bằng theo <b>5 Hệ Đào Tạo × 6 Hạng Đấu (30 học viên/bảng)</b>, tính điểm <b>ĐXH Tuần</b> học thật miễn nhiễm Bùa x2 EXP, cùng <b>24 Badges 6 Bậc</b> và <b>Tủ Kính Thành Tựu</b>.
                </p>
                ${savedRef ? `
                  <div style="margin-top:0.75rem;padding:0.65rem 0.9rem;border-radius:0.85rem;background:rgba(16,185,129,0.22);border:1px solid rgba(52,211,153,0.5);font-size:0.84rem;font-weight:700;color:#ecfdf5;">
                    🎁 Bạn đang có lời mời từ mã <b>${esc(savedRef)}</b> — Đăng ký ngay để nhận gói khởi đầu + mở khóa <b>Rương Tân Binh 9+</b>!
                  </div>
                ` : ''}
                <div style="display:flex;gap:0.65rem;flex-wrap:wrap;margin-top:1.1rem;">
                  <button type="button" class="pk9-btn-hero-main" data-open-auth="register">
                    ✨ Đăng Ký Mở Khóa BXH (+100 XP • 180 🪙 • 5 💎)
                  </button>
                  <button type="button" class="pk9-btn-hero-sec" data-open-auth="login">
                    🔑 Đăng Nhập Tài Khoản
                  </button>
                </div>
              </div>
              <div>
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.2rem;">
                  <div style="font-size:0.76rem;font-weight:800;color:#fde047;text-transform:uppercase;margin-bottom:0.45rem;">🎁 ĐẶC QUYỀN HỆ SINH THÁI BXH MỚI</div>
                  <ul style="margin:0;padding-left:1.1rem;font-size:0.84rem;color:rgba(255,255,255,0.92);line-height:1.65;">
                    <li><b>Bảng Đấu 30 người</b> cùng Hệ & Hạng Đấu (Đồng ×0.4 → Huyền Thoại ×3.2).</li>
                    <li><b>4 Rương Mốc Cá Nhân Tuần</b> (250 / 550 / 1.100 / 2.000 ĐXH) nhận tới <b>480 🪙 + 7 💎 + 3 Vé IUPAC</b>.</li>
                    <li><b>Soi Hồ Sơ 3D & Tủ Kính Thành Tựu</b>, xuất thẻ <b>STUDENT ID .PNG</b> 9:16 & 16:9.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const rpg = getRpg();
    const myBxh = lbData.my_bxh_status || {};
    const grades5 = Array.isArray(lbData.grades_5) && lbData.grades_5.length ? lbData.grades_5 : [
      { id: '2K9', label: '2K9 (Lớp 12)', shortLabel: '2K9 (12)' },
      { id: '2K8', label: '2K8 Pro', shortLabel: '2K8 Pro' },
      { id: 'DGNL', label: 'ĐGNL / ĐGTD', shortLabel: 'ĐGNL / ĐGTD' },
      { id: '2K11', label: '2K11 (Lớp 10)', shortLabel: '2K11 (10)' },
      { id: '2K12', label: '2K12 (Vào 10)', shortLabel: '2K12 (9→10)' }
    ];
    const divTiers = Array.isArray(lbData.division_tiers) && lbData.division_tiers.length ? lbData.division_tiers : [
      { id: 'bronze', name: 'Hạng Đồng', icon: '🥉', multiplier: 0.4 },
      { id: 'silver', name: 'Hạng Bạc', icon: '🥈', multiplier: 0.6 },
      { id: 'gold', name: 'Hạng Vàng', icon: '🥇', multiplier: 1.0 },
      { id: 'platinum', name: 'Hạng Bạch Kim', icon: '💠', multiplier: 1.6 },
      { id: 'diamond', name: 'Hạng Kim Cương', icon: '💎', multiplier: 2.5 },
      { id: 'legend', name: 'Hạng Huyền Thoại', icon: '👑', multiplier: 3.2 }
    ];
    const subDefs = Array.isArray(lbData.sub_leaderboards_def) && lbData.sub_leaderboards_def.length ? lbData.sub_leaderboards_def : [
      { id: 'arena_9plus', name: 'Đấu Trường 9+ & 1v1', subtitle: 'Chiến Thần Thực Chiến', icon: '⚔️', requirement: 'Tối thiểu 1 kỳ Đấu Trường 9+ hoặc 3 trận 1v1 hợp lệ' },
      { id: 'exam_gdpt2018', name: 'Săn Đề GDPT 2018', subtitle: 'Bậc Thầy Luyện Đề', icon: '🎯', requirement: 'Tối thiểu 3 đề chuẩn (45–90p) khác nhau với điểm TB >= 6.5' },
      { id: 'pomodoro_discipline', name: 'Pomodoro 9+ & Chăm Chỉ', subtitle: 'Chiến Binh Kỷ Luật', icon: '⏱️', requirement: 'Tối thiểu 6 phiên Pomodoro (>= 150p) + 3 ngày đủ 4/4 nhiệm vụ' },
      { id: 'weekly_surge', name: 'Bứt Phá Tuần', subtitle: 'Ngôi Sao Tăng Tốc', icon: '🚀', requirement: 'Đạt >= 400 ĐXH tuần này, mẫu số = max(TB 2 tuần trước, 300 ĐXH)' }
    ];

    const activeGrade = BXH_UI.grade || lbData.active_grade || myBxh.primary_grade || user.settings?.preferred_grade || '2K9';
    const activeDivision = BXH_UI.division || lbData.active_division || myBxh.division_tier_id || 'bronze';
    const curDivObj = divTiers.find(d => d.id === activeDivision) || divTiers[0];
    const myRank = lbData.my_rank || {};
    const isExcludedAdmin = Boolean(user.is_admin || user.role === 'admin' || myRank.excluded_from_leaderboard);

    // Chọn danh sách dòng hiển thị theo Tầng đang mở
    let activeRows = [];
    let metricTitle = 'ĐXH Tuần (Học Thật)';
    if (BXH_UI.layer === 'tier1') {
      activeRows = lbData.tier1_division?.rows || lbData.weekly_leaderboard || [];
      metricTitle = 'ĐXH Tuần & Vùng Hạng';
    } else if (BXH_UI.layer === 'tier2_weekly') {
      activeRows = lbData.tier2_system_top100?.weekly_top100 || lbData.weekly_leaderboard || [];
      metricTitle = 'ĐXH Tuần Toàn Hệ';
    } else if (BXH_UI.layer === 'tier2_alltime') {
      activeRows = lbData.tier2_system_top100?.alltime_top100 || lbData.leaderboard || [];
      metricTitle = 'Tổng EXP Tích Lũy';
    } else if (BXH_UI.layer === 'tier3') {
      activeRows = lbData.tier3_sub_leaderboards?.[BXH_UI.subBoard] || [];
      metricTitle = 'Chỉ Số Chuyên Đề Tuần';
    } else {
      activeRows = lbData.exam_leaderboard || [];
      metricTitle = 'Đỉnh Điểm Luyện Đề';
    }

    const onlyStudents = (activeRows || []).filter(r => !r.is_admin && r.role !== 'admin');
    const q = BXH_UI.search.trim().toLowerCase();
    const filteredRows = onlyStudents.filter(r => {
      if (!q) return true;
      return `${r.display_name || ''} ${r.username || ''} ${r.sbd || ''} ${r.school || ''} ${r.grade || ''}`.toLowerCase().includes(q);
    });

    const top3 = onlyStudents.slice(0, 3);
    const podiumSlots = [
      { rank: 2, row: top3.find(x => x.rank === 2) || top3[1] || null, crown: '🥈', title: 'Á Quân #2' },
      { rank: 1, row: top3.find(x => x.rank === 1) || top3[0] || null, crown: '👑', title: 'Thủ Khoa #1' },
      { rank: 3, row: top3.find(x => x.rank === 3) || top3[2] || null, crown: '🥉', title: 'Quý Quân #3' }
    ];

    const chests = Array.isArray(myBxh.chests) && myBxh.chests.length ? myBxh.chests : [
      { id: 'chest_1', num: 1, shortName: 'Mốc 1 (250 ĐXH)', targetDxh: 250, desc: '40 🪙 + 1 🧿 Bùa Vàng', unlocked: false, claimed: false },
      { id: 'chest_2', num: 2, shortName: 'Mốc 2 (550 ĐXH)', targetDxh: 550, desc: '80 🪙 + 1 💎 + 1 🎫 Vé IUPAC', unlocked: false, claimed: false },
      { id: 'chest_3', num: 3, shortName: 'Mốc 3 (1.100 ĐXH)', targetDxh: 1100, desc: '140 🪙 + 2 💎 + 1 🚀 x2 EXP + 1 🧩 Mảnh 3D', unlocked: false, claimed: false },
      { id: 'chest_4', num: 4, shortName: 'Mốc 4 (2.000 ĐXH)', targetDxh: 2000, desc: '220 🪙 + 4 💎 + 2 🎫 Vé IUPAC + 1 🧩 Mảnh 3D + Badge 2K', unlocked: false, claimed: false }
    ];

    const myDxhWeek = Number(myBxh.dxh_week ?? 0);
    const myDxhToday = Number(myBxh.dxh_today ?? 0);
    const dailyCap = Number(myBxh.daily_cap || 750);
    const countdown = rpg.exam_countdown || { bannerText: '⏳ Nước rút 100 Ngày Cuối Mùa Thi 9+' };

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <!-- HERO BANNER BXH TUẦN 3 TẦNG -->
        <div class="pk9-exam-hero">
          <div class="pk9-exam-hero-grid">
            <div>
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.45rem;margin-bottom:0.75rem;">
                <div style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.3rem 0.8rem;border-radius:999px;background:rgba(245,158,11,0.22);border:1px solid rgba(245,158,11,0.45);font-size:0.74rem;font-weight:800;">
                  <span>🏆 BXH TUẦN 3 TẦNG • ${esc(lbData.week_key || 'Chu kỳ Thứ Hai – Chủ Nhật')}</span>
                </div>
                <div class="pk9-lb-live-pill">
                  <span class="pk9-live-dot"></span>
                  <span>ĐXH Tuần Miễn Nhiễm Bùa x2 EXP • Trần Ngày ${dailyCap} ĐXH</span>
                </div>
                <span class="pk9-badge pk9-badge-hot" style="font-size:0.72rem;">${esc(countdown.bannerText)}</span>
              </div>
              <h2 style="font-size:1.58rem;font-weight:900;margin:0 0 0.45rem;">
                Đấu Trường Bảng Vàng 5 Hệ × 6 Hạng Đấu & 4 Phó Bảng Chuyên Đề
              </h2>
              <p style="margin:0;color:rgba(255,255,255,0.88);font-size:0.88rem;line-height:1.58;">
                Mỗi bảng đấu gồm <b>30 học viên</b> cùng Hệ & cùng Hạng Đấu. Bấm vào <b>bất kỳ học viên nào</b> trên Bục Vinh Danh hoặc Bảng Đấu để <b>🔍 Soi Hồ Sơ Công Khai 3D</b>, xem Tủ Kính Thành Tựu, tặng <b>🔥 Ngọn Lửa</b>, <b>📊 So sánh 1-chạm</b> hoặc <b>⚔️ Thách đấu 1v1</b>!
              </p>
              ${myBxh.is_weekend_surge ? `
                <div style="margin-top:0.65rem;padding:0.5rem 0.85rem;border-radius:0.8rem;background:linear-gradient(135deg,rgba(245,158,11,0.28),rgba(236,72,153,0.25));border:1px solid rgba(253,224,71,0.5);font-size:0.8rem;font-weight:700;color:#fef08a;">
                  ⚡ <b>WEEKEND CATCH-UP SURGE (T7–CN):</b> Trần Đề chuẩn nâng từ 3 → 4 đề/ngày • Trần tổng ngày <b>950 ĐXH</b> • Đạt >=350 ĐXH cả T7 & CN nhận +50 ĐXH thưởng chuyên cần cuối tuần!
                </div>
              ` : ''}
            </div>

            <div>
              ${isExcludedAdmin ? `
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.15rem;">
                  <div style="font-size:0.75rem;font-weight:800;color:#fda4af;text-transform:uppercase;">🛡️ QUẢN TRỊ VIÊN • NGOÀI BXH</div>
                  <div style="font-size:1.1rem;font-weight:900;margin:0.25rem 0 0.45rem;">🛡️ ${esc(user.display_name)} (@${esc(user.username)})</div>
                  <p style="margin:0 0 0.75rem;font-size:0.8rem;color:rgba(255,255,255,0.9);line-height:1.5;">
                    Tài khoản Admin được loại khỏi Bảng Đấu 30 người, Top 100 Toàn Hệ, 4 Phó Bảng và Study Squad để bảo đảm công bằng 100%.
                  </p>
                  <button type="button" class="pk9-btn-hero-main" data-nav-tab="admin" style="width:100%;justify-content:center;padding:0.5rem 0.85rem;font-size:0.82rem;">
                    🛡️ Mở Admin Dashboard
                  </button>
                </div>
              ` : `
                <div style="background:rgba(255,255,255,0.12);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,0.22);border-radius:1.25rem;padding:1.1rem;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.35rem;">
                    <span style="font-size:0.74rem;font-weight:800;color:#fde047;text-transform:uppercase;">🌟 VỊ THẾ TUẦN NÀY CỦA BẠN</span>
                    <span class="pk9-badge pk9-badge-verified" style="font-size:0.7rem;">
                      Hệ Chính: ${esc(myBxh.primary_grade || activeGrade)} ${myBxh.primary_grade_locked ? '🔒' : '🔓'}
                    </span>
                  </div>
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.55rem;">
                    <div style="font-size:1.05rem;font-weight:900;">
                      👤 ${esc(user.display_name)}
                      ${rpg.privacy?.anonymous_bxh ? `<span class="pk9-badge pk9-badge-code" style="font-size:0.68rem;">Ẩn danh #${esc(rpg.anon_sbd)}</span>` : ''}
                    </div>
                    <button type="button" class="pk9-admin-btn-xs" data-nav-tab="idcard" style="background:rgba(56,189,248,0.25);color:#fff;border:1px solid rgba(56,189,248,0.5);">
                      🏆 Khoe Tủ Kính & Thẻ .PNG ›
                    </button>
                  </div>
                  <div class="pk9-lb-myrank-grid" style="text-align:center;">
                    <div style="background:rgba(15,23,42,0.48);padding:0.55rem;border-radius:0.75rem;">
                      <strong style="display:block;font-size:1.15rem;color:#fde047;">#${myBxh.division_rank || myRank.weeklyRank || '—'}</strong>
                      <span style="font-size:0.7rem;">Bảng 30 (${esc(curDivObj.icon)} ${esc(curDivObj.name)})</span>
                    </div>
                    <div style="background:rgba(15,23,42,0.48);padding:0.55rem;border-radius:0.75rem;">
                      <strong style="display:block;font-size:1.15rem;color:#38bdf8;">${myDxhWeek} ĐXH</strong>
                      <span style="font-size:0.7rem;">Hôm nay: ${myDxhToday}/${dailyCap}</span>
                    </div>
                    <div style="background:rgba(15,23,42,0.48);padding:0.55rem;border-radius:0.75rem;">
                      <strong style="display:block;font-size:1.15rem;color:#34d399;">#${myRank.systemWeeklyRank || myRank.topRank || '—'}</strong>
                      <span style="font-size:0.7rem;">Toàn Hệ ${esc(activeGrade)}</span>
                    </div>
                  </div>
                  <div style="margin-top:0.55rem;padding-top:0.5rem;border-top:1px dashed rgba(255,255,255,0.22);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;font-size:0.73rem;">
                    <span>${esc(myBxh.standing?.label || '🛡️ Trụ hạng an toàn')}</span>
                    <span>🛡️ Khiên Bảo Vệ: <b>${Number(myBxh.rank_shield_count || 0)}</b> • 🧩 Mảnh 3D: <b>${Number(rpg.shop_shards || 0)}</b></span>
                  </div>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- TỔNG KẾT TUẦN BXH & NHIỆM VỤ HỒI SINH (NẾU CÓ) -->
        ${!isExcludedAdmin ? renderWeeklySettlementAndRevivalHtml(myBxh, user, divTiers) : ''}

        <!-- BỘ LỌC 5 HỆ ĐÀO TẠO CỐ ĐỊNH (2K9, 2K8 Pro, ĐGNL/ĐGTD, 2K11, 2K12) -->
        <div class="pk9-card" style="padding:0.85rem 1.05rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.65rem;">
            <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
              <strong style="font-size:0.82rem;color:var(--pk9-text);">🎓 Chọn Hệ Đào Tạo (5 Hệ Độc Lập):</strong>
              <div class="pk9-exam-tabs">
                ${grades5.map(g => {
                  const isAct = activeGrade === g.id;
                  const myTierInG = myBxh.division_by_grade?.[g.id] || 'bronze';
                  const tObj = divTiers.find(d => d.id === myTierInG) || divTiers[0];
                  return `
                    <button type="button" class="pk9-exam-chip ${isAct ? 'active' : ''}" data-bxh-set-grade="${esc(g.id)}">
                      ${esc(g.label)} <span style="opacity:0.85;font-size:0.72rem;">(${tObj.icon})</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
            ${!isExcludedAdmin && !myBxh.primary_grade_locked && activeGrade !== myBxh.primary_grade ? `
              <button type="button" class="pk9-btn-exam-primary" data-bxh-lock-primary-grade="${esc(activeGrade)}" style="padding:0.4rem 0.8rem;font-size:0.76rem;">
                📌 Chọn ${esc(activeGrade)} làm Hệ Chính Tuần này
              </button>
            ` : ''}
          </div>
        </div>

        <!-- LỚP 3: 4 RƯƠNG MỐC CÁ NHÂN TUẦN (250 / 550 / 1.100 / 2.000 ĐXH) -->
        <div class="pk9-card pk9-bxh-chests-card" style="padding:1rem 1.15rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;">
            <div>
              <strong style="font-size:0.95rem;display:block;">🎁 4 Rương Mốc Cá Nhân Tuần (Chạy Độc Lập Theo Nỗ Lực Bản Thân • Tổng 480 🪙 + 7 💎 + 3 Vé IUPAC)</strong>
              <span style="font-size:0.77rem;color:var(--pk9-text-muted);">
                Tiến độ tuần này của bạn: <b style="color:var(--pk9-primary);">${myDxhWeek} / 2.000 ĐXH Tuần</b> • Học đều 30–40p/ngày chắc chắn có quà dù ngoài Top 3!
              </span>
            </div>
            <button type="button" class="pk9-btn-exam-ghost" data-bxh-toggle-reward-table="1" style="padding:0.38rem 0.78rem;font-size:0.76rem;">
              ${BXH_UI.showRewardLookup ? '🔼 Ẩn Bảng Tra Quà 6 Hạng' : '📊 Xem Bảng Tra Quà 6 Hạng Đấu (×0.4 → ×3.2)'}
            </button>
          </div>
          <div class="pk9-bxh-chests-grid">
            ${chests.map(c => {
              const unlocked = myDxhWeek >= c.targetDxh;
              const claimed = Boolean(c.claimed);
              const pct = Math.min(100, Math.round((myDxhWeek / c.targetDxh) * 100));
              return `
                <div class="pk9-bxh-chest-box ${claimed ? 'is-claimed' : unlocked ? 'is-ready' : ''}">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;">
                    <strong style="font-size:0.84rem;">${claimed ? '✅' : unlocked ? '🎁' : '🔒'} ${esc(c.shortName || c.name)}</strong>
                    <span class="pk9-badge ${unlocked ? 'pk9-badge-verified' : 'pk9-badge-code'}" style="font-size:0.68rem;">${myDxhWeek}/${c.targetDxh} ĐXH</span>
                  </div>
                  <div style="font-size:0.74rem;color:var(--pk9-text-muted);margin:0.3rem 0 0.45rem;line-height:1.4;">${esc(c.desc)}</div>
                  <div class="pk9-topic-track" style="height:0.36rem;margin-bottom:0.45rem;">
                    <div class="pk9-topic-fill" style="width:${pct}%;"></div>
                  </div>
                  ${claimed ? `
                    <span class="pk9-badge pk9-badge-verified" style="width:100%;justify-content:center;padding:0.34rem;">✓ Đã nhận thưởng</span>
                  ` : unlocked ? `
                    <button type="button" class="pk9-btn-exam-primary" data-bxh-claim-chest="${esc(c.id)}" style="width:100%;padding:0.38rem 0.65rem;font-size:0.76rem;">
                      🎁 Mở Rương Ngay!
                    </button>
                  ` : `
                    <span style="font-size:0.71rem;color:var(--pk9-text-muted);display:block;text-align:center;">Còn thiếu <b>${Math.max(0, c.targetDxh - myDxhWeek)} ĐXH</b></span>
                  `}
                </div>
              `;
            }).join('')}
          </div>

          ${BXH_UI.showRewardLookup ? renderDivisionRewardLookupHtml(lbData.division_reward_table, divTiers) : ''}
        </div>

        <!-- VÒNG LẶP R4: RIVAL PIN (ĐUỔI BẮT TOP TRÊN) & STUDY SQUAD (2-4 BẠN CÙNG HỆ) -->
        ${!isExcludedAdmin ? renderRivalAndSquadWidgetsHtml(myBxh, activeGrade) : ''}

        <!-- THANH CHỌN 3 TẦNG BXH (TẦNG 1: BẢNG ĐẤU 30 • TẦNG 2: TOÀN HỆ TOP 100 • TẦNG 3: 4 PHÓ BẢNG) -->
        <div class="pk9-exam-toolbar" style="flex-direction:column;align-items:stretch;gap:0.65rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.55rem;">
            <div class="pk9-exam-tabs">
              <button type="button" class="pk9-exam-chip ${BXH_UI.layer === 'tier1' ? 'active' : ''}" data-bxh-layer="tier1">
                🛡️ Tầng 1: Bảng Đấu 30 Người (${esc(curDivObj.icon)} ${esc(curDivObj.name)})
              </button>
              <button type="button" class="pk9-exam-chip ${BXH_UI.layer === 'tier2_weekly' ? 'active' : ''}" data-bxh-layer="tier2_weekly">
                🔥 Tầng 2: Toàn Hệ Top 100 Tuần
              </button>
              <button type="button" class="pk9-exam-chip ${BXH_UI.layer === 'tier2_alltime' ? 'active' : ''}" data-bxh-layer="tier2_alltime">
                🏆 BXH Top Tích Lũy EXP
              </button>
              <button type="button" class="pk9-exam-chip ${BXH_UI.layer === 'tier3' ? 'active' : ''}" data-bxh-layer="tier3">
                ⚡ Tầng 3: 4 Phó Bảng Chuyên Đề
              </button>
              <button type="button" class="pk9-exam-chip ${BXH_UI.layer === 'legacy_exam' ? 'active' : ''}" data-bxh-layer="legacy_exam">
                🎯 Cao Thủ Luyện Đề
              </button>
            </div>
            <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
              <div class="pk9-exam-search">
                <span class="pk9-exam-search-icon">🔍</span>
                <input type="search" id="pk9-lb-search-input" placeholder="Tìm tên, SBD, trường..." value="${esc(BXH_UI.search)}" />
              </div>
              <button type="button" class="pk9-btn-exam-ghost" data-refresh-leaderboard="1" style="padding:0.44rem 0.78rem;font-size:0.78rem;white-space:nowrap;">
                🔄 Làm mới BXH
              </button>
            </div>
          </div>

          ${BXH_UI.layer === 'tier1' ? `
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.45rem;padding-top:0.45rem;border-top:1px dashed var(--pk9-border);">
              <div class="pk9-exam-tabs">
                ${divTiers.map(dt => `
                  <button type="button" class="pk9-exam-chip ${activeDivision === dt.id ? 'active' : ''}" data-bxh-set-division="${esc(dt.id)}">
                    ${dt.icon} ${esc(dt.name)} <span style="opacity:0.8;font-size:0.7rem;">(×${dt.multiplier})</span>
                  </button>
                `).join('')}
              </div>
              <div style="font-size:0.75rem;color:var(--pk9-text-muted);">
                👑 Top 1–3 (>=300 ĐXH): Quà Podium + Thăng hạng • ⬆️ Top 4–${activeDivision === 'diamond' ? '5' : '7'} (>=250 ĐXH): Thăng hạng • ⚠️ Top 25–30: Giáng hạng
              </div>
            </div>
          ` : BXH_UI.layer === 'tier3' ? `
            <div style="display:flex;flex-direction:column;gap:0.45rem;padding-top:0.45rem;border-top:1px dashed var(--pk9-border);">
              <div class="pk9-exam-tabs">
                ${subDefs.map(sb => `
                  <button type="button" class="pk9-exam-chip ${BXH_UI.subBoard === sb.id ? 'active' : ''}" data-bxh-set-sub="${esc(sb.id)}">
                    ${sb.icon} ${esc(sb.name)} <span style="opacity:0.8;font-size:0.7rem;">(${esc(sb.subtitle)})</span>
                  </button>
                `).join('')}
              </div>
              <div style="font-size:0.76rem;color:var(--pk9-primary);font-weight:700;">
                💡 Điều kiện xét bảng & Chống lạm dụng: ${esc((subDefs.find(s => s.id === BXH_UI.subBoard) || subDefs[0]).requirement)}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- BỤC VINH DANH 3D ĐẦU TRANG (BẤM VÀO NHÂN VẬT ĐỂ SOI HỒ SƠ CÔNG KHAI R2) -->
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
                    Vị trí Hạng #${r} hệ ${esc(activeGrade)} đang chờ bạn bứt phá!
                  </div>
                  <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="exams" style="padding:0.45rem 0.9rem;font-size:0.78rem;">
                    ⚡ Luyện đề chiếm Hạng #${r}
                  </button>
                </div>
              `;
            }
            const mainMetric = BXH_UI.layer === 'tier2_alltime'
              ? `⚡ ${Number(row.xp || 0)} EXP (Lv.${row.level || 1})`
              : BXH_UI.layer === 'legacy_exam'
              ? `🎯 Đỉnh: ${Number(row.bestScore || 0).toFixed(2)}đ`
              : BXH_UI.layer === 'tier3' && row.sub_metric
              ? `🏅 ${esc(row.sub_metric)}`
              : `🔥 ${Number(row.dxh_week ?? row.weeklyXp ?? 0)} ĐXH Tuần`;
            return `
              <div class="pk9-podium-card rank-${r} pk9-clickable-profile" data-inspect-profile="1" data-profile-u="${esc(row.is_anonymous ? '' : row.username)}" data-profile-sbd="${esc(row.sbd || '')}" title="Bấm để Soi Hồ Sơ Công Khai 3D & Tủ Kính Thành Tựu của ${esc(row.display_name)}">
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
                <div style="font-weight:900;font-size:1.05rem;margin-top:0.45rem;">
                  ${slot.title} • ${esc(row.display_name)} ${row.rpg_pet ? esc(row.rpg_pet) : ''}
                </div>
                <div style="font-size:0.77rem;color:var(--pk9-text-muted);margin:0.18rem 0 0.55rem;">
                  🏫 ${esc(row.school || 'Học viên Phúc K9')} • Hệ <b>${esc(row.grade || activeGrade)}</b> • ${esc(row.division_tier_icon || '🥉')} <b>${esc(row.division_tier_name || row.rpg_tier || 'Hạng Đồng')}</b>
                </div>
                <div style="display:flex;justify-content:center;gap:0.38rem;flex-wrap:wrap;margin-bottom:0.55rem;">
                  <span class="pk9-badge pk9-badge-subj">${mainMetric}</span>
                  <span class="pk9-badge pk9-badge-verified">📝 ${row.attempts || 0} đề • Đỉnh ${Number(row.bestScore || 0).toFixed(2)}đ</span>
                </div>
                <div style="display:flex;justify-content:center;gap:0.32rem;flex-wrap:wrap;margin-bottom:0.55rem;">
                  ${row.hero_badge ? `<span class="pk9-badge pk9-badge-hot" title="Hero Badge">${row.hero_badge.icon} ${esc(row.hero_badge.name)} ×${row.hero_badge.count}</span>` : ''}
                  ${row.rpg_title ? `<span class="pk9-badge pk9-badge-code">✨ ${esc(row.rpg_title)}</span>` : ''}
                </div>
                <div style="font-size:0.73rem;font-weight:800;color:var(--pk9-primary);">
                  🔍 Bấm soi Hồ Sơ 3D & Tủ Kính ›
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- BẢNG DANH SÁCH HỌC VIÊN (BẤM VÀO DÒNG ĐỂ MỞ QUICK INSPECT DRAWER R2) -->
        <div class="pk9-lb-table-wrap">
          <div class="pk9-lb-row" style="background:var(--pk9-surface-2);font-weight:800;font-size:0.76rem;color:var(--pk9-text-muted);text-transform:uppercase;">
            <div>Hạng</div>
            <div>Học viên • Hệ & Trường (Bấm để Soi)</div>
            <div>${esc(metricTitle)}</div>
            <div class="hide-mob">Chỉ Số Học Thật</div>
            <div class="hide-mob">Huy Hiệu & Tương Tác</div>
          </div>
          <div id="pk9-lb-rows-body">
            ${renderEnhancedLeaderboardRowsHtml(filteredRows, onlyStudents, user, activeGrade)}
          </div>
        </div>
      </div>
    `;
  }

  function renderDivisionRewardLookupHtml(table, divTiers) {
    if (!Array.isArray(table) || !table.length) return '';
    return `
      <div style="margin-top:0.9rem;padding-top:0.85rem;border-top:1px dashed var(--pk9-border);overflow-x:auto;">
        <div style="font-weight:900;font-size:0.84rem;margin-bottom:0.45rem;color:var(--pk9-text);">
          📊 Bảng Tra Cứu Phần Thưởng Tuần 6 Hạng Đấu (Chống Smurfing: Top 4–5 Kim Cương giàu hơn Top 1 Đồng/Bạc/Vàng!)
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:0.74rem;min-width:680px;">
          <thead>
            <tr style="background:var(--pk9-surface-2);text-align:left;">
              <th style="padding:0.45rem 0.6rem;border:1px solid var(--pk9-border);">Thứ hạng (Sàn ĐXH)</th>
              ${divTiers.map(t => `<th style="padding:0.45rem 0.6rem;border:1px solid var(--pk9-border);">${t.icon} ${esc(t.name)} (×${t.multiplier})</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${table.map(row => `
              <tr>
                <td style="padding:0.45rem 0.6rem;border:1px solid var(--pk9-border);font-weight:800;">${esc(row.rankLabel)}</td>
                ${divTiers.map(t => {
                  const rw = row.byTier?.[t.id] || {};
                  const parts = [];
                  if (rw.gold) parts.push(`${rw.gold}🪙`);
                  if (rw.diamonds) parts.push(`${rw.diamonds}💎`);
                  if (rw.iupac_tickets) parts.push(`${rw.iupac_tickets}🎫`);
                  if (rw.iupac_shards) parts.push(`${rw.iupac_shards} mảnh vé`);
                  if (rw.shop_shards) parts.push(`${rw.shop_shards}🧩3D`);
                  if (rw.gold_charm) parts.push(`1🧿`);
                  if (rw.xp_boost) parts.push(`1🚀`);
                  return `<td style="padding:0.45rem 0.6rem;border:1px solid var(--pk9-border);">${parts.join(' + ') || '—'}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRivalAndSquadWidgetsHtml(myBxh, activeGrade) {
    const rivals = Array.isArray(myBxh.rivals_hud) ? myBxh.rivals_hud : [];
    const squad = myBxh.study_squad || null;
    const rpg = getRpg();
    const nowMs = Date.now();
    const rawInbox = Array.isArray(myBxh.duel_inbox)
      ? myBxh.duel_inbox
      : (Array.isArray(rpg.social?.duel_inbox) ? rpg.social.duel_inbox : []);
    const duelInbox = rawInbox.filter(inv => Number(inv?.expires_at || 0) > nowMs);

    return `
      ${duelInbox.length ? `
        <div class="pk9-card" style="padding:0.85rem 1.1rem;border:1.5px solid rgba(245,158,11,0.55);background:linear-gradient(135deg,rgba(245,158,11,0.12),rgba(225,29,72,0.08));">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.45rem;">
            <strong style="font-size:0.88rem;color:#d97706;">⚔️ Hòm Thư Khiêu Chiến 1v1 Đang Chờ (Hiệu lực 24h • ${duelInbox.length} lời mời)</strong>
            <span class="pk9-badge pk9-badge-hot" style="font-size:0.68rem;">Đấu Trường 1v1</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0.45rem;">
            ${duelInbox.slice(0, 4).map(inv => `
              <div style="padding:0.5rem 0.7rem;border-radius:0.7rem;background:var(--pk9-surface);border:1px solid var(--pk9-border);display:flex;justify-content:space-between;align-items:center;gap:0.45rem;flex-wrap:wrap;">
                <div style="font-size:0.76rem;">
                  <b>${esc(inv.from_name || inv.from)}</b> mời đấu <b>${esc(inv.subject || 'Toán')}</b>
                  <span class="pk9-badge pk9-badge-code" style="font-size:0.66rem;">Mã: ${esc(inv.room_code)}</span>
                </div>
                <button type="button" class="pk9-btn-exam-primary" data-r2-accept-duel="${esc(inv.room_code)}" style="padding:0.3rem 0.65rem;font-size:0.72rem;">
                  ⚔️ Nghênh chiến ngay
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <div class="pk9-grid-2" style="gap:0.9rem;">
        <!-- VÒNG LẶP 2: RIVAL PIN & ĐUỔI BẮT TOP TRÊN -->
        <div class="pk9-card" style="padding:0.95rem 1.1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;margin-bottom:0.55rem;">
            <strong style="font-size:0.9rem;">📌 Rival Pin & Đuổi Bắt Top Trên (Tối đa 3 Đối thủ)</strong>
            <span class="pk9-badge pk9-badge-subj" style="font-size:0.7rem;">Cạnh tranh tầm gần</span>
          </div>
          ${rivals.length ? rivals.map(rv => `
            <div style="padding:0.55rem 0.75rem;border-radius:0.75rem;background:${rv.overtaken ? 'rgba(16,185,129,0.12)' : 'var(--pk9-surface-2)'};border:1px solid ${rv.overtaken ? 'rgba(16,185,129,0.45)' : 'var(--pk9-border)'};margin-bottom:0.45rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;flex-wrap:wrap;">
                <div style="font-weight:800;font-size:0.82rem;">
                  ${rv.overtaken ? '🎉 ĐÃ VƯỢT MẶT:' : (rv.type === 'pinned' ? '📌 Rival đã ghim:' : '🎯 Mục tiêu ngay trên:')} <b>${esc(rv.display_name)}</b>
                  <span class="pk9-badge pk9-badge-code" style="font-size:0.68rem;">${rv.dxh_week} ĐXH</span>
                </div>
                <div style="display:flex;gap:0.35rem;">
                  <button type="button" class="pk9-admin-btn-xs" data-inspect-profile="1" data-profile-u="${esc(rv.username || '')}" data-profile-sbd="${esc(rv.sbd || '')}">🔍 Soi & So sánh</button>
                  ${rv.type === 'pinned' && rv.username ? `<button type="button" class="pk9-admin-btn-xs" data-bxh-rival-toggle="${esc(rv.username)}">✕ Bỏ ghim</button>` : ''}
                </div>
              </div>
              <div style="font-size:0.75rem;color:${rv.overtaken ? '#10b981' : 'var(--pk9-primary)'};font-weight:${rv.overtaken ? '800' : '600'};margin-top:0.28rem;line-height:1.45;">
                💡 ${esc(rv.nudge)}
              </div>
            </div>
          `).join('') : `
            <div style="font-size:0.8rem;color:var(--pk9-text-muted);padding:0.65rem 0;">
              Bấm vào bất kỳ học viên nào trên BXH và chọn <b>"📌 Lưu Rival Pin"</b> để hệ thống tự động tính khoảng cách ĐXH và gợi ý bài học giúp bạn vượt mặt!
            </div>
          `}
        </div>

        <!-- VÒNG LẶP 4: STUDY SQUAD 2-4 BẠN CÙNG HỆ -->
        <div class="pk9-card" style="padding:0.95rem 1.1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:0.4rem;margin-bottom:0.55rem;">
            <strong style="font-size:0.9rem;">🚩 Study Squad 2–4 Bạn Cùng Hệ (${esc(activeGrade)})</strong>
            <span class="pk9-badge pk9-badge-verified" style="font-size:0.7rem;">Đủ 550 ĐXH → +15% Vàng Rương</span>
          </div>
          ${squad ? `
            <div style="padding:0.6rem 0.75rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.45rem;">
                <div>
                  <strong style="font-size:0.85rem;">${esc(squad.name)}</strong>
                  <span class="pk9-badge pk9-badge-code" style="font-size:0.7rem;">Mã mời: ${esc(squad.code)}</span>
                </div>
                <button type="button" class="pk9-admin-btn-xs" data-bxh-squad-claim="1" style="background:#10b981;color:#fff;border:none;">
                  🎁 Nhận +15% Vàng Squad
                </button>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0.4rem;">
                ${(squad.member_details || []).map(m => `
                  <div style="padding:0.38rem 0.55rem;border-radius:0.6rem;background:var(--pk9-surface);border:1px solid ${m.reached_550 ? 'rgba(16,185,129,0.5)' : 'var(--pk9-border)'};font-size:0.74rem;">
                    <div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.reached_550 ? '✅' : '⏳'} ${esc(m.display_name)}</div>
                    <div style="color:var(--pk9-text-muted);">${m.dxh_week} / 550 ĐXH</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin-bottom:0.55rem;line-height:1.45;">
              Lập nhóm 2–4 bạn cùng Hệ Chính Tuần (khóa đội hình sau 23:59 Thứ Ba). Khi 100% thành viên đạt Mốc 2 (550 ĐXH), cả đội nhận <b>+15% 🪙 Vàng Rương Tuần</b> & Badge <b>Kéo Nhóm Cùng Tiến</b>!
            </div>
            <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
              <button type="button" class="pk9-btn-exam-primary" data-bxh-squad-create="1" style="padding:0.42rem 0.8rem;font-size:0.76rem;">
                🚩 Lập Study Squad Mới
              </button>
              <input type="text" id="pk9-squad-join-code" class="pk9-input" placeholder="Nhập mã SQ-2K9-..." style="margin:0;padding:0.38rem 0.65rem;font-size:0.76rem;max-width:155px;" />
              <button type="button" class="pk9-btn-exam-ghost" data-bxh-squad-join="1" style="padding:0.42rem 0.75rem;font-size:0.76rem;">
                🤝 Gia nhập
              </button>
            </div>
          `}
        </div>
      </div>
    `;
  }

  function renderEnhancedLeaderboardRowsHtml(filtered, allList, user, activeGrade) {
    if (!filtered.length) {
      return `
        <div style="padding:2rem 1.25rem;text-align:center;color:var(--pk9-text-muted);font-size:0.88rem;">
          Chưa có học viên nào khớp bộ lọc này. Hãy hoàn thành 1 đề Phòng thi ảo GDPT 2018 hoặc 1 phiên Pomodoro 9+ để ghi danh đầu tiên!
        </div>
      `;
    }
    const maxMetric = BXH_UI.layer === 'legacy_exam'
      ? Math.max(10, ...allList.map(x => Number(x.bestScore) || 0))
      : BXH_UI.layer === 'tier2_alltime'
      ? Math.max(100, ...allList.map(x => Number(x.xp) || 0))
      : Math.max(100, ...allList.map(x => Number(x.dxh_week ?? x.weeklyXp) || 0));

    return filtered.map((row, idx) => {
      const isMe = user && String(row.username || '').toLowerCase() === String(user.username || '').toLowerCase();
      const rankBadge = row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`;
      const curVal = BXH_UI.layer === 'legacy_exam'
        ? Number(row.bestScore || 0)
        : BXH_UI.layer === 'tier2_alltime'
        ? Number(row.xp || 0)
        : Number(row.dxh_week ?? row.weeklyXp ?? 0);
      const pct = Math.min(100, Math.max(curVal > 0 ? 10 : 4, Math.round((curVal / (maxMetric || 1)) * 100)));

      const zoneBadge = BXH_UI.layer === 'tier1' && row.standing
        ? `<span class="pk9-badge ${row.standing.promoted ? 'pk9-badge-verified' : row.standing.demoted ? 'pk9-badge-hot' : 'pk9-badge-code'}" style="font-size:0.68rem;">${esc(row.standing.label)}</span>`
        : '';

      return `
        <div class="pk9-lb-row ${isMe ? 'me' : ''} pk9-clickable-profile" data-inspect-profile="1" data-profile-u="${esc(row.is_anonymous ? '' : row.username)}" data-profile-sbd="${esc(row.sbd || '')}" style="cursor:pointer;animation-delay:${Math.min(idx * 0.04, 0.35)}s;" title="Bấm để Soi Hồ Sơ Công Khai của ${esc(row.display_name)}">
          <div style="font-weight:900;font-size:0.92rem;color:${row.rank <= 3 ? '#d97706' : 'var(--pk9-text)'};">
            ${rankBadge}
          </div>
          <div style="display:flex;align-items:center;gap:0.7rem;min-width:0;">
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
              <div style="font-weight:800;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:0.35rem;">
                <span>${esc(row.display_name)} ${row.rpg_pet ? esc(row.rpg_pet) : ''}</span>
                <span style="font-size:0.72rem;color:var(--pk9-text-muted);">(${esc(row.sbd || `@${row.username}`)})</span>
                ${isMe ? '<span class="pk9-badge pk9-badge-subj" style="font-size:0.66rem;">Bạn</span>' : ''}
              </div>
              <div style="font-size:0.74rem;color:var(--pk9-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                🏫 ${esc(row.school || 'Học viên Phúc K9')} • Hệ <b>${esc(row.grade || activeGrade)}</b> • ${esc(row.division_tier_icon || '🥉')} ${esc(row.division_tier_name || row.rpg_tier || 'Hạng Đồng')}
              </div>
            </div>
          </div>
          <div>
            <div style="font-weight:800;color:var(--pk9-primary);font-size:0.84rem;display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
              ${BXH_UI.layer === 'tier2_alltime'
                ? `⚡ ${Number(row.xp || 0)} EXP <span style="font-size:0.72rem;color:var(--pk9-text-muted);">(Lv.${row.level || 1} • Tuần ${Number(row.dxh_week || 0)} ĐXH)</span>`
                : BXH_UI.layer === 'legacy_exam'
                ? `🎯 Đỉnh ${Number(row.bestScore || 0).toFixed(2)}đ <span style="font-size:0.72rem;color:var(--pk9-text-muted);">(TB ${Number(row.avgScore || 0).toFixed(2)}đ)</span>`
                : BXH_UI.layer === 'tier3' && row.sub_metric
                ? `🏅 ${esc(row.sub_metric)}`
                : `🔥 ${Number(row.dxh_week ?? row.weeklyXp ?? 0)} ĐXH Tuần`}
              ${zoneBadge}
            </div>
            <div class="pk9-topic-track" style="height:0.35rem;margin-top:0.25rem;">
              <div class="pk9-topic-fill" style="width:${pct}%;"></div>
            </div>
          </div>
          <div class="hide-mob" style="font-size:0.79rem;">
            <div>🎯 Đỉnh: <b>${Number(row.bestScore || 0).toFixed(2)}đ</b> • ${Number(row.attempts || 0)} đề • CX ${Number(row.weekly_accuracy ?? row.accuracy ?? 0)}%</div>
            <div style="font-size:0.72rem;color:var(--pk9-text-muted);">📅 ${Number(row.valid_days_count || 1)} ngày hợp lệ • ⏱️ ${Number(row.pomo_hours_total || 0)}h Pomo</div>
          </div>
          <div class="hide-mob" style="font-size:0.78rem;display:flex;align-items:center;justify-content:space-between;gap:0.35rem;">
            <div>
              🔥 ${row.streak || 1}d
              ${row.hero_badge
                ? `<span class="pk9-badge pk9-badge-hot" style="font-size:0.68rem;">${row.hero_badge.icon} ${esc(row.hero_badge.name)} ×${row.hero_badge.count}</span>`
                : `<span class="pk9-badge pk9-badge-code" style="font-size:0.68rem;">${esc((row.badges || ['Thành Viên K9'])[0])}</span>`}
            </div>
            <span class="pk9-admin-btn-xs" style="white-space:nowrap;">🔍 Soi ›</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function closePublicProfileModal() {
    const modal = document.getElementById('pk9-scanned-card-modal');
    if (modal) modal.remove();
    try {
      const url = new URL(window.location.href);
      let changed = false;
      if (/^\/u\/[^/?#]+/i.test(url.pathname)) {
        url.pathname = '/';
        changed = true;
      }
      if (url.search && (url.search.includes('card=') || url.search.includes('student_card=') || url.search.includes('sbd='))) {
        url.searchParams.delete('card');
        url.searchParams.delete('student_card');
        url.searchParams.delete('sbd');
        url.searchParams.delete('n');
        url.searchParams.delete('g');
        changed = true;
      }
      if (changed) {
        window.history.replaceState({}, '', url.pathname + (url.search || '') + (url.hash || ''));
      }
    } catch {}
  }

  // ==========================================================================
  // 2. R2: QUICK INSPECT DRAWER & HỒ SƠ CÔNG KHAI 4 TẦNG (?card=[SBD] / /u/[SBD])
  // ==========================================================================
  async function openPublicProfileInspector(params = {}) {
    const mode = params.mode === 'full' ? 'full' : 'drawer'; // 'drawer' (Quick Inspect) | 'full' (Full Modal)
    const rawU = String(params.username || params.u || params.card || '').trim();
    const rawSbd = String(params.sbd || '').trim();
    const localUser = getUser();

    const old = document.getElementById('pk9-scanned-card-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'pk9-scanned-card-modal';
    modal.className = `pk9-qr-zoom-modal pk9-scanned-card-modal ${mode === 'drawer' ? 'is-quick-drawer' : 'is-full-profile'}`;
    const dialog = document.createElement('div');
    dialog.className = 'pk9-scanned-card-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Hồ Sơ Học Viên Công Khai Học Cùng Phúc K9');
    dialog.innerHTML = `
      ${mode === 'drawer' ? '<div class="pk9-mobile-sheet-handle" aria-hidden="true"></div>' : ''}
      <div style="padding:2.2rem 1rem;text-align:center;color:#e2e8f0;">
        <div style="font-weight:900;font-size:1.05rem;">🔍 Đang tải Hồ Sơ Công Khai 3D & Tủ Kính Thành Tựu...</div>
      </div>
    `;
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    let apiData = null;
    try {
      const qs = new URLSearchParams({
        action: 'student-card',
        u: rawU,
        sbd: rawSbd,
        n: params.name || '',
        g: params.grade || ''
      });
      const r = await fetch(`/api/dashboard?${qs.toString()}`, { credentials: 'include' });
      if (r.ok) apiData = await r.json();
    } catch {}

    if (!modal.isConnected) return;

    // Trường hợp hồ sơ bật "Ẩn Danh BXH" và người xem truy cập qua ?card=<username> cũ
    if (apiData?.anonymous_locked) {
      dialog.style.maxWidth = '520px';
      dialog.style.padding = '1.8rem';
      dialog.style.textAlign = 'center';
      dialog.innerHTML = `
        <button type="button" class="pk9-scanned-close-x" data-close-scanned-card="1" aria-label="Đóng">✕</button>
        <div style="font-size:2.6rem;margin-bottom:0.5rem;">🛡️</div>
        <h3 style="margin:0 0 0.5rem;font-size:1.2rem;font-weight:900;color:#fef08a;">Hồ Sơ Đang Bật Chế Độ Ẩn Danh BXH</h3>
        <p style="margin:0 0 1.2rem;font-size:0.88rem;color:#cbd5e1;line-height:1.55;">
          ${esc(apiData.message || 'Hồ sơ đã chuyển sang chế độ Ẩn danh — vui lòng truy cập bằng Public SBD mới.')}
        </p>
        <button type="button" class="pk9-btn-exam-primary" data-close-scanned-card="1">Đã hiểu • Quay lại</button>
      `;
      return;
    }

    const card = apiData?.card || {
      username: rawU || 'khach_k9',
      display_name: params.name || 'Học Viên Phúc K9',
      sbd: rawSbd || 'K9-STUDENT',
      grade: params.grade || '2K9',
      school: 'Hệ Sinh Thái Học Cùng Phúc K9',
      xp: 100,
      dxh_week: 0,
      level: 1,
      streak: 1,
      max_streak: 1,
      cheer_score: 0,
      tier: { name: 'Bậc Đồng', icon: '🥉' },
      division_tier: { name: 'Hạng Đồng', icon: '🥉' },
      equipped_details: {},
      periodic_unlocked: 3,
      periodic_unlocked_list: [1, 6, 8],
      questions_conquered: 0,
      motto: 'Mỗi ngày tiến bộ 1% cùng Phúc K9!',
      showcase: { unlocked_slots: 2, milestone_cards: [], featured_iupac: 8 },
      verified_metrics_8: {
        streak: 1, max_streak: 1, xp: 100, dxh_week: 0, exams_solved: 0,
        avg_10_std_label: 'Đang tích lũy', duel_1v1_wins: 0, duel_1v1_winrate: 0,
        pomodoro_hours: 0, flashcards_mastered: 0, islands_cleared: 0, islands_stars: 0
      }
    };

    const isSelf = Boolean(apiData?.is_self || (localUser && String(localUser.username).toLowerCase() === String(card.username).toLowerCase()));
    const isGuestViewer = !localUser;
    const eq = card.equipped_details || {};
    const tier = card.tier || { name: 'Bậc Đồng', icon: '🥉' };
    const divTier = card.division_tier || { name: 'Hạng Đồng', icon: '🥉' };
    const m8 = card.verified_metrics_8 || {};
    const sc = card.showcase || {};
    const comp = apiData?.comparison || null;
    const cheerPresets = Array.isArray(apiData?.cheer_presets) ? apiData.cheer_presets : [
      'Chúc bạn đỗ Nguyện Vọng 1! 🎓',
      'Giữ vững Streak 9+ nhé! 🔥',
      'Hẹn gặp ở Top Bảng Đấu! 🏆',
      'Cùng bứt phá 9+ tuần này! 🚀',
      'Quá đỉnh! Tinh thần tự học tuyệt vời! ⚡'
    ];
    const origin = (window.location?.origin && /^https?:\/\//i.test(window.location.origin))
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://thanhphuc.vercel.app';
    const shareUrl = `${origin}/?card=${encodeURIComponent(card.sbd)}&ref=${encodeURIComponent(card.sbd)}`;
    const shortAliasUrl = `${origin}/u/${encodeURIComponent(card.sbd)}`;
    const elementsList = window.PK9_RPG?.ELEMENTS || [];
    const featuredEl = elementsList.find(e => e.z === Number(sc.featured_iupac || 8)) || { z: 8, sym: 'O', name: 'Oxi (Oxygen)' };

    dialog.innerHTML = `
        ${mode === 'drawer' ? '<div class="pk9-mobile-sheet-handle" aria-hidden="true"></div>' : ''}
        <!-- HEADER ĐIỀU HƯỚNG -->
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:0.85rem;padding-bottom:0.6rem;border-bottom:1px solid rgba(148,163,184,0.25);">
          <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
            <span class="pk9-badge pk9-badge-verified" style="font-size:0.72rem;">🪪 HỒ SƠ CÔNG KHAI • ?card=${esc(card.sbd)}</span>
            ${card.exam_countdown?.bannerText ? `<span class="pk9-badge pk9-badge-hot" style="font-size:0.68rem;">${esc(card.exam_countdown.bannerText)}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            ${mode === 'drawer' ? `
              <button type="button" class="pk9-admin-btn-xs" data-expand-full-profile="1" data-profile-u="${esc(card.is_anonymous ? '' : card.username)}" data-profile-sbd="${esc(card.sbd)}" style="background:rgba(56,189,248,0.2);color:#bae6fd;border:1px solid rgba(56,189,248,0.45);">
                ⤢ Mở Hồ Sơ Đầy Đủ
              </button>
            ` : ''}
            ${!isSelf && !isGuestViewer ? `
              <button type="button" class="pk9-admin-btn-xs" data-r2-report-profile="${esc(card.sbd)}" style="background:rgba(239,68,68,0.18);color:#fca5a5;border:1px solid rgba(239,68,68,0.35);" title="Báo cáo hồ sơ vi phạm">🚩 Báo cáo</button>
            ` : ''}
            <button type="button" class="pk9-scanned-close-x" data-close-scanned-card="1" aria-label="Đóng" style="position:static;">✕</button>
          </div>
        </div>

        <!-- TẦNG 1: HERO BANNER 3D (7 NHÓM ĐỒ SIÊU THỊ 3D & KHUNG NITRO + 4 MICRO-ACTIONS) -->
        <div style="background:linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,58,138,0.75));border:1px solid rgba(125,211,252,0.3);border-radius:1.1rem;padding:1.1rem;margin-bottom:0.9rem;">
          <div style="display:flex;gap:1.1rem;align-items:center;flex-wrap:wrap;">
            <div style="text-align:center;position:relative;" title="Trang phục: ${esc(eq.outfit?.name || 'Áo Blouse Thủ Khoa')} | Khung: ${esc(eq.frame?.name || 'Khung Đồng')} | Aura: ${esc(eq.aura?.name || 'Khởi Nguyên')} | Linh thú: ${esc(eq.pet?.name || 'Chưa đeo')}">
              ${window.PK9_RPG_MODELS?.renderAvatarStageHtml ? window.PK9_RPG_MODELS.renderAvatarStageHtml({
                size: 'lg',
                outfitId: eq.outfit?.id || 'outfit-scholar',
                frameClass: eq.frame?.cssClass || 'pk9-frame-bronze',
                auraClass: eq.aura ? (eq.aura.cssClass || eq.aura.id) : '',
                petId: eq.pet?.id || '',
                petIcon: eq.pet?.icon || '',
                petName: eq.pet?.name || ''
              }) : `<div style="font-size:3rem;">${eq.outfit?.icon || '🧑‍🎓'}</div>`}
              ${sc.hero_badge_detail ? `
                <div style="margin-top:0.35rem;">
                  <span class="pk9-badge pk9-badge-hot" style="font-size:0.68rem;">${sc.hero_badge_detail.icon} ${esc(sc.hero_badge_detail.name)} ×${sc.hero_badge_detail.count}</span>
                </div>
              ` : ''}
            </div>

            <div style="flex:1;min-width:210px;">
              <div style="display:flex;align-items:center;gap:0.45rem;flex-wrap:wrap;">
                <h3 style="margin:0;font-size:1.25rem;font-weight:900;color:#ffffff;">${esc(card.display_name)}</h3>
                <span class="pk9-badge pk9-badge-subj" style="font-size:0.72rem;">Hệ: ${esc(card.grade)}</span>
                <span class="pk9-badge pk9-badge-hot" style="font-size:0.72rem;">🔥 Cổ vũ: <b id="pk9-r2-cheer-count">${Number(card.cheer_score || 0)}</b></span>
              </div>
              <div style="font-size:0.8rem;color:#cbd5e1;margin:0.25rem 0;">
                Danh hiệu: <b style="color:#fde047;">${eq.title ? `${eq.title.icon} ${esc(eq.title.name)}` : '⚡ Tân Binh Bứt Phá'}</b>
                ${card.temp_title && Number(card.temp_title.expires_at || 0) > Date.now() && (card.temp_title.text || card.temp_title.name)
                  ? ` <span class="pk9-badge pk9-badge-hot" style="font-size:0.66rem;">👑 ${esc(card.temp_title.text || card.temp_title.name)} (7d)</span>`
                  : ''}
                • Cấp bậc: <b>${tier.icon || '🥉'} ${esc(tier.name)} (${Number(card.xp || 100)} EXP)</b>
              </div>
              <div style="font-size:0.8rem;color:#93c5fd;margin-bottom:0.45rem;">
                Tuần này: <b>${Number(card.dxh_week || 0)} ĐXH Tuần</b> (${divTier.icon || '🥉'} Bảng Đấu: <b>${esc(divTier.name)}</b>)
              </div>
              <!-- Thẻ nhỏ ghi tên 7 nhóm đồ đang mặc -->
              <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.65rem;">
                <span class="pk9-badge pk9-badge-code" style="font-size:0.66rem;">🧍 ${esc(eq.outfit?.name || 'Áo Blouse Thủ Khoa')}</span>
                <span class="pk9-badge pk9-badge-code" style="font-size:0.66rem;">🖼️ ${esc(eq.frame?.name || 'Khung Tân Binh Đồng')}</span>
                ${eq.aura && eq.aura.id !== 'aura-none' ? `<span class="pk9-badge pk9-badge-code" style="font-size:0.66rem;">✨ ${esc(eq.aura.name)}</span>` : ''}
                ${eq.pet ? `<span class="pk9-badge pk9-badge-code" style="font-size:0.66rem;">🐾 ${esc(eq.pet.name)}</span>` : ''}
              </div>

              <!-- 4 MICRO-ACTIONS TƯƠNG TÁC HỌC TẬP (R2 MỤC 4) -->
              ${isGuestViewer ? `
                <div style="padding:0.6rem 0.8rem;border-radius:0.75rem;background:rgba(16,185,129,0.2);border:1px solid rgba(52,211,153,0.45);">
                  <div style="font-size:0.79rem;font-weight:800;color:#ecfdf5;margin-bottom:0.4rem;">
                    🎁 Vào học cùng ${esc(card.display_name)} (${esc(card.sbd)}) — Mở khóa Rương Tân Binh 9+!
                  </div>
                  <button type="button" class="pk9-btn-exam-primary" data-r4-guest-referral-signup="${esc(card.sbd)}" style="padding:0.42rem 0.85rem;font-size:0.78rem;">
                    ✨ Đăng Ký Miễn Phí & Nhận Rương Tân Binh (+100🪙, 1 Vé x2 EXP, 1 Vé IUPAC)
                  </button>
                </div>
              ` : isSelf ? `
                <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
                  <button type="button" class="pk9-btn-exam-primary" data-close-scanned-card="1" data-nav-tab="idcard" style="padding:0.42rem 0.85rem;font-size:0.78rem;">
                    🏆 Tùy chỉnh Tủ Kính Thành Tựu & Xuất .PNG
                  </button>
                  <button type="button" class="pk9-btn-exam-ghost" data-copy-card-url="${esc(shareUrl)}" style="padding:0.42rem 0.8rem;font-size:0.76rem;color:#fff;border-color:rgba(255,255,255,0.3);">
                    🔗 Copy Link Referral (?card=${esc(card.sbd)})
                  </button>
                </div>
              ` : `
                <div style="display:flex;flex-wrap:wrap;gap:0.42rem;align-items:center;">
                  <button type="button" class="pk9-btn-exam-primary" data-r2-challenge-1v1="${esc(card.is_anonymous ? '' : card.username)}" ${card.privacy_summary?.allow_1v1_invites === 'none' ? 'disabled style="padding:0.4rem 0.75rem;font-size:0.75rem;opacity:0.55;cursor:not-allowed;" title="Học viên đã tắt lời mời 1v1"' : 'style="padding:0.4rem 0.75rem;font-size:0.75rem;"'}>
                    ⚔️ ${card.privacy_summary?.allow_1v1_invites === 'none' ? '1v1 Đang tắt' : 'Thách đấu 1v1'}
                  </button>
                  <div style="display:inline-flex;align-items:center;gap:0.25rem;">
                    <select id="pk9-r2-cheer-preset" class="pk9-input" style="margin:0;padding:0.34rem 0.45rem;font-size:0.72rem;max-width:165px;background:#0f172a;color:#fff;">
                      ${cheerPresets.map((msg, idx) => `<option value="${idx}">${esc(msg)}</option>`).join('')}
                    </select>
                    <button type="button" class="pk9-btn-exam-primary" data-r2-send-cheer="1" data-target-u="${esc(card.is_anonymous ? '' : card.username)}" data-target-sbd="${esc(card.sbd)}" style="padding:0.4rem 0.7rem;font-size:0.75rem;background:linear-gradient(135deg,#f59e0b,#e11d48);">
                      🔥 Cổ vũ (+1🪙)
                    </button>
                  </div>
                  <button type="button" class="pk9-btn-exam-ghost" data-r2-toggle-compare="1" style="padding:0.4rem 0.7rem;font-size:0.75rem;color:#fff;border-color:rgba(255,255,255,0.35);">
                    📊 So sánh 1-chạm
                  </button>
                  ${!card.is_anonymous ? `
                    <button type="button" class="pk9-btn-exam-ghost" data-bxh-rival-toggle="${esc(card.username)}" style="padding:0.4rem 0.7rem;font-size:0.75rem;color:#fde047;border-color:rgba(253,224,71,0.45);">
                      📌 ${comp?.is_pinned_rival ? 'Đã ghim Rival' : 'Ghim Rival'}
                    </button>
                    <button type="button" class="pk9-btn-exam-ghost" data-r2-block-user="${esc(card.username)}" style="padding:0.4rem 0.65rem;font-size:0.73rem;color:#fca5a5;border-color:rgba(248,113,113,0.35);">
                      🚫 ${comp?.is_blocked ? 'Bỏ chặn' : 'Chặn'}
                    </button>
                  ` : ''}
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- KHUNG SO SÁNH 1-CHẠM (R2 MICRO-ACTION #3) -->
        ${comp ? `
          <div id="pk9-r2-compare-panel" style="display:none;background:rgba(15,23,42,0.88);border:1px solid rgba(56,189,248,0.45);border-radius:1rem;padding:0.95rem;margin-bottom:0.9rem;">
            <div style="font-weight:900;font-size:0.88rem;color:#38bdf8;margin-bottom:0.4rem;">
              📊 Đối Chiếu Song Song 8 Chỉ Số Học Thật: Bạn (${esc(comp.viewer_name)}) vs ${esc(card.display_name)}
            </div>
            <div style="font-size:0.78rem;color:#fde047;font-weight:700;margin-bottom:0.65rem;padding:0.45rem 0.7rem;border-radius:0.65rem;background:rgba(245,158,11,0.16);">
              💡 ${esc(comp.actionable_nudge)}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:0.45rem;font-size:0.75rem;">
              ${[
                { lb: '🔥 ĐXH Tuần', me: `${comp.viewer_metrics.dxh_week} ĐXH`, opp: `${m8.dxh_week || 0} ĐXH` },
                { lb: '⚡ Tổng EXP', me: `${comp.viewer_metrics.xp} EXP`, opp: `${m8.xp || 100} EXP` },
                { lb: '🔥 Streak Thực', me: `${comp.viewer_metrics.streak} ngày`, opp: `${m8.streak || 1} ngày` },
                { lb: '📝 Số đề đã giải', me: `${comp.viewer_metrics.exams_solved} đề`, opp: `${m8.exams_solved || 0} đề` },
                { lb: '🎯 Điểm TB GDPT 2018', me: comp.viewer_metrics.avg_10_std_exams ? `${comp.viewer_metrics.avg_10_std_exams}đ` : 'Đang tích lũy', opp: m8.avg_10_std_exams ? `${m8.avg_10_std_exams}đ` : 'Đang tích lũy' },
                { lb: '⚔️ Thắng 1v1', me: `${comp.viewer_metrics.duel_1v1_wins} trận`, opp: `${m8.duel_1v1_wins || 0} trận` },
                { lb: '⏱️ Giờ Pomodoro 9+', me: `${comp.viewer_metrics.pomodoro_hours}h`, opp: `${m8.pomodoro_hours || 0}h` },
                { lb: '🃏 Flashcards 3D', me: `${comp.viewer_metrics.flashcards_mastered} thẻ`, opp: `${m8.flashcards_mastered || 0} thẻ` }
              ].map(item => `
                <div style="padding:0.45rem 0.6rem;border-radius:0.6rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);">
                  <div style="color:#94a3b8;font-weight:700;">${item.lb}</div>
                  <div style="display:flex;justify-content:space-between;margin-top:0.2rem;color:#fff;">
                    <span>Bạn: <b>${esc(item.me)}</b></span>
                    <span style="color:#7dd3fc;">Đối thủ: <b>${esc(item.opp)}</b></span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- TẦNG 2: THẺ HỌC VIÊN ĐIỆN TỬ CHÍNH THỨC • STUDENT ID TƯƠNG TÁC -->
        <div class="pk9-student-idcard pk9-scanned-idcard-pass ${esc(eq.cardbg?.cssClass || 'pk9-cardbg-ocean')}" style="margin-bottom:0.9rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.6rem;">
            <div>
              <div style="font-size:0.68rem;font-weight:900;color:#fef08a;letter-spacing:0.05em;">TẦNG 2 • THẺ HỌC VIÊN ĐIỆN TỬ CHÍNH THỨC • STUDENT ID</div>
              <div style="font-size:0.84rem;margin-top:0.2rem;">
                • <b>SBD:</b> <span style="color:#fef08a;font-weight:900;">${esc(card.sbd)}</span>
                • <b>Đơn vị:</b> ${esc(card.school)}
              </div>
              ${card.motto ? `<div style="font-size:0.82rem;font-style:italic;color:#bae6fd;margin-top:0.25rem;">🎯 Mục tiêu: “${esc(card.motto)}”</div>` : ''}
            </div>
            <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
              <button type="button" class="pk9-admin-btn-xs" data-r2-toggle-iupac-grid="1" style="background:rgba(16,185,129,0.28);color:#ecfdf5;border:1px solid rgba(110,231,183,0.55);padding:0.42rem 0.75rem;">
                ⚗️ IUPAC đã mở: <b>${Number(card.periodic_unlocked || 3)} / 118 Nguyên tố</b> (Bấm xem lưới)
              </button>
              <button type="button" class="pk9-admin-btn-xs" data-copy-card-url="${esc(shortAliasUrl)}" style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.3);">
                🔗 Copy /u/${esc(card.sbd)}
              </button>
            </div>
          </div>

          <!-- POPUP LƯỚI THU NHỎ 118 Ô IUPAC -->
          <div id="pk9-r2-iupac-mini-popup" style="display:none;margin-top:0.75rem;padding:0.75rem;border-radius:0.8rem;background:rgba(15,23,42,0.88);border:1px solid rgba(56,189,248,0.4);">
            <div style="font-size:0.76rem;font-weight:800;color:#7dd3fc;margin-bottom:0.45rem;">
              ⚗️ Bộ Sưu Tập Bảng Tuần Hoàn 118 Ô IUPAC của ${esc(card.display_name)} (${Number(card.periodic_unlocked || 3)}/118 ô đã mở):
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:0.22rem;max-height:150px;overflow-y:auto;">
              ${Array.from({ length: 118 }, (_, i) => i + 1).map(z => {
                const isOpen = (card.periodic_unlocked_list || [1, 6, 8]).includes(z);
                const elObj = elementsList.find(e => e.z === z);
                return `<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:26px;border-radius:4px;font-size:0.68rem;font-weight:800;background:${isOpen ? 'rgba(16,185,129,0.28)' : 'rgba(255,255,255,0.06)'};color:${isOpen ? '#6ee7b7' : '#64748b'};border:1px solid ${isOpen ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.08)'};" title="Z=${z}: ${esc(elObj?.name || '')}">${z}${elObj ? elObj.sym : ''}</span>`;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- TẦNG 3: TỦ KÍNH THÀNH TỰU TỰ CHỌN (R3 — 5 VÙNG) -->
        <div class="pk9-r3-showcase-panel frame-${esc(sc.showcase_frame || 'default')}" style="background:rgba(15,23,42,0.82);border:2px solid ${sc.showcase_frame === 'legend_gold' ? '#f59e0b' : sc.showcase_frame === 'nebula' ? '#a855f7' : sc.showcase_frame === 'crystal' ? '#38bdf8' : 'rgba(148,163,184,0.28)'};border-radius:1.05rem;padding:1rem;margin-bottom:0.9rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.45rem;margin-bottom:0.65rem;">
            <strong style="font-size:0.86rem;color:#fde047;">
              🏆 TẦNG 3 • TỦ KÍNH THÀNH TỰU TỰ CHỌN (${Number(sc.unlocked_slots || 2)} Ô Showcase Mở Theo Rank${sc.borrowed_slot_3 ? ' • ⚡ Mượn Tạm Ô 3' : ''})
            </strong>
            <span class="pk9-badge pk9-badge-subj" style="font-size:0.7rem;">
              ★ IUPAC Tâm Điểm: <b>${featuredEl.z} - ${esc(featuredEl.sym)} (${esc(featuredEl.name.split(' ')[0])})</b>
            </span>
          </div>

          <!-- HÀNG SHOWCASE BADGES (1 HERO + 2..6 SHOWCASE) -->
          <div style="display:flex;flex-wrap:wrap;gap:0.45rem;margin-bottom:0.75rem;">
            ${sc.hero_badge_detail ? `
              <div style="padding:0.45rem 0.75rem;border-radius:0.75rem;background:linear-gradient(135deg,rgba(245,158,11,0.25),rgba(225,29,72,0.25));border:1.5px solid #fbbf24;font-size:0.76rem;font-weight:800;color:#fef08a;">
                ★ HERO: ${sc.hero_badge_detail.icon} ${esc(sc.hero_badge_detail.name)} ×${sc.hero_badge_detail.count} (${esc(sc.hero_badge_detail.tierName)})
              </div>
            ` : ''}
            ${(sc.showcase_badges_details || []).map((bd, idx) => `
              <div style="padding:0.42rem 0.68rem;border-radius:0.7rem;background:rgba(255,255,255,0.08);border:1px solid ${idx === 2 && sc.borrowed_slot_3 ? '#38bdf8' : 'rgba(255,255,255,0.2)'};font-size:0.74rem;color:#e2e8f0;">
                ${bd.icon} <b>${esc(bd.name)}</b> <span style="color:#fde047;">×${bd.count}</span> <span style="opacity:0.75;">(${esc(bd.tierIcon)})</span>
              </div>
            `).join('')}
          </div>

          <!-- 3 THẺ CỘT MỐC GHIM (PINNED HIGH-WATER SNAPSHOTS) -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:0.55rem;">
            ${(sc.milestone_cards || []).slice(0, 3).map(mc => `
              <div style="padding:0.65rem 0.8rem;border-radius:0.8rem;background:rgba(30,41,59,0.85);border:1px solid rgba(56,189,248,0.3);">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.7rem;color:#7dd3fc;">
                  <span>${mc.icon || '🎯'} ${esc(mc.label)}</span>
                  <span style="color:#34d399;font-weight:800;">✔ Xác thực</span>
                </div>
                <div style="font-size:1.1rem;font-weight:900;color:#ffffff;margin:0.2rem 0;">${esc(mc.valueText)}</div>
                <div style="font-size:0.68rem;color:#94a3b8;">${esc(mc.sub || '')} ${mc.dateLabel ? `• ${esc(mc.dateLabel)}` : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- TẦNG 4: BẢNG 8 CHỈ SỐ HỌC TẬP XÁC THỰC (✔ ĐÃ QUA BỘ LỌC HỌC THẬT) -->
        <div style="background:rgba(15,23,42,0.75);border:1px solid rgba(148,163,184,0.25);border-radius:1rem;padding:0.95rem;">
          <div style="font-size:0.82rem;font-weight:900;color:#34d399;margin-bottom:0.55rem;">
            ✔ TẦNG 4 • BẢNG 8 CHỈ SỐ HỌC TẬP XÁC THỰC (ĐÃ QUA QUALITY GATE HỌC THẬT)
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:0.5rem;font-size:0.77rem;">
            <div class="pk9-scanned-stat-box">
              <span>1. 🔥 STREAK HỌC THẬT</span>
              <strong>${Number(m8.streak || 1)} ngày (Kỷ lục: ${Number(m8.max_streak || 1)}d)</strong>
            </div>
            <div class="pk9-scanned-stat-box">
              <span>2. ⚡ EXP & ĐXH TUẦN</span>
              <strong>${Number(m8.xp || 100)} EXP • Tuần: ${Number(m8.dxh_week || 0)} ĐXH</strong>
            </div>
            <div class="pk9-scanned-stat-box">
              <span>3. 📝 SỐ ĐỀ ĐÃ GIẢI</span>
              <strong>${Number(m8.exams_solved || 0)} đề (Đỉnh ${Number(m8.best_exam_score || 0).toFixed(2)}đ)</strong>
            </div>
            <div class="pk9-scanned-stat-box">
              <span>4. 🎯 ĐIỂM TB GDPT 2018</span>
              <strong>${esc(m8.avg_10_std_label || 'Đang tích lũy')}</strong>
            </div>
            <div class="pk9-scanned-stat-box">
              <span>5. ⚔️ THẮNG ĐẤU TRƯỜNG 1V1</span>
              <strong>${Number(m8.duel_1v1_wins || 0)} trận (${Number(m8.duel_1v1_winrate || 0)}%)</strong>
            </div>
            <div class="pk9-scanned-stat-box">
              <span>6. ⏱️ GIỜ POMODORO 9+</span>
              <strong>${Number(m8.pomodoro_hours || 0)} giờ xác thực</strong>
            </div>
            <div class="pk9-scanned-stat-box">
              <span>7. 🃏 FLASHCARDS 3D THUỘC</span>
              <strong>${Number(m8.flashcards_mastered || 0)} thẻ (Micro-Check)</strong>
            </div>
            <div class="pk9-scanned-stat-box">
              <span>8. 🚩 VƯỢT ĐẢO & CỜ VÙNG</span>
              <strong>${Number(m8.islands_cleared || 0)}/7 đảo (${Number(m8.islands_stars || 0)}⭐ • ${Number(m8.island_flags_total || 0)}🚩)</strong>
            </div>
          </div>
        </div>
    `;
  }

  // ==========================================================================
  // 3. R3: TỦ KÍNH THÀNH TỰU 5 VÙNG, KHO 24 BADGES & XUẤT THẺ .PNG (9:16 & 16:9)
  // ==========================================================================
  function renderIdCardTabEnhanced() {
    const root = document.getElementById('tab-idcard');
    if (!root) return;
    const rpg = getRpg();
    const user = getUser();
    const eq = rpg.equipped_details || {};
    const tier = rpg.tier || { name: 'Bậc Đồng', icon: '🥉', nextTier: null };
    const pv = rpg.privacy || {};
    const sc = rpg.showcase || { unlocked_slots: 2, showcase_badges: [], milestone_cards: [], featured_iupac: 8 };
    const badges24 = Array.isArray(rpg.badges_24) && rpg.badges_24.length ? rpg.badges_24 : [];
    const availMilestones = Array.isArray(rpg.available_milestones) ? rpg.available_milestones : [];
    const elementsList = window.PK9_RPG?.ELEMENTS || [];
    const unlockedIupac = rpg.periodic?.unlocked || [1, 6, 8];

    const isVisitorPreview = BXH_UI.visitorPreviewMode;
    const displayName = (isVisitorPreview && pv.anonymous_bxh)
      ? `Học viên #${rpg.anon_sbd || 'PK9-ANON'}`
      : (user?.display_name || 'Học Viên Phúc K9');
    const username = user?.username || 'khach_k9';
    const grade = rpg.bxh?.primary_grade || user?.settings?.preferred_grade || '2K9';
    const rawSchool = user?.settings?.school || 'Hệ Sinh Thái Học Cùng Phúc K9';
    const school = isVisitorPreview
      ? formatSchoolForPreview(rawSchool, grade, pv.school_visibility || 'province_grade', Boolean(pv.anonymous_bxh))
      : rawSchool;
    const sbd = (isVisitorPreview && pv.anonymous_bxh) ? (rpg.anon_sbd || rpg.sbd) : (rpg.sbd || 'K9-STUDENT');
    const motto = (isVisitorPreview && pv.anonymous_bxh) ? '' : (rpg.motto || '');

    const origin = (window.location?.origin && /^https?:\/\//i.test(window.location.origin))
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://thanhphuc.vercel.app';
    const qrPayload = `${origin}/?card=${encodeURIComponent(sbd)}&ref=${encodeURIComponent(sbd)}`;
    const qrSvgHtml = window.PK9_RPG?.buildQrSvg ? window.PK9_RPG.buildQrSvg(qrPayload, 118) : '';
    const logoSvgHtml = window.PK9_RPG?.buildStudentCardLogoSvg ? window.PK9_RPG.buildStudentCardLogoSvg(46) : '🪪';

    const badgeById = new Map(badges24.map(b => [b.id, b]));
    const heroBadge = sc.hero_badge ? badgeById.get(sc.hero_badge) || null : null;
    const unlockedSlotsCount = Number(sc.unlocked_slots || 2);
    const featuredEl = elementsList.find(e => e.z === Number(sc.featured_iupac || 8)) || { z: 8, sym: 'O', name: 'Oxi (Oxygen)' };

    // Lọc danh sách 24 Badges bên Khung Phải
    const filteredBadges = badges24.filter(bd => {
      if (BXH_UI.vaultStatusFilter === 'unlocked' && !bd.unlocked) return false;
      if (BXH_UI.vaultStatusFilter === 'locked' && bd.unlocked) return false;
      if (BXH_UI.vaultTypeFilter !== 'ALL' && bd.typeFilter !== BXH_UI.vaultTypeFilter) return false;
      if (BXH_UI.vaultSourceFilter !== 'ALL' && bd.sourceFilter !== BXH_UI.vaultSourceFilter) return false;
      return true;
    });

    const refInfo = rpg.social?.referral || {};

    root.innerHTML = `
      <div class="pk9-exam-hub">
        <!-- KHỐI TRÊN: NHÂN VẬT 3D + THẺ STUDENT ID QR + XUẤT ẢNH .PNG (9:16 & 16:9) -->
        <div class="pk9-idcard-layout">
          <div class="pk9-card">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
              <h3 style="margin:0;font-size:1.12rem;font-weight:900;">🧑‍🎓 Hồ Sơ Nhân Vật 3D, Tủ Kính Thành Tựu & Thẻ QR</h3>
              <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="shop" style="padding:0.34rem 0.68rem;font-size:0.75rem;">🛍️ Siêu Thị 3D</button>
                <button type="button" class="pk9-btn-exam-ghost" data-open-scanned-card="1" data-card-u="${esc(username)}" data-card-sbd="${esc(sbd)}" style="padding:0.34rem 0.68rem;font-size:0.75rem;">🔍 Soi Hồ Sơ Công Khai</button>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:1.1rem;flex-wrap:wrap;">
              ${window.PK9_RPG_MODELS?.renderAvatarStageHtml ? window.PK9_RPG_MODELS.renderAvatarStageHtml({
                size: 'lg',
                outfitId: eq.outfit?.id || 'outfit-scholar',
                frameClass: eq.frame?.cssClass || 'pk9-frame-bronze',
                auraClass: eq.aura ? (eq.aura.cssClass || eq.aura.id) : '',
                petId: eq.pet?.id || '',
                petIcon: eq.pet?.icon || '',
                petName: eq.pet?.name || ''
              }) : `<div style="font-size:2.6rem;">${eq.outfit?.icon || '🧑‍🎓'}</div>`}
              <div style="min-width:0;flex:1;">
                <div style="font-size:1.15rem;font-weight:900;">${esc(displayName)} <span class="pk9-badge pk9-badge-subj" style="font-size:0.72rem;">SBD: ${esc(sbd)}</span></div>
                <div style="font-size:0.81rem;color:var(--pk9-text-muted);margin:0.18rem 0 0.4rem;">
                  ${tier.icon} <b>${esc(tier.name)}</b> (${Number(user?.xp || 100)} EXP • Mở <b>${unlockedSlotsCount}/6</b> ô Showcase)
                  • Tuần: <b>${Number(rpg.bxh?.dxh_week || 0)} ĐXH</b>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:0.35rem;font-size:0.75rem;">
                  <span class="pk9-wallet-pill gold">🪙 <b>${rpg.gold ?? 180}</b> Vàng</span>
                  <span class="pk9-wallet-pill diamond">💎 <b>${rpg.diamonds ?? 5}</b> KC</span>
                  <span class="pk9-wallet-pill">🧩 Mảnh 3D: <b>${rpg.shop_shards || 0}</b></span>
                  <span class="pk9-wallet-pill">🔥 Cổ vũ: <b>${rpg.social?.cheer_score || 0}</b></span>
                </div>
              </div>
            </div>

            <form id="pk9-motto-form" class="pk9-motto-form" style="margin-top:0.75rem;">
              <input type="text" name="motto" class="pk9-input" maxlength="90" style="flex:1;margin-top:0;" placeholder="Nhập khẩu hiệu mục tiêu đại học (Không chứa link/SĐT)..." value="${esc(rpg.motto || '')}" />
              <button type="submit" class="pk9-btn-exam-primary" style="padding:0.48rem 0.85rem;font-size:0.8rem;">💾 Lưu khẩu hiệu</button>
            </form>

            <!-- NÚT XUẤT ẢNH .PNG THẾ HỆ MỚI (9:16 TIKTOK/STORY & 16:9 ZALO/FB) -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:0.45rem;margin-top:0.75rem;">
              <button type="button" class="pk9-btn-exam-primary" data-r3-export-png="9:16" style="padding:0.5rem 0.75rem;font-size:0.78rem;">
                📱 Xuất Thẻ .PNG Dọc (9:16 Story/TikTok)
              </button>
              <button type="button" class="pk9-btn-exam-primary" data-r3-export-png="16:9" style="padding:0.5rem 0.75rem;font-size:0.78rem;background:linear-gradient(135deg,#0284c7,#0d9488);">
                🖼️ Xuất Thẻ .PNG Ngang (16:9 Zalo/FB)
              </button>
              <button type="button" class="pk9-btn-exam-ghost" data-copy-card-url="${esc(qrPayload)}" style="padding:0.5rem 0.75rem;font-size:0.78rem;">
                🔗 Copy Link QR Referral
              </button>
            </div>

            ${refInfo.referred_by && !refInfo.rookie_chest_claimed ? `
              <div style="margin-top:0.65rem;padding:0.6rem 0.85rem;border-radius:0.8rem;background:rgba(16,185,129,0.16);border:1px solid rgba(16,185,129,0.45);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.45rem;">
                <span style="font-size:0.78rem;font-weight:700;">🎁 <b>Rương Tân Binh 9+</b> (Giới thiệu bởi ${esc(refInfo.referred_by)}): +100🪙, 1 Vé x2 EXP, 1 Vé IUPAC</span>
                <button type="button" class="pk9-btn-exam-primary" data-r4-claim-rookie="1" style="padding:0.38rem 0.75rem;font-size:0.75rem;">🎁 Mở Rương Tân Binh</button>
              </div>
            ` : ''}
          </div>

          <!-- THẺ HỌC VIÊN ĐIỆN TỬ CHÍNH THỨC (ĐỒNG BỘ TỦ KÍNH R3) -->
          <div class="pk9-student-idcard ${esc(eq.cardbg?.cssClass || 'pk9-cardbg-ocean')}" id="pk9-idcard-preview">
            <div class="pk9-idcard-brand-head">
              <div class="pk9-idcard-logo-wrap">${logoSvgHtml}</div>
              <div style="min-width:0;flex:1;">
                <div class="pk9-idcard-brand-kicker">THƯƠNG HIỆU ĐỘC QUYỀN • HỌC CÙNG PHÚC K9</div>
                <div class="pk9-idcard-brand-sub">THẺ HỌC VIÊN ĐIỆN TỬ CHÍNH THỨC • STUDENT ID</div>
                <div class="pk9-idcard-name">${esc(displayName)}</div>
              </div>
              <span class="pk9-badge pk9-badge-hot" style="font-size:0.7rem;">⚗️ ${featuredEl.z}-${esc(featuredEl.sym)}</span>
            </div>

            <!-- DẢI THÀNH TỰU R3 TRÊN THẺ QR -->
            <div style="display:flex;flex-wrap:wrap;gap:0.32rem;margin:0.45rem 0;padding:0.38rem 0.55rem;border-radius:0.65rem;background:rgba(15,23,42,0.45);">
              ${heroBadge ? `<span class="pk9-badge pk9-badge-hot" style="font-size:0.68rem;">★ ${heroBadge.icon} ${esc(heroBadge.name)} ×${heroBadge.count}</span>` : ''}
              ${(sc.showcase_badges || []).slice(0, 2).map(id => {
                const b = badgeById.get(id);
                return b ? `<span class="pk9-badge pk9-badge-code" style="font-size:0.66rem;">${b.icon} ${esc(b.name)} ×${b.count}</span>` : '';
              }).join('')}
              ${sc.milestone_cards?.[0] ? `<span class="pk9-badge pk9-badge-verified" style="font-size:0.66rem;">${sc.milestone_cards[0].icon || '🎯'} ${esc(sc.milestone_cards[0].valueText)}</span>` : ''}
            </div>

            <div class="pk9-idcard-body">
              <button type="button" class="pk9-qr-wrap pk9-qr-zoom-trigger" data-zoom-qr="1" data-qr-code="${esc(qrPayload)}" data-qr-name="${esc(displayName)}" data-qr-sbd="${esc(sbd)}" data-qr-u="${esc(username)}" data-qr-grade="${esc(grade)}">
                ${qrSvgHtml}
                <span class="pk9-qr-zoom-hint">📱 Quét QR mở Hồ Sơ R2</span>
              </button>
              <div class="pk9-idcard-meta">
                <div><span style="opacity:0.8;">Mã SBD:</span> <b style="font-size:0.95rem;color:#fef08a;">${esc(sbd)}</b></div>
                <div><span style="opacity:0.8;">Hệ học:</span> <b>${esc(grade)}</b> • <b>${tier.icon} ${esc(tier.name)}</b></div>
                <div><span style="opacity:0.8;">Đơn vị:</span> ${esc(school)}</div>
                <div><span style="opacity:0.8;">Tuần Hoàn:</span> <b>${unlockedIupac.length}/118</b> • <span style="opacity:0.8;">ĐXH Tuần:</span> <b>${rpg.bxh?.dxh_week || 0}</b></div>
                ${motto ? `<div style="margin-top:0.28rem;font-style:italic;opacity:0.94;">“${esc(motto)}”</div>` : ''}
              </div>
            </div>

            <div class="pk9-idcard-brand-foot">
              <span>${esc(rpg.exam_countdown?.bannerText || '✓ ĐÃ CẤP MÃ QR XÁC THỰC BỞI HỌC CÙNG PHÚC K9')}</span>
              <button type="button" class="pk9-idcard-preview-open-btn" data-open-scanned-card="1" data-card-u="${esc(username)}" data-card-sbd="${esc(sbd)}">
                👁️ Xem Hồ Sơ R2 ›
              </button>
            </div>
          </div>
        </div>

        <!-- BỐ CỤC 2 KHUNG TRỰC QUAN R3: KHUNG TRÁI (TỦ KÍNH 5 VÙNG) & KHUNG PHẢI (KHO 24 BADGES & GOAL DISCOVERY) -->
        <div class="pk9-grid-2" style="align-items:start;gap:1rem;">
          <!-- KHUNG TRÁI: TỦ KÍNH THÀNH TỰU 5 VÙNG & 4 SMART PRESETS -->
          <div class="pk9-card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.45rem;margin-bottom:0.65rem;">
              <div>
                <h4 style="margin:0;font-size:1.02rem;font-weight:900;">🏆 Khung Trái: Tủ Kính Thành Tựu 5 Vùng (R3)</h4>
                <span style="font-size:0.75rem;color:var(--pk9-text-muted);">Chạm vào ô bên dưới hoặc kéo-thả huy hiệu từ Kho bên phải vào</span>
              </div>
              <button type="button" class="pk9-admin-btn-xs ${isVisitorPreview ? 'active' : ''}" data-r3-toggle-visitor-preview="1" style="background:${isVisitorPreview ? '#10b981' : 'var(--pk9-surface-2)'};color:${isVisitorPreview ? '#fff' : 'var(--pk9-text)'};">
                👁️ ${isVisitorPreview ? 'Đang xem góc nhìn người lạ' : 'Xem thử góc nhìn người khác'}
              </button>
            </div>

            <!-- 4 SMART PRESETS 1-CHẠM -->
            <div style="margin-bottom:0.8rem;">
              <div style="font-size:0.75rem;font-weight:800;color:var(--pk9-text-muted);margin-bottom:0.35rem;">⚡ 4 BỘ SẮP XẾP NHANH 1-CHẠM (SMART PRESETS):</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:0.38rem;">
                ${[
                  { id: 'exam_warlord', lb: '🎯 1. Chiến Thần Luyện Đề' },
                  { id: 'pomodoro_valedictorian', lb: '⏱️ 2. Thủ Khoa Pomodoro' },
                  { id: 'iupac_collector', lb: '⚗️ 3. Nhà Sưu Tầm IUPAC' },
                  { id: 'weekly_top_glow', lb: '👑 4. Top Tuần Rực Rỡ' }
                ].map(p => `
                  <button type="button" class="pk9-btn-exam-ghost ${sc.active_preset === p.id ? 'active' : ''}" data-r3-apply-preset="${p.id}" style="padding:0.4rem 0.55rem;font-size:0.73rem;justify-content:flex-start;">
                    ${p.lb}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- VÙNG 1: Ô HUY HIỆU TÂM ĐIỂM (HERO BADGE SLOT) -->
            ${BXH_UI.selectedSlotTarget ? `
              <div style="margin-bottom:0.65rem;padding:0.45rem 0.7rem;border-radius:0.65rem;background:rgba(56,189,248,0.14);border:1px solid rgba(56,189,248,0.45);font-size:0.74rem;display:flex;justify-content:space-between;align-items:center;gap:0.4rem;">
                <span>🎯 Đang chọn: <b>${BXH_UI.selectedSlotTarget.type === 'hero' ? '★ Ô Huy Hiệu Tâm Điểm (Hero)' : `🏅 Ô Showcase #${Number(BXH_UI.selectedSlotTarget.index || 0) + 1}`}</b> — Chạm nút <b>📌 Gắn vào Tủ Kính</b> bên phải để lắp!</span>
                <button type="button" class="pk9-admin-btn-xs" data-r3-clear-slot="1">✕ Bỏ chọn</button>
              </div>
            ` : ''}
            <div style="margin-bottom:0.75rem;">
              <div style="font-size:0.75rem;font-weight:800;margin-bottom:0.3rem;">1. ★ Ô Huy Hiệu Tâm Điểm (Hero Badge • Mở cho 100% học viên):</div>
              <div class="pk9-r3-drop-slot ${BXH_UI.selectedSlotTarget?.type === 'hero' ? 'is-selected' : ''}" data-r3-select-slot="hero" data-r3-drop-zone="hero" style="padding:0.65rem 0.85rem;border-radius:0.8rem;border:2px dashed ${BXH_UI.selectedSlotTarget?.type === 'hero' ? '#38bdf8' : '#f59e0b'};background:rgba(245,158,11,0.08);cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                ${heroBadge ? `
                  <div>
                    <strong style="font-size:0.86rem;">${heroBadge.icon} ${esc(heroBadge.name)} <span style="color:#d97706;">×${heroBadge.count}</span></strong>
                    <span class="pk9-badge pk9-badge-code" style="font-size:0.68rem;margin-left:0.35rem;">${heroBadge.tierIcon} ${esc(heroBadge.tierName)}</span>
                  </div>
                ` : `<span style="font-size:0.8rem;color:var(--pk9-text-muted);">Chạm vào đây rồi chọn 1 Huy hiệu bên phải để gắn làm Hero Badge</span>`}
                <span style="font-size:0.72rem;color:var(--pk9-primary);font-weight:800;">Đổi ›</span>
              </div>
            </div>

            <!-- VÙNG 2: HÀNG HUY HIỆU TRƯNG BÀY (2-6 SHOWCASE SLOTS THEO BẬC RANK) -->
            <div style="margin-bottom:0.75rem;">
              <div style="font-size:0.75rem;font-weight:800;margin-bottom:0.3rem;">
                2. 🏅 Hàng Huy Hiệu Trưng Bày (${unlockedSlotsCount}/6 Ô mở khóa theo Bậc Rank${sc.borrowed_slot_3 ? ' • Ô 3 Mượn Tạm nhờ Streak >=7d / Top 10' : ''}):
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.42rem;">
                ${Array.from({ length: 6 }, (_, idx) => {
                  const isUnlockedSlot = idx < unlockedSlotsCount;
                  const isBorrowed = idx === 2 && sc.borrowed_slot_3;
                  const badgeId = sc.showcase_badges?.[idx];
                  const bd = badgeId ? badgeById.get(badgeId) : null;
                  const isSelected = BXH_UI.selectedSlotTarget?.type === 'showcase' && BXH_UI.selectedSlotTarget?.index === idx;
                  const reqRankLabels = ['Bậc Đồng (0 EXP)', 'Bậc Đồng (0 EXP)', 'Bậc Bạc (500 EXP)', 'Bậc Vàng (1.500 EXP)', 'Bậc Bạch Kim (3.500 EXP)', 'Bậc Kim Cương (7.000 EXP)'];
                  const reqExpThresholds = [0, 0, 500, 1500, 3500, 7000];
                  const curUserExp = Number(user?.xp || 100);
                  const remExp = Math.max(0, reqExpThresholds[idx] - curUserExp);
                  if (!isUnlockedSlot) {
                    return `
                      <div class="pk9-r3-locked-slot" data-r3-locked-slot-goal="${idx + 1}" data-req-rank="${esc(reqRankLabels[idx])}" data-rem-xp="${remExp}" style="padding:0.55rem;border-radius:0.75rem;border:1px dashed var(--pk9-border);background:var(--pk9-surface-2);opacity:0.82;cursor:pointer;text-align:center;" title="Bấm để xem lộ trình mở khóa Ô Trưng Bày #${idx + 1}">
                        <div style="font-size:1.1rem;">🔒 Ô #${idx + 1}</div>
                        <div style="font-size:0.67rem;color:var(--pk9-text-muted);">Cần ${reqRankLabels[idx]}</div>
                        <div style="font-size:0.65rem;color:#f59e0b;font-weight:800;">Thiếu ${remExp} EXP</div>
                        <div style="font-size:0.64rem;color:var(--pk9-primary);font-weight:800;">[Lộ trình mở ▶]</div>
                      </div>
                    `;
                  }
                  return `
                    <div class="pk9-r3-drop-slot ${isSelected ? 'is-selected' : ''}" data-r3-select-slot="showcase" data-r3-slot-idx="${idx}" data-r3-drop-zone="showcase:${idx}" style="padding:0.55rem;border-radius:0.75rem;border:2px ${isSelected ? 'solid #38bdf8' : 'dashed var(--pk9-border)'};background:var(--pk9-surface);cursor:pointer;text-align:center;">
                      <div style="font-size:0.66rem;font-weight:800;color:${isBorrowed ? '#0284c7' : 'var(--pk9-text-muted)'};">
                        Ô #${idx + 1} ${isBorrowed ? '(Tạm Mở)' : ''}
                      </div>
                      ${bd ? `
                        <div style="font-size:1.25rem;margin:0.1rem 0;">${bd.icon}</div>
                        <div style="font-size:0.71rem;font-weight:800;line-height:1.25;">${esc(bd.name)}</div>
                        <div style="font-size:0.66rem;color:#d97706;font-weight:800;">${bd.tierIcon} ×${bd.count}</div>
                      ` : `
                        <div style="font-size:1.1rem;color:var(--pk9-text-muted);margin:0.2rem 0;">+</div>
                        <div style="font-size:0.67rem;color:var(--pk9-text-muted);">Chạm gắn Badge</div>
                      `}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- VÙNG 3: 3 THẺ CỘT MỐC GHIM (SNAPSHOT KỶ LỤC XÁC THỰC) -->
            <div style="margin-bottom:0.75rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.3rem;">
                <span style="font-size:0.75rem;font-weight:800;">3. 📌 3 Thẻ Cột Mốc Ghim (Snapshot Kỷ Lục Xác Thực):</span>
                <button type="button" class="pk9-admin-btn-xs" data-r3-refresh-milestones="1">🔄 Làm mới số hiện tại</button>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.4rem;">
                ${[0, 1, 2].map(mIdx => {
                  const curM = sc.milestone_cards?.[mIdx] || availMilestones[mIdx] || { id: 'best_exam_score', label: 'Cột mốc', valueText: '—' };
                  return `
                    <div style="padding:0.5rem;border-radius:0.7rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
                      <select class="pk9-input pk9-r3-milestone-select" data-r3-milestone-slot="${mIdx}" style="margin:0 0 0.25rem;padding:0.25rem 0.4rem;font-size:0.7rem;">
                        ${availMilestones.map(am => `<option value="${esc(am.id)}" ${am.id === curM.id ? 'selected' : ''}>${am.icon} ${esc(am.label)}</option>`).join('')}
                      </select>
                      <div style="font-weight:900;font-size:0.92rem;color:var(--pk9-primary);">${esc(curM.valueText)}</div>
                      <div style="font-size:0.65rem;color:var(--pk9-text-muted);">✔ Chụp ${esc(curM.dateLabel || 'Hôm nay')}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- VÙNG 4: NGUYÊN TỐ IUPAC TÂM ĐIỂM -->
            <div style="margin-bottom:0.75rem;display:flex;align-items:center;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;">
              <span style="font-size:0.75rem;font-weight:800;">4. ⚗️ Nguyên Tố IUPAC Tâm Điểm (${unlockedIupac.length}/118 ô đã mở):</span>
              <select id="pk9-r3-iupac-select" class="pk9-input" style="margin:0;padding:0.35rem 0.6rem;font-size:0.76rem;max-width:240px;">
                ${unlockedIupac.map(z => {
                  const el = elementsList.find(e => e.z === z) || { z, sym: '?', name: `Nguyên tố #${z}` };
                  return `<option value="${z}" ${Number(sc.featured_iupac) === z ? 'selected' : ''}>Z=${z} • ${esc(el.sym)} — ${esc(el.name)}</option>`;
                }).join('')}
              </select>
            </div>

            <!-- VÙNG 5: COMBO NỀN THẺ QR, KHUNG VIỀN TỦ KÍNH & LINH VẬT (ĐỒNG BỘ SIÊU THỊ 3D) -->
            <div style="margin-bottom:0.75rem;padding:0.6rem 0.75rem;border-radius:0.75rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
              <div style="font-size:0.75rem;font-weight:800;margin-bottom:0.4rem;">5. 🎨 Vùng 5 — Combo Nền Thẻ QR & Khung Viền Tủ Kính R3 (Đồng bộ Siêu Thị 3D):</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:0.45rem;font-size:0.73rem;">
                <label style="display:flex;flex-direction:column;gap:0.2rem;">
                  <span>Nền Thẻ QR (Đã sở hữu):</span>
                  <select id="pk9-r3-cardbg-select" class="pk9-input" style="margin:0;padding:0.32rem;font-size:0.72rem;">
                    ${[
                      { id: 'cardbg-ocean', name: '🌊 Đại Dương Tri Thức' },
                      { id: 'cardbg-emerald', name: '🌿 Rừng Ngọc Lục Bảo' },
                      { id: 'cardbg-sakura', name: '🌸 Anh Đào Mùa Thi' },
                      { id: 'cardbg-sunset', name: '🌅 Hoàng Hôn Rực Lửa' },
                      { id: 'cardbg-crimson', name: '🔥 Huyết Ngọc Chiến Thần' },
                      { id: 'cardbg-cyber', name: '⚡ Cyberpunk 2077 K9' },
                      { id: 'cardbg-starlight', name: '🌌 Tinh Vân Vũ Trụ' },
                      { id: 'cardbg-royal', name: '👑 Hoàng Gia Tối Thượng (7d/Vĩnh viễn)' }
                    ].filter(bg => (rpg.inventory || ['cardbg-ocean']).includes(bg.id) || eq.cardbg?.id === bg.id).map(bg => `
                      <option value="${esc(bg.id)}" ${eq.cardbg?.id === bg.id ? 'selected' : ''}>${esc(bg.name)}</option>
                    `).join('')}
                  </select>
                </label>
                <label style="display:flex;flex-direction:column;gap:0.2rem;">
                  <span>Khung Viền Tủ Kính R3:</span>
                  <select id="pk9-r3-showcase-frame-select" class="pk9-input" style="margin:0;padding:0.32rem;font-size:0.72rem;">
                    <option value="default" ${(sc.showcase_frame || 'default') === 'default' ? 'selected' : ''}>🛡️ Khung Tiêu Chuẩn Phúc K9</option>
                    ${(rpg.inventory || []).includes('showcase-frame-crystal') ? `<option value="crystal" ${sc.showcase_frame === 'crystal' ? 'selected' : ''}>💠 Khung Pha Lê Quang Học</option>` : ''}
                    ${(rpg.inventory || []).includes('showcase-frame-nebula') ? `<option value="nebula" ${sc.showcase_frame === 'nebula' ? 'selected' : ''}>🌌 Khung Tinh Vân Vũ Trụ</option>` : ''}
                    ${(Number(user?.xp || 0) >= 13000 || Object.values(rpg.bxh?.division_by_grade || {}).includes('legend')) ? `<option value="legend_gold" ${sc.showcase_frame === 'legend_gold' ? 'selected' : ''}>👑 Khung Hoàng Kim Huyền Thoại</option>` : ''}
                  </select>
                </label>
              </div>
            </div>

            <!-- CÀI ĐẶT QUYỀN RIÊNG TƯ & AN TOÀN HỌC ĐƯỜNG (SAFE-BY-DEFAULT R2) -->
            <div style="padding-top:0.7rem;border-top:1px dashed var(--pk9-border);">
              <div style="font-size:0.78rem;font-weight:900;margin-bottom:0.45rem;">🛡️ Cài Đặt Quyền Riêng Tư & An Toàn Học Đường (Safe-by-Default R2):</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0.45rem;font-size:0.74rem;">
                <label style="display:flex;flex-direction:column;gap:0.2rem;">
                  <span>Hiển thị Trường / Địa phương:</span>
                  <select id="pk9-r2-priv-school" class="pk9-input" style="margin:0;padding:0.32rem;font-size:0.73rem;">
                    <option value="public_all" ${pv.school_visibility === 'public_all' ? 'selected' : ''}>Công khai Trường + Hệ học</option>
                    <option value="province_grade" ${pv.school_visibility === 'province_grade' ? 'selected' : ''}>Mặc định THPT (Tỉnh/Hệ học)</option>
                    <option value="hide_all" ${pv.school_visibility === 'hide_all' ? 'selected' : ''}>Ẩn hoàn toàn Trường (Mặc định 2K12)</option>
                  </select>
                </label>
                <label style="display:flex;flex-direction:column;gap:0.2rem;">
                  <span>Nhận lời mời Đấu Trường 1v1:</span>
                  <select id="pk9-r2-priv-1v1" class="pk9-input" style="margin:0;padding:0.32rem;font-size:0.73rem;">
                    <option value="everyone" ${pv.allow_1v1_invites === 'everyone' ? 'selected' : ''}>Mọi học viên</option>
                    <option value="friends_only" ${pv.allow_1v1_invites === 'friends_only' ? 'selected' : ''}>Chỉ Bạn học / Rival (Mặc định 2K12)</option>
                    <option value="none" ${pv.allow_1v1_invites === 'none' ? 'selected' : ''}>Tắt toàn bộ lời mời 1v1</option>
                  </select>
                </label>
                <label style="display:flex;flex-direction:column;gap:0.2rem;">
                  <span>Phòng Pomodoro 9+ Cộng Hưởng:</span>
                  <select id="pk9-r2-priv-pomo" class="pk9-input" style="margin:0;padding:0.32rem;font-size:0.73rem;">
                    <option value="everyone" ${(pv.allow_pomodoro_costudy || 'everyone') === 'everyone' ? 'selected' : ''}>Ghép cùng học viên cùng Hệ</option>
                    <option value="friends_only" ${pv.allow_pomodoro_costudy === 'friends_only' ? 'selected' : ''}>Chỉ Bạn học / Study Squad (Mặc định 2K12)</option>
                  </select>
                </label>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:0.5rem;font-size:0.75rem;">
                <label style="display:inline-flex;align-items:center;gap:0.35rem;cursor:pointer;">
                  <input type="checkbox" id="pk9-r2-priv-anon" ${pv.anonymous_bxh ? 'checked' : ''} />
                  <span><b>Ẩn Danh BXH</b> (Chỉ hiện <code>Học viên #${esc(rpg.anon_sbd || 'PK9-ANON')}</code> & khóa <code>?card=${esc(username)}</code>)</span>
                </label>
                <label style="display:inline-flex;align-items:center;gap:0.35rem;cursor:pointer;">
                  <input type="checkbox" id="pk9-r2-priv-flag" ${pv.show_island_flag_pin ? 'checked' : ''} />
                  <span>Hiện ghim tên trên <b>Cờ Vùng Tuần 🚩</b></span>
                </label>
              </div>
              ${Array.isArray(pv.blocked_users) && pv.blocked_users.length ? `
                <div style="margin-top:0.55rem;padding:0.45rem 0.65rem;border-radius:0.65rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);font-size:0.72rem;">
                  <div style="font-weight:800;margin-bottom:0.3rem;">🚫 Danh sách đang chặn (${pv.blocked_users.length} tài khoản • Khóa 5 kênh):</div>
                  <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                    ${pv.blocked_users.map(bu => `
                      <span class="pk9-badge pk9-badge-code" style="display:inline-flex;align-items:center;gap:0.3rem;">
                        @${esc(bu)}
                        <button type="button" data-r2-block-user="${esc(bu)}" data-r2-unblock-inline="1" style="border:none;background:none;color:#ef4444;font-weight:900;cursor:pointer;padding:0;" title="Bỏ chặn @${esc(bu)}">✕</button>
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              <button type="button" class="pk9-btn-exam-primary" data-r2-save-privacy="1" style="margin-top:0.55rem;padding:0.42rem 0.85rem;font-size:0.76rem;">
                🛡️ Lưu Cài Đặt Riêng Tư
              </button>
            </div>
          </div>

          <!-- KHUNG PHẢI: KHO 24 BADGES (6 BẬC) & GOAL DISCOVERY ("ĐI LÀM NGAY") -->
          <div class="pk9-card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.55rem;">
              <div>
                <h4 style="margin:0;font-size:1.02rem;font-weight:900;">🎖️ Khung Phải: Kho Thành Tựu & 24 Badges (6 Bậc ×N)</h4>
                <span style="font-size:0.74rem;color:var(--pk9-text-muted);">
                  Đã mở khóa <b>${badges24.filter(x => x.unlocked).length} / ${badges24.length}</b> Badges • Bấm vào Badge đã mở để gắn vào ô Tủ Kính đang chọn
                </span>
              </div>
            </div>

            <!-- 3 TẦNG BỘ LỌC THÔNG MINH -->
            <div style="display:flex;flex-direction:column;gap:0.38rem;margin-bottom:0.75rem;padding-bottom:0.6rem;border-bottom:1px dashed var(--pk9-border);">
              <div class="pk9-exam-tabs">
                ${[
                  { id: 'ALL', lb: 'Tất cả (24)' },
                  { id: 'unlocked', lb: `Đã sở hữu (${badges24.filter(x => x.unlocked).length})` },
                  { id: 'locked', lb: `Chưa mở khóa (${badges24.filter(x => !x.unlocked).length})` }
                ].map(f => `<button type="button" class="pk9-exam-chip ${BXH_UI.vaultStatusFilter === f.id ? 'active' : ''}" data-r3-filter-status="${f.id}" style="font-size:0.72rem;padding:0.28rem 0.6rem;">${f.lb}</button>`).join('')}
              </div>
              <div class="pk9-exam-tabs">
                ${[
                  { id: 'ALL', lb: 'Mọi loại' },
                  { id: 'weekly_fx', lb: '✨ Huy hiệu có Hiệu ứng Tuần (7 ngày)' },
                  { id: 'permanent', lb: '🏅 Thành tựu Vĩnh viễn' },
                  { id: 'seasonal', lb: '🔥 Sự kiện Mùa Thi' }
                ].map(f => `<button type="button" class="pk9-exam-chip ${BXH_UI.vaultTypeFilter === f.id ? 'active' : ''}" data-r3-filter-type="${f.id}" style="font-size:0.71rem;padding:0.26rem 0.55rem;">${f.lb}</button>`).join('')}
              </div>
              <div class="pk9-exam-tabs">
                ${[
                  { id: 'ALL', lb: 'Mọi nguồn' },
                  { id: 'bxh', lb: '🏆 BXH & Đấu Trường' },
                  { id: 'exam2018', lb: '🏛️ Phòng thi ảo GDPT 2018' },
                  { id: 'pomodoro', lb: '⏱️ Pomodoro & Flashcard 3D' },
                  { id: 'iupac', lb: '⚗️ 118 Ô IUPAC & Vượt Đảo' }
                ].map(f => `<button type="button" class="pk9-exam-chip ${BXH_UI.vaultSourceFilter === f.id ? 'active' : ''}" data-r3-filter-source="${f.id}" style="font-size:0.71rem;padding:0.26rem 0.55rem;">${f.lb}</button>`).join('')}
              </div>
            </div>

            <!-- DANH SÁCH 24 BADGES KÈM GOAL DISCOVERY ("ĐI LÀM NGAY ▶") -->
            <div style="display:grid;grid-template-columns:1fr;gap:0.5rem;max-height:620px;overflow-y:auto;padding-right:0.2rem;">
              ${filteredBadges.map(bd => {
                const isEquippedHero = sc.hero_badge === bd.id;
                const isEquippedShowcase = (sc.showcase_badges || []).includes(bd.id);
                return `
                  <div class="pk9-r3-badge-item ${bd.unlocked ? 'is-unlocked' : 'is-locked'}" draggable="${bd.unlocked ? 'true' : 'false'}" data-r3-drag-badge="${esc(bd.id)}" style="padding:0.65rem 0.8rem;border-radius:0.8rem;background:var(--pk9-surface-2);border:1.5px solid ${isEquippedHero ? '#f59e0b' : isEquippedShowcase ? '#38bdf8' : 'var(--pk9-border)'};display:flex;justify-content:space-between;align-items:center;gap:0.65rem;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:0.65rem;flex:1;min-width:200px;">
                      <div style="width:42px;height:42px;border-radius:0.75rem;background:var(--pk9-surface);display:flex;align-items:center;justify-content:center;font-size:1.45rem;flex-shrink:0;border:2px solid ${esc(bd.tierColor || '#64748b')};">
                        ${bd.icon}
                      </div>
                      <div style="min-width:0;flex:1;">
                        <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
                          <strong style="font-size:0.84rem;">#${bd.num}. ${esc(bd.name)}</strong>
                          ${bd.unlocked ? `<span class="pk9-badge pk9-badge-hot" style="font-size:0.66rem;">×${bd.count} • ${bd.tierIcon} ${esc(bd.tierName)}</span>` : `<span class="pk9-badge pk9-badge-code" style="font-size:0.66rem;">🔒 Chưa mở khóa</span>`}
                          ${bd.hasWeeklyFx ? `<span class="pk9-badge pk9-badge-subj" style="font-size:0.64rem;">✨ Hiệu ứng Tuần 7d</span>` : ''}
                        </div>
                        <div style="font-size:0.73rem;color:var(--pk9-text-muted);margin:0.18rem 0 0.3rem;line-height:1.4;">${esc(bd.desc)}</div>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                          <div class="pk9-topic-track" style="height:0.32rem;flex:1;">
                            <div class="pk9-topic-fill" style="width:${bd.progressPct}%;"></div>
                          </div>
                          <span style="font-size:0.68rem;color:var(--pk9-text-muted);white-space:nowrap;">
                            ${bd.nextThreshold ? `${bd.count}/${bd.nextThreshold} ${esc(bd.unit)} (Thiếu ${bd.remainingToNext})` : `Đạt đỉnh ${bd.count} ${esc(bd.unit)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:0.3rem;align-items:flex-end;">
                      ${bd.unlocked ? `
                        <button type="button" class="pk9-btn-exam-primary" data-r3-assign-badge="${esc(bd.id)}" style="padding:0.35rem 0.7rem;font-size:0.73rem;">
                          ${isEquippedHero ? '★ Đang ở Hero' : isEquippedShowcase ? '✓ Đang ở Tủ Kính' : '📌 Gắn vào Tủ Kính'}
                        </button>
                      ` : ''}
                      <button type="button" class="pk9-btn-exam-ghost" data-nav-tab="${esc(bd.actionTab || 'exams')}" style="padding:0.32rem 0.65rem;font-size:0.71rem;white-space:nowrap;">
                        ${esc(bd.actionLabel || 'Đi làm ngay')} ▶
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Chờ webfont ("Be Vietnam Pro", gồm cả tập unicode-range tiếng Việt) sẵn sàng với giới hạn thời gian để vẽ <canvas> không rơi về font mặc định trên mạng chậm
  async function waitForCanvasFonts(timeoutMs = 800) {
    try {
      const fonts = document.fonts;
      if (!fonts) return;
      const vnSample = 'HỌC CÙNG PHÚC K9 Thẻ Học Viên Điện Tử ĐXH Ước Ạ';
      const tasks = [];
      if (fonts.ready && typeof fonts.ready.then === 'function') {
        tasks.push(Promise.resolve(fonts.ready).catch(() => {}));
      }
      if (typeof fonts.load === 'function') {
        for (const spec of ['700 24px "Be Vietnam Pro"', '400 20px "Be Vietnam Pro"']) {
          tasks.push(Promise.resolve().then(() => fonts.load(spec, vnSample)).catch(() => {}));
        }
      }
      if (!tasks.length) return;
      let timer = null;
      try {
        await Promise.race([
          Promise.all(tasks),
          new Promise(resolve => { timer = setTimeout(resolve, timeoutMs); })
        ]);
      } finally {
        if (timer !== null) clearTimeout(timer);
      }
    } catch {}
  }

  // Xuất ảnh THẺ HỌC VIÊN ĐIỆN TỬ .PNG Thế Hệ Mới (Hỗ trợ cả 2 khổ 9:16 Dọc & 16:9 Ngang, đồng bộ Tủ Kính R3)
  async function exportNextGenStudentCardPng(aspectRatio = '16:9') {
    const rpg = getRpg();
    const user = getUser();
    const eq = rpg.equipped_details || {};
    const pv = rpg.privacy || {};
    const sc = rpg.showcase || {};
    const badges24 = Array.isArray(rpg.badges_24) ? rpg.badges_24 : [];
    const badgeById = new Map(badges24.map(b => [b.id, b]));
    const elementsList = window.PK9_RPG?.ELEMENTS || [];

    const isAnon = Boolean(pv.anonymous_bxh);
    const displayName = isAnon ? `Học viên #${rpg.anon_sbd || 'PK9-ANON'}` : (user?.display_name || 'Học Viên Phúc K9');
    const sbd = isAnon ? (rpg.anon_sbd || rpg.sbd || 'PK9-ANON') : (rpg.sbd || 'K9-STUDENT');
    const grade = rpg.bxh?.primary_grade || user?.settings?.preferred_grade || '2K9';
    const school = formatSchoolForPreview(
      user?.settings?.school || 'Hệ Sinh Thái Học Cùng Phúc K9',
      grade,
      pv.school_visibility || 'province_grade',
      isAnon
    );
    const tierName = rpg.tier?.name || 'Bậc Đồng';
    const motto = isAnon ? '' : (rpg.motto || 'Học chắc - Luyện kỹ - Bứt phá 9+');
    const dxhWeek = Number(rpg.bxh?.dxh_week || 0);
    const countdownText = rpg.exam_countdown?.bannerText || 'HỆ SINH THÁI LUYỆN THI 9+ MIỄN PHÍ';

    const heroBadge = sc.hero_badge ? badgeById.get(sc.hero_badge) : badges24.find(b => b.unlocked);
    const showBadges = (sc.showcase_badges || []).map(id => badgeById.get(id)).filter(Boolean).slice(0, 2);
    const topMilestone = (sc.milestone_cards || [])[0] || { label: 'Chuỗi Streak', valueText: `${user?.streak || 1} ngày` };
    const featuredEl = elementsList.find(e => e.z === Number(sc.featured_iupac || 8)) || { z: 8, sym: 'O', name: 'Oxi' };
    const fitText = (str, maxLen) => {
      const s = String(str || '');
      return s.length > maxLen ? `${s.slice(0, Math.max(1, maxLen - 1))}…` : s;
    };

    const origin = (window.location?.origin && /^https?:\/\//i.test(window.location.origin))
      ? window.location.origin.replace(/\/+$/, '')
      : 'https://thanhphuc.vercel.app';
    const qrUrl = `${origin}/?card=${encodeURIComponent(sbd)}&ref=${encodeURIComponent(sbd)}`;

    const isVertical = aspectRatio === '9:16';
    const W = isVertical ? 720 : 1280;
    const H = isVertical ? 1280 : 720;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const qrSvgStr = window.PK9_RPG?.buildQrSvg ? window.PK9_RPG.buildQrSvg(qrUrl, 256) : '';
    const logoSvgStr = window.PK9_RPG?.buildStudentCardLogoSvg ? window.PK9_RPG.buildStudentCardLogoSvg(88) : '';

    const loadSvgImg = svgText => new Promise(resolve => {
      if (!svgText) return resolve(null);
      let done = false;
      const finish = img => { if (!done) { done = true; resolve(img); } };
      const timer = setTimeout(() => finish(null), 2500);
      try {
        const b = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const u = URL.createObjectURL(b);
        const im = new Image();
        im.onload = () => { clearTimeout(timer); URL.revokeObjectURL(u); finish(im); };
        im.onerror = () => { clearTimeout(timer); URL.revokeObjectURL(u); finish(null); };
        im.src = u;
      } catch {
        clearTimeout(timer);
        finish(null);
      }
    });

    // Tải sẵn SVG Logo & QR song song với chờ font "Be Vietnam Pro" sẵn sàng (tối đa 800ms)
    const svgLoadsPromise = Promise.all([loadSvgImg(logoSvgStr), loadSvgImg(qrSvgStr)]);
    await waitForCanvasFonts(800);

    const drawCenteredText = (text, cx, y, maxWidth) => {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillText(String(text || ''), cx, y, maxWidth);
      ctx.restore();
    };

    const grad = ctx.createLinearGradient(0, 0, W, H);
    const bgId = eq.cardbg?.id || 'cardbg-ocean';
    if (bgId === 'cardbg-emerald') { grad.addColorStop(0, '#064e3b'); grad.addColorStop(0.6, '#059669'); grad.addColorStop(1, '#0d9488'); }
    else if (bgId === 'cardbg-sakura') { grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(0.55, '#4c1d95'); grad.addColorStop(1, '#be185d'); }
    else if (bgId === 'cardbg-sunset') { grad.addColorStop(0, '#7c2d12'); grad.addColorStop(0.55, '#ea580c'); grad.addColorStop(1, '#db2777'); }
    else if (bgId === 'cardbg-crimson') { grad.addColorStop(0, '#18080b'); grad.addColorStop(0.55, '#7f1d1d'); grad.addColorStop(1, '#be123c'); }
    else if (bgId === 'cardbg-cyber') { grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(0.6, '#6d28d9'); grad.addColorStop(1, '#ec4899'); }
    else if (bgId === 'cardbg-starlight') { grad.addColorStop(0, '#060919'); grad.addColorStop(0.55, '#1e1b4b'); grad.addColorStop(1, '#312e81'); }
    else if (bgId === 'cardbg-royal') { grad.addColorStop(0, '#09090b'); grad.addColorStop(0.55, '#1c1917'); grad.addColorStop(1, '#78350f'); }
    else { grad.addColorStop(0, '#0f172a'); grad.addColorStop(0.6, '#1d4ed8'); grad.addColorStop(1, '#0d9488'); }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Khung viền Hoàng Kim
    ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
    ctx.fillRect(32, 32, W - 64, H - 64);
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.72)';
    ctx.lineWidth = 3;
    ctx.strokeRect(32, 32, W - 64, H - 64);

    if (isVertical) {
      // BỐ CỤC DỌC 9:16 (720 x 1280 — TỐI ƯU TIKTOK / STORY)
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 20px "Be Vietnam Pro", sans-serif';
      ctx.fillText('HỌC CÙNG PHÚC K9 • STUDENT ID 9+', 156, 86, 504);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Be Vietnam Pro", sans-serif';
      ctx.fillText('THẺ HỌC VIÊN ĐIỆN TỬ', 156, 122, 504);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
      ctx.fillText(countdownText, 156, 150, 504);

      // Khối Nhân vật 3D & Trang bị + Medallion Huy hiệu
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(60, 185, 600, 190);
      ctx.save();
      ctx.beginPath();
      ctx.arc(585, 275, 56, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15,23,42,0.72)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();
      ctx.font = '46px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(eq.outfit?.icon || '🧑‍🎓', 585, 290);
      if (eq.pet?.icon) {
        ctx.font = '26px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.fillText(eq.pet.icon, 628, 322);
      }
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(displayName, 24), 84, 240, 430);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 21px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`SBD: ${sbd} • Hệ: ${grade}`, 32), 84, 282, 430);
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '19px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`Hạng: ${tierName} • Tuần: ${dxhWeek} ĐXH`, 36), 84, 318, 430);
      ctx.fillText(fitText(`Đồ: ${eq.outfit?.name || 'Áo Blouse Thủ Khoa'}${eq.pet ? ` • ${eq.pet.name}` : ''}`, 38), 84, 352, 430);

      // Dải Tủ Kính Thành Tựu R3
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fillRect(60, 398, 600, 260);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.strokeRect(60, 398, 600, 260);

      // Ô Nguyên tố IUPAC Tâm Điểm góc phải Tủ Kính
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(556, 414, 86, 86);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.strokeRect(556, 414, 86, 86);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
      drawCenteredText(`Z=${featuredEl.z}`, 599, 434, 78);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Be Vietnam Pro", sans-serif';
      drawCenteredText(featuredEl.sym, 599, 474, 78);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '12px "Be Vietnam Pro", sans-serif';
      drawCenteredText('IUPAC', 599, 492, 78);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 21px "Be Vietnam Pro", sans-serif';
      ctx.fillText('🏆 TỦ KÍNH THÀNH TỰU CÁ NHÂN (R3)', 84, 438, 456);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(heroBadge ? `★ Hero: ${heroBadge.name} (×${heroBadge.count} • ${heroBadge.tierName})` : '★ Hero: Tân Binh Bứt Phá 9+', 40), 84, 480, 456);

      ctx.fillStyle = '#bae6fd';
      ctx.font = '18px "Be Vietnam Pro", sans-serif';
      const sbText = showBadges.length ? showBadges.map(b => `${b.name} (×${b.count})`).join(' • ') : 'Chiến Binh Luyện Đề K9';
      ctx.fillText(fitText(`🏅 Showcase: ${sbText}`, 48), 84, 526, 556);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 19px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`📌 Kỷ lục: ${topMilestone.label} — ${topMilestone.valueText}`, 58), 84, 566, 556);

      ctx.fillStyle = '#f9a8d4';
      ctx.font = 'bold 18px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`⚗️ Nguyên tố Tâm Điểm: ${featuredEl.z}-${featuredEl.sym} • Mở ${(rpg.periodic?.unlocked || [1, 6, 8]).length}/118 ô IUPAC`, 52), 84, 604, 556);

      if (motto) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'italic 19px "Be Vietnam Pro", sans-serif';
        ctx.fillText(`“${fitText(motto, 52)}”`, 84, 640, 556);
      }

      // Khối QR lớn ở giữa dưới
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(210, 686, 300, 342);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
      drawCenteredText('QUÉT QR SOI HỒ SƠ & NHẬN RƯƠNG 9+', 360, 1002, 276);

      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 19px "Be Vietnam Pro", sans-serif';
      drawCenteredText(`🏫 ${fitText(school, 48)}`, 360, 1086, 592);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 17px "Be Vietnam Pro", sans-serif';
      drawCenteredText('✓ XÁC THỰC BỞI HỆ SINH THÁI HỌC CÙNG PHÚC K9', 360, 1134, 592);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
      drawCenteredText('THANHPHUC.VERCEL.APP', 360, 1170, 592);
    } else {
      // BỐ CỤC NGANG 16:9 (1280 x 720 — TỐI ƯU ZALO / FACEBOOK FEED)
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 21px "Be Vietnam Pro", sans-serif';
      ctx.fillText('THƯƠNG HIỆU ĐỘC QUYỀN • HỆ SINH THÁI HỌC CÙNG PHÚC K9', 166, 86, 1054);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 31px "Be Vietnam Pro", sans-serif';
      ctx.fillText('THẺ HỌC VIÊN ĐIỆN TỬ CHÍNH THỨC • STUDENT ID', 166, 126, 1054);
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 18px "Be Vietnam Pro", sans-serif';
      ctx.fillText(countdownText, 166, 156, 1054);

      // Medallion Nhân vật 3D + Linh thú trên khổ 16:9
      ctx.save();
      ctx.beginPath();
      ctx.arc(802, 250, 52, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15,23,42,0.72)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();
      ctx.font = '44px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(eq.outfit?.icon || '🧑‍🎓', 802, 265);
      if (eq.pet?.icon) {
        ctx.font = '24px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
        ctx.fillText(eq.pet.icon, 842, 294);
      }
      ctx.restore();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(displayName, 26), 68, 226, 668);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 23px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`MÃ SBD: ${sbd} • HỆ: ${grade} • HẠNG: ${tierName}`, 46), 68, 270, 668);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '20px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`Đơn vị: ${school} | ĐXH Tuần: ${dxhWeek} ĐXH`, 56), 68, 312, 668);

      // Khung Tủ Kính Thành Tựu R3
      ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
      ctx.fillRect(68, 348, 790, 214);
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
      ctx.strokeRect(68, 348, 790, 214);

      // Ô Nguyên tố IUPAC Tâm Điểm góc phải khung Tủ Kính
      ctx.fillStyle = 'rgba(16, 185, 129, 0.24)';
      ctx.fillRect(754, 366, 86, 86);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.strokeRect(754, 366, 86, 86);
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
      drawCenteredText(`Z=${featuredEl.z}`, 797, 386, 78);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Be Vietnam Pro", sans-serif';
      drawCenteredText(featuredEl.sym, 797, 426, 78);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '12px "Be Vietnam Pro", sans-serif';
      drawCenteredText('IUPAC', 797, 444, 78);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 21px "Be Vietnam Pro", sans-serif';
      ctx.fillText('🏆 TỦ KÍNH THÀNH TỰU R3 & KỶ LỤC HỌC THẬT:', 92, 388, 648);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(heroBadge ? `★ Hero Badge: ${heroBadge.name} (×${heroBadge.count} • ${heroBadge.tierName})` : '★ Hero Badge: Tân Binh Bứt Phá 9+', 52), 92, 426, 648);

      const sbText = showBadges.length ? showBadges.map(b => `${b.name} (×${b.count})`).join(' • ') : 'Chiến Binh Luyện Đề K9';
      ctx.fillStyle = '#bae6fd';
      ctx.font = '19px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`🏅 Showcase: ${sbText}`, 60), 92, 466, 748);

      ctx.fillStyle = '#6ee7b7';
      ctx.font = 'bold 19px "Be Vietnam Pro", sans-serif';
      ctx.fillText(fitText(`📌 ${topMilestone.label}: ${topMilestone.valueText} | ⚗️ ${(rpg.periodic?.unlocked || [1, 6, 8]).length}/118 ô IUPAC`, 64), 92, 504, 748);

      if (motto) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'italic 19px "Be Vietnam Pro", sans-serif';
        ctx.fillText(`🎯 “${fitText(motto, 64)}”`, 92, 542, 748);
      }

      ctx.fillStyle = 'rgba(16, 185, 129, 0.32)';
      ctx.fillRect(68, 588, 790, 54);
      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 18px "Be Vietnam Pro", sans-serif';
      drawCenteredText('✓ QUÉT MÃ QR ĐỂ SOI HỒ SƠ CÔNG KHAI 3D & MỞ RƯƠNG TÂN BINH 9+', 463, 621, 758);

      // Khối QR bên phải
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(904, 204, 302, 348);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
      drawCenteredText('QUÉT QR MỞ HỒ SƠ & NHẬN QUÀ', 1055, 522, 278);

      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
      drawCenteredText('THANHPHUC.VERCEL.APP', 1055, 621, 302);
    }

    const [logoImg, qrImg] = await svgLoadsPromise;
    if (logoImg) ctx.drawImage(logoImg, 56, 56, 86, 86);
    if (qrImg) {
      if (isVertical) ctx.drawImage(qrImg, 232, 704, 256, 256);
      else ctx.drawImage(qrImg, 927, 224, 256, 256);
    }
    const filename = `the-hoc-vien-phuck9-${sbd}-${isVertical ? '9x16' : '16x9'}.png`;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    a.click();
    toast(`⬇️ Đã xuất ảnh Thẻ Học Viên .PNG khổ ${aspectRatio} (đồng bộ Tủ Kính R3) thành công!`, 'success');
    return { filename, dataUrl, width: W, height: H, aspectRatio };
  }

  // ==========================================================================
  // 4. R4: BÀN HỌC POMODORO 9+ CỘNG HƯỞNG (CO-STUDY IM LẶNG 2-4 BẠN)
  // ==========================================================================
  function enhancePlannerTabDom() {
    const root = document.getElementById('tab-planner');
    if (!root || root.querySelector('#pk9-r4-pomodoro-costudy-panel')) return;
    const rpg = getRpg();
    const user = getUser();
    const eq = rpg.equipped_details || {};
    const minsToday = Number(rpg.bxh?.daily_caps?.pomodoro_mins_today || 0);
    const totalHours = ((Number(rpg.social?.pomodoro_total_mins || 0)) / 60).toFixed(1);
    const coSessions = Number(rpg.social?.costudy_sessions || 0);
    const is2K12 = (rpg.bxh?.primary_grade || user?.settings?.preferred_grade) === '2K12';
    const pv = rpg.privacy || {};
    const friendsOnlyCoStudy = pv.allow_pomodoro_costudy === 'friends_only' || (is2K12 && pv.allow_pomodoro_costudy !== 'everyone');
    const blockedSet = new Set((pv.blocked_users || []).map(x => String(x).toLowerCase()));
    const allowedFriends = new Set([
      ...(rpg.social?.rivals || []).map(x => String(x).toLowerCase()),
      ...((getLbData()?.my_bxh_status?.study_squad?.members || []).map(x => String(x).toLowerCase()))
    ]);

    const lbRows = (getLbData()?.tier1_division?.rows || getLbData()?.weekly_leaderboard || [])
      .filter(r => {
        if (r.is_admin || r.blocked_by_peer) return false;
        const ru = String(r.username || '').toLowerCase();
        if (user && ru === String(user.username || '').toLowerCase()) return false;
        if (blockedSet.has(ru)) return false;
        if (r.allow_pomodoro_costudy === 'friends_only' && !allowedFriends.has(ru)) return false;
        if (friendsOnlyCoStudy) return allowedFriends.has(ru);
        return true;
      })
      .slice(0, 3);

    const panel = document.createElement('div');
    panel.id = 'pk9-r4-pomodoro-costudy-panel';
    panel.style.marginTop = '1rem';
    panel.innerHTML = `
      <div class="pk9-grid-2" style="gap:1rem;">
        <!-- CHECK-IN ACTIVE COUPLING NHẬN +20 / +42 ĐXH TUẦN -->
        <div class="pk9-card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.55rem;">
            <strong style="font-size:0.96rem;">✅ Check-in Xác Thực Pomodoro 9+ (+20 / +42 ĐXH Tuần)</strong>
            <span class="pk9-badge pk9-badge-verified" style="font-size:0.72rem;">Hôm nay: ${minsToday} / 150 phút • Tổng: ${totalHours}h</span>
          </div>
          <p style="margin:0 0 0.65rem;font-size:0.8rem;color:var(--pk9-text-muted);line-height:1.5;">
            <b>Quy tắc Active Coupling & Chống treo máy:</b> Không cộng song song khi đang mở đề thi có đồng hồ, không idle quá 3 phút, và nhập ghi chú Check-in tối thiểu <b>15 ký tự có nghĩa</b> về nội dung bạn vừa học để nhận <b>+20 ĐXH (25p)</b> hoặc <b>+42 ĐXH (50p)</b>!
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.55rem;">
            <button type="button" class="pk9-exam-chip ${BXH_UI.pomoCoStudy ? 'active' : ''}" data-r4-pomo-mode="costudy" style="font-size:0.73rem;">
              🤝 Bàn Học Cộng Hưởng (2–4 bạn • +15% Vàng & EXP)
            </button>
            <button type="button" class="pk9-exam-chip ${!BXH_UI.pomoCoStudy ? 'active' : ''}" data-r4-pomo-mode="solo" style="font-size:0.73rem;">
              🎧 Chế Độ Solo Yên Tĩnh (1 mình)
            </button>
            <button type="button" class="pk9-admin-btn-xs" data-r4-pomo-start="25" style="background:rgba(16,185,129,0.2);color:#10b981;border:1px solid rgba(16,185,129,0.45);">
              ▶ Bắt đầu Phiên 25p (Tắt làm phiền 1v1)
            </button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.6rem;">
            ${[
              '📝 Đang giải đề 2018',
              '🃏 Đang ôn Flashcards',
              '📺 Đang xem Video',
              '📖 Đọc PDF Pro'
            ].map(tag => `
              <button type="button" class="pk9-exam-chip ${BXH_UI.pomoStatusTag === tag ? 'active' : ''}" data-r4-pomo-tag="${esc(tag)}" style="font-size:0.74rem;">
                ${esc(tag)}
              </button>
            `).join('')}
          </div>
          <textarea id="pk9-r4-pomo-note" class="pk9-input" rows="2" placeholder="Nhập ghi chú kết quả phiên học (>= 15 ký tự, VD: Đã ôn xong 25 công thức Este-Lipid và giải 4 câu Oxyz)..." style="margin:0 0 0.6rem;font-size:0.8rem;">${esc(BXH_UI.pomoCheckinNote)}</textarea>
          <div style="display:flex;gap:0.45rem;flex-wrap:wrap;">
            <button type="button" class="pk9-btn-exam-primary" data-r4-pomo-claim="25" style="padding:0.45rem 0.85rem;font-size:0.78rem;">
              🍅 Hoàn thành & Check-in 25p (+20 ĐXH)
            </button>
            <button type="button" class="pk9-btn-exam-primary" data-r4-pomo-claim="50" style="padding:0.45rem 0.85rem;font-size:0.78rem;background:linear-gradient(135deg,#f59e0b,#e11d48);">
              🔥 Hoàn thành & Check-in 50p (+42 ĐXH)
            </button>
          </div>
        </div>

        <!-- BÀN HỌC IM LẶNG POMODORO 9+ CỘNG HƯỞNG (2-4 BẠN • TẮT CHAT CHỮ) -->
        <div class="pk9-card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.55rem;">
            <strong style="font-size:0.96rem;">🤝 Bàn Học Pomodoro 9+ Cộng Hưởng (2–4 Bạn • Không Chat)</strong>
            <span class="pk9-badge pk9-badge-hot" style="font-size:0.72rem;">+15% 🪙 Vàng & ⚡ EXP • ${coSessions} phiên</span>
          </div>
          <p style="margin:0 0 0.65rem;font-size:0.78rem;color:var(--pk9-text-muted);line-height:1.45;">
            Ngồi học chung im lặng cùng 2–4 bạn (tắt hoàn toàn chat chữ chống xao nhãng). Cùng về đích nhận <b>+15% Vàng & EXP</b> và mở khóa Badge #23 <b>"Bạn Đồng Hành 9+"</b>!
            ${is2K12 ? '<br/><b style="color:#38bdf8;">🛡️ Chế độ 2K12 Safe-by-Default:</b> Chỉ ngồi chung với Bạn học đã lưu / Study Squad.' : ''}
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:0.5rem;">
            <!-- Ghế của bạn -->
            <div style="padding:0.6rem;border-radius:0.8rem;background:var(--pk9-surface-2);border:1.5px solid var(--pk9-primary);text-align:center;">
              <div style="font-size:1.6rem;">${eq.outfit?.icon || '🧑‍🎓'} ${eq.pet?.icon || ''}</div>
              <div style="font-weight:800;font-size:0.78rem;margin-top:0.2rem;">${esc(user?.display_name || 'Bạn')}</div>
              <div style="font-size:0.68rem;color:var(--pk9-primary);font-weight:700;">${esc(BXH_UI.pomoStatusTag)}</div>
            </div>
            <!-- 2-3 Bạn đồng hành cùng Hệ (Tuân thủ Safe-by-Default & Chặn người lạ cho 2K12) -->
            ${lbRows.length ? lbRows.map((peer, idx) => {
              const peerTags = ['📝 Đang giải đề 2018', '🃏 Đang ôn Flashcards', '📺 Đang xem Video'];
              return `
                <div class="pk9-clickable-profile" data-inspect-profile="1" data-profile-u="${esc(peer.is_anonymous ? '' : (peer.username || ''))}" data-profile-sbd="${esc(peer.sbd || '')}" style="padding:0.6rem;border-radius:0.8rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);text-align:center;cursor:pointer;" title="Bấm để Soi Hồ Sơ bạn cùng bàn">
                  <div style="font-size:1.6rem;">${esc(peer.rpg_outfit || '🧑‍🎓')} ${esc(peer.rpg_pet || '')}</div>
                  <div style="font-weight:800;font-size:0.78rem;margin-top:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(peer.display_name)}</div>
                  <div style="font-size:0.68rem;color:#10b981;font-weight:700;">${peerTags[idx % peerTags.length]}</div>
                </div>
              `;
            }).join('') : friendsOnlyCoStudy ? `
              <div style="grid-column:span 2;padding:0.75rem;border-radius:0.8rem;background:rgba(56,189,248,0.1);border:1px dashed rgba(56,189,248,0.45);font-size:0.75rem;color:var(--pk9-text-muted);display:flex;flex-direction:column;justify-content:center;gap:0.35rem;">
                <b style="color:#0284c7;">🛡️ Chế độ Safe-by-Default (Chỉ Bạn học / Study Squad)</b>
                <span>Không ghép ngẫu nhiên với người lạ. Hãy ghim <b>Rival</b> hoặc lập <b>Study Squad</b> tại BXH để ngồi học chung an toàn!</span>
                <div><button type="button" class="pk9-admin-btn-xs" data-nav-tab="leaderboard">🚩 Mở Study Squad & Rival ›</button></div>
              </div>
            ` : `
              <div style="grid-column:span 2;padding:0.75rem;border-radius:0.8rem;background:var(--pk9-surface-2);border:1px dashed var(--pk9-border);font-size:0.75rem;color:var(--pk9-text-muted);display:flex;flex-direction:column;justify-content:center;gap:0.35rem;">
                <b>🤝 Bàn học đang mở ghế trống</b>
                <span>Bấm <b>▶ Bắt đầu Phiên 25p</b> ở khung bên trái để học tập trung và mở khóa Badge #23 <b>Bạn Đồng Hành 9+</b>!</span>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    const hub = root.querySelector('.pk9-exam-hub') || root;
    hub.appendChild(panel);
  }

  // ==========================================================================
  // 5. R4: TRỢ LÝ AI PHÚC K9 — KIỂM CHỨNG 2 CÂU BIẾN THỂ ĐA HỆ (+15 ĐXH TUẦN)
  // ==========================================================================
  const AI_VARIANT_POOL = [
    {
      id: 'v_toan12_ct',
      grades: ['2K9', '2K8', 'DGNL'],
      subject: 'Toán 12',
      prompt: 'Cho hàm số y = f(x) có đạo hàm f\'(x) = x²(x - 2)(x + 1)³. Số điểm cực trị của hàm số y = f(x) là:',
      options: [
        { k: 'A', t: 'A. 3 điểm cực trị (x = 0, x = 2, x = -1)' },
        { k: 'B', t: 'B. 2 điểm cực trị (đổi dấu qua nghiệm bội lẻ x = 2 và x = -1)' },
        { k: 'C', t: 'C. 1 điểm cực trị (tại x = 2)' },
        { k: 'D', t: 'D. 4 điểm cực trị' }
      ],
      answer: 'B'
    },
    {
      id: 'v_hoa12_este',
      grades: ['2K9', '2K8'],
      subject: 'Hóa 12',
      prompt: 'Thủy phân hoàn toàn este X có công thức phân tử C₄H₈O₂ trong dung dịch NaOH đun nóng thu được muối natri axetat. Công thức cấu tạo của X là:',
      options: [
        { k: 'A', t: 'A. HCOOCH₂CH₂CH₃' },
        { k: 'B', t: 'B. CH₃CH₂COOCH₃' },
        { k: 'C', t: 'C. CH₃COOC₂H₅ (Etyl axetat)' },
        { k: 'D', t: 'D. HCOOCH(CH₃)₂' }
      ],
      answer: 'C'
    },
    {
      id: 'v_toan12_tp',
      grades: ['2K9', '2K8', 'DGNL'],
      subject: 'Toán 12',
      prompt: 'Biết ∫₀² f(x)dx = 5 và ∫₀² g(x)dx = -2. Giá trị của ∫₀² [2f(x) - 3g(x)]dx bằng:',
      options: [
        { k: 'A', t: 'A. 4' },
        { k: 'B', t: 'B. 16' },
        { k: 'C', t: 'C. 12' },
        { k: 'D', t: 'D. 10' }
      ],
      answer: 'B'
    },
    {
      id: 'v_li12_nhiet',
      grades: ['2K9', '2K8', 'DGNL'],
      subject: 'Vật lí 12',
      prompt: 'Theo định luật I của nhiệt động lực học (ΔU = Q + A), khi một khối khí nhận nhiệt lượng 400 J và thực hiện công 150 J đẩy pít-tông thì độ biến thiên nội năng ΔU là:',
      options: [
        { k: 'A', t: 'A. ΔU = +550 J' },
        { k: 'B', t: 'B. ΔU = +250 J (Q = +400 J, A = -150 J)' },
        { k: 'C', t: 'C. ΔU = -250 J' },
        { k: 'D', t: 'D. ΔU = -550 J' }
      ],
      answer: 'B'
    },
    {
      id: 'v_toan12_oxyz',
      grades: ['2K9', '2K8', 'DGNL'],
      subject: 'Toán 12',
      prompt: 'Trong không gian Oxyz, mặt phẳng (P): 2x - 3y + z - 5 = 0 có một vectơ pháp tuyến là:',
      options: [
        { k: 'A', t: 'A. n = (2; 3; 1)' },
        { k: 'B', t: 'B. n = (2; -3; -5)' },
        { k: 'C', t: 'C. n = (2; -3; 1)' },
        { k: 'D', t: 'D. n = (-3; 1; -5)' }
      ],
      answer: 'C'
    },
    {
      id: 'v_anh12_cond',
      grades: ['2K9', '2K8', '2K11', 'DGNL'],
      subject: 'Tiếng Anh',
      prompt: 'Chọn đáp án đúng hoàn thành câu đảo ngữ điều kiện loại 3: "____ earlier, we would not have missed the opening ceremony."',
      options: [
        { k: 'A', t: 'A. Had we arrived' },
        { k: 'B', t: 'B. Were we to arrive' },
        { k: 'C', t: 'C. Should we arrive' },
        { k: 'D', t: 'D. Did we arrive' }
      ],
      answer: 'A'
    },
    {
      id: 'v_hoa12_pin',
      grades: ['2K9', '2K8'],
      subject: 'Hóa 12',
      prompt: 'Trong pin điện hóa Zn - Cu hoạt động ở điều kiện chuẩn (E°(Zn²⁺/Zn) = -0,76V; E°(Cu²⁺/Cu) = +0,34V), sức điện động chuẩn của pin là:',
      options: [
        { k: 'A', t: 'A. 0,42 V' },
        { k: 'B', t: 'B. 1,10 V (E°catot - E°anot = 0,34 - (-0,76))' },
        { k: 'C', t: 'C. -1,10 V' },
        { k: 'D', t: 'D. 0,76 V' }
      ],
      answer: 'B'
    },
    {
      id: 'v_sinh12_adn',
      grades: ['2K9', '2K8', 'DGNL'],
      subject: 'Sinh 12',
      prompt: 'Theo nguyên tắc bổ sung trong quá trình phiên mã tổng hợp mARN, nuclêôtit loại A trên mạch khuôn ADN sẽ liên kết bổ sung với loại nào của môi trường?',
      options: [
        { k: 'A', t: 'A. T (Timin)' },
        { k: 'B', t: 'B. G (Guanin)' },
        { k: 'C', t: 'C. U (Uraxin)' },
        { k: 'D', t: 'D. X (Xitôzin)' }
      ],
      answer: 'C'
    },
    {
      id: 'v_2k11_hamso',
      grades: ['2K11'],
      subject: 'Toán 10',
      prompt: 'Tập xác định của hàm số y = √(2x - 6) + 1/(x - 5) là:',
      options: [
        { k: 'A', t: 'A. [3; +∞) \\ {5}' },
        { k: 'B', t: 'B. (3; +∞) \\ {5}' },
        { k: 'C', t: 'C. [3; 5)' },
        { k: 'D', t: 'D. R \\ {5}' }
      ],
      answer: 'A'
    },
    {
      id: 'v_2k11_vecto',
      grades: ['2K11'],
      subject: 'Toán 10',
      prompt: 'Cho hai vectơ a = (2; -1) và b = (3; 4). Tích vô hướng a · b bằng:',
      options: [
        { k: 'A', t: 'A. 10' },
        { k: 'B', t: 'B. 2 (2·3 + (-1)·4 = 6 - 4)' },
        { k: 'C', t: 'C. -2' },
        { k: 'D', t: 'D. 14' }
      ],
      answer: 'B'
    },
    {
      id: 'v_2k11_li10',
      grades: ['2K11'],
      subject: 'Vật lí 10',
      prompt: 'Một vật rơi tự do từ độ cao 20 m tại nơi có g = 10 m/s². Thời gian rơi cho tới khi chạm đất là:',
      options: [
        { k: 'A', t: 'A. 1 s' },
        { k: 'B', t: 'B. 2 s (t = √(2h/g) = √4)' },
        { k: 'C', t: 'C. 4 s' },
        { k: 'D', t: 'D. 2√2 s' }
      ],
      answer: 'B'
    },
    {
      id: 'v_2k12_viet',
      grades: ['2K12'],
      subject: 'Toán 9 (Vào 10)',
      prompt: 'Phương trình bậc hai x² - 5x + 6 = 0 có hai nghiệm x₁, x₂. Theo định lý Vi-ét, giá trị của x₁² + x₂² bằng:',
      options: [
        { k: 'A', t: 'A. 13 ((x₁+x₂)² - 2x₁x₂ = 25 - 12)' },
        { k: 'B', t: 'B. 25' },
        { k: 'C', t: 'C. 19' },
        { k: 'D', t: 'D. 37' }
      ],
      answer: 'A'
    },
    {
      id: 'v_2k12_can',
      grades: ['2K12'],
      subject: 'Toán 9 (Vào 10)',
      prompt: 'Điều kiện xác định của biểu thức A = √(3x - 9) là:',
      options: [
        { k: 'A', t: 'A. x > 3' },
        { k: 'B', t: 'B. x >= 3' },
        { k: 'C', t: 'C. x <= 3' },
        { k: 'D', t: 'D. x != 3' }
      ],
      answer: 'B'
    },
    {
      id: 'v_2k12_anh9',
      grades: ['2K12'],
      subject: 'Tiếng Anh 9',
      prompt: 'Chọn đáp án đúng: "My sister wishes she ____ fluent English to study abroad."',
      options: [
        { k: 'A', t: 'A. speaks' },
        { k: 'B', t: 'B. spoke (câu ước ở hiện tại dùng quá khứ đơn)' },
        { k: 'C', t: 'C. will speak' },
        { k: 'D', t: 'D. has spoken' }
      ],
      answer: 'B'
    },
    {
      id: 'v_dgnl_logic',
      grades: ['DGNL', '2K9', '2K8'],
      subject: 'Tư duy Logic ĐGNL',
      prompt: 'Nếu "Mọi học sinh đạt giải Nhất đều chăm chỉ" là mệnh đề đúng, suy luận nào sau đây CHẮC CHẮN đúng?',
      options: [
        { k: 'A', t: 'A. Mọi học sinh chăm chỉ đều đạt giải Nhất' },
        { k: 'B', t: 'B. Nếu một học sinh không chăm chỉ thì bạn đó không đạt giải Nhất (Phản đảo)' },
        { k: 'C', t: 'C. Có học sinh đạt giải Nhất nhưng không chăm chỉ' },
        { k: 'D', t: 'D. Nếu không đạt giải Nhất thì chắc chắn không chăm chỉ' }
      ],
      answer: 'B'
    },
    {
      id: 'v_dgnl_xs',
      grades: ['DGNL', '2K9', '2K8'],
      subject: 'Xác suất ĐGNL',
      prompt: 'Gieo đồng thời 2 con xúc xắc cân đối đồng chất. Xác suất để tổng số chấm xuất hiện trên hai mặt bằng 7 là:',
      options: [
        { k: 'A', t: 'A. 1/6 (6 trường hợp trên tổng 36)' },
        { k: 'B', t: 'B. 1/12' },
        { k: 'C', t: 'C. 5/36' },
        { k: 'D', t: 'D. 7/36' }
      ],
      answer: 'A'
    }
  ];

  function pickAiVariantPair(forceNew = false) {
    if (!forceNew && Array.isArray(BXH_UI.aiCurrentPair) && BXH_UI.aiCurrentPair.length === 2) {
      return BXH_UI.aiCurrentPair;
    }
    const rpg = getRpg();
    const user = getUser();
    const grade = rpg.bxh?.primary_grade || user?.settings?.preferred_grade || '2K9';
    const gradePool = AI_VARIANT_POOL.filter(q => q.grades.includes(grade));
    const basePool = gradePool.length >= 2 ? gradePool : AI_VARIANT_POOL;
    const used = new Set(BXH_UI.aiUsedIds || []);
    let candidates = basePool.filter(q => !used.has(q.id));
    if (candidates.length < 2) {
      BXH_UI.aiUsedIds = [];
      candidates = basePool.slice();
    }
    // Fisher-Yates shuffle lightweight
    const shuffled = candidates.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    const pair = shuffled.slice(0, 2);
    BXH_UI.aiCurrentPair = pair;
    BXH_UI.aiQuizAnswers = {};
    return pair;
  }

  function enhanceAiTabDom() {
    const root = document.getElementById('tab-ai');
    if (!root || root.querySelector('#pk9-r4-ai-variant-panel')) return;
    const rpg = getRpg();
    const aiToday = Number(rpg.bxh?.daily_caps?.ai_vision_today || 0);
    const aiTotal = Number(rpg.social?.ai_vision_solved || 0);
    const activePair = pickAiVariantPair(false);

    const panel = document.createElement('div');
    panel.id = 'pk9-r4-ai-variant-panel';
    panel.className = 'pk9-card';
    panel.style.marginTop = '0.9rem';
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <strong style="font-size:0.95rem;">🧠 Kiểm Chứng Hiểu Bài Sau Lời Giải AI: Giải 2 Câu Biến Thể (+15 ĐXH Tuần)</strong>
          <div style="font-size:0.78rem;color:var(--pk9-text-muted);margin-top:0.15rem;">
            Hỏi bài để hiểu bản chất chứ không chép đáp án! Giải đúng 2 câu biến thể tương tự theo Hệ học nhận <b>+15 ĐXH Tuần</b> (Hôm nay: <b>${aiToday}/3 lượt</b> • Tổng tích lũy Badge #15: <b>${aiTotal} lượt</b>).
          </div>
        </div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          ${BXH_UI.aiQuizOpen ? `
            <button type="button" class="pk9-btn-exam-ghost" data-r4-ai-reroll="1" style="padding:0.42rem 0.72rem;font-size:0.76rem;">
              🎲 Đổi cặp câu khác
            </button>
          ` : ''}
          <button type="button" class="pk9-btn-exam-primary" data-r4-ai-verify-trigger="1" style="padding:0.45rem 0.9rem;font-size:0.8rem;">
            ⚡ ${BXH_UI.aiQuizOpen ? 'Thu gọn Bài Kiểm Chứng' : 'Làm 2 Câu Biến Thể Kiểm Chứng (+15 ĐXH)'}
          </button>
        </div>
      </div>
      ${BXH_UI.aiQuizOpen ? `
        <div style="margin-top:0.8rem;padding-top:0.75rem;border-top:1px dashed var(--pk9-border);display:grid;gap:0.75rem;">
          ${activePair.map((q, qIdx) => {
            const picked = BXH_UI.aiQuizAnswers?.[q.id] || '';
            return `
              <div style="padding:0.7rem 0.85rem;border-radius:0.8rem;background:var(--pk9-surface-2);border:1px solid var(--pk9-border);">
                <div style="font-weight:800;font-size:0.82rem;margin-bottom:0.45rem;line-height:1.45;">
                  <span class="pk9-badge pk9-badge-subj" style="font-size:0.68rem;margin-right:0.35rem;">Câu ${qIdx + 1} • ${esc(q.subject)}</span>
                  ${esc(q.prompt)}
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0.4rem;">
                  ${q.options.map(opt => `
                    <button type="button" class="pk9-btn-exam-ghost ${picked === opt.k ? 'active' : ''}" data-r4-ai-pick="${esc(q.id)}:${esc(opt.k)}" style="justify-content:flex-start;text-align:left;padding:0.42rem 0.65rem;font-size:0.76rem;border-color:${picked === opt.k ? 'var(--pk9-primary)' : 'var(--pk9-border)'};background:${picked === opt.k ? 'rgba(37,99,235,0.14)' : 'var(--pk9-surface)'};">
                      ${esc(opt.t)}
                    </button>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
          <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
            <button type="button" class="pk9-btn-exam-primary" data-r4-ai-submit-quiz="1" style="padding:0.48rem 1rem;font-size:0.8rem;">
              ✅ Nộp 2 Câu Biến Thể & Nhận +15 ĐXH Tuần
            </button>
          </div>
        </div>
      ` : ''}
    `;
    const hub = root.querySelector('.pk9-exam-hub') || root;
    hub.appendChild(panel);
  }

  // ==========================================================================
  // 6. EVENT DELEGATION & HOOKS VÀO TOÀN HỆ SINH THÁI
  // ==========================================================================
  function bindEcosystemEvents() {
    // Theo dõi hoạt động thật để tính Max Continuous Idle Time cho Pomodoro 9+
    ['mousemove', 'keydown', 'touchstart'].forEach(ev => {
      document.addEventListener(ev, () => {
        const nowTs = Date.now();
        const gapSec = Math.round((nowTs - (BXH_UI.pomoLastActiveTs || nowTs)) / 1000);
        if (gapSec > (BXH_UI.pomoMaxIdleSec || 0)) {
          BXH_UI.pomoMaxIdleSec = gapSec;
        }
        BXH_UI.pomoLastActiveTs = nowTs;
      }, { passive: true });
    });

    // Hỗ trợ vuốt xuống (Swipe-down) trên Mobile để đóng Quick Inspect Bottom Sheet R2
    let touchStartY = 0;
    document.addEventListener('touchstart', e => {
      if (e.target?.closest?.('#pk9-scanned-card-modal')) {
        touchStartY = e.touches?.[0]?.clientY || 0;
      }
    }, { passive: true });
    document.addEventListener('touchend', e => {
      const modal = document.getElementById('pk9-scanned-card-modal');
      if (modal && touchStartY > 0) {
        const endY = e.changedTouches?.[0]?.clientY || 0;
        const dialog = modal.querySelector('.pk9-scanned-card-dialog');
        if (endY - touchStartY > 95 && (!dialog || dialog.scrollTop <= 10)) {
          closePublicProfileModal();
        }
        touchStartY = 0;
      }
    }, { passive: true });

    // Đóng Quick Inspect Drawer / Modal bằng phím Escape (R2)
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (document.getElementById('pk9-scanned-card-modal')) {
          closePublicProfileModal();
        }
      }
    });

    document.addEventListener('click', async e => {
      if (!e.target || typeof e.target.closest !== 'function') return;
      const dismissSettleBtn = e.target.closest('[data-bxh-dismiss-settlement]');
      if (dismissSettleBtn) {
        const wk = dismissSettleBtn.getAttribute('data-bxh-dismiss-settlement') || '';
        try {
          localStorage.setItem(`pk9_settled_seen_${String(getUser()?.username || '').toLowerCase()}_${wk}`, '1');
        } catch {}
        renderLeaderboardTabEnhanced();
        return;
      }
      // 1. Điểm chạm Soi Hồ Sơ Công Khai (R2) từ BXH, Podium, Cờ Vùng Đảo, Rival Pin, Pomodoro...
      // Desktop mở Quick Inspect Drawer bên phải; Mobile mở Bottom Sheet 80% chiều cao (mode: 'drawer')
      const inspectEl = e.target.closest('[data-inspect-profile]');
      if (inspectEl && !e.target.closest('button[data-bxh-rival-toggle]')) {
        const u = inspectEl.getAttribute('data-profile-u') || '';
        const sbd = inspectEl.getAttribute('data-profile-sbd') || '';
        openPublicProfileInspector({ username: u, sbd, mode: 'drawer' });
        return;
      }

      const acceptDuelBtn = e.target.closest('[data-r2-accept-duel]');
      if (acceptDuelBtn) {
        const roomCode = acceptDuelBtn.getAttribute('data-r2-accept-duel') || '';
        if (roomCode) {
          if (typeof window.switchTab === 'function') window.switchTab('exams');
          window.PK9_EXAM_CENTER?.openDuelByCode?.(roomCode);
        }
        return;
      }

      const lockedSlotGoal = e.target.closest('[data-r3-locked-slot-goal]');
      if (lockedSlotGoal) {
        const slotNum = lockedSlotGoal.getAttribute('data-r3-locked-slot-goal');
        const reqRank = lockedSlotGoal.getAttribute('data-req-rank');
        const remXp = lockedSlotGoal.getAttribute('data-rem-xp');
        toast(`🔒 Ô Trưng Bày #${slotNum} mở ở ${reqRank} (Còn thiếu ${remXp} EXP). Hãy làm Đề Chuẩn GDPT 2018 hoặc Nhiệm vụ ngày để thăng bậc!`, 'info');
        return;
      }

      const expandBtn = e.target.closest('[data-expand-full-profile]');
      if (expandBtn) {
        openPublicProfileInspector({
          username: expandBtn.getAttribute('data-profile-u') || '',
          sbd: expandBtn.getAttribute('data-profile-sbd') || '',
          mode: 'full'
        });
        return;
      }

      // 2. Chuyển Hệ đào tạo / Hạng Đấu / Tầng BXH / Phó Bảng
      const gradeBtn = e.target.closest('[data-bxh-set-grade]');
      if (gradeBtn) {
        BXH_UI.grade = gradeBtn.getAttribute('data-bxh-set-grade') || '2K9';
        if (typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true, grade: BXH_UI.grade, division: BXH_UI.division });
        }
        renderLeaderboardTabEnhanced();
        return;
      }

      const lockGradeBtn = e.target.closest('[data-bxh-lock-primary-grade]');
      if (lockGradeBtn) {
        const g = lockGradeBtn.getAttribute('data-bxh-lock-primary-grade');
        const res = await rpgPost('rpg-set-primary-grade', { grade: g });
        if (res.ok && typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true, grade: g });
          renderLeaderboardTabEnhanced();
        }
        return;
      }

      const divBtn = e.target.closest('[data-bxh-set-division]');
      if (divBtn) {
        BXH_UI.division = divBtn.getAttribute('data-bxh-set-division') || 'bronze';
        if (typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true, grade: BXH_UI.grade, division: BXH_UI.division });
        }
        renderLeaderboardTabEnhanced();
        return;
      }

      const layerBtn = e.target.closest('[data-bxh-layer]');
      if (layerBtn) {
        BXH_UI.layer = layerBtn.getAttribute('data-bxh-layer') || 'tier1';
        renderLeaderboardTabEnhanced();
        return;
      }

      const subBtn = e.target.closest('[data-bxh-set-sub]');
      if (subBtn) {
        BXH_UI.subBoard = subBtn.getAttribute('data-bxh-set-sub') || 'arena_9plus';
        renderLeaderboardTabEnhanced();
        return;
      }

      if (e.target.closest('[data-bxh-toggle-reward-table]')) {
        BXH_UI.showRewardLookup = !BXH_UI.showRewardLookup;
        renderLeaderboardTabEnhanced();
        return;
      }

      // 3. Mở 4 Rương Mốc Cá Nhân Tuần
      const chestBtn = e.target.closest('[data-bxh-claim-chest]');
      if (chestBtn) {
        const chestId = chestBtn.getAttribute('data-bxh-claim-chest');
        const res = await rpgPost('rpg-claim-weekly-chest', { chest_id: chestId });
        if (res.ok && typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true, grade: BXH_UI.grade, division: BXH_UI.division });
          renderLeaderboardTabEnhanced();
        }
        return;
      }

      // 4. Micro-Actions R2: Cổ vũ Ngọn Lửa, So sánh 1-chạm, Ghim Rival, Thách đấu 1v1, Chặn, Báo cáo
      if (e.target.closest('[data-r2-toggle-compare]')) {
        const panel = document.getElementById('pk9-r2-compare-panel');
        if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        return;
      }

      if (e.target.closest('[data-r2-toggle-iupac-grid]')) {
        const popup = document.getElementById('pk9-r2-iupac-mini-popup');
        if (popup) popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        return;
      }

      const cheerBtn = e.target.closest('[data-r2-send-cheer]');
      if (cheerBtn) {
        const tU = cheerBtn.getAttribute('data-target-u') || '';
        const tSbd = cheerBtn.getAttribute('data-target-sbd') || '';
        const presetIdx = Number(document.getElementById('pk9-r2-cheer-preset')?.value || 0);
        const res = await rpgPost('rpg-micro-cheer', { target_username: tU, target_sbd: tSbd, preset_index: presetIdx });
        if (res.ok && res.data?.target_cheer_score !== undefined) {
          const cntEl = document.getElementById('pk9-r2-cheer-count');
          if (cntEl) cntEl.textContent = String(res.data.target_cheer_score);
        }
        return;
      }

      const rivalBtn = e.target.closest('[data-bxh-rival-toggle]');
      if (rivalBtn) {
        const tU = rivalBtn.getAttribute('data-bxh-rival-toggle');
        const res = await rpgPost('rpg-micro-rival', { target_username: tU });
        if (res.ok) {
          if (rivalBtn.closest('#pk9-scanned-card-modal')) {
            rivalBtn.textContent = res.data?.pinned ? '📌 Đã ghim Rival' : '📌 Ghim Rival';
          }
          if (typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
            await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true, grade: BXH_UI.grade, division: BXH_UI.division });
            if (document.getElementById('tab-leaderboard')?.classList.contains('active')) {
              renderLeaderboardTabEnhanced();
            }
          }
        }
        return;
      }

      const chalBtn = e.target.closest('[data-r2-challenge-1v1]');
      if (chalBtn) {
        const tU = chalBtn.getAttribute('data-r2-challenge-1v1');
        if (!tU) {
          toast('Học viên đang bật chế độ Ẩn danh BXH nên không nhận lời mời thách đấu trực tiếp.', 'warning');
          return;
        }
        const res = await rpgPost('rpg-micro-challenge-1v1', { target_username: tU, subject: 'Toán' });
        if (res.ok && res.data?.room_code) {
          closePublicProfileModal();
          if (typeof window.switchTab === 'function') window.switchTab('exams');
          window.PK9_EXAM_CENTER?.openDuelByCode?.(res.data.room_code);
        }
        return;
      }

      const blockBtn = e.target.closest('[data-r2-block-user]');
      if (blockBtn) {
        const tU = blockBtn.getAttribute('data-r2-block-user');
        const res = await rpgPost('rpg-micro-block', { target_username: tU });
        if (res.ok) {
          if (blockBtn.closest('#pk9-scanned-card-modal')) {
            blockBtn.textContent = res.data?.blocked ? '🚫 Bỏ chặn' : '🚫 Chặn';
          }
          if (blockBtn.hasAttribute('data-r2-unblock-inline')) {
            renderIdCardTabEnhanced();
          }
          if (typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
            await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true, grade: BXH_UI.grade, division: BXH_UI.division });
          }
        }
        return;
      }

      const repBtn = e.target.closest('[data-r2-report-profile]');
      if (repBtn) {
        const tSbd = repBtn.getAttribute('data-r2-report-profile');
        await rpgPost('rpg-micro-report', { target_sbd: tSbd, reason: 'Báo cáo kiểm duyệt từ Hồ Sơ Công Khai R2' });
        return;
      }

      // 5. QR Referral CTA cho Khách (K9-GUEST)
      const guestRefBtn = e.target.closest('[data-r4-guest-referral-signup]');
      if (guestRefBtn) {
        const refSbd = guestRefBtn.getAttribute('data-r4-guest-referral-signup') || '';
        try { localStorage.setItem('pk9_qr_referral_sbd', refSbd); } catch {}
        closePublicProfileModal();
        if (typeof window.PK9_OPEN_AUTH === 'function') window.PK9_OPEN_AUTH('register');
        return;
      }

      if (e.target.closest('[data-r4-claim-rookie]')) {
        await rpgPost('rpg-claim-rookie-chest', {});
        renderIdCardTabEnhanced();
        return;
      }

      // 6. Study Squad 2-4 bạn cùng Hệ
      if (e.target.closest('[data-bxh-squad-create]')) {
        const res = await rpgPost('rpg-squad-action', { mode: 'create' });
        if (res.ok && typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true });
          renderLeaderboardTabEnhanced();
        }
        return;
      }
      if (e.target.closest('[data-bxh-squad-join]')) {
        const code = document.getElementById('pk9-squad-join-code')?.value || '';
        const res = await rpgPost('rpg-squad-action', { mode: 'join', code });
        if (res.ok && typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true });
          renderLeaderboardTabEnhanced();
        }
        return;
      }
      if (e.target.closest('[data-bxh-squad-claim]')) {
        const res = await rpgPost('rpg-squad-action', { mode: 'claim-bonus' });
        if (res.ok && typeof window.PK9_REFRESH_LEADERBOARD === 'function') {
          await window.PK9_REFRESH_LEADERBOARD({ force: true, quiet: true });
          renderLeaderboardTabEnhanced();
        }
        return;
      }

      // 7. R3 Tủ Kính Thành Tựu & Xuất .PNG 9:16 / 16:9
      const exportPngBtn = e.target.closest('[data-r3-export-png]');
      if (exportPngBtn) {
        if (exportPngBtn.getAttribute('data-exporting') === '1') return;
        exportPngBtn.setAttribute('data-exporting', '1');
        exportPngBtn.disabled = true;
        try {
          await exportNextGenStudentCardPng(exportPngBtn.getAttribute('data-r3-export-png') || '16:9');
        } catch {
          toast('Không thể xuất ảnh Thẻ Học Viên .PNG lúc này. Vui lòng thử lại!', 'warning');
        } finally {
          exportPngBtn.removeAttribute('data-exporting');
          exportPngBtn.disabled = false;
        }
        return;
      }

      if (e.target.closest('[data-r3-toggle-visitor-preview]')) {
        BXH_UI.visitorPreviewMode = !BXH_UI.visitorPreviewMode;
        renderIdCardTabEnhanced();
        toast(BXH_UI.visitorPreviewMode ? '👁️ Đang bật chế độ Xem thử dưới góc nhìn người khác!' : 'Đã quay về chế độ chỉnh sửa chính chủ.', 'info');
        return;
      }

      const presetBtn = e.target.closest('[data-r3-apply-preset]');
      if (presetBtn) {
        await rpgPost('rpg-showcase-preset', { preset_id: presetBtn.getAttribute('data-r3-apply-preset') });
        renderIdCardTabEnhanced();
        return;
      }

      if (e.target.closest('[data-r3-clear-slot]')) {
        BXH_UI.selectedSlotTarget = null;
        renderIdCardTabEnhanced();
        return;
      }

      const slotSelectEl = e.target.closest('[data-r3-select-slot]');
      if (slotSelectEl) {
        const sType = slotSelectEl.getAttribute('data-r3-select-slot');
        if (sType === 'hero') {
          BXH_UI.selectedSlotTarget = { type: 'hero' };
        } else {
          BXH_UI.selectedSlotTarget = { type: 'showcase', index: Number(slotSelectEl.getAttribute('data-r3-slot-idx') || 0) };
        }
        renderIdCardTabEnhanced();
        return;
      }

      const assignBadgeBtn = e.target.closest('[data-r3-assign-badge]');
      if (assignBadgeBtn) {
        const badgeId = assignBadgeBtn.getAttribute('data-r3-assign-badge');
        await assignBadgeToShowcaseSlot(badgeId);
        return;
      }

      if (e.target.closest('[data-r3-refresh-milestones]')) {
        await rpgPost('rpg-showcase-save', { refresh_milestones: true });
        renderIdCardTabEnhanced();
        return;
      }

      const fStat = e.target.closest('[data-r3-filter-status]');
      if (fStat) { BXH_UI.vaultStatusFilter = fStat.getAttribute('data-r3-filter-status'); renderIdCardTabEnhanced(); return; }
      const fType = e.target.closest('[data-r3-filter-type]');
      if (fType) { BXH_UI.vaultTypeFilter = fType.getAttribute('data-r3-filter-type'); renderIdCardTabEnhanced(); return; }
      const fSrc = e.target.closest('[data-r3-filter-source]');
      if (fSrc) { BXH_UI.vaultSourceFilter = fSrc.getAttribute('data-r3-filter-source'); renderIdCardTabEnhanced(); return; }

      if (e.target.closest('[data-r2-save-privacy]')) {
        const schoolVis = document.getElementById('pk9-r2-priv-school')?.value || 'province_grade';
        const allow1v1 = document.getElementById('pk9-r2-priv-1v1')?.value || 'everyone';
        const allowPomo = document.getElementById('pk9-r2-priv-pomo')?.value || 'everyone';
        const anonBxh = Boolean(document.getElementById('pk9-r2-priv-anon')?.checked);
        const showFlag = Boolean(document.getElementById('pk9-r2-priv-flag')?.checked);
        await rpgPost('rpg-privacy-save', {
          school_visibility: schoolVis,
          allow_1v1_invites: allow1v1,
          allow_pomodoro_costudy: allowPomo,
          anonymous_bxh: anonBxh,
          show_island_flag_pin: showFlag
        });
        renderIdCardTabEnhanced();
        return;
      }

      // 8. R4 Pomodoro Cộng Hưởng & Check-in
      const pomoModeBtn = e.target.closest('[data-r4-pomo-mode]');
      if (pomoModeBtn) {
        BXH_UI.pomoCoStudy = pomoModeBtn.getAttribute('data-r4-pomo-mode') !== 'solo';
        const oldPanel = document.getElementById('pk9-r4-pomodoro-costudy-panel');
        if (oldPanel) oldPanel.remove();
        enhancePlannerTabDom();
        return;
      }

      const pomoStartBtn = e.target.closest('[data-r4-pomo-start]');
      if (pomoStartBtn) {
        const dur = Number(pomoStartBtn.getAttribute('data-r4-pomo-start')) === 50 ? 50 : 25;
        BXH_UI.pomoLastActiveTs = Date.now();
        BXH_UI.pomoMaxIdleSec = 0;
        await rpgPost('rpg-pomodoro-start', {
          duration_min: dur,
          co_study: Boolean(BXH_UI.pomoCoStudy),
          status_tag: BXH_UI.pomoStatusTag
        });
        return;
      }

      const pomoTagBtn = e.target.closest('[data-r4-pomo-tag]');
      if (pomoTagBtn) {
        BXH_UI.pomoStatusTag = pomoTagBtn.getAttribute('data-r4-pomo-tag') || '📝 Đang giải đề 2018';
        const oldPanel = document.getElementById('pk9-r4-pomodoro-costudy-panel');
        if (oldPanel) oldPanel.remove();
        enhancePlannerTabDom();
        return;
      }

      const pomoClaimBtn = e.target.closest('[data-r4-pomo-claim]');
      if (pomoClaimBtn) {
        const dur = Number(pomoClaimBtn.getAttribute('data-r4-pomo-claim')) === 50 ? 50 : 25;
        const note = document.getElementById('pk9-r4-pomo-note')?.value || '';
        BXH_UI.pomoCheckinNote = note;
        const examRunning = Boolean(window.PK9_EXAM_CENTER?.isTakingExam?.());
        const currentGapSec = Math.round((Date.now() - (BXH_UI.pomoLastActiveTs || Date.now())) / 1000);
        const idleSec = Math.max(BXH_UI.pomoMaxIdleSec || 0, currentGapSec);
        BXH_UI.pomoLastActiveTs = Date.now();
        BXH_UI.pomoMaxIdleSec = 0;
        const res = await rpgPost('rpg-pomodoro-complete', {
          duration_min: dur,
          checkin_note: note,
          co_study: Boolean(BXH_UI.pomoCoStudy),
          status_tag: BXH_UI.pomoStatusTag,
          exam_active: examRunning,
          idle_sec: idleSec
        });
        if (res.ok) {
          BXH_UI.pomoCheckinNote = '';
          const oldPanel = document.getElementById('pk9-r4-pomodoro-costudy-panel');
          if (oldPanel) oldPanel.remove();
          enhancePlannerTabDom();
        }
        return;
      }

      // 9. R4 AI Vision 2 câu biến thể kiểm chứng hiểu bài
      if (e.target.closest('[data-r4-ai-verify-trigger]')) {
        BXH_UI.aiQuizOpen = !BXH_UI.aiQuizOpen;
        if (BXH_UI.aiQuizOpen) pickAiVariantPair(false);
        const oldPanel = document.getElementById('pk9-r4-ai-variant-panel');
        if (oldPanel) oldPanel.remove();
        enhanceAiTabDom();
        return;
      }

      if (e.target.closest('[data-r4-ai-reroll]')) {
        pickAiVariantPair(true);
        const oldPanel = document.getElementById('pk9-r4-ai-variant-panel');
        if (oldPanel) oldPanel.remove();
        enhanceAiTabDom();
        return;
      }

      const aiPickBtn = e.target.closest('[data-r4-ai-pick]');
      if (aiPickBtn) {
        const raw = aiPickBtn.getAttribute('data-r4-ai-pick') || '';
        const sep = raw.lastIndexOf(':');
        const qid = sep > 0 ? raw.slice(0, sep) : '';
        const optKey = sep > 0 ? raw.slice(sep + 1) : '';
        if (qid && optKey) {
          BXH_UI.aiQuizAnswers = { ...(BXH_UI.aiQuizAnswers || {}), [qid]: optKey };
          const oldPanel = document.getElementById('pk9-r4-ai-variant-panel');
          if (oldPanel) oldPanel.remove();
          enhanceAiTabDom();
        }
        return;
      }

      if (e.target.closest('[data-r4-ai-submit-quiz]')) {
        const activePair = pickAiVariantPair(false);
        const ans = BXH_UI.aiQuizAnswers || {};
        if (!activePair.every(q => Boolean(ans[q.id]))) {
          toast('Vui lòng chọn đáp án cho cả 2 câu biến thể trước khi nộp kiểm chứng!', 'warning');
          return;
        }
        const allCorrect = activePair.every(q => ans[q.id] === q.answer);
        if (!allCorrect) {
          await rpgPost('rpg-ai-vision-verify', { passed_variants: false });
          return;
        }
        const res = await rpgPost('rpg-ai-vision-verify', { passed_variants: true });
        if (res.ok) {
          BXH_UI.aiUsedIds = [...(BXH_UI.aiUsedIds || []), ...activePair.map(q => q.id)];
          BXH_UI.aiQuizOpen = false;
          BXH_UI.aiCurrentPair = [];
          BXH_UI.aiQuizAnswers = {};
          const oldPanel = document.getElementById('pk9-r4-ai-variant-panel');
          if (oldPanel) oldPanel.remove();
          enhanceAiTabDom();
        }
        return;
      }
    });

    // Tìm kiếm trực tiếp trên BXH (cập nhật cục bộ #pk9-lb-rows-body để KHÔNG làm mất focus/con trỏ gõ tiếng Việt!)
    document.addEventListener('input', e => {
      if (e.target && e.target.id === 'pk9-lb-search-input') {
        BXH_UI.search = e.target.value || '';
        const rowsBody = document.getElementById('pk9-lb-rows-body');
        if (!rowsBody) return;
        const user = getUser();
        const lbData = getLbData();
        const activeGrade = BXH_UI.grade || lbData.active_grade || lbData.my_bxh_status?.primary_grade || user?.settings?.preferred_grade || '2K9';
        let activeRows = [];
        if (BXH_UI.layer === 'tier1') activeRows = lbData.tier1_division?.rows || lbData.weekly_leaderboard || [];
        else if (BXH_UI.layer === 'tier2_weekly') activeRows = lbData.tier2_system_top100?.weekly_top100 || lbData.weekly_leaderboard || [];
        else if (BXH_UI.layer === 'tier2_alltime') activeRows = lbData.tier2_system_top100?.alltime_top100 || lbData.leaderboard || [];
        else if (BXH_UI.layer === 'tier3') activeRows = lbData.tier3_sub_leaderboards?.[BXH_UI.subBoard] || [];
        else activeRows = lbData.exam_leaderboard || [];
        const onlyStudents = (activeRows || []).filter(r => !r.is_admin && r.role !== 'admin');
        const q = BXH_UI.search.trim().toLowerCase();
        const filteredRows = onlyStudents.filter(r => !q || `${r.display_name || ''} ${r.username || ''} ${r.sbd || ''} ${r.school || ''} ${r.grade || ''}`.toLowerCase().includes(q));
        rowsBody.innerHTML = renderEnhancedLeaderboardRowsHtml(filteredRows, onlyStudents, user, activeGrade);
      }
    });

    document.addEventListener('change', async e => {
      if (e.target && e.target.id === 'pk9-r3-iupac-select') {
        const z = Number(e.target.value || 8);
        await rpgPost('rpg-showcase-save', { featured_iupac: z });
        renderIdCardTabEnhanced();
        return;
      }
      if (e.target && e.target.id === 'pk9-r3-cardbg-select') {
        await rpgPost('rpg-showcase-save', { cardbg: e.target.value });
        renderIdCardTabEnhanced();
        return;
      }
      if (e.target && e.target.id === 'pk9-r3-showcase-frame-select') {
        await rpgPost('rpg-showcase-save', { showcase_frame: e.target.value });
        renderIdCardTabEnhanced();
        return;
      }
      if (e.target && e.target.classList.contains('pk9-r3-milestone-select')) {
        const selects = Array.from(document.querySelectorAll('.pk9-r3-milestone-select'));
        const ids = selects.map(s => s.value);
        await rpgPost('rpg-showcase-save', { milestone_ids: ids });
        renderIdCardTabEnhanced();
      }
    });

    // Hỗ trợ Kéo-Thả (Drag and Drop) Huy hiệu trên Desktop vào Tủ Kính R3
    let draggedBadgeId = '';
    const clearDragOver = () => {
      document.querySelectorAll('[data-r3-drop-zone].drag-over').forEach(el => el.classList.remove('drag-over'));
    };
    document.addEventListener('dragstart', e => {
      const item = e.target?.closest?.('[data-r3-drag-badge]');
      if (item) {
        draggedBadgeId = item.getAttribute('data-r3-drag-badge') || '';
        if (e.dataTransfer) e.dataTransfer.setData('text/plain', draggedBadgeId);
      }
    });
    document.addEventListener('dragend', clearDragOver);
    document.addEventListener('dragenter', e => {
      const zone = e.target?.closest?.('[data-r3-drop-zone]');
      if (zone) zone.classList.add('drag-over');
    });
    document.addEventListener('dragleave', e => {
      const zone = e.target?.closest?.('[data-r3-drop-zone]');
      if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
    });
    document.addEventListener('dragover', e => {
      const zone = e.target?.closest?.('[data-r3-drop-zone]');
      if (zone) {
        e.preventDefault();
        zone.classList.add('drag-over');
      }
    });
    document.addEventListener('drop', async e => {
      const zone = e.target?.closest?.('[data-r3-drop-zone]');
      clearDragOver();
      if (!zone) return;
      e.preventDefault();
      const badgeId = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || draggedBadgeId;
      if (!badgeId) return;
      const zSpec = zone.getAttribute('data-r3-drop-zone') || '';
      if (zSpec === 'hero') {
        BXH_UI.selectedSlotTarget = { type: 'hero' };
      } else if (zSpec.startsWith('showcase:')) {
        BXH_UI.selectedSlotTarget = { type: 'showcase', index: Number(zSpec.split(':')[1] || 0) };
      }
      await assignBadgeToShowcaseSlot(badgeId);
    });
  }

  async function assignBadgeToShowcaseSlot(badgeId) {
    const rpg = getRpg();
    const sc = rpg.showcase || {};
    const target = BXH_UI.selectedSlotTarget;
    if (target && target.type === 'hero') {
      await rpgPost('rpg-showcase-save', { hero_badge: badgeId });
    } else if (target && target.type === 'showcase') {
      const maxSlots = Number(sc.unlocked_slots || 2);
      const idx = Math.max(0, Math.min(maxSlots - 1, Number(target.index || 0)));
      const arr = Array.isArray(sc.showcase_badges) ? sc.showcase_badges.slice(0, maxSlots) : [];
      const existingIdx = arr.indexOf(badgeId);
      if (existingIdx >= 0 && existingIdx !== idx) {
        const displaced = arr[idx] || null;
        arr[idx] = badgeId;
        if (displaced) arr[existingIdx] = displaced;
        else arr.splice(existingIdx, 1);
      } else {
        arr[idx] = badgeId;
      }
      const cleaned = arr.filter(Boolean);
      await rpgPost('rpg-showcase-save', { showcase_badges: cleaned });
    } else {
      // Mặc định: nếu chưa chọn ô, ưu tiên gắn vào ô Showcase còn trống hoặc Hero Badge
      const arr = Array.isArray(sc.showcase_badges) ? sc.showcase_badges.slice() : [];
      const maxSlots = Number(sc.unlocked_slots || 2);
      if (!arr.includes(badgeId) && arr.length < maxSlots) {
        arr.push(badgeId);
        await rpgPost('rpg-showcase-save', { showcase_badges: arr });
      } else {
        await rpgPost('rpg-showcase-save', { hero_badge: badgeId });
      }
    }
    renderIdCardTabEnhanced();
  }

  // Danh sách Cờ Vùng Tuần 🚩 trên tab-journey đã được pk9-rpg.js gắn chuẩn data-inspect-profile (và tôn trọng Safe-by-Default 2K12)
  function enhanceJourneyLeadersTouchpoints() {
    // Giữ nguyên hook tương thích ngược mà không ghi đè thuộc tính bảo mật 2K12
  }

  function installEcosystemHooks() {
    if (window.PK9_RPG) {
      window.PK9_RPG.openScannedStudentCard = params => openPublicProfileInspector({ ...params, mode: 'full' });
      const origRenderTab = window.PK9_RPG.renderTab;
      window.PK9_RPG.renderTab = function (tabId) {
        if (tabId === 'idcard') {
          renderIdCardTabEnhanced();
          return;
        }
        if (typeof origRenderTab === 'function') origRenderTab.call(window.PK9_RPG, tabId);
      };
    }
  }

  window.PK9_BXH_ECOSYSTEM = {
    UI: BXH_UI,
    bootFromUrlParams: captureUrlReferralAndProfile,
    renderLeaderboardTab: renderLeaderboardTabEnhanced,
    renderIdCardTab: renderIdCardTabEnhanced,
    openPublicProfileInspector,
    closePublicProfileModal,
    exportNextGenStudentCardPng,
    pickAiVariantPair,
    enhancePlannerTabDom,
    enhanceAiTabDom,
    enhanceJourneyLeadersTouchpoints
  };

  bindEcosystemEvents();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      installEcosystemHooks();
      captureUrlReferralAndProfile();
    });
  } else {
    installEcosystemHooks();
    captureUrlReferralAndProfile();
  }
})(window, document);
