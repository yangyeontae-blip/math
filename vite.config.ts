import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  server: { allowedHosts: ['terminal.local'] },
  base: './',
  resolve: { alias: [{find: /^onnxruntime-web\/wasm$/, replacement:fileURLToPath(new URL('./node_modules/onnxruntime-web/dist/ort.wasm.min.mjs',import.meta.url))}] },
  worker: { format:'es' },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
});
