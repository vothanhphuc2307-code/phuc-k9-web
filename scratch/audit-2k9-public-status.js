const https = require('https');
const fs = require('fs');
const path = require('path');

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', c => { if (body.length < 3000) body += c; });
      res.on('end', () => {
        const loc = res.headers.location || '';
        const blocked = res.statusCode === 401 || res.statusCode === 403 ||
          loc.includes('accounts.google.com') || body.includes('ServiceLogin') || body.includes('You need access');
        resolve({ status: res.statusCode, ok: (res.statusCode >= 200 && res.statusCode < 400 && !blocked), loc: loc.slice(0, 50) });
      });
    });
    req.on('error', e => resolve({ status: 0, ok: false, err: e.message }));
    req.setTimeout(6000, () => { req.destroy(); resolve({ status: 0, ok: false, err: 'timeout' }); });
  });
}

async function checkYoutube(ytId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`;
  const r = await checkUrl(url);
  return r.status === 200;
}

async function main() {
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
    let ytSample = null, dvSample = null, pdfFileSample = null, pdfFolderSample = null;
    for (const ch of chs) {
      for (const t of ch.topics || []) {
        if (t.v && !ytSample) ytSample = t.v;
        if (t.dv && !dvSample) dvSample = t.dv;
        if (t.p) {
          if (t.p.includes('/folders/') && !pdfFolderSample) pdfFolderSample = t.p;
          else if (!t.p.includes('/folders/') && !pdfFileSample) pdfFileSample = t.p;
        }
        if (t.sp && !t.sp.includes('/folders/') && !pdfFileSample) pdfFileSample = t.sp;
      }
    }
    const [ytOk, dvOk, pfOk, fldOk] = await Promise.all([
      ytSample ? checkYoutube(ytSample) : Promise.resolve(null),
      dvSample ? checkUrl(dvSample).then(r => r.ok) : Promise.resolve(null),
      pdfFileSample ? checkUrl(pdfFileSample).then(r => r.ok) : Promise.resolve(null),
      pdfFolderSample ? checkUrl(pdfFolderSample).then(r => r.ok) : Promise.resolve(null),
    ]);
    console.log(`[${c.subject}] ${c.id} | vids=${c.videoCount} pdfs=${c.pdfFileCount} | YT=${ytOk} DV=${dvOk} PDF_FILE=${pfOk} PDF_DIR=${fldOk}`);
  }
}

main();
