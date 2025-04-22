import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        allowedHosts: ['renoxpert.my', 'staging.renoxpert.my'],
        watch: {
            ignored: ['**/.git/**'], // Ignore all files in .git directory
        },
        proxy: {
            '/invoice': {
                target: 'http://localhost:5173',
                changeOrigin: true,
                rewrite: (path) => '/index.html'
            }
        }
    },
})
