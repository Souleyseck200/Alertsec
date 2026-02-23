"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electron', {
    sendNotification: (title, body) => electron_1.ipcRenderer.invoke('show-notification', { title, body }),
    onSOS: (callback) => electron_1.ipcRenderer.on('sos-received', (_event, value) => callback(value)),
    // Persistence
    store: {
        get: (key) => electron_1.ipcRenderer.invoke('store-get', key),
        set: (key, val) => electron_1.ipcRenderer.invoke('store-set', key, val),
    },
    // Logging
    log: (msg) => electron_1.ipcRenderer.send('app-log', msg),
});
