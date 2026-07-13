/**
 * Global test setup.
 *
 * The engine reads its JSON data through `window.electronAPI.loadData()` (Electron IPC).
 * Under Node there is no `window`, so we stand up a shim that serves the real files from
 * `data/` — the tests run against the same data the game ships, not a mock of it.
 *
 * Zustand's persist middleware also expects `localStorage`; an in-memory shim keeps the
 * store quiet and, more importantly, keeps state from leaking between test files.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadCarData, loadEconomyData, loadTraitsData } from '@engine/data';

const DATA_ROOT = path.resolve(__dirname, '../../data');

const electronAPI = {
  loadData: (filePath: string): Promise<unknown> =>
    Promise.resolve(JSON.parse(readFileSync(path.join(DATA_ROOT, filePath), 'utf-8'))),
};

const memoryStorage = (): Storage => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
};

Object.defineProperty(globalThis, 'window', {
  value: { electronAPI, localStorage: memoryStorage() },
  writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage(),
  writable: true,
});

// The data cache is module-level and lazily populated; the accessors (getTraitDefinition,
// getCarDefinition, getEconomyConfig) throw or return undefined until it is filled.
await Promise.all([loadEconomyData(), loadCarData(), loadTraitsData()]);
