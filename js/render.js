// ============================================================================
// Formatos de imagen y tamaño global de los personajes
const NODE_FORMATS = {
  square: { w: 175, h: 175 },
  round: { w: 175, h: 175 },
  wide: { w: 280, h: 157.5 },
  standard: { w: 220, h: 165 }
};

function normalizeNodeFormat(format) {
  return NODE_FORMATS[format] ? format : 'square';
}

function getNodeSize() {
  return typeof getPref === 'function' ? (Number(getPref('nodeSize')) || 1) : 1;
}

function getNodeWidth(node) {
  const el = document.getElementById('node-' + node.id);
  if (el) return el.offsetWidth;
  const format = NODE_FORMATS[normalizeNodeFormat(node.format)];
  return format.w * getNodeSize();
}

function getNodeHeight(node) {
  const el = document.getElementById('node-' + node.id);
  if (el) return el.offsetHeight;
  const format = NODE_FORMATS[normalizeNodeFormat(node.format)];
  return (format.h + 30) * getNodeSize();
}

// Centro del recuadro de un personaje (usado para anclar las flechas)
function getNodeCenter(node) {
  const el = document.getElementById('node-' + node.id);
  const box = el ? el.querySelector('.node-image-box') : null;
  const width = box ? box.offsetWidth : getNodeWidth(node);
  const height = box ? box.offsetHeight : getNodeHeight(node);
  const top = box ? box.offsetTop : 0;
  return { x: node.x + width / 2, y: node.y + top + height / 2 };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Construye la ruta recta añadiendo vértices intermedios equiespaciados,
// de modo que marker-mid dibuje el patrón de flechitas a lo largo de la línea.
function buildEdgePath(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);

  let d = `M ${x1} ${y1}`;

  if (len >= 50) {
    const intervals = Math.max(2, Math.round(len / 30));
    const step = len / intervals;
    const ux = dx / len;
    const uy = dy / len;
    for (let i = 1; i < intervals; i++) {
      const px = x1 + ux * step * i;
      const py = y1 + uy * step * i;
      d += ` L ${px} ${py}`;
    }
  }

  d += ` L ${x2} ${y2}`;
  return d;
}

function renderEdges() {
  if (!edgesGroup) return;
  edgesGroup.innerHTML = '';

  const segments = [];
  state.edges.forEach(edge => {
    const fromNode = state.nodes.find(n => n.id === edge.from && !n.inPool);
    const toNode = state.nodes.find(n => n.id === edge.to && !n.inPool);
    if (!fromNode || !toNode) return;

    const a = getNodeCenter(fromNode);
    const b = getNodeCenter(toNode);
    segments.push({ edge, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  });

  // 1) Líneas continuas con patrón de flechitas internas (marker-mid).
  // La conexión seleccionada se dibuja al final para que quede por encima.
  const ordered = segments.slice().sort((a, b) => {
    const as = a.edge.id === state.selectedEdgeId ? 1 : 0;
    const bs = b.edge.id === state.selectedEdgeId ? 1 : 0;
    return as - bs;
  });
  ordered.forEach(s => {
    const type = s.edge.type || 'green';
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', buildEdgePath(s.x1, s.y1, s.x2, s.y2));
    path.setAttribute('class',
      `arpo-edge edge-${type}${s.edge.id === state.selectedEdgeId ? ' selected' : ''}`);
    path.setAttribute('id', `edge-${s.edge.id}`);
    // El azul representa igualdad: sin flechas de dirección.
    if (type !== 'blue') {
      path.setAttribute('marker-mid', `url(#arrow-${type})`);
    }
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof selectEdge === 'function') selectEdge(s.edge.id);
    });
    edgesGroup.appendChild(path);
  });

  // 2) Etiquetas (nota)
  const showNotes = typeof getPref !== 'function' || getPref('showNotes') !== false;
  if (showNotes) {
    segments.forEach(s => {
      const note = (s.edge.note || '').trim();
      if (!note) return;
      const width = Math.max(40, Math.min(260, note.length * 6.5 + 14));
      const midX = (s.x1 + s.x2) / 2 - width / 2;
      const midY = (s.y1 + s.y2) / 2 - 8;
      const labelG = document.createElementNS(SVG_NS, 'g');
      labelG.setAttribute('class', 'edge-label-group');
      labelG.setAttribute('transform', `translate(${midX}, ${midY})`);
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('class', 'edge-label-bg');
      rect.setAttribute('width', String(width));
      rect.setAttribute('height', '16');
      rect.setAttribute('rx', '3');
      rect.setAttribute('ry', '3');
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('class', 'edge-label');
      text.setAttribute('x', String(width / 2));
      text.setAttribute('y', '12');
      text.setAttribute('text-anchor', 'middle');
      text.textContent = note;
      labelG.appendChild(rect);
      labelG.appendChild(text);
      edgesGroup.appendChild(labelG);
    });
  }

  if (typeof updateEdgeEditor === 'function') updateEdgeEditor();
}
// RENDERIZADO (parte 1 de 2)
// ============================================================================

const canvasWrapper = document.getElementById('canvasWrapper');
const nodesContainer = document.getElementById('nodesContainer');
const edgesGroup = document.getElementById('edgesGroup');
const poolContainer = document.getElementById('poolContainer');

// Imagen del personaje que se está editando (fuente de verdad del modal)
let editImageData = '';
// Imagen original sin recortar (para poder reajustar el zoom)
let editImageOriginal = '';
// Formato de imagen del personaje que se está editando
let editImageFormat = 'square';

function updateCharImagePreview() {
  const previewImg = document.getElementById('charImagePreview');
  const empty = document.getElementById('charImageEmpty');
  if (!previewImg || !empty) return;
  const wrap = previewImg.closest('.char-image-preview');
  if (wrap) {
    const format = NODE_FORMATS[normalizeNodeFormat(editImageFormat)];
    wrap.style.height = Math.round(84 * format.h / format.w) + 'px';
    wrap.style.borderRadius = editImageFormat === 'round' ? '50%' : '10px';
  }
  if (editImageData) {
    previewImg.src = editImageData;
    previewImg.style.display = 'block';
    empty.style.display = 'none';
  } else {
    previewImg.removeAttribute('src');
    previewImg.style.display = 'none';
    empty.style.display = 'block';
  }
}

let charFields = [''];

function fieldsFromNode(node) {
  if (node && Array.isArray(node.fields) && node.fields.length) return node.fields.slice();
  if (node && node.name) return [node.name];
  return [''];
}

function renderCharFields() {
  const list = document.getElementById('charFieldsList');
  if (!list) return;
  list.innerHTML = '';
  charFields.forEach((val, i) => {
    const row = document.createElement('div');
    row.className = 'char-field-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.value = val;
    input.placeholder = i === 0 ? t('char.namePlaceholder') : t('char.fieldPlaceholder');
    input.addEventListener('input', () => { charFields[i] = input.value; });
    row.appendChild(input);

    if (charFields.length > 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'char-field-remove';
      btn.title = t('char.removeField');
      btn.textContent = '\u00d7';
      btn.addEventListener('click', () => {
        charFields.splice(i, 1);
        renderCharFields();
      });
      row.appendChild(btn);
    }

    list.appendChild(row);
  });
}

function updateTransform() {
  const transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
  nodesContainer.style.transform = transform;
  if (edgesGroup) edgesGroup.setAttribute('transform', `translate(${state.panX}, ${state.panY}) scale(${state.zoom})`);
  if (typeof updateActiveTabZoom === 'function') updateActiveTabZoom();
  if (typeof updateEdgeEditor === 'function') updateEdgeEditor();
}

function render() {
  renderNodes();
  renderEdges();
  renderPool();
  updateTransform();
}

function getNodeFields(node) {
  const fields = (Array.isArray(node.fields) && node.fields.length) ? node.fields : [node.name];
  return fields.filter(f => f && f.trim());
}

// --- Selección de personajes ---

function getSelectedNodeIds() {
  const ids = Array.isArray(state.selectedNodeIds) ? state.selectedNodeIds : [];
  if (ids.length) return ids;
  return state.selectedNodeId ? [state.selectedNodeId] : [];
}

function syncSelectionClasses() {
  const ids = new Set(getSelectedNodeIds());
  document.querySelectorAll('.arpo-node.selected').forEach(el => {
    if (!ids.has(el.id.replace(/^node-/, ''))) el.classList.remove('selected');
  });
  ids.forEach(id => {
    const el = document.getElementById('node-' + id);
    if (el) el.classList.add('selected');
  });
}

function setSelection(nodeIds) {
  if (state.selectedEdgeId && typeof clearEdgeSelection === 'function') {
    clearEdgeSelection();
  }
  const ids = Array.from(new Set(nodeIds));
  state.selectedNodeIds = ids;
  state.selectedNodeId = ids.length ? ids[ids.length - 1] : null;
  syncSelectionClasses();
}

function selectNode(nodeId) {
  setSelection([nodeId]);
}

function clearSelection() {
  if (state.selectedEdgeId && typeof clearEdgeSelection === 'function') {
    clearEdgeSelection();
  }
  state.selectedNodeIds = [];
  state.selectedNodeId = null;
  document.querySelectorAll('.arpo-node.selected').forEach(el => el.classList.remove('selected'));
}

// --- Recuadro de selección (Shift + arrastrar) ---

let activeSelectionBox = null;

function ensureSelectionBox() {
  let box = document.getElementById('selectionBox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'selectionBox';
    box.className = 'selection-box';
    canvasWrapper.appendChild(box);
  }
  return box;
}

function updateSelectionBox(box, left, top, width, height) {
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
  box.style.width = `${width}px`;
  box.style.height = `${height}px`;
}

function nodesInScreenRect(left, top, width, height) {
  const ids = [];
  state.nodes.forEach(node => {
    if (node.inPool) return;
    const el = document.getElementById('node-' + node.id);
    const nx = state.panX + node.x * state.zoom;
    const ny = state.panY + node.y * state.zoom;
    const nw = (el ? el.offsetWidth : getNodeWidth(node)) * state.zoom;
    const nh = (el ? el.offsetHeight : getNodeHeight(node)) * state.zoom;
    const touches = nx < left + width && nx + nw > left &&
                    ny < top + height && ny + nh > top;
    if (touches) ids.push(node.id);
  });
  return ids;
}

function startSelectionBox(e) {
  if (!canvasWrapper || activeSelectionBox) return;
  const rect = canvasWrapper.getBoundingClientRect();
  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;
  const box = ensureSelectionBox();
  activeSelectionBox = { box, startX, startY };
  box.style.display = 'block';
  updateSelectionBox(box, startX, startY, 0, 0);
  clearSelection();
  canvasWrapper.classList.add('selecting');

  const onMouseMove = (moveEvent) => {
    const cx = moveEvent.clientX - rect.left;
    const cy = moveEvent.clientY - rect.top;
    const left = Math.min(startX, cx);
    const top = Math.min(startY, cy);
    const width = Math.abs(cx - startX);
    const height = Math.abs(cy - startY);
    updateSelectionBox(box, left, top, width, height);
    setSelection(nodesInScreenRect(left, top, width, height));
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    box.style.display = 'none';
    activeSelectionBox = null;
    canvasWrapper.classList.remove('selecting');
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function renderNodes() {
  if (!nodesContainer) return;
  nodesContainer.innerHTML = '';

  state.nodes.forEach(node => {
    if (node.inPool) return;

    const nodeEl = document.createElement('div');
    nodeEl.className = 'arpo-node';
    nodeEl.id = `node-${node.id}`;
    nodeEl.classList.add('format-' + normalizeNodeFormat(node.format));
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;

    if (getSelectedNodeIds().includes(node.id)) {
      nodeEl.classList.add('selected');
    }

    const fields = getNodeFields(node);
    const fieldsHtml = fields.map(f => `<div class="node-field">${f}</div>`).join('');
    const hasImage = !!node.image;
    nodeEl.classList.add(hasImage ? 'has-image' : 'no-image');

    const altName = (fields[0] || '').replace(/'/g, '');
    const imgHtml = hasImage
      ? `<img src="${node.image}" alt="${altName}" draggable="false" onerror="this.outerHTML=generateAvatarSvg('${altName}', '${node.color}')">`
      : '';

    nodeEl.innerHTML = `
      <div class="node-actions">
        <button class="node-action-btn connect" title="${typeof t === 'function' ? t('edge.connect') : 'Conectar'}">🔗</button>
        <button class="node-action-btn edit" title="Editar" onclick="event.stopPropagation(); window.editNode('${node.id}')">✎</button>
        <button class="node-action-btn" title="Enviar al banco" onclick="event.stopPropagation(); window.sendToPool('${node.id}')">📥</button>
        <button class="node-action-btn" title="Eliminar" onclick="event.stopPropagation(); window.deleteNode('${node.id}')">🗑</button>
      </div>
      <div class="node-image-box">
        ${hasImage ? imgHtml : `<div class="node-fields inside">${fieldsHtml}</div>`}
      </div>
      ${hasImage && fieldsHtml ? `<div class="node-fields">${fieldsHtml}</div>` : ''}
    `;

    nodeEl.querySelector('.node-action-btn.connect')?.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (typeof window.startNodeConnection === 'function') {
        window.startNodeConnection(node.id, e);
      }
    });

    nodeEl.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('node-action-btn')) return;
      e.stopPropagation();
      startDraggingNode(node, e);
    });

    nodesContainer.appendChild(nodeEl);
  });
}

function startDraggingNode(node, e) {
  const selectedIds = getSelectedNodeIds();
  if (!selectedIds.includes(node.id)) {
    selectNode(node.id);
  } else {
    state.selectedNodeId = node.id;
  }

  const movingIds = getSelectedNodeIds().includes(node.id) ? getSelectedNodeIds() : [node.id];
  const starts = movingIds
    .map(id => state.nodes.find(n => n.id === id))
    .filter(n => n && !n.inPool)
    .map(n => ({ node: n, x: n.x, y: n.y }));
  if (!starts.some(s => s.node.id === node.id)) {
    starts.push({ node, x: node.x, y: node.y });
  }

  const startClientX = e.clientX;
  const startClientY = e.clientY;
  state.draggedNode = node;

  const onMouseMove = (moveEvent) => {
    const dx = (moveEvent.clientX - startClientX) / state.zoom;
    const dy = (moveEvent.clientY - startClientY) / state.zoom;
    starts.forEach(s => {
      s.node.x = s.x + dx;
      s.node.y = s.y + dy;
    });
    renderNodes();
    renderEdges();
    updateTransform();
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    state.draggedNode = null;
    // Solo registra en el historial si realmente se movió
    if (starts.some(s => Math.abs(s.node.x - s.x) > 0.5 || Math.abs(s.node.y - s.y) > 0.5)) {
      saveState();
    }
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}
function createPoolAddButton() {
  const btn = document.createElement('button');
  btn.className = 'btn-add-char';
  btn.id = 'btnAddChar';
  btn.title = t('drawer.addChar');
  btn.textContent = '+';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof openCharacterModal === 'function') {
      openCharacterModal();
    }
  });
  return btn;
}

function renderPool() {
  if (!poolContainer) return;
  poolContainer.innerHTML = '';
  const pooled = state.nodes.filter(n => n.inPool);
  if (pooled.length === 0) {
    poolContainer.innerHTML = `<span class="pool-empty">${t('drawer.empty')}</span>`;
  }
  pooled.forEach(node => {
    const card = document.createElement('div');
    card.className = 'pool-card';
    card.draggable = true;
    card.dataset.nodeId = node.id;

    const fields = getNodeFields(node);
    const fieldsHtml = fields.map((f, i) => `<div class="pool-field${i === 0 ? '' : ' sub'}">${f}</div>`).join('');
    const hasImage = !!node.image;
    const altName = (fields[0] || '').replace(/'/g, '');
    const imgHtml = hasImage
      ? `<img src="${node.image}" alt="${altName}" draggable="false" onerror="this.outerHTML=generateAvatarSvg('${altName}', '${node.color}')">`
      : '';

    card.innerHTML = `
      <div class="pool-card-box${hasImage ? '' : ' no-image'}">
        ${imgHtml}
        <div class="pool-fields">${fieldsHtml}</div>
        <div class="pool-card-actions">
          <button class="pool-action-btn edit" title="${t('char.titleEdit')}">✎</button>
          <button class="pool-action-btn delete" title="${t('char.delete')}">🗑</button>
        </div>
      </div>
    `;

    card.querySelector('.pool-action-btn.edit')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof openCharacterModal === 'function') openCharacterModal(node);
    });
    card.querySelector('.pool-action-btn.delete')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.deleteNode) window.deleteNode(node.id);
    });

    card.addEventListener('click', () => { spawnNodeFromPool(node); });
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'copy';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); });
    poolContainer.appendChild(card);
  });

  // El botón "+" siempre queda a la derecha del último personaje del banco
  poolContainer.appendChild(createPoolAddButton());
}

function spawnNodeFromPool(node) {
  node.inPool = false;
  const format = NODE_FORMATS[normalizeNodeFormat(node.format)];
  const size = getNodeSize();
  node.x = -state.panX / state.zoom + (canvasWrapper.clientWidth / (2 * state.zoom)) - (format.w * size) / 2;
  node.y = -state.panY / state.zoom + (canvasWrapper.clientHeight / (2 * state.zoom)) - (format.h * size) / 2;
  saveState();
  render();
  showToast(t('toast.placed', { name: node.name }));
}
window.sendToPool = function(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (node) {
    node.inPool = true;
    state.edges = state.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    removeFromSelection(nodeId);
    saveState();
    render();
  }
};

function removeFromSelection(nodeId) {
  state.selectedNodeIds = getSelectedNodeIds().filter(id => id !== nodeId);
  if (state.selectedNodeId === nodeId) {
    state.selectedNodeId = state.selectedNodeIds[state.selectedNodeIds.length - 1] || null;
  }
}

window.deleteNode = function(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node) return;
  const ask = typeof getPref !== 'function' || getPref('confirmDelete') !== false;
  const label = node.name || t('char.unnamed');
  if (ask && !confirm(t('confirm.deleteChar', { name: label }))) return;
  state.nodes = state.nodes.filter(n => n.id !== nodeId);
  state.edges = state.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
  removeFromSelection(nodeId);
  saveState();
  render();
  showToast(t('toast.deleted', { name: label }));
};

// Elimina de una vez todos los personajes seleccionados (tecla Supr / menú)
function deleteSelectedNodes() {
  const ids = getSelectedNodeIds();
  const nodes = ids
    .map(id => state.nodes.find(n => n.id === id))
    .filter(Boolean);
  if (!nodes.length) {
    showToast(t('toast.noSelection'));
    return;
  }
  const ask = typeof getPref !== 'function' || getPref('confirmDelete') !== false;
  let ok = true;
  if (ask) {
    ok = nodes.length === 1
      ? confirm(t('confirm.deleteChar', { name: nodes[0].name || t('char.unnamed') }))
      : confirm(t('confirm.deleteMultiple', { count: nodes.length }));
  }
  if (!ok) return;
  const idSet = new Set(nodes.map(n => n.id));
  state.nodes = state.nodes.filter(n => !idSet.has(n.id));
  state.edges = state.edges.filter(e => !idSet.has(e.from) && !idSet.has(e.to));
  clearSelection();
  saveState();
  render();
  if (nodes.length === 1) {
    showToast(t('toast.deleted', { name: nodes[0].name || t('char.unnamed') }));
  } else {
    showToast(t('toast.deletedMany', { count: nodes.length }));
  }
}

function openCharacterModal(node) {
  const modal = document.getElementById('modalCharacter');
  if (!modal) return;
  const title = document.getElementById('modalCharTitle');
  charFields = fieldsFromNode(node);
  renderCharFields();
  editImageData = node ? (node.image || '') : '';
  editImageOriginal = node ? (node.imageOriginal || node.image || '') : '';
  editImageFormat = node ? normalizeNodeFormat(node.format) : 'square';
  updateCharImagePreview();
  if (node) {
    modal.dataset.editId = node.id;
    if (title) title.textContent = t('char.titleEdit');
  } else {
    delete modal.dataset.editId;
    if (title) title.textContent = t('char.titleAdd');
  }
  openModal('modalCharacter');
  setTimeout(() => {
    const first = document.querySelector('#charFieldsList input');
    if (first) {
      first.focus();
      first.select();
    }
  }, 40);
}

window.editNode = function(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (node) openCharacterModal(node);
};

function openModal(modalId) {
  // Cerrar cualquier otro modal abierto para evitar solapamiento
  document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// Cerrar modales al hacer clic fuera del contenido (en el backdrop)
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      if (backdrop.id === 'modalCrop' && typeof closeCropModal === 'function') {
        closeCropModal();
      } else if (backdrop.id === 'modalUnsaved' && typeof cancelUnsavedPrompt === 'function') {
        cancelUnsavedPrompt();
      } else {
        backdrop.classList.remove('active');
      }
    }
  });
});

document.getElementById('btnAddField')?.addEventListener('click', () => {
  charFields.push('');
  renderCharFields();
  const list = document.getElementById('charFieldsList');
  const inputs = list ? list.querySelectorAll('input') : [];
  if (inputs.length) inputs[inputs.length - 1].focus();
});

document.getElementById('btnSaveCharacter')?.addEventListener('click', saveCharacterFromModal);

function saveCharacterFromModal() {
  const fields = charFields.map(f => f.trim()).filter(f => f);
  const name = fields[0] || '';
  const image = editImageData || '';
  if (fields.length === 0 && !image) {
    return alert(t('alert.charEmpty'));
  }
  const modal = document.getElementById('modalCharacter');
  const editId = modal ? modal.dataset.editId || null : null;
  if (editId) {
    const node = state.nodes.find(n => n.id === editId);
    if (node) {
      node.fields = fields;
      node.name = name;
      node.image = image;
      node.imageOriginal = image ? (editImageOriginal || image) : '';
      node.format = editImageFormat;
    }
    delete modal.dataset.editId;
  } else {
    const newNode = {
      id: 'char_' + Date.now(),
      fields: fields,
      name: name,
      image: image,
      imageOriginal: image ? (editImageOriginal || image) : '',
      format: editImageFormat,
      color: '#6366f1',
      x: 0,
      y: 0,
      inPool: true
    };
    state.nodes.push(newNode);
  }
  closeModal('modalCharacter');
  saveState();
  render();
}

// Enter en los campos del personaje guarda directamente
document.getElementById('charFieldsList')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveCharacterFromModal();
  }
});