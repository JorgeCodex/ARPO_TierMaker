// ============================================================================
// PERSISTENCIA (Guardar / Guardar como / Abrir / Guardar como JPG)
// ============================================================================

// Handle del archivo de plantilla actualmente abierto/guardado.
// Mientras exista, "Guardar" reescribe ese archivo.
let projectFileHandle = null;
// Nombre del archivo actual (para reutilizarlo al descargar si no hay handle).
let currentProjectName = 'tierlist.arpo.json';

const PROJECT_MIME = 'application/json';
const PROJECT_TYPES = [
  { description: 'Plantilla A.R.P.O.', accept: { 'application/json': ['.json'] } }
];

// La API de acceso al sistema de archivos permite SOBRESCRIBIR el archivo abierto.
// Requiere contexto seguro (http/https o localhost) y no funcionar dentro de un iframe.
function supportsFileSystemAccess() {
  if (typeof window.showOpenFilePicker !== 'function') return false;
  if (typeof window.showSaveFilePicker !== 'function') return false;
  try {
    if (window.self !== window.top) return false;
  } catch (e) {
    return false;
  }
  return true;
}

// Nombre del navegador (para mensajes de diagnóstico)
function browserName() {
  if (typeof navigator.brave !== 'undefined') return 'Brave';
  const ua = navigator.userAgent;
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'este navegador';
}

function buildProjectData() {
  return {
    app: 'ARPO-TierMaker',
    version: 2,
    nodes: state.nodes,
    edges: state.edges,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY
  };
}

function loadProjectData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.nodes)) {
    throw new Error('Formato de archivo inválido');
  }
  state.nodes = data.nodes;
  state.edges = Array.isArray(data.edges) ? data.edges : [];
  state.zoom = typeof data.zoom === 'number' ? data.zoom : 1;
  state.panX = typeof data.panX === 'number' ? data.panX : 0;
  state.panY = typeof data.panY === 'number' ? data.panY : 0;
  state.selectedNodeId = null;

  // Reiniciar historial con el estado recién cargado
  state.history = [];
  state.historyIndex = -1;
  state.isRestoring = false;
  saveState();
  render();
  updateUndoRedoButtons();
}

// --- Escribir / descargar ---

async function writeToHandle(handle) {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(buildProjectData(), null, 2));
  await writable.close();
}

function downloadProjectFile(name) {
  const filename = name || currentProjectName || 'tierlist.arpo.json';
  const blob = new Blob([JSON.stringify(buildProjectData(), null, 2)], { type: PROJECT_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Acciones principales ---

async function saveProject() {
  if (!projectFileHandle) return saveProjectAs();
  try {
    await writeToHandle(projectFileHandle);
    showToast(t('toast.saved'));
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    console.error(err);
    showToast(t('toast.saveErr'));
  }
}

async function saveProjectAs() {
  if (!supportsFileSystemAccess()) {
    downloadProjectFile(currentProjectName);
    showToast(location.protocol === 'file:' ? t('toast.needServer') : t('toast.browserNoSupport', { browser: browserName() }), 5000);
    return;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: currentProjectName || 'tierlist.arpo.json',
      types: PROJECT_TYPES
    });
    projectFileHandle = handle;
    currentProjectName = handle.name;
    await writeToHandle(handle);
    showToast(t('toast.savedAs'));
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    console.error(err);
    downloadProjectFile(currentProjectName);
    showToast(t('toast.savedDownload'));
  }
}

async function openProject() {
  if (supportsFileSystemAccess()) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: PROJECT_TYPES, multiple: false });
      const file = await handle.getFile();
      const text = await file.text();
      loadProjectData(JSON.parse(text));
      projectFileHandle = handle;
      currentProjectName = handle.name;
      showToast(t('toast.openOk'));
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.error(err);
      // Continúa al fallback con <input type="file">
    }
  }
  document.getElementById('fileInput')?.click();
}

// ============================================================================
// EXPORTAR COMO JPG
// ============================================================================

const EDGE_LINE_COLORS = { green: '#22c55e', orange: '#f59e0b', blue: '#06b6d4', purple: '#a855f7' };
const EDGE_ARROW_COLORS = { green: '#16a34a', orange: '#d97706', blue: '#0891b2', purple: '#9333ea' };

// Colores del export JPG leídos del tema actual (claro/oscuro)
let jpgTheme = null;

function getJpgTheme() {
  const root = document.documentElement;
  const isLight = root.dataset.theme === 'light';
  const cs = getComputedStyle(root);
  const read = (name, fallback) => {
    const value = cs.getPropertyValue(name);
    return (value && value.trim()) || fallback;
  };
  return {
    isLight,
    pageBg: read('--bg-main', isLight ? '#eef2f7' : '#0b0f19'),
    card: read('--bg-card', isLight ? '#ffffff' : '#121826'),
    border: read('--border-card', isLight ? '#d6dee9' : '#1f2d47'),
    text: read('--text-main', isLight ? '#0f172a' : '#f3f4f6'),
    muted: read('--text-muted', isLight ? '#52616f' : '#9ca3af'),
    fieldShadow: isLight
      ? { color: 'rgba(15, 23, 42, 0.18)', blur: 2, offsetY: 1 }
      : { color: 'rgba(0, 0, 0, 0.9)', blur: 3, offsetY: 1 }
  };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCoverImage(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const br = w / h;
  let dw, dh, dx, dy;
  if (ir > br) {
    dh = h;
    dw = h * ir;
    dx = x + (w - dw) / 2;
    dy = y;
  } else {
    dw = w;
    dh = w / ir;
    dx = x;
    dy = y + (h - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawChevrons(ctx, x1, y1, x2, y2, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 50) return;

  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const intervals = Math.max(2, Math.round(len / 30));
  const step = len / intervals;
  const size = 5;
  const depth = 8;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 1; i < intervals; i++) {
    const cx = x1 + ux * step * i;
    const cy = y1 + uy * step * i;
    const tipX = cx + ux * (depth / 2);
    const tipY = cy + uy * (depth / 2);
    const lx = cx - ux * (depth / 2) + px * size;
    const ly = cy - uy * (depth / 2) + py * size;
    const rx = cx - ux * (depth / 2) - px * size;
    const ry = cy - uy * (depth / 2) - py * size;
    ctx.moveTo(lx, ly);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(rx, ry);
  }
  ctx.stroke();
}

function drawFieldText(ctx, fields, cx, firstCenterY, step) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = jpgTheme.fieldShadow.color;
  ctx.shadowBlur = jpgTheme.fieldShadow.blur;
  ctx.shadowOffsetY = jpgTheme.fieldShadow.offsetY;
  fields.forEach((f, i) => {
    const first = i === 0;
    ctx.font = first
      ? "700 12.8px 'Plus Jakarta Sans', sans-serif"
      : "600 11.5px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = first ? jpgTheme.text : jpgTheme.muted;
    ctx.fillText(f, cx, firstCenterY + i * step);
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawNodeExport(ctx, node, img) {
  const w = 175;
  const el = document.getElementById('node-' + node.id);
  const boxEl = el ? el.querySelector('.node-image-box') : null;
  const h = boxEl ? boxEl.offsetHeight : 175;
  const x = node.x;
  const y = node.y;
  const fields = typeof getNodeFields === 'function' ? getNodeFields(node) : [node.name].filter(Boolean);

  // Caja con el mismo fondo que en el lienzo
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.fillStyle = jpgTheme.card;
  ctx.fill();

  if (img) {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, 12);
    ctx.clip();
    drawCoverImage(ctx, img, x, y, w, h);
    ctx.restore();
  }

  roundRectPath(ctx, x, y, w, h, 12);
  ctx.strokeStyle = jpgTheme.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Datos del personaje
  const step = 16;
  if (img) {
    if (fields.length) {
      drawFieldText(ctx, fields, x + w / 2, y + h + 6 + step / 2, step);
    }
  } else if (fields.length) {
    const blockH = fields.length * step;
    drawFieldText(ctx, fields, x + w / 2, y + h / 2 - blockH / 2 + step / 2, step);
  }
}

async function exportCanvasAsJPG() {
  const nodes = state.nodes.filter(n => !n.inPool);
  if (nodes.length === 0) {
    showToast(t('toast.noCanvasChars'));
    return;
  }

  jpgTheme = getJpgTheme();

  // Límites del contenido
  const PAD = 60;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach(n => {
    const el = document.getElementById('node-' + n.id);
    const nodeH = el ? el.offsetHeight : 175;
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + 175);
    maxY = Math.max(maxY, n.y + nodeH);
  });

  const worldW = maxX - minX + PAD * 2;
  const worldH = maxY - minY + PAD * 2;
  let scale = 2;
  const maxDim = Math.max(worldW, worldH);
  if (maxDim * scale > 12000) scale = 12000 / maxDim;
  if (scale < 0.5) scale = 0.5;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(worldW * scale);
  canvas.height = Math.ceil(worldH * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(-minX + PAD, -minY + PAD);

  // Fondo
  ctx.fillStyle = jpgTheme.pageBg;
  ctx.fillRect(minX - PAD, minY - PAD, worldW, worldH);

  // Precargar imágenes
  const imgMap = {};
  await Promise.all(nodes.map(n => new Promise(resolve => {
    if (!n.image) return resolve();
    const img = new Image();
    img.onload = () => { imgMap[n.id] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = n.image;
  })));

  // Conexiones (líneas + flechitas + notas)
  state.edges.forEach(edge => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to) return;

    const a = getNodeCenter(from);
    const b = getNodeCenter(to);
    const lineColor = EDGE_LINE_COLORS[edge.type] || EDGE_LINE_COLORS.green;
    const arrowColor = EDGE_ARROW_COLORS[edge.type] || lineColor;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    drawChevrons(ctx, a.x, a.y, b.x, b.y, arrowColor);

    if (edge.note && edge.note.trim()) {
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      const tw = ctx.measureText(edge.note).width;
      const bw = tw + 12;
      const bh = 16;
      roundRectPath(ctx, midX - bw / 2, midY - bh / 2, bw, bh, 3);
      ctx.fillStyle = jpgTheme.pageBg;
      ctx.fill();
      ctx.strokeStyle = jpgTheme.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = jpgTheme.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.note, midX, midY);
    }
  });

  // Personajes
  nodes.forEach(n => drawNodeExport(ctx, n, imgMap[n.id]));

  canvas.toBlob(blob => {
    if (!blob) {
      showToast(t('toast.jpgErr'));
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tierlist-arpo.jpg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t('toast.jpgDone'));
  }, 'image/jpeg', 0.95);
}

// ============================================================================
// LISTENERS
// ============================================================================

document.getElementById('btnSave')?.addEventListener('click', saveProject);
document.getElementById('btnSaveAs')?.addEventListener('click', () => {
  document.getElementById('saveMenu')?.classList.remove('open');
  saveProjectAs();
});
document.getElementById('btnOpen')?.addEventListener('click', openProject);
document.getElementById('btnExportJPG')?.addEventListener('click', exportCanvasAsJPG);

// Menú desplegable del botón Guardar
document.getElementById('btnSaveMenu')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('saveMenu')?.classList.toggle('open');
});
document.addEventListener('click', () => {
  document.getElementById('saveMenu')?.classList.remove('open');
});

// Fallback de apertura con <input type="file"> (navegadores sin File System Access API)
document.getElementById('fileInput')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    loadProjectData(JSON.parse(await file.text()));
    currentProjectName = file.name || currentProjectName;
    showToast(t('toast.openOk'));
  } catch (err) {
    console.error(err);
    showToast(t('toast.openErr'));
  }
});

// Atajo Ctrl+S
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveProject();
  }
});

// Aviso temprano: si estamos en un servidor (no file://) pero el navegador no soporta
// la API de sobrescritura, informamos qué navegador usar.
if (location.protocol !== 'file:' && !supportsFileSystemAccess()) {
  setTimeout(() => {
    showToast(t('toast.browserNoSupport', { browser: browserName() }), 6000);
  }, 800);
}
