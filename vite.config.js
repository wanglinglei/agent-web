import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
export default defineConfig({
    plugins: [vue(), UnoCSS()],
    server: {
        proxy: {
            '/ai-agent': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
