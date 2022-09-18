import { join } from 'path';
import { cwd } from 'process';
import { Plugin } from 'vite';
import { swcTransform } from './swc/transform.js';

export const DevelopmentPlugin = (): Plugin => {
  return {
    name: 'vite-plugin-angular-dev',
    enforce: 'pre',
    apply: 'serve',
    async config(_userConfig, env) {
      return {
        esbuild: false,
        ssr: {
          external: ['reflect-metadata', 'xhr2'],
          noExternal: [/@nitedani\/vite-plugin-angular/],
        },
        build: {
          rollupOptions: {
            external: ['xhr2'],
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
    configureServer(server) {
      return;
    },
    buildStart(options) {
      return;
    },
    handleHotUpdate(ctx) {
      return;
    },
    configResolved(config) {},
    transform(code, id) {
      // Run everything else through SWC
      // On the server, we need decorator metadata,
      // @analogjs/vite-plugin-angular uses esbuild, but esbuild doesn't support decorator metadata
      return swcTransform({
        code,
        id,
        isSsr: false,
        isProduction: false,
      });
    },
  };
};
