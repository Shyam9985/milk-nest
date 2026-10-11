import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/*
 * Vite replaces react-scripts (create-react-app, unmaintained since 2022).
 * Tailwind/PostCSS are untouched - vite picks up postcss.config.js on its own.
 */
export default defineConfig({
    plugins: [react()],

    server: {
        // NOT vite's default 5173: the api only allows origins localhost:3000 and :5000
        // (allowedOrigins in node.js), so any other port fails every request on CORS
        port: 3000
    },

    build: {
        // keeps the folder name CRA used, which .gitignore already ignores
        outDir: 'build'
    },

    test: {
        environment: 'jsdom',
        globals: true,                      // describe/it/expect without importing them
        setupFiles: './src/setupTests.js'
    }
});
