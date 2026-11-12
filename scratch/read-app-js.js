const fs = require('fs');
const js = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/assets/pk9-app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('dataFile') || l.includes('subjectSlug') || (l.includes('2K9') && l.includes('render'))) {
    console.log('L' + (idx+1) + ': ' + l.slice(0, 120));
  }
});
