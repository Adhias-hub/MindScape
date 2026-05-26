import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'home.html'),
        focus: resolve(__dirname, 'focus.html'),
        todo: resolve(__dirname, 'todo.html'),
        wellness: resolve(__dirname, 'wellness.html'),
        jadwal: resolve(__dirname, 'jadwal.html'),
      },
    },
  },
});