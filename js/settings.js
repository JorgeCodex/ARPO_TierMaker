// ============================================================================
// AJUSTES (tema, idioma, atajos, información)
// ============================================================================

function updateThemeButtons() {
  const group = document.getElementById('themeSegmented');
  if (!group) return;
  const theme = typeof getTheme === 'function' ? getTheme() : 'dark';
  group.querySelectorAll('.segmented-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeValue === theme);
  });
}

function updateLanguageButtons() {
  const group = document.getElementById('langSegmented');
  if (!group) return;
  const lang = typeof getLang === 'function' ? getLang() : 'es';
  group.querySelectorAll('.segmented-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.langValue === lang);
  });
}

function openSettings() {
  updateThemeButtons();
  updateLanguageButtons();
  if (typeof openModal === 'function') openModal('modalSettings');
}

document.getElementById('btnSettings')?.addEventListener('click', openSettings);

document.getElementById('themeSegmented')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.segmented-btn');
  if (!btn) return;
  if (typeof setTheme === 'function') setTheme(btn.dataset.themeValue);
  updateThemeButtons();
});

document.getElementById('langSegmented')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.segmented-btn');
  if (!btn) return;
  if (typeof setLang === 'function') setLang(btn.dataset.langValue);
  updateLanguageButtons();
});

// Estado inicial de los botones
updateThemeButtons();
updateLanguageButtons();

window.openSettings = openSettings;
