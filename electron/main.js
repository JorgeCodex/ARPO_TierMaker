const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');

if (process.env.PORTABLE_EXECUTABLE_DIR || process.env.PORTABLE_EXECUTABLE_FILE) {
  app.commandLine.appendSwitch('no-sandbox');
}

const APP_ID = 'com.arpo.tiermaker';
const PROJECT_FILTERS = [
  { name: 'Plantilla A.R.P.O.', extensions: ['json'] }
];

app.setName('ARPO TierMaker');
const userDataDir = process.env.ARPO_USER_DATA || path.join(app.getPath('appData'), 'ARPO TierMaker');
try {
  fsSync.mkdirSync(userDataDir, { recursive: true });
} catch (err) {
  console.error('No se pudo crear la carpeta de datos:', err.message);
}
app.setPath('userData', userDataDir);

let mainWindow = null;

function projectOwner(event) {
  return BrowserWindow.fromWebContents(event.sender) || mainWindow;
}

function ensureJsonExtension(filePath) {
  return path.extname(filePath) ? filePath : filePath + '.json';
}

async function writeProjectFile(filePath, text) {
  await fs.writeFile(filePath, text, 'utf8');
  return {
    ok: true,
    filePath,
    fileName: path.basename(filePath)
  };
}

function registerIpc() {
  ipcMain.handle('project:open', async (event) => {
    const owner = projectOwner(event);
    const result = await dialog.showOpenDialog(owner, {
      title: 'Abrir plantilla A.R.P.O.',
      filters: PROJECT_FILTERS,
      properties: ['openFile']
    });
    if (result.canceled || !result.filePaths.length) {
      return { canceled: true };
    }
    const filePath = result.filePaths[0];
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      return {
        canceled: false,
        ok: true,
        filePath,
        fileName: path.basename(filePath),
        text: raw.replace(/^\uFEFF/, '')
      };
    } catch (err) {
      return { canceled: false, ok: false, error: err.message };
    }
  });

  ipcMain.handle('project:save', async (event, payload) => {
    const filePath = payload && payload.filePath;
    const text = payload && payload.text;
    if (typeof filePath !== 'string' || !filePath || typeof text !== 'string') {
      return { ok: false, error: 'Ruta o contenido inválido' };
    }
    try {
      return await writeProjectFile(filePath, text);
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('project:save-as', async (event, payload) => {
    const owner = projectOwner(event);
    const suggestedName = (payload && payload.suggestedName) || 'tierlist.arpo.json';
    const text = payload && payload.text;
    if (typeof text !== 'string') {
      return { canceled: false, ok: false, error: 'Contenido inválido' };
    }
    const result = await dialog.showSaveDialog(owner, {
      title: 'Guardar plantilla A.R.P.O.',
      defaultPath: path.join(app.getPath('documents'), path.basename(suggestedName)),
      filters: PROJECT_FILTERS,
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });
    if (result.canceled || !result.filePath) {
      return { canceled: true };
    }
    const filePath = ensureJsonExtension(result.filePath);
    try {
      return await writeProjectFile(filePath, text);
    } catch (err) {
      return { canceled: false, ok: false, error: err.message };
    }
  });

  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.handle('window:toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
    return win.isMaximized();
  });

  ipcMain.handle('window:is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return win ? win.isMaximized() : false;
  });

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0b0f19',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    frame: false,
    thickFrame: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  mainWindow = win;
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.once('ready-to-show', () => win.show());

  win.on('maximize', () => {
    win.webContents.send('window:maximized-changed', true);
  });

  win.on('unmaximize', () => {
    win.webContents.send('window:maximized-changed', false);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) event.preventDefault();
  });

  win.webContents.on('did-fail-load', (event, code, description, url) => {
    console.error('No se pudo cargar la interfaz:', code, description, url);
  });

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId(APP_ID);
  Menu.setApplicationMenu(null);
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
