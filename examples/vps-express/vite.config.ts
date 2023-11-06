/// <reference types="vavite/vite-config" />

import { defineConfig } from 'vite';
import { angular } from '@nitedani/vite-plugin-angular/plugin';
import vavite from 'vavite';
import ssr from 'vite-plugin-ssr/plugin';
import { readdirSync } from 'fs';
import { join } from 'path';

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
