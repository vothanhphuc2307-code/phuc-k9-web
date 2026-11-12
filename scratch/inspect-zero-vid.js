const fs = require('fs');
const files = fs.readdirSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/scratch/cache-tabs');
console.log('Total cached tab files:', files.length);

const testIds = [
  '1UjcZm95UR3gdPAtZzlu7ImV2TqccI0e7R9dHFgk4U48', // Ngoc Huyen LB
  '1eZ4u9_s2MF5TfxXG8o368CDl0u1IwS8hCrO1hiRw270', // Nguyen Quoc Chi
  '1QXRVaP6-oXJAlCAFafvHhMsjnF-X5xDFttI-LQU2iGQ'  // Vu Tuan Anh
];

files.filter(f => testIds.some(id => f.includes(id))).forEach(f => {
  const d = JSON.parse(fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/scratch/cache-tabs/' + f, 'utf8'));
  console.log('\n=== File: ' + f + ' (rows: ' + d.vals.length + ') ===');
  for (let i = 0; i < Math.min(d.vals.length, 6); i++) {
    console.log('Row ' + i + ' VALS : ' + JSON.stringify(d.vals[i]));
    console.log('Row ' + i + ' LINKS: ' + JSON.stringify(d.links[i] ? d.links[i].filter(c => c && c.startsWith('http')) : []));
  }
});
