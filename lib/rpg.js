/* ============================================================================
 * HỌC CÙNG PHÚC K9 — RPG STUDY ENGINE, SHOP, SRS, PERIODIC GACHA & JOURNEY
 * Clean-room modular backend state & economy manager backed by Upstash Redis
 * ============================================================================ */

const CATALOG = [
  // OUTFITS / 3D HERO MODELS & COSTUMES
  { id: 'outfit-scholar', category: 'outfit', name: 'Áo Blouse Thủ Khoa', icon: '🧑‍🎓', desc: 'Trang phục học viện chuẩn sĩ tử K9 tỏa khí chất 27+ điểm.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'outfit-chemist', category: 'outfit', name: 'Nhà Giả Kim Phòng Lab', icon: '🧑‍🔬', desc: 'Áo choàng giả kim bọc lõi phản ứng phát sáng 118 nguyên tố.', currency: 'gold', price: 150, rarity: 'rare' },
  { id: 'outfit-wizard', category: 'outfit', name: 'Pháp Sư Giải Tích', icon: '🧙‍♂️', desc: 'Áo bào ma pháp khắc cổ ngữ Tích phân & Pháp trận Sao băng.', currency: 'gold', price: 240, rarity: 'epic' },
  { id: 'outfit-speedster', category: 'outfit', name: 'Tia Chớp Tốc Độ Siêu Thanh', icon: '⚡', desc: 'Chiến phục tia sét đỏ-vàng bứt tốc giải 40 câu trắc nghiệm.', currency: 'gold', price: 340, rarity: 'epic' },
  { id: 'outfit-astronaut', category: 'outfit', name: 'Phi Hành Gia Bách Khoa', icon: '👩‍🚀', desc: 'Bộ giáp không gian mặt kính phản quang vàng chinh phục vũ trụ tri thức.', currency: 'gold', price: 360, rarity: 'epic' },
  { id: 'outfit-slayer', category: 'outfit', name: 'Kiếm Sĩ Hơi Thở Thủy Hỏa', icon: '🌊', desc: 'Áo haori caro xanh-đen huyền thoại kèm Nhật Luân Kiếm phát sáng.', currency: 'gold', price: 390, rarity: 'epic' },
  { id: 'outfit-saiyan', category: 'outfit', name: 'Chiến Binh Siêu Tóc Vàng', icon: '🔥', desc: 'Võ phục chiến đấu cam-lam rực cháy luồng Ki vàng kim bùng nổ.', currency: 'gold', price: 420, rarity: 'epic' },
  { id: 'outfit-ninja', category: 'outfit', name: 'Ninja Tốc Độ Đề Thi', icon: '🥷', desc: 'Chiến giáp Nhẫn Giả băng trán kim loại & khăn choàng rực đỏ.', currency: 'diamonds', price: 5, rarity: 'legendary' },
  { id: 'outfit-sorcerer', category: 'outfit', name: 'Chú Thuật Sư Lục Nhãn', icon: '🌀', desc: 'Chiến bào chú thuật cao cổ & băng mắt Hư Không tỏa tử khí tím-lam.', currency: 'diamonds', price: 7, rarity: 'legendary' },
  { id: 'outfit-nano', category: 'outfit', name: 'Giáp Nano Lò Phản Ứng', icon: '🦾', desc: 'Chiến giáp hợp kim Titan đỏ-vàng Mark tối tân với lõi năng lượng ngực.', currency: 'diamonds', price: 8, rarity: 'legendary' },
  { id: 'outfit-hero', category: 'outfit', name: 'Chiến Thần Sĩ Tử 2K9', icon: '🦸', desc: 'Bộ giáp siêu anh hùng áo choàng tung bay & biểu tượng chữ K9 phát sáng.', currency: 'diamonds', price: 9, rarity: 'legendary' },
  { id: 'outfit-monarch', category: 'outfit', name: 'Hoàng Đế Bóng Đêm K9', icon: '🗡️', desc: 'Áo choàng hắc đế cổ lông & song dao găm tử linh trỗi dậy từ bóng tối.', currency: 'diamonds', price: 12, rarity: 'mythic' },
  { id: 'outfit-celestial', category: 'outfit', name: 'Thần Sứ Cánh Bạch Kim 9+', icon: '🪽', desc: 'Bộ giáp thánh tích với 6 cánh quang phổ kim cương & vương miện thiên hà.', currency: 'diamonds', price: 14, rarity: 'mythic' },

  // ANIME & SUPERHERO AURAS (HÀO QUANG TỎA QUANH NHÂN VẬT & KHUNG)
  { id: 'aura-none', category: 'aura', name: 'Khí Tức Khởi Nguyên', icon: '✨', cssClass: 'pk9-aura-spark', desc: 'Vòng khí tức xanh lam dịu nhẹ dành cho tân binh mới thức tỉnh.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'aura-water-breath', category: 'aura', name: 'Thủy Thức Thập Nhị Lưu', icon: '🐉', cssClass: 'pk9-aura-water', desc: 'Dòng xoáy sóng xanh Nhật Bản cuộn tròn quanh nhân vật cực mãn nhãn.', currency: 'gold', price: 260, rarity: 'epic' },
  { id: 'aura-saiyan-gold', category: 'aura', name: 'Khí Lửa Siêu Chiến Thần', icon: '💥', cssClass: 'pk9-aura-saiyan', desc: 'Cột năng lượng Ki vàng rực bốc cao cùng tia sét nổ tí tách quanh người.', currency: 'gold', price: 300, rarity: 'epic' },
  { id: 'aura-mystic-mandala', category: 'aura', name: 'Pháp Trận Ma Thuật Cổ Ngữ', icon: '☸️', cssClass: 'pk9-aura-mandala', desc: 'Hai vòng tròn ma trận cam rực xoay ngược chiều như Pháp Sư Tối Thượng.', currency: 'gold', price: 360, rarity: 'epic' },
  { id: 'aura-void-infinity', category: 'aura', name: 'Vô Hạ Hạn · Lục Nhãn Hư Không', icon: '🟣', cssClass: 'pk9-aura-infinity', desc: 'Hào quang tím-lam bẻ cong không gian & hạt lượng tử lơ lửng cực ngầu.', currency: 'diamonds', price: 6, rarity: 'legendary' },
  { id: 'aura-crimson-shrine', category: 'aura', name: 'Lĩnh Vực Phục Ma Đỏ Thẫm', icon: '🩸', cssClass: 'pk9-aura-crimson', desc: 'Sóng xung kích huyết sắc kèm tia trảm đỏ đen rực cháy uy quyền.', currency: 'diamonds', price: 7, rarity: 'legendary' },
  { id: 'aura-shadow-monarch', category: 'aura', name: 'Hắc Ảnh Quân Vương · Arise', icon: '👾', cssClass: 'pk9-aura-shadow', desc: 'Làn khói tím than bốc lên từ bóng tối cùng ánh hào quang quân đoàn.', currency: 'diamonds', price: 10, rarity: 'mythic' },
  { id: 'aura-ultra-instinct', category: 'aura', name: 'Bản Năng Vô Cực Bạch Ngân', icon: '❄️', cssClass: 'pk9-aura-ui', desc: 'Hào quang bạc ánh tím thiên hà bồng bềnh — đỉnh cao tối thượng anime!', currency: 'diamonds', price: 12, rarity: 'mythic' },

  // ANIME-STYLE ANIMATED AVATAR FRAMES
  { id: 'frame-bronze', category: 'frame', name: 'Khung Tân Binh Đồng', icon: '🥉', cssClass: 'pk9-frame-bronze', desc: 'Viền đồng cổ điển phát sáng nhẹ dành cho người mới bắt đầu.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'frame-emerald', category: 'frame', name: 'Khung Ngọc Lục Bảo', icon: '❇️', cssClass: 'pk9-frame-emerald', desc: 'Ánh xanh lục bảo xoay vòng tăng tập trung cao độ khi ôn tập.', currency: 'gold', price: 120, rarity: 'rare' },
  { id: 'frame-neon', category: 'frame', name: 'Khung Neon Cyber K9', icon: '💠', cssClass: 'pk9-frame-neon', desc: 'Viền neon kép quét tia laser xanh tím nổi bật trên mọi bảng xếp hạng.', currency: 'gold', price: 220, rarity: 'epic' },
  { id: 'frame-thunder', category: 'frame', name: 'Khung Lôi Thần Sấm Sét', icon: '⚡', cssClass: 'pk9-frame-thunder', desc: 'Tia điện vàng-lam phóng quanh viền tràn đầy tốc độ & uy lực.', currency: 'gold', price: 310, rarity: 'rare' },
  { id: 'frame-nichirin', category: 'frame', name: 'Khung Nhật Luân Sóng Nước', icon: '🌊', cssClass: 'pk9-frame-nichirin', desc: 'Họa tiết sóng lam ukiyo-e xoay tròn cùng vòng ánh dương rực rỡ.', currency: 'gold', price: 350, rarity: 'epic' },
  { id: 'frame-gold', category: 'frame', name: 'Khung Hoàng Kim Thủ Khoa', icon: '👑', cssClass: 'pk9-frame-gold', desc: 'Hào quang vàng rực xoay 360° vinh danh TOP đầu toàn hệ thống.', currency: 'gold', price: 380, rarity: 'epic' },
  { id: 'frame-eldritch', category: 'frame', name: 'Khung Ma Trận Pháp Sư Cam', icon: '✴️', cssClass: 'pk9-frame-eldritch', desc: 'Vòng rune hình học ma thuật cam rực kiểu Đa Vũ Trụ lơ lửng.', currency: 'gold', price: 440, rarity: 'epic' },
  { id: 'frame-sharingan', category: 'frame', name: 'Khung Huyết Luân Nhãn Tối Thượng', icon: '👁️', cssClass: 'pk9-frame-sharingan', desc: 'Vành đỏ thẫm xoay 3 câu ngọc đen bí ẩn tỏa hắc hỏa quanh avatar.', currency: 'diamonds', price: 5, rarity: 'legendary' },
  { id: 'frame-phoenix', category: 'frame', name: 'Khung Phượng Hoàng Lửa', icon: '🔥', cssClass: 'pk9-frame-phoenix', desc: 'Ngọn lửa bất tử cam-đỏ rực cháy luân hồi không bao giờ tắt.', currency: 'diamonds', price: 6, rarity: 'legendary' },
  { id: 'frame-infinity', category: 'frame', name: 'Khung Lục Nhãn Vô Hạn', icon: '🔮', cssClass: 'pk9-frame-infinity', desc: 'Vành năng lượng lam-tím kép với hiệu ứng bẻ cong không gian 3D.', currency: 'diamonds', price: 8, rarity: 'legendary' },
  { id: 'frame-galaxy', category: 'frame', name: 'Khung Thiên Hà Kim Cương', icon: '🌌', cssClass: 'pk9-frame-galaxy', desc: 'Viền tinh tú đa sắc kim cương cao cấp nhất hệ sinh thái Phúc K9.', currency: 'diamonds', price: 12, rarity: 'mythic' },
  { id: 'frame-valkyrie', category: 'frame', name: 'Khung Thần Giới Bạch Kim 3D', icon: '🪽', cssClass: 'pk9-frame-valkyrie', desc: 'Khung 3D đôi cánh thiên sứ ánh kim & hào quang cầu vồng lộng lẫy.', currency: 'diamonds', price: 14, rarity: 'mythic' },

  // 3D COMPANION PETS
  { id: 'pet-owl', category: 'pet', name: 'Cú Mèo Thức Khuya', icon: '🦉', desc: 'Linh thú đồng hành ôn đề khuya không bao giờ ngủ gật.', currency: 'gold', price: 180, rarity: 'rare' },
  { id: 'pet-fox', category: 'pet', name: 'Cáo Tuyết Cửu Vĩ Mini', icon: '🦊', desc: 'Linh hồ nhanh nhẹn tỏa sương lam né bẫy trắc nghiệm Đúng/Sai.', currency: 'gold', price: 280, rarity: 'epic' },
  { id: 'pet-cat', category: 'pet', name: 'Mèo Casio Thần Tài', icon: '🐱', desc: 'Chiêu tài gọi may mắn mỗi lần bấm phím CALC & SOLVE.', currency: 'gold', price: 320, rarity: 'epic' },
  { id: 'pet-spark', category: 'pet', name: 'Tiểu Thú Sấm Sét 100kV', icon: '🐹', desc: 'Bé linh thú má đỏ phóng điện vàng tích cực giúp tỉnh táo 100%.', currency: 'gold', price: 350, rarity: 'epic' },
  { id: 'pet-mecha', category: 'pet', name: 'Drone AI Jarvis K9', icon: '🤖', desc: 'Trợ lý cơ khí bay hologram quét lỗi sai ngay lập tức.', currency: 'gold', price: 450, rarity: 'epic' },
  { id: 'pet-dragon', category: 'pet', name: 'Rồng Lửa 9+ Môn', icon: '🐉', desc: 'Linh vật hỏa long huyền thoại của cao thủ ĐGNL & THPT.', currency: 'diamonds', price: 8, rarity: 'legendary' },
  { id: 'pet-shadow-wolf', category: 'pet', name: 'Bạch Ảnh Lang Igris', icon: '🐺', desc: 'Chiến lang bóng đêm mắt tím bảo vệ chuỗi Streak bất bại.', currency: 'diamonds', price: 9, rarity: 'legendary' },
  { id: 'pet-unicorn', category: 'pet', name: 'Kỳ Lân Thủ Khoa', icon: '🦄', desc: 'Thánh thú hào quang cầu vồng bứt phá hạng #1 Bảng Vàng.', currency: 'diamonds', price: 10, rarity: 'legendary' },
  { id: 'pet-spirit-dragon', category: 'pet', name: 'Thanh Long Ngọc Rồng Thần', icon: '🐲', desc: 'Rồng thần ngọc bích vờn mây vàng ban điều ước điểm 30/30.', currency: 'diamonds', price: 13, rarity: 'mythic' },

  // TITLES (DANH HIỆU)
  { id: 'title-tanbinh', category: 'title', name: 'Tân Binh Bứt Phá', icon: '⚡', desc: 'Danh hiệu khởi đầu hành trình 9+.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'title-ongcham', category: 'title', name: 'Ong Chăm Cày Đề', icon: '🐝', desc: 'Kiên trì luyện đề mỗi tối không bỏ cuộc.', currency: 'gold', price: 140, rarity: 'rare' },
  { id: 'title-hoaba', category: 'title', name: 'Hóa Bá 118 Nguyên Tố', icon: '⚗️', desc: 'Thuộc làu phản ứng & bảng tuần hoàn IUPAC.', currency: 'gold', price: 260, rarity: 'epic' },
  { id: 'title-satthu', category: 'title', name: 'Sát Thủ Trắc Nghiệm', icon: '🎯', desc: 'Khoanh đâu trúng đó, trả lời ngắn chuẩn từng dấu phẩy.', currency: 'gold', price: 340, rarity: 'epic' },
  { id: 'title-super-hero', category: 'title', name: 'Chiến Binh Phá Đảo Đề', icon: '🦸', desc: 'Gánh team môn chính với năng lượng siêu anh hùng.', currency: 'gold', price: 390, rarity: 'epic' },
  { id: 'title-special-grade', category: 'title', name: 'Chú Thuật Sư Đặc Cấp', icon: '🌀', desc: 'Bậc thầy chú thuật phá giải mọi câu Vận Dụng Cao.', currency: 'diamonds', price: 7, rarity: 'legendary' },
  { id: 'title-thukhoa', category: 'title', name: 'Ứng Cử Viên Thủ Khoa', icon: '🏆', desc: 'Danh hiệu danh giá hiển thị nổi bật trên BXH.', currency: 'diamonds', price: 7, rarity: 'legendary' },
  { id: 'title-shadow-king', category: 'title', name: 'Chúa Tể Thăng Cấp S', icon: '👑', desc: 'Vượt mọi giới hạn hạng S — Arise trên đỉnh bảng vàng.', currency: 'diamonds', price: 9, rarity: 'legendary' },
  { id: 'title-goat', category: 'title', name: 'Huyền Thoại Tuyệt Đối 30đ', icon: '💎', desc: 'Danh hiệu tối thượng hiếm có nhất Hệ Sinh Thái Phúc K9.', currency: 'diamonds', price: 14, rarity: 'mythic' },

  // CARD BACKGROUNDS (NỀN THẺ HỌC VIÊN QR HOLOGRAPHIC)
  { id: 'cardbg-ocean', category: 'cardbg', name: 'Nền Đại Dương Xanh', icon: '🌊', cssClass: 'pk9-cardbg-ocean', desc: 'Thẻ học viên xanh dương chuẩn thương hiệu Phúc K9.', currency: 'gold', price: 0, rarity: 'common', freeStarter: true },
  { id: 'cardbg-emerald', category: 'cardbg', name: 'Nền Rừng Ngọc Bích', icon: '🌿', cssClass: 'pk9-cardbg-emerald', desc: 'Sắc xanh lục bảo mát mắt đầy sức sống.', currency: 'gold', price: 140, rarity: 'rare' },
  { id: 'cardbg-sakura', category: 'cardbg', name: 'Nền Đêm Anh Đào Kiếm Sĩ', icon: '🌸', cssClass: 'pk9-cardbg-sakura', desc: 'Đêm chàm huyền ảo điểm cánh hoa anh đào phát sáng.', currency: 'gold', price: 260, rarity: 'rare' },
  { id: 'cardbg-sunset', category: 'cardbg', name: 'Nền Hoàng Hôn Chinh Phục', icon: '🌅', cssClass: 'pk9-cardbg-sunset', desc: 'Chuyển sắc cam vàng rực rỡ trên Thẻ QR.', currency: 'gold', price: 220, rarity: 'epic' },
  { id: 'cardbg-crimson', category: 'cardbg', name: 'Nền Huyết Nguyệt Ma Thần', icon: '🩸', cssClass: 'pk9-cardbg-crimson', desc: 'Thẻ đỏ thẫm nhật thực anime đầy uy lực trên Thẻ QR.', currency: 'gold', price: 320, rarity: 'epic' },
  { id: 'cardbg-cyber', category: 'cardbg', name: 'Nền Tím Ngân Hà', icon: '🔮', cssClass: 'pk9-cardbg-cyber', desc: 'Phong cách tương lai neon tím hồng cho thẻ học viên.', currency: 'diamonds', price: 4, rarity: 'legendary' },
  { id: 'cardbg-starlight', category: 'cardbg', name: 'Nền Lục Nhãn Vô Cực', icon: '💠', cssClass: 'pk9-cardbg-starlight', desc: 'Mạng lưới lượng tử lam-tím 3D bẻ cong không gian.', currency: 'diamonds', price: 5, rarity: 'legendary' },
  { id: 'cardbg-royal', category: 'cardbg', name: 'Nền Hoàng Gia Bạch Kim Gold', icon: '👑', cssClass: 'pk9-cardbg-royal', desc: 'Thẻ đen tuyền khảm viền vàng 24K đẳng cấp Thủ Khoa.', currency: 'diamonds', price: 6, rarity: 'legendary' },

  // CONSUMABLES (VẬT PHẨM BỔ TRỢ)
  { id: 'item-ticket', category: 'consumable', name: 'Vé Chọn Nguyên Tố', icon: '🎫', desc: 'Dùng mở đích danh 1 ô nguyên tố bất kì trong Bảng Tuần Hoàn.', currency: 'gold', price: 180, rarity: 'rare', consumable: true },
  { id: 'item-gold-charm', category: 'consumable', name: 'Bùa Vàng (+25% Vàng · 5 lượt)', icon: '🧿', desc: 'Tăng 25% Vàng nhận được trong 5 lượt làm đề/nhiệm vụ kế tiếp.', currency: 'gold', price: 160, rarity: 'epic', consumable: true },
  { id: 'item-xp-boost', category: 'consumable', name: 'Vé Nhân Đôi EXP (3 lượt)', icon: '🚀', desc: 'Nhân đôi EXP cộng BXH cho 3 lượt luyện tập hoặc nộp đề.', currency: 'diamonds', price: 3, rarity: 'legendary', consumable: true },
  { id: 'item-ticket-pack', category: 'consumable', name: 'Gói 3 Vé Chọn Nguyên Tố', icon: '🎟️', desc: 'Nhận ngay 3 Vé Chọn đích danh nguyên tố trong Bảng Tuần Hoàn.', currency: 'diamonds', price: 4, rarity: 'epic', consumable: true },
  { id: 'item-omega-combo', category: 'consumable', name: 'Lõi Năng Lượng Siêu Cấp (x5 EXP + x8 Vàng)', icon: '⚛️', desc: 'Kích hoạt +5 lượt Nhân Đôi EXP & +8 lượt Bùa Vàng (+25%)!', currency: 'diamonds', price: 6, rarity: 'legendary', consumable: true }
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

const SUPER_ADMIN_RPG_USER = 'phucadmin';
const ALL_WEARABLE_IDS = CATALOG.filter(i => !i.consumable).map(i => i.id);
const ALL_PERIODIC_Z = Array.from({ length: 118 }, (_, i) => i + 1);

function defaultInventoryIds() {
  return CATALOG.filter(i => i.freeStarter).map(i => i.id);
}

function isAdminRpgHolder(user) {
  if (!user || user.banned) return false;
  const uname = String(user.username || '').trim().toLowerCase();
  if (uname === SUPER_ADMIN_RPG_USER) return true;
  return Boolean(
    user.is_admin === true &&
    user.role === 'admin' &&
    String(user.admin_granted_by || '').trim().toLowerCase() === SUPER_ADMIN_RPG_USER
  );
}

function hasItemUnlocked(user, r, itemId) {
  if (!itemId || !CATALOG_MAP.has(itemId)) return false;
  if (isAdminRpgHolder(user)) {
    const it = CATALOG_MAP.get(itemId);
    return Boolean(it && !it.consumable);
  }
  return Array.isArray(r?.inventory) && r.inventory.includes(itemId);
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
  if (!r.equipped.outfit || !hasItemUnlocked(user, r, r.equipped.outfit)) r.equipped.outfit = 'outfit-scholar';
  if (!r.equipped.frame || !hasItemUnlocked(user, r, r.equipped.frame)) r.equipped.frame = 'frame-bronze';
  if (r.equipped.aura === undefined) r.equipped.aura = 'aura-none';
  if (r.equipped.aura && !hasItemUnlocked(user, r, r.equipped.aura)) r.equipped.aura = 'aura-none';
  if (!r.equipped.title || !hasItemUnlocked(user, r, r.equipped.title)) r.equipped.title = 'title-tanbinh';
  if (!r.equipped.cardbg || !hasItemUnlocked(user, r, r.equipped.cardbg)) r.equipped.cardbg = 'cardbg-ocean';
  if (r.equipped.pet && !hasItemUnlocked(user, r, r.equipped.pet)) r.equipped.pet = null;

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

  // Wrong-question diagnostic bank across real exams
  if (!Array.isArray(r.wrong_bank)) r.wrong_bank = [];
  if (r.wrong_bank.length > 180) r.wrong_bank = r.wrong_bank.slice(0, 180);

  // Cumulative per-topic accuracy diagnostics across exams
  if (!r.topic_stats || typeof r.topic_stats !== 'object' || Array.isArray(r.topic_stats)) {
    r.topic_stats = {};
  }

  // PWA / In-App daily study & SRS reminder preferences
  if (!r.reminder || typeof r.reminder !== 'object') {
    r.reminder = { enabled: false, time: '20:30' };
  }
  r.reminder.enabled = Boolean(r.reminder.enabled);
  if (!/^\d{2}:\d{2}$/.test(String(r.reminder.time || ''))) {
    r.reminder.time = '20:30';
  }

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
  const auraItem = eq.aura === null
    ? null
    : (CATALOG_MAP.get(eq.aura) || CATALOG_MAP.get('aura-none'));
  return {
    outfit: CATALOG_MAP.get(eq.outfit) || CATALOG_MAP.get('outfit-scholar'),
    frame: CATALOG_MAP.get(eq.frame) || CATALOG_MAP.get('frame-bronze'),
    aura: auraItem,
    title: CATALOG_MAP.get(eq.title) || CATALOG_MAP.get('title-tanbinh'),
    pet: eq.pet ? CATALOG_MAP.get(eq.pet) || null : null,
    cardbg: CATALOG_MAP.get(eq.cardbg) || CATALOG_MAP.get('cardbg-ocean')
  };
}

function buildPublicRpgSnapshot(user) {
  const r = ensureUserRpgState(user);
  const adminFull = isAdminRpgHolder(user);
  const effectiveInventory = adminFull
    ? Array.from(new Set([...r.inventory, ...ALL_WEARABLE_IDS]))
    : r.inventory;
  const effectivePeriodic = adminFull ? ALL_PERIODIC_Z : r.periodic_unlocked;
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
    admin_full_unlock: adminFull,
    gold: r.gold,
    diamonds: r.diamonds,
    tier,
    equipped: r.equipped,
    equipped_details: {
      outfit: eq.outfit ? { id: eq.outfit.id, name: eq.outfit.name, icon: eq.outfit.icon } : null,
      frame: eq.frame ? { id: eq.frame.id, name: eq.frame.name, icon: eq.frame.icon, cssClass: eq.frame.cssClass } : null,
      aura: eq.aura ? { id: eq.aura.id, name: eq.aura.name, icon: eq.aura.icon, cssClass: eq.aura.cssClass } : null,
      title: eq.title ? { id: eq.title.id, name: eq.title.name, icon: eq.title.icon } : null,
      pet: eq.pet ? { id: eq.pet.id, name: eq.pet.name, icon: eq.pet.icon } : null,
      cardbg: eq.cardbg ? { id: eq.cardbg.id, name: eq.cardbg.name, icon: eq.cardbg.icon, cssClass: eq.cardbg.cssClass } : null
    },
    inventory: effectiveInventory,
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
      unlocked: effectivePeriodic,
      unlocked_count: effectivePeriodic.length,
      tickets: adminFull ? Math.max(99, r.periodic_tickets) : r.periodic_tickets,
      next_ticket_in: adminFull ? 0 : (10 - (r.periodic_unlocked.length % 10 || 0))
    },
    bookmarks: r.bookmarks,
    srs: {
      total: srsValues.length,
      due_count: dueCount,
      items: srsValues.sort((a, b) => Number(a.dueAt || 0) - Number(b.dueAt || 0)).slice(0, 120)
    },
    wrong_bank: (() => {
      const all = Array.isArray(r.wrong_bank) ? r.wrong_bank : [];
      const unresolved = all.filter(it => it && !it.resolved);
      const resolvedCount = all.filter(it => it && it.resolved).length;
      return {
        total: unresolved.length,
        resolved_count: resolvedCount,
        items: unresolved.slice(0, 120)
      };
    })(),
    topic_stats: Object.values(r.topic_stats || {})
      .filter(Boolean)
      .sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0))
      .slice(0, 60),
    reminder: {
      enabled: Boolean(r.reminder?.enabled),
      time: String(r.reminder?.time || '20:30')
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

function applyConsumablePurchase(r, item) {
  if (item.id === 'item-ticket') r.periodic_tickets += 1;
  if (item.id === 'item-ticket-pack') r.periodic_tickets += 3;
  if (item.id === 'item-gold-charm') r.consumables.gold_charm += 5;
  if (item.id === 'item-xp-boost') r.consumables.xp_boost += 3;
  if (item.id === 'item-omega-combo') {
    r.consumables.xp_boost += 5;
    r.consumables.gold_charm += 8;
  }
}

function buyCatalogItem(user, itemId) {
  const r = ensureUserRpgState(user);
  const adminFull = isAdminRpgHolder(user);
  const item = CATALOG_MAP.get(String(itemId || '').trim());
  if (!item) return { ok: false, status: 404, message: 'Vật phẩm không tồn tại trong cửa hàng.' };

  if (adminFull) {
    if (item.consumable) {
      applyConsumablePurchase(r, item);
      return { ok: true, item, message: `👑 Đặc quyền Admin: Nhận miễn phí "${item.icon} ${item.name}" thành công!` };
    }
    if (['outfit', 'frame', 'aura', 'pet', 'title', 'cardbg'].includes(item.category)) {
      r.equipped[item.category] = item.id;
    }
    return { ok: true, item, message: `👑 Đặc quyền Admin: Đã trang bị "${item.icon} ${item.name}" (đã mở sẵn full kho)!` };
  }

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
    applyConsumablePurchase(r, item);
    return { ok: true, item, message: `🛍️ Đã mua & kích hoạt "${item.icon} ${item.name}" thành công!` };
  }

  r.inventory.push(item.id);
  if (['outfit', 'frame', 'aura', 'pet', 'title', 'cardbg'].includes(item.category)) {
    r.equipped[item.category] = item.id;
  }
  return { ok: true, item, message: `✨ Đã mua và tự động trang bị "${item.icon} ${item.name}"!` };
}

function equipCatalogItem(user, itemId, unequipCategory = '') {
  const r = ensureUserRpgState(user);
  if (unequipCategory === 'pet' || unequipCategory === 'aura') {
    r.equipped[unequipCategory] = null;
    return { ok: true, message: unequipCategory === 'pet' ? 'Đã cho Thú cưng nghỉ ngơi.' : 'Đã thu hồi Hào quang Aura.' };
  }
  const item = CATALOG_MAP.get(String(itemId || '').trim());
  if (!item || item.consumable) {
    return { ok: false, status: 400, message: 'Vật phẩm này không thể trang bị.' };
  }
  if (!hasItemUnlocked(user, r, item.id)) {
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
  if (isAdminRpgHolder(user) || unlockedSet.size >= 118) {
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

function recordExamDiagnostics(user, exam = {}, result = {}) {
  const r = ensureUserRpgState(user);
  const nowIso = new Date().toISOString();
  const examId = String(exam.id || '').slice(0, 100);
  const examTitle = String(exam.title || 'Đề luyện thi Phúc K9').slice(0, 160);
  const subject = String(exam.subject || 'Toán').slice(0, 40);
  const qById = new Map((exam.questions || []).map(q => [String(q.id || ''), q]));

  for (const ts of (result.topicStats || [])) {
    const topicName = String(ts?.topic || '').trim().slice(0, 80);
    if (!topicName) continue;
    const key = `${subject}::${topicName}`.slice(0, 120);
    const prev = r.topic_stats[key] || {
      key,
      subject,
      topic: topicName,
      total: 0,
      correct: 0,
      earnedPts: 0,
      maxPts: 0,
      accuracy: 0
    };
    const nextEarned = Number((Number(prev.earnedPts || 0) + Number(ts.earnedPts || 0)).toFixed(2));
    const nextMax = Number((Number(prev.maxPts || 0) + Number(ts.maxPts || 0)).toFixed(2));
    r.topic_stats[key] = {
      key,
      subject,
      topic: topicName,
      total: Number(prev.total || 0) + Number(ts.total || ts.count || 0),
      correct: Number(prev.correct || 0) + Number(ts.correct || 0),
      earnedPts: nextEarned,
      maxPts: nextMax,
      accuracy: nextMax > 0 ? Math.round((nextEarned / nextMax) * 100) : 0,
      lastAt: nowIso
    };
  }

  const topicKeys = Object.keys(r.topic_stats);
  if (topicKeys.length > 120) {
    topicKeys
      .sort((a, b) => String(r.topic_stats[b]?.lastAt || '').localeCompare(String(r.topic_stats[a]?.lastAt || '')))
      .slice(120)
      .forEach(k => { delete r.topic_stats[k]; });
  }

  for (const rv of (result.review || [])) {
    const qId = String(rv?.id || '').trim().slice(0, 120);
    if (!qId) continue;
    const isCorrect = rv.status === 'correct' || rv.correct === true;
    const existingIdx = r.wrong_bank.findIndex(x => String(x?.id || '') === qId);

    if (isCorrect) {
      if (existingIdx >= 0) {
        r.wrong_bank[existingIdx].resolved = true;
        r.wrong_bank[existingIdx].resolvedAt = nowIso;
      }
      continue;
    }

    const srcQ = qById.get(qId) || {};
    const snap = {
      id: qId,
      examId,
      examTitle,
      subject,
      section: String(rv.section || srcQ.section || 'I').slice(0, 10),
      number: Number(rv.number || srcQ.number || 0),
      topic: String(rv.topic || srcQ.topic || 'Tổng hợp').slice(0, 80),
      type: String(rv.type || srcQ.type || 'mcq').slice(0, 20),
      text: String(rv.text || srcQ.text || srcQ.prompt || '').slice(0, 1200),
      options: Array.isArray(srcQ.options) ? srcQ.options.slice(0, 6) : (Array.isArray(rv.options) ? rv.options.slice(0, 6) : undefined),
      statements: Array.isArray(srcQ.statements)
        ? srcQ.statements.slice(0, 6).map(s => ({ text: String(s.text || '').slice(0, 400), answer: Boolean(s.answer) }))
        : undefined,
      answer: srcQ.answer !== undefined ? srcQ.answer : rv.correctAnswer,
      acceptedAnswers: Array.isArray(srcQ.acceptedAnswers) ? srcQ.acceptedAnswers.slice(0, 6) : rv.acceptedAnswers,
      explanation: String(rv.explanation || srcQ.explanation || '').slice(0, 1400),
      userAnswer: rv.userAnswer ?? null,
      wrongCount: existingIdx >= 0 ? Number(r.wrong_bank[existingIdx].wrongCount || 1) + 1 : 1,
      resolved: false,
      lastWrongAt: nowIso
    };
    if (existingIdx >= 0) {
      r.wrong_bank.splice(existingIdx, 1);
    }
    r.wrong_bank.unshift(snap);
  }

  if (r.wrong_bank.length > 180) {
    const unresolved = r.wrong_bank.filter(x => !x.resolved);
    const resolved = r.wrong_bank.filter(x => x.resolved);
    r.wrong_bank = unresolved.concat(resolved).slice(0, 180);
  }
}

function resolveWrongQuestion(user, qId, isCorrect = true, isAdmin = false) {
  const r = ensureUserRpgState(user);
  const id = String(qId || '').trim().slice(0, 120);
  if (!id) return { ok: false, status: 400, message: 'Thiếu mã câu hỏi.' };
  const idx = r.wrong_bank.findIndex(x => String(x?.id || '') === id);
  if (idx < 0) return { ok: false, status: 404, message: 'Không tìm thấy câu hỏi trong Ngân hàng lỗi sai.' };

  const item = r.wrong_bank[idx];
  const wasResolved = Boolean(item.resolved);
  item.resolved = Boolean(isCorrect);
  if (isCorrect) {
    item.resolvedAt = new Date().toISOString();
  } else {
    item.wrongCount = Number(item.wrongCount || 1) + 1;
    item.lastWrongAt = new Date().toISOString();
  }
  recordSrsAnswer(user, id, Boolean(isCorrect), { topic: item.topic || '', subject: item.subject || '' });

  let granted = { gold: 0, xp: 0, diamonds: 0 };
  if (isCorrect && !wasResolved) {
    granted = applyRewardMultipliers(user, 8, 5, 0, isAdmin);
  }
  return {
    ok: true,
    id,
    resolved: item.resolved,
    granted,
    message: item.resolved
      ? `✅ Đã đánh dấu làm chủ câu sai${granted.gold ? ` · +${granted.gold} Vàng` : ''}${granted.xp ? ` · +${granted.xp} EXP` : ''}!`
      : '📌 Đã giữ lại câu hỏi trong Ngân hàng Câu Sai để ôn tiếp.'
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
  isAdminRpgHolder,
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
  recordExamDiagnostics,
  resolveWrongQuestion,
  toggleExamBookmark,
  openPeriodicCell
};
