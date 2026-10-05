const http = require('http');

const urls = [
  'http://127.0.0.1:8085/',
  'http://127.0.0.1:8085/style.css',
  'http://127.0.0.1:8085/app.js',
  'http://127.0.0.1:8085/sw.js',
  'http://127.0.0.1:8085/manifest.webmanifest',
  'http://127.0.0.1:8085/icons/icon.svg',
  'http://127.0.0.1:8085/icons/icon-192.png',
  'http://127.0.0.1:8085/icons/icon-512.png',
  'http://127.0.0.1:8085/extracted%20recipes/all_recipes.json',
  'http://127.0.0.1:8085/extracted%20recipes/recipe_01_dish.jpg',
  'http://127.0.0.1:8085/extracted%20recipes/ingredients_nutrition.json',
  'http://127.0.0.1:8085/extracted%20recipes/ingredients_nutrition.csv'
];

async function checkUrl(u) {
  return new Promise((resolve, reject) => {
    http.get(u, res => {
      let dataLen = 0;
      res.on('data', chunk => { dataLen += chunk.length; });
      res.on('end', () => {
        resolve({
          url: u,
          statusCode: res.statusCode,
          contentType: res.headers['content-type'],
          bytes: dataLen
        });
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('Testing HTTP endpoints on http://127.0.0.1:8085/ ...');
  let allOk = true;
  for (const u of urls) {
    try {
      const info = await checkUrl(u);
      const isOk = info.statusCode === 200 && info.bytes > 0;
      if (!isOk) allOk = false;
      console.log(`[${info.statusCode}] ${info.contentType.padEnd(35)} ${String(info.bytes).padStart(8)} bytes -> ${info.url}`);
    } catch (e) {
      allOk = false;
      console.error(`FAILED: ${u} ->`, e.message);
    }
  }

  if (allOk) {
    console.log('\n✓ ALL 12 ENDPOINTS SERVED WITH STATUS 200 OK & NON-EMPTY BODIES!');
    process.exit(0);
  } else {
    console.error('\n✗ SOME ENDPOINTS FAILED');
    process.exit(1);
  }
})();
