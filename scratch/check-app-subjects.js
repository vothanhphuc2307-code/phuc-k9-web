const fs = require('fs');
const js = fs.readFileSync('C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web/assets/pk9-app.js', 'utf8');

const m = js.match(/const\s+PK9_SUBJECTS\s*=\s*(\[[\s\S]*?\]);/);
if (m) {
  console.log('PK9_SUBJECTS:', m[1]);
} else {
  // Find where subjects are defined
  const lines = js.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('subjectSlug') || l.includes('subjectFilter') || l.includes('activeSubject')) {
      console.log('L' + (i+1) + ': ' + l.slice(0, 100));
    }
  });
}
