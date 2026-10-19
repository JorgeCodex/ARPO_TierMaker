// ============================================================================
// SISTEMA DE CONEXIONES ENTRE PERSONAJES (A.R.P.O.)
// ============================================================================

let pendingConnection = null;
let currentEdge = null;
let selectedEdgeType = 'green';
let highlightedTarget = null;

function edgeNodeName(id) {
  const node = state.nodes.find(n => n.id === id);
  if (!node) return '?';
  if (typeof getNodeFields === 'function') {
    const fields = getNodeFields(node);
    if (fields.length) return fields[0];
  }
  return node.name || '?';
}

function getCanvasRect() {
  const wrapper = document.getElementById('canvasWrapper');
  return wrapper ? wrapper.getBoundingClientRect() : { left: 0, top: 0 };
}

// --- Arrastre para crear una conexión (desde el handle inferior del nodo) ---

function startConnection(fromId, e) {
  if (pendingConnection) return;
  e.stopPropagation();
  e.preventDefault();
  pendingConnection = { from: fromId };
  const line = document.getElementById('tempConnectionLine');
  if (line) line.style.display = 'block';
  updateTempLine(e.clientX, e.clientY);
  window.addEventListener('mousemove', onConnectingMove);
  window.addEventListener('mouseup', onConnectingEnd, true);
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
  const x2 = clientX - rect.left;
  const y2 = clientY - rect.top;
  line.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
}

function clearHighlight() {
  if (highlightedTarget) {
    highlightedTarget.classList.remove('connect-target');
    highlightedTarget = null;
  }
}

function onConnectingMove(e) {
  updateTempLine(e.clientX, e.clientY);
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const nodeEl = el ? el.closest('.arpo-node') : null;
  clearHighlight();
  if (nodeEl && nodeEl.id !== 'node-' + pendingConnection.from) {
    nodeEl.classList.add('connect-target');
    highlightedTarget = nodeEl;
  }
}

function onConnectingEnd(e) {
  window.removeEventListener('mousemove', onConnectingMove);
  window.removeEventListener('mouseup', onConnectingEnd, true);
  const line = document.getElementById('tempConnectionLine');
  if (line) line.style.display = 'none';
  clearHighlight();

  const pending = pendingConnection;
  pendingConnection = null;
  if (!pending) return;

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const nodeEl = el ? el.closest('.arpo-node') : null;
  if (!nodeEl) return;
  const toId = nodeEl.id.replace('node-', '');
  if (!toId || toId === pending.from) return;

  const exists = state.edges.some(ed => ed.from === pending.from && ed.to === toId);
  if (exists) {
    showToast(t('toast.edgeExists'));
    return;
  }

  openEdgeModal({ from: pending.from, to: toId });
}

// --- Modal de conexión ---

function highlightTypeButton(type) {
  document.querySelectorAll('#edgeTypeOptions .edge-type-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.type === type);
  });
}

function openEdgeModal(edge) {
  const modal = document.getElementById('modalEdge');
  if (!modal) return;

  currentEdge = edge;
  selectedEdgeType = (edge && edge.type) || 'green';

  const editing = !!(edge && edge.id);
  const title = document.getElementById('modalEdgeTitle');
  const subtitle = document.getElementById('modalEdgeSubtitle');
  const noteInput = document.getElementById('edgeNoteInput');
  const delBtn = document.getElementById('btnEdgeDelete');

  if (title) title.textContent = editing ? t('edge.titleEdit') : t('edge.titleNew');
  if (subtitle) subtitle.textContent = edgeNodeName(edge.from) + '  \u2192  ' + edgeNodeName(edge.to);
  if (noteInput) noteInput.value = (edge && edge.note) || '';
  if (delBtn) delBtn.style.display = editing ? 'inline-flex' : 'none';

  highlightTypeButton(selectedEdgeType);
  openModal('modalEdge');
}

function saveEdge() {
  if (!currentEdge) return;
  const noteInput = document.getElementById('edgeNoteInput');
  const note = noteInput ? noteInput.value.trim() : '';

  if (currentEdge.id) {
    const edge = state.edges.find(ed => ed.id === currentEdge.id);
    if (edge) {
      edge.type = selectedEdgeType;
      edge.note = note;
    }
  } else {
    state.edges.push({
      id: 'edge_' + Date.now(),
      from: currentEdge.from,
      to: currentEdge.to,
      type: selectedEdgeType,
      note: note
    });
    showToast(t('toast.edgeCreated'));
  }

  currentEdge = null;
  closeModal('modalEdge');
  saveState();
  render();
}

function deleteEdge() {
  if (!currentEdge || !currentEdge.id) return;
  state.edges = state.edges.filter(ed => ed.id !== currentEdge.id);
  currentEdge = null;
  closeModal('modalEdge');
  saveState();
  render();
  showToast(t('toast.edgeDeleted'));
}

// --- Listeners ---

document.getElementById('nodesContainer')?.addEventListener('mousedown', (e) => {
  const handle = e.target.closest('.handle-point');
  if (handle && handle.dataset.handle === 'out') {
    startConnection(handle.dataset.id, e);
  }
});

document.querySelectorAll('#edgeTypeOptions .edge-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedEdgeType = btn.dataset.type;
    highlightTypeButton(selectedEdgeType);
  });
});

document.getElementById('btnEdgeSave')?.addEventListener('click', saveEdge);
document.getElementById('btnEdgeDelete')?.addEventListener('click', deleteEdge);

window.openEdgeModal = openEdgeModal;
