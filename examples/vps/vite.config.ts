/// <reference types="vavite/vite-config" />

import { angular } from '@nitedani/vite-plugin-angular/plugin';
import { readdirSync } from 'fs';
import { join } from 'path';
import vavite from 'vavite';
import { defineConfig } from 'vite';
import ssr from 'vite-plugin-ssr/plugin';

const absolutePathAliases = readdirSync(__dirname, {
  withFileTypes: true,
}).reduce((acc, curr) => {
  const dir = curr.name.replace(/\.tsx?/, '');
  acc[dir] = join(__dirname, dir);
  return acc;
});

export default defineConfig({
  resolve: {
    alias: {
      ...absolutePathAliases,
    },
  },
  plugins: [
    vavite({
      serverEntry: '/server/main.ts',
      serveClientAssetsInDev: true,
    }),
    angular(),
    ssr({ disableAutoFullBuild: true }),
  ],
});
