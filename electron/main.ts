import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file system operations
ipcMain.handle('load-data', async (_event, filePath: string) => {
  try {
    const dataPath = isDev
      ? path.join(process.cwd(), 'data', filePath)
      : path.join(process.resourcesPath, 'data', filePath);

    const content = await fs.promises.readFile(dataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load data file: ${filePath}`, error);
    throw error;
  }
});

ipcMain.handle('save-game', async (_event, saveId: string, data: string) => {
  try {
    const savesDir = isDev
      ? path.join(process.cwd(), 'saves')
      : path.join(app.getPath('userData'), 'saves');

    await fs.promises.mkdir(savesDir, { recursive: true });
    await fs.promises.writeFile(path.join(savesDir, `${saveId}.json`), data, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Failed to save game: ${saveId}`, error);
    throw error;
  }
});

ipcMain.handle('load-game', async (_event, saveId: string) => {
  try {
    const savesDir = isDev
      ? path.join(process.cwd(), 'saves')
      : path.join(app.getPath('userData'), 'saves');

    const content = await fs.promises.readFile(path.join(savesDir, `${saveId}.json`), 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load game: ${saveId}`, error);
    throw error;
  }
});

ipcMain.handle('list-saves', async () => {
  try {
    const savesDir = isDev
      ? path.join(process.cwd(), 'saves')
      : path.join(app.getPath('userData'), 'saves');

    await fs.promises.mkdir(savesDir, { recursive: true });
    const files = await fs.promises.readdir(savesDir);
    return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
  } catch (error) {
    console.error('Failed to list saves', error);
    return [];
  }
});

ipcMain.handle('delete-save', async (_event, saveId: string) => {
  try {
    const savesDir = isDev
      ? path.join(process.cwd(), 'saves')
      : path.join(app.getPath('userData'), 'saves');

    await fs.promises.unlink(path.join(savesDir, `${saveId}.json`));
    return true;
  } catch (error) {
    console.error(`Failed to delete save: ${saveId}`, error);
    throw error;
  }
});
