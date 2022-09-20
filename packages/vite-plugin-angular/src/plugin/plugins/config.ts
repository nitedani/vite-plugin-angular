import { join } from 'path';
import { cwd } from 'process';
import { Plugin } from 'vite';

export const CommonPlugin = (): Plugin => {
  return {
    name: 'vite-plugin-angular-common',
    enforce: 'pre',
    config(config, env) {
      return {
        ssr: {
          external: ['reflect-metadata', 'xhr2'],
          noExternal: [
            /@nitedani\/vite-plugin-angular/,
            /@nitedani\/vite-plugin-ssr-adapter/,
            /@nitedani\/angular-renderer-core/,
            /@nitedani\/angular-renderer-express/,
            /@nitedani\/angular-renderer-nestjs/,
          ],
        },
        build: {
          outDir: env.ssrBuild ? 'dist/server' : 'dist/client',
          rollupOptions: {
            external: ['xhr2'],
            output: {
              manualChunks: id => {
                const runtime1 = [
                  '@nitedani/vite-plugin-angular/client',
                  '@angular',
                  "zone.js",
                ];
                if (runtime1.some(s => id.includes(s))) {
                  return 'runtime1';
                }
              },
            },
          },
        },
        resolve: {
          alias: [
            {
              find: /~/,
              replacement: join(cwd(), 'node_modules') + '/',
            },
          ],
        },
      };
    },
  };
};