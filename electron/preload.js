const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  selectZipFile: () => ipcRenderer.invoke('select-zip-file'),
  saveFile: (filename, content) => ipcRenderer.invoke('save-file', { filename, content }),
  getDownloadsPath: () => ipcRenderer.invoke('get-downloads-path')
});
