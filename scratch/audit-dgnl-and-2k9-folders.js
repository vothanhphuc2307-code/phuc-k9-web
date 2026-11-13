const https = require('https');
const fs = require('fs');
const path = require('path');

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', c => { if (body.length < 6000) body += c; });
      res.on('end', () => {
        const loc = res.headers.location || '';
        const blocked = res.statusCode === 401 || res.statusCode === 403 ||
          loc.includes('accounts.google.com') || body.includes('ServiceLogin') || body.includes('You need access');
        resolve({ status: res.statusCode, ok: (res.statusCode >= 200 && res.statusCode < 400 && !blocked), loc: loc.slice(0, 80), len: body.length, hasEntries: body.includes('flip-entry') });
      });
    });
    req.on('error', e => resolve({ status: 0, ok: false, err: e.message }));
    req.setTimeout(7000, () => { req.destroy(); resolve({ status: 0, ok: false, err: 'timeout' }); });
  });
}

async function checkYoutube(ytId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`;
  const r = await checkUrl(url);
  return r.status === 200;
}

async function main() {
  const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';
  const dgnl = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k8-dgnl-raw.json'), 'utf8'));
  console.log('=== 2K8 DGNL RAW PUBLIC AUDIT ===');
  for (let i = 0; i < dgnl.length; i++) {
    const r = dgnl[i];
    const lessons = r.lessons || [];
    const yt = lessons.find(l => l.videoId)?.videoId;
    const dv = lessons.find(l => l.driveVideoUrl)?.driveVideoUrl;
    const pdf = lessons.find(l => l.pdfUrl)?.pdfUrl;
    const [ytOk, dvOk, pdfOk] = await Promise.all([
      yt ? checkYoutube(yt) : null,
      dv ? checkUrl(dv).then(x => x.ok) : null,
      pdf ? checkUrl(pdf).then(x => x.ok) : null,
    ]);
    console.log(`${i}. [${r.examGroup}] ${r.teacher} | L=${lessons.length} | YT=${ytOk} DV=${dvOk} PDF=${pdfOk}`);
  }

  console.log('\n=== 2K9 CURRENT FOLDERS / EMBEDDEDFOLDERVIEW AUDIT ===');
  const baseDir = 'C:/Users/Admin/.gemini/antigravity/scratch/phuc-k9-web';
  const manifestRaw = fs.readFileSync(path.join(baseDir, 'assets/pk9-2k9-manifest.js'), 'utf8');
  const window = {};
  eval(manifestRaw);
  const catalog2k9 = (window.PK9_CATALOG || []).filter(c => c.grade === '2K9');
  const bundleCache = {};
  for (const c of catalog2k9) {
    const fn = path.basename(c.dataFile);
    if (!bundleCache[fn]) {
      bundleCache[fn] = JSON.parse(fs.readFileSync(path.join(baseDir, 'assets/2k9-teachers', fn), 'utf8'));
    }
    const chs = bundleCache[fn][c.id] || [];
    let folderUrl = null;
    for (const ch of chs) {
      for (const t of ch.topics || []) {
        for (const u of [t.dv, t.p, t.sp, ...(t.ep || []).map(x => x.url)]) {
          if (u && u.includes('/folders/') && !folderUrl) folderUrl = u;
        }
      }
    }
    if (folderUrl) {
      const m = folderUrl.match(/\/folders\/([A-Za-z0-9_-]+)/);
      if (m) {
        const emb = `https://drive.google.com/embeddedfolderview?id=${m[1]}#list`;
        const res = await checkUrl(emb);
        console.log(`Folder [${c.subject}] ${c.id}: status=${res.status} ok=${res.ok} hasEntries=${res.hasEntries} loc=${res.loc}`);
      }
    }
  }
}

main();
