// preload-control.js
// Este archivo expone una API segura para la ventana de control.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    // Obtener la biblioteca de canciones guardada
    storeGet: () => ipcRenderer.invoke("store-get"),
    // Guardar la biblioteca de canciones
    storeSet: (data) => ipcRenderer.invoke("store-set", data),
    // Obtener la lista de monitores conectados
    listDisplays: () => ipcRenderer.invoke("list-displays"),
    // Obtener la fuente de captura de la ventana de proyección
    getProjectionSource: () => ipcRenderer.invoke("get-projection-source"),
    // Abrir la ventana de proyección en el monitor seleccionado
    openProjection: (displayId) => ipcRenderer.send("open-projection", displayId),
    // Cerrar la ventana de proyección
    closeProjection: () => ipcRenderer.send("close-projection"),
    // Enviar mensajes a la proyección (línea, fondo, animación, etc)
    sendToProjection: (msg) => ipcRenderer.send("to-projection", msg),
    // Recibe aviso cuando la proyección se cierra
    onProjectionClosed: (cb) => ipcRenderer.on("projection-closed", cb),
    // Recibe mensajes desde la proyección (por ejemplo, ESC presionado)
    onFromProjectionRequestToggle: (cb) => ipcRenderer.on("projection-request-toggle", cb),

    // Guarda un archivo usando el diálogo nativo (main.js hace el trabajo)
    saveFile: (defaultName, content, title) => ipcRenderer.invoke("save-file", { defaultName, content, title })
});
