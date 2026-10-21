// ============================================================================
// BARRA DE MENÚS (estilo Photoshop)
// ============================================================================

function closeAllMenus() {
  document.querySelectorAll('.menu.open').forEach(m => m.classList.remove('open'));
}

function setupMenubar() {
  const menubar = document.getElementById('menubar');
  if (!menubar) return;

  menubar.querySelectorAll('.menu-label').forEach(label => {
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = label.closest('.menu');
      // Ayuda abre directamente el recuadro flotante
      if (label.id === 'menuHelpAbout') {
        closeAllMenus();
        if (typeof openModal === 'function') openModal('modalAbout');
        return;
      }
      const wasOpen = menu.classList.contains('open');
      closeAllMenus();
      if (!wasOpen) menu.classList.add('open');
    });
    label.addEventListener('mouseenter', () => {
      const menu = label.closest('.menu');
      // Al mantener un menú abierto, pasar el ratón por otro lo cambia
      if (label.id !== 'menuHelpAbout' && document.querySelector('.menu.open') && !menu.classList.contains('open')) {
        closeAllMenus();
        menu.classList.add('open');
      }
    });
  });

  // Cerrar al hacer clic fuera de la barra de menús
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#menubar')) closeAllMenus();
  });

  // Acciones del menú Archivo
  bindMenuAction('menuFileNew', () => { if (typeof newProject === 'function') newProject(); });
  bindMenuAction('menuFileOpen', () => { if (typeof requestOpenProject === 'function') requestOpenProject(); });
  bindMenuAction('menuFileClose', () => { if (typeof closeProject === 'function') closeProject(); });
  bindMenuAction('menuFileSave', () => { if (typeof saveProject === 'function') saveProject(); });
  bindMenuAction('menuFileSaveAs', () => { if (typeof saveProjectAs === 'function') saveProjectAs(); });
  bindMenuAction('menuFileExportPNG', () => { if (typeof exportCanvasAsPNG === 'function') exportCanvasAsPNG(); });
  bindMenuAction('menuFileExportJPG', () => { if (typeof exportCanvasAsJPG === 'function') exportCanvasAsJPG(); });
  bindMenuAction('menuFileImport', () => { if (typeof importImagesAsCharacters === 'function') importImagesAsCharacters(); });

  // Acciones del menú Editar
  bindMenuAction('menuEditUndo', () => undo());
  bindMenuAction('menuEditRedo', () => redo());
  bindMenuAction('menuEditDelete', deleteSelectedNode);
  bindMenuAction('menuEditClear', clearCanvasToPool);
  bindMenuAction('menuEditAlign', autoLayout);

  // Acciones del menú Interfaz
  bindMenuAction('menuInterfaceDrawer', toggleDrawer);
  bindMenuAction('menuViewCenter', centerView);
  bindMenuAction('menuViewZoomIn', () => zoomBy(1.15));
  bindMenuAction('menuViewZoomOut', () => zoomBy(0.87));
}

function bindMenuAction(id, action) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', () => {
    closeAllMenus();
    action();
  });
}

function setupWindowControls() {
  if (!window.arpoDesktop || !window.arpoDesktop.isElectron) return;
  document.documentElement.classList.add('is-electron');
  document.body.classList.add('is-electron');

  const minimize = document.getElementById('windowMinimize');
  const maximize = document.getElementById('windowMaximize');
  const close = document.getElementById('windowClose');
  const setMaximized = (maximized) => {
    const isMax = !!maximized;
    document.body.classList.toggle('window-maximized', isMax);
    if (maximize) {
      const key = isMax ? 'window.restore' : 'window.maximize';
      maximize.dataset.i18nTitle = key;
      maximize.title = t(key);
      maximize.setAttribute('aria-label', t(key));
    }
  };

  minimize?.addEventListener('click', () => window.arpoDesktop.minimize());
  maximize?.addEventListener('click', () => window.arpoDesktop.toggleMaximize());
  close?.addEventListener('click', () => window.arpoDesktop.close());

  if (typeof window.arpoDesktop.isMaximized === 'function') {
    window.arpoDesktop.isMaximized().then(setMaximized).catch(() => {});
  }
  if (typeof window.arpoDesktop.onMaximizedChange === 'function') {
    window.arpoDesktop.onMaximizedChange(setMaximized);
  }

  document.querySelector('header')?.addEventListener('dblclick', (e) => {
    if (e.target.closest('button, input, .menubar, .window-controls')) return;
    window.arpoDesktop.toggleMaximize();
  });
}

// ============================================================================
// PUNTO DE ENTRADA
// ============================================================================

function init() {
  setupEventListeners();
  setupMenubar();
  setupWindowControls();
  setupTabBar();
  ensureAtLeastOneDocument();
  const restored = typeof restoreAutosaveDraft === 'function' ? restoreAutosaveDraft() : false;
  render();
  if (!state.history.length) saveState();
  if (!restored && typeof setProjectDirty === 'function') setProjectDirty(false);
  updateTransform();
  updateUndoRedoButtons();
  updateTabBar();
}

function toggleDrawer() {
  const drawer = document.getElementById('characterDrawer');
  if (!drawer) return;
  const collapsed = drawer.classList.toggle('collapsed');
  const arrow = document.getElementById('drawerToggleArrow');
  if (arrow) arrow.textContent = collapsed ? '▲' : '▼';
}

const MIN_ZOOM = 0.01;

function zoomBy(factor) {
  if (!canvasWrapper || !getActiveDocument()) return;
  const cx = canvasWrapper.clientWidth / 2;
  const cy = canvasWrapper.clientHeight / 2;
  const newZoom = Math.min(Math.max(MIN_ZOOM, state.zoom * factor), 2.5);
  if (newZoom === state.zoom) return;
  const px = (cx - state.panX) / state.zoom;
  const py = (cy - state.panY) / state.zoom;
  state.zoom = newZoom;
  state.panX = cx - state.zoom * px;
  state.panY = cy - state.zoom * py;
  updateTransform();
}

function centerView() {
  if (!canvasWrapper || !getActiveDocument()) return;
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
    const h = el ? el.offsetHeight : getNodeHeight(n);
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + getNodeWidth(n));
    maxY = Math.max(maxY, n.y + h);
  });
  const pad = 80;
  const cw = canvasWrapper.clientWidth;
  const ch = canvasWrapper.clientHeight;
  const z = Math.max(MIN_ZOOM, Math.min(Math.min((cw - pad * 2) / (maxX - minX), (ch - pad * 2) / (maxY - minY)), 2.5));
  state.zoom = z;
  state.panX = cw / 2 - ((minX + maxX) / 2) * z;
  state.panY = ch / 2 - ((minY + maxY) / 2) * z;
  updateTransform();
}

function autoLayout() {
  if (!getActiveDocument()) return;
  const nodes = state.nodes.filter(n => !n.inPool);
  if (nodes.length === 0) {
    showToast(t('toast.noCanvasChars'));
    return;
  }

  const ids = new Set(nodes.map(n => n.id));
  const edges = state.edges.filter(e => ids.has(e.from) && ids.has(e.to) && e.from !== e.to);
  const byId = new Map(nodes.map(n => [n.id, n]));

  const H_GAP = 70;   // separación horizontal entre hermanos / iguales
  const V_GAP = 90;   // separación vertical entre generaciones

  // Ancho de columna: el del personaje más ancho para que nada se solape.
  const layoutW = nodes.reduce((max, n) => Math.max(max, getNodeWidth(n)), 0);
  let rowH = 0;
  nodes.forEach(n => {
    const el = document.getElementById('node-' + n.id);
    const h = el ? el.offsetHeight : getNodeHeight(n);
    if (h > rowH) rowH = h;
  });

  // Relaciones: verticales (superioridad) dirigidas y de igualdad (azul) en ambos sentidos.
  const inferiors = {};
  const equals = {};
  nodes.forEach(n => { inferiors[n.id] = []; equals[n.id] = []; });
  edges.forEach(e => {
    if (e.type === 'blue') {
      if (!equals[e.from].includes(e.to)) equals[e.from].push(e.to);
      if (!equals[e.to].includes(e.from)) equals[e.to].push(e.from);
    } else {
      inferiors[e.from].push(e.to);
    }
  });

  // Filas: se contraen las igualdades (azul) en grupos y se calcula la ruta más
  // larga sobre el grafo de grupos. Así un personaje queda por debajo de TODOS
  // sus superiores (no solo del primero que se procese), que era el fallo cuando
  // alguien tiene varios superiores.
  const uf = new Map(nodes.map(n => [n.id, n.id]));
  function find(x) {
    while (uf.get(x) !== x) {
      uf.set(x, uf.get(uf.get(x)));
      x = uf.get(x);
    }
    return x;
  }
  edges.forEach(e => {
    if (e.type !== 'blue') return;
    const a = find(e.from);
    const b = find(e.to);
    if (a !== b) uf.set(a, b);
  });

  const groupAdj = new Map();
  nodes.forEach(n => {
    const g = find(n.id);
    if (!groupAdj.has(g)) groupAdj.set(g, new Set());
  });
  edges.forEach(e => {
    if (e.type === 'blue') return;
    const a = find(e.from);
    const b = find(e.to);
    if (a === b) return;
    groupAdj.get(a).add(b);
  });

  // Se descartan las aristas de retroceso para poder calcular niveles (ciclos).
  const color = new Map();
  const dagAdj = new Map();
  groupAdj.forEach((_, g) => dagAdj.set(g, []));
  function dfs(g) {
    color.set(g, 1);
    groupAdj.get(g).forEach(h => {
      const c = color.get(h) || 0;
      if (c === 1) return;
      if (c === 0) dfs(h);
      dagAdj.get(g).push(h);
    });
    color.set(g, 2);
  }
  groupAdj.forEach((_, g) => { if (!color.get(g)) dfs(g); });

  const groupLevel = new Map();
  const indeg = new Map();
  groupAdj.forEach((_, g) => { groupLevel.set(g, 0); indeg.set(g, 0); });
  dagAdj.forEach(list => list.forEach(h => indeg.set(h, indeg.get(h) + 1)));
  const levelQueue = [];
  indeg.forEach((d, g) => { if (d === 0) levelQueue.push(g); });
  while (levelQueue.length) {
    const g = levelQueue.shift();
    dagAdj.get(g).forEach(h => {
      groupLevel.set(h, Math.max(groupLevel.get(h), groupLevel.get(g) + 1));
      indeg.set(h, indeg.get(h) - 1);
      if (indeg.get(h) === 0) levelQueue.push(h);
    });
  }

  const level = {};
  nodes.forEach(n => { level[n.id] = groupLevel.get(find(n.id)) || 0; });
  const maxLevel = nodes.reduce((m, n) => Math.max(m, level[n.id]), 0);

  const placed = new Set();
  const cells = [];
  const rowStep = rowH + V_GAP;

  function isFree(x, y) {
    return !cells.some(c => x < c.x + c.w + 24 && x + layoutW > c.x - 24 && y < c.y + c.h + 24 && y + rowH > c.y - 24);
  }

  function place(node, x, y, dir) {
    let px = x;
    let guard = 0;
    while (!isFree(px, y) && guard < 200) {
      px += (dir === 'left' ? -1 : 1) * (layoutW + H_GAP);
      guard++;
    }
    node.x = px;
    node.y = y;
    placed.add(node.id);
    cells.push({ x: px, y, w: layoutW, h: rowH });
    return px;
  }

  function nextComponentX() {
    let maxX = null;
    cells.forEach(c => {
      if (maxX === null || c.x + c.w > maxX) maxX = c.x + c.w;
    });
    return maxX === null ? 0 : maxX + H_GAP * 2;
  }

  // Igualdad: 1º derecha, 2º izquierda, 3º derecha, 4º izquierda… (alejándose del origen).
  function placePeers(node) {
    let count = 0;
    equals[node.id].forEach(peerId => {
      const peer = byId.get(peerId);
      if (!peer || placed.has(peer.id)) return;
      count++;
      const slot = Math.ceil(count / 2);
      const side = count % 2 === 1 ? 1 : -1;
      place(peer, node.x + side * slot * (layoutW + H_GAP), node.y, side > 0 ? 'right' : 'left');
    });
  }

  // Superioridad: 1º justo debajo, 2º derecha, 3º izquierda, 4º derecha… (en su fila).
  function placeChildren(node) {
    let count = 0;
    let rightSlot = 0;
    let leftSlot = 0;
    const childLevel = level[node.id] + 1;
    inferiors[node.id].forEach(childId => {
      const child = byId.get(childId);
      if (!child || placed.has(child.id)) return;
      // Solo se coloca aquí si esta es su fila real (puede tener superiores más abajo).
      if (level[child.id] !== childLevel) return;
      let x = node.x;
      let dir = 'right';
      if (count % 2 === 1) {
        rightSlot++;
        x = node.x + rightSlot * (layoutW + H_GAP);
      } else if (count > 0) {
        leftSlot++;
        x = node.x - leftSlot * (layoutW + H_GAP);
        dir = 'left';
      }
      count++;
      place(child, x, childLevel * rowStep, dir);
    });
  }

  // Se recorre fila por fila: los superiores siempre se colocan antes que sus inferiores.
  for (let L = 0; L <= maxLevel; L++) {
    nodes.forEach(node => {
      if (level[node.id] !== L) return;
      if (!placed.has(node.id)) {
        const peer = equals[node.id].map(id => byId.get(id)).find(p => p && placed.has(p.id));
        if (peer) {
          placePeers(peer);
        } else {
          place(node, nextComponentX(), L * rowStep, 'right');
          placePeers(node);
        }
      }
      if (!placed.has(node.id)) return;
      placePeers(node);
      placeChildren(node);
    });
  }

  saveState();
  render();
  centerView();
  showToast(t('toast.aligned'));
}

// Elimina los personajes seleccionados (Editar > Eliminar personaje / Supr)
function deleteSelectedNode() {
  if (!getActiveDocument()) return;
  if (typeof deleteSelectedNodes === 'function') {
    deleteSelectedNodes();
  } else if (state.selectedNodeId) {
    window.deleteNode(state.selectedNodeId);
  }
}

// "Suprimir todo": devuelve todos los personajes del lienzo a la barra
function clearCanvasToPool() {
  if (!getActiveDocument()) return;
  const onCanvas = state.nodes.filter(n => !n.inPool);
  if (onCanvas.length === 0) {
    showToast(t('toast.noCanvasChars'));
    return;
  }
  state.nodes.forEach(n => { n.inPool = true; });
  state.edges = [];
  if (typeof clearSelection === 'function') clearSelection();
  saveState();
  render();
  showToast(t('toast.cleared'));
}

function setupEventListeners() {
  // Canvas Panning
  if (canvasWrapper) {
    // Shift + clic izquierdo: recuadro de selección (se captura antes que el nodo)
    canvasWrapper.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || !e.shiftKey) return;
      if (e.target.closest('button')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (typeof startSelectionBox === 'function') startSelectionBox(e);
    }, true);

    canvasWrapper.addEventListener('mousedown', (e) => {
      if (state.spaceHeld || e.target === canvasWrapper || e.target === document.getElementById('graphCanvas')) {
        e.preventDefault();
        if (!state.spaceHeld && typeof clearSelection === 'function') clearSelection();
        state.isPanning = true;
        state.startPanX = e.clientX - state.panX;
        state.startPanY = e.clientY - state.panY;
        canvasWrapper.classList.add('panning');
      }
    });

    canvasWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!getActiveDocument()) return;
      const rect = canvasWrapper.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(MIN_ZOOM, state.zoom * zoomFactor), 2.5);
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
      if (!getActiveDocument()) return;
      const nodeId = e.dataTransfer.getData('text/plain');
      if (!nodeId) return;
      const node = state.nodes.find(n => n.id === nodeId);
      if (node && node.inPool) {
        const rect = canvasWrapper.getBoundingClientRect();
        const cx = (e.clientX - rect.left - state.panX) / state.zoom;
        const cy = (e.clientY - rect.top - state.panY) / state.zoom;
        node.inPool = false;
        const format = NODE_FORMATS[normalizeNodeFormat(node.format)];
        const size = getNodeSize();
        node.x = cx - (format.w * size) / 2;
        node.y = cy - (format.h * size) / 2;
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

  // Mostrar / ocultar barra de personajes
  document.getElementById('drawerToggle')?.addEventListener('click', toggleDrawer);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    const typing = e.target.closest('input, select, textarea');
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key.toLowerCase() === 'o') {
      e.preventDefault();
      if (typeof requestOpenProject === 'function') requestOpenProject();
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
    if (e.key === 'Escape') {
      const openMenu = document.querySelector('.menu.open');
      if (openMenu) {
        closeAllMenus();
        return;
      }
      const activeModal = document.querySelector('.modal-backdrop.active');
      if (activeModal) {
        if (activeModal.id === 'modalCrop' && typeof closeCropModal === 'function') {
          closeCropModal();
        } else if (activeModal.id === 'modalUnsaved' && typeof cancelUnsavedPrompt === 'function') {
          cancelUnsavedPrompt();
        } else {
          activeModal.classList.remove('active');
        }
        return;
      }
      if (typing) return;
      if (typeof selectedEdge === 'function' && selectedEdge() &&
          typeof clearEdgeSelection === 'function') {
        clearEdgeSelection();
        return;
      }
      if (typeof clearSelection === 'function') {
        clearSelection();
      } else {
        state.selectedNodeId = null;
        renderNodes();
      }
      return;
    }

    if (typing) return;

    if ((e.key === 'Delete' || e.key === 'Backspace') &&
        typeof selectedEdge === 'function' && selectedEdge() &&
        typeof deleteSelectedEdge === 'function') {
      e.preventDefault();
      deleteSelectedEdge();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') &&
        typeof getSelectedNodeIds === 'function' && getSelectedNodeIds().length) {
      e.preventDefault();
      deleteSelectedNodes();
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
