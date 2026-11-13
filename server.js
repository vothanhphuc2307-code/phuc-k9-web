const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    req.query = Object.fromEntries(u.searchParams.entries());

    if (u.pathname.startsWith('/api/')) {
      const apiName = path.basename(u.pathname, '.js');
      const apiPath = path.join(ROOT, 'api', `${apiName}.js`);
      if (!fs.existsSync(apiPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ ok: false, message: 'API endpoint not found' }));
      }
      if (req.method === 'POST') {
        const chunks = [];
        for await (const ch of req) chunks.push(ch);
        const raw = Buffer.concat(chunks).toString('utf8');
        try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = raw; }
      }
      const handler = require(apiPath);
      return await handler(req, res);
    }

    let relPath = decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname);
    const safePath = path.normalize(path.join(ROOT, relPath));
    if (!safePath.startsWith(ROOT) || !fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
      const indexFallback = path.join(ROOT, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(indexFallback));
    }

    const ext = path.extname(safePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(safePath).pipe(res);
  } catch (err) {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, message: 'Internal server error' }));
    }
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Hệ sinh thái HỌC CÙNG PHÚC K9 đang chạy tại: http://localhost:${PORT}`);
  });
}

module.exports = server;
