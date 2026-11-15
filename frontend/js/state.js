// ============================================================================
// ESTADO DE LA APLICACIÓN
// ============================================================================

// Cada lienzo es un documento independiente (como las pestañas de Photoshop):
// guarda sus propios personajes, conexiones, vista, selección, historial y archivo.
const state = {
  documents: [],
  activeDocId: null,
  // Estado transitorio de la interfaz (no es por documento)
  connectingFrom: null,
  isPanning: false,
  startPanX: 0,
  startPanY: 0,
  maxHistory: 100,
  isRestoring: false
};

function getActiveDocument() {
  if (!state.documents.length) return null;
  let doc = state.documents.find(d => d.id === state.activeDocId);
  if (!doc) {
    doc = state.documents[0];
    state.activeDocId = doc.id;
  }
  return doc;
}

// Propiedades que viven dentro del documento activo. Así todo el código que ya
// usaba state.nodes / state.history sigue funcionando sin cambios.
['nodes', 'edges', 'zoom', 'panX', 'panY', 'selectedNodeId', 'selectedNodeIds', 'selectedEdgeId', 'history', 'historyIndex']
  .forEach(name => {
    Object.defineProperty(state, name, {
      get() {
        const doc = getActiveDocument();
        return doc ? doc[name] : undefined;
      },
      set(value) {
        const doc = getActiveDocument();
        if (doc) doc[name] = value;
      }
    });
  });

// ============================================================================
// HISTORIAL (DESHACER / REHACER)
// ============================================================================

function saveState() {
  if (state.isRestoring) return;
  const snapshot = JSON.parse(JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    selectedNodeId: state.selectedNodeId,
    selectedNodeIds: state.selectedNodeIds || []
  }));
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(snapshot);
  if (state.history.length > state.maxHistory) {
    state.history.shift();
    state.historyIndex--;
  } else {
    state.historyIndex++;
  }
  updateUndoRedoButtons();
  if (typeof markProjectDirty === 'function') markProjectDirty();
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  const doc = getActiveDocument();
  if (btnUndo) btnUndo.disabled = !doc || state.historyIndex <= 0;
  if (btnRedo) btnRedo.disabled = !doc || state.historyIndex >= state.history.length - 1;
}

function restoreState(snapshot) {
  const copy = JSON.parse(JSON.stringify(snapshot));
  state.nodes = copy.nodes;
  state.edges = copy.edges;
  state.selectedNodeId = copy.selectedNodeId || null;
  state.selectedNodeIds = Array.isArray(copy.selectedNodeIds)
    ? copy.selectedNodeIds
    : (copy.selectedNodeId ? [copy.selectedNodeId] : []);
}

function undo() {
  if (!getActiveDocument() || state.historyIndex <= 0) return;
  state.isRestoring = true;
  state.historyIndex--;
  restoreState(state.history[state.historyIndex]);
  state.isRestoring = false;
  if (typeof render === 'function') render();
  if (typeof markProjectDirty === 'function') markProjectDirty();
  updateUndoRedoButtons();
  showToast(t('toast.undone'));
}

function redo() {
  if (!getActiveDocument() || state.historyIndex >= state.history.length - 1) return;
  state.isRestoring = true;
  state.historyIndex++;
  restoreState(state.history[state.historyIndex]);
  state.isRestoring = false;
  if (typeof render === 'function') render();
  if (typeof markProjectDirty === 'function') markProjectDirty();
  updateUndoRedoButtons();
  showToast(t('toast.redone'));
}

// ============================================================================
// UTILIDADES DE UI
// ============================================================================

function showToast(msg, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Generar avatar SVG para un personaje sin imagen
function generateAvatarSvg(name, color = '#6366f1') {
  const initial = (name || 'A').charAt(0).toUpperCase();
  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" class="node-avatar-svg">
      <rect width="100" height="100" fill="${color}" fill-opacity="0.2"/>
      <text x="50" y="62" font-family="'Plus Jakarta Sans', sans-serif" font-size="40" font-weight="800" fill="#ffffff" text-anchor="middle">${initial}</text>
    </svg>
  `;
}