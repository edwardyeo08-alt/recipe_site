const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8085;
const ROOT = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.csv': 'text/csv; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    decodedPath = req.url.split('?')[0];
  }

  if (decodedPath === '/') decodedPath = '/index.html';

  const filePath = path.join(ROOT, decodedPath);

  // Security check: ensure path is inside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + decodedPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`MealPlan dev server running at http://127.0.0.1:${PORT}/`);
});
