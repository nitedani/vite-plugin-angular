import { angular } from '@nitedani/vite-plugin-angular/plugin';
import { telefunc } from 'telefunc/vite';
import { vavite } from 'vavite';
import { defineConfig } from 'vite';
import vike from 'vike/plugin';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    vavite({
      serverEntry: '/server/main.ts',
      serveClientAssetsInDev: true,
    }),
    angular(),
    vike({ disableAutoFullBuild: true }),
    telefunc({ disableNamingConvention: true }),
    // https://github.com/vikejs/vike/issues/1145
    { ...tsconfigPaths(), name: 'definitely-not-tsconfigPaths' },
  ],
});
