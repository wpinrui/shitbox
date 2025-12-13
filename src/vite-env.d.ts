/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Electron API exposed via preload script
interface ElectronAPI {
  loadData: (filePath: string) => Promise<unknown>;
  saveGame: (saveId: string, data: string) => Promise<boolean>;
  loadGame: (saveId: string) => Promise<unknown>;
  listSaves: () => Promise<string[]>;
  deleteSave: (saveId: string) => Promise<boolean>;
  quitApp: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
