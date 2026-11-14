/* ============================================================================
 * HỌC CÙNG PHÚC K9 — RPG STUDY ENGINE, SHOP, SRS, PERIODIC GACHA & JOURNEY
 * Clean-room modular backend state & economy manager backed by Upstash Redis
 * ============================================================================ */

const CATALOG = [
  // OUTFITS / CHARACTER ICONS
  { id: 'outfit-scholar', category: 'outfit', name: 'Áo Blouse Thủ Khoa', icon: '🧑‍🎓', desc: 'Trang phục chuẩn sĩ tử K9 quyết tâm 27+ điểm.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'outfit-chemist', category: 'outfit', name: 'Nhà Giả Kim Phòng Lab', icon: '🧑‍🔬', desc: 'Áo choàng thí nghiệm 118 nguyên tố IUPAC.', currency: 'gold', price: 150, rarity: 'rare' },
  { id: 'outfit-wizard', category: 'outfit', name: 'Pháp Sư Giải Tích', icon: '🧙‍♂️', desc: 'Triệu hồi công thức Tích phân & Số phức trong 3 giây.', currency: 'gold', price: 240, rarity: 'epic' },
  { id: 'outfit-astronaut', category: 'outfit', name: 'Phi Hành Gia Bách Khoa', icon: '👩‍🚀', desc: 'Trang phục vượt giới hạn vũ trụ tri thức THPT.', currency: 'gold', price: 360, rarity: 'epic' },
  { id: 'outfit-ninja', category: 'outfit', name: 'Ninja Tốc Độ Đề Thi', icon: '🥷', desc: 'Tăng tinh thần bấm máy Casio siêu tốc 50 phút.', currency: 'diamonds', price: 5, rarity: 'legendary' },
  { id: 'outfit-hero', category: 'outfit', name: 'Chiến Thần Sĩ Tử 2K9', icon: '🦸', desc: 'Bộ giáp hào quang săn trọn 10 điểm môn thi chính.', currency: 'diamonds', price: 9, rarity: 'legendary' },

  // AVATAR FRAMES
  { id: 'frame-bronze', category: 'frame', name: 'Khung Tân Binh Đồng', icon: '🥉', cssClass: 'pk9-frame-bronze', desc: 'Viền đồng cổ điển dành cho người mới bắt đầu.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'frame-emerald', category: 'frame', name: 'Khung Ngọc Lục Bảo', icon: '❇️', cssClass: 'pk9-frame-emerald', desc: 'Ánh xanh tập trung cao độ khi ôn tập.', currency: 'gold', price: 120, rarity: 'rare' },
  { id: 'frame-neon', category: 'frame', name: 'Khung Neon Cyber K9', icon: '💠', cssClass: 'pk9-frame-neon', desc: 'Viền neon phát sáng nổi bật trên mọi bảng xếp hạng.', currency: 'gold', price: 220, rarity: 'epic' },
  { id: 'frame-gold', category: 'frame', name: 'Khung Hoàng Kim Thủ Khoa', icon: '👑', cssClass: 'pk9-frame-gold', desc: 'Hào quang vàng rực vinh danh TOP đầu trường.', currency: 'gold', price: 380, rarity: 'epic' },
  { id: 'frame-phoenix', category: 'frame', name: 'Khung Phượng Hoàng Lửa', icon: '🔥', cssClass: 'pk9-frame-phoenix', desc: 'Ngọn lửa chuỗi ngày chăm chỉ không tắt.', currency: 'diamonds', price: 6, rarity: 'legendary' },
  { id: 'frame-galaxy', category: 'frame', name: 'Khung Thiên Hà Kim Cương', icon: '🌌', cssClass: 'pk9-frame-galaxy', desc: 'Viền tinh tú cao cấp nhất hệ sinh thái Phúc K9.', currency: 'diamonds', price: 12, rarity: 'mythic' },

  // PETS
  { id: 'pet-owl', category: 'pet', name: 'Cú Mèo Thức Khuya', icon: '🦉', desc: 'Đồng hành ôn đề khuya không ngủ gật.', currency: 'gold', price: 180, rarity: 'rare' },
  { id: 'pet-fox', category: 'pet', name: 'Cáo Tuyết Thông Thái', icon: '🦊', desc: 'Nhanh nhẹn né bẫy trắc nghiệm Đúng/Sai.', currency: 'gold', price: 280, rarity: 'epic' },
  { id: 'pet-cat', category: 'pet', name: 'Mèo Casio Thần Tài', icon: '🐱', desc: 'Gọi may mắn mỗi lần bấm phím CALC & SOLVE.', currency: 'gold', price: 320, rarity: 'epic' },
  { id: 'pet-dragon', category: 'pet', name: 'Rồng Lửa 9+ Môn', icon: '🐉', desc: 'Linh vật huyền thoại của cao thủ ĐGNL & THPT.', currency: 'diamonds', price: 8, rarity: 'legendary' },
  { id: 'pet-unicorn', category: 'pet', name: 'Kỳ Lân Thủ Khoa', icon: '🦄', desc: 'Biểu tượng bứt phá hạng #1 Bảng Vàng.', currency: 'diamonds', price: 10, rarity: 'legendary' },

  // TITLES (DANH HIỆU)
  { id: 'title-tanbinh', category: 'title', name: 'Tân Binh Bứt Phá', icon: '⚡', desc: 'Danh hiệu khởi đầu hành trình 9+.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'title-ongcham', category: 'title', name: 'Ong Chăm Cày Đề', icon: '🐝', desc: 'Kiên trì luyện đề mỗi tối không bỏ cuộc.', currency: 'gold', price: 140, rarity: 'rare' },
  { id: 'title-hoaba', category: 'title', name: 'Hóa Bá 118 Nguyên Tố', icon: '⚗️', desc: 'Thuộc làu phản ứng & bảng tuần hoàn IUPAC.', currency: 'gold', price: 260, rarity: 'epic' },
  { id: 'title-satthu', category: 'title', name: 'Sát Thủ Trắc Nghiệm', icon: '🎯', desc: 'Khoanh đâu trúng đó, trả lời ngắn chuẩn từng dấu phẩy.', currency: 'gold', price: 340, rarity: 'epic' },
  { id: 'title-thukhoa', category: 'title', name: 'Ứng Cử Viên Thủ Khoa', icon: '🏆', desc: 'Danh hiệu danh giá hiển thị nổi bật trên BXH.', currency: 'diamonds', price: 7, rarity: 'legendary' },

  // CARD BACKGROUNDS (NỀN THẺ HỌC VIÊN QR)
  { id: 'cardbg-ocean', category: 'cardbg', name: 'Nền Đại Dương Xanh', icon: '🌊', cssClass: 'pk9-cardbg-ocean', desc: 'Thẻ học viên xanh dương chuẩn thương hiệu Phúc K9.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'cardbg-emerald', category: 'cardbg', name: 'Nền Rừng Ngọc Bích', icon: '🌿', cssClass: 'pk9-cardbg-emerald', desc: 'Sắc xanh mát mắt đầy sức sống.', currency: 'gold', price: 140, rarity: 'rare' },
  { id: 'cardbg-sunset', category: 'cardbg', name: 'Nền Hoàng Hôn Chinh Phục', icon: '🌅', cssClass: 'pk9-cardbg-sunset', desc: 'Chuyển sắc cam vàng rực rỡ trên Thẻ QR.', currency: 'gold', price: 220, rarity: 'epic' },
  { id: 'cardbg-cyber', category: 'cardbg', name: 'Nền Tím Ngân Hà', icon: '🔮', cssClass: 'pk9-cardbg-cyber', desc: 'Phong cách tương lai neon cho thẻ học viên.', currency: 'diamonds', price: 4, rarity: 'legendary' },

  // CONSUMABLES (VẬT PHẨM BỔ TRỢ)
  { id: 'item-ticket', category: 'consumable', name: 'Vé Chọn Nguyên Tố', icon: '🎫', desc: 'Dùng mở đích danh 1 ô nguyên tố bất kì trong Bảng Tuần Hoàn.', currency: 'gold', price: 180, rarity: 'rare', consumable: true },
  { id: 'item-gold-charm', category: 'consumable', name: 'Bùa Vàng (+25% Vàng · 5 lượt)', icon: '🧿', desc: 'Tăng 25% Vàng nhận được trong 5 lượt làm đề/nhiệm vụ kế tiếp.', currency: 'gold', price: 160, rarity: 'epic', consumable: true },
  { id: 'item-xp-boost', category: 'consumable', name: 'Vé Nhân Đôi EXP (3 lượt)', icon: '🚀', desc: 'Nhân đôi EXP cộng BXH cho 3 lượt luyện tập hoặc nộp đề.', currency: 'diamonds', price: 3, rarity: 'legendary', consumable: true }
];

const CATALOG_MAP = new Map(CATALOG.map(it => [it.id, it]));

const RANK_TIERS = [
  { id: 'bronze', name: 'Bậc Đồng', minXp: 0, icon: '🥉', color: '#b45309' },
  { id: 'silver', name: 'Bậc Bạc', minXp: 500, icon: '🥈', color: '#475569' },
  { id: 'gold', name: 'Bậc Vàng', minXp: 1500, icon: '🥇', color: '#d97706' },
  { id: 'platinum', name: 'Bậc Bạch Kim', minXp: 3500, icon: '💠', color: '#0284c7' },
  { id: 'diamond', name: 'Bậc Kim Cương', minXp: 7000, icon: '💎', color: '#7c3aed' },
  { id: 'legend', name: 'Bậc Huyền Thoại', minXp: 13000, icon: '👑', color: '#e11d48' }
];

const DAILY_MISSIONS_DEF = [
  { id: 'practice_2', title: 'Hoàn thành 2 lượt Luyện Nhiệm Vụ', target: 2, gold: 30, xp: 15, diamonds: 0, actionHint: 'missions' },
  { id: 'srs_5', title: 'Ôn tập 5 câu trong Sổ Ôn Tập', target: 5, gold: 25, xp: 15, diamonds: 0, actionHint: 'missions' },
  { id: 'exam_1', title: 'Nộp 1 bài trong Kho Luyện Đề', target: 1, gold: 50, xp: 20, diamonds: 1, actionHint: 'exams' },
  { id: 'study_1', title: 'Học 1 Bài giảng Video hoặc Flashcard', target: 1, gold: 20, xp: 10, diamonds: 0, actionHint: 'lectures' }
];

function vnDateKey(d = new Date()) {
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const y = vn.getUTCFullYear();
  const m = String(vn.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vn.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function vnWeekKey(d = new Date()) {
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const date = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function getRankTier(xp = 0) {
  const val = Math.max(0, Number(xp || 0));
  let cur = RANK_TIERS[0];
  let next = RANK_TIERS[1] || null;
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (val >= RANK_TIERS[i].minXp) {
      cur = RANK_TIERS[i];
      next = RANK_TIERS[i + 1] || null;
    }
  }
  return {
    ...cur,
    nextTier: next ? { ...next, remainingXp: Math.max(0, next.minXp - val) } : null
  };
}

function defaultInventoryIds() {
  return CATALOG.filter(i => i.freeStarter).map(i => i.id);
}

function ensureUserRpgState(user, now = new Date()) {
  const today = vnDateKey(now);
  if (!user.rpg || typeof user.rpg !== 'object') {
    user.rpg = {};
  }
  const r = user.rpg;

  if (!Number.isFinite(Number(r.gold))) r.gold = 180;
  if (!Number.isFinite(Number(r.diamonds))) r.diamonds = 5;
  r.gold = Math.max(0, Math.round(Number(r.gold)));
  r.diamonds = Math.max(0, Math.round(Number(r.diamonds)));

  if (!Array.isArray(r.inventory)) {
    r.inventory = defaultInventoryIds();
  } else {
    const invSet = new Set(r.inventory.filter(id => CATALOG_MAP.has(id)));
    for (const fId of defaultInventoryIds()) invSet.add(fId);
    r.inventory = Array.from(invSet);
  }

  if (!r.equipped || typeof r.equipped !== 'object') r.equipped = {};
  if (!r.equipped.outfit || !r.inventory.includes(r.equipped.outfit)) r.equipped.outfit = 'outfit-scholar';
  if (!r.equipped.frame || !r.inventory.includes(r.equipped.frame)) r.equipped.frame = 'frame-bronze';
  if (!r.equipped.title || !r.inventory.includes(r.equipped.title)) r.equipped.title = 'title-tanbinh';
  if (!r.equipped.cardbg || !r.inventory.includes(r.equipped.cardbg)) r.equipped.cardbg = 'cardbg-ocean';
  if (r.equipped.pet && !r.inventory.includes(r.equipped.pet)) r.equipped.pet = null;

  if (!r.consumables || typeof r.consumables !== 'object') r.consumables = {};
  r.consumables.xp_boost = Math.max(0, Math.round(Number(r.consumables.xp_boost || 0)));
  r.consumables.gold_charm = Math.max(0, Math.round(Number(r.consumables.gold_charm || 0)));

  if (!r.checkin || typeof r.checkin !== 'object') {
    r.checkin = { last_date: null, total_days: 0, streak_box: 0 };
  }

  if (!r.daily || typeof r.daily !== 'object' || r.daily.date !== today) {
    r.daily = {
      date: today,
      practice_count: 0,
      srs_count: 0,
      exam_count: 0,
      study_count: 0,
      gold_earned_today: 0,
      xp_earned_today: 0,
      claimed: {}
    };
  }
  if (!r.daily.claimed || typeof r.daily.claimed !== 'object') r.daily.claimed = {};

  if (!['paper-white', 'paper-ivory', 'paper-softgray'].includes(r.paper_theme)) {
    r.paper_theme = 'paper-ivory';
  }
  if (typeof r.motto !== 'string') r.motto = '';
  r.motto = r.motto.slice(0, 90);

  // Student ID Card number deterministic fallback
  if (!r.sbd && user.username) {
    let h = 0;
    const uname = String(user.username);
    for (let i = 0; i < uname.length; i++) h = (h * 31 + uname.charCodeAt(i)) % 9000;
    r.sbd = `K9-${String(1000 + h)}`;
  }

  // Periodic Table state
  if (!Array.isArray(r.periodic_unlocked)) r.periodic_unlocked = [1, 6, 8]; // H, C, O starter elements
  r.periodic_unlocked = Array.from(new Set(
    r.periodic_unlocked.map(Number).filter(z => Number.isInteger(z) && z >= 1 && z <= 118)
  )).sort((a, b) => a - b);
  r.periodic_tickets = Math.max(0, Math.round(Number(r.periodic_tickets ?? 1)));
  r.periodic_milestones = Math.max(0, Math.round(Number(r.periodic_milestones ?? 0)));

  // Exam saved bookmarks
  if (!Array.isArray(r.bookmarks)) r.bookmarks = [];
  if (r.bookmarks.length > 150) r.bookmarks = r.bookmarks.slice(0, 150);

  // Spaced Repetition (SRS) map
  if (!r.srs_map || typeof r.srs_map !== 'object') r.srs_map = {};

  // Flashcards status/star map
  if (!r.flashcards_state || typeof r.flashcards_state !== 'object') r.flashcards_state = {};

  // Journey islands progress
  if (!r.journey || typeof r.journey !== 'object') r.journey = {};

  // Conquered questions counter
  if (!Number.isFinite(Number(r.questions_conquered))) r.questions_conquered = 0;

  return r;
}

function getEquippedDetails(rpg) {
  const eq = rpg?.equipped || {};
  return {
    outfit: CATALOG_MAP.get(eq.outfit) || CATALOG_MAP.get('outfit-scholar'),
    frame: CATALOG_MAP.get(eq.frame) || CATALOG_MAP.get('frame-bronze'),
    title: CATALOG_MAP.get(eq.title) || CATALOG_MAP.get('title-tanbinh'),
    pet: eq.pet ? CATALOG_MAP.get(eq.pet) || null : null,
    cardbg: CATALOG_MAP.get(eq.cardbg) || CATALOG_MAP.get('cardbg-ocean')
  };
}

function buildPublicRpgSnapshot(user) {
  const r = ensureUserRpgState(user);
  const tier = getRankTier(user.xp || 0);
  const eq = getEquippedDetails(r);
  const nowMs = Date.now();
  const srsValues = Object.values(r.srs_map || {});
  const dueCount = srsValues.filter(item => Number(item?.dueAt || 0) <= nowMs).length;
  const missions = DAILY_MISSIONS_DEF.map(m => {
    const progress = m.id === 'practice_2' ? Number(r.daily.practice_count || 0)
      : m.id === 'srs_5' ? Number(r.daily.srs_count || 0)
      : m.id === 'exam_1' ? Number(r.daily.exam_count || 0)
      : Number(r.daily.study_count || 0);
    const completed = progress >= m.target;
    const claimed = Boolean(r.daily.claimed?.[m.id]);
    return { ...m, progress: Math.min(m.target, progress), rawProgress: progress, completed, claimed };
  });

  return {
    gold: r.gold,
    diamonds: r.diamonds,
    tier,
    equipped: r.equipped,
    equipped_details: {
      outfit: eq.outfit ? { id: eq.outfit.id, name: eq.outfit.name, icon: eq.outfit.icon } : null,
      frame: eq.frame ? { id: eq.frame.id, name: eq.frame.name, icon: eq.frame.icon, cssClass: eq.frame.cssClass } : null,
      title: eq.title ? { id: eq.title.id, name: eq.title.name, icon: eq.title.icon } : null,
      pet: eq.pet ? { id: eq.pet.id, name: eq.pet.name, icon: eq.pet.icon } : null,
      cardbg: eq.cardbg ? { id: eq.cardbg.id, name: eq.cardbg.name, icon: eq.cardbg.icon, cssClass: eq.cardbg.cssClass } : null
    },
    inventory: r.inventory,
    consumables: r.consumables,
    checkin: {
      ...r.checkin,
      checked_today: r.checkin.last_date === vnDateKey()
    },
    daily: r.daily,
    missions,
    paper_theme: r.paper_theme,
    motto: r.motto,
    sbd: r.sbd,
    periodic: {
      unlocked: r.periodic_unlocked,
      unlocked_count: r.periodic_unlocked.length,
      tickets: r.periodic_tickets,
      next_ticket_in: 10 - (r.periodic_unlocked.length % 10 || 0)
    },
    bookmarks: r.bookmarks,
    srs: {
      total: srsValues.length,
      due_count: dueCount,
      items: srsValues.sort((a, b) => Number(a.dueAt || 0) - Number(b.dueAt || 0)).slice(0, 120)
    },
    flashcards_state: r.flashcards_state,
    journey: r.journey,
    questions_conquered: r.questions_conquered
  };
}

function applyRewardMultipliers(user, baseGold = 0, baseXp = 0, baseDiamonds = 0, isAdmin = false) {
  const r = ensureUserRpgState(user);
  let gold = Math.max(0, Math.round(Number(baseGold || 0)));
  let xp = isAdmin ? 0 : Math.max(0, Math.round(Number(baseXp || 0)));
  const diamonds = Math.max(0, Math.round(Number(baseDiamonds || 0)));
  let usedGoldCharm = false;
  let usedXpBoost = false;

  if (gold > 0 && r.consumables.gold_charm > 0) {
    gold = Math.round(gold * 1.25);
    r.consumables.gold_charm -= 1;
    usedGoldCharm = true;
  }
  if (xp > 0 && r.consumables.xp_boost > 0) {
    xp = xp * 2;
    r.consumables.xp_boost -= 1;
    usedXpBoost = true;
  }

  r.gold += gold;
  r.diamonds += diamonds;
  r.daily.gold_earned_today = Number(r.daily.gold_earned_today || 0) + gold;
  r.daily.xp_earned_today = Number(r.daily.xp_earned_today || 0) + xp;

  if (!isAdmin && xp > 0) {
    const wk = vnWeekKey();
    if (user.week_key !== wk) {
      user.week_key = wk;
      user.weekly_xp = 0;
    }
    user.xp = Math.max(100, Number(user.xp || 0)) + xp;
    user.weekly_xp = Math.max(0, Number(user.weekly_xp || 0)) + xp;
  }

  return { gold, xp, diamonds, usedGoldCharm, usedXpBoost };
}

function performCheckin(user, isAdmin = false) {
  const r = ensureUserRpgState(user);
  const today = vnDateKey();
  if (r.checkin.last_date === today) {
    return { ok: false, already: true, message: 'Hôm nay bạn đã mở quà điểm danh rồi! Quay lại vào ngày mai nhé.' };
  }
  r.checkin.last_date = today;
  r.checkin.total_days = Number(r.checkin.total_days || 0) + 1;
  const bonusDay = r.checkin.total_days % 7 === 0;
  const baseGold = bonusDay ? 60 : 30;
  const baseDiamonds = bonusDay ? 3 : 1;
  const baseXp = bonusDay ? 30 : 15;
  const granted = applyRewardMultipliers(user, baseGold, baseXp, baseDiamonds, isAdmin);
  return {
    ok: true,
    already: false,
    bonusDay,
    granted,
    total_days: r.checkin.total_days,
    message: bonusDay
      ? `🎉 Quà Chuỗi 7 Ngày: +${granted.gold} Vàng · +${granted.diamonds} Kim cương${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
      : `🎁 Điểm danh thành công: +${granted.gold} Vàng · +${granted.diamonds} Kim cương${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
  };
}

function claimDailyMission(user, missionId, isAdmin = false) {
  const r = ensureUserRpgState(user);
  const def = DAILY_MISSIONS_DEF.find(m => m.id === missionId);
  if (!def) return { ok: false, status: 404, message: 'Không tìm thấy nhiệm vụ này.' };
  const progress = def.id === 'practice_2' ? Number(r.daily.practice_count || 0)
    : def.id === 'srs_5' ? Number(r.daily.srs_count || 0)
    : def.id === 'exam_1' ? Number(r.daily.exam_count || 0)
    : Number(r.daily.study_count || 0);
  if (progress < def.target) {
    return { ok: false, status: 400, message: `Bạn cần hoàn thành thêm (${progress}/${def.target}) để nhận thưởng nhiệm vụ này.` };
  }
  if (r.daily.claimed[def.id]) {
    return { ok: false, status: 409, message: 'Phần thưởng nhiệm vụ hôm nay đã được nhận trước đó.' };
  }
  r.daily.claimed[def.id] = new Date().toISOString();
  const granted = applyRewardMultipliers(user, def.gold, def.xp, def.diamonds, isAdmin);
  return {
    ok: true,
    granted,
    message: `🏅 Hoàn thành "${def.title}": +${granted.gold} Vàng${granted.diamonds ? ` · +${granted.diamonds} Kim cương` : ''}${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
  };
}

function buyCatalogItem(user, itemId) {
  const r = ensureUserRpgState(user);
  const item = CATALOG_MAP.get(String(itemId || '').trim());
  if (!item) return { ok: false, status: 404, message: 'Vật phẩm không tồn tại trong cửa hàng.' };

  if (!item.consumable && r.inventory.includes(item.id)) {
    return { ok: false, status: 409, message: `Bạn đã sở hữu "${item.name}" trong Túi đồ rồi.` };
  }

  if (item.currency === 'diamonds') {
    if (r.diamonds < item.price) {
      return { ok: false, status: 400, message: `Chưa đủ Kim cương (cần ${item.price} 💎, hiện có ${r.diamonds} 💎).` };
    }
    r.diamonds -= item.price;
  } else {
    if (r.gold < item.price) {
      return { ok: false, status: 400, message: `Chưa đủ Vàng (cần ${item.price} 🪙, hiện có ${r.gold} 🪙).` };
    }
    r.gold -= item.price;
  }

  if (item.consumable) {
    if (item.id === 'item-ticket') r.periodic_tickets += 1;
    if (item.id === 'item-gold-charm') r.consumables.gold_charm += 5;
    if (item.id === 'item-xp-boost') r.consumables.xp_boost += 3;
    return { ok: true, item, message: `🛍️ Đã mua & kích hoạt "${item.icon} ${item.name}" thành công!` };
  }

  r.inventory.push(item.id);
  if (['outfit', 'frame', 'pet', 'title', 'cardbg'].includes(item.category)) {
    r.equipped[item.category] = item.id;
  }
  return { ok: true, item, message: `✨ Đã mua và tự động trang bị "${item.icon} ${item.name}"!` };
}

function equipCatalogItem(user, itemId, unequipCategory = '') {
  const r = ensureUserRpgState(user);
  if (unequipCategory === 'pet') {
    r.equipped.pet = null;
    return { ok: true, message: 'Đã cho Thú cưng nghỉ ngơi.' };
  }
  const item = CATALOG_MAP.get(String(itemId || '').trim());
  if (!item || item.consumable) {
    return { ok: false, status: 400, message: 'Vật phẩm này không thể trang bị.' };
  }
  if (!r.inventory.includes(item.id)) {
    return { ok: false, status: 403, message: 'Bạn chưa sở hữu vật phẩm này trong Túi đồ.' };
  }
  r.equipped[item.category] = item.id;
  return { ok: true, message: `⚡ Đã trang bị "${item.icon} ${item.name}"!` };
}

function convertCurrency(user, direction, amount) {
  const r = ensureUserRpgState(user);
  const qty = Math.max(1, Math.min(100, Math.floor(Number(amount || 1))));
  if (direction === 'diamond_to_gold') {
    if (r.diamonds < qty) {
      return { ok: false, status: 400, message: `Không đủ Kim cương để đổi (${r.diamonds}/${qty} 💎).` };
    }
    const gainedGold = qty * 50;
    r.diamonds -= qty;
    r.gold += gainedGold;
    return { ok: true, message: `💎 Đổi ${qty} Kim cương → +${gainedGold} Vàng thành công!` };
  }
  if (direction === 'gold_to_diamond') {
    const goldCost = qty * 100;
    if (r.gold < goldCost) {
      return { ok: false, status: 400, message: `Cần ${goldCost} Vàng để đổi ${qty * 2} Kim cương (hiện có ${r.gold} 🪙).` };
    }
    const gainedDiamonds = qty * 2;
    r.gold -= goldCost;
    r.diamonds += gainedDiamonds;
    return { ok: true, message: `🪙 Đổi ${goldCost} Vàng → +${gainedDiamonds} Kim cương thành công!` };
  }
  return { ok: false, status: 400, message: 'Loại quy đổi không hợp lệ.' };
}

function recordSrsAnswer(user, questionId, isCorrect, meta = {}) {
  const r = ensureUserRpgState(user);
  const id = String(questionId || '').trim().slice(0, 120);
  if (!id) return null;
  const now = Date.now();
  const prev = r.srs_map[id] || {
    id,
    topic: String(meta.topic || '').slice(0, 80),
    subject: String(meta.subject || '').slice(0, 40),
    reps: 0,
    lapses: 0,
    intervalDays: 0
  };
  const schedule = [1, 3, 7, 14, 30];
  let nextReps = prev.reps || 0;
  let nextLapses = prev.lapses || 0;
  let intervalDays = 0;
  let dueAt = now;

  if (isCorrect) {
    nextReps += 1;
    intervalDays = schedule[Math.min(schedule.length - 1, nextReps - 1)];
    dueAt = now + intervalDays * 86400000;
  } else {
    nextReps = 0;
    nextLapses += 1;
    intervalDays = 0;
    dueAt = now; // Due immediately in Sổ ôn tập
  }

  r.srs_map[id] = {
    id,
    topic: String(meta.topic || prev.topic || '').slice(0, 80),
    subject: String(meta.subject || prev.subject || '').slice(0, 40),
    reps: nextReps,
    lapses: nextLapses,
    intervalDays,
    dueAt,
    lastResult: Boolean(isCorrect),
    updatedAt: new Date(now).toISOString()
  };

  // Prune safely beyond 400 entries (keep due & recent first)
  const keys = Object.keys(r.srs_map);
  if (keys.length > 400) {
    keys
      .sort((a, b) => Number(r.srs_map[a].dueAt || 0) - Number(r.srs_map[b].dueAt || 0))
      .slice(400)
      .forEach(k => { delete r.srs_map[k]; });
  }
  return r.srs_map[id];
}

function toggleExamBookmark(user, payload = {}) {
  const r = ensureUserRpgState(user);
  const qId = String(payload.id || '').trim().slice(0, 120);
  if (!qId) return { ok: false, status: 400, message: 'Thiếu ID câu hỏi.' };
  const idx = r.bookmarks.findIndex(b => b.id === qId);
  if (idx >= 0) {
    r.bookmarks.splice(idx, 1);
    return { ok: true, bookmarked: false, count: r.bookmarks.length, message: 'Đã bỏ lưu câu hỏi.' };
  }
  r.bookmarks.unshift({
    id: qId,
    examId: String(payload.examId || '').slice(0, 90),
    examTitle: String(payload.examTitle || '').slice(0, 140),
    subject: String(payload.subject || '').slice(0, 40),
    topic: String(payload.topic || '').slice(0, 80),
    type: String(payload.type || 'mcq').slice(0, 20),
    number: Number(payload.number || 0),
    text: String(payload.text || '').slice(0, 500),
    savedAt: new Date().toISOString()
  });
  if (r.bookmarks.length > 150) r.bookmarks = r.bookmarks.slice(0, 150);
  return { ok: true, bookmarked: true, count: r.bookmarks.length, message: '📌 Đã lưu câu hỏi vào kho Câu đã lưu!' };
}

function openPeriodicCell(user, { mode = 'random', z = 0 } = {}) {
  const r = ensureUserRpgState(user);
  const unlockedSet = new Set(r.periodic_unlocked);
  if (unlockedSet.size >= 118) {
    return { ok: false, status: 400, message: '🏆 Bạn đã mở khóa trọn bộ 118/118 nguyên tố Hóa học!' };
  }

  let targetZ = 0;
  let method = 'gold';
  if (mode === 'ticket') {
    const reqZ = Math.round(Number(z || 0));
    if (r.periodic_tickets < 1) {
      return { ok: false, status: 400, message: 'Bạn chưa có Vé chọn nguyên tố. Mở 10 ô hoặc mua trong Cửa hàng!' };
    }
    if (!Number.isInteger(reqZ) || reqZ < 1 || reqZ > 118) {
      return { ok: false, status: 400, message: 'Số hiệu nguyên tử Z không hợp lệ (1–118).' };
    }
    if (unlockedSet.has(reqZ)) {
      return { ok: false, status: 409, message: `Nguyên tố Z=${reqZ} đã được mở từ trước!` };
    }
    r.periodic_tickets -= 1;
    targetZ = reqZ;
    method = 'ticket';
  } else {
    const COST = 120;
    if (r.gold < COST) {
      return { ok: false, status: 400, message: `Cần ${COST} Vàng để mở 1 ô ngẫu nhiên (hiện có ${r.gold} 🪙).` };
    }
    const locked = [];
    for (let i = 1; i <= 118; i++) {
      if (!unlockedSet.has(i)) locked.push(i);
    }
    r.gold -= COST;
    targetZ = locked[Math.floor(Math.random() * locked.length)];
  }

  unlockedSet.add(targetZ);
  r.periodic_unlocked = Array.from(unlockedSet).sort((a, b) => a - b);

  // Check 10-element milestone for bonus Vé chọn + Kim cương
  const milestonesReached = Math.floor(r.periodic_unlocked.length / 10);
  let milestoneTickets = 0;
  if (milestonesReached > r.periodic_milestones) {
    milestoneTickets = milestonesReached - r.periodic_milestones;
    r.periodic_milestones = milestonesReached;
    r.periodic_tickets += milestoneTickets;
    r.diamonds += milestoneTickets;
  }
  let unlockedTitleHoaBa = false;
  if (r.periodic_unlocked.length >= 118 && !r.inventory.includes('title-hoaba')) {
    r.inventory.push('title-hoaba');
    unlockedTitleHoaBa = true;
  }

  return {
    ok: true,
    z: targetZ,
    method,
    unlocked_count: r.periodic_unlocked.length,
    milestone_tickets: milestoneTickets,
    unlocked_title_hoaba: unlockedTitleHoaBa,
    message: milestoneTickets
      ? `🎉 Mở được nguyên tố Z=${targetZ}! Đạt mốc ${milestonesReached * 10} ô → Tặng +${milestoneTickets} Vé chọn & +${milestoneTickets} Kim cương!`
      : `✨ Đã mở khóa nguyên tố Z=${targetZ} vào Bảng Tuần Hoàn của bạn!`
  };
}

module.exports = {
  CATALOG,
  CATALOG_MAP,
  RANK_TIERS,
  DAILY_MISSIONS_DEF,
  vnDateKey,
  vnWeekKey,
  getRankTier,
  ensureUserRpgState,
  getEquippedDetails,
  buildPublicRpgSnapshot,
  applyRewardMultipliers,
  performCheckin,
  claimDailyMission,
  buyCatalogItem,
  equipCatalogItem,
  convertCurrency,
  recordSrsAnswer,
  toggleExamBookmark,
  openPeriodicCell
};
