/// <reference types="vavite/vite-config" />

import { defineConfig } from 'vite';
import { angular } from '@nitedani/vite-plugin-angular/plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import vavite from 'vavite';
import ssr from 'vite-plugin-ssr/plugin';

export default defineConfig({
  buildSteps: [
    {
      name: 'client',
    },
    {
      name: 'server',
      config: {
        build: {
          ssr: true,
        },
      },
    },
  ],
  plugins: [
    vavite({
      serverEntry: '/server/main.ts',
      serveClientAssetsInDev: true,
    }),
    angular(),
    ssr({ disableAutoFullBuild: true }),
    tsconfigPaths(),
  ],
});
