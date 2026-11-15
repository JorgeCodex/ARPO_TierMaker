if (window.__TAURI__) {
 const invoke = window.__TAURI__.core.invoke;
 window.arpoDesktop = {
  isDesktop: true,
  openProject: () => invoke('open_project'),
  saveProject: (filePath, text) => invoke('save_project', {filePath, text}),
  saveProjectAs: (suggestedName, text) => invoke('save_project_as', {suggestedName, text}),
  minimize: () => invoke('minimize'), toggleMaximize: () => invoke('toggle_maximize'),
  isMaximized: () => invoke('is_maximized'), close: () => invoke('close_window'),
  onMaximizedChange: callback => { const update = () => invoke('is_maximized').then(callback).catch(() => {}); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }
 };
 document.addEventListener('DOMContentLoaded', () => document.querySelector('header')?.addEventListener('mousedown', e => { if (e.button === 0 && e.detail === 1 && !e.target.closest('button, input, .menubar, .window-controls')) invoke('drag_window').catch(() => {}); }));
}
