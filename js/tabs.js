// ============================================================================
// PESTAÑAS DE LIENZO (varios documentos abiertos a la vez, estilo Photoshop)
// ============================================================================

let docCounter = 0;
let closingDocument = false;

function makeUntitledName() {
  docCounter++;
  return t('tab.untitled', { n: docCounter });
}

function createDocument(opts = {}) {
  const named = typeof opts.name === 'string' && opts.name.trim() ? opts.name.trim() : '';
  return {
    id: 'doc_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
    name: named || makeUntitledName(),
    fileName: opts.fileName || null,
    fileHandle: opts.fileHandle || null,
    nodes: [],
    edges: [],
    zoom: 1,
    panX: 0,
    panY: 0,
    selectedNodeId: null,
    selectedNodeIds: [],
    selectedEdgeId: null,
    history: [],
    historyIndex: -1,
    dirty: false
  };
}

function ensureAtLeastOneDocument() {
  const active = getActiveDocument();
  if (active) return active;
  const doc = createDocument();
  state.documents.push(doc);
  state.activeDocId = doc.id;
  return doc;
}

function initDocumentBaseline(doc) {
  state.activeDocId = doc.id;
  doc.history = [];
  doc.historyIndex = -1;
  if (typeof saveState === 'function') saveState();
  if (typeof setProjectDirty === 'function') setProjectDirty(false);
}

function createNewDocument() {
  if (typeof flushEdgeEditor === 'function') flushEdgeEditor();
  if (typeof cancelConnection === 'function') cancelConnection();
  const doc = createDocument();
  state.documents.push(doc);
  initDocumentBaseline(doc);
  state.connectingFrom = null;
  if (typeof render === 'function') render();
  if (typeof updateTransform === 'function') updateTransform();
  if (typeof updateUndoRedoButtons === 'function') updateUndoRedoButtons();
  updateTabBar();
  if (typeof showToast === 'function') showToast(t('toast.newCanvas'));
  return doc;
}

function activateDocument(docId) {
  if (!docId || docId === state.activeDocId) return;
  if (!state.documents.some(d => d.id === docId)) return;
  if (typeof flushEdgeEditor === 'function') flushEdgeEditor();
  if (typeof cancelConnection === 'function') cancelConnection();
  state.activeDocId = docId;
  state.connectingFrom = null;
  state.isPanning = false;
  const tempLine = document.getElementById('tempConnectionLine');
  if (tempLine) tempLine.style.display = 'none';
  if (typeof closeAllMenus === 'function') closeAllMenus();
  if (typeof render === 'function') render();
  if (typeof updateTransform === 'function') updateTransform();
  if (typeof updateUndoRedoButtons === 'function') updateUndoRedoButtons();
  updateTabBar();
}

function removeDocument(docId) {
  const index = state.documents.findIndex(d => d.id === docId);
  if (index === -1) return;
  if (typeof flushEdgeEditor === 'function') flushEdgeEditor();
  if (typeof cancelConnection === 'function') cancelConnection();
  state.documents.splice(index, 1);
  state.connectingFrom = null;

  if (!state.documents.length) {
    state.activeDocId = null;
    if (typeof clearAutosaveDraft === 'function') clearAutosaveDraft();
  } else if (state.activeDocId === docId) {
    const next = state.documents[Math.min(index, state.documents.length - 1)];
    state.activeDocId = next.id;
  }

  if (typeof render === 'function') render();
  if (typeof updateTransform === 'function') updateTransform();
  if (typeof updateUndoRedoButtons === 'function') updateUndoRedoButtons();
  updateTabBar();
  if (typeof scheduleAutosave === 'function') scheduleAutosave();
}

async function closeDocument(docId) {
  if (closingDocument) return;
  closingDocument = true;
  try {
    const doc = state.documents.find(d => d.id === docId);
    if (!doc) return;

    const previousActive = state.activeDocId;
    const restorePrevious = () => {
      if (previousActive !== docId && state.documents.some(d => d.id === previousActive)) {
        activateDocument(previousActive);
      }
    };

    if (doc.dirty && state.activeDocId !== docId) activateDocument(docId);

    if (doc.dirty && typeof askUnsavedChanges === 'function') {
      const choice = await askUnsavedChanges();
      if (choice === 'cancel') {
        restorePrevious();
        return;
      }
      if (choice === 'save') {
        const saved = typeof saveProject === 'function' ? await saveProject() : false;
        if (!saved) {
          restorePrevious();
          return;
        }
      }
    }

    removeDocument(docId);
    if (typeof showToast === 'function') showToast(t('toast.closed'));
  } finally {
    closingDocument = false;
  }
}

function updateWindowTitle() {
  const doc = getActiveDocument();
  const base = 'A.R.P.O. TierMaker';
  document.title = doc ? `${doc.name}${doc.dirty ? ' •' : ''} — ${base}` : base;
}

function formatZoom(zoom) {
  const value = typeof zoom === 'number' && zoom > 0 ? zoom : 1;
  return (Math.round(value * 1000) / 10) + '%';
}

function updateActiveTabZoom() {
  const zoomEl = document.querySelector('#tabs .canvas-tab.active .canvas-tab-zoom');
  if (zoomEl) zoomEl.textContent = formatZoom(state.zoom);
}

function updateTabBar() {
  const tabs = document.getElementById('tabs');
  if (!tabs) return;

  tabs.innerHTML = '';
  state.documents.forEach(doc => {
    const tab = document.createElement('div');
    tab.className = 'canvas-tab'
      + (doc.id === state.activeDocId ? ' active' : '')
      + (doc.dirty ? ' dirty' : '');
    tab.dataset.docId = doc.id;
    tab.title = doc.name;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', doc.id === state.activeDocId ? 'true' : 'false');

    const dot = document.createElement('span');
    dot.className = 'canvas-tab-dot';
    dot.title = t('tab.unsaved');

    const name = document.createElement('span');
    name.className = 'canvas-tab-name';
    name.textContent = doc.name;

    const zoom = document.createElement('span');
    zoom.className = 'canvas-tab-zoom';
    zoom.textContent = formatZoom(doc.zoom);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'canvas-tab-close';
    close.title = t('tab.close');
    close.textContent = '×';

    tab.append(dot, name, zoom, close);
    tab.addEventListener('click', (e) => {
      if (e.target.closest('.canvas-tab-close')) return;
      activateDocument(doc.id);
    });
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDocument(doc.id);
    });
    tab.addEventListener('auxclick', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        closeDocument(doc.id);
      }
    });
    tabs.appendChild(tab);
  });

  const active = tabs.querySelector('.canvas-tab.active');
  if (active) {
    const left = active.offsetLeft;
    const right = left + active.offsetWidth;
    if (left < tabs.scrollLeft) {
      tabs.scrollLeft = left;
    } else if (right > tabs.scrollLeft + tabs.clientWidth) {
      tabs.scrollLeft = right - tabs.clientWidth;
    }
  }
  updateCanvasEmptyState();
  updateWindowTitle();
}

function updateCanvasEmptyState() {
  const empty = document.getElementById('canvasEmpty');
  if (!empty) return;
  const hasDoc = state.documents.length > 0;
  empty.hidden = hasDoc;
  const wrapper = document.getElementById('canvasWrapper');
  if (wrapper) wrapper.classList.toggle('is-empty', !hasDoc);
}

function setupTabBar() {
  document.getElementById('btnNewTab')?.addEventListener('click', () => {
    createNewDocument();
  });
  document.getElementById('btnEmptyNew')?.addEventListener('click', () => {
    createNewDocument();
  });
}
