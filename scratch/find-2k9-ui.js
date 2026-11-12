const fs = require('fs');
const js = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/assets/pk9-app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('render2k9') || l.includes('2K9_SUBJECT') || l.includes('subject ===') || l.includes('toan') && l.includes('vat-li')) {
    console.log('L' + (i+1) + ': ' + l.slice(0, 120));
  }
});
