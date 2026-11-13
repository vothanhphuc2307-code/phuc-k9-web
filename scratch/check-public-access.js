const https = require('https');
const fs = require('fs');
const path = require('path');

function checkPublicUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', chunk => { if (body.length < 4000) body += chunk; });
      res.on('end', () => {
        const blocked = res.statusCode === 401 || res.statusCode === 403 ||
          (res.headers.location && res.headers.location.includes('accounts.google.com')) ||
          body.includes('ServiceLogin') || body.includes('You need access');
        resolve({ url, status: res.statusCode, location: res.headers.location || '', publicOk: res.statusCode === 200 && !blocked });
      });
    });
    req.on('error', err => resolve({ url, status: 0, err: err.message, publicOk: false }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ url, status: 0, err: 'timeout', publicOk: false }); });
  });
}

async function main() {
  const baseDir = 'C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web';
  const toan2k9 = JSON.parse(fs.readFileSync(path.join(baseDir, 'assets/2k9-teachers/toan.json'), 'utf8'));
  const vatli2k9 = JSON.parse(fs.readFileSync(path.join(baseDir, 'assets/2k9-teachers/vat-li.json'), 'utf8'));

  const samples = [];
  // Pick a few Drive PDFs, Drive folders, Drive videos, YouTube videos from 2K9
  for (const teacherId of ['2k9-toan-thay-do-van-duc', '2k9-toan-thay-nguyen-quoc-chi', '2k9-toan-toan-anh-shipper-toan-2k9', '2k9-toan-toan-anh-giao-kid']) {
    const chs = toan2k9[teacherId] || [];
    for (const ch of chs) {
      for (const t of ch.topics || []) {
        if (t.p && samples.filter(s => s.teacher === teacherId && s.type === 'pdf').length < 2) {
          samples.push({ teacher: teacherId, type: 'pdf', url: t.p });
        }
        if (t.dv && samples.filter(s => s.teacher === teacherId && s.type === 'driveVid').length < 2) {
          samples.push({ teacher: teacherId, type: 'driveVid', url: t.dv });
        }
      }
    }
  }
  for (const teacherId of ['2k9-vat-li-thay-vu-ngoc-anh']) {
    const chs = vatli2k9[teacherId] || [];
    for (const ch of chs) {
      for (const t of ch.topics || []) {
        if (t.p && samples.filter(s => s.teacher === teacherId && s.type === 'pdf').length < 2) {
          samples.push({ teacher: teacherId, type: 'pdf', url: t.p });
        }
        if (t.dv && samples.filter(s => s.teacher === teacherId && s.type === 'driveVid').length < 2) {
          samples.push({ teacher: teacherId, type: 'driveVid', url: t.dv });
        }
      }
    }
  }

  console.log('Testing', samples.length, '2K9 URLs anonymously (no cookies)...');
  for (const s of samples) {
    const r = await checkPublicUrl(s.url);
    console.log(`[${s.teacher}] (${s.type}) status=${r.status} publicOk=${r.publicOk} err=${r.err || ''} loc=${(r.location || '').slice(0, 60)} | ${s.url}`);
  }

  // Also test 2K8 URLs from pk9-2k8-curated.js!
  const curatedJs = fs.readFileSync(path.join(baseDir, 'assets/pk9-2k8-curated.js'), 'utf8');
  const driveMatches = [...new Set(curatedJs.match(/https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/view/g) || [])].slice(0, 6);
  console.log('\nTesting', driveMatches.length, '2K8 URLs anonymously...');
  for (const url of driveMatches) {
    const r = await checkPublicUrl(url);
    console.log(`[2K8] status=${r.status} publicOk=${r.publicOk} err=${r.err || ''} loc=${(r.location || '').slice(0, 60)} | ${url}`);
  }
}

main();
