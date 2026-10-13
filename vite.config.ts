import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import {
  resolveApiBaseUrl,
  resolveFrontendOrigin,
} from './src/app/core/config/origins.ts';

function pwaBuildPlugin(buildId: string): Plugin {
  let projectRoot = '';
  return {
    name: 'retreat-pwa-release',
    apply: 'build',
    configResolved(config) {
      projectRoot = config.root;
    },
    writeBundle(output) {
      if (!output.dir) {
        throw new Error('The PWA build requires an output directory.');
      }
      const source = readFileSync(
        resolve(projectRoot, 'public/service-worker.js'),
        'utf8',
      );
      writeFileSync(
        resolve(output.dir, 'service-worker.js'),
        source.replaceAll('__PWA_BUILD_ID__', buildId),
      );
    },
  };
}

export default defineConfig(({ command, mode }) => {
  // A fresh ID makes every built release visible to both the app and its worker.
  const buildId = command === 'build' ? randomUUID() : 'development';
  if (command === 'build') {
    const environment = loadEnv(mode, process.cwd(), 'VITE_');
    resolveApiBaseUrl(environment.VITE_API_BASE_URL, false);
    resolveFrontendOrigin(environment.VITE_FRONTEND_URL, false);
  }

  return {
    plugins: [react(), pwaBuildPlugin(buildId)],
    define: { __APP_BUILD_ID__: JSON.stringify(buildId) },
    server: { port: 5175, strictPort: true },
    preview: { port: 5175, strictPort: true },
  };
});
