const fs = require('fs');
const path = require('path');

const SCRATCH_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7/scratch';
const APP_DIR = 'C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web';
const BUNDLES_DIR = path.join(APP_DIR, 'assets/2k9-teachers');

const SUBJECT_META = {
  'Toán': { slug: 'toan', bundle: 'toan.json', order: 1, icon: '📐', accent: '#2563eb' },
  'Vật Lí': { slug: 'vat-li', bundle: 'vat-li.json', order: 2, icon: '⚡', accent: '#0ea5e9' },
  'Hóa Học': { slug: 'hoa-hoc', bundle: 'hoa-hoc.json', order: 3, icon: '🧪', accent: '#10b981' },
  'Sinh Học': { slug: 'sinh-hoc', bundle: 'sinh-hoc.json', order: 4, icon: '🧬', accent: '#14b8a6' },
  'Tiếng Anh': { slug: 'tieng-anh', bundle: 'tieng-anh.json', order: 5, icon: '📘', accent: '#8b5cf6' },
  'Ngữ Văn': { slug: 'ngu-van', bundle: 'ngu-van.json', order: 6, icon: '📖', accent: '#ec4899' },
  'Lịch Sử': { slug: 'lich-su', bundle: 'lich-su.json', order: 7, icon: '📜', accent: '#f59e0b' },
  'Địa Lí': { slug: 'dia-li', bundle: 'dia-li.json', order: 8, icon: '🌍', accent: '#06b6d4' },
  'ĐGNL V-ACT': { slug: 'dgnl', bundle: 'dgnl.json', order: 9, icon: '🏆', accent: '#2563eb' },
  'ĐGNL HSA': { slug: 'dgnl', bundle: 'dgnl.json', order: 10, icon: '🏛️', accent: '#4f46e5' },
  'TSA Bách Khoa': { slug: 'dgnl', bundle: 'dgnl.json', order: 11, icon: '🧩', accent: '#7c3aed' },
  'SPT & BCA': { slug: 'dgnl', bundle: 'dgnl.json', order: 12, icon: '🛡️', accent: '#0f766e' }
};

const TEACHER_OVERRIDES = {
  13: { id: '2k9-toan-thay-do-van-duc', teacher: 'Thầy Đỗ Văn Đức', tag: 'Trọn Bộ Lộ Trình TENS (Khóa XN, T, E, S, N)', priority: 1 },
  14: { id: '2k9-toan-co-ngoc-huyen-lb', teacher: 'Cô Ngọc Huyền LB', tag: 'Trọn Bộ Lộ Trình 6 STEP (BON 2026)', priority: 2 },
  15: { id: '2k9-toan-thay-nguyen-quoc-chi', teacher: 'Thầy Nguyễn Quốc Chí', tag: 'Trọn Bộ Lộ Trình Toán 11 & 12 THPTQG', priority: 3 },
  16: { id: '2k9-toan-thay-nguyen-dang-ai-tdm', teacher: 'Thầy Nguyễn Đăng Ái (TDM)', tag: 'Trọn Bộ Lộ Trình Tư Duy Mở TDMX2026', priority: 4 },
  17: { id: '2k9-toan-thay-nguyen-phan-tien', teacher: 'Thầy Nguyễn Phan Tiến', tag: 'Lộ Trình M-A-R-T Toàn Diện & Toán Thực Tế', priority: 5 },
  18: { id: '2k9-toan-toan-nhom-mapstudy', teacher: 'Tổ Toán MAPSTUDY', tag: 'Trọn Bộ Lộ Trình Khóa I, M, O', priority: 6 },
  19: { id: '2k9-toan-thay-nguyen-tien-dat', teacher: 'Thầy Nguyễn Tiến Đạt', tag: 'Trọn Bộ Lộ Trình S1, S2, S3 (SSLIVE)', priority: 7 },
  20: { id: '2k9-toan-toan-anh-giao-kid', teacher: 'Anh Giáo Kid', tag: 'Trọn Bộ Lộ Trình SVIP (Khóa S, Tích Hợp, V)', priority: 8 },
  21: { id: '2k9-toan-toan-dpad-x-limc', teacher: 'Thầy Trịnh Đình Thành (DPAD)', tag: 'Trọn Bộ Lộ Trình XPS & Toán Thực Tế VDC', priority: 9 },
  22: { id: '2k9-toan-toan-anh-shipper-toan-2k9', teacher: 'Anh Shiper Toán', tag: 'Trọn Bộ Lộ Trình Toán 12 & Luyện Đề', priority: 10 },
  23: { id: '2k9-toan-thay-ho-thuc-thuan', teacher: 'Thầy Hồ Thức Thuận', tag: 'Trọn Bộ Lộ Trình Toán Live', priority: 11 },
  24: { id: '2k9-toan-giao-vien-huy-huong-noi', teacher: 'Thầy Huy Hướng Nội (TMT)', tag: 'Kho Tài Liệu & Đề Chuyên Đề PDF', priority: 12 },
  25: { id: '2k9-toan-toan-lxo', teacher: 'Toán LXO', tag: 'Các Buổi Học Về Toán Thực Tế Chuyên Sâu', priority: 13 },
  27: { id: '2k9-toan-khoa-bo-tro-casio', teacher: 'Khóa Bổ Trợ CASIO', tag: 'Kỹ Thuật Bấm Máy Tính Giải Nhanh Toán 12', priority: 14 },

  28: { id: '2k9-vat-li-thay-vu-ngoc-anh', teacher: 'Thầy Vũ Ngọc Anh', tag: 'Trọn Bộ Lộ Trình I-M-O-E & Cấp Tốc', priority: 1 },
  29: { id: '2k9-vat-li-thay-vu-tuan-anh', teacher: 'Thầy Vũ Tuấn Anh', tag: 'Trọn Bộ Lộ Trình CTG & Thực Chiến', priority: 2 },
  30: { id: '2k9-vat-li-thay-do-ngoc-ha', teacher: 'Thầy Đỗ Ngọc Hà', tag: 'Trọn Bộ Lộ Trình Vật Lí THPTQG', priority: 3 },
  31: { id: '2k9-vat-li-nhom-vat-ly-ipclass', teacher: 'IPCLASS (Thầy Thắng • Thầy Tiến)', tag: 'Full Lộ Trình Vật Lí 12 Toàn Diện', priority: 4 },
  32: { id: '2k9-vat-li-thay-vu-hoang-quan', teacher: 'Thầy Vũ Hoàng Quân', tag: 'Trọn Bộ Lộ Trình XPS Vật Lí', priority: 5 },
  33: { id: '2k9-vat-li-thay-chu-van-bien', teacher: 'Thầy Chu Văn Biên', tag: 'Các Khóa Chữa Đề & Kho Tài Liệu Vật Lí', priority: 6 },
  34: { id: '2k9-vat-li-thay-nguyen-dang-ai-bui-xuan-dat', teacher: 'Thầy Nguyễn Đăng Ái + Bùi Xuân Đạt', tag: 'Full Lộ Trình Vật Lí Tư Duy Mở TDM', priority: 7 },
  35: { id: '2k9-vat-li-le-tung-ung', teacher: 'Thầy Lê Tùng Ưng', tag: 'Khóa Cấp Tốc 15 Ngày Lý Thuyết Tổng Hợp', priority: 8 },

  36: { id: '2k9-hoa-hoc-thay-nguyen-anh-phong', teacher: 'Thầy Nguyễn Anh Phong (MAPSTUDY)', tag: 'Trọn Bộ Lộ Trình I-O-M-E (NAP)', priority: 1 },
  37: { id: '2k9-hoa-hoc-thay-pham-van-trong', teacher: 'Thầy Phạm Văn Trọng (TENS)', tag: 'Trọn Bộ Lộ Trình Chuyên Đề, T & E+N', priority: 2 },
  38: { id: '2k9-hoa-hoc-co-than-thi-lien', teacher: 'Cô Thân Thị Liên', tag: 'Trọn Bộ Lộ Trình Hóa Học Toàn Diện', priority: 3 },
  39: { id: '2k9-hoa-hoc-thay-pham-thang', teacher: 'Thầy Phạm Thắng (TYHH)', tag: 'Trọn Bộ Lộ Trình Lấy Gốc Đến 9+', priority: 4 },
  40: { id: '2k9-hoa-hoc-thay-pham-van-thuan', teacher: 'Thầy Phạm Văn Thuận', tag: 'Trọn Bộ Lộ Trình Hóa Học 12', priority: 5 },

  42: { id: '2k9-sinh-hoc-thay-phan-khac-nghe', teacher: 'Thầy Phan Khắc Nghệ', tag: 'Full Lộ Trình Sinh Học THPTQG', priority: 1 },
  43: { id: '2k9-sinh-hoc-sinh-hoc-co-tra-my', teacher: 'Cô Trà My (XPS)', tag: 'Full Lộ Trình Sinh Học Thực Chiến', priority: 2 },
  44: { id: '2k9-sinh-hoc-thay-truong-cong-kien', teacher: 'Thầy Trương Công Kiên (QANDA)', tag: 'Chuyên Đề & Luyện Đề Sinh Học', priority: 3 },
  45: { id: '2k9-sinh-hoc-thay-huynh-thanh-thao', teacher: 'Thầy Huỳnh Thanh Thảo', tag: 'Kho Tài Liệu PDF Cấp Tốc 15 Ngày', priority: 4 },

  48: { id: '2k9-tieng-anh-co-vu-thi-mai-phuong', teacher: 'Cô Vũ Thị Mai Phương', tag: 'Trọn Bộ Lộ Trình Pro3M & Plus Toàn Diện', priority: 1 },
  49: { id: '2k9-tieng-anh-co-pham-lieu-2027', teacher: 'Cô Phạm Liễu', tag: 'Trọn Bộ Lộ Trình TENS+ Tiếng Anh', priority: 2 },
  50: { id: '2k9-tieng-anh-co-trang-anh', teacher: 'Cô Trang Anh', tag: 'Khóa Giải Đề THPTQG', priority: 3 },

  51: { id: '2k9-ngu-van-co-suong-mai', teacher: 'Cô Sương Mai', tag: 'Full Lộ Trình Ngữ Văn & Đọc Hiểu 10/10', priority: 1 },
  52: { id: '2k9-ngu-van-chi-vo-pham-truc-linh-tts', teacher: 'Cô Võ Phạm Trúc Linh (TTS)', tag: 'Combo Lộ Trình Văn Đạt Điểm Cao', priority: 2 },
  53: { id: '2k9-ngu-van-co-tran-thuy-duong', teacher: 'Cô Trần Thùy Dương', tag: 'Full Lộ Trình Kỹ Năng Xử Lý & Luyện Đề', priority: 3 },

  54: { id: '2k9-lich-su-lich-su-co-sen', teacher: 'Cô Hương Sen', tag: 'Trọn Bộ Lộ Trình Live C, T, G Lịch Sử', priority: 1 },
  55: { id: '2k9-lich-su-co-ngo-thi-lan-huong', teacher: 'Cô Ngô Thị Lan Hương', tag: 'Trọn Bộ Lộ Trình A1, A2, A3 (ATSchool)', priority: 2 },

  56: { id: '2k9-dia-li-thay-dam-thanh-tung', teacher: 'Thầy Đàm Thanh Tùng', tag: 'Trọn Bộ Lộ Trình A1, A2, A3 (ATSchool)', priority: 1 },
  57: { id: '2k9-dia-li-thay-tai-qanda', teacher: 'Thầy Tài (QANDA)', tag: 'Trọn Bộ Giai Đoạn 1, 2, 3 Địa Lí 9+', priority: 2 },
  58: { id: '2k9-dia-li-co-mai-anh-lop-hoc-dia-ly', teacher: 'Cô Mai Anh', tag: 'Trọn Bộ Lộ Trình L1, L2, L3 (XPS)', priority: 3 },

  // DGNL V-ACT (Ưu tiên Empire Team #1!)
  64: { id: '2k9-dgnl-vact-empire-team', teacher: 'Empire Team (V-ACT HCM ★ Ưu Tiên #1)', tag: 'Trọn Bộ ĐGNL ĐHQG-HCM Empire Team (Ngôn Ngữ, Toán, Logic, Khoa Học)', priority: 1 },
  65: { id: '2k9-dgnl-vact-thay-bui-van-cong', teacher: 'Thầy Bùi Văn Công (V-ACT HCM)', tag: 'Lộ Trình MAX-G Tổng Ôn & Luyện Đề V-ACT', priority: 2 },
  66: { id: '2k9-dgnl-vact-mapstudy', teacher: 'MAPSTUDY (V-ACT HCM)', tag: 'Nền Tảng & Luyện Đề V-ACT MAPSTUDY', priority: 3 },
  67: { id: '2k9-dgnl-vact-hocmai', teacher: 'HOCMAI (V-ACT HCM)', tag: 'Luyện Thi ĐGNL TP.HCM Toàn Diện', priority: 4 },
  68: { id: '2k9-dgnl-vact-ts247', teacher: 'Tuyển Sinh 247 (V-ACT HCM)', tag: 'Chuyên Đề & Đề Thi Thử V-ACT', priority: 5 },

  // DGNL HSA
  59: { id: '2k9-dgnl-hsa-vnes', teacher: 'HSA VNES Pro', tag: 'Lộ Trình XPS HSA Tư Duy Định Lượng, Định Tính, Khoa Học', priority: 1 },
  60: { id: '2k9-dgnl-hsa-edu', teacher: 'HSA Education', tag: 'Khóa XPS & Chữa Sách ĐGNL ĐHQGHN', priority: 2 },
  61: { id: '2k9-dgnl-hsa-mapstudy', teacher: 'HSA MAPSTUDY', tag: 'Giai Đoạn Nền Tảng, Tổng Ôn & Luyện Đề HSA', priority: 3 },
  62: { id: '2k9-dgnl-hsa-ts247', teacher: 'HSA Tuyển Sinh 247', tag: 'Tổng Ôn Kiến Thức & Giải Đề HSA', priority: 4 },
  63: { id: '2k9-dgnl-hsa-hocmai', teacher: 'HSA HOCMAI', tag: 'Lộ Trình ĐGNL ĐHQG Hà Nội Toàn Diện', priority: 5 },

  // TSA Bách Khoa
  71: { id: '2k9-dgnl-tsa-ilp', teacher: 'ILP Edu (TSA Bách Khoa)', tag: 'XPS Đánh Giá Tư Duy ĐHBK Hà Nội (Toán, Đọc Hiểu, Khoa Học)', priority: 1 },
  70: { id: '2k9-dgnl-tsa-thay-nguyen-dang-ai-tdm', teacher: 'Thầy Nguyễn Đăng Ái (TDM TSA)', tag: 'Chủ Đề Số Học, Tư Duy Toán & Bổ Trợ TSA', priority: 2 },
  73: { id: '2k9-dgnl-tsa-bmc', teacher: 'BMC (TSA Bách Khoa)', tag: 'Lộ Trình Luyện Thi Đánh Giá Tư Duy Bách Khoa', priority: 3 },
  69: { id: '2k9-dgnl-tsa-ts247', teacher: 'Tuyển Sinh 247 (TSA)', tag: 'Tư Duy Toán Học & Đọc Hiểu Khoa Học', priority: 4 },
  72: { id: '2k9-dgnl-tsa-hocmai', teacher: 'HOCMAI (TSA)', tag: 'Lộ Trình ĐGTD ĐHBK Hà Nội', priority: 5 },

  // SPT & BCA
  76: { id: '2k9-dgnl-hsca-empire', teacher: 'Empire Team (Bổ Trợ H-SCA Sư Phạm)', tag: 'Khóa Bổ Trợ ĐGNL Chuyên Biệt Kì Thi Sư Phạm Empire', priority: 1 },
  74: { id: '2k9-dgnl-spt-hn-peda', teacher: 'Peda Edu (SPT ĐHSP Hà Nội)', tag: 'Đủ 8 Môn Nền Tảng & Luyện Đề SPT Hà Nội', priority: 2 },
  75: { id: '2k9-dgnl-hsca-hcm-peda', teacher: 'Peda Edu (H-SCA ĐHSP TP.HCM)', tag: 'Đủ 8 Môn Nền Tảng & Luyện Đề H-SCA TP.HCM', priority: 3 },
  77: { id: '2k9-dgnl-bca', teacher: 'Đề Thực Chiến ĐGNL Bộ Công An (BCA)', tag: 'Đề Thi Thực Chiến & Bài Giảng Chuyên Biệt BCA', priority: 4 }
};

function cleanLabel(s) {
  return String(s || '')
    .replace(/_?KHOAHOCMOI[^|\s—-]*/gi, '')
    .replace(/_?ZALO_[0-9]+/gi, '')
    .replace(/—\s*Trang tính\d+/gi, '')
    .replace(/\(Trang tính\d+\)/gi, '')
    .replace(/\bTrang tính\d+\b/gi, '')
    .replace(/^[\s|—–-]+|[\s|—–-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shortenHint(hint) {
  let h = cleanLabel(hint);
  if (!h) return '';
  h = h
    .replace(/^(TỔNG HỢP BÀI GIẢNG|DANH SÁCH KHÓA HỌC|LỘ TRÌNH\s*:?|CHINH PHỤC)\s*/i, '')
    .replace(/\s*[-–—]\s*(THẦY|CÔ)\s+[^-–—]{3,35}$/i, '')
    .replace(/\s*\(202[567]\)$/i, '')
    .trim();
  if (h.length > 52) {
    const parts = h.split(/\s*[—|]\s*/);
    if (parts[0] && parts[0].length >= 6 && parts[0].length <= 52) return parts[0].trim();
    return h.slice(0, 49).trim() + '…';
  }
  return h;
}

function isGarbageSection(sec) {
  const s = cleanLabel(sec);
  if (!s) return true;
  if (/^(chính|sheet\d+|trang tính\d*)$/i.test(s)) return true;
  if (/(THỜI GIAN|STT|NGÀY)\s*\|\s*(Buổi|TÊN BÀI|NỘI DUNG)/i.test(s)) return true;
  if (/\|\s*(x|-|TÀI LIỆU|BÀI GIẢNG|ĐÁP ÁN)\s*(\||$)/i.test(s)) return true;
  return false;
}

function makeChapterTitle(hint, section) {
  const cleanSec = isGarbageSection(section) ? '' : cleanLabel(section);
  const cleanHint = cleanLabel(hint);
  const shortHint = shortenHint(hint);

  if (cleanSec && shortHint) {
    const secLow = cleanSec.toLowerCase();
    const hintLow = shortHint.toLowerCase();
    if (secLow === hintLow || secLow.includes(hintLow) || hintLow.includes(secLow)) {
      return cleanSec.length >= shortHint.length ? cleanSec : shortHint;
    }
    // Trim redundant pipe prefixes inside section if very long
    let secShow = cleanSec;
    if (secShow.includes(' | ')) {
      secShow = secShow.split(' | ').map(x => x.trim()).filter(x => x && !/^(x|-|video|tài liệu|đáp án)$/i.test(x)).join(' — ');
    }
    return `[${shortHint}] ${secShow}`.slice(0, 140);
  }
  return (cleanSec || cleanHint || 'Chuyên đề & Bài giảng tổng hợp').slice(0, 140);
}

function normTitleForMatch(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(tài liệu|đề|đáp án|bản viết tay|bài giảng|video|file|pdf|chữa)\b/g, ' ')
    .replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/gi, ' ')
    .trim();
}

function buildChaptersForTeacher(row, courseId) {
  const chapterOrder = [];
  const chapterMap = new Map();

  function getBucket(hint, section) {
    const chTitle = makeChapterTitle(hint, section);
    const key = chTitle.toLowerCase();
    if (!chapterMap.has(key)) {
      chapterMap.set(key, { title: chTitle, topics: [] });
      chapterOrder.push(key);
    }
    return chapterMap.get(key);
  }

  // 1. Add video lessons into their structured chapter buckets
  const seenKeys = new Set();
  for (const l of row.lessons || []) {
    const bucket = getBucket(l.chapterHint, l.section);
    const vidKey = l.videoId || l.driveVideoUrl || '';
    const dedupKey = `${bucket.title}::${vidKey}::${(l.title || '').toLowerCase()}`;
    if (vidKey && seenKeys.has(dedupKey)) continue;
    if (vidKey) seenKeys.add(dedupKey);

    const ep = Array.isArray(l.extraPdfs) && l.extraPdfs.length ? l.extraPdfs : undefined;
    bucket.topics.push({
      title: l.title || 'Bài giảng chuyên đề',
      v: l.videoId || undefined,
      dv: (!l.videoId && l.driveVideoUrl) ? l.driveVideoUrl : undefined,
      p: l.pdfUrl || undefined,
      sp: l.solutionPdfUrl || undefined,
      ep,
      s: isGarbageSection(l.section) ? cleanLabel(l.chapterHint) : cleanLabel(l.section)
    });
  }

  // 2. Pair PDF-only rows with matching lesson in the same chapter (missing p/sp), else append as PDF topic in exact chapter
  for (const pr of row.pdfRows || []) {
    if (/\(Responses\)|Form Responses|SHEET CHIA BÀI|KẾT QUẢ ĐỀ.*BÀI LUYỆN VIẾT/i.test(pr.chapterHint || '')) continue;
    const bucket = getBucket(pr.chapterHint, pr.section);
    const pdfs = (pr.pdfs || []).filter(p => p && p.url);
    if (!pdfs.length) continue;

    const prNorm = normTitleForMatch(pr.title);
    let matchedTopic = null;
    if (prNorm.length >= 6) {
      matchedTopic = bucket.topics.find(t => {
        if (t.k === 'pdf') return false;
        const tNorm = normTitleForMatch(t.title);
        return tNorm === prNorm || (tNorm.length >= 10 && prNorm.length >= 10 && (tNorm.includes(prNorm) || prNorm.includes(tNorm)));
      });
    }

    if (matchedTopic) {
      const existingUrls = new Set([matchedTopic.p, matchedTopic.sp, ...(matchedTopic.ep || []).map(x => x.url)].filter(Boolean));
      for (const p of pdfs) {
        if (existingUrls.has(p.url)) continue;
        existingUrls.add(p.url);
        const isSol = /viết tay|đáp án|lời giải|key|hdg|chi tiết|sol/i.test(p.label || '');
        if (!matchedTopic.p && !isSol) matchedTopic.p = p.url;
        else if (!matchedTopic.sp && isSol) matchedTopic.sp = p.url;
        else {
          matchedTopic.ep = matchedTopic.ep || [];
          matchedTopic.ep.push({ label: p.label || 'Tài liệu PDF kèm theo', url: p.url });
        }
      }
    } else {
      const mainPdf = pdfs.find(p => !/viết tay|đáp án|lời giải|key|hdg|chi tiết|sol/i.test(p.label || '')) || pdfs[0];
      const solPdf = pdfs.find(p => p !== mainPdf && /viết tay|đáp án|lời giải|key|hdg|chi tiết|sol/i.test(p.label || ''))
        || (pdfs.length > 1 ? pdfs.find(p => p !== mainPdf) : null);
      const extras = pdfs.filter(p => p !== mainPdf && p !== solPdf).map(p => ({ label: p.label || 'Tài liệu PDF', url: p.url }));
      const dedupPdfKey = `${bucket.title}::PDF::${mainPdf.url}::${(pr.title || '').toLowerCase()}`;
      if (seenKeys.has(dedupPdfKey)) continue;
      seenKeys.add(dedupPdfKey);

      bucket.topics.push({
        title: pr.title || 'Tài liệu PDF chuyên đề',
        p: mainPdf.url,
        sp: solPdf ? solPdf.url : undefined,
        ep: extras.length ? extras : undefined,
        s: isGarbageSection(pr.section) ? cleanLabel(pr.chapterHint) : cleanLabel(pr.section),
        k: 'pdf'
      });
    }
  }

  // Optional cleanup for extreme micro-fragmentation (e.g., Empire V-ACT with >150 tiny 1-2 topic sub-sections)
  let rawChapters = [];
  for (const key of chapterOrder) {
    const b = chapterMap.get(key);
    if (b.topics.length) rawChapters.push(b);
  }
  if (rawChapters.length > 150) {
    const merged = [];
    const byHintBucket = new Map();
    for (const b of rawChapters) {
      const mHint = b.title.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (b.topics.length <= 2 && mHint) {
        const hintName = mHint[1];
        if (!byHintBucket.has(hintName)) {
          const obj = { title: `[${hintName}] Tổng hợp Chuyên đề & Chủ đề`, topics: [] };
          byHintBucket.set(hintName, obj);
          merged.push(obj);
        }
        byHintBucket.get(hintName).topics.push(...b.topics);
      } else {
        merged.push(b);
      }
    }
    rawChapters = merged;
  }

  // Assign clean sequential chapter & topic IDs
  const idPrefix = courseId.toUpperCase().replace(/[^A-Z0-9]+/g, '-');
  const chapters = [];
  rawChapters.forEach((b) => {
    if (!b.topics.length) return;
    const chNum = chapters.length + 1;
    const cleanTopics = b.topics.map((t, tIdx) => {
      const out = {
        id: `${idPrefix}-C${chNum}-${tIdx + 1}`,
        title: t.title
      };
      if (t.v) out.v = t.v;
      if (t.dv) out.dv = t.dv;
      if (t.p) out.p = t.p;
      if (t.sp) out.sp = t.sp;
      if (t.ep && t.ep.length) out.ep = t.ep;
      if (t.s) out.s = t.s;
      if (t.k) out.k = t.k;
      return out;
    });
    chapters.push({
      id: `c${chNum}`,
      title: b.title,
      topics: cleanTopics
    });
  });

  return chapters;
}

function main() {
  const cleanRaw = JSON.parse(fs.readFileSync(path.join(SCRATCH_DIR, '2k8-teachers-clean.json'), 'utf8'));
  const bundles = {
    'toan.json': {},
    'vat-li.json': {},
    'hoa-hoc.json': {},
    'sinh-hoc.json': {},
    'tieng-anh.json': {},
    'ngu-van.json': {},
    'lich-su.json': {},
    'dia-li.json': {},
    'dgnl.json': {}
  };

  const manifestEntries = [];

  for (const r of cleanRaw) {
    if (!r.ok) continue;
    const meta = SUBJECT_META[r.subject];
    if (!meta) continue;
    const ov = TEACHER_OVERRIDES[r.row];
    if (!ov) continue;

    const chapters = buildChaptersForTeacher(r, ov.id);
    if (!chapters.length) continue;

    let topicCount = 0;
    let videoCount = 0;
    const pdfUrls = new Set();
    for (const ch of chapters) {
      for (const t of ch.topics) {
        topicCount++;
        if (t.v || t.dv) videoCount++;
        if (t.p) pdfUrls.add(t.p);
        if (t.sp) pdfUrls.add(t.sp);
        if (t.ep) t.ep.forEach(x => { if (x.url) pdfUrls.add(x.url); });
      }
    }
    if (topicCount === 0) continue;

    bundles[meta.bundle][ov.id] = chapters;

    const pdfCount = pdfUrls.size;
    const isDgnl = meta.slug === 'dgnl';
    const subjLabel = isDgnl ? r.subject : `${r.subject} 12`;
    manifestEntries.push({
      _priority: ov.priority,
      id: ov.id,
      grade: '2K9',
      subject: r.subject,
      subjectSlug: meta.slug,
      subjectOrder: meta.order,
      icon: meta.icon,
      accent: meta.accent,
      teacher: ov.teacher,
      courseTag: ov.tag,
      name: `${subjLabel} — ${ov.teacher}`,
      shortName: ov.teacher,
      desc: `${ov.tag}. Gồm ${chapters.length} chương/chủ đề, ${videoCount} video bài giảng & ${pdfCount} tài liệu PDF kèm theo (công khai 100%, mọi Gmail đều học được).`,
      topicCount,
      videoCount,
      pdfFileCount: pdfCount,
      chapterCount: chapters.length,
      dataFile: `/assets/2k9-teachers/${meta.bundle}`,
      chapters: []
    });
  }

  manifestEntries.sort((a, b) => (a.subjectOrder - b.subjectOrder) || (a._priority - b._priority));
  manifestEntries.forEach(m => delete m._priority);

  // Write JSON bundles
  for (const [fn, obj] of Object.entries(bundles)) {
    const fp = path.join(BUNDLES_DIR, fn);
    fs.writeFileSync(fp, JSON.stringify(obj));
    const sizeKb = (fs.statSync(fp).size / 1024).toFixed(1);
    console.log(`Wrote ${fn}: ${Object.keys(obj).length} teachers (${sizeKb} KB)`);
  }

  // Write manifest JS
  const totalTeachers = manifestEntries.length;
  const totalTopics = manifestEntries.reduce((s, c) => s + c.topicCount, 0);
  const totalVideos = manifestEntries.reduce((s, c) => s + c.videoCount, 0);
  const totalPdfs = manifestEntries.reduce((s, c) => s + c.pdfFileCount, 0);

  const manifestJs = `/* ============================================================================
 * HỌC CÙNG PHÚC K9 — MULTI-TEACHER FULL CATALOG MANIFEST (${totalTeachers} KHÓA / THẦY CÔ)
 * Tổ chức theo 3 cấp: Chọn Môn / ĐGNL → Chọn Thầy Cô → Chương / Chủ đề / Bài + PDF
 * Nguồn: Kho Công Khai 100% (Mọi tài khoản đều xem video & tải PDF không bị 403)
 * Tổng: ${totalTopics} bài học | ${totalVideos} video | ${totalPdfs} tài liệu PDF
 * ============================================================================ */
(function (window) {
  'use strict';
  const existing = Array.isArray(window.PK9_CATALOG) ? window.PK9_CATALOG : [];
  const withoutOld2k9 = existing.filter(c => c.grade !== '2K9');
  const full2k9 = ${JSON.stringify(manifestEntries, null, 2)};

  window.PK9_CATALOG = [...full2k9, ...withoutOld2k9];
  console.log('[PK9] Clean public multi-teacher catalog initialized: ' + full2k9.length + ' courses, total catalog: ' + window.PK9_CATALOG.length + ' courses');
})(window);
`;
  fs.writeFileSync(path.join(APP_DIR, 'assets/pk9-2k9-manifest.js'), manifestJs, 'utf8');
  console.log(`\nWrote pk9-2k9-manifest.js: ${totalTeachers} courses, ${totalTopics} topics, ${totalVideos} videos, ${totalPdfs} PDFs`);
}

main();
