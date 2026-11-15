// ============================================================================
// TEMA (claro / oscuro)
// ============================================================================

const THEME_STORAGE_KEY = 'arpo-theme';

function getTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (typeof updateThemeButtons === 'function') updateThemeButtons();
}

function setTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // localStorage no disponible
  }
  applyTheme(theme);
}

function toggleTheme() {
  setTheme(getTheme() === 'light' ? 'dark' : 'light');
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_STORAGE_KEY);
  } catch (e) {
    // localStorage no disponible
  }
  applyTheme(saved === 'light' ? 'light' : 'dark');
}

initTheme();
