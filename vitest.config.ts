import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Test config is deliberately separate from vite.config.ts: that config loads the
 * Electron plugins, which would try to build the Electron main/preload bundles on
 * every test run. Tests only need the path aliases.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@store': path.resolve(__dirname, './src/store'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@data': path.resolve(__dirname, './data'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
