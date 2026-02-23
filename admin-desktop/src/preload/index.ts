import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  sendNotification: (title: string, body: string) => 
    ipcRenderer.invoke('show-notification', { title, body }),
  onSOS: (callback: any) => 
    ipcRenderer.on('sos-received', (_event, value) => callback(value)),
  // Persistence
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, val: any) => ipcRenderer.invoke('store-set', key, val),
  },
  // Logging
  log: (msg: string) => ipcRenderer.send('app-log', msg),
});
