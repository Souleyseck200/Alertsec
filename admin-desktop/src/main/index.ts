import { app, BrowserWindow, ipcMain, Notification } from 'electron';
import { join } from 'path';
import log from 'electron-log';
import contextMenu from 'electron-context-menu';
import Store from 'electron-store';

// Configuration du logging
log.transports.file.level = 'info';
log.info('Démarrage du Command Center AlertSec...');

// Menu contextuel
contextMenu({
  showInspectElement: true,
  labels: {
    copy: 'Copier',
    paste: 'Coller',
    cut: 'Couper'
  }
});

// Persistence
const store = new Store();

// Auto-reload pour le Main Process en DEV
try {
  if (process.env.NODE_ENV === 'development') {
    require('electron-reloader')(module);
  }
} catch (_) {}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    title: 'AlertSec Command Center',
    backgroundColor: '#121212',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Native Notification Bridge
ipcMain.handle('show-notification', (event, { title, body }) => {
  new Notification({ title, body }).show();
});

// Store Handlers
ipcMain.handle('store-get', (event, key) => store.get(key));
ipcMain.handle('store-set', (event, key, val) => store.set(key, val));

// Log Bridge
ipcMain.on('app-log', (event, msg) => {
  log.info('[Renderer] ' + msg);
});
