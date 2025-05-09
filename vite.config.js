import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
	return {
		build: {
			outDir: 'build',
			rollupOptions: {
				external: '/const.js',
			}
		},
		plugins: [react()],
	};
});