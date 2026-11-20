/* ============================================================================
 * HỌC CÙNG PHÚC K9 — BXH TUẦN 3 TẦNG, QUÀ 3 LỚP, 24 BADGES (6 BẬC),
 * SOI HỒ SƠ CÔNG KHAI (R2), TỦ KÍNH THÀNH TỰU (R3) & 7 VÒNG LẶP KÍCH HỌC (R4)
 * ============================================================================ */
'use strict';

const GRADES_5 = [
  { id: '2K9', label: '2K9 (Lớp 12)', shortLabel: '2K9 (12)', isThcs: false, examDate: '2027-06-27', examName: 'Kỳ thi THPT Quốc gia 2K9' },
  { id: '2K8', label: '2K8 Pro', shortLabel: '2K8 Pro', isThcs: false, examDate: '2027-06-27', examName: 'Kỳ thi THPT & ĐGNL 2K8 Pro' },
  { id: 'DGNL', label: 'ĐGNL / ĐGTD', shortLabel: 'ĐGNL / ĐGTD', isThcs: false, examDate: '2027-05-25', examName: 'Kỳ thi ĐGNL HSA / V-ACT / TSA' },
  { id: '2K11', label: '2K11 (Lớp 10)', shortLabel: '2K11 (10)', isThcs: false, examDate: '2027-05-30', examName: 'Kỳ thi Cuối năm Lớp 10 (2K11)' },
  { id: '2K12', label: '2K12 (Vào 10)', shortLabel: '2K12 (9→10)', isThcs: true, examDate: '2027-06-06', examName: 'Kỳ thi Tuyển sinh Vào Lớp 10 (2K12)' }
];

const GRADE_IDS = new Set(GRADES_5.map(g => g.id));

function normalizeGrade(raw, fallback = '2K9') {
  const s = String(raw || '').trim().toUpperCase();
  if (GRADE_IDS.has(s)) return s;
  if (s.includes('2K8')) return '2K8';
  if (s.includes('DGNL') || s.includes('ĐGNL') || s.includes('HSA') || s.includes('V-ACT') || s.includes('TSA')) return 'DGNL';
  if (s.includes('2K11') || s === '10') return '2K11';
  if (s.includes('2K12') || s === '9') return '2K12';
  return GRADE_IDS.has(fallback) ? fallback : '2K9';
}

// 6 Hạng Đấu BXH kế thừa trực tiếp từ 6 Bậc Rank RPG
const DIVISION_TIERS = [
  { id: 'bronze', index: 0, name: 'Hạng Đồng', rpgName: '🥉 Bậc Đồng • Tân Binh Bứt Phá', icon: '🥉', color: '#b45309', minXp: 0, multiplier: 0.4, showcaseSlots: 2 },
  { id: 'silver', index: 1, name: 'Hạng Bạc', rpgName: '🥈 Bậc Bạc • Chiến Binh Chăm Chỉ', icon: '🥈', color: '#475569', minXp: 500, multiplier: 0.6, showcaseSlots: 3 },
  { id: 'gold', index: 2, name: 'Hạng Vàng', rpgName: '🥇 Bậc Vàng • Học Giả Vững Vàng', icon: '🥇', color: '#d97706', minXp: 1500, multiplier: 1.0, showcaseSlots: 4 },
  { id: 'platinum', index: 3, name: 'Hạng Bạch Kim', rpgName: '💠 Bậc Bạch Kim • Cao Thủ Giải Đề', icon: '💠', color: '#0284c7', minXp: 3500, multiplier: 1.6, showcaseSlots: 5 },
  { id: 'diamond', index: 4, name: 'Hạng Kim Cương', rpgName: '💎 Bậc Kim Cương • Tinh Anh 9+', icon: '💎', color: '#7c3aed', minXp: 7000, multiplier: 2.5, showcaseSlots: 6 },
  { id: 'legend', index: 5, name: 'Hạng Huyền Thoại', rpgName: '👑 Bậc Huyền Thoại • Thủ Khoa Đỉnh Cao', icon: '👑', color: '#e11d48', minXp: 13000, multiplier: 3.2, showcaseSlots: 6, goldenShowcaseFrame: true }
];

const DIVISION_MAP = new Map(DIVISION_TIERS.map(t => [t.id, t]));

// Quy tắc làm tròn chuẩn R1: round() half-up cho Vàng & Kim cương, ceil() cho Vé IUPAC
function roundHalfUp(n) {
  return Math.floor(Number(n || 0) + 0.5);
}

function computeDivisionReward(tierId, rank, dxhWeek = 0, totalInGroup = 30) {
  const tier = DIVISION_MAP.get(tierId) || DIVISION_TIERS[0];
  const m = tier.multiplier;
  const dxh = Number(dxhWeek || 0);
  const r = Number(rank || 30);
  const N = Math.max(1, Number(totalInGroup || 30));

  // Kiểm tra quy tắc sĩ số bảng (N < 6, 6 <= N <= 14, 15 <= N <= 30) & sàn ĐXH tối thiểu
  let bucket = 'none';
  let allowPromote = tier.id !== 'legend';
  let isDemotedRank = false;

  if (N < 6) {
    // Bảng < 6 người: không thăng/giáng hạng tự động; Top 1-3 (>=300 ĐXH) vẫn nhận quà Podium; >=150 nhận khuyến khích
    allowPromote = false;
    if (r === 1 && dxh >= 300) bucket = 'top1';
    else if (r === 2 && dxh >= 300) bucket = 'top2';
    else if (r === 3 && dxh >= 300) bucket = 'top3';
    else if (dxh >= 150) bucket = 'top16_24';
  } else if (N <= 14) {
    // Bảng 6 <= N <= 14 người: Top 1-3 (>=300 ĐXH) LUÔN thăng hạng; đáy floor(N * 0.20) (khi N >= 8, không phải Đồng) giáng hạng & không nhận quà thăng hạng
    const demoteCount = (N >= 8 && tier.id !== 'bronze') ? Math.floor(N * 0.20) : 0;
    const demoteStartRank = demoteCount > 0 ? (N - demoteCount + 1) : 999;
    const maxPromote = Math.max(3, Math.round(N * 0.23));
    isDemotedRank = r >= demoteStartRank;

    if (r === 1 && dxh >= 300) bucket = 'top1';
    else if (r === 2 && dxh >= 300) bucket = 'top2';
    else if (r === 3 && dxh >= 300) bucket = 'top3';
    else if (isDemotedRank) bucket = 'none';
    else if (r >= 4 && r <= maxPromote && dxh >= 250) bucket = 'top4_7';
    else if (dxh >= 150) bucket = r <= Math.ceil(N * 0.6) ? 'top8_15' : 'top16_24';
  } else {
    const maxPromoteRank = tier.id === 'diamond' ? 5 : 7;
    isDemotedRank = r >= 25 && tier.id !== 'bronze';

    if (r === 1 && dxh >= 300) bucket = 'top1';
    else if (r === 2 && dxh >= 300) bucket = 'top2';
    else if (r === 3 && dxh >= 300) bucket = 'top3';
    else if (r >= 1 && r <= 3 && dxh >= 150) bucket = 'top8_15';
    else if (r >= 4 && r <= maxPromoteRank && dxh >= 250) bucket = 'top4_7';
    else if (r >= 4 && r <= maxPromoteRank && dxh >= 150) bucket = 'top8_15';
    else if (r > maxPromoteRank && r <= 15 && dxh >= 150) bucket = 'top8_15';
    else if (r >= 16 && r <= 24 && dxh >= 150) bucket = 'top16_24';
  }

  if (bucket === 'none') {
    return {
      bucket: 'none',
      promoted: false,
      demoted: isDemotedRank,
      gold: 0,
      diamonds: 0,
      iupac_tickets: 0,
      iupac_shards: 0,
      shop_shards: 0,
      island_flags: 0,
      gold_charm: 0,
      xp_boost: 0,
      temp_title: null,
      temp_cosmetic: null,
      badge_id: null
    };
  }

  if (bucket === 'top1') {
    return {
      bucket: 'top1',
      promoted: allowPromote,
      demoted: false,
      gold: roundHalfUp(250 * m),
      diamonds: roundHalfUp(4 * m),
      iupac_tickets: Math.ceil(2 * m),
      iupac_shards: 0,
      shop_shards: 0,
      island_flags: 0,
      gold_charm: tier.id === 'bronze' ? 0 : 1,
      xp_boost: (tier.id === 'bronze' || tier.id === 'silver') ? 0 : 1,
      temp_title: `Quán Quân Bảng ${tier.name}`,
      temp_cosmetic: { id: 'frame-nitro-sakura', name: 'Nitro 🌸 Hoa Anh Đào Rơi', category: 'frame', duration_days: 7, perm_after: 3 },
      badge_id: 'badge-division-crown'
    };
  }
  if (bucket === 'top2') {
    return {
      bucket: 'top2',
      promoted: allowPromote,
      demoted: false,
      gold: roundHalfUp(190 * m),
      diamonds: roundHalfUp(3 * m),
      iupac_tickets: Math.ceil(2 * m),
      iupac_shards: 0,
      shop_shards: 0,
      island_flags: 0,
      gold_charm: tier.id === 'bronze' ? 0 : 1,
      xp_boost: (tier.id === 'diamond' || tier.id === 'legend') ? 1 : 0,
      temp_title: 'Á Quân Bứt Phá',
      temp_cosmetic: { id: 'cardbg-sakura', name: 'Nền Đêm Anh Đào Kiếm Sĩ', category: 'cardbg', duration_days: 7, perm_after: 3 },
      badge_id: 'badge-division-podium'
    };
  }
  if (bucket === 'top3') {
    const isHigh = tier.id === 'diamond' || tier.id === 'legend';
    return {
      bucket: 'top3',
      promoted: allowPromote,
      demoted: false,
      gold: roundHalfUp(150 * m),
      diamonds: roundHalfUp(2 * m),
      iupac_tickets: Math.ceil(1 * m),
      iupac_shards: 0,
      shop_shards: 3,
      island_flags: 0,
      gold_charm: isHigh ? 1 : 0,
      xp_boost: isHigh ? 1 : 0,
      temp_title: 'Top 3 Kiên Cường',
      temp_cosmetic: null,
      badge_id: 'badge-division-podium'
    };
  }
  if (bucket === 'top4_7') {
    const isHigh = tier.id === 'diamond' || tier.id === 'legend';
    return {
      bucket: 'top4_7',
      promoted: allowPromote,
      demoted: false,
      gold: roundHalfUp(115 * m),
      diamonds: roundHalfUp(2 * m),
      iupac_tickets: Math.ceil(1 * m),
      iupac_shards: 0,
      shop_shards: 2,
      island_flags: 0,
      gold_charm: isHigh ? 1 : 0,
      xp_boost: isHigh ? 1 : 0,
      temp_title: null,
      temp_cosmetic: null,
      badge_id: 'badge-division-promote'
    };
  }
  if (bucket === 'top8_15') {
    return {
      bucket: 'top8_15',
      promoted: false,
      demoted: false,
      gold: roundHalfUp(70 * m),
      diamonds: 0,
      iupac_tickets: 0,
      iupac_shards: 1,
      shop_shards: 1,
      island_flags: 0,
      gold_charm: 0,
      xp_boost: 0,
      temp_title: null,
      temp_cosmetic: null,
      badge_id: null
    };
  }
  return {
    bucket: 'top16_24',
    promoted: false,
    demoted: false,
    gold: roundHalfUp(40 * m),
    diamonds: 0,
    iupac_tickets: 0,
    iupac_shards: 0,
    shop_shards: 1,
    island_flags: 1,
    gold_charm: 0,
    xp_boost: 0,
    temp_title: null,
    temp_cosmetic: null,
    badge_id: null
  };
}

const TOP1_ROTATING_COSMETICS = [
  { id: 'frame-nitro-sakura', name: 'Nitro 🌸 Hoa Anh Đào Rơi', category: 'frame', duration_days: 7, perm_after: 3 },
  { id: 'frame-nitro-galaxy', name: 'Nitro 🪐 Tinh Vân Sao Thổ', category: 'frame', duration_days: 7, perm_after: 3 },
  { id: 'aura-shadow-monarch', name: 'Hắc Ảnh Quân Vương · Arise', category: 'aura', duration_days: 7, perm_after: 3 }
];

function pickRotatingTop1Cosmetic(weekKey = '') {
  const m = String(weekKey || '').match(/W(\d+)/i);
  const wNum = m ? Number(m[1]) : 0;
  return TOP1_ROTATING_COSMETICS[Math.abs(wNum) % TOP1_ROTATING_COSMETICS.length];
}

// Quà Lớp 2 — Toàn Hệ Top 100 Tuần (Doc 01 Mục 4.2)
function computeSystemTop100Reward(rank, grade = '2K9') {
  const r = Number(rank || 999);
  if (r < 1 || r > 100) return null;
  if (r === 1) {
    return {
      bucket: 'sys_top1',
      tier_label: 'Thủ Khoa Toàn Hệ',
      gold: 600,
      diamonds: 8,
      iupac_tickets: 3,
      shop_shards: 0,
      island_flags: 0,
      temp_title: `Thủ Khoa Toàn Hệ ${grade}`,
      temp_cosmetics: [
        { id: 'aura-ultra-instinct', name: 'Hào Quang Thủ Khoa • Bản Năng Vô Cực', category: 'aura', duration_days: 7, perm_after: 4 },
        { id: 'pet-spirit-dragon', name: 'Thanh Long Ngọc Rồng Thần', category: 'pet', duration_days: 7, perm_after: 3 },
        { id: 'cardbg-royal', name: 'Nền Hoàng Gia Bạch Kim Gold', category: 'cardbg', duration_days: 7, perm_after: 3 }
      ],
      badge_ids: ['badge-system-valedictorian', 'badge-system-top100']
    };
  }
  if (r === 2) {
    return {
      bucket: 'sys_top2',
      tier_label: 'Á Khoa',
      gold: 450,
      diamonds: 6,
      iupac_tickets: 2,
      shop_shards: 0,
      island_flags: 0,
      temp_title: `Á Khoa ${grade}`,
      temp_cosmetics: [
        { id: 'frame-nitro-monarch', name: 'Nitro 🔱 Hắc Hỏa Đế Vương', category: 'frame', duration_days: 7, perm_after: 3 }
      ],
      badge_ids: ['badge-system-top100']
    };
  }
  if (r === 3) {
    return {
      bucket: 'sys_top3',
      tier_label: 'Tam Khôi',
      gold: 350,
      diamonds: 5,
      iupac_tickets: 2,
      shop_shards: 0,
      island_flags: 0,
      temp_title: `Tinh Hoa Top 3 ${grade}`,
      temp_cosmetics: [
        { id: 'frame-nitro-monarch', name: 'Nitro 🔱 Hắc Hỏa Đế Vương', category: 'frame', duration_days: 7, perm_after: 3 }
      ],
      badge_ids: ['badge-system-top100']
    };
  }
  if (r <= 10) {
    return {
      bucket: 'sys_top4_10',
      tier_label: 'Top 10',
      gold: 200,
      diamonds: 3,
      iupac_tickets: 1,
      shop_shards: 2,
      island_flags: 0,
      temp_title: null,
      temp_cosmetics: [],
      badge_ids: ['badge-system-top100']
    };
  }
  if (r <= 50) {
    return {
      bucket: 'sys_top11_50',
      tier_label: 'Top 50',
      gold: 120,
      diamonds: 1,
      iupac_tickets: 1,
      shop_shards: 1,
      island_flags: 0,
      temp_title: null,
      temp_cosmetics: [],
      badge_ids: ['badge-system-top100']
    };
  }
  return {
    bucket: 'sys_top51_100',
    tier_label: 'Top 100',
    gold: 80,
    diamonds: 0,
    iupac_tickets: 1,
    shop_shards: 0,
    island_flags: 1,
    temp_title: null,
    temp_cosmetics: [],
    badge_ids: ['badge-system-top100']
  };
}

// Quà Lớp 2 — 4 Phó Bảng Chuyên Đề Tuần (Top 1–3 mỗi bảng; riêng PB #4 Bứt Phá Tuần Top 10 nhận Badge)
function computeSubLeaderboardReward(subId, rank) {
  const r = Number(rank || 999);
  const def = SUB_LEADERBOARDS_DEF.find(s => s.id === subId);
  if (!def || r < 1) return null;
  if (r <= 3) {
    const gold = r === 1 ? 180 : r === 2 ? 140 : 100;
    const diamonds = r === 1 ? 2 : 1;
    return {
      sub_id: subId,
      rank: r,
      gold,
      diamonds,
      iupac_tickets: 1,
      temp_title: def.tempTitle,
      badge_id: def.badgeId
    };
  }
  if (subId === 'weekly_surge' && r <= 10) {
    return {
      sub_id: subId,
      rank: r,
      gold: 0,
      diamonds: 0,
      iupac_tickets: 0,
      temp_title: null,
      badge_id: def.badgeId
    };
  }
  return null;
}

// Bảng tra cứu đầy đủ 6 Hạng Đấu (Pre-Computed Lookup Table chuẩn tài liệu 01)
const DIVISION_REWARD_TABLE = [
  { rankLabel: 'Top 1 (>=300 ĐXH)', key: 'top1', rankSample: 1, dxhSample: 350 },
  { rankLabel: 'Top 2 (>=300 ĐXH)', key: 'top2', rankSample: 2, dxhSample: 350 },
  { rankLabel: 'Top 3 (>=300 ĐXH)', key: 'top3', rankSample: 3, dxhSample: 350 },
  { rankLabel: 'Top 4–7 (KC: 4–5; >=250 ĐXH)', key: 'top4_7', rankSample: 4, dxhSample: 280 },
  { rankLabel: 'Top 8–15 (>=150 ĐXH)', key: 'top8_15', rankSample: 10, dxhSample: 180 },
  { rankLabel: 'Top 16–24 (>=150 ĐXH)', key: 'top16_24', rankSample: 18, dxhSample: 160 }
].map(row => {
  const byTier = {};
  for (const t of DIVISION_TIERS) {
    byTier[t.id] = computeDivisionReward(t.id, row.rankSample, row.dxhSample);
  }
  return { ...row, byTier };
});

// 4 Rương Mốc Cá Nhân Tuần (Lớp 3)
const WEEKLY_MILESTONE_CHESTS = [
  {
    id: 'chest_1',
    num: 1,
    name: 'Rương Mốc 1 • Khởi Động Tuần',
    shortName: 'Mốc 1 (250 ĐXH)',
    targetDxh: 250,
    gold: 40,
    diamonds: 0,
    iupac_tickets: 0,
    shop_shards: 0,
    gold_charm: 1, // 1 Bùa Vàng (5 lượt)
    xp_boost: 0,
    badge_id: null,
    desc: '40 🪙 Vàng + 1 🧿 Bùa Vàng (5 lượt)'
  },
  {
    id: 'chest_2',
    num: 2,
    name: 'Rương Mốc 2 • Vững Nhịp 9+',
    shortName: 'Mốc 2 (550 ĐXH)',
    targetDxh: 550,
    gold: 80,
    diamonds: 1,
    iupac_tickets: 1,
    shop_shards: 0,
    gold_charm: 0,
    xp_boost: 0,
    badge_id: null,
    desc: '80 🪙 Vàng + 1 💎 Kim cương + 1 🎫 Vé mở ô IUPAC (Ngưỡng Study Squad)'
  },
  {
    id: 'chest_3',
    num: 3,
    name: 'Rương Mốc 3 • Bứt Tốc Xuất Sắc',
    shortName: 'Mốc 3 (1.100 ĐXH)',
    targetDxh: 1100,
    gold: 140,
    diamonds: 2,
    iupac_tickets: 0,
    shop_shards: 1,
    gold_charm: 0,
    xp_boost: 1, // 1 Vé Nhân Đôi EXP (3 lượt)
    badge_id: null,
    desc: '140 🪙 Vàng + 2 💎 Kim cương + 1 🚀 Vé x2 EXP + 1 🧩 Mảnh Siêu Thị 3D'
  },
  {
    id: 'chest_4',
    num: 4,
    name: 'Rương Mốc 4 • Hoàn Mỹ Tuần',
    shortName: 'Mốc 4 (2.000 ĐXH)',
    targetDxh: 2000,
    gold: 220,
    diamonds: 4,
    iupac_tickets: 2,
    shop_shards: 1,
    gold_charm: 0,
    xp_boost: 0,
    badge_id: 'badge-weekly-2k',
    desc: '220 🪙 Vàng + 4 💎 KC + 2 🎫 Vé IUPAC + 1 🧩 Mảnh 3D + Badge Chinh Phục Mốc 2K'
  }
];

// 4 Phó Bảng Chuyên Đề Tuần (Tầng 3)
const SUB_LEADERBOARDS_DEF = [
  {
    id: 'arena_9plus',
    num: 1,
    name: 'Đấu Trường 9+ & 1v1',
    subtitle: 'Chiến Thần Thực Chiến',
    icon: '⚔️',
    metricLabel: 'Điểm ĐT 9+ & Elo/Thắng 1v1',
    requirement: 'Tối thiểu 1 kỳ Đấu Trường 9+ hoặc 3 trận 1v1 hợp lệ (>=60s, không trùng đối thủ 7 ngày)',
    tempTitle: 'Chiến Thần Thực Chiến',
    badgeId: 'badge-arena-warlord'
  },
  {
    id: 'exam_gdpt2018',
    num: 2,
    name: 'Săn Đề GDPT 2018',
    subtitle: 'Bậc Thầy Luyện Đề',
    icon: '🎯',
    metricLabel: 'Tổng điểm Top 8 đề chuẩn (45–90p)',
    requirement: 'Hoàn thành tối thiểu 3 đề chuẩn (45–90p) khác nhau đạt Quality Gate với điểm TB >= 6.5',
    tempTitle: 'Thợ Săn Đề Sở',
    badgeId: 'badge-exam2018-hunter'
  },
  {
    id: 'pomodoro_discipline',
    num: 3,
    name: 'Pomodoro 9+ & Chăm Chỉ',
    subtitle: 'Chiến Binh Kỷ Luật',
    icon: '⏱️',
    metricLabel: 'Phút Pomodoro xác thực + Ngày 4/4 NV',
    requirement: 'Tối thiểu 6 phiên Pomodoro xác thực (>= 150 phút) + 3 ngày đủ 4/4 nhiệm vụ',
    tempTitle: 'Kỷ Luật Vàng 9+',
    badgeId: 'badge-pomodoro-warrior'
  },
  {
    id: 'weekly_surge',
    num: 4,
    name: 'Bứt Phá Tuần',
    subtitle: 'Ngôi Sao Tăng Tốc',
    icon: '🚀',
    metricLabel: '% Tăng trưởng ĐXH × Độ chính xác',
    requirement: 'Đạt >= 400 ĐXH tuần này, mẫu số = max(TB 2 tuần trước, 300 ĐXH), không tính mới hết Ngủ Đông',
    tempTitle: 'Ngôi Sao Bứt Phá',
    badgeId: 'badge-weekly-surge'
  }
];

// Danh mục 24 Badges toàn hệ thống (21 Badges R1 + 3 Badges cộng đồng R4) — 6 Bậc Viền & Bộ đếm ×N
const BADGES_24 = [
  // Nhóm A — Weekly Podium & Competitive (9 Badges)
  {
    id: 'badge-division-crown',
    num: 1,
    name: 'Vương Miện Bảng Đấu',
    icon: '👑',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 3, 6, 12, 25, 50],
    unit: 'lần Top 1',
    desc: 'Đạt Top 1 Bảng Đấu 30 người (>= 300 ĐXH). Mốc ×3 mở vĩnh viễn Khung/Aura Tuần.',
    actionTab: 'leaderboard',
    actionLabel: 'Đua Top Bảng Đấu'
  },
  {
    id: 'badge-division-podium',
    num: 2,
    name: 'Bục Vinh Quang Bảng Đấu',
    icon: '🏅',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 3, 8, 15, 30, 60],
    unit: 'lần Top 2–3',
    desc: 'Đạt Top 2 hoặc Top 3 Bảng Đấu 30 người (>= 300 ĐXH).',
    actionTab: 'leaderboard',
    actionLabel: 'Xem Bảng Đấu 30 Người'
  },
  {
    id: 'badge-division-promote',
    num: 3,
    name: 'Chiến Binh Thăng Hạng',
    icon: '🛡️',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 3, 6, 12, 20, 35],
    unit: 'lần thăng hạng',
    desc: 'Thăng hạng thành công tại Bảng Đấu 30 người (leo từ Hạng Đồng → Huyền Thoại).',
    actionTab: 'leaderboard',
    actionLabel: 'Leo Hạng BXH'
  },
  {
    id: 'badge-system-valedictorian',
    num: 4,
    name: 'Thủ Khoa Toàn Hệ',
    icon: '🌟',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 2, 4, 8, 15, 25],
    unit: 'lần Top 1 Hệ',
    desc: 'Đạt Top 1 Toàn Hệ Tuần (2K9, 2K8 Pro, ĐGNL, 2K11, 2K12). Ghim lên Thẻ QR.',
    actionTab: 'leaderboard',
    actionLabel: 'Xem BXH Toàn Hệ'
  },
  {
    id: 'badge-system-top100',
    num: 5,
    name: 'Tinh Hoa Top 100 Hệ',
    icon: '💠',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 3, 6, 12, 20, 40],
    unit: 'tuần Top 100',
    desc: 'Lọt Top 100 Toàn Hệ Tuần (hiển thị nhãn viền Top 100 / Top 50 / Top 10 / Tam Khôi / Á Khoa).',
    actionTab: 'leaderboard',
    actionLabel: 'Xem Top 100 Toàn Hệ'
  },
  {
    id: 'badge-arena-warlord',
    num: 6,
    name: 'Chiến Thần Đấu Trường 9+ & 1v1',
    icon: '⚔️',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 3, 7, 15, 30, 50],
    unit: 'chiến tích',
    desc: 'Lọt Top 3 Phó Bảng #1 Đấu Trường 9+ & 1v1 hoặc đạt chuỗi thắng 1v1 hợp lệ.',
    actionTab: 'exams',
    actionLabel: 'Vào Đấu Trường 1v1'
  },
  {
    id: 'badge-exam2018-hunter',
    num: 7,
    name: 'Bậc Thầy Săn Đề GDPT 2018',
    icon: '🏛️',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'exam2018',
    thresholds: [1, 2, 5, 10, 18, 30],
    unit: 'tuần Top Đề',
    desc: 'Lọt Top 3 Phó Bảng #2 Săn Đề GDPT 2018 (Top 8 đề chuẩn khác nhau cao nhất tuần, TB >= 6.5).',
    actionTab: 'exams',
    actionLabel: 'Giải Đề Chuẩn GDPT 2018'
  },
  {
    id: 'badge-weekly-surge',
    num: 8,
    name: 'Ngôi Sao Bứt Phá Tuần',
    icon: '⚡',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 2, 5, 10, 20, 35],
    unit: 'tuần bứt phá',
    desc: 'Lọt Top 10 Phó Bảng #4 Bứt Phá Tuần (>= 400 ĐXH, mẫu số kẹp >= 300 ĐXH).',
    actionTab: 'leaderboard',
    actionLabel: 'Xem Phó Bảng Bứt Phá'
  },
  {
    id: 'badge-weekly-2k',
    num: 9,
    name: 'Chinh Phục Mốc 2K Tuần',
    icon: '🏆',
    group: 'weekly_podium',
    groupLabel: 'Weekly Podium & Competitive',
    hasWeeklyFx: true,
    typeFilter: 'weekly_fx',
    sourceFilter: 'bxh',
    thresholds: [1, 4, 8, 16, 30, 52],
    unit: 'tuần đạt 2K',
    desc: 'Mở thành công Rương Mốc 4 (>= 2.000 ĐXH) trong tuần.',
    actionTab: 'leaderboard',
    actionLabel: 'Mở Rương Mốc Tuần'
  },

  // Nhóm B — Learning Mastery (8 Badges Học Thuật Thực Chất)
  {
    id: 'badge-gdpt2018-master',
    num: 10,
    name: 'Phá Đảo Phòng Thi Ảo GDPT 2018',
    icon: '🎯',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'exam2018',
    thresholds: [5, 15, 30, 60, 100, 200],
    unit: 'đề >= 9.0đ',
    desc: 'Đạt điểm >= 9.0 ở đề chuẩn 3 phần GDPT 2018 (ABCD, Đúng/Sai lũy tiến, Trả lời ngắn).',
    actionTab: 'exams',
    actionLabel: 'Luyện Đề Phòng Thi Ảo'
  },
  {
    id: 'badge-sobo-hunter',
    num: 11,
    name: 'Thợ Săn Đề Sở/Bộ',
    icon: '📜',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'exam2018',
    thresholds: [3, 10, 20, 30, 50, 80],
    unit: 'đề Sở/Bộ >= 8.0đ',
    desc: 'Hoàn thành đề thuộc kho 30+ đề gốc Sở/Bộ với điểm >= 8.0.',
    actionTab: 'exams',
    actionLabel: 'Thử Sức Đề Sở/Bộ'
  },
  {
    id: 'badge-flashcard-srs',
    num: 12,
    name: 'Bậc Thầy Flashcards 3D & SRS',
    icon: '🃏',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'pomodoro',
    thresholds: [100, 300, 700, 1500, 3000, 5000],
    unit: 'thẻ & câu SRS',
    desc: 'Thuộc thẻ Flashcards 3D qua Micro-Check (>= 6s/thẻ) + hoàn thành phiên Sổ Ôn SRS.',
    actionTab: 'flashcards',
    actionLabel: 'Ôn Flashcards 3D'
  },
  {
    id: 'badge-pomodoro-warrior',
    num: 13,
    name: 'Chiến Binh Kỷ Luật Pomodoro 9+',
    icon: '⏱️',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'pomodoro',
    thresholds: [10, 30, 80, 150, 300, 500],
    unit: 'giờ Pomodoro',
    desc: 'Tổng thời gian học xác thực trên Bàn Học Pomodoro 9+ hoặc lọt Top 3 Phó Bảng #3.',
    actionTab: 'planner',
    actionLabel: 'Mở Bàn Học Pomodoro 9+'
  },
  {
    id: 'badge-island-explorer',
    num: 14,
    name: 'Nhà Thám Hiểm Đảo Tri Thức',
    icon: '🗺️',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'iupac',
    thresholds: [1, 3, 6, 12, 24, 40],
    unit: 'mốc 3⭐ / Cờ Đảo',
    desc: 'Chinh phục 3⭐ các chặng trên 7 Đảo Tri Thức hoặc góp công giữ Cờ Vùng Tuần 🚩.',
    actionTab: 'journey',
    actionLabel: 'Vượt Đảo Tri Thức'
  },
  {
    id: 'badge-ai-companion',
    num: 15,
    name: 'Đồng Hành AI Phúc K9',
    icon: '🤖',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'exam2018',
    thresholds: [10, 30, 70, 150, 300, 500],
    unit: 'lượt AI + 2 câu biến thể',
    desc: 'Hỏi bài qua AI Phúc K9 (Camera Vision) và giải đúng 2 câu biến thể kiểm chứng hiểu bài.',
    actionTab: 'ai',
    actionLabel: 'Hỏi Gia Sư AI Phúc K9'
  },
  {
    id: 'badge-iupac-chemist',
    num: 16,
    name: 'Nhà Hóa Học 118 Ô IUPAC',
    icon: '⚗️',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'iupac',
    thresholds: [10, 25, 50, 80, 100, 118],
    unit: 'nguyên tố IUPAC',
    desc: 'Tổng số nguyên tố đã mở khóa trong Bảng Tuần Hoàn 118 Ô IUPAC (118/118 mở Chúa Tể Tuần Hoàn).',
    actionTab: 'periodic',
    actionLabel: 'Mở Bảng Tuần Hoàn 118 Ô'
  },
  {
    id: 'badge-video-pdf-scholar',
    num: 17,
    name: 'Học Giả 19.948+ Video & PDF Pro',
    icon: '🎬',
    group: 'learning_mastery',
    groupLabel: 'Learning Mastery (Học Thuật)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'exam2018',
    thresholds: [15, 40, 100, 200, 400, 800],
    unit: 'bài giảng & PDF',
    desc: 'Hoàn thành Video bài giảng (>=5p, >=80%, Checkpoint) và đọc Ebook 84 PDF Pro.',
    actionTab: 'lectures',
    actionLabel: 'Học Video Bài Giảng'
  },

  // Nhóm C — Underdog, Streak & Social Learning (4 Badges R1 + 3 Badges R4)
  {
    id: 'badge-eternal-flame',
    num: 18,
    name: 'Ngọn Lửa Bất Diệt (Streak Thực)',
    icon: '🔥',
    group: 'underdog_streak',
    groupLabel: 'Underdog, Streak & Social',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'pomodoro',
    thresholds: [7, 14, 30, 60, 100, 365],
    unit: 'ngày Streak thực',
    desc: 'Chuỗi ngày học hợp lệ liên tiếp (>= 40 ĐXH/ngày). Lưu vĩnh viễn kỷ lục dài nhất.',
    actionTab: 'missions',
    actionLabel: 'Giữ Chuỗi Streak Hôm Nay'
  },
  {
    id: 'badge-phoenix-return',
    num: 19,
    name: 'Phượng Hoàng Trở Lại',
    icon: '🦅',
    group: 'underdog_streak',
    groupLabel: 'Underdog, Streak & Social',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'bxh',
    thresholds: [1, 2, 4, 7, 12, 20],
    unit: 'lần hồi sinh',
    desc: 'Quay lại sau >= 7 ngày vắng mặt và đạt Rương Mốc 2 (550 ĐXH) hoặc hoàn thành Nhiệm Vụ Hồi Sinh 500 ĐXH.',
    actionTab: 'missions',
    actionLabel: 'Làm Nhiệm Vụ Hồi Sinh'
  },
  {
    id: 'badge-underdog',
    num: 20,
    name: 'Kẻ Lội Ngược Dòng (Underdog)',
    icon: '🌊',
    group: 'underdog_streak',
    groupLabel: 'Underdog, Streak & Social',
    hasWeeklyFx: false,
    typeFilter: 'seasonal',
    sourceFilter: 'bxh',
    thresholds: [1, 2, 5, 10, 18, 30],
    unit: 'lần ngược dòng',
    desc: 'Từ Top 21–30 Thứ Năm lọt vào Top 10 Chủ Nhật (>=300 ĐXH) hoặc thắng đối thủ 1v1 Elo cao hơn >=200.',
    actionTab: 'leaderboard',
    actionLabel: 'Bứt Tốc Bảng Đấu'
  },
  {
    id: 'badge-weekend-earlybird',
    num: 21,
    name: 'Chiến Binh Cuối Tuần / Cú Sáng Sớm',
    icon: '🌅',
    group: 'underdog_streak',
    groupLabel: 'Underdog, Streak & Social',
    hasWeeklyFx: false,
    typeFilter: 'seasonal',
    sourceFilter: 'pomodoro',
    thresholds: [2, 5, 10, 20, 35, 52],
    unit: 'tuần hoàn thành',
    desc: 'Học hợp lệ khung 05:00–07:00 đủ 5 ngày/tuần hoặc đạt Weekend Catch-Up (>=350 ĐXH cả T7 & CN).',
    actionTab: 'planner',
    actionLabel: 'Bứt Tốc Cuối Tuần'
  },
  {
    id: 'badge-ambassador-k9',
    num: 22,
    name: 'Đại Sứ Phúc K9',
    icon: '📣',
    group: 'community_r4',
    groupLabel: 'Vòng Lặp Cộng Đồng (R4)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'bxh',
    thresholds: [1, 3, 7, 15, 30, 60],
    unit: 'bạn học xác thực',
    desc: 'Chia sẻ Thẻ QR .PNG mời bạn mới hoàn thành 1 Ngày Hợp Lệ (>=40 ĐXH kèm Đề hoặc Pomodoro 25p).',
    actionTab: 'idcard',
    actionLabel: 'Chia Sẻ Thẻ Học Viên QR'
  },
  {
    id: 'badge-costudy-companion',
    num: 23,
    name: 'Bạn Đồng Hành 9+',
    icon: '🤝',
    group: 'community_r4',
    groupLabel: 'Vòng Lặp Cộng Đồng (R4)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'pomodoro',
    thresholds: [5, 15, 30, 60, 120, 250],
    unit: 'phiên học chung',
    desc: 'Hoàn thành phiên Bàn Học Pomodoro 9+ Cộng Hưởng (2–4 bạn cùng học im lặng về đích).',
    actionTab: 'planner',
    actionLabel: 'Mở Phòng Pomodoro Cộng Hưởng'
  },
  {
    id: 'badge-squad-leader',
    num: 24,
    name: 'Kéo Nhóm Cùng Tiến',
    icon: '🚩',
    group: 'community_r4',
    groupLabel: 'Vòng Lặp Cộng Đồng (R4)',
    hasWeeklyFx: false,
    typeFilter: 'permanent',
    sourceFilter: 'bxh',
    thresholds: [1, 3, 6, 12, 24, 40],
    unit: 'tuần Squad đạt mốc',
    desc: '100% thành viên Study Squad (2–4 bạn cùng Hệ) đạt Rương Mốc 2 (>=550 ĐXH Tuần).',
    actionTab: 'leaderboard',
    actionLabel: 'Lập Nhóm Study Squad'
  }
];

const BADGE_MAP = new Map(BADGES_24.map(b => [b.id, b]));

// 4 Smart Presets cho Tủ Kính Thành Tựu (R3)
const SMART_PRESETS_DEF = [
  {
    id: 'exam_warlord',
    name: '1. Chiến Thần Luyện Đề',
    icon: '🎯',
    targetDesc: 'Học sinh 2K9, 2K8 Pro, ĐGNL tập trung điểm thi cao',
    preferredHero: ['badge-gdpt2018-master', 'badge-sobo-hunter', 'badge-exam2018-hunter', 'badge-arena-warlord'],
    preferredShowcase: ['badge-sobo-hunter', 'badge-exam2018-hunter', 'badge-arena-warlord', 'badge-division-crown', 'badge-system-top100', 'badge-ai-companion'],
    preferredMilestones: ['best_exam_score', 'avg_10_std_exams', 'duel_1v1_winrate']
  },
  {
    id: 'pomodoro_valedictorian',
    name: '2. Thủ Khoa Pomodoro',
    icon: '⏱️',
    targetDesc: 'Học sinh chăm chỉ, cày đều mỗi ngày, thích giữ chuỗi dài',
    preferredHero: ['badge-pomodoro-warrior', 'badge-eternal-flame', 'badge-weekly-2k', 'badge-flashcard-srs'],
    preferredShowcase: ['badge-eternal-flame', 'badge-weekly-2k', 'badge-weekend-earlybird', 'badge-flashcard-srs', 'badge-costudy-companion', 'badge-squad-leader'],
    preferredMilestones: ['pomodoro_hours', 'max_streak', 'flashcards_mastered']
  },
  {
    id: 'iupac_collector',
    name: '3. Nhà Sưu Tầm IUPAC',
    icon: '⚗️',
    targetDesc: 'Học sinh mê sưu tầm Gacha, hóa học và phiêu lưu đảo',
    preferredHero: ['badge-iupac-chemist', 'badge-island-explorer', 'badge-video-pdf-scholar'],
    preferredShowcase: ['badge-island-explorer', 'badge-iupac-chemist', 'badge-video-pdf-scholar', 'badge-flashcard-srs', 'badge-division-podium', 'badge-ambassador-k9'],
    preferredMilestones: ['iupac_unlocked', 'islands_progress', 'shop_collection']
  },
  {
    id: 'weekly_top_glow',
    name: '4. Top Tuần Rực Rỡ',
    icon: '👑',
    targetDesc: 'Học viên vừa lên bục tuần Chủ Nhật muốn "flex" ngay',
    preferredHero: ['badge-system-valedictorian', 'badge-division-crown', 'badge-division-podium', 'badge-weekly-2k'],
    preferredShowcase: ['badge-division-crown', 'badge-system-valedictorian', 'badge-system-top100', 'badge-weekly-2k', 'badge-weekly-surge', 'badge-division-promote'],
    preferredMilestones: ['weekly_dxh', 'best_exam_score', 'max_streak']
  }
];

// 5 Câu chúc mẫu có sẵn khi tặng Ngọn Lửa (R2 — Chống chat tự do / bắt nạt mạng)
const CHEER_PRESET_MESSAGES = [
  'Chúc bạn đỗ Nguyện Vọng 1! 🎓',
  'Giữ vững Streak 9+ nhé! 🔥',
  'Hẹn gặp ở Top Bảng Đấu! 🏆',
  'Cùng bứt phá 9+ tuần này! 🚀',
  'Quá đỉnh! Tinh thần tự học tuyệt vời! ⚡'
];

// 4 Nhãn trạng thái học tập im lặng trong Bàn Học Pomodoro 9+ Cộng Hưởng (R4)
const POMODORO_STATUS_TAGS = [
  { id: 'exam2018', label: '📝 Đang giải đề 2018' },
  { id: 'flashcards', label: '🃏 Đang ôn Flashcards' },
  { id: 'video', label: '📺 Đang xem Video' },
  { id: 'pdf', label: '📖 Đọc PDF Pro' }
];

// Bộ lọc chủ động (Proactive Auto-Filter R2) cho Biệt danh & Khẩu hiệu mục tiêu
const PROFANITY_REGEX = /(đụ|địt|lồn|cặc|đéo|vãi\s*l|ngu\s*vkl|chết\s*đi|óc\s*chó|đĩ|fuck|shit|bitch|asshole|sex|porn|18\+|cờ\s*bạc|bet88|kubet)/i;
const URL_OR_PHONE_REGEX = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|vn|net|org|io|me|tk|xyz)\b|zalo\.me|t\.me|fb\.com|\b0[35789]\d{8}\b)/i;

function validateProactiveContent(rawText, fieldLabel = 'Nội dung') {
  const s = String(rawText || '').trim();
  if (!s) return { ok: true, clean: '' };
  if (URL_OR_PHONE_REGEX.test(s)) {
    return {
      ok: false,
      message: `${fieldLabel} không được chứa đường dẫn (URL/link ngoài) hoặc số điện thoại/Zalo cá nhân để bảo vệ an toàn học đường!`
    };
  }
  if (PROFANITY_REGEX.test(s)) {
    return {
      ok: false,
      message: `${fieldLabel} chứa từ ngữ không phù hợp với môi trường học đường. Vui lòng điều chỉnh lịch sự nhé!`
    };
  }
  return { ok: true, clean: s };
}

function vnNowDate(d = new Date()) {
  return new Date(d.getTime() + 7 * 3600 * 1000);
}

function vnDateKey(d = new Date()) {
  const vn = vnNowDate(d);
  return `${vn.getUTCFullYear()}-${String(vn.getUTCMonth() + 1).padStart(2, '0')}-${String(vn.getUTCDate()).padStart(2, '0')}`;
}

function vnWeekKey(d = new Date()) {
  const vn = vnNowDate(d);
  const date = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function isoWeekMondayUtcMs(weekKey) {
  const m = String(weekKey || '').match(/^(\d{4})-W(\d{1,2})$/i);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(week) || week < 1 || week > 53) return null;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1Mon = jan4.getTime() - (jan4Dow - 1) * 86400000;
  return week1Mon + (week - 1) * 7 * 86400000;
}

function weeksBetweenKeys(prevWk, curWk) {
  const a = isoWeekMondayUtcMs(prevWk);
  const b = isoWeekMondayUtcMs(curWk);
  if (a === null || b === null) return 1;
  const diff = Math.round((b - a) / (7 * 86400000));
  return Math.max(1, Math.min(52, diff));
}

function isWeekendVn(d = new Date()) {
  const vn = vnNowDate(d);
  const dow = vn.getUTCDay(); // 0 = Sun, 6 = Sat
  return dow === 0 || dow === 6;
}

function isAfterSaturday18Vn(d = new Date()) {
  const vn = vnNowDate(d);
  const dow = vn.getUTCDay();
  const hr = vn.getUTCHours();
  return dow === 0 || (dow === 6 && hr >= 18);
}

function isBeforeTuesdayEndVn(d = new Date()) {
  const vn = vnNowDate(d);
  const dow = vn.getUTCDay() || 7; // Mon=1, Tue=2 ... Sun=7
  return dow <= 2;
}

function getGlobalDailyDxhCap(d = new Date()) {
  return isWeekendVn(d) ? 950 : 750;
}

function getExamCountdownInfo(gradeRaw = '2K9', now = new Date()) {
  const gId = normalizeGrade(gradeRaw);
  const gDef = GRADES_5.find(x => x.id === gId) || GRADES_5[0];
  const targetMs = new Date(`${gDef.examDate}T00:00:00+07:00`).getTime();
  const diffDays = Math.max(1, Math.ceil((targetMs - now.getTime()) / 86400000));
  return {
    grade: gId,
    examName: gDef.examName,
    examDate: gDef.examDate,
    daysRemaining: diffDays,
    isSprint100: diffDays <= 100,
    bannerText: `⏳ Còn ${diffDays} ngày tới ${gDef.examName}`
  };
}

// Tính bậc của 1 Badge dựa theo count và 6 ngưỡng thresholds
function computeBadgeTierInfo(badgeDef, countRaw = 0) {
  const count = Math.max(0, Number(countRaw || 0));
  const thresholds = badgeDef.thresholds || [1, 3, 6, 12, 25, 50];
  let tierIdx = -1;
  for (let i = 0; i < thresholds.length; i++) {
    if (count >= thresholds[i]) tierIdx = i;
  }
  const unlocked = tierIdx >= 0;
  const curTier = unlocked ? DIVISION_TIERS[Math.min(tierIdx, DIVISION_TIERS.length - 1)] : null;
  const nextThreshold = tierIdx + 1 < thresholds.length ? thresholds[tierIdx + 1] : null;
  const prevThreshold = tierIdx >= 0 ? thresholds[tierIdx] : 0;
  const progressPct = nextThreshold
    ? Math.min(100, Math.round((count / nextThreshold) * 100))
    : (unlocked ? 100 : 0);

  return {
    id: badgeDef.id,
    num: badgeDef.num,
    name: badgeDef.name,
    icon: badgeDef.icon,
    group: badgeDef.group,
    groupLabel: badgeDef.groupLabel,
    hasWeeklyFx: badgeDef.hasWeeklyFx,
    typeFilter: badgeDef.typeFilter,
    sourceFilter: badgeDef.sourceFilter,
    desc: badgeDef.desc,
    unit: badgeDef.unit,
    actionTab: badgeDef.actionTab,
    actionLabel: badgeDef.actionLabel,
    count,
    unlocked,
    tierIndex: tierIdx,
    tierId: curTier ? curTier.id : 'locked',
    tierName: curTier ? curTier.name.replace('Hạng ', 'Bậc ') : 'Chưa mở khóa',
    tierIcon: curTier ? curTier.icon : '🔒',
    tierColor: curTier ? curTier.color : '#64748b',
    nextThreshold,
    prevThreshold,
    remainingToNext: nextThreshold ? Math.max(0, nextThreshold - count) : 0,
    progressPct
  };
}

function getInitialTierByXp(xp = 0) {
  const v = Math.max(0, Number(xp || 0));
  let cur = DIVISION_TIERS[0];
  for (const t of DIVISION_TIERS) {
    if (v >= t.minXp) cur = t;
  }
  return cur.id;
}

function generatePublicAnonSbd(username = '') {
  let h = 2166136261;
  const s = `anon::${String(username || '').toLowerCase()}::pk9`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const num = 10000 + (Math.abs(h) % 89999);
  return `PK9-ANON-${num}`;
}

// Quyền hiển thị Trường / Lớp / Địa phương 3 cấp độ (R2 Mục 5.1)
const VN_PROVINCE_NAMES = [
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

function formatVisibleSchool(rawSchool = '', grade = '2K9', schoolVisibility = 'province_grade', isAnon = false) {
  const g = normalizeGrade(grade);
  if (isAnon || schoolVisibility === 'hide_all') {
    return 'Đã ẩn Trường & Địa phương (Safe-by-Default)';
  }
  const cleanRaw = String(rawSchool || '').trim();
  if (schoolVisibility === 'public_all') {
    return cleanRaw || `Học viên Hệ ${g} • Học Cùng Phúc K9`;
  }
  // Mặc định THPT ('province_grade'): Chỉ hiện Tỉnh/Thành + Hệ học, ẩn tên trường & lớp cụ thể
  const lower = cleanRaw.toLowerCase();
  const matchedProv = VN_PROVINCE_NAMES.find(p => lower.includes(p.toLowerCase()));
  if (matchedProv) {
    return `Khu vực ${matchedProv} • Hệ ${g}`;
  }
  return `Khu vực THPT • Hệ ${g}`;
}

// Cấp vật phẩm trang trí 7 ngày hoặc Mở khóa Vĩnh viễn sau perm_after lần đạt mốc (R1 Mục 4.1 & R3 Mục 4.1)
function grantTempOrPermCosmetic(user, cosmeticDef, totalAchievedCount = 1, now = new Date()) {
  if (!user || !user.rpg || !cosmeticDef || !cosmeticDef.id) return null;
  const r = user.rpg;
  if (!Array.isArray(r.inventory)) r.inventory = [];
  if (!r.equipped || typeof r.equipped !== 'object') r.equipped = {};
  if (!r.temp_items || typeof r.temp_items !== 'object') r.temp_items = {};

  const itemId = cosmeticDef.id;
  const cat = cosmeticDef.category || 'frame';
  const permAfter = Math.max(1, Number(cosmeticDef.perm_after || 3));
  const durationDays = Math.max(1, Number(cosmeticDef.duration_days || 7));
  const isAlreadyPerm = r.inventory.includes(itemId) && !r.temp_items[itemId];

  if (isAlreadyPerm || totalAchievedCount >= permAfter) {
    if (!r.inventory.includes(itemId)) r.inventory.push(itemId);
    delete r.temp_items[itemId];
    r.equipped[cat] = itemId;
    return { itemId, category: cat, permanent: true };
  }

  const defaultStarter = cat === 'frame' ? 'frame-bronze'
    : cat === 'cardbg' ? 'cardbg-ocean'
    : cat === 'aura' ? 'aura-none'
    : cat === 'title' ? 'title-tanbinh'
    : cat === 'outfit' ? 'outfit-scholar'
    : null;
  const curEquipped = r.equipped[cat];
  const prevPerm = (curEquipped && curEquipped !== itemId && !r.temp_items[curEquipped])
    ? curEquipped
    : (r.temp_items[itemId]?.previous_permanent_id || defaultStarter);

  r.temp_items[itemId] = {
    id: itemId,
    name: cosmeticDef.name || itemId,
    category: cat,
    expires_at: now.getTime() + durationDays * 86400000,
    previous_permanent_id: prevPerm
  };
  if (!r.inventory.includes(itemId)) r.inventory.push(itemId);
  r.equipped[cat] = itemId;
  return { itemId, category: cat, permanent: false, previous_permanent_id: prevPerm, expires_at: r.temp_items[itemId].expires_at };
}

function ensureBxhUserState(user, now = new Date()) {
  if (!user || typeof user !== 'object') return null;
  if (!user.rpg || typeof user.rpg !== 'object') user.rpg = {};
  const r = user.rpg;
  const today = vnDateKey(now);
  const currentWeek = vnWeekKey(now);
  const prefGrade = normalizeGrade(user.settings?.preferred_grade || '2K9');
  const isThcs2K12 = prefGrade === '2K12';

  // Mã SBD ẩn danh công khai (không thể truy ngược username)
  if (!r.anon_sbd && user.username) {
    r.anon_sbd = generatePublicAnonSbd(user.username);
  }

  // Mảnh ghép chuẩn hóa R1
  r.shop_shards = Math.max(0, Math.round(Number(r.shop_shards || 0)));
  r.iupac_shards = Math.max(0, Math.round(Number(r.iupac_shards || 0)));
  if (r.iupac_shards >= 2) {
    const addTickets = Math.floor(r.iupac_shards / 2);
    r.periodic_tickets = Math.max(0, Math.round(Number(r.periodic_tickets || 0))) + addTickets;
    r.iupac_shards = r.iupac_shards % 2;
  }

  // Đồ 7 ngày & Fallback previous_permanent_id (R3)
  if (!r.temp_items || typeof r.temp_items !== 'object') r.temp_items = {};
  const nowMs = now.getTime();
  for (const [itemId, meta] of Object.entries(r.temp_items)) {
    if (meta && Number(meta.expires_at || 0) <= nowMs) {
      const cat = meta.category;
      if (cat && r.equipped && r.equipped[cat] === itemId) {
        r.equipped[cat] = meta.previous_permanent_id || (
          cat === 'frame' ? 'frame-bronze'
            : cat === 'cardbg' ? 'cardbg-ocean'
            : cat === 'aura' ? 'aura-none'
            : cat === 'title' ? 'title-tanbinh'
            : cat === 'outfit' ? 'outfit-scholar'
            : null
        );
      }
      if (Array.isArray(r.inventory)) {
        r.inventory = r.inventory.filter(id => id !== itemId);
      }
      delete r.temp_items[itemId];
    }
  }
  if (r.temp_title && Number(r.temp_title.expires_at || 0) <= nowMs) {
    r.temp_title = null;
  }

  // Safe-by-Default Privacy Settings (R2)
  if (!r.privacy || typeof r.privacy !== 'object') {
    r.privacy = {
      school_visibility: isThcs2K12 ? 'hide_all' : 'province_grade',
      show_island_flag_pin: !isThcs2K12,
      allow_1v1_invites: isThcs2K12 ? 'friends_only' : 'everyone',
      allow_pomodoro_costudy: isThcs2K12 ? 'friends_only' : 'everyone',
      anonymous_bxh: false,
      blocked_users: []
    };
  } else {
    if (!['public_all', 'province_grade', 'hide_all'].includes(r.privacy.school_visibility)) {
      r.privacy.school_visibility = isThcs2K12 ? 'hide_all' : 'province_grade';
    }
    if (typeof r.privacy.show_island_flag_pin !== 'boolean') {
      r.privacy.show_island_flag_pin = !isThcs2K12;
    }
    if (!['everyone', 'friends_only', 'none'].includes(r.privacy.allow_1v1_invites)) {
      r.privacy.allow_1v1_invites = isThcs2K12 ? 'friends_only' : 'everyone';
    }
    if (!['everyone', 'friends_only'].includes(r.privacy.allow_pomodoro_costudy)) {
      r.privacy.allow_pomodoro_costudy = isThcs2K12 ? 'friends_only' : 'everyone';
    }
    r.privacy.anonymous_bxh = Boolean(r.privacy.anonymous_bxh);
    if (!Array.isArray(r.privacy.blocked_users)) r.privacy.blocked_users = [];
  }

  // Social & R4 Motivation Loops State
  if (!r.social || typeof r.social !== 'object') {
    r.social = {};
  }
  const soc = r.social;
  if (!Array.isArray(soc.rivals)) soc.rivals = [];
  soc.rivals = soc.rivals.filter(u => !r.privacy.blocked_users.includes(u)).slice(0, 3);
  soc.cheer_score = Math.max(0, Math.round(Number(soc.cheer_score || 0)));
  if (!Array.isArray(soc.recent_cheers)) soc.recent_cheers = [];
  if (!Array.isArray(soc.duel_inbox)) soc.duel_inbox = [];
  soc.duel_inbox = soc.duel_inbox.filter(inv => Number(inv?.expires_at || 0) > nowMs).slice(0, 20);
  soc.pomodoro_total_mins = Math.max(0, Math.round(Number(soc.pomodoro_total_mins || 0)));
  soc.costudy_sessions = Math.max(0, Math.round(Number(soc.costudy_sessions || 0)));
  soc.ai_vision_solved = Math.max(0, Math.round(Number(soc.ai_vision_solved || 0)));
  soc.sobo_8plus_count = Math.max(0, Math.round(Number(soc.sobo_8plus_count || 0)));
  soc.gdpt2018_9plus_count = Math.max(0, Math.round(Number(soc.gdpt2018_9plus_count || 0)));
  soc.std_exams_recent_10 = Array.isArray(soc.std_exams_recent_10) ? soc.std_exams_recent_10.slice(0, 10) : [];
  soc.duel_1v1_total_wins = Math.max(0, Math.round(Number(soc.duel_1v1_total_wins || 0)));
  soc.duel_1v1_total_matches = Math.max(0, Math.round(Number(soc.duel_1v1_total_matches || 0)));
  soc.island_flags_total = Math.max(0, Math.round(Number(soc.island_flags_total || 0)));

  if (!soc.referral || typeof soc.referral !== 'object') {
    soc.referral = {
      referred_by: null,
      rookie_chest_unlocked: false,
      rookie_chest_claimed: false,
      verified_referrals: [],
      week_ref_count: 0,
      season_ref_count: 0
    };
  }

  // BXH State (R1)
  if (!r.bxh || typeof r.bxh !== 'object') {
    r.bxh = {};
  }
  const b = r.bxh;

  if (!b.division_by_grade || typeof b.division_by_grade !== 'object') {
    const initTier = getInitialTierByXp(user.xp || 0);
    b.division_by_grade = {
      '2K9': prefGrade === '2K9' ? initTier : 'bronze',
      '2K8': prefGrade === '2K8' ? initTier : 'bronze',
      'DGNL': prefGrade === 'DGNL' ? initTier : 'bronze',
      '2K11': prefGrade === '2K11' ? initTier : 'bronze',
      '2K12': prefGrade === '2K12' ? initTier : 'bronze'
    };
  }
  for (const g of GRADES_5) {
    if (!DIVISION_MAP.has(b.division_by_grade[g.id])) {
      b.division_by_grade[g.id] = 'bronze';
    }
  }

  if (!Array.isArray(b.prev_weeks_dxh)) b.prev_weeks_dxh = [];
  if (!b.badge_counters || typeof b.badge_counters !== 'object') b.badge_counters = {};
  b.max_streak_real = Math.max(1, Number(b.max_streak_real || user.streak || 1));
  b.streak_real = Math.max(1, Number(b.streak_real || user.streak || 1));
  if (b.streak_real > b.max_streak_real) b.max_streak_real = b.streak_real;

  b.rank_shield_count = Math.max(0, Math.round(Number(b.rank_shield_count || 0)));
  b.rank_shield_active = Boolean(b.rank_shield_active);

  if (!b.hibernation || typeof b.hibernation !== 'object') {
    b.hibernation = {
      zero_weeks: 0,
      revival_active: false,
      revival_start_at: null,
      revival_dxh: 0,
      restore_tier: null,
      restore_grade: null,
      pending_restore_next_monday: false
    };
  }

  // Ghi nhận người quay lại sau >= 7 ngày vắng mặt (xét Badge #19 Phượng Hoàng Trở Lại khi chạm Rương Mốc 2)
  if (user.last_active && !b.hibernation.returned_after_7d) {
    const lastMs = new Date(user.last_active).getTime();
    if (Number.isFinite(lastMs) && (nowMs - lastMs) >= 7 * 86400000) {
      b.hibernation.returned_after_7d = true;
    }
  }

  // Rollover tuần mới (Settlement Window Thứ Hai)
  if (b.week_key !== currentWeek) {
    if (b.week_key) {
      const prevWeekKey = b.week_key;
      const elapsedWeeks = weeksBetweenKeys(prevWeekKey, currentWeek);
      const missedZeroWeeks = Math.max(0, elapsedWeeks - 1);
      const prevDxh = Math.max(0, Number(b.dxh_week || 0));
      const prevGrade = b.primary_grade || prefGrade;
      const curTierId = b.division_by_grade[prevGrade] || 'bronze';
      const curIdx = DIVISION_MAP.get(curTierId)?.index || 0;
      b.prev_weeks_dxh.unshift({ week_key: prevWeekKey, dxh: prevDxh, grade: prevGrade });
      b.prev_weeks_dxh = b.prev_weeks_dxh.slice(0, 8);

      // Áp dụng khôi phục Hạng từ Nhiệm Vụ Hồi Sinh nếu đã hoàn thành ở tuần trước
      if (b.hibernation.pending_restore_next_monday && b.hibernation.restore_tier && b.hibernation.restore_grade) {
        b.division_by_grade[b.hibernation.restore_grade] = b.hibernation.restore_tier;
        b.hibernation.pending_restore_next_monday = false;
        b.hibernation.revival_active = false;
        b.hibernation.restore_tier = null;
      }

      // Kiểm tra Ngủ Đông (0 ĐXH) vs Chốt sổ Bảng Đấu Tuần (prevDxh > 0)
      if (prevDxh === 0) {
        b.last_week_top10 = false;
        b.hibernation.zero_weeks = Number(b.hibernation.zero_weeks || 0) + 1 + missedZeroWeeks;
        if (b.hibernation.zero_weeks >= 2) {
          const dropTierId = b.division_by_grade[prevGrade] || curTierId;
          const dropIdx = DIVISION_MAP.get(dropTierId)?.index || 0;
          if (dropIdx > 0 && !b.hibernation.revival_active) {
            b.hibernation.restore_tier = dropTierId;
            b.hibernation.restore_grade = prevGrade;
            b.division_by_grade[prevGrade] = DIVISION_TIERS[dropIdx - 1].id;
            b.hibernation.revival_active = true;
            b.hibernation.revival_start_at = now.toISOString();
            b.hibernation.revival_dxh = 0;
          }
        }
      } else {
        b.hibernation.zero_weeks = 0;
        // Chốt sổ Bảng Đấu 30 người (Lớp 1): Thăng/Trụ/Giáng hạng, tiêu thụ Khiên Bảo Vệ Hạng & phát quà tuần
        if (!b.joined_after_sat18) {
          const prevRank = Math.max(1, Number(
            b.current_division_rank ||
            (prevDxh >= 1200 ? 1 : prevDxh >= 700 ? 2 : prevDxh >= 450 ? 3 : prevDxh >= 260 ? 5 : prevDxh >= 150 ? 12 : 27)
          ));
          const prevTotal = Math.max(prevRank, Number(b.current_division_total || 30));
          const hasShield = Boolean(b.rank_shield_active || Number(b.rank_shield_count || 0) > 0);
          const standing = evaluateDivisionStanding(prevRank, prevTotal, curTierId, prevDxh, hasShield);
          const reward = computeDivisionReward(curTierId, prevRank, prevDxh, prevTotal);
          if (reward.bucket === 'top1') {
            reward.temp_cosmetic = pickRotatingTop1Cosmetic(prevWeekKey);
          }

          let shieldConsumed = false;
          if (standing.zone === 'shielded') {
            shieldConsumed = true;
            b.rank_shield_count = Math.max(0, Number(b.rank_shield_count || 1) - 1);
            b.rank_shield_active = b.rank_shield_count > 0;
          } else if (standing.promoted && curIdx < DIVISION_TIERS.length - 1) {
            b.division_by_grade[prevGrade] = DIVISION_TIERS[curIdx + 1].id;
          } else if (standing.demoted && curIdx > 0) {
            b.division_by_grade[prevGrade] = DIVISION_TIERS[curIdx - 1].id;
          }

          // Cộng quà Lớp 1 vào tài khoản
          r.gold = Math.max(0, Number(r.gold || 0)) + Number(reward.gold || 0);
          r.diamonds = Math.max(0, Number(r.diamonds || 0)) + Number(reward.diamonds || 0);
          r.periodic_tickets = Math.max(0, Number(r.periodic_tickets || 0)) + Number(reward.iupac_tickets || 0);
          r.iupac_shards = Math.max(0, Number(r.iupac_shards || 0)) + Number(reward.iupac_shards || 0);
          if (r.iupac_shards >= 2) {
            r.periodic_tickets += Math.floor(r.iupac_shards / 2);
            r.iupac_shards = r.iupac_shards % 2;
          }
          r.shop_shards = Math.max(0, Number(r.shop_shards || 0)) + Number(reward.shop_shards || 0);
          if (reward.island_flags > 0) {
            soc.island_flags_total = Number(soc.island_flags_total || 0) + Number(reward.island_flags || 0);
          }
          if (!r.consumables || typeof r.consumables !== 'object') r.consumables = { xp_boost: 0, gold_charm: 0 };
          if (reward.gold_charm > 0) r.consumables.gold_charm = Number(r.consumables.gold_charm || 0) + reward.gold_charm * 5;
          if (reward.xp_boost > 0) r.consumables.xp_boost = Number(r.consumables.xp_boost || 0) + reward.xp_boost * 3;
          if (reward.temp_title) {
            const divPrio = reward.bucket === 'top1' ? 80 : 50;
            const curTitlePrio = (r.temp_title && Number(r.temp_title.expires_at || 0) > nowMs) ? Number(r.temp_title.priority || 0) : 0;
            if (divPrio >= curTitlePrio) {
              r.temp_title = { text: reward.temp_title, priority: divPrio, expires_at: nowMs + 7 * 86400000 };
            }
          }

          if (reward.badge_id) {
            b.badge_counters[reward.badge_id] = Number(b.badge_counters[reward.badge_id] || 0) + 1;
          }
          if (standing.promoted && reward.badge_id !== 'badge-division-promote') {
            b.badge_counters['badge-division-promote'] = Number(b.badge_counters['badge-division-promote'] || 0) + 1;
          }
          if (Number(b.thursday_rank || 0) >= 21 && prevRank <= 10 && prevDxh >= 300) {
            b.badge_counters['badge-underdog'] = Number(b.badge_counters['badge-underdog'] || 0) + 1;
          }
          if (reward.temp_cosmetic) {
            const achievedCnt = Number(b.badge_counters[reward.badge_id] || 1);
            grantTempOrPermCosmetic(user, reward.temp_cosmetic, achievedCnt, now);
          }

          b.last_week_top10 = prevRank <= 10 && prevDxh >= 150;
          b.last_weekly_settlement = {
            week_key: prevWeekKey,
            grade: prevGrade,
            prev_tier: curTierId,
            new_tier: b.division_by_grade[prevGrade],
            rank: prevRank,
            total: prevTotal,
            dxh: prevDxh,
            standing,
            reward,
            layer2_rewards: [],
            shield_used: shieldConsumed,
            settled_at: now.toISOString()
          };
        } else {
          b.last_week_top10 = false;
        }

        // Nếu học viên nghỉ trắng thêm >= 1 tuần sau tuần có điểm (không đăng nhập giữa chừng)
        if (missedZeroWeeks >= 1) {
          for (let mz = 0; mz < Math.min(missedZeroWeeks, 4); mz++) {
            b.prev_weeks_dxh.unshift({ week_key: `missed-${mz + 1}`, dxh: 0, grade: prevGrade });
          }
          b.prev_weeks_dxh = b.prev_weeks_dxh.slice(0, 8);
          b.last_week_top10 = false;
          b.hibernation.zero_weeks = missedZeroWeeks;
          if (missedZeroWeeks >= 2) {
            const afterTierId = b.division_by_grade[prevGrade] || curTierId;
            const afterIdx = DIVISION_MAP.get(afterTierId)?.index || 0;
            if (afterIdx > 0 && !b.hibernation.revival_active) {
              b.hibernation.restore_tier = afterTierId;
              b.hibernation.restore_grade = prevGrade;
              b.division_by_grade[prevGrade] = DIVISION_TIERS[afterIdx - 1].id;
              b.hibernation.revival_active = true;
              b.hibernation.revival_start_at = now.toISOString();
              b.hibernation.revival_dxh = 0;
            }
          }
        }
      }

      // Cập nhật Cohort tuần mới dựa trên ĐXH tuần liền trước (0 nếu có tuần nghỉ xen giữa)
      const effectiveLastDxh = missedZeroWeeks >= 1 ? 0 : prevDxh;
      b.cohort = effectiveLastDxh >= 1200 ? 'diligent' : effectiveLastDxh >= 300 ? 'medium' : 'new_return';
    } else {
      b.cohort = 'new_return';
    }

    b.week_key = currentWeek;
    b.last_rollover_at = now.toISOString();
    b.primary_grade = prefGrade;
    b.primary_grade_locked = false;
    b.dxh_week = 0;
    b.dxh_reached_at = now.toISOString();
    b.first_valid_day_at = null;
    b.valid_days_week = [];
    b.chests_claimed = { chest_1: false, chest_2: false, chest_3: false, chest_4: false };
    b.joined_after_sat18 = false;
    b.current_division_rank = null;
    b.current_division_total = null;
    b.thursday_rank = null;
    b.weekly_stats = {
      std_exam_scores: [],
      exam_attempts_map: {},
      contest_9plus_done: false,
      contest_9plus_bonus: 0,
      duel_1v1_wins: 0,
      duel_1v1_matches: 0,
      duel_1v1_elo: Number(b.weekly_stats?.duel_1v1_elo || 1000),
      duel_1v1_streak: 0,
      duel_recent_opponents: b.weekly_stats?.duel_recent_opponents || {},
      duel_pair_week_count: {},
      pomodoro_verified_mins_week: 0,
      pomodoro_sessions_week: 0,
      daily_4of4_days_week: 0,
      correct_week: 0,
      questions_week: 0,
      weekend_sat_dxh: 0,
      weekend_sun_dxh: 0,
      streak_bonus_granted: 0,
      weekend_catchup_granted: false,
      early_bird_days_week: []
    };
    soc.referral.week_ref_count = 0;
  }

  if (!b.primary_grade || !GRADE_IDS.has(b.primary_grade)) {
    b.primary_grade = prefGrade;
  }
  if (!b.chests_claimed || typeof b.chests_claimed !== 'object') {
    b.chests_claimed = { chest_1: false, chest_2: false, chest_3: false, chest_4: false };
  }
  if (!b.weekly_stats || typeof b.weekly_stats !== 'object') {
    b.weekly_stats = {
      std_exam_scores: [],
      exam_attempts_map: {},
      contest_9plus_done: false,
      contest_9plus_bonus: 0,
      duel_1v1_wins: 0,
      duel_1v1_matches: 0,
      duel_1v1_elo: 1000,
      duel_1v1_streak: 0,
      duel_recent_opponents: {},
      duel_pair_week_count: {},
      pomodoro_verified_mins_week: 0,
      pomodoro_sessions_week: 0,
      daily_4of4_days_week: 0,
      correct_week: 0,
      questions_week: 0,
      weekend_sat_dxh: 0,
      weekend_sun_dxh: 0,
      streak_bonus_granted: 0,
      weekend_catchup_granted: false,
      early_bird_days_week: []
    };
  }

  // Trần ngày (Daily Caps)
  if (!b.daily_caps || typeof b.daily_caps !== 'object' || b.daily_caps.date !== today) {
    b.daily_caps = {
      date: today,
      dxh_today: 0,
      std_exams_today: 0,
      mini_exams_today: 0,
      duel_1v1_today: 0,
      videos_today: 0,
      short_video_half: 0,
      pdfs_today: 0,
      flashcards_today: 0,
      srs_sessions_today: 0,
      srs_blocked_ids_today: [],
      daily_combo_claimed: false,
      wrong_bank_today: 0,
      pomodoro_mins_today: 0,
      ai_vision_today: 0,
      omega_gold_bonus_today: 0,
      flames_sent_today: 0,
      flames_targets_today: [],
      flames_received_today: 0,
      stranger_1v1_invites_today: 0,
      cheer_xp_claimed_today: false
    };
  }

  // Đồng bộ 24 Badges & Tủ Kính Thành Tựu R3
  syncUserBadgesAndShowcase(user, now);
  return b;
}

// Cộng ĐXH Tuần thông qua Cổng Kiểm Duyệt & Trần Tổng Ngày (750 T2-T6 / 950 T7-CN)
function grantWeeklyDxh(user, rawAmount, { bypassDailyCap = false, source = 'study', now = new Date(), isWarmupOverflow = false } = {}) {
  const b = ensureBxhUserState(user, now);
  if (!b) return { grantedDxh: 0, capped: false, dxh_week: 0, dxh_today: 0 };
  const amount = Math.max(0, Math.round(Number(rawAmount || 0)));
  if (amount <= 0) {
    return { grantedDxh: 0, capped: false, dxh_week: b.dxh_week, dxh_today: b.daily_caps.dxh_today };
  }

  const today = vnDateKey(now);
  const dailyCap = getGlobalDailyDxhCap(now);
  let granted = amount;
  let capped = false;

  if (!bypassDailyCap) {
    const remaining = Math.max(0, dailyCap - Number(b.daily_caps.dxh_today || 0));
    if (granted > remaining) {
      granted = remaining;
      capped = true;
    }
    b.daily_caps.dxh_today = Number(b.daily_caps.dxh_today || 0) + granted;
  }

  if (granted > 0) {
    // Khóa Hệ Chính Tuần và đánh dấu Bảng Khởi Động Cuối Tuần nếu overflow sau 18:00 Thứ Bảy
    if (!b.primary_grade_locked && Number(b.dxh_week || 0) === 0) {
      b.primary_grade_locked = true;
      if (isAfterSaturday18Vn(now) && isWarmupOverflow) {
        b.joined_after_sat18 = true;
      }
    }

    b.dxh_week = Number(b.dxh_week || 0) + granted;
    b.dxh_reached_at = now.toISOString();

    // Ghi nhận điểm Thứ Bảy / Chủ Nhật cho Weekend Catch-Up
    const vn = vnNowDate(now);
    const dow = vn.getUTCDay();
    if (dow === 6 && !bypassDailyCap) b.weekly_stats.weekend_sat_dxh = Number(b.weekly_stats.weekend_sat_dxh || 0) + granted;
    if (dow === 0 && !bypassDailyCap) b.weekly_stats.weekend_sun_dxh = Number(b.weekly_stats.weekend_sun_dxh || 0) + granted;

    // Đánh dấu học trong khung giờ vàng Cú Sáng Sớm (05:00 - 07:00 VN)
    const vnHour = vn.getUTCHours();
    if (vnHour >= 5 && vnHour < 7) {
      b.daily_caps.studied_early_bird_today = true;
    }

    // Kiểm tra Ngày Hợp Lệ (>= 40 ĐXH/ngày từ học thật)
    if (b.daily_caps.dxh_today >= 40) {
      if (b.daily_caps.studied_early_bird_today) {
        if (!Array.isArray(b.weekly_stats.early_bird_days_week)) b.weekly_stats.early_bird_days_week = [];
        if (!b.weekly_stats.early_bird_days_week.includes(today)) {
          b.weekly_stats.early_bird_days_week.push(today);
          if (b.weekly_stats.early_bird_days_week.length === 5) {
            b.badge_counters['badge-weekend-earlybird'] = Number(b.badge_counters['badge-weekend-earlybird'] || 0) + 1;
          }
        }
      }
      if (!Array.isArray(b.valid_days_week)) b.valid_days_week = [];
      if (!b.valid_days_week.includes(today)) {
        b.valid_days_week.push(today);
        if (!b.first_valid_day_at) b.first_valid_day_at = now.toISOString();
        if (b.last_valid_day_date !== today) {
          const yesterday = vnDateKey(new Date(now.getTime() - 86400000));
          if (b.last_valid_day_date === yesterday) {
            b.streak_real = Number(b.streak_real || 1) + 1;
          } else {
            b.streak_real = 1;
          }
          b.last_valid_day_date = today;
          if (b.streak_real > Number(b.max_streak_real || 1)) {
            b.max_streak_real = b.streak_real;
          }
          // Tặng Thẻ Bảo Vệ Hạng miễn phí mỗi mốc Streak 14 ngày
          if (b.streak_real > 0 && b.streak_real % 14 === 0) {
            b.rank_shield_count = Number(b.rank_shield_count || 0) + 1;
          }
        }
      }
      // Mở khóa Rương Tân Binh (R4) nếu học viên đã có đề >= 5.0đ hoặc Pomodoro 25p xác thực
      if (user?.rpg?.social?.referral?.referred_by && user.rpg.social.referral.has_qualifying_exam_or_pomo && !user.rpg.social.referral.rookie_chest_unlocked) {
        user.rpg.social.referral.rookie_chest_unlocked = true;
      }
    }

    // Tiến độ Nhiệm Vụ Hồi Sinh (500 ĐXH trong 7 ngày liên tiếp)
    if (b.hibernation?.revival_active && !b.hibernation.pending_restore_next_monday) {
      const startMs = b.hibernation.revival_start_at ? new Date(b.hibernation.revival_start_at).getTime() : now.getTime();
      if (now.getTime() - startMs <= 7 * 86400000) {
        b.hibernation.revival_dxh = Number(b.hibernation.revival_dxh || 0) + granted;
        if (b.hibernation.revival_dxh >= 500) {
          b.hibernation.pending_restore_next_monday = true;
          if (b.hibernation.phoenix_awarded_week !== b.week_key) {
            b.hibernation.phoenix_awarded_week = b.week_key;
            b.badge_counters['badge-phoenix-return'] = Number(b.badge_counters['badge-phoenix-return'] || 0) + 1;
          }
        }
      } else {
        b.hibernation.revival_start_at = now.toISOString();
        b.hibernation.revival_dxh = granted;
      }
    }

    // Kiểm tra Thưởng Chuyên Cần Tuần (Streak Bonus 3 / 5 / 7 ngày & Weekend Catch-Up)
    if (!bypassDailyCap) {
      const validCount = (b.valid_days_week || []).length;
      const targetStreakBonus = validCount >= 7 ? 200 : validCount >= 5 ? 120 : validCount >= 3 ? 50 : 0;
      const prevBonus = Number(b.weekly_stats.streak_bonus_granted || 0);
      if (targetStreakBonus > prevBonus) {
        const diffBonus = targetStreakBonus - prevBonus;
        b.weekly_stats.streak_bonus_granted = targetStreakBonus;
        b.dxh_week += diffBonus;
      } else if (
        targetStreakBonus === 0 &&
        !b.weekly_stats.weekend_catchup_granted &&
        Number(b.weekly_stats.weekend_sat_dxh || 0) >= 350 &&
        Number(b.weekly_stats.weekend_sun_dxh || 0) >= 350
      ) {
        // Weekend Catch-Up Streak Bonus (+50 ĐXH nếu T2-T6 có 0 ngày hợp lệ nhưng cả T7 & CN đạt >= 350 ĐXH)
        const weekdayValid = (b.valid_days_week || []).filter(dk => {
          const dt = new Date(`${dk}T12:00:00+07:00`);
          const dw = dt.getUTCDay();
          return dw >= 1 && dw <= 5;
        });
        if (weekdayValid.length === 0) {
          b.weekly_stats.weekend_catchup_granted = true;
          b.dxh_week += 50;
          b.badge_counters['badge-weekend-earlybird'] = Number(b.badge_counters['badge-weekend-earlybird'] || 0) + 1;
        }
      }
    }
  }

  syncUserBadgesAndShowcase(user, now);
  return {
    grantedDxh: granted,
    capped,
    dailyCap,
    dxh_week: b.dxh_week,
    dxh_today: b.daily_caps.dxh_today
  };
}

// Tính ĐXH từ nộp đề Phòng thi ảo GDPT 2018 & 30+ Đề Sở/Bộ (kèm Quality Gate & Trần ngày)
function recordExamDxhAndStats(user, examMeta = {}, result = {}, now = new Date(), opts = {}) {
  const b = ensureBxhUserState(user, now);
  const soc = user.rpg.social;
  const examId = String(examMeta.id || examMeta.exam_id || 'exam').trim();
  const examTitle = String(examMeta.title || '').trim();
  const examGrade = normalizeGrade(examMeta.grade || examMeta.program || b.primary_grade, b.primary_grade);
  const durationMin = Math.max(15, Number(examMeta.duration || 50));
  const isStandardExam = durationMin >= 45;
  const score = Math.max(0, Math.min(10, Number(result.score ?? 0)));
  const totalQ = Math.max(1, Number(result.total ?? result.total_questions ?? 20));
  const answeredQ = Number(result.answered !== undefined && result.answered !== null ? result.answered : totalQ);
  const correctQ = Math.max(0, Number(result.correct ?? 0));
  const rawElapsed = result.elapsed_sec !== undefined && result.elapsed_sec !== null
    ? result.elapsed_sec
    : (examMeta.elapsed_sec !== undefined && examMeta.elapsed_sec !== null ? examMeta.elapsed_sec : durationMin * 60 * 0.5);
  const elapsedSec = Math.max(0, Number(rawElapsed));

  // Quality Gate 1: Thời gian làm >= 35% thời lượng đề (hoặc TB >= 3s/câu, sàn tối thiểu 30s) & hoàn thành >= 70% số câu
  const minSecRequired = Math.max(30, Math.min(durationMin * 60 * 0.35, totalQ * 3));
  const answeredRatio = answeredQ / totalQ;
  const passedQualityGate = elapsedSec >= minSecRequired && answeredRatio >= 0.7;

  // Cập nhật thống kê học thuật xác thực nếu qua Quality Gate
  if (passedQualityGate) {
    if (score > Number(user.best_score || 0)) {
      user.best_score = score;
    }
    b.weekly_stats.correct_week = Number(b.weekly_stats.correct_week || 0) + correctQ;
    b.weekly_stats.questions_week = Number(b.weekly_stats.questions_week || 0) + totalQ;

    if (isStandardExam) {
      if (score >= 9.0) {
        soc.gdpt2018_9plus_count = Number(soc.gdpt2018_9plus_count || 0) + 1;
      }
      const isSoBo = /sở|bộ gd|chính thức|chuyên|khảo sát/i.test(`${examTitle} ${examMeta.source || ''}`);
      if (isSoBo && score >= 8.0) {
        soc.sobo_8plus_count = Number(soc.sobo_8plus_count || 0) + 1;
      }
      soc.std_exams_recent_10.unshift({
        exam_id: examId,
        title: examTitle,
        score,
        at: now.toISOString()
      });
      soc.std_exams_recent_10 = soc.std_exams_recent_10.slice(0, 10);
    }
  }

  // Kiểm tra Khóa Hệ Chính Tuần
  if (b.primary_grade_locked && examGrade !== b.primary_grade) {
    syncUserBadgesAndShowcase(user, now);
    return {
      dxhGranted: 0,
      passedQualityGate,
      reason: 'outside_primary_grade',
      message: `Đề này thuộc hệ ${examGrade} (khác Hệ Chính Tuần ${b.primary_grade} của bạn) — kết quả tính 0 ĐXH Tuần nhưng vẫn cộng EXP cá nhân.`
    };
  }

  if (!passedQualityGate) {
    syncUserBadgesAndShowcase(user, now);
    return {
      dxhGranted: 0,
      passedQualityGate: false,
      reason: 'quality_gate_failed',
      message: 'Bài nộp quá nhanh (< 35% thời gian) hoặc hoàn thành < 70% số câu — không tính ĐXH Tuần.'
    };
  }

  // Kiểm tra làm lại cùng 1 mã đề trong tuần
  const prevAttempt = b.weekly_stats.exam_attempts_map[examId] || { count: 0, best_score: 0 };
  const attemptNo = prevAttempt.count + 1;
  let repeatMult = 1.0;
  if (attemptNo === 2) {
    repeatMult = score > prevAttempt.best_score ? 0.4 : 0;
  } else if (attemptNo >= 3) {
    repeatMult = 0;
  }
  b.weekly_stats.exam_attempts_map[examId] = {
    count: attemptNo,
    best_score: Math.max(prevAttempt.best_score, score)
  };

  if (repeatMult === 0) {
    syncUserBadgesAndShowcase(user, now);
    return {
      dxhGranted: 0,
      passedQualityGate: true,
      reason: 'repeat_limit',
      message: 'Đề này đã làm đủ số lượt tính ĐXH Tuần (Lần 3+ tính 0 ĐXH).'
    };
  }

  // Lưu lần làm đầu đạt Quality Gate của đề chuẩn vào std_exam_scores (cho Tie-Breaker #1 & Phó Bảng #2)
  if (isStandardExam && attemptNo === 1) {
    b.weekly_stats.std_exam_scores.push({
      exam_id: examId,
      title: examTitle,
      score,
      accuracy: Math.round((correctQ / totalQ) * 100),
      at: now.toISOString()
    });
  }

  // Nếu đây là bài thi Đấu Trường 9+ (Contest) lần đầu trong tuần, không cộng trùng ĐXH đề thường — phần thưởng +120 & phân vị sẽ do Contest cộng
  if (opts && opts.skipNormalDxh) {
    if (score >= 5.0 && soc.referral) {
      soc.referral.has_qualifying_exam_or_pomo = true;
    }
    syncUserBadgesAndShowcase(user, now);
    return {
      dxhGranted: 0,
      passedQualityGate: true,
      skippedForContest: true,
      isStandardExam,
      dxh_week: b.dxh_week
    };
  }

  // Kiểm tra trần số đề/ngày (Đề chuẩn: 3/ngày T2-T6, 4/ngày T7-CN; Đề mini: 2/ngày)
  const stdCap = isWeekendVn(now) ? 4 : 3;
  const miniCap = 2;
  if (isStandardExam) {
    if (b.daily_caps.std_exams_today >= stdCap) {
      syncUserBadgesAndShowcase(user, now);
      return { dxhGranted: 0, passedQualityGate: true, reason: 'daily_std_exam_cap', message: `Đã đạt trần ${stdCap} đề chuẩn/ngày.` };
    }
    b.daily_caps.std_exams_today += 1;
  } else {
    if (b.daily_caps.mini_exams_today >= miniCap) {
      syncUserBadgesAndShowcase(user, now);
      return { dxhGranted: 0, passedQualityGate: true, reason: 'daily_mini_exam_cap', message: `Đã đạt trần ${miniCap} đề mini/ngày.` };
    }
    b.daily_caps.mini_exams_today += 1;
  }

  // Hệ số chất lượng điểm thi
  const scoreMult = score >= 9.0 ? 1.6
    : score >= 8.0 ? 1.35
    : score >= 6.5 ? 1.1
    : score >= 4.0 ? 0.8
    : 0.3;

  const baseDxh = isStandardExam ? 100 : 60;
  const rawDxh = Math.round(baseDxh * scoreMult * repeatMult);
  if (score >= 5.0 && soc.referral) {
    soc.referral.has_qualifying_exam_or_pomo = true;
  }
  const granted = grantWeeklyDxh(user, rawDxh, { source: isStandardExam ? 'std_exam' : 'mini_exam', now });

  // Kích hoạt mở khóa Rương Tân Binh (R4 QR Referral) nếu đã đạt >= 40 ĐXH và đề >= 5.0đ
  if (score >= 5.0 && (b.daily_caps.dxh_today >= 40 || (Array.isArray(b.valid_days_week) && b.valid_days_week.length > 0)) && soc.referral?.referred_by && !soc.referral.rookie_chest_unlocked) {
    soc.referral.rookie_chest_unlocked = true;
  }

  return {
    dxhGranted: granted.grantedDxh,
    passedQualityGate: true,
    rawDxh,
    scoreMult,
    repeatMult,
    isStandardExam,
    dxh_week: granted.dxh_week
  };
}

// Đồng bộ toàn bộ 24 Badges và Tủ Kính Thành Tựu 5 vùng (R3)
function syncUserBadgesAndShowcase(user, now = new Date()) {
  if (!user || !user.rpg) return;
  const r = user.rpg;
  const b = r.bxh || {};
  const soc = r.social || {};
  const counters = b.badge_counters || {};

  // Tính toán tiến độ thực của 24 Badges
  const doneLessons = user.progress?.done && typeof user.progress.done === 'object'
    ? Object.values(user.progress.done).filter(Boolean).length
    : 0;
  const fcMap = r.flashcards_state && typeof r.flashcards_state === 'object' ? r.flashcards_state : {};
  const masteredFc = Object.values(fcMap).filter(x => x && x.status === 'mastered').length;
  const srsCount = Object.keys(r.srs_map || {}).length;
  const islands3Star = Object.values(r.journey || {}).filter(x => Number(x?.stars || 0) >= 3).length;
  const islandFlags = Number(soc.island_flags_total || 0);
  const iupacCount = Array.isArray(r.periodic_unlocked) ? r.periodic_unlocked.length : 3;
  const pomoHours = Math.floor(Number(soc.pomodoro_total_mins || 0) / 60);
  // Badge #13: 10h/30h/80h/150h/300h/500h hoặc +1 mốc mỗi lần Top 3 Phó Bảng #3
  const pomoSubWins = Number(counters['badge-pomodoro-sub3'] || 0);
  const pomoThresholds = [10, 30, 80, 150, 300, 500];
  let pomoBaseTier = -1;
  for (let i = 0; i < pomoThresholds.length; i++) {
    if (pomoHours >= pomoThresholds[i]) pomoBaseTier = i;
  }
  const pomoEffectiveTier = Math.min(pomoThresholds.length - 1, pomoBaseTier + pomoSubWins);
  const pomoEffectiveCount = pomoSubWins > 0 && pomoEffectiveTier >= 0
    ? Math.max(pomoHours, pomoThresholds[pomoEffectiveTier])
    : Math.max(Number(counters['badge-pomodoro-warrior'] || 0), pomoHours);

  const rawCounts = {
    'badge-division-crown': Number(counters['badge-division-crown'] || 0),
    'badge-division-podium': Number(counters['badge-division-podium'] || 0),
    'badge-division-promote': Number(counters['badge-division-promote'] || 0),
    'badge-system-valedictorian': Number(counters['badge-system-valedictorian'] || 0),
    'badge-system-top100': Number(counters['badge-system-top100'] || 0),
    'badge-arena-warlord': Math.max(Number(counters['badge-arena-warlord'] || 0), Math.floor(Number(soc.duel_1v1_total_wins || 0) / 3)),
    'badge-exam2018-hunter': Number(counters['badge-exam2018-hunter'] || 0),
    'badge-weekly-surge': Number(counters['badge-weekly-surge'] || 0),
    'badge-weekly-2k': Number(counters['badge-weekly-2k'] || 0),
    'badge-gdpt2018-master': Math.max(Number(counters['badge-gdpt2018-master'] || 0), Number(soc.gdpt2018_9plus_count || 0)),
    'badge-sobo-hunter': Math.max(Number(counters['badge-sobo-hunter'] || 0), Number(soc.sobo_8plus_count || 0)),
    'badge-flashcard-srs': Math.max(Number(counters['badge-flashcard-srs'] || 0), masteredFc + srsCount),
    'badge-pomodoro-warrior': pomoEffectiveCount,
    'badge-island-explorer': Math.max(Number(counters['badge-island-explorer'] || 0), islands3Star + islandFlags),
    'badge-ai-companion': Math.max(Number(counters['badge-ai-companion'] || 0), Number(soc.ai_vision_solved || 0)),
    'badge-iupac-chemist': iupacCount,
    'badge-video-pdf-scholar': Math.max(Number(counters['badge-video-pdf-scholar'] || 0), doneLessons),
    'badge-eternal-flame': Math.max(Number(b.max_streak_real || 1), Number(user.streak || 1)),
    'badge-phoenix-return': Number(counters['badge-phoenix-return'] || 0),
    'badge-underdog': Number(counters['badge-underdog'] || 0),
    'badge-weekend-earlybird': Number(counters['badge-weekend-earlybird'] || 0),
    'badge-ambassador-k9': Math.max(Number(counters['badge-ambassador-k9'] || 0), Array.isArray(soc.referral?.verified_referrals) ? soc.referral.verified_referrals.length : 0),
    'badge-costudy-companion': Math.max(Number(counters['badge-costudy-companion'] || 0), Number(soc.costudy_sessions || 0)),
    'badge-squad-leader': Number(counters['badge-squad-leader'] || 0)
  };

  const badgesList = BADGES_24.map(def => {
    const info = computeBadgeTierInfo(def, rawCounts[def.id] || 0);
    if (def.id === 'badge-system-top100' && b.highest_top100_label) {
      info.subLabel = b.highest_top100_label;
    }
    return info;
  });
  r.badges_24 = badgesList;

  // Tính số ô Showcase mở khóa theo Bậc Rank RPG + Đặc quyền Mượn Tạm Ô 3 cho Bậc Đồng
  const xp = Math.max(0, Number(user.xp || 0));
  const rpgTierId = getInitialTierByXp(xp);
  const rpgTierObj = DIVISION_MAP.get(rpgTierId) || DIVISION_TIERS[0];
  const borrowedSlot3Eligible = rpgTierId === 'bronze' && (Number(b.streak_real || user.streak || 1) >= 7 || Boolean(b.last_week_top10));
  const unlockedShowcaseSlots = rpgTierId === 'bronze'
    ? (borrowedSlot3Eligible ? 3 : 2)
    : rpgTierObj.showcaseSlots;

  if (!r.showcase || typeof r.showcase !== 'object') {
    r.showcase = {
      hero_badge: null,
      showcase_badges: [],
      milestone_cards: [],
      featured_iupac: 8,
      showcase_frame: rpgTierObj.goldenShowcaseFrame ? 'legend_gold' : 'default',
      active_preset: 'custom'
    };
  }

  const sc = r.showcase;
  sc.unlocked_slots = unlockedShowcaseSlots;
  sc.borrowed_slot_3 = borrowedSlot3Eligible;
  if (rpgTierObj.goldenShowcaseFrame) sc.showcase_frame = 'legend_gold';

  const unlockedBadgeIds = new Set(badgesList.filter(x => x.unlocked).map(x => x.id));
  const topUnlockedBadges = badgesList
    .filter(x => x.unlocked)
    .sort((a, b) => b.tierIndex - a.tierIndex || b.count - a.count);

  if (!sc.hero_badge || !unlockedBadgeIds.has(sc.hero_badge)) {
    sc.hero_badge = topUnlockedBadges[0]?.id || null;
  }

  // Fallback R3: nếu hết hạn Mượn Tạm Ô 3, tự động thu gọn về đúng số ô mở khóa và trả huy hiệu về Kho
  if (!Array.isArray(sc.showcase_badges)) sc.showcase_badges = [];
  sc.showcase_badges = sc.showcase_badges
    .filter(id => id && unlockedBadgeIds.has(id))
    .slice(0, unlockedShowcaseSlots);

  if (sc.showcase_badges.length === 0 && topUnlockedBadges.length > 0) {
    sc.showcase_badges = topUnlockedBadges.slice(0, unlockedShowcaseSlots).map(x => x.id);
  }

  // Nguyên tố IUPAC tâm điểm
  const unlockedZ = Array.isArray(r.periodic_unlocked) && r.periodic_unlocked.length ? r.periodic_unlocked : [1, 6, 8];
  if (!sc.featured_iupac || !unlockedZ.includes(Number(sc.featured_iupac))) {
    sc.featured_iupac = unlockedZ[unlockedZ.length - 1] || 8;
  }

  // 3 Thẻ Cột Mốc Ghim (Pinned High-Water Snapshots)
  if (!Array.isArray(sc.milestone_cards) || sc.milestone_cards.length === 0) {
    sc.milestone_cards = buildDefaultMilestones(user, now);
  }
}

function buildAvailableMilestones(user, now = new Date()) {
  const r = user.rpg || {};
  const b = r.bxh || {};
  const soc = r.social || {};
  const dateLabel = new Date(now.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10).split('-').reverse().join('/');
  const rec10 = Array.isArray(soc.std_exams_recent_10) ? soc.std_exams_recent_10 : [];
  const avg10 = rec10.length >= 3
    ? `${(rec10.reduce((s, x) => s + Number(x.score || 0), 0) / rec10.length).toFixed(2)}đ`
    : 'Đang tích lũy';
  const bestExam = rec10.length
    ? `${Math.max(...rec10.map(x => Number(x.score || 0))).toFixed(2)}đ`
    : (Number(user.best_score || 0) > 0 ? `${Number(user.best_score).toFixed(2)}đ` : 'Chưa có đề');
  const pomoHrs = (Number(soc.pomodoro_total_mins || 0) / 60).toFixed(1);
  const fcMap = r.flashcards_state && typeof r.flashcards_state === 'object' ? r.flashcards_state : {};
  const masteredFc = Object.values(fcMap).filter(x => x && x.status === 'mastered').length;
  const islandsCleared = Object.values(r.journey || {}).filter(x => Number(x?.stars || 0) > 0).length;
  const totalStars = Object.values(r.journey || {}).reduce((s, x) => s + Number(x?.stars || 0), 0);
  const winRate1v1 = soc.duel_1v1_total_matches > 0
    ? `${soc.duel_1v1_total_wins} thắng (${Math.round((soc.duel_1v1_total_wins / soc.duel_1v1_total_matches) * 100)}%)`
    : '0 trận';

  return [
    { id: 'best_exam_score', icon: '🎯', label: 'Đỉnh Đề Chuẩn GDPT 2018', valueText: bestExam, sub: 'Phòng thi ảo 3 phần', dateLabel, verified: true },
    { id: 'avg_10_std_exams', icon: '📊', label: 'Điểm TB 10 Đề Chuẩn Gần Nhất', valueText: avg10, sub: `Chụp ngày ${dateLabel}`, dateLabel, verified: true },
    { id: 'pomodoro_hours', icon: '⏱️', label: 'Giờ Tập Trung Pomodoro 9+', valueText: `${pomoHrs} giờ`, sub: 'Xác thực Active Coupling', dateLabel, verified: true },
    { id: 'max_streak', icon: '🔥', label: 'Kỷ Lục Chuỗi Streak Thực', valueText: `${Math.max(Number(b.max_streak_real || 1), Number(user.streak || 1))} ngày`, sub: '>= 40 ĐXH/ngày', dateLabel, verified: true },
    { id: 'flashcards_mastered', icon: '🃏', label: 'Flashcards 3D Thuộc Làu', valueText: `${masteredFc} thẻ`, sub: 'Đã vượt Micro-Check', dateLabel, verified: true },
    { id: 'iupac_unlocked', icon: '⚗️', label: 'Bộ Sưu Tập 118 Ô IUPAC', valueText: `${(r.periodic_unlocked || [1, 6, 8]).length}/118 ô`, sub: 'Bảng Tuần Hoàn Hóa Học', dateLabel, verified: true },
    { id: 'islands_progress', icon: '🗺️', label: 'Hành Trình 7 Đảo Tri Thức', valueText: `${islandsCleared}/7 đảo (${totalStars}⭐)`, sub: 'Vượt Đảo & Cờ Vùng 🚩', dateLabel, verified: true },
    { id: 'duel_1v1_winrate', icon: '⚔️', label: 'Chiến Tích Đấu Trường 1v1', valueText: winRate1v1, sub: 'Đấu Trường Thực Chiến', dateLabel, verified: true },
    { id: 'weekly_dxh', icon: '🏆', label: 'Điểm Xếp Hạng Tuần (ĐXH)', valueText: `${Number(b.dxh_week || 0)} ĐXH`, sub: `Hệ ${b.primary_grade || '2K9'}`, dateLabel, verified: true },
    { id: 'shop_collection', icon: '🛍️', label: 'Tủ Đồ Siêu Thị 3D & Nitro', valueText: `${(r.inventory || []).length}/64 món`, sub: 'Trang phục, Aura & Linh thú', dateLabel, verified: true }
  ];
}

function buildDefaultMilestones(user, now = new Date()) {
  const all = buildAvailableMilestones(user, now);
  return all.slice(0, 3);
}

// Áp dụng Smart Preset 1-chạm (R3)
function applySmartPreset(user, presetId, now = new Date()) {
  ensureBxhUserState(user, now);
  const preset = SMART_PRESETS_DEF.find(p => p.id === presetId);
  if (!preset) return { ok: false, message: 'Không tìm thấy Smart Preset này.' };

  const r = user.rpg;
  const badges = r.badges_24 || [];
  const unlockedMap = new Map(badges.filter(x => x.unlocked).map(x => [x.id, x]));
  const topUnlocked = badges.filter(x => x.unlocked).sort((a, b) => b.tierIndex - a.tierIndex || b.count - a.count);

  let hero = preset.preferredHero.find(id => unlockedMap.has(id)) || topUnlocked[0]?.id || null;
  const showcase = [];
  for (const id of preset.preferredShowcase) {
    if (unlockedMap.has(id) && !showcase.includes(id)) showcase.push(id);
    if (showcase.length >= r.showcase.unlocked_slots) break;
  }
  for (const b of topUnlocked) {
    if (showcase.length >= r.showcase.unlocked_slots) break;
    if (!showcase.includes(b.id)) showcase.push(b.id);
  }

  const allMilestones = buildAvailableMilestones(user, now);
  const pickedMilestones = preset.preferredMilestones
    .map(id => allMilestones.find(m => m.id === id))
    .filter(Boolean)
    .slice(0, 3);

  r.showcase.hero_badge = hero;
  r.showcase.showcase_badges = showcase;
  if (pickedMilestones.length === 3) {
    r.showcase.milestone_cards = pickedMilestones;
  }
  if (presetId === 'iupac_collector') {
    const unlockedZ = r.periodic_unlocked || [1, 6, 8];
    r.showcase.featured_iupac = unlockedZ[unlockedZ.length - 1] || 8;
  }
  // Smart Preset 4 (Top Tuần Rực Rỡ): tự động đề xuất gắn Khung/Nền/Aura tuần 7 ngày đang có và lưu previous_permanent_id để hoàn nguyên
  if (presetId === 'weekly_top_glow' && r.temp_items && typeof r.temp_items === 'object') {
    const nowMs = now.getTime();
    for (const [itemId, meta] of Object.entries(r.temp_items)) {
      if (meta && Number(meta.expires_at || 0) > nowMs && meta.category) {
        if (!meta.previous_permanent_id && r.equipped?.[meta.category] && r.equipped[meta.category] !== itemId) {
          meta.previous_permanent_id = r.equipped[meta.category];
        }
        r.equipped[meta.category] = itemId;
      }
    }
  }
  r.showcase.active_preset = presetId;

  return {
    ok: true,
    preset,
    showcase: r.showcase,
    message: `✨ Đã áp dụng Smart Preset "${preset.name}" cho Tủ Kính Thành Tựu & Thẻ .PNG!`
  };
}

// So sánh Tie-Breaker 5 bậc khi đồng điểm ĐXH Tuần (R1 Mục 3.3)
function compareWeeklyTieBreaker(a, b) {
  // 0. Điểm ĐXH Tuần cao hơn
  if (b.dxh_week !== a.dxh_week) return b.dxh_week - a.dxh_week;

  // 1. Điểm TB các bài Đề chuẩn (45-90p) hợp lệ trong tuần (bắt buộc >= 2 đề chuẩn xếp trên < 2 đề chuẩn)
  const aHas2Std = (a.std_exams_week_count || 0) >= 2 ? 1 : 0;
  const bHas2Std = (b.std_exams_week_count || 0) >= 2 ? 1 : 0;
  if (bHas2Std !== aHas2Std) return bHas2Std - aHas2Std;
  if (aHas2Std && bHas2Std && b.std_exams_week_avg !== a.std_exams_week_avg) {
    return b.std_exams_week_avg - a.std_exams_week_avg;
  }

  // 2. Số Ngày Học Hợp Lệ (>= 40 ĐXH/ngày) trong tuần nhiều hơn
  if ((b.valid_days_count || 0) !== (a.valid_days_count || 0)) {
    return (b.valid_days_count || 0) - (a.valid_days_count || 0);
  }

  // 3. Tỷ lệ trả lời đúng (Accuracy %) tổng hợp tuần cao hơn
  if ((b.weekly_accuracy || 0) !== (a.weekly_accuracy || 0)) {
    return (b.weekly_accuracy || 0) - (a.weekly_accuracy || 0);
  }

  // 4. Thời điểm chạm mốc ĐXH Tuần hiện tại sớm hơn
  const aReached = String(a.dxh_reached_at || '9999');
  const bReached = String(b.dxh_reached_at || '9999');
  if (aReached !== bReached) return aReached.localeCompare(bReached);

  // 5. Thời điểm đạt Ngày Hợp Lệ đầu tiên sớm hơn / Mã SBD đăng ký sớm hơn
  const aFirst = String(a.first_valid_day_at || a.created_at || '9999');
  const bFirst = String(b.first_valid_day_at || b.created_at || '9999');
  if (aFirst !== bFirst) return aFirst.localeCompare(bFirst);

  return String(a.sbd || '').localeCompare(String(b.sbd || ''));
}

// Tính quy tắc Thăng/Trụ/Giáng hạng linh hoạt theo sĩ số Bảng Đấu N người (bao gồm N < 15)
function evaluateDivisionStanding(rank, totalInGroup, tierId, dxhWeek, hasShield = false) {
  const N = Math.max(1, Number(totalInGroup || 1));
  const r = Math.max(1, Number(rank || 1));
  const dxh = Math.max(0, Number(dxhWeek || 0));

  if (dxh === 0) {
    return { zone: 'hibernation', label: '💤 Ngủ Đông (Giữ hạng)', promoted: false, demoted: false };
  }

  // Trường hợp N < 6 người: Không thăng/giáng hạng tự động
  if (N < 6) {
    return {
      zone: r <= 3 && dxh >= 300 ? 'podium_hold' : 'safe',
      label: r <= 3 && dxh >= 300 ? '🏅 Top Bảng (Giữ hạng do bảng < 6 người)' : '🛡️ Trụ hạng an toàn',
      promoted: false,
      demoted: false
    };
  }

  // Trường hợp 6 <= N <= 14 người: max(3, round(N * 0.23)) -> Top 1-3 (>=300 ĐXH) LUÔN thăng hạng
  if (N <= 14) {
    const demoteCount = (N >= 8 && tierId !== 'bronze') ? Math.floor(N * 0.20) : 0;
    const demoteStartRank = demoteCount > 0 ? (N - demoteCount + 1) : 999;

    if (r <= 3 && dxh >= 300) {
      return {
        zone: 'podium',
        label: tierId === 'legend' ? '👑 Đỉnh Huyền Thoại' : '🚀 Vùng Podium • Thăng 1 Hạng',
        promoted: tierId !== 'legend',
        demoted: false
      };
    }
    if (r >= demoteStartRank) {
      if (hasShield) {
        return { zone: 'shielded', label: '🛡️ Được Khiên Bảo Vệ Hạng', promoted: false, demoted: false };
      }
      return { zone: 'danger', label: '⚠️ Vùng Nguy Hiểm • Giáng 1 Hạng', promoted: false, demoted: true };
    }
    const maxPromote = Math.max(3, Math.round(N * 0.23));
    if (r <= maxPromote && dxh >= 250 && r < demoteStartRank) {
      return {
        zone: 'promote',
        label: tierId === 'legend' ? '👑 Trụ Hạng Huyền Thoại' : '⬆️ Vùng Thăng Hạng (+1 Hạng)',
        promoted: tierId !== 'legend',
        demoted: false
      };
    }
    return { zone: 'safe', label: '✓ Vùng An Toàn (Trụ hạng)', promoted: false, demoted: false };
  }

  // Bảng tiêu chuẩn 15 - 30 người
  const maxPromoteRank = tierId === 'diamond' ? 5 : 7;
  if (r <= 3 && dxh >= 300) {
    return {
      zone: 'podium',
      label: tierId === 'legend' ? '👑 Bục Vinh Quang Huyền Thoại' : '👑 Bục Podium • Thăng 1 Hạng',
      promoted: tierId !== 'legend',
      demoted: false
    };
  }
  if (r >= 4 && r <= maxPromoteRank && dxh >= 250) {
    return {
      zone: 'promote',
      label: tierId === 'legend' ? '👑 Tinh Anh Huyền Thoại' : '⬆️ Vùng Thăng Hạng (+1 Hạng)',
      promoted: tierId !== 'legend',
      demoted: false
    };
  }
  if (r >= 25 && tierId !== 'bronze') {
    if (hasShield) {
      return { zone: 'shielded', label: '🛡️ Được Khiên Bảo Vệ Hạng', promoted: false, demoted: false };
    }
    return { zone: 'danger', label: '⚠️ Vùng Nguy Hiểm (Top 25–30) • Giáng 1 Hạng', promoted: false, demoted: true };
  }
  return { zone: 'safe', label: '✓ Vùng An Toàn (Trụ hạng)', promoted: false, demoted: false };
}

// Tạo gợi ý hành động cụ thể từ khoảng cách ĐXH Tuần (R2 So sánh 1-chạm & R4 Rival Pin)
function buildActionableDxhNudge(targetName, gapDxh) {
  const gap = Math.max(1, Math.round(Number(gapDxh || 15)));
  if (gap <= 25) {
    return `Bạn chỉ còn kém ${targetName} đúng ${gap} ĐXH Tuần — hoàn thành ngay 1 phiên Pomodoro 9+ 25 phút (+20 ĐXH) hoặc xem 1 Video bài giảng (+25 ĐXH) để vượt mặt!`;
  }
  if (gap <= 45) {
    return `Bạn đang kém ${targetName} đúng ${gap} ĐXH Tuần — ôn ngay 5 thẻ Flashcards 3D (+40 ĐXH) hoặc 1 phiên Pomodoro 9+ 50 phút (+42 ĐXH) để vượt mặt tối nay!`;
  }
  if (gap <= 90) {
    return `Khoảng cách với ${targetName} là ${gap} ĐXH Tuần — làm ngay 1 đề mini GDPT 2018 (+66→96 ĐXH) hoặc 2 phiên Pomodoro 50p (+84 ĐXH) để chiếm hạng!`;
  }
  const examsNeeded = Math.max(1, Math.ceil(gap / 135));
  return `Bạn cần thêm ${gap} ĐXH Tuần để vượt ${targetName} — hãy hoàn thành ${examsNeeded} đề chuẩn Phòng thi ảo GDPT 2018 (đạt 8.0+ = +135 ĐXH/đề) kết hợp 4/4 Nhiệm vụ ngày (+50 ĐXH)!`;
}

// Chốt sổ tuần tự động & nguyên tử (Idempotent) cho CẢ 3 Tầng:
// - Tầng 1: Bảng Đấu 30 người (tính hạng thực & sĩ số nhóm N thực)
// - Tầng 2: Toàn Hệ Top 100 (Quà Lớp 2 + Badge #4 Thủ Khoa Toàn Hệ & #5 Tinh Hoa Top 100 Hệ)
// - Tầng 3: 4 Phó Bảng Chuyên Đề (Quà Lớp 2 Top 1-3 + Badge #6, #7, #8, #13)
async function settleFinishedWeeks(redis, allUsers = [], now = new Date(), opts = {}) {
  const currentWeek = vnWeekKey(now);
  const userPrefix = opts.userPrefix || 'phuc:user:';
  const isAdminFn = typeof opts.isAdminAccount === 'function' ? opts.isAdminAccount : (u => Boolean(u?.is_admin || u?.role === 'admin'));
  const normalizeU = s => String(s || '').trim().toLowerCase();

  // Gom những học viên còn week_key cũ (< currentWeek) theo từng week_key để chốt sổ đồng bộ
  const usersByOldWeek = new Map();
  for (const u of (allUsers || [])) {
    if (!u || !u.username || u.banned || isAdminFn(u)) continue;
    const wk = u.rpg?.bxh?.week_key;
    if (!wk || wk === currentWeek) continue;
    if (!usersByOldWeek.has(wk)) usersByOldWeek.set(wk, []);
    usersByOldWeek.get(wk).push(u);
  }

  if (usersByOldWeek.size === 0) {
    return { settledWeeks: [], settledUsers: 0 };
  }

  const settledWeeks = [];
  let totalSettledUsers = 0;
  let inProgress = false;
  const nowMs = now.getTime();
  const top100Priority = { 'Thủ Khoa Toàn Hệ': 6, 'Á Khoa': 5, 'Tam Khôi': 4, 'Top 10': 3, 'Top 50': 2, 'Top 100': 1 };
  const parseStoredObj = val => {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try { return JSON.parse(String(val)); } catch { return null; }
  };

  for (const [oldWeek, groupUsers] of usersByOldWeek.entries()) {
    const lockKey = `phuc:bxh:settled_week:${oldWeek}`;
    const hasRedisSet = Boolean(redis && typeof redis.set === 'function');
    const hasRedisGet = Boolean(redis && typeof redis.get === 'function');
    const canAwardLayer2 = hasRedisSet
      ? !!(await redis.set(lockKey, JSON.stringify({
        week: oldWeek,
        status: 'in_progress',
        started_at: now.toISOString(),
        count: groupUsers.length
      }), { nx: true, ex: 60 * 60 * 24 * 120 }).catch(() => null))
      : true;

    // Nếu worker khác (VD: Vercel Cron) đang chạy chốt sổ tuần này, không ghi đè dữ liệu Redis của học viên
    if (!canAwardLayer2 && hasRedisGet) {
      const existingLock = parseStoredObj(await redis.get(lockKey).catch(() => null));
      const startedMs = existingLock?.started_at ? Date.parse(existingLock.started_at) : NaN;
      if (existingLock?.status === 'in_progress' && Number.isFinite(startedMs) && (Date.now() - startedMs) < 60000) {
        inProgress = true;
        continue;
      }
    }

    // 1. Tính bảng xếp hạng thật cho từng học viên từ dữ liệu tuần cũ TRƯỚC khi rollover
    const metricsMap = new Map();
    const byGrade = new Map();
    for (const u of groupUsers) {
      const b = u.rpg?.bxh || {};
      const ws = b.weekly_stats || {};
      const grade = normalizeGrade(b.primary_grade || u.settings?.preferred_grade || '2K9');
      const divTier = b.division_by_grade?.[grade] || 'bronze';
      const dxhWeek = Math.max(0, Number(b.dxh_week || 0));
      const stdScores = Array.isArray(ws.std_exam_scores) ? ws.std_exam_scores : [];
      const stdCount = stdScores.length;
      const stdAvg = stdCount ? Number((stdScores.reduce((s, it) => s + Number(it.score || 0), 0) / stdCount).toFixed(2)) : 0;
      const top8Sum = Number(stdScores.slice().sort((a, x) => x.score - a.score).slice(0, 8).reduce((s, it) => s + Number(it.score || 0), 0).toFixed(2));
      const wkQ = Number(ws.questions_week || 0);
      const wkC = Number(ws.correct_week || 0);
      const wkAcc = wkQ > 0 ? Math.round((wkC / wkQ) * 100) : 0;
      const duelEloGain = Math.max(0, Number(ws.duel_1v1_elo || 1000) - 1000);
      const arenaScore = (ws.contest_9plus_done ? 120 + Number(ws.contest_9plus_bonus || 0) : 0) + Number(ws.duel_1v1_wins || 0) * 45 + duelEloGain;
      const arenaEligible = Boolean(ws.contest_9plus_done) || Number(ws.duel_1v1_matches || 0) >= 3;
      const exam2018Eligible = stdCount >= 3 && stdAvg >= 6.5;
      const pomoMins = Number(ws.pomodoro_verified_mins_week || 0);
      const pomoSess = Number(ws.pomodoro_sessions_week || 0);
      const days4 = Number(ws.daily_4of4_days_week || 0);
      const pomoScore = pomoMins + days4 * 50;
      const pomoEligible = pomoSess >= 6 && pomoMins >= 150 && days4 >= 3;
      const prev2 = (b.prev_weeks_dxh || []).slice(0, 2);
      const avgPrev2 = prev2.length ? prev2.reduce((s, it) => s + Number(it.dxh || 0), 0) / prev2.length : 0;
      const wasHib2 = Boolean(b.hibernation?.revival_active) || (prev2.length >= 2 && prev2.every(it => Number(it.dxh || 0) === 0));
      const surgeDenom = Math.max(avgPrev2, 300);
      const surgePct = dxhWeek > surgeDenom && wkAcc > 0 ? Math.round(((dxhWeek - surgeDenom) / surgeDenom) * wkAcc) : 0;
      const surgeEligible = dxhWeek >= 400 && !wasHib2 && wkAcc > 0;

      const rec = {
        user: u,
        username: normalizeU(u.username),
        sbd: u.rpg?.sbd || '',
        created_at: u.created_at || '',
        grade,
        divTier,
        cohort: b.cohort || 'new_return',
        joined_after_sat18: Boolean(b.joined_after_sat18),
        dxh_week: dxhWeek,
        std_exams_week_count: stdCount,
        std_exams_week_avg: stdAvg,
        top8_std_exams_sum: top8Sum,
        valid_days_count: Array.isArray(b.valid_days_week) ? b.valid_days_week.length : 0,
        weekly_accuracy: wkAcc,
        dxh_reached_at: b.dxh_reached_at || u.last_active || u.created_at || '',
        first_valid_day_at: b.first_valid_day_at || u.created_at || '',
        arenaScore,
        arenaEligible,
        exam2018Eligible,
        pomoScore,
        pomoEligible,
        surgePct,
        surgeEligible
      };
      metricsMap.set(rec.username, rec);
      if (!byGrade.has(grade)) byGrade.set(grade, []);
      byGrade.get(grade).push(rec);
    }

    // 2. Gán hạng Tầng 1 thực tế cho từng bảng đấu (Grade × Division × Cohort chunks of 30)
    const layer2AwardsByUser = new Map();
    const pushL2 = (uname, item) => {
      if (!layer2AwardsByUser.has(uname)) layer2AwardsByUser.set(uname, []);
      layer2AwardsByUser.get(uname).push(item);
    };

    for (const [grade, gList] of byGrade.entries()) {
      // Tầng 1: nhóm active (> 0 ĐXH, không phải Warmup Overflow)
      const byDiv = new Map();
      for (const rec of gList) {
        if (rec.dxh_week <= 0 || rec.joined_after_sat18) continue;
        if (!byDiv.has(rec.divTier)) byDiv.set(rec.divTier, []);
        byDiv.get(rec.divTier).push(rec);
      }
      for (const divList of byDiv.values()) {
        divList.sort(compareWeeklyTieBreaker);
        for (let i = 0; i < divList.length; i += 30) {
          const chunk = divList.slice(i, i + 30);
          chunk.forEach((rec, idx) => {
            rec.user.rpg.bxh.current_division_rank = idx + 1;
            rec.user.rpg.bxh.current_division_total = chunk.length;
          });
        }
      }

      if (canAwardLayer2) {
        // Tầng 2: Toàn Hệ Top 100 (chỉ xét học viên có học thật dxh_week >= 150 để chống nhận Top 100 với 0 ĐXH)
        const sysList = gList.filter(r => r.dxh_week >= 150).sort(compareWeeklyTieBreaker).slice(0, 100);
        sysList.forEach((rec, idx) => {
          const rw = computeSystemTop100Reward(idx + 1, grade);
          if (rw) pushL2(rec.username, { kind: 'system_top100', rank: idx + 1, grade, reward: rw });
        });

        // Tầng 3: 4 Phó Bảng Chuyên Đề
        const sub1 = gList.filter(r => r.arenaEligible).sort((a, x) => x.arenaScore - a.arenaScore || compareWeeklyTieBreaker(a, x)).slice(0, 3);
        sub1.forEach((rec, idx) => {
          const rw = computeSubLeaderboardReward('arena_9plus', idx + 1);
          if (rw) pushL2(rec.username, { kind: 'sub_board', sub_id: 'arena_9plus', rank: idx + 1, grade, reward: rw });
        });

        const sub2 = gList.filter(r => r.exam2018Eligible).sort((a, x) => x.top8_std_exams_sum - a.top8_std_exams_sum || x.std_exams_week_avg - a.std_exams_week_avg).slice(0, 3);
        sub2.forEach((rec, idx) => {
          const rw = computeSubLeaderboardReward('exam_gdpt2018', idx + 1);
          if (rw) pushL2(rec.username, { kind: 'sub_board', sub_id: 'exam_gdpt2018', rank: idx + 1, grade, reward: rw });
        });

        const sub3 = gList.filter(r => r.pomoEligible).sort((a, x) => x.pomoScore - a.pomoScore || compareWeeklyTieBreaker(a, x)).slice(0, 3);
        sub3.forEach((rec, idx) => {
          const rw = computeSubLeaderboardReward('pomodoro_discipline', idx + 1);
          if (rw) pushL2(rec.username, { kind: 'sub_board', sub_id: 'pomodoro_discipline', rank: idx + 1, grade, reward: rw });
        });

        const sub4 = gList.filter(r => r.surgeEligible && r.surgePct > 0).sort((a, x) => x.surgePct - a.surgePct || compareWeeklyTieBreaker(a, x)).slice(0, 10);
        sub4.forEach((rec, idx) => {
          const rw = computeSubLeaderboardReward('weekly_surge', idx + 1);
          if (rw) pushL2(rec.username, { kind: 'sub_board', sub_id: 'weekly_surge', rank: idx + 1, grade, reward: rw });
        });
      }
    }

    // 3. Thực hiện rollover Tầng 1 (ensureBxhUserState) + cộng quà Lớp 2 + lưu Redis (kèm khóa nguyên tử từng học viên chống ghi đè đồng thời)
    let weekSettledCount = 0;
    for (const u of groupUsers) {
      const normU = normalizeU(u.username);
      if (hasRedisSet) {
        if (!canAwardLayer2 && hasRedisGet) {
          const fresh = parseStoredObj(await redis.get(`${userPrefix}${normU}`).catch(() => null));
          if (fresh && fresh.rpg?.bxh?.week_key && fresh.rpg.bxh.week_key !== oldWeek) {
            Object.assign(u, fresh);
            continue;
          }
        }
        const userLockKey = `phuc:bxh:settled_user:${oldWeek}:${normU}`;
        const gotUserLock = !!(await redis.set(userLockKey, '1', { nx: true, ex: 60 * 60 * 24 * 120 }).catch(() => null));
        if (!gotUserLock) {
          if (hasRedisGet) {
            const fresh = parseStoredObj(await redis.get(`${userPrefix}${normU}`).catch(() => null));
            if (fresh && fresh.rpg?.bxh?.week_key && fresh.rpg.bxh.week_key !== oldWeek) {
              Object.assign(u, fresh);
            }
          }
          continue;
        }
      }
      ensureBxhUserState(u, now);
      const r = u.rpg;
      const b = r.bxh;
      const soc = r.social;
      const l2List = layer2AwardsByUser.get(normU) || [];

      for (const entry of l2List) {
        const rw = entry.reward;
        if (!rw) continue;
        r.gold = Math.max(0, Number(r.gold || 0)) + Number(rw.gold || 0);
        r.diamonds = Math.max(0, Number(r.diamonds || 0)) + Number(rw.diamonds || 0);
        r.periodic_tickets = Math.max(0, Number(r.periodic_tickets || 0)) + Number(rw.iupac_tickets || 0);
        r.shop_shards = Math.max(0, Number(r.shop_shards || 0)) + Number(rw.shop_shards || 0);
        if (Number(rw.island_flags || 0) > 0) {
          soc.island_flags_total = Number(soc.island_flags_total || 0) + Number(rw.island_flags || 0);
        }
        if (rw.temp_title) {
          const nextTitlePrio = entry.kind === 'system_top100'
            ? (entry.rank === 1 ? 100 : 90)
            : 60;
          const curTitlePrio = (r.temp_title && Number(r.temp_title.expires_at || 0) > nowMs) ? Number(r.temp_title.priority || 0) : 0;
          if (nextTitlePrio >= curTitlePrio) {
            r.temp_title = { text: rw.temp_title, priority: nextTitlePrio, expires_at: nowMs + 7 * 86400000 };
          }
        }
        if (entry.kind === 'system_top100') {
          for (const bid of (rw.badge_ids || [])) {
            b.badge_counters[bid] = Number(b.badge_counters[bid] || 0) + 1;
          }
          const prevPrio = top100Priority[b.highest_top100_label] || 0;
          const nextPrio = top100Priority[rw.tier_label] || 0;
          if (nextPrio >= prevPrio) b.highest_top100_label = rw.tier_label;
          if (entry.rank === 1) {
            b.top3_system_count = Number(b.top3_system_count || 0) + 1;
            const valCnt = Number(b.badge_counters['badge-system-valedictorian'] || 1);
            for (const cDef of (rw.temp_cosmetics || [])) {
              const cnt = cDef.perm_after === 4 ? valCnt : b.top3_system_count;
              grantTempOrPermCosmetic(u, cDef, cnt, now);
            }
          } else if (entry.rank <= 3) {
            b.top3_system_count = Number(b.top3_system_count || 0) + 1;
            for (const cDef of (rw.temp_cosmetics || [])) {
              grantTempOrPermCosmetic(u, cDef, b.top3_system_count, now);
            }
          }
        } else if (entry.kind === 'sub_board') {
          if (entry.sub_id === 'pomodoro_discipline') {
            b.badge_counters['badge-pomodoro-sub3'] = Number(b.badge_counters['badge-pomodoro-sub3'] || 0) + 1;
          } else if (rw.badge_id) {
            b.badge_counters[rw.badge_id] = Number(b.badge_counters[rw.badge_id] || 0) + 1;
          }
        }
        if (b.last_weekly_settlement && b.last_weekly_settlement.week_key === oldWeek) {
          if (!Array.isArray(b.last_weekly_settlement.layer2_rewards)) b.last_weekly_settlement.layer2_rewards = [];
          b.last_weekly_settlement.layer2_rewards.push({
            kind: entry.kind,
            sub_id: entry.sub_id || null,
            rank: entry.rank,
            label: entry.kind === 'system_top100' ? `Toàn Hệ ${entry.grade} #${entry.rank} (${rw.tier_label})` : `Phó Bảng ${entry.sub_id} #${entry.rank}`,
            gold: Number(rw.gold || 0),
            diamonds: Number(rw.diamonds || 0),
            iupac_tickets: Number(rw.iupac_tickets || 0),
            shop_shards: Number(rw.shop_shards || 0),
            temp_title: rw.temp_title || null
          });
        }
      }

      syncUserBadgesAndShowcase(u, now);
      if (hasRedisSet) {
        await redis.set(`${userPrefix}${normU}`, u).catch(() => {});
      }
      weekSettledCount += 1;
      totalSettledUsers += 1;
    }

    if (canAwardLayer2 && hasRedisSet) {
      await redis.set(lockKey, JSON.stringify({
        week: oldWeek,
        status: 'done',
        settled_at: now.toISOString(),
        count: weekSettledCount
      }), { ex: 60 * 60 * 24 * 120 }).catch(() => {});
    }

    if (weekSettledCount > 0) {
      settledWeeks.push(oldWeek);
    }
  }

  return { settledWeeks, settledUsers: totalSettledUsers, inProgress };
}

module.exports = {
  GRADES_5,
  GRADE_IDS,
  DIVISION_TIERS,
  DIVISION_MAP,
  DIVISION_REWARD_TABLE,
  WEEKLY_MILESTONE_CHESTS,
  SUB_LEADERBOARDS_DEF,
  BADGES_24,
  BADGE_MAP,
  SMART_PRESETS_DEF,
  CHEER_PRESET_MESSAGES,
  POMODORO_STATUS_TAGS,
  normalizeGrade,
  roundHalfUp,
  computeDivisionReward,
  computeSystemTop100Reward,
  computeSubLeaderboardReward,
  pickRotatingTop1Cosmetic,
  validateProactiveContent,
  vnDateKey,
  vnWeekKey,
  weeksBetweenKeys,
  isWeekendVn,
  isAfterSaturday18Vn,
  isBeforeTuesdayEndVn,
  getGlobalDailyDxhCap,
  getExamCountdownInfo,
  computeBadgeTierInfo,
  getInitialTierByXp,
  generatePublicAnonSbd,
  formatVisibleSchool,
  grantTempOrPermCosmetic,
  ensureBxhUserState,
  grantWeeklyDxh,
  recordExamDxhAndStats,
  syncUserBadgesAndShowcase,
  buildAvailableMilestones,
  buildDefaultMilestones,
  applySmartPreset,
  compareWeeklyTieBreaker,
  evaluateDivisionStanding,
  buildActionableDxhNudge,
  settleFinishedWeeks
};
