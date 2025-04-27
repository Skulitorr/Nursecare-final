import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            }
        }
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'public/index.html'),
                dashboard: resolve(__dirname, 'public/dashboard.html'),
                patients: resolve(__dirname, 'public/patients.html'),
                staff: resolve(__dirname, 'public/staff.html'),
                inventory: resolve(__dirname, 'public/inventory.html'),
                schedule: resolve(__dirname, 'public/schedule.html'),
                reports: resolve(__dirname, 'public/reports.html'),
                settings: resolve(__dirname, 'public/settings.html'),
                chatbot: resolve(__dirname, 'public/chatbot.html'),
                login: resolve(__dirname, 'public/login.html'),
                unauthorized: resolve(__dirname, 'public/unauthorized.html'),
                notFound: resolve(__dirname, 'public/404.html')
            }
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'public')
        }
    }
});