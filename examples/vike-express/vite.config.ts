import { angular } from '@vikejs/vite-plugin-angular/plugin';
import { vavite } from 'vavite';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';

export default defineConfig({
  resolve: {
    alias: {
      '#root': __dirname,
    },
  },
  plugins: [
    vavite({
      serverEntry: '/server/main.ts',
      serveClientAssetsInDev: true,
    }),
    angular(),
    vike(),
  ],
});
