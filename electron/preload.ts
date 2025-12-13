import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  loadData: (filePath: string) => Promise<unknown>;
  saveGame: (saveId: string, data: string) => Promise<boolean>;
  loadGame: (saveId: string) => Promise<unknown>;
  listSaves: () => Promise<string[]>;
  deleteSave: (saveId: string) => Promise<boolean>;
}

const electronAPI: ElectronAPI = {
  loadData: (filePath: string) => ipcRenderer.invoke('load-data', filePath),
  saveGame: (saveId: string, data: string) => ipcRenderer.invoke('save-game', saveId, data),
  loadGame: (saveId: string) => ipcRenderer.invoke('load-game', saveId),
  listSaves: () => ipcRenderer.invoke('list-saves'),
  deleteSave: (saveId: string) => ipcRenderer.invoke('delete-save', saveId),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
