const fs = require('fs');
const path = require('path');

let cachedHtml = null;

function loadIndexHtml() {
  if (cachedHtml) return cachedHtml;
  const htmlPath = path.join(process.cwd(), 'index.html');
  cachedHtml = fs.readFileSync(htmlPath, 'utf8');
  return cachedHtml;
}

module.exports = async (req, res) => {
  try {
    const rawHost =
      (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const safeHost = /^[A-Za-z0-9.-]+(?::\d{1,5})?$/.test(rawHost) ? rawHost : '';
    const rawProto =
      (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim().toLowerCase();
    const proto = safeHost && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(safeHost) && rawProto === 'http'
      ? 'http'
      : 'https';
    const origin = safeHost ? `${proto}://${safeHost}` : '';

    let html = loadIndexHtml();

    const parsedUrl = new URL(req.url || '/', origin || 'https://thanhphuc.vercel.app');
    const rawCard = String((req.query && req.query.card) || parsedUrl.searchParams.get('card') || '').trim();
    const safeCard = rawCard.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 48);

    if (origin) {
      const ogImageUrl = `${origin}/assets/og-phuc-k9.jpg?v=2026`;
      const ogTargetUrl = safeCard ? `${origin}/u/${encodeURIComponent(safeCard)}` : `${origin}/`;
      html = html
        .replace(
          /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:url" content="${ogTargetUrl}" />`
        )
        .replace(
          /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:image" content="${ogImageUrl}" />`
        )
        .replace(
          /<meta\s+property="og:image:secure_url"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:image:secure_url" content="${ogImageUrl}" />`
        )
        .replace(
          /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:image" content="${ogImageUrl}" />`
        );
    }

    if (safeCard) {
      const cardTitle = `Hồ Sơ Học Viên ${safeCard} • HỌC CÙNG PHÚC K9`;
      const cardDesc = `Soi Hồ Sơ Công Khai 3D, Tủ Kính Thành Tựu & 8 Chỉ Số Học Thật của ${safeCard} trên Hệ Sinh Thái Học Cùng Phúc K9. Mở Rương Tân Binh 9+ miễn phí!`;
      html = html
        .replace(/<title>[^<]*<\/title>/i, `<title>${cardTitle}</title>`)
        .replace(
          /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:title" content="${cardTitle}" />`
        )
        .replace(
          /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:description" content="${cardDesc}" />`
        )
        .replace(
          /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:title" content="${cardTitle}" />`
        )
        .replace(
          /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
          `<meta name="twitter:description" content="${cardDesc}" />`
        );
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.end(html);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Unable to render metadata preview.');
  }
};
