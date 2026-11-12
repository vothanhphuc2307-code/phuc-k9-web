const { readTab, parseTabToChapters } = require('./crawler-lib');

const res = readTab('1TxRHSty_UPaCb2uOdonhev2vx7Yp3TyyprdGVrqY7mw', 'LIVE I ĐỢT 2');
console.log('Read tab success, vals length:', res.vals.length);
const chs = parseTabToChapters(res);
console.log('Parsed chapters count:', chs.length);
chs.slice(0, 3).forEach((c, i) => {
  console.log(`Ch ${i + 1}: ${c.title} (${c.topics.length} topics)`);
  c.topics.slice(0, 2).forEach((t, j) => {
    console.log(`  Top ${j + 1}: ${t.title} | vid: ${t.vidInfo ? (t.vidInfo.id || 'drive') : 'none'} | pdf: ${Boolean(t.pdfUrl)} | sol: ${Boolean(t.solPdfUrl)}`);
  });
});
