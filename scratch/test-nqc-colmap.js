const { readTab } = require('./crawler-lib');
const d = readTab('1eZ4u9_s2MF5TfxXG8o368CDl0u1IwS8hCrO1hiRw270', 'KHÓA_KIẾN_THỨC_NỀN_TẢNG_LỚP_12_-_2009');

const keywords = ['BÀI HỌC', 'TÊN BÀI', 'NỘI DUNG', 'TÀI LIỆU', 'BÀI GIẢNG', 'VIDEO', 'VIẾT TAY', 'ĐÁP ÁN', 'GHI CHÚ', 'TRẠNG THÁI', 'GIẢI BTVN'];

let headerIdx = -1;
let colMap = { title: 1, video: 3, pdf: 2, solPdf: 4, note: 5 };

for (let i = 0; i < Math.min(d.vals.length, 10); i++) {
  const row = d.vals[i] || [];
  const cellsWithText = row.filter(c => c && c.trim().length > 0);
  if (cellsWithText.length < 3) continue;

  const rVals = row.join(' ').toUpperCase();
  if (rVals.includes('FIX LỖI') || rVals.includes('RIÊNG TƯ')) continue;

  const matchCount = keywords.filter(w => rVals.includes(w)).length;
  if (matchCount >= 2) {
    headerIdx = i;
    row.forEach((c, idx) => {
      const cu = c.toUpperCase();
      console.log('Cell ' + idx + ': ' + c);
      if (cu.includes('TÊN BÀI') || cu.includes('BÀI HỌC') || cu.includes('NỘI DUNG') || cu.includes('CHỦ ĐỀ')) colMap.title = idx;
      else if (cu.includes('BÀI GIẢNG') || cu.includes('VIDEO') || cu === 'VIEW') colMap.video = idx;
      else if (cu.includes('TÀI LIỆU') || cu.includes('ĐỀ BÀI') || cu.includes('FILE')) colMap.pdf = idx;
      else if (cu.includes('VIẾT TAY') || cu.includes('ĐÁP ÁN') || cu.includes('LỜI GIẢI') || cu.includes('GIẢI BTVN')) colMap.solPdf = idx;
      else if (cu.includes('GHI CHÚ') || cu.includes('NOTE') || cu.includes('LƯU Ý')) colMap.note = idx;
    });
    break;
  }
}
console.log('headerIdx:', headerIdx, 'colMap:', colMap);
