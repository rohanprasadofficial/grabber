import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [
    react({
      // Force Babel to handle JSX (not esbuild) so _debugSource is populated
      // on React fibers. Babel's automatic runtime in dev mode injects
      // jsxDEV() calls which include __source and __self props.
      jsxImportSource: 'react',
      babel: {},
    }),
  ],
  esbuild: {
    jsx: 'preserve',
  },
  resolve: {
    alias: {
      '@grabber/sdk': path.resolve(__dirname, '../packages/sdk/src/index.ts'),
    },
  },
  server: {
    port: 3333,
    open: true,
  },
});
