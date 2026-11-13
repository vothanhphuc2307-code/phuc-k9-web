const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchStatus(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', c => { if (body.length < 15000) body += c; });
      res.on('end', () => {
        const loc = res.headers.location || '';
        resolve({ status: res.statusCode, loc, title: (body.match(/<title>([^<]*)<\/title>/i) || [])[1] || '', hasUnavail: body.includes('Video unavailable') || body.includes('This video is private') || body.includes('không có sẵn') || body.includes('riêng tư'), len: body.length });
      });
    });
    req.on('error', e => resolve({ status: 0, err: e.message }));
    req.setTimeout(6000, () => { req.destroy(); resolve({ status: 0, err: 'timeout' }); });
  });
}

async function main() {
  const scratchDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\97a6eb3b-ad3c-48ab-a848-5c4e26b20cb7\\scratch';
  const dgnl = JSON.parse(fs.readFileSync(path.join(scratchDir, '2k8-dgnl-raw.json'), 'utf8'));
  const checks = [
    ['Empire V-ACT YT', `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${dgnl[0].lessons[0].videoId}&format=json`],
    ['Empire V-ACT Watch', `https://www.youtube.com/watch?v=${dgnl[0].lessons[0].videoId}`],
    ['Bui Van Cong YT', `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${dgnl[1].lessons[0].videoId}&format=json`],
    ['Bui Van Cong Watch', `https://www.youtube.com/watch?v=${dgnl[1].lessons[0].videoId}`],
    ['Empire HSCA YT', `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${dgnl[9].lessons[0].videoId}&format=json`],
    ['Empire HSCA Watch', `https://www.youtube.com/watch?v=${dgnl[9].lessons[0].videoId}`],
    ['BCA YT', `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${dgnl[12].lessons[0].videoId}&format=json`],
    ['Toan Thuong Hocmai', 'https://drive.google.com/file/d/1rPxrhYKE7zwrRcel-n_PlgmXTdRxuf7O/view'],
    ['Vu Khac Ngoc Hocmai', 'https://drive.google.com/file/d/1Ej2zMfgVryOCJRt-_r8AnbD-TNOj3g6p/view'],
    ['Sinh Hocmai', 'https://drive.google.com/file/d/1yWRG_iTgo67pR_qg_YTLQHDM18UJn3R0/view'],
    ['Co Trang Anh Doc', 'https://docs.google.com/document/d/1nrVWTa5JLdoy3n8PJApGtvgb5oBTYCw_uKkVkPuuWWE/view'],
  ];
  for (const [lbl, u] of checks) {
    const r = await fetchStatus(u);
    console.log(lbl, '=>', JSON.stringify(r));
  }
}

main();
