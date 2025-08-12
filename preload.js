const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stickyAPI', {
  onCreateNewNote: (callback) => ipcRenderer.on('create-new-note', callback)
});
