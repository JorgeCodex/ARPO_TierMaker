const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('arpoDesktop', {
  isElectron: true,
  openProject: () => ipcRenderer.invoke('project:open'),
  saveProject: (filePath, text) => ipcRenderer.invoke('project:save', { filePath, text }),
  saveProjectAs: (suggestedName, text) => ipcRenderer.invoke('project:save-as', { suggestedName, text }),
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  close: () => ipcRenderer.send('window:close'),
  onMaximizedChange: (callback) => {
    if (typeof callback !== 'function') return () => {};
    const listener = (_event, value) => callback(!!value);
    ipcRenderer.on('window:maximized-changed', listener);
    return () => ipcRenderer.removeListener('window:maximized-changed', listener);
  }
});
