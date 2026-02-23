"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const electron_log_1 = __importDefault(require("electron-log"));
const electron_context_menu_1 = __importDefault(require("electron-context-menu"));
const electron_store_1 = __importDefault(require("electron-store"));
// Configuration du logging
electron_log_1.default.transports.file.level = 'info';
electron_log_1.default.info('Démarrage du Command Center AlertSec...');
// Menu contextuel
(0, electron_context_menu_1.default)({
    showInspectElement: true,
    labels: {
        copy: 'Copier',
        paste: 'Coller',
        cut: 'Couper'
    }
});
// Persistence
const store = new electron_store_1.default();
// Auto-reload pour le Main Process en DEV
try {
    if (process.env.NODE_ENV === 'development') {
        require('electron-reloader')(module);
    }
}
catch (_) { }
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        show: false,
        autoHideMenuBar: true,
        title: 'AlertSec Command Center',
        backgroundColor: '#121212',
        webPreferences: {
            preload: (0, path_1.join)(__dirname, '../preload/index.js'),
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
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../renderer/index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// Native Notification Bridge
electron_1.ipcMain.handle('show-notification', (event, { title, body }) => {
    new electron_1.Notification({ title, body }).show();
});
// Store Handlers
electron_1.ipcMain.handle('store-get', (event, key) => store.get(key));
electron_1.ipcMain.handle('store-set', (event, key, val) => store.set(key, val));
// Log Bridge
electron_1.ipcMain.on('app-log', (event, msg) => {
    electron_log_1.default.info('[Renderer] ' + msg);
});
