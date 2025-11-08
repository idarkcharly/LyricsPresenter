// preload-projection.js
// Este archivo expone una API segura para la ventana de proyección.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    onToProjection: (cb) => ipcRenderer.on('to-projection', (event, msg) => cb(msg)),
    sendToProjection: (msg) => ipcRenderer.send('projection-request-toggle', msg),
});
