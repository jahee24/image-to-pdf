import { defineConfig } from 'vite';

export default defineConfig({
    // If you deploy to github pages at username.github.io/repo-name/
    // base: '/image_to_pdf/', 
    // For custom domain img2pdf-free.com, use '/'
    base: '/',
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: './index.html',
                privacy: './privacy-policy.html',
                terms: './terms-of-service.html',
            },
        },
    },
});
