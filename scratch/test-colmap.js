const { readTab } = require('./crawler-lib');
const res = readTab('1TxRHSty_UPaCb2uOdonhev2vx7Yp3TyyprdGVrqY7mw', 'LIVE I ĐỢT 2');

let headerIdx = -1;
let colMap = { title: 1, video: 3, pdf: 2, solPdf: 4, note: 5 };

for (let i = 0; i < Math.min(res.vals.length, 10); i++) {
  const rVals = (res.vals[i] || []).join(' ').toUpperCase();
  if (rVals.includes('BÀI HỌC') || rVals.includes('BÀI GIẢNG') || rVals.includes('TÀI LIỆU') || rVals.includes('VIDEO') || rVals.includes('NỘI DUNG')) {
    headerIdx = i;
    (res.vals[i] || []).forEach((c, idx) => {
      const cu = c.toUpperCase();
      console.log(`Cell ${idx}: "${c}" -> uppercase "${cu}"`);
      if (cu.includes('TÊN BÀI') || cu.includes('BÀI HỌC') || cu.includes('NỘI DUNG') || cu.includes('CHỦ ĐỀ')) colMap.title = idx;
      else if (cu.includes('BÀI GIẢNG') || cu.includes('VIDEO') || cu === 'VIEW') colMap.video = idx;
      else if (cu.includes('TÀI LIỆU') || cu.includes('ĐỀ BÀI') || cu.includes('FILE')) colMap.pdf = idx;
      else if (cu.includes('VIẾT TAY') || cu.includes('ĐÁP ÁN') || cu.includes('LỜI GIẢI')) colMap.solPdf = idx;
      else if (cu.includes('GHI CHÚ') || cu.includes('NOTE') || cu.includes('LƯU Ý')) colMap.note = idx;
    });
    break;
  }
}
console.log('headerIdx:', headerIdx, 'colMap:', colMap);
