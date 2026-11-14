const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');

// 1. Check all bundle files exist and are valid JSON
const bundleFiles = ['toan.json', 'vat-li.json', 'hoa-hoc.json', 'sinh-hoc.json', 'tieng-anh.json', 'ngu-van.json', 'lich-su.json', 'dia-li.json', 'dgnl.json'];
const bundles = {};

console.log('--- Step 1: Validating JSON bundles ---');
bundleFiles.forEach(file => {
  const fp = path.join(baseDir, 'assets/2k9-teachers', file);
  if (!fs.existsSync(fp)) throw new Error(`Missing bundle: ${file}`);
  const content = fs.readFileSync(fp, 'utf8');
  bundles[file] = JSON.parse(content);
  console.log(`✓ ${file}: ${Object.keys(bundles[file]).length} teachers, ${(fs.statSync(fp).size / 1024).toFixed(1)} KB`);
});

// 2. Validate manifest
console.log('\n--- Step 2: Validating pk9-2k9-manifest.js ---');
const manifestContent = fs.readFileSync(path.join(baseDir, 'assets/pk9-2k9-manifest.js'), 'utf8');
const window = {};
eval(manifestContent);
const catalog2k9 = (window.PK9_CATALOG || []).filter(c => c.grade === '2K9');
console.log(`✓ Manifest loaded: ${catalog2k9.length} 2K9 teacher courses`);

// 3. Verify each course in manifest can find its data in the respective bundle
console.log('\n--- Step 3: Verifying course <-> bundle binding ---');
let totalVerifiedTopics = 0;
let totalVerifiedVideos = 0;
let totalVerifiedPdfs = 0;
let totalVerifiedChapters = 0;

catalog2k9.forEach(course => {
  const bundleFilename = path.basename(course.dataFile);
  const bundle = bundles[bundleFilename];
  if (!bundle) {
    throw new Error(`Course ${course.id} references missing bundle file: ${course.dataFile}`);
  }
  const chapters = bundle[course.id];
  if (!Array.isArray(chapters) || chapters.length === 0) {
    throw new Error(`Course ${course.id} (${course.name}) has no chapters in ${bundleFilename}`);
  }

  totalVerifiedChapters += chapters.length;

  chapters.forEach((ch, chIdx) => {
    if (!ch.title) throw new Error(`Course ${course.id} chapter ${chIdx} missing title`);
    if (!Array.isArray(ch.topics) || ch.topics.length === 0) {
      throw new Error(`Course ${course.id} chapter ${ch.title} has empty topics`);
    }

    ch.topics.forEach((top, topIdx) => {
      totalVerifiedTopics++;
      if (!top.title) throw new Error(`Course ${course.id} topic ${topIdx} missing title`);
      if (top.v) {
        totalVerifiedVideos++;
        if (top.v.length !== 11) {
          console.warn(`Warning: YouTube ID might not be 11 chars: "${top.v}" in ${course.id}`);
        }
      } else if (top.dv) {
        totalVerifiedVideos++;
      }
      if (top.p) totalVerifiedPdfs++;
      if (top.sp) totalVerifiedPdfs++;
    });
  });
});

console.log(`✓ All ${catalog2k9.length} courses successfully verified!`);
console.log(`  - Total Chapters: ${totalVerifiedChapters}`);
console.log(`  - Total Topics/Lessons: ${totalVerifiedTopics}`);
console.log(`  - Total Videos: ${totalVerifiedVideos}`);
console.log(`  - Total PDFs: ${totalVerifiedPdfs}`);

// 4. Check HTML and SW files
console.log('\n--- Step 4: Validating HTML, SW, vercel.json ---');
const indexHtml = fs.readFileSync(path.join(baseDir, 'index.html'), 'utf8');
const indexOriginal = fs.readFileSync(path.join(baseDir, 'index.original.html'), 'utf8');
const swJs = fs.readFileSync(path.join(baseDir, 'sw.js'), 'utf8');
const swOriginal = fs.readFileSync(path.join(baseDir, 'sw.original.js'), 'utf8');

if (!indexHtml.includes('pk9-2k9-manifest.js')) throw new Error('index.html missing pk9-2k9-manifest.js');
if (!indexOriginal.includes('pk9-2k9-manifest.js')) throw new Error('index.original.html missing pk9-2k9-manifest.js');
if (!swJs.includes('phuc-k9-ecosystem-v46')) throw new Error('sw.js cache version not bumped');
if (!swOriginal.includes('phuc-k9-ecosystem-v46')) throw new Error('sw.original.js cache version not bumped');

console.log('✓ Service workers and HTML versions are fully synced!');
console.log('\n=== ALL ECOSYSTEM VERIFICATIONS PASSED WITH 100% SUCCESS ===');
