// ============================================================================
// PUNTO DE ENTRADA
// ============================================================================

function init() {
  setupEventListeners();
  render();
  saveState();
  updateTransform();
  updateUndoRedoButtons();
}

function toggleDrawer() {
  const drawer = document.getElementById('characterDrawer');
  if (!drawer) return;
  const collapsed = drawer.classList.toggle('collapsed');
  const arrow = document.getElementById('drawerToggleArrow');
  if (arrow) arrow.textContent = collapsed ? '▲' : '▼';
}

function zoomBy(factor) {
  if (!canvasWrapper) return;
  const cx = canvasWrapper.clientWidth / 2;
  const cy = canvasWrapper.clientHeight / 2;
  const newZoom = Math.min(Math.max(0.4, state.zoom * factor), 2.5);
  if (newZoom === state.zoom) return;
  const px = (cx - state.panX) / state.zoom;
  const py = (cy - state.panY) / state.zoom;
  state.zoom = newZoom;
  state.panX = cx - state.zoom * px;
  state.panY = cy - state.zoom * py;
  updateTransform();
}

function centerView() {
  if (!canvasWrapper) return;
  const nodes = state.nodes.filter(n => !n.inPool);
  if (nodes.length === 0) {
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    updateTransform();
    return;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach(n => {
    const el = document.getElementById('node-' + n.id);
    const h = el ? el.offsetHeight : 175;
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + 175);
    maxY = Math.max(maxY, n.y + h);
  });
  const pad = 80;
  const cw = canvasWrapper.clientWidth;
  const ch = canvasWrapper.clientHeight;
  const z = Math.max(0.4, Math.min(Math.min((cw - pad * 2) / (maxX - minX), (ch - pad * 2) / (maxY - minY)), 2.5));
  state.zoom = z;
  state.panX = cw / 2 - ((minX + maxX) / 2) * z;
  state.panY = ch / 2 - ((minY + maxY) / 2) * z;
  updateTransform();
}

function autoLayout() {
  const nodes = state.nodes.filter(n => !n.inPool);
  if (nodes.length === 0) {
    showToast(t('toast.noCanvasChars'));
    return;
  }

  const ids = new Set(nodes.map(n => n.id));
  const edges = state.edges.filter(e => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);

  const incoming = {};
  const outgoing = {};
  nodes.forEach(n => { incoming[n.id] = []; outgoing[n.id] = []; });
  edges.forEach(e => {
    incoming[e.to].push(e.from);
    outgoing[e.from].push(e.to);
  });

  // Profundidad por jerarquía (Kahn): raíces (sin entrantes) arriba.
  const inDeg = {};
  nodes.forEach(n => { inDeg[n.id] = incoming[n.id].length; });
  const depth = {};
  const queue = [];
  nodes.forEach(n => { if (inDeg[n.id] === 0) { depth[n.id] = 0; queue.push(n.id); } });
  let qi = 0;
  while (qi < queue.length) {
    const u = queue[qi++];
    outgoing[u].forEach(v => {
      if (depth[v] === undefined || depth[v] < depth[u] + 1) depth[v] = depth[u] + 1;
      inDeg[v]--;
      if (inDeg[v] === 0) queue.push(v);
    });
  }
  nodes.forEach(n => { if (depth[n.id] === undefined) depth[n.id] = 0; });

  const levels = {};
  nodes.forEach(n => {
    const d = depth[n.id];
    (levels[d] = levels[d] || []).push(n);
  });
  const sortedDepths = Object.keys(levels).map(Number).sort((a, b) => a - b);

  const NODE_W = 175;
  const H_GAP = 120;
  const V_GAP = 90;
  const CELL = NODE_W + H_GAP;
  const placed = {};

  // X por niveles: los hijos se centran bajo sus padres y se evita el solape.
  sortedDepths.forEach((d, li) => {
    const arr = levels[d];
    if (li === 0) {
      arr.forEach((n, i) => { placed[n.id] = i * CELL; });
    } else {
      arr.forEach(n => {
        const parents = incoming[n.id].filter(pid => placed[pid] !== undefined);
        if (parents.length) {
          let sum = 0;
          parents.forEach(pid => { sum += placed[pid]; });
          placed[n.id] = sum / parents.length;
        } else {
          placed[n.id] = 0;
        }
      });
      arr.sort((a, b) => placed[a.id] - placed[b.id]);
      for (let i = 1; i < arr.length; i++) {
        if (placed[arr[i].id] < placed[arr[i - 1].id] + CELL) {
          placed[arr[i].id] = placed[arr[i - 1].id] + CELL;
        }
      }
    }
    levels[d] = arr;
  });

  // Y por niveles: usa la altura real del nodo más alto de cada fila.
  let y = 0;
  sortedDepths.forEach(d => {
    const arr = levels[d];
    let maxH = NODE_W;
    arr.forEach(n => {
      n.y = y;
      const el = document.getElementById('node-' + n.id);
      const h = el ? el.offsetHeight : NODE_W;
      if (h > maxH) maxH = h;
    });
    y += maxH + V_GAP;
  });
  nodes.forEach(n => { if (placed[n.id] !== undefined) n.x = placed[n.id]; });

  saveState();
  render();
  centerView();
  showToast(t('toast.aligned'));
}

function setupEventListeners() {
  // Canvas Panning
  if (canvasWrapper) {
    canvasWrapper.addEventListener('mousedown', (e) => {
      if (state.spaceHeld || e.target === canvasWrapper || e.target === document.getElementById('graphCanvas')) {
        e.preventDefault();
        state.isPanning = true;
        state.startPanX = e.clientX - state.panX;
        state.startPanY = e.clientY - state.panY;
        canvasWrapper.classList.add('panning');
      }
    });

    canvasWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvasWrapper.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(0.4, state.zoom * zoomFactor), 2.5);
      if (newZoom === state.zoom) return;
      const px = (cx - state.panX) / state.zoom;
      const py = (cy - state.panY) / state.zoom;
      state.zoom = newZoom;
      state.panX = cx - state.zoom * px;
      state.panY = cy - state.zoom * py;
      updateTransform();
    });

    // Canvas Drop: recibir personaje desde el pool
    canvasWrapper.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    canvasWrapper.addEventListener('drop', (e) => {
      e.preventDefault();
      const nodeId = e.dataTransfer.getData('text/plain');
      if (!nodeId) return;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node && node.inPool) {
        const rect = canvasWrapper.getBoundingClientRect();
        const cx = (e.clientX - rect.left - state.panX) / state.zoom;
        const cy = (e.clientY - rect.top - state.panY) / state.zoom;
        node.inPool = false;
        node.x = cx - 87.5;
        node.y = cy - 87.5;
        saveState();
        render();
        showToast(t('toast.placed', { name: node.name }));
      }
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (state.isPanning) {
      state.panX = e.clientX - state.startPanX;
      state.panY = e.clientY - state.startPanY;
      updateTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    state.isPanning = false;
    if (canvasWrapper) canvasWrapper.classList.remove('panning');
  });

  // Botón + Agregar Personaje - abre la carta de personaje
  document.getElementById('btnAddChar')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof openCharacterModal === 'function') {
      openCharacterModal();
    }
  });

  // Deshacer / Rehacer
  document.getElementById('btnUndo')?.addEventListener('click', () => undo());
  document.getElementById('btnRedo')?.addEventListener('click', () => redo());

  // Mostrar / ocultar barra de personajes
  document.getElementById('drawerToggle')?.addEventListener('click', toggleDrawer);

  // Autoalinear por jerarquía
  document.getElementById('btnAutoLayout')?.addEventListener('click', autoLayout);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const typing = e.target.closest('input, select, textarea');
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      if (typeof openProject === 'function') openProject();
      return;
    }
    if (ctrl && e.key === ',') {
      e.preventDefault();
      if (typeof openSettings === 'function') openSettings();
      return;
    }
    if (ctrl && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleDrawer();
      return;
    }
    if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if ((ctrl && e.key.toLowerCase() === 'y') || (ctrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
      e.preventDefault();
      redo();
      return;
    }
    if (typing) return;

    if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedNodeId) {
      e.preventDefault();
      window.deleteNode(state.selectedNodeId);
      return;
    }
    if (e.key === 't' || e.key === 'T') {
      if (typeof toggleTheme === 'function') toggleTheme();
      return;
    }
    if (e.key === '0') {
      centerView();
      return;
    }
    if (e.key === '+' || e.key === '=') {
      zoomBy(1.15);
      return;
    }
    if (e.key === '-' || e.key === '_') {
      zoomBy(0.87);
      return;
    }
    if (e.code === 'Space' && !e.repeat && !e.target.closest('button')) {
      e.preventDefault();
      state.spaceHeld = true;
      if (canvasWrapper) canvasWrapper.classList.add('space-pan');
      const panHint = document.getElementById('panHint');
      if (panHint) panHint.classList.add('visible');
      return;
    }
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) {
        if (activeModal.id === 'modalCrop' && typeof closeCropModal === 'function') {
          closeCropModal();
        } else {
          activeModal.classList.remove('active');
        }
        return;
      }
      state.selectedNodeId = null;
      renderNodes();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      state.spaceHeld = false;
      if (canvasWrapper) canvasWrapper.classList.remove('space-pan');
      const panHint = document.getElementById('panHint');
      if (panHint) panHint.classList.remove('visible');
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && state.isPanning) {
      state.isPanning = false;
      const panHint = document.getElementById('panHint');
      if (panHint) panHint.classList.remove('visible');
      if (canvasWrapper) canvasWrapper.classList.remove('panning');
    }
  });
}

// Iniciar aplicación
window.addEventListener('DOMContentLoaded', init);