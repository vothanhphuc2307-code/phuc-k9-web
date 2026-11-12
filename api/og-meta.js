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
    const rawProto =
      (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
    const proto = rawHost && /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawHost) ? rawProto : 'https';
    const origin = rawHost ? `${proto}://${rawHost}` : '';

    let html = loadIndexHtml();

    if (origin) {
      const ogImageUrl = `${origin}/assets/og-phuc-k9.jpg?v=2026`;
      html = html
        .replace(
          /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
          `<meta property="og:url" content="${origin}/" />`
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
