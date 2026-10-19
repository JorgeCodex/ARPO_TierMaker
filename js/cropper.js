// ============================================================================
// CROPPER DE IMÁGENES - Flujo del botón "+"
// ============================================================================

let cropState = {
  file: null,
  img: null,
  naturalWidth: 0,
  naturalHeight: 0,
  displayWidth: 0,
  displayHeight: 0,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  minScale: 1,
  maxScale: 8,
  isRound: false,
  isDragging: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0
};

const CROP_SIZE = 400;
const CROP_FRAME = 260;

const viewport = document.getElementById('cropViewport');
const cropImg = document.getElementById('cropImage');
const cropFrame = document.getElementById('cropFrame');
const cropOverlay = document.getElementById('cropOverlay');
const shapeToggle = document.getElementById('cropShapeRound');
const modalCrop = document.getElementById('modalCrop');

let cropAcceptHandler = null;
let cropReturnToEdit = false;

function loadCropImage(url) {
  cropState.img = new Image();
  cropState.img.onload = () => {
    cropState.naturalWidth = cropState.img.naturalWidth || 0;
    cropState.naturalHeight = cropState.img.naturalHeight || 0;
    cropState.scale = 1;
    cropState.offsetX = 0;
    cropState.offsetY = 0;
    cropState.isRound = false;
    if (shapeToggle) shapeToggle.checked = false;
    updateFrameShape();
    cropImg.src = url;
    openCropModal();
  };
  cropState.img.onerror = () => {
    alert(t('alert.loadImage'));
    closeCropModal();
  };
  cropState.img.src = url;
}

// source: File o URL (dataURL / http). onAccept recibe el dataURL recortado.
function startCrop(source, onAccept) {
  cropAcceptHandler = onAccept || applyEditImageFromCrop;
  cropReturnToEdit = true;
  if (source instanceof File) {
    if (!source.type || !source.type.startsWith('image/')) {
      alert(t('alert.invalidImage'));
      return;
    }
    cropState.file = source;
    loadCropImage(URL.createObjectURL(source));
  } else if (typeof source === 'string' && source) {
    cropState.file = null;
    loadCropImage(source);
  }
}

document.getElementById('imgFileInput')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  if (!file.type || !file.type.startsWith('image/')) {
    alert(t('alert.invalidImage'));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const original = reader.result;
    startCrop(original, (cropped) => {
      editImageOriginal = original;
      applyEditImageFromCrop(cropped);
    });
  };
  reader.readAsDataURL(file);
});

function applyEditImageFromCrop(dataUrl) {
  editImageData = dataUrl;
  if (typeof updateCharImagePreview === 'function') updateCharImagePreview();
  closeCropModal();
}

function chooseEditImage() {
  cropReturnToEdit = true;
  document.getElementById('imgFileInput').click();
}

function adjustEditImageZoom() {
  const source = editImageOriginal || editImageData;
  if (!source) {
    chooseEditImage();
    return;
  }
  cropReturnToEdit = true;
  startCrop(source, applyEditImageFromCrop);
}

function removeEditImage() {
  editImageData = '';
  editImageOriginal = '';
  if (typeof updateCharImagePreview === 'function') updateCharImagePreview();
}

document.getElementById('btnCharImageChoose')?.addEventListener('click', chooseEditImage);
document.getElementById('btnCharImageZoom')?.addEventListener('click', adjustEditImageZoom);
document.getElementById('btnCharImageRemove')?.addEventListener('click', removeEditImage);

function openCropModal() {
  document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
  if (modalCrop) modalCrop.classList.add('active');
  setTimeout(() => {
    fitImageToViewport();
  }, 50);
}

function closeCropModal() {
  if (modalCrop) modalCrop.classList.remove('active');
  cropImg.src = '';
  cropState.file = null;
  cropState.img = null;
  if (cropReturnToEdit) {
    cropReturnToEdit = false;
    if (typeof openModal === 'function') openModal('modalCharacter');
  }
}

function fitImageToViewport() {
  if (!cropState.img || !viewport) return;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const iw = cropState.naturalWidth;
  const ih = cropState.naturalHeight;

  if (!iw || !ih) return;

  const coverScale = Math.max(vw / iw, vh / ih);
  cropState.minScale = Math.max(CROP_FRAME / iw, CROP_FRAME / ih);
  cropState.scale = coverScale * 1.2;
  cropState.maxScale = Math.max(cropState.scale * 8, cropState.minScale * 12);

  cropState.displayWidth = iw * cropState.scale;
  cropState.displayHeight = ih * cropState.scale;

  centerImage();
}

function centerImage() {
  if (!cropState.img || !viewport) return;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  cropState.offsetX = (vw - cropState.displayWidth) / 2;
  cropState.offsetY = (vh - cropState.displayHeight) / 2;
  clampOffsets();
  updateImagePosition();
}

function clampOffsets() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const frameX = (vw - CROP_FRAME) / 2;
  const frameY = (vh - CROP_FRAME) / 2;
  const minX = frameX + CROP_FRAME - cropState.displayWidth;
  const minY = frameY + CROP_FRAME - cropState.displayHeight;
  cropState.offsetX = Math.min(frameX, Math.max(minX, cropState.offsetX));
  cropState.offsetY = Math.min(frameY, Math.max(minY, cropState.offsetY));
}

function updateFrameShape() {
  if (!cropFrame || !cropOverlay) return;
  if (cropState.isRound) {
    cropFrame.classList.remove('square');
    cropFrame.classList.add('round');
    cropOverlay.classList.remove('square');
    cropOverlay.classList.add('round');
  } else {
    cropFrame.classList.remove('round');
    cropFrame.classList.add('square');
    cropOverlay.classList.remove('round');
    cropOverlay.classList.add('square');
  }
}

function updateImagePosition() {
  if (!cropImg) return;
  cropImg.style.width = `${cropState.displayWidth}px`;
  cropImg.style.height = `${cropState.displayHeight}px`;
  cropImg.style.transform = `translate(${cropState.offsetX}px, ${cropState.offsetY}px)`;
}

function zoomImage(factor, clientX, clientY) {
  if (!cropState.img || !viewport || !factor) return;
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const rect = viewport.getBoundingClientRect();
  const px = (clientX != null ? clientX : rect.left + vw / 2) - rect.left;
  const py = (clientY != null ? clientY : rect.top + vh / 2) - rect.top;

  const oldScale = cropState.scale;
  let newScale = oldScale * factor;
  newScale = Math.min(cropState.maxScale, Math.max(cropState.minScale, newScale));
  if (newScale === oldScale) return;

  const imgX = (px - cropState.offsetX) / oldScale;
  const imgY = (py - cropState.offsetY) / oldScale;

  cropState.scale = newScale;
  cropState.displayWidth = cropState.naturalWidth * newScale;
  cropState.displayHeight = cropState.naturalHeight * newScale;

  cropState.offsetX = px - imgX * newScale;
  cropState.offsetY = py - imgY * newScale;

  clampOffsets();
  updateImagePosition();
}

// --- Sistema de arrastre con layer dedicado ---

const dragLayer = document.createElement('div');
dragLayer.id = 'cropDragLayer';
dragLayer.style.position = 'absolute';
dragLayer.style.top = '0';
dragLayer.style.left = '0';
dragLayer.style.width = '100%';
dragLayer.style.height = '100%';
dragLayer.style.cursor = 'grab';
dragLayer.style.zIndex = '10';
dragLayer.style.touchAction = 'none';
if (viewport) viewport.appendChild(dragLayer);

dragLayer.addEventListener('mousedown', (e) => {
  cropState.isDragging = true;
  cropState.startX = e.clientX;
  cropState.startY = e.clientY;
  cropState.startOffsetX = cropState.offsetX;
  cropState.startOffsetY = cropState.offsetY;
  dragLayer.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
  if (!cropState.isDragging) return;
  const dx = e.clientX - cropState.startX;
  const dy = e.clientY - cropState.startY;
  cropState.offsetX = cropState.startOffsetX + dx;
  cropState.offsetY = cropState.startOffsetY + dy;
  clampOffsets();
  updateImagePosition();
});

window.addEventListener('mouseup', () => {
  if (cropState.isDragging) {
    cropState.isDragging = false;
    dragLayer.style.cursor = 'grab';
  }
});

// --- Zoom con rueda del ratón ---
if (viewport) {
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomImage(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
  }, { passive: false });
}

document.getElementById('btnZoomIn')?.addEventListener('click', () => zoomImage(1.2));
document.getElementById('btnZoomOut')?.addEventListener('click', () => zoomImage(1 / 1.2));

// --- Función de recorte ---

function cropImage() {
  if (!cropState.img) return null;

  const canvas = document.createElement('canvas');
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);

  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const frameX = (vw - CROP_FRAME) / 2;
  const frameY = (vh - CROP_FRAME) / 2;
  const scaleFactor = cropState.displayWidth > 0 ? cropState.naturalWidth / cropState.displayWidth : 1;

  const sourceX = (frameX - cropState.offsetX) * scaleFactor;
  const sourceY = (frameY - cropState.offsetY) * scaleFactor;
  const sourceW = CROP_FRAME * scaleFactor;
  const sourceH = CROP_FRAME * scaleFactor;

  if (cropState.isRound) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(
    cropState.img,
    sourceX, sourceY, sourceW, sourceH,
    0, 0, CROP_SIZE, CROP_SIZE
  );

  if (cropState.isRound) {
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}

document.getElementById('btnCropAccept')?.addEventListener('click', () => {
  try {
    const dataUrl = cropImage();
    if (!dataUrl) {
      alert(t('alert.cropImage'));
      return;
    }
    const handler = cropAcceptHandler || applyEditImageFromCrop;
    handler(dataUrl);
  } catch (err) {
    console.error('Error al guardar imagen:', err);
      alert(t('alert.addImage') + err.message);
  }
});

window.closeCropModal = closeCropModal;