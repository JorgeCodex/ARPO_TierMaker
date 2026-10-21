// ============================================================================
// PERSISTENCIA (Guardar / Guardar como / Abrir / Cerrar / Nuevo / Importar / Exportar PNG)
// ============================================================================

// Handle y nombre del archivo, y cambios sin guardar: cada pestaña (documento)
// tiene los suyos. Se exponen como propiedades globales para no tocar el resto.
Object.defineProperty(window, 'projectFileHandle', {
  get() {
    const doc = getActiveDocument();
    return doc ? doc.fileHandle : null;
  },
  set(value) {
    const doc = getActiveDocument();
    if (doc) doc.fileHandle = value;
  }
});

Object.defineProperty(window, 'currentProjectName', {
  get() {
    const doc = getActiveDocument();
    return (doc && doc.fileName) || 'tierlist.arpo.json';
  },
  set(value) {
    const doc = getActiveDocument();
    if (!doc) return;
    doc.fileName = value;
    doc.name = value;
    if (typeof updateTabBar === 'function') updateTabBar();
  }
});

Object.defineProperty(window, 'projectDirty', {
  get() {
    const doc = getActiveDocument();
    return doc ? !!doc.dirty : false;
  },
  set(value) {
    const doc = getActiveDocument();
    if (doc) doc.dirty = !!value;
    if (typeof updateTabBar === 'function') updateTabBar();
  }
});

function markProjectDirty() {
  projectDirty = true;
  scheduleAutosave();
}

function setProjectDirty(value) {
  projectDirty = !!value;
}

function isProjectDirty() {
  return projectDirty;
}

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
  state.nodes.forEach(n => {
    if (n && typeof n === 'object') {
      n.format = typeof normalizeNodeFormat === 'function' ? normalizeNodeFormat(n.format) : (n.format || 'square');
    }
  });
  state.edges = Array.isArray(data.edges) ? data.edges : [];
  state.zoom = typeof data.zoom === 'number' ? data.zoom : 1;
  state.panX = typeof data.panX === 'number' ? data.panX : 0;
  state.panY = typeof data.panY === 'number' ? data.panY : 0;
  state.selectedNodeId = null;
  state.selectedNodeIds = [];
  state.selectedEdgeId = null;
  state.connectingFrom = null;

  // Reiniciar historial con el estado recién cargado
  state.history = [];
  state.historyIndex = -1;
  state.isRestoring = false;
  saveState();
  render();
  updateUndoRedoButtons();
  setProjectDirty(false);
}

// Abre una plantilla en una pestaña nueva. Si la pestaña activa es un lienzo
// vacío y sin tocar, se reutiliza para no dejar pestañas en blanco de sobra.
function openProjectInNewDocument(data, fileName, fileHandle) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.nodes)) {
    throw new Error('Formato de archivo inválido');
  }
  if (typeof flushEdgeEditor === 'function') flushEdgeEditor();
  if (typeof cancelConnection === 'function') cancelConnection();
  const active = getActiveDocument();
  const reuse = active
    && !active.nodes.length
    && !active.edges.length
    && !active.dirty
    && !active.fileHandle;

  if (reuse) {
    active.name = fileName || active.name;
    active.fileName = fileName || null;
    active.fileHandle = fileHandle || null;
  } else {
    const doc = createDocument({
      name: fileName || null,
      fileName: fileName || null,
      fileHandle: fileHandle || null
    });
    state.documents.push(doc);
    state.activeDocId = doc.id;
  }

  loadProjectData(data);
  if (typeof updateTabBar === 'function') updateTabBar();
  return getActiveDocument();
}

// ============================================================================
// CICLO DE VIDA DEL PROYECTO (Nuevo / Cerrar) Y CAMBIOS SIN GUARDAR
// ============================================================================

// Resuelve la promesa del diálogo de cambios sin guardar ('save' | 'discard' | 'cancel')
let unsavedResolver = null;

function askUnsavedChanges() {
  return new Promise(resolve => {
    unsavedResolver = resolve;
    const modal = document.getElementById('modalUnsaved');
    if (modal) modal.classList.add('active');
  });
}

function finishUnsavedPrompt(choice) {
  const modal = document.getElementById('modalUnsaved');
  if (modal) modal.classList.remove('active');
  if (unsavedResolver) {
    const resolve = unsavedResolver;
    unsavedResolver = null;
    resolve(choice);
  }
}

window.cancelUnsavedPrompt = function () {
  finishUnsavedPrompt('cancel');
};

document.getElementById('btnUnsavedSave')?.addEventListener('click', () => finishUnsavedPrompt('save'));
document.getElementById('btnUnsavedNo')?.addEventListener('click', () => finishUnsavedPrompt('discard'));
document.getElementById('btnUnsavedCancel')?.addEventListener('click', () => finishUnsavedPrompt('cancel'));

// Devuelve true si se puede continuar (no hay cambios o el usuario lo permite)
async function confirmUnsavedChanges() {
  if (!projectDirty) return true;
  const choice = await askUnsavedChanges();
  if (choice === 'save') return saveProject();
  return choice === 'discard';
}

// "Nuevo" crea otra pestaña; no descarta el lienzo actual.
function newProject() {
  if (typeof createNewDocument === 'function') createNewDocument();
}

// "Cerrar" cierra la pestaña activa (preguntando si tiene cambios sin guardar).
function closeProject() {
  if (typeof closeDocument === 'function') closeDocument(state.activeDocId);
}

function requestOpenProject() {
  openProject();
}

// ============================================================================
// RECUPERACIÓN AUTOMÁTICA (borrador en localStorage)
// ============================================================================

const AUTOSAVE_KEY = 'arpo-autosave';
let autosaveTimer = null;

function scheduleAutosave() {
  if (typeof getPref === 'function' && !getPref('autoSave')) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(writeAutosaveDraft, 600);
}

function serializeDocument(doc) {
  return {
    name: doc.name,
    fileName: doc.fileName,
    nodes: doc.nodes,
    edges: doc.edges,
    zoom: doc.zoom,
    panX: doc.panX,
    panY: doc.panY,
    selectedNodeId: doc.selectedNodeId,
    selectedNodeIds: doc.selectedNodeIds || []
  };
}

function writeAutosaveDraft() {
  autosaveTimer = null;
  try {
    // Solo se recuperan las pestañas con cambios sin guardar.
    const dirtyDocs = state.documents.filter(d => d.dirty && (d.nodes.length || d.edges.length));
    if (!dirtyDocs.length) {
      localStorage.removeItem(AUTOSAVE_KEY);
      return;
    }
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      app: 'ARPO-TierMaker',
      version: 3,
      multi: true,
      docCounter: typeof docCounter === 'number' ? docCounter : 0,
      activeIndex: Math.max(0, dirtyDocs.findIndex(d => d.id === state.activeDocId)),
      documents: dirtyDocs.map(serializeDocument)
    }));
  } catch (e) {
    // localStorage lleno o no disponible
  }
}

function clearAutosaveDraft() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (e) {
    // noop
  }
}

// Restaura las pestañas con cambios sin guardar al iniciar la aplicación
function restoreAutosaveDraft() {
  if (typeof getPref === 'function' && !getPref('autoSave')) return false;
  let raw = null;
  try {
    raw = localStorage.getItem(AUTOSAVE_KEY);
  } catch (e) {
    return false;
  }
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data.documents) && data.documents.length) {
      state.documents = [];
      data.documents.forEach(snap => {
        const doc = createDocument({
          name: snap.name,
          fileName: snap.fileName
        });
        doc.nodes = Array.isArray(snap.nodes) ? snap.nodes : [];
        doc.nodes.forEach(n => {
          if (n && typeof n === 'object') {
            n.format = typeof normalizeNodeFormat === 'function' ? normalizeNodeFormat(n.format) : (n.format || 'square');
          }
        });
        doc.edges = Array.isArray(snap.edges) ? snap.edges : [];
        doc.zoom = typeof snap.zoom === 'number' ? snap.zoom : 1;
        doc.panX = typeof snap.panX === 'number' ? snap.panX : 0;
        doc.panY = typeof snap.panY === 'number' ? snap.panY : 0;
        doc.selectedNodeId = null;
        doc.selectedNodeIds = [];
        doc.selectedEdgeId = null;
        state.documents.push(doc);
        initDocumentBaseline(doc);
      });
      const activeIndex = typeof data.activeIndex === 'number' ? data.activeIndex : 0;
      state.activeDocId = state.documents[Math.min(activeIndex, state.documents.length - 1)].id;
      if (typeof data.docCounter === 'number') docCounter = data.docCounter;
      state.documents.forEach(doc => { doc.dirty = true; });
      if (typeof updateTabBar === 'function') updateTabBar();
      showToast(t('toast.draftRestored'), 3000);
      return true;
    }
    // Formato antiguo: un único proyecto
    loadProjectData(data);
    setProjectDirty(true);
    showToast(t('toast.draftRestored'), 3000);
    return true;
  } catch (e) {
    clearAutosaveDraft();
    return false;
  }
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
    setProjectDirty(false);
    scheduleAutosave();
    showToast(t('toast.saved'));
    return true;
  } catch (err) {
    if (err && err.name === 'AbortError') return false;
    console.error(err);
    showToast(t('toast.saveErr'));
    return false;
  }
}

async function saveProjectAs() {
  if (!supportsFileSystemAccess()) {
    downloadProjectFile(currentProjectName);
    setProjectDirty(false);
    scheduleAutosave();
    showToast(location.protocol === 'file:' ? t('toast.needServer') : t('toast.browserNoSupport', { browser: browserName() }), 5000);
    return true;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: currentProjectName || 'tierlist.arpo.json',
      types: PROJECT_TYPES
    });
    projectFileHandle = handle;
    currentProjectName = handle.name;
    await writeToHandle(handle);
    setProjectDirty(false);
    scheduleAutosave();
    showToast(t('toast.savedAs'));
    return true;
  } catch (err) {
    if (err && err.name === 'AbortError') return false;
    console.error(err);
    downloadProjectFile(currentProjectName);
    setProjectDirty(false);
    scheduleAutosave();
    showToast(t('toast.savedDownload'));
    return true;
  }
}

async function openProject() {
  if (supportsFileSystemAccess()) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: PROJECT_TYPES, multiple: false });
      const file = await handle.getFile();
      const text = await file.text();
      openProjectInNewDocument(JSON.parse(text), handle.name, handle);
      scheduleAutosave();
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
// EXPORTAR (PNG transparente / JPG con fondo)
// ============================================================================

const EDGE_LINE_COLORS = { green: '#22c55e', orange: '#f59e0b', blue: '#06b6d4', purple: '#a855f7' };
const EDGE_ARROW_COLORS = { green: '#16a34a', orange: '#d97706', blue: '#0891b2', purple: '#9333ea' };
const EXPORT_LINE_WIDTH = { thin: 7, normal: 12, thick: 18 };

// Colores del export leídos del tema actual (claro/oscuro)
let exportTheme = null;

function getExportTheme() {
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

function drawFieldText(ctx, fields, cx, firstCenterY, step, scale = 1) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = exportTheme.fieldShadow.color;
  ctx.shadowBlur = exportTheme.fieldShadow.blur;
  ctx.shadowOffsetY = exportTheme.fieldShadow.offsetY;
  fields.forEach((f, i) => {
    const first = i === 0;
    ctx.font = first
      ? `700 ${12.8 * scale}px 'Plus Jakarta Sans', sans-serif`
      : `600 ${11.5 * scale}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = first ? exportTheme.text : exportTheme.muted;
    ctx.fillText(f, cx, firstCenterY + i * step);
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function drawNodeExport(ctx, node, img) {
  const format = NODE_FORMATS[normalizeNodeFormat(node.format)] || NODE_FORMATS.square;
  const size = getNodeSize();
  const el = document.getElementById('node-' + node.id);
  const boxEl = el ? el.querySelector('.node-image-box') : null;
  const w = el ? el.offsetWidth : format.w * size;
  const h = boxEl ? boxEl.offsetHeight : format.h * size;
  const x = node.x;
  const y = node.y;
  const fields = typeof getNodeFields === 'function' ? getNodeFields(node) : [node.name].filter(Boolean);
  const round = format.round && !!img;
  const radius = 12 * size;

  if (round) {
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fillStyle = exportTheme.card;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    drawCoverImage(ctx, img, x, y, w, h);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
    ctx.strokeStyle = exportTheme.border;
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Caja con el mismo fondo que en el lienzo
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.fillStyle = exportTheme.card;
    ctx.fill();

    if (img) {
      ctx.save();
      roundRectPath(ctx, x, y, w, h, radius);
      ctx.clip();
      drawCoverImage(ctx, img, x, y, w, h);
      ctx.restore();
    }

    roundRectPath(ctx, x, y, w, h, radius);
    ctx.strokeStyle = exportTheme.border;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Datos del personaje
  const step = 16 * size;
  if (img) {
    if (fields.length) {
      drawFieldText(ctx, fields, x + w / 2, y + h + 6 * size + step / 2, step, size);
    }
  } else if (fields.length) {
    const blockH = fields.length * step;
    drawFieldText(ctx, fields, x + w / 2, y + h / 2 - blockH / 2 + step / 2, step, size);
  }
}

async function exportCanvas(format) {
  const isPng = format === 'png';
  const nodes = state.nodes.filter(n => !n.inPool);
  if (nodes.length === 0) {
    showToast(t('toast.noCanvasChars'));
    return;
  }

  exportTheme = getExportTheme();

  // Límites del contenido
  const PAD = 60;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach(n => {
    const el = document.getElementById('node-' + n.id);
    const nodeH = el ? el.offsetHeight : getNodeHeight(n);
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + getNodeWidth(n));
    maxY = Math.max(maxY, n.y + nodeH);
  });

  const worldW = maxX - minX + PAD * 2;
  const worldH = maxY - minY + PAD * 2;
  let scale = Number(typeof getPref === 'function' ? getPref('exportScale') : 2) || 2;
  const maxDim = Math.max(worldW, worldH);
  if (maxDim * scale > 12000) scale = 12000 / maxDim;
  if (scale < 0.5) scale = 0.5;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(worldW * scale);
  canvas.height = Math.ceil(worldH * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.translate(-minX + PAD, -minY + PAD);

  // Fondo: el JPG lleva el fondo del lienzo; el PNG se exporta con fondo transparente
  if (!isPng) {
    ctx.fillStyle = exportTheme.pageBg;
    ctx.fillRect(minX - PAD, minY - PAD, worldW, worldH);
  }

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
  const includeNotes = typeof getPref !== 'function' || getPref('includeNotesInExport') !== false;
  const lineWidth = EXPORT_LINE_WIDTH[typeof getPref === 'function' ? getPref('lineWidth') : 'normal'] || 12;
  state.edges.forEach(edge => {
    const from = nodes.find(n => n.id === edge.from);
    const to = nodes.find(n => n.id === edge.to);
    if (!from || !to) return;

    const a = getNodeCenter(from);
    const b = getNodeCenter(to);
    const lineColor = EDGE_LINE_COLORS[edge.type] || EDGE_LINE_COLORS.green;
    const arrowColor = EDGE_ARROW_COLORS[edge.type] || lineColor;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // Azul (igualdad) y morado (indeterminada): sin flechas de dirección.
    if (edge.type !== 'blue' && edge.type !== 'purple') {
      drawChevrons(ctx, a.x, a.y, b.x, b.y, arrowColor);
    }

    if (includeNotes && edge.note && edge.note.trim()) {
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      const tw = ctx.measureText(edge.note).width;
      const bw = tw + 12;
      const bh = 16;
      roundRectPath(ctx, midX - bw / 2, midY - bh / 2, bw, bh, 3);
      ctx.fillStyle = isPng ? exportTheme.card : exportTheme.pageBg;
      ctx.fill();
      ctx.strokeStyle = exportTheme.border;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = exportTheme.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.note, midX, midY);
    }
  });

  // Personajes
  nodes.forEach(n => drawNodeExport(ctx, n, imgMap[n.id]));

  canvas.toBlob(blob => {
    if (!blob) {
      showToast(t('toast.exportErr'));
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isPng ? 'tierlist-arpo.png' : 'tierlist-arpo.jpg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(t('toast.exportDone'));
  }, isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : 0.95);
}

function exportCanvasAsPNG() {
  return exportCanvas('png');
}

function exportCanvasAsJPG() {
  return exportCanvas('jpg');
}

// ============================================================================
// LISTENERS
// ============================================================================

// ============================================================================
// IMPORTAR IMÁGENES COMO PERSONAJES
// ============================================================================

function importImagesAsCharacters() {
  document.getElementById('importImagesInput')?.click();
}

document.getElementById('importImagesInput')?.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files || []).filter(f => f && f.type.startsWith('image/'));
  e.target.value = '';
  if (!files.length) return;

  const dataUrls = await Promise.all(files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  })));

  let count = 0;
  dataUrls.forEach(dataUrl => {
    if (!dataUrl) return;
    state.nodes.push({
      id: 'char_' + Date.now() + '_' + Math.floor(Math.random() * 1e9).toString(36),
      fields: [],
      name: '',
      image: dataUrl,
      imageOriginal: dataUrl,
      format: 'square',
      color: '#6366f1',
      x: 0,
      y: 0,
      inPool: true
    });
    count++;
  });

  if (count > 0) {
    saveState();
    render();
    showToast(t('toast.imported', { count }));
  } else {
    showToast(t('toast.importErr'));
  }
});

// Fallback de apertura con <input type="file"> (navegadores sin File System Access API)
document.getElementById('fileInput')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    openProjectInNewDocument(JSON.parse(await file.text()), file.name || null, null);
    scheduleAutosave();
    showToast(t('toast.openOk'));
  } catch (err) {
    console.error(err);
    showToast(t('toast.openErr'));
  }
});

// Atajos Ctrl+S
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
