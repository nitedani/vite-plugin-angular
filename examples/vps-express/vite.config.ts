/// <reference types="vavite/vite-config" />

import { defineConfig } from 'vite';
import { angular } from '@nitedani/vite-plugin-angular/plugin';
import vavite from 'vavite';
import ssr from 'vite-plugin-ssr/plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    vavite({
      serverEntry: '/server/main.ts',
      serveClientAssetsInDev: true,
    }),
    angular(),
    ssr({ disableAutoFullBuild: true }),
    // https://github.com/vikejs/vike/issues/1145
    { ...tsconfigPaths(), name: 'definitely-not-tsconfigPaths' },
  ],
});
