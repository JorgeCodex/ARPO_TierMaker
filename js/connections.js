// ============================================================================
// CONEXIONES ENTRE PERSONAJES: crear, seleccionar y editar en vivo
// ============================================================================

let pendingConnection = null;
let lastEdgeType = 'green';
let noteHistoryTimer = null;
let edgeNoteChanged = false;

function edgeNodeName(id) {
  if (!getActiveDocument()) return '?';
  const node = state.nodes.find(n => n.id === id);
  if (!node) return '?';
  if (typeof getNodeFields === 'function') {
    const fields = getNodeFields(node);
    if (fields.length) return fields[0];
  }
  return node.name || (typeof t === 'function' ? t('char.unnamed') : '?');
}

function getCanvasRect() {
  const wrapper = document.getElementById('canvasWrapper');
  return wrapper ? wrapper.getBoundingClientRect() : { left: 0, top: 0 };
}

function nodeAtPoint(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  return el ? el.closest('.arpo-node') : null;
}

function selectedEdge() {
  if (!getActiveDocument() || !state.selectedEdgeId) return null;
  return state.edges.find(e => e.id === state.selectedEdgeId) || null;
}

// --- Crear conexión: botón 🔗 del personaje y luego clic en el destino ---

function startNodeConnection(fromId, e) {
  if (pendingConnection && pendingConnection.from === fromId) {
    cancelConnection();
    return;
  }
  cancelConnection();
  const fromNode = state.nodes.find(n => n.id === fromId && !n.inPool);
  if (!fromNode) return;

  pendingConnection = { from: fromId };
  if (typeof clearEdgeSelection === 'function') clearEdgeSelection();

  const line = document.getElementById('tempConnectionLine');
  if (line) line.style.display = 'block';
  document.getElementById('node-' + fromId)?.classList.add('connecting-source');
  updateTempLine(e ? e.clientX : null, e ? e.clientY : null);

  window.addEventListener('mousemove', onConnectingMove);
  window.addEventListener('mouseup', onConnectingMouseUp);
  window.addEventListener('mousedown', onConnectingMouseDown, true);
  window.addEventListener('keydown', onConnectingKey);

  showToast(t('toast.connectHint'), 3000);
}

function updateTempLine(clientX, clientY) {
  if (!pendingConnection) return;
  const fromNode = state.nodes.find(n => n.id === pendingConnection.from);
  const line = document.getElementById('tempConnectionLine');
  if (!fromNode || !line) return;
  const center = getNodeCenter(fromNode);
  const rect = getCanvasRect();
  const x1 = state.panX + center.x * state.zoom;
  const y1 = state.panY + center.y * state.zoom;
  const x2 = typeof clientX === 'number' ? clientX - rect.left : x1 + 1;
  const y2 = typeof clientY === 'number' ? clientY - rect.top : y1 + 1;
  line.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
}

function clearHighlight() {
  document.querySelectorAll('.arpo-node.connect-target').forEach(el => el.classList.remove('connect-target'));
}

function onConnectingMove(e) {
  if (!pendingConnection) return;
  updateTempLine(e.clientX, e.clientY);
  clearHighlight();
  const nodeEl = nodeAtPoint(e.clientX, e.clientY);
  if (nodeEl && nodeEl.id !== 'node-' + pendingConnection.from) {
    nodeEl.classList.add('connect-target');
  }
}

function onConnectingMouseDown(e) {
  if (!pendingConnection) return;
  if (e.button !== 0) {
    cancelConnection();
    return;
  }
  const nodeEl = nodeAtPoint(e.clientX, e.clientY);
  if (!nodeEl) {
    cancelConnection();
    return;
  }
  e.preventDefault();
  e.stopImmediatePropagation();
  const toId = nodeEl.id.replace(/^node-/, '');
  if (toId === pendingConnection.from) {
    cancelConnection();
    return;
  }
  createConnection(pendingConnection.from, toId);
}

function onConnectingMouseUp(e) {
  if (!pendingConnection) return;
  const nodeEl = nodeAtPoint(e.clientX, e.clientY);
  if (!nodeEl) return;
  const toId = nodeEl.id.replace(/^node-/, '');
  if (toId === pendingConnection.from) return;
  createConnection(pendingConnection.from, toId);
}

function onConnectingKey(e) {
  if (e.key === 'Escape') cancelConnection();
}

function cancelConnection() {
  const fromId = pendingConnection ? pendingConnection.from : null;
  pendingConnection = null;
  if (fromId) {
    document.getElementById('node-' + fromId)?.classList.remove('connecting-source');
  }
  document.querySelectorAll('.arpo-node.connecting-source').forEach(el => el.classList.remove('connecting-source'));
  clearHighlight();
  const line = document.getElementById('tempConnectionLine');
  if (line) line.style.display = 'none';
  window.removeEventListener('mousemove', onConnectingMove);
  window.removeEventListener('mouseup', onConnectingMouseUp);
  window.removeEventListener('mousedown', onConnectingMouseDown, true);
  window.removeEventListener('keydown', onConnectingKey);
}

function createConnection(fromId, toId) {
  if (!fromId || !toId || fromId === toId) {
    cancelConnection();
    return;
  }
  const existing = state.edges.find(ed =>
    (ed.from === fromId && ed.to === toId) || (ed.from === toId && ed.to === fromId));
  cancelConnection();
  if (existing) {
    showToast(t('toast.edgeExists'));
    selectEdge(existing.id);
    return;
  }
  const edge = {
    id: 'edge_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
    from: fromId,
    to: toId,
    type: lastEdgeType,
    note: ''
  };
  state.edges.push(edge);
  saveState();
  render();
  selectEdge(edge.id);
  showToast(t('toast.edgeCreated'));
}

// --- Selección y editor flotante ---

function selectEdge(edgeId) {
  const edge = state.edges.find(e => e.id === edgeId);
  if (!edge) return;
  state.selectedEdgeId = edgeId;
  state.selectedNodeIds = [];
  state.selectedNodeId = null;
  if (typeof syncSelectionClasses === 'function') syncSelectionClasses();
  if (typeof renderEdges === 'function') renderEdges();
}

function clearEdgeSelection() {
  flushEdgeEditor();
  if (!state.selectedEdgeId) return;
  state.selectedEdgeId = null;
  if (typeof renderEdges === 'function') renderEdges();
}

function flushEdgeEditor() {
  clearTimeout(noteHistoryTimer);
  noteHistoryTimer = null;
  if (!edgeNoteChanged) return;
  edgeNoteChanged = false;
  if (selectedEdge()) saveState();
}

function hideEdgeEditor() {
  const panel = document.getElementById('edgeEditor');
  if (panel) panel.style.display = 'none';
}

function updateEdgeEditor() {
  const panel = document.getElementById('edgeEditor');
  if (!panel) return;
  const edge = selectedEdge();
  if (!edge) {
    state.selectedEdgeId = null;
    hideEdgeEditor();
    return;
  }

  panel.style.display = 'block';
  const title = document.getElementById('edgeEditorTitle');
  if (title) {
    title.textContent = edgeNodeName(edge.from) + '  \u2192  ' + edgeNodeName(edge.to);
  }
  panel.querySelectorAll('.edge-editor-type').forEach(btn => {
    btn.classList.toggle('active', (edge.type || 'green') === btn.dataset.type);
  });
  const note = document.getElementById('edgeEditorNote');
  if (note && document.activeElement !== note) note.value = edge.note || '';

  positionEdgeEditor(panel, edge);
}

function positionEdgeEditor(panel, edge) {
  const fromNode = state.nodes.find(n => n.id === edge.from && !n.inPool);
  const toNode = state.nodes.find(n => n.id === edge.to && !n.inPool);
  if (!fromNode || !toNode) {
    hideEdgeEditor();
    return;
  }
  const a = getNodeCenter(fromNode);
  const b = getNodeCenter(toNode);
  const rect = getCanvasRect();
  const midX = rect.left + state.panX + ((a.x + b.x) / 2) * state.zoom;
  const midY = rect.top + state.panY + ((a.y + b.y) / 2) * state.zoom;
  const width = panel.offsetWidth || 250;
  const height = panel.offsetHeight || 220;
  const margin = 12;
  const gap = 24;
  const horizontal = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  let left;
  let top;
  if (horizontal) {
    // Conexión más horizontal: el recuadro va debajo (o encima) del punto medio.
    left = midX - width / 2;
    top = midY + gap;
    if (top + height > window.innerHeight - margin) top = midY - height - gap;
  } else {
    // Conexión más vertical: el recuadro va al lado derecho (o izquierdo).
    left = midX + gap;
    top = midY - height / 2;
    if (left + width > window.innerWidth - margin) left = midX - width - gap;
  }
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
  top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function commitEdgeChange() {
  clearTimeout(noteHistoryTimer);
  noteHistoryTimer = null;
  edgeNoteChanged = false;
  saveState();
}

function setEdgeType(type) {
  const edge = selectedEdge();
  if (!edge || !type) return;
  edge.type = type;
  lastEdgeType = type;
  commitEdgeChange();
  if (typeof renderEdges === 'function') renderEdges();
}

function reverseSelectedEdge() {
  const edge = selectedEdge();
  if (!edge) return;
  const from = edge.from;
  edge.from = edge.to;
  edge.to = from;
  commitEdgeChange();
  if (typeof renderEdges === 'function') renderEdges();
}

function onEdgeNoteInput(e) {
  const edge = selectedEdge();
  if (!edge) return;
  edge.note = e.target.value;
  edgeNoteChanged = true;
  if (typeof markProjectDirty === 'function') markProjectDirty();
  if (typeof renderEdges === 'function') renderEdges();
  clearTimeout(noteHistoryTimer);
  noteHistoryTimer = setTimeout(() => {
    noteHistoryTimer = null;
    if (!edgeNoteChanged) return;
    edgeNoteChanged = false;
    if (selectedEdge()) saveState();
  }, 700);
}

function deleteSelectedEdge() {
  const edge = selectedEdge();
  if (!edge) {
    state.selectedEdgeId = null;
    hideEdgeEditor();
    return;
  }
  clearTimeout(noteHistoryTimer);
  noteHistoryTimer = null;
  edgeNoteChanged = false;
  state.edges = state.edges.filter(e => e.id !== edge.id);
  state.selectedEdgeId = null;
  saveState();
  render();
  showToast(t('toast.edgeDeleted'));
}

// --- Listeners del editor ---

function setupEdgeEditor() {
  const panel = document.getElementById('edgeEditor');
  if (!panel) return;
  panel.querySelectorAll('.edge-editor-type').forEach(btn => {
    btn.addEventListener('click', () => setEdgeType(btn.dataset.type));
  });
  document.getElementById('edgeEditorReverse')?.addEventListener('click', reverseSelectedEdge);
  document.getElementById('edgeEditorDelete')?.addEventListener('click', deleteSelectedEdge);
  document.getElementById('edgeEditorClose')?.addEventListener('click', clearEdgeSelection);
  document.getElementById('edgeEditorNote')?.addEventListener('input', onEdgeNoteInput);
  window.addEventListener('resize', () => {
    if (typeof updateEdgeEditor === 'function') updateEdgeEditor();
  });
}

setupEdgeEditor();

window.startNodeConnection = startNodeConnection;
