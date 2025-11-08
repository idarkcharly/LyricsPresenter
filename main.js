// Lyrics Presenter - main.js

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('./store');
require('@electron/remote/main').initialize();

let controlWindow = null;
let projectionWindow = null;
let isQuitting = false;
const store = new Store(app.getPath('userData'), 'library.json');
const { Menu, dialog } = require("electron");
const fs = require("fs");

function createControlWindow() {
    controlWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#0b1222',
        title: 'Lyrics Presenter — Control',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    controlWindow.loadFile(path.join(__dirname, 'control.html'));
    require('@electron/remote/main').enable(controlWindow.webContents);

    controlWindow.on('closed', () => {
        try {
            if (projectionWindow && !projectionWindow.isDestroyed()) projectionWindow.close();
        } catch (e) { }
        controlWindow = null;
        if (!isQuitting) {
            isQuitting = true;
            app.quit();
        }
    });
}

function createProjectionWindow(displayId = null, options = {}) {
    if (projectionWindow && !projectionWindow.isDestroyed()) {
        projectionWindow.focus();
        return;
    }

    const displays = screen.getAllDisplays();
    let targetDisplay = displayId
        ? displays.find(d => d.id === displayId)
        : screen.getPrimaryDisplay();

    const width = targetDisplay.bounds.width;
    const height = targetDisplay.bounds.height;
    const x = targetDisplay.bounds.x;
    const y = targetDisplay.bounds.y;

    projectionWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        frame: false,
        resizable: false,
        movable: false,
        transparent: false,
        backgroundColor: '#000000',
        fullscreenable: false,
        alwaysOnTop: true,
        title: 'Proyección',
        webPreferences: {
            preload: path.join(__dirname, 'preload-projection.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    projectionWindow.loadFile(path.join(__dirname, 'projection.html'));

    projectionWindow.on('closed', () => {
        projectionWindow = null;
        controlWindow?.webContents.send('projection-closed');
    });
}

app.whenReady().then(() => {
    createControlWindow();
    Menu.setApplicationMenu(null);
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createControlWindow();
    });
});

// Limpieza antes de salir: cerrar ventanas y eliminar listeners para evitar handles abiertos
app.on('before-quit', () => {
    isQuitting = true;
    try { if (projectionWindow && !projectionWindow.isDestroyed()) projectionWindow.close(); } catch (e) { }
    try { if (controlWindow && !controlWindow.isDestroyed()) controlWindow.close(); } catch (e) { }
    // eliminar listeners IPC que puedan mantener el event loop vivo
    try { ipcMain.removeAllListeners(); } catch (e) { }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // forzar cierre en Windows si algo queda colgado
        app.quit();
        setTimeout(() => {
            try { process.exit(0); } catch (e) { }
        }, 250);
    }
});

ipcMain.on('open-projection', (event, displayId, options) => {
    createProjectionWindow(displayId, options);
});

ipcMain.on('close-projection', () => {
    if (projectionWindow) projectionWindow.close();
});

ipcMain.on('to-projection', (event, msg) => {
    if (projectionWindow && !projectionWindow.isDestroyed()) {
        projectionWindow.webContents.send('to-projection', msg);
    }
});

ipcMain.on('projection-request-toggle', () => {
    if (controlWindow && !controlWindow.isDestroyed()) {
        controlWindow.webContents.send('projection-request-toggle');
    }
});

ipcMain.handle('list-displays', () => {
    return screen.getAllDisplays().map(d => ({
        id: d.id,
        bounds: d.bounds,
        size: d.size,
        isPrimary: d.id === screen.getPrimaryDisplay().id
    }));
});

ipcMain.handle('store-get', () => store.get());
ipcMain.handle('store-set', (event, data) => store.set(data));

ipcMain.handle('save-file', async (event, { defaultName, content }) => {
    try {
        const res = await dialog.showSaveDialog({
            title: 'Exportar biblioteca',
            defaultPath: defaultName || 'Biblioteca.json',
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });
        if (res.canceled) return null;
        const filePath = res.filePath;
        fs.writeFileSync(filePath, content, 'utf8');
        return filePath;
    } catch (err) {
        console.error("save-file error:", err);
        throw err;
    }
});