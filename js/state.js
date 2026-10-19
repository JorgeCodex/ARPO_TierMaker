// ============================================================================
// ESTADO DE LA APLICACIÓN
// ============================================================================

const state = {
  nodes: [],
  edges: [],
  zoom: 1,
  panX: 0,
  panY: 0,
  selectedNodeId: null,
  connectingFrom: null,
  isPanning: false,
  startPanX: 0,
  startPanY: 0,
  // Historial para deshacer/rehacer
  history: [],
  historyIndex: -1,
  maxHistory: 50,
  isRestoring: false
};

// ============================================================================
// HISTORIAL (DESHACER / REHACER)
// ============================================================================

function saveState() {
  if (state.isRestoring) return;
  const snapshot = JSON.parse(JSON.stringify({
    nodes: state.nodes,
    edges: state.edges,
    zoom: state.zoom,
    panX: state.panX,
    panY: state.panY,
    selectedNodeId: state.selectedNodeId
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
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  if (btnUndo) btnUndo.disabled = state.historyIndex <= 0;
  if (btnRedo) btnRedo.disabled = state.historyIndex >= state.history.length - 1;
}

function restoreState(snapshot) {
  const copy = JSON.parse(JSON.stringify(snapshot));
  state.nodes = copy.nodes;
  state.edges = copy.edges;
  state.zoom = copy.zoom;
  state.panX = copy.panX;
  state.panY = copy.panY;
  state.selectedNodeId = copy.selectedNodeId || null;
}

function undo() {
  if (state.historyIndex <= 0) return;
  state.isRestoring = true;
  state.historyIndex--;
  restoreState(state.history[state.historyIndex]);
  state.isRestoring = false;
  if (typeof render === 'function') render();
  updateUndoRedoButtons();
  showToast(t('toast.undone'));
}

function redo() {
  if (state.historyIndex >= state.history.length - 1) return;
  state.isRestoring = true;
  state.historyIndex++;
  restoreState(state.history[state.historyIndex]);
  state.isRestoring = false;
  if (typeof render === 'function') render();
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