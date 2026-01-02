import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3005,
      host: '0.0.0.0',
      strictPort: true
    },
    plugins: [react()],
    define: {
      'process.env': {
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY),
        NODE_ENV: JSON.stringify(mode)
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
      }
    };
});
