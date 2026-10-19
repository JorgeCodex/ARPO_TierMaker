// Servidor local minimo para A.R.P.O. TierMaker.
// Necesario para que el navegador permita SOBRESCRIBIR archivos (File System Access API),
// que no esta disponible al abrir la app como file://.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const root = __dirname;
const START_PORT = 8080;
const MAX_PORT = 8100;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function handleRequest(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(root, urlPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store, must-revalidate'
    });
    res.end(data);
  });
}

function firstExisting(paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) { /* ignora */ }
  }
  return null;
}

// Abre la app preferiblemente en Chrome/Edge (soportan sobrescribir archivos).
// Brave, Firefox y Safari no exponen la File System Access API.
function openBrowser(url) {
  const local = process.env.LOCALAPPDATA || '';
  const pf = process.env['ProgramFiles'] || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const exe = firstExisting([
    path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
  ]);
  if (exe) {
    exec(`start "" "${exe}" "${url}"`);
  } else {
    exec(`start "" "${url}"`);
  }
}

function start(port) {
  const server = http.createServer(handleRequest);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < MAX_PORT) {
      start(port + 1);
    } else {
      console.error('No se pudo iniciar el servidor:', err.message);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`A.R.P.O. TierMaker disponible en ${url}`);
    console.log('Cierra esta ventana para detener el servidor.');
    if (!process.env.ARPO_NO_OPEN) openBrowser(url);
  });
}

start(START_PORT);
