// ============================================================================
// PREFERENCIAS Y AJUSTES (tema, idioma y comportamiento)
// ============================================================================

const PREFS_KEY = 'arpo-prefs';

const DEFAULT_PREFS = {
  confirmDelete: true,
  autoSave: true,
  exportScale: 2,
  includeNotesInExport: true,
  showNotes: true,
  lineWidth: 'normal',
  nodeSize: 1
};

let prefs = Object.assign({}, DEFAULT_PREFS);

const LINE_WIDTH_PX = { thin: 7, normal: 12, thick: 18 };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) prefs = Object.assign({}, DEFAULT_PREFS, JSON.parse(raw));
  } catch (e) {
    prefs = Object.assign({}, DEFAULT_PREFS);
  }
}

function savePrefs() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    // localStorage no disponible
  }
}

function getPref(key) {
  return Object.prototype.hasOwnProperty.call(prefs, key) ? prefs[key] : DEFAULT_PREFS[key];
}

function setPref(key, value) {
  prefs[key] = value;
  savePrefs();
  updatePrefMenus();
  applyPrefs();
  if (key === 'showNotes' && typeof renderEdges === 'function') renderEdges();
  if (key === 'nodeSize' && typeof render === 'function') render();
  if (key === 'autoSave' && !value && typeof clearAutosaveDraft === 'function') clearAutosaveDraft();
}

// Aplica las preferencias que afectan al lienzo
function applyPrefs() {
  const width = LINE_WIDTH_PX[getPref('lineWidth')] || LINE_WIDTH_PX.normal;
  document.documentElement.style.setProperty('--edge-width', width + 'px');
  const nodeSize = Number(getPref('nodeSize')) || 1;
  document.documentElement.style.setProperty('--node-size', String(nodeSize));
}

// Marca con ✓ las opciones activas
function updatePrefMenus() {
  document.querySelectorAll('[data-pref-toggle]').forEach(btn => {
    const check = btn.querySelector('.menu-check');
    if (check) check.textContent = getPref(btn.dataset.prefToggle) ? '✓' : '';
  });
  document.querySelectorAll('[data-pref-value]').forEach(btn => {
    const check = btn.querySelector('.menu-check');
    if (check) check.textContent = String(getPref(btn.dataset.prefValue)) === btn.dataset.value ? '✓' : '';
  });
}

// Marca con ✓ la opción de tema activa
function updateThemeButtons() {
  const theme = typeof getTheme === 'function' ? getTheme() : 'dark';
  document.querySelectorAll('.theme-option').forEach(btn => {
    const check = btn.querySelector('.menu-check');
    if (check) check.textContent = btn.dataset.themeOption === theme ? '✓' : '';
  });
}

// Marca con ✓ la opción de idioma activa
function updateLanguageButtons() {
  const lang = typeof getLang === 'function' ? getLang() : 'es';
  document.querySelectorAll('.lang-option').forEach(btn => {
    const check = btn.querySelector('.menu-check');
    if (check) check.textContent = btn.dataset.langOption === lang ? '✓' : '';
  });
}

// --- Interacción de los menús ---

document.querySelectorAll('[data-pref-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (typeof closeAllMenus === 'function') closeAllMenus();
    const key = btn.dataset.prefToggle;
    setPref(key, !getPref(key));
  });
});

document.querySelectorAll('[data-pref-value]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (typeof closeAllMenus === 'function') closeAllMenus();
    const key = btn.dataset.prefValue;
    const value = (key === 'exportScale' || key === 'nodeSize') ? Number(btn.dataset.value) : btn.dataset.value;
    setPref(key, value);
  });
});

document.querySelectorAll('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => {
    if (typeof closeAllMenus === 'function') closeAllMenus();
    if (typeof setTheme === 'function') setTheme(btn.dataset.themeOption);
  });
});

document.querySelectorAll('.lang-option').forEach(btn => {
  btn.addEventListener('click', () => {
    if (typeof closeAllMenus === 'function') closeAllMenus();
    if (typeof setLang === 'function') setLang(btn.dataset.langOption);
  });
});

// Estado inicial
loadPrefs();
applyPrefs();
updatePrefMenus();
updateThemeButtons();
updateLanguageButtons();
