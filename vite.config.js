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
      output: {
        // Mengatur pola nama file hasil build agar rapi dan mudah di-cache oleh browser/Vercel CDN
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        
        // TEKNIK CHUNKING AUTOMATIC: Memisahkan kode Firebase (node_modules) menjadi file tersendiri
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Menggabungkan semua package firebase ke dalam satu chunk terpisah bernama 'vendor-firebase'
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            return 'vendor'; // Untuk paket npm lain jika ada di masa depan
          }
        }
      }
    },
    // Mengurangi warning jika ukuran file JavaScript sedikit melewati batas default (500kb)
    chunkSizeWarningLimit: 1000,
  },
});