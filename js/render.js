// ============================================================================
// Centro del recuadro de un personaje (usado para anclar las flechas)
function getNodeCenter(node) {
  const el = document.getElementById('node-' + node.id);
  const box = el ? el.querySelector('.node-image-box') : null;
  const height = box ? box.offsetHeight : 175;
  const top = box ? box.offsetTop : 0;
  return { x: node.x + 87.5, y: node.y + top + height / 2 };
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

  // 1) Líneas continuas con patrón de flechitas internas (marker-mid)
  segments.forEach(s => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', buildEdgePath(s.x1, s.y1, s.x2, s.y2));
    path.setAttribute('class', `arpo-edge edge-${s.edge.type}`);
    path.setAttribute('id', `edge-${s.edge.id}`);
    path.setAttribute('marker-mid', `url(#arrow-${s.edge.type})`);
    path.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.openEdgeModal) window.openEdgeModal(s.edge);
    });
    edgesGroup.appendChild(path);
  });

  // 2) Etiquetas (nota)
  segments.forEach(s => {
    if (!s.edge.note || !s.edge.note.trim()) return;
    const midX = (s.x1 + s.x2) / 2;
    const midY = (s.y1 + s.y2) / 2;
    const labelG = document.createElementNS(SVG_NS, 'g');
    labelG.setAttribute('class', 'edge-label-group');
    labelG.setAttribute('transform', `translate(${midX - 40}, ${midY - 10})`);
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('class', 'edge-label-bg');
    rect.setAttribute('width', '80');
    rect.setAttribute('height', '16');
    rect.setAttribute('rx', '3');
    rect.setAttribute('ry', '3');
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('class', 'edge-label');
    text.setAttribute('x', '40');
    text.setAttribute('y', '12');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = s.edge.note;
    labelG.appendChild(rect);
    labelG.appendChild(text);
    edgesGroup.appendChild(labelG);
  });
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

function updateCharImagePreview() {
  const previewImg = document.getElementById('charImagePreview');
  const empty = document.getElementById('charImageEmpty');
  if (!previewImg || !empty) return;
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

function renderNodes() {
  if (!nodesContainer) return;
  nodesContainer.innerHTML = '';

  state.nodes.forEach(node => {
    if (node.inPool) return;

    const nodeEl = document.createElement('div');
    nodeEl.className = 'arpo-node';
    nodeEl.id = `node-${node.id}`;
    nodeEl.style.left = `${node.x}px`;
    nodeEl.style.top = `${node.y}px`;

    if (state.selectedNodeId === node.id) {
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
        <button class="node-action-btn edit" title="Editar" onclick="event.stopPropagation(); window.editNode('${node.id}')">✎</button>
        <button class="node-action-btn" title="Enviar al banco" onclick="event.stopPropagation(); window.sendToPool('${node.id}')">📥</button>
        <button class="node-action-btn" title="Eliminar" onclick="event.stopPropagation(); window.deleteNode('${node.id}')">🗑</button>
      </div>
      <div class="node-image-box">
        ${hasImage ? imgHtml : `<div class="node-fields inside">${fieldsHtml}</div>`}
      </div>
      ${hasImage && fieldsHtml ? `<div class="node-fields">${fieldsHtml}</div>` : ''}
      <div class="node-handles">
        <div class="handle-point handle-top" title="Receptor (Inferior)" data-handle="in" data-id="${node.id}"></div>
        <div class="handle-point handle-bottom" title="Emisor (Superior)" data-handle="out" data-id="${node.id}"></div>
      </div>
    `;

    nodeEl.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('handle-point') || e.target.classList.contains('node-action-btn')) return;
      e.stopPropagation();
      startDraggingNode(node, e);
    });

    nodesContainer.appendChild(nodeEl);
  });
}

function startDraggingNode(node, e) {
  state.draggedNode = node;
  state.dragOffsetX = (e.clientX - state.panX) / state.zoom - node.x;
  state.dragOffsetY = (e.clientY - state.panY) / state.zoom - node.y;

  const onMouseMove = (moveEvent) => {
    node.x = (moveEvent.clientX - state.panX) / state.zoom - state.dragOffsetX;
    node.y = (moveEvent.clientY - state.panY) / state.zoom - state.dragOffsetY;
    renderNodes();
    renderEdges();
    updateTransform();
  };

  const onMouseUp = () => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    state.draggedNode = null;
    saveState();
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}
function renderPool() {
  if (!poolContainer) return;
  poolContainer.innerHTML = '';
  const pooled = state.nodes.filter(n => n.inPool);
  if (pooled.length === 0) {
    poolContainer.innerHTML = `<span class="pool-empty">${t('drawer.empty')}</span>`;
    return;
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
      </div>
    `;

    card.addEventListener('click', () => { spawnNodeFromPool(node); });
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', node.id);
      e.dataTransfer.effectAllowed = 'copy';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); });
    poolContainer.appendChild(card);
  });
}

function spawnNodeFromPool(node) {
  node.inPool = false;
  node.x = -state.panX / state.zoom + (canvasWrapper.clientWidth / (2 * state.zoom)) - 87.5;
  node.y = -state.panY / state.zoom + (canvasWrapper.clientHeight / (2 * state.zoom)) - 87.5;
  saveState();
  render();
  showToast(t('toast.placed', { name: node.name }));
}
window.sendToPool = function(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (node) {
    node.inPool = true;
    state.edges = state.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
    state.selectedNodeId = null;
    saveState();
    render();
  }
};

window.deleteNode = function(nodeId) {
  const node = state.nodes.find(n => n.id === nodeId);
  if (!node) return;
  if (!confirm(t('confirm.deleteChar', { name: node.name }))) return;
  state.nodes = state.nodes.filter(n => n.id !== nodeId);
  state.edges = state.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
  state.selectedNodeId = null;
  saveState();
  render();
  showToast(t('toast.deleted', { name: node.name }));
};

function openCharacterModal(node) {
  const modal = document.getElementById('modalCharacter');
  if (!modal) return;
  const title = document.getElementById('modalCharTitle');
  charFields = fieldsFromNode(node);
  renderCharFields();
  editImageData = node ? (node.image || '') : '';
  editImageOriginal = node ? (node.imageOriginal || node.image || '') : '';
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
    }
    delete modal.dataset.editId;
  } else {
    const newNode = {
      id: 'char_' + Date.now(),
      fields: fields,
      name: name,
      image: image,
      imageOriginal: image ? (editImageOriginal || image) : '',
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