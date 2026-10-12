import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import {
  resolveApiBaseUrl,
  resolveFrontendOrigin,
} from './src/app/core/config/origins';

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const environment = loadEnv(mode, process.cwd(), 'VITE_');
    resolveApiBaseUrl(environment.VITE_API_BASE_URL, false);
    resolveFrontendOrigin(environment.VITE_FRONTEND_URL, false);
  }

  return {
    plugins: [react()],
    server: { port: 5175, strictPort: true },
    preview: { port: 5175, strictPort: true },
  };
});
