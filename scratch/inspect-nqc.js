const fs = require('fs');
const d = JSON.parse(fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/scratch/cache-tabs/1eZ4u9_s2MF5TfxXG8o368CDl0u1IwS8hCrO1hiRw270_KHÓA_KIẾN_THỨC_NỀN_TẢNG_LỚP_12_-_2009.json', 'utf8'));
for (let i = 6; i < 16; i++) {
  console.log('Row ' + i + ' VALS : ' + JSON.stringify(d.vals[i]));
  console.log('Row ' + i + ' LINKS: ' + JSON.stringify(d.links[i]));
}
