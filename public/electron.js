const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

async function createWindow() {
  const isDev = (await import('electron-is-dev')).default;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // --- solve the problem of the application not exiting completely ---
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const isDev = (await import('electron-is-dev')).default;
  createWindow();

  // --- solve the problem of the asarUnpack path ---
  const assetsPath = isDev
    ? path.join(__dirname, 'assets')
    // In production, the 'assets' directory is expected to be at the same level as the executable.
    // We get the directory of the executable and then join it with 'assets'.
    : path.join(path.dirname(app.getPath('exe')), 'assets');

  ipcMain.handle('read-file', (event, filePath) => {
    const fullPath = path.join(assetsPath, filePath);
    return fs.promises.readFile(fullPath, 'utf8');
  });

  ipcMain.handle('read-file-as-buffer', (event, filePath) => {
    const fullPath = path.join(assetsPath, filePath);
    return fs.promises.readFile(fullPath);
  });

  ipcMain.handle('get-assets-path', () => assetsPath);
});

// --- solve the problem of the application not exiting completely ---
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});