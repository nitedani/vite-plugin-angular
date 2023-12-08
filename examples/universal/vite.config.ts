import { defineConfig } from 'vite';
import { angular } from '@nitedani/vite-plugin-angular/plugin';
import tsconfigPaths from 'vite-tsconfig-paths';
import { vavite } from 'vavite';

export default defineConfig({
  plugins: [
    angular({ swc: true }),
    vavite({
      serverEntry: '/server/main.ts',
      serveClientAssetsInDev: true,
    }),
    tsconfigPaths(),
  ],
});
