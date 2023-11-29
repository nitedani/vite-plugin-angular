import { defineConfig } from 'vite';
import { angular } from '@nitedani/vite-plugin-angular/plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { vavite } from 'vavite';

export default defineConfig({
  plugins: [
    vavite({
      serverEntry: '/server/main.ts',
      serveClientAssetsInDev: true,
    }),
    angular(),
    tsconfigPaths(),
  ],
});
